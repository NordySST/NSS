// Motor de simulação: escalação, partidas e temporadas
const Engine = {
  slotPos(formation, i) {
    const f = FORMATIONS[formation];
    if (i === 0) return 'GOL';
    if (i <= f.DEF) return 'DEF';
    if (i <= f.DEF + f.MEI) return 'MEI';
    return 'ATA';
  },

  available(w, pid) {
    const p = w.players[pid];
    return p && p.injury <= 0 && !p.suspended;
  },

  // Escolhe os 11 melhores para a formação e o banco (7)
  autoLineup(w, team, formation) {
    formation = formation || team.formation;
    const f = FORMATIONS[formation];
    const need = { GOL: 1, DEF: f.DEF, MEI: f.MEI, ATA: f.ATA };
    const pool = team.players.filter(id => Engine.available(w, id))
      .map(id => w.players[id])
      .sort((a, b) => Engine.eff(b) - Engine.eff(a));
    const xi = [];
    const used = new Set();
    ['GOL', 'DEF', 'MEI', 'ATA'].forEach(pos => {
      const cands = pool.filter(p => p.pos === pos && !used.has(p.id)).slice(0, need[pos]);
      cands.forEach(p => used.add(p.id));
      const slot = cands.map(p => p.id);
      // completa com qualquer jogador se faltar alguém da posição
      while (slot.length < need[pos]) {
        const any = pool.find(p => !used.has(p.id));
        if (!any) break;
        used.add(any.id); slot.push(any.id);
      }
      xi.push(...slot);
    });
    const bench = pool.filter(p => !used.has(p.id)).slice(0, 7).map(p => p.id);
    return { xi, bench };
  },

  eff(p) {
    return p.ovr * (0.7 + 0.3 * p.fitness / 100) * (0.97 + 0.06 * p.morale / 100);
  },

  slotEff(w, formation, i, pid) {
    const p = w.players[pid];
    if (!p) return 20;
    let e = Engine.eff(p);
    const sp = Engine.slotPos(formation, i);
    if (p.pos !== sp) e *= (sp === 'GOL' || p.pos === 'GOL') ? 0.45 : 0.8;
    return e;
  },

  strength(w, side) {
    const f = FORMATIONS[side.formation];
    const g = { GOL: [], DEF: [], MEI: [], ATA: [] };
    side.xi.forEach((pid, i) => {
      if (pid == null || side.off.includes(pid)) return;
      g[Engine.slotPos(side.formation, i)].push(Engine.slotEff(w, side.formation, i, pid));
    });
    const gk = g.GOL[0] || 20;
    const def = U.avg(g.DEF) || 20, mid = U.avg(g.MEI) || 20, att = U.avg(g.ATA) || 20;
    let attack = (att * 0.55 + mid * 0.35 + def * 0.1) * (1 + 0.04 * (f.ATA - 2) + 0.02 * (f.MEI - 4));
    let defense = (def * 0.55 + mid * 0.3 + gk * 0.15) * (1 + 0.04 * (f.DEF - 4));
    let midfield = mid * (1 + 0.05 * (f.MEI - 4));
    if (side.mentality === 'att') { attack *= 1.08; defense *= 0.93; }
    if (side.mentality === 'def') { attack *= 0.9; defense *= 1.08; }
    const missing = side.off.length;
    const pen = Math.pow(0.9, missing);
    return { attack: attack * pen, defense: defense * pen, midfield: midfield * pen, gk };
  },

  createMatch(w, hId, aId, opts = {}) {
    const mk = (id) => {
      const t = w.teams[id];
      let xi, bench;
      if (opts.lineups && opts.lineups[id]) ({ xi, bench } = opts.lineups[id]);
      else ({ xi, bench } = Engine.autoLineup(w, t));
      return {
        id, xi: xi.slice(), bench: bench.slice(), formation: t.formation, mentality: t.mentality,
        subs: 3, off: [], yellow: {}, used: xi.slice(), ratings: {}, ai: !(opts.userTeam === id),
      };
    };
    const m = {
      sides: [mk(hId), mk(aId)], minute: 0, score: [0, 0], events: [],
      stats: { shots: [0, 0], onT: [0, 0], poss: [0, 0] },
      exclude: opts.exclude || null, done: false, ball: 0.5, attackSide: 0,
    };
    m.sides.forEach(s => s.xi.forEach(pid => s.ratings[pid] = 6 + U.gauss(0, 0.3)));
    return m;
  },

  onPitch(m, side) { return side.xi.filter(pid => pid != null && !side.off.includes(pid)); },

  pickPlayer(w, m, sideIdx, weights, excludeIds = []) {
    const side = m.sides[sideIdx];
    const cands = Engine.onPitch(m, side).filter(pid => !excludeIds.includes(pid) && pid !== m.exclude);
    if (!cands.length) return null;
    const ws = cands.map(pid => {
      const i = side.xi.indexOf(pid);
      const pos = Engine.slotPos(side.formation, i);
      return (weights[pos] || 0) * Engine.eff(w.players[pid]) / 50;
    });
    if (ws.every(x => x === 0)) return null;
    return U.weighted(cands, ws);
  },

  ev(m, type, side, text, pid) {
    const e = { min: m.minute, type, side, text, pid };
    m.events.push(e);
    return e;
  },

  // Simula um minuto. Retorna os eventos gerados.
  step(w, m) {
    const start = m.events.length;
    m.minute++;
    const [H, A] = m.sides;
    const sh = Engine.strength(w, H), sa = Engine.strength(w, A);
    const tn = (i) => w.teams[m.sides[i].id].name;
    const pn = (pid) => Data.short(w.players[pid]);

    let ph = Math.pow(sh.midfield, 3) / (Math.pow(sh.midfield, 3) + Math.pow(sa.midfield, 3)) + 0.03;
    const s = Math.random() < ph ? 0 : 1;
    m.attackSide = s;
    m.stats.poss[s]++;
    const atk = s === 0 ? sh : sa, dfn = s === 0 ? sa : sh;
    const ratio = atk.attack / dfn.defense;
    const pChance = U.clamp(0.22 * Math.pow(ratio, 2.2) * (s === 0 ? 1.06 : 1), 0.04, 0.5);
    m.ball = s === 0 ? U.rf(0.45, 0.7) : U.rf(0.3, 0.55);

    if (Math.random() < pChance) {
      const shooter = Engine.pickPlayer(w, m, s, { ATA: 6, MEI: 3, DEF: 0.8 });
      if (shooter) {
        m.stats.shots[s]++;
        m.ball = s === 0 ? 0.88 : 0.12;
        const onT = Math.random() < U.clamp(0.38 * Math.pow(ratio, 0.6), 0.2, 0.65);
        const side = m.sides[s], opp = m.sides[1 - s];
        if (onT) {
          m.stats.onT[s]++;
          const pGoal = U.clamp(0.3 * Math.pow(Engine.eff(w.players[shooter]) / (dfn.gk || 40), 1.3), 0.12, 0.55);
          if (Math.random() < pGoal) {
            m.score[s]++;
            let assist = null;
            if (Math.random() < 0.7) assist = Engine.pickPlayer(w, m, s, { MEI: 4, ATA: 2, DEF: 1 }, [shooter]);
            side.ratings[shooter] += 1.0;
            if (assist) side.ratings[assist] += 0.6;
            Engine.onPitch(m, opp).forEach(pid => {
              const pos = Engine.slotPos(opp.formation, opp.xi.indexOf(pid));
              if (pos === 'GOL' || pos === 'DEF') opp.ratings[pid] -= 0.3;
            });
            const e = Engine.ev(m, 'goal', s,
              U.pick(['GOOOL! ', 'É GOL! ', 'Gol! ', 'Balançou a rede! ']) + pn(shooter) +
              U.pick([' bate firme e marca', ' finaliza no canto', ' toca na saída do goleiro', ' acerta um chutaço', ' cabeceia para o fundo da rede']) +
              (assist ? ' (assistência de ' + pn(assist) + ')' : '') + ' para o ' + tn(s) + '!', shooter);
            e.assist = assist;
            const st = w.players[shooter].s;
            st.goals++;
            if (assist) w.players[assist].s.assists++;
          } else {
            const gkid = opp.xi[0];
            if (gkid != null && !opp.off.includes(gkid)) opp.ratings[gkid] += 0.25;
            Engine.ev(m, 'save', s, pn(shooter) + ' finaliza, mas ' +
              (gkid != null ? pn(gkid) : 'a defesa') + U.pick([' faz grande defesa!', ' segura firme.', ' espalma para escanteio!']), shooter);
          }
        } else {
          Engine.ev(m, 'miss', s, pn(shooter) + U.pick([' chuta por cima do gol.', ' manda para fora.', ' é travado na hora do chute.', ' finaliza fraco, para fora.', ' cabeceia sem direção.']), shooter);
        }
      }
    }

    // Cartões
    if (Math.random() < 0.012) {
      const sideIdx = U.ri(0, 1), side = m.sides[sideIdx];
      const pid = Engine.pickPlayer(w, m, sideIdx, { DEF: 4, MEI: 3, ATA: 1, GOL: 0.2 });
      if (pid && pid !== m.exclude) {
        side.yellow[pid] = (side.yellow[pid] || 0) + 1;
        side.ratings[pid] -= 0.3;
        if (side.yellow[pid] >= 2) {
          side.off.push(pid); side.ratings[pid] -= 1;
          w.players[pid].suspended = 2;
          Engine.ev(m, 'red', sideIdx, 'Segundo amarelo! ' + pn(pid) + ' é expulso.', pid);
        } else Engine.ev(m, 'yellow', sideIdx, 'Cartão amarelo para ' + pn(pid) + '.', pid);
      }
    }
    // Lesões
    if (Math.random() < 0.0018) {
      const sideIdx = U.ri(0, 1), side = m.sides[sideIdx];
      const pid = Engine.pickPlayer(w, m, sideIdx, { DEF: 1, MEI: 1, ATA: 1, GOL: 0.3 });
      if (pid && pid !== m.exclude) {
        w.players[pid].injury = U.ri(1, 6);
        Engine.ev(m, 'injury', sideIdx, pn(pid) + ' se machuca e não tem condições de continuar.', pid);
        if (!Engine.aiReplace(w, m, sideIdx, pid)) side.off.push(pid);
      }
    }

    // Desgaste
    m.sides.forEach(side => Engine.onPitch(m, side).forEach(pid => {
      const p = w.players[pid];
      p.fitness = Math.max(30, p.fitness - 0.22);
    }));

    // Substituições da IA
    m.sides.forEach((side, i) => {
      if (side.ai && m.minute >= 60 && side.subs > (side.reserve || 0) && Math.random() < 0.08) {
        const tired = Engine.onPitch(m, side).filter(pid => pid !== m.exclude && side.xi.indexOf(pid) > 0)
          .sort((a, b) => w.players[a].fitness - w.players[b].fitness)[0];
        if (tired) Engine.aiReplace(w, m, i, tired);
      }
    });

    if (m.minute === 45) Engine.ev(m, 'ht', -1, 'Fim do primeiro tempo: ' + tn(0) + ' ' + m.score[0] + ' x ' + m.score[1] + ' ' + tn(1) + '.');
    if (m.minute >= 90) {
      m.done = true;
      Engine.ev(m, 'ft', -1, 'Fim de jogo! ' + tn(0) + ' ' + m.score[0] + ' x ' + m.score[1] + ' ' + tn(1) + '.');
    }
    return m.events.slice(start);
  },

  aiReplace(w, m, sideIdx, outId) {
    const side = m.sides[sideIdx];
    if (side.subs <= 0) return false;
    const slot = side.xi.indexOf(outId);
    const pos = Engine.slotPos(side.formation, slot);
    const avail = side.bench.filter(id => Engine.available(w, id) && id !== m.exclude);
    if (!avail.length) return false;
    const inId = avail.sort((a, b) =>
      (w.players[b].pos === pos) - (w.players[a].pos === pos) || Engine.eff(w.players[b]) - Engine.eff(w.players[a]))[0];
    return Engine.substitute(w, m, sideIdx, outId, inId);
  },

  substitute(w, m, sideIdx, outId, inId) {
    const side = m.sides[sideIdx];
    const slot = side.xi.indexOf(outId);
    if (slot < 0 || side.subs <= 0 || side.off.includes(outId)) return false;
    side.xi[slot] = inId;
    side.bench = side.bench.filter(id => id !== inId);
    side.subs--;
    side.used.push(inId);
    side.ratings[inId] = 6 + U.gauss(0, 0.2);
    Engine.ev(m, 'sub', sideIdx, 'Substituição no ' + w.teams[side.id].name + ': sai ' +
      Data.short(w.players[outId]) + ', entra ' + Data.short(w.players[inId]) + '.', inId);
    return true;
  },

  finish(w, m, fixture) {
    fixture.r = m.score.slice();
    m.sides.forEach((side, i) => {
      const diff = m.score[i] - m.score[1 - i];
      side.used.forEach(pid => {
        const p = w.players[pid];
        if (!p) return;
        let r = side.ratings[pid] + (diff > 0 ? 0.3 : diff < 0 ? -0.3 : 0);
        r = U.clamp(r, 3, 10);
        side.ratings[pid] = r;
        p.s.apps++; p.s.rsum += r;
        p.morale = U.clamp(p.morale + (diff > 0 ? 4 : diff < 0 ? -4 : 0) + (r - 6.5) * 2, 10, 100);
      });
    });
  },

  quick(w, fixture, opts) {
    const m = Engine.createMatch(w, fixture.h, fixture.a, opts);
    while (!m.done) Engine.step(w, m);
    Engine.finish(w, m, fixture);
    return m;
  },

  // Joga todas as partidas restantes da rodada e avança a semana
  playRound(w) {
    w.leagues.forEach(lg => {
      const rd = lg.fixtures[w.round];
      if (!rd) return;
      rd.forEach(fx => { if (!fx.r) Engine.quick(w, fx); });
    });
    // recuperação semanal
    Object.values(w.players).forEach(p => {
      p.fitness = Math.min(100, p.fitness + 28);
      if (p.injury > 0) p.injury--;
      if (p.suspended > 0) p.suspended--;
      if (!p.isUser && p.age <= 23 && p.ovr < p.pot && Math.random() < 0.06) { p.ovr++; Data.updateValue(p); }
    });
    w.round++;
    w.week++;
  },

  roundsInSeason(w) { return w.leagues[0].fixtures.length; },

  fixtureFor(w, teamId, round = w.round) {
    const lg = Data.leagueOf(w, teamId);
    const rd = lg.fixtures[round];
    return rd ? rd.find(f => f.h === teamId || f.a === teamId) : null;
  },

  endSeason(w, protect = []) {
    const summary = { season: w.season, leagues: [] };
    const tables = w.leagues.map(lg => Data.table(lg));
    tables.forEach((tb, tier) => summary.leagues.push({
      name: w.leagues[tier].name, champ: tb[0].id,
      up: tier > 0 ? [tb[0].id, tb[1].id] : [],
      down: tier < 2 ? [tb[tb.length - 1].id, tb[tb.length - 2].id] : [],
      table: tb.map(r => r.id),
    }));
    summary.leagues.forEach((L, tier) => {
      L.up.forEach(id => w.teams[id].tier = tier - 1);
      L.down.forEach(id => w.teams[id].tier = tier + 1);
    });
    // reputação acompanha a divisão
    Object.values(w.teams).forEach(t => {
      const target = [80, 55, 38][t.tier];
      t.rep = Math.round(t.rep + (target - t.rep) * 0.15);
    });
    // envelhecimento e evolução
    const retired = [];
    Object.values(w.players).forEach(p => {
      p.age++;
      p.s = { apps: 0, goals: 0, assists: 0, rsum: 0 };
      p.fitness = 100; p.injury = 0; p.suspended = 0;
      if (p.isUser) return;
      if (p.age <= 23) p.ovr = Math.min(p.pot, p.ovr + U.ri(1, 6));
      else if (p.age <= 27) p.ovr = Math.min(p.pot, p.ovr + U.ri(0, 3));
      else if (p.age >= 31) p.ovr = Math.max(25, p.ovr - U.ri(0, 4));
      p.contract--;
      Data.updateValue(p);
      if (p.age >= 34 && Math.random() < (p.age - 32) * 0.25 && !protect.includes(p.id)) retired.push(p);
    });
    retired.forEach(p => {
      if (p.teamId) {
        const t = w.teams[p.teamId];
        t.players = t.players.filter(id => id !== p.id);
      } else w.freeAgents = w.freeAgents.filter(id => id !== p.id);
      delete w.players[p.id];
    });
    // contratos vencidos de times da IA são renovados
    Object.values(w.players).forEach(p => {
      if (p.contract <= 0 && p.teamId && !protect.includes(p.teamId) && !p.isUser) p.contract = U.ri(1, 3);
    });
    // categorias de base mantêm os elencos completos
    Object.values(w.teams).forEach(t => Engine.fillSquad(w, t));
    for (let i = 0; i < 12; i++) {
      const p = Data.makePlayer(U.pick(POSITIONS), U.ri(40, 64));
      w.players[p.id] = p; w.freeAgents.push(p.id);
    }
    w.leagues.forEach((lg, tier) => {
      lg.teams = Object.values(w.teams).filter(t => t.tier === tier).map(t => t.id);
      lg.fixtures = Data.makeFixtures(lg.teams);
    });
    w.history = w.history || [];
    w.history.push({ season: w.season, champs: summary.leagues.map(L => L.champ) });
    w.season++; w.round = 0;
    return summary;
  },

  fillSquad(w, t) {
    const min = { GOL: 2, DEF: 6, MEI: 6, ATA: 3 };
    for (const pos in min) {
      let have = t.players.filter(id => w.players[id] && w.players[id].pos === pos).length;
      while (have < min[pos]) {
        const p = Data.makePlayer(pos, 36 + t.rep * 0.38, U.ri(17, 19));
        p.teamId = t.id; w.players[p.id] = p; t.players.push(p.id); have++;
      }
    }
  },

  avgRating(p) { return p.s.apps ? (p.s.rsum / p.s.apps).toFixed(1) : '-'; },
};
