// Simulador da partida (sem interface). Gera eventos minuto a minuto e pausa nos lances do jogador.
var Match = {
  create(g, fixture, opts) {
    const p = g.player, M = BALANCE.match;
    const mySide = fixture.h === p.clubId ? 0 : 1;
    const reserve = Energy.isReserve(g);
    const m = {
      fixture: { h: fixture.h, a: fixture.a }, mySide, minute: 0, score: [0, 0], events: [],
      scheme: opts.scheme || p.scheme, effort: opts.effort || p.effort,
      reserve, onPitch: !reserve, enterAt: reserve ? 46 : 0, subbedOff: false, done: false,
      weather: RNG.pick(['sun', 'sun', 'cloud', 'rain']),
      perf: { goals: 0, assists: 0, passes: { simple: 0, good: 0, great: 0, stunning: 0 }, chances: 0, fails: 0, wasted: 0, greedy: 0, lost: 0, effort: opts.effort || p.effort, played: false },
      moments: [], pending: null,
    };
    Match.planMoments(g, m);
    return m;
  },

  // quantos lances e em que minutos
  planMoments(g, m) {
    const M = BALANCE.match;
    let n = RNG.int(M.momentsMin, M.momentsMax) * M.effortMoments[m.effort - 1] * (0.85 + g.player.rel.team / 333);
    if (m.reserve) n *= M.reserveMoments;
    n = Math.max(1, Math.round(n));
    const from = Math.max(3, m.enterAt + 2), mins = new Set();
    let guard = 0;
    while (mins.size < n && guard++ < 500) mins.add(RNG.int(from, 88));
    m.moments = [...mins].sort((a, b) => a - b);
  },

  strengths(g, m) {
    const W = g.world, M = BALANCE.match;
    const s = [W.clubs[m.fixture.h].strength, W.clubs[m.fixture.a].strength];
    // o jogador também pesa um pouco na força do time
    const me = Util.avg(SKILLS.map(k => Skills.effective(g, k))) / 60 * 100;
    if (m.onPitch) s[m.mySide] = s[m.mySide] * 0.92 + me * 0.08;
    const att = s.slice(), def = s.slice();
    const sch = m.scheme === 'att' ? M.schemeAttack : m.scheme === 'def' ? M.schemeDefend : null;
    if (sch) { att[m.mySide] *= sch.att; def[m.mySide] *= sch.def; }
    att[0] *= M.homeAdv;
    return { att, def };
  },

  momentType(g, m) {
    const M = BALANCE.match;
    const mix = { ...M.momentMix[g.player.pos] };
    if (m.scheme === 'att') { mix.attack += M.schemeShift; mix.intercept = Math.max(0.05, mix.intercept - M.schemeShift); }
    if (m.scheme === 'def') { mix.intercept += M.schemeShift; mix.attack = Math.max(0.05, mix.attack - M.schemeShift); }
    return RNG.weighted(['intercept', 'pass', 'attack'], [mix.intercept, mix.pass, mix.attack]);
  },

  ev(m, type, side, extra) { const e = { min: m.minute, type, side, ...extra }; m.events.push(e); return e; },

  // avança 1 minuto. Retorna { events, moment } — moment != null pausa para um lance jogável
  step(g, m) {
    if (m.done) return { events: [], moment: null };
    const start = m.events.length;
    m.minute++;
    const p = g.player;
    if (!m.onPitch && !m.subbedOff && m.minute >= m.enterAt && m.enterAt > 0) {
      m.onPitch = true; Match.ev(m, 'enter', m.mySide);
    }
    if (m.onPitch) {
      m.perf.played = true;
      Energy.spend(g, Energy.drainPerMinute(g, m.effort));
      if (p.energy <= 0) { m.onPitch = false; m.subbedOff = true; Match.ev(m, 'subOff', m.mySide); }
    }
    // jogo dos times
    const { att, def } = Match.strengths(g, m);
    for (let s = 0; s < 2; s++) {
      const ratio = att[s] / def[1 - s];
      if (RNG.chance(BALANCE.match.chancePerMin * Math.pow(ratio, BALANCE.match.strengthExp))) {
        if (RNG.chance(BALANCE.match.goalPerChance * Math.pow(ratio, 0.8))) { m.score[s]++; Match.ev(m, 'goal', s); }
        else Match.ev(m, RNG.chance(0.45) ? 'save' : 'shot', s);
      }
    }
    if (RNG.chance(0.012)) Match.ev(m, 'card', RNG.int(0, 1));
    if (RNG.chance(0.02)) Match.ev(m, 'foul', RNG.int(0, 1));
    if (m.minute === 45) Match.ev(m, 'half', -1);
    let moment = null;
    if (m.onPitch && m.moments.length && m.moments[0] <= m.minute) {
      m.moments.shift();
      moment = { type: Match.momentType(g, m) };
      m.pending = moment;
      Energy.spend(g, Energy.momentCost(g));
    }
    if (m.minute >= 90) { m.done = true; Match.ev(m, 'end', -1); }
    return { events: m.events.slice(start), moment };
  },

  passClass(distM, backwards) {
    const P = BALANCE.passRating;
    if (backwards || distM < P.good) return 'simple';
    if (distM >= P.stunning) return 'stunning';
    if (distM >= P.great) return 'great';
    return 'good';
  },

  // aplica o resultado de um lance jogável. Pode encadear outro lance (interceptação -> passe).
  // res: { type, ok, result?, dist?, backwards?, greedy? }
  resolve(g, m, res) {
    const pf = m.perf, s = m.mySide;
    m.pending = null;
    let next = null;
    if (res.type === 'intercept') {
      if (res.ok) { Match.ev(m, 'intercept', s, { mine: true }); next = { type: 'pass' }; }
      else { pf.fails++; Match.ev(m, 'missIntercept', s, { mine: true }); }
    } else if (res.type === 'pass') {
      if (res.ok) {
        const cls = Match.passClass(res.dist, res.backwards);
        pf.passes[cls]++;
        Match.ev(m, 'pass', s, { mine: true, cls });
        // o time aproveita o seu passe: às vezes vira gol com assistência sua
        if (!res.backwards && RNG.chance(BALANCE.match.passGoalChance[cls])) {
          m.score[s]++; pf.assists++; Match.ev(m, 'goal', s, { assist: true, mine: true });
        } else if (!res.backwards && RNG.chance(0.35)) next = { type: 'attack' };
      } else { pf.fails++; pf.lost++; Match.ev(m, 'lost', s, { mine: true }); }
    } else if (res.type === 'attack') {
      if (res.greedy) pf.greedy++;
      if (res.result === 'goal') { m.score[s]++; pf.goals++; pf.chances++; Match.ev(m, 'goal', s, { mine: true }); }
      else if (res.result === 'assist') { m.score[s]++; pf.assists++; pf.chances++; Match.ev(m, 'goal', s, { assist: true, mine: true }); }
      else if (res.result === 'saved' || res.result === 'miss') { pf.chances++; pf.wasted++; Match.ev(m, res.result === 'saved' ? 'save' : 'shot', s, { mine: true }); }
      else { pf.fails++; pf.lost++; Match.ev(m, 'lost', s, { mine: true }); }
    }
    if (next) m.pending = next;
    return next;
  },

  // resolve automaticamente (simular até o fim)
  autoResolve(g, m, moment) {
    const pr = Skills.params(g), sk = Util.avg(SKILLS.map(k => Skills.effective(g, k))) / 60;
    if (moment.type === 'intercept') return { type: 'intercept', ok: RNG.chance(0.35 + sk * 0.4) };
    if (moment.type === 'pass') return { type: 'pass', ok: RNG.chance(0.55 + sk * 0.35), dist: RNG.range(8, pr.passRange) };
    const r = RNG.next();
    return { type: 'attack', result: r < 0.12 + sk * 0.25 ? 'goal' : r < 0.2 + sk * 0.3 ? 'assist' : r < 0.6 ? 'saved' : 'lost' };
  },

  // fecha a partida: nota, relações, XP, pagamento, estatísticas, liga
  finish(g, m) {
    const p = g.player, W = g.world;
    const my = m.score[m.mySide], ot = m.score[1 - m.mySide];
    const result = Math.sign(my - ot);
    const fx = League.fixtureFor(W, p.clubId);
    fx.r = m.score.slice();
    const rating = Progression.rating(m.perf, result);
    Progression.decayRel(g);
    const deltas = Progression.relDeltas(m.perf, result);
    const relOut = Progression.applyRel(g, deltas);
    const xp = Progression.xpFrom(deltas, m.perf);
    const starBefore = p.star;
    const levels = Progression.addXp(g, xp);
    const pay = Progression.payment(g, m.perf);
    p.money += pay.total;
    const passes = Object.values(m.perf.passes).reduce((a, b) => a + b, 0);
    p.stats.apps += m.perf.played ? 1 : 0; p.stats.goals += m.perf.goals; p.stats.assists += m.perf.assists; p.stats.passes += passes;
    p.season.apps += m.perf.played ? 1 : 0; p.season.goals += m.perf.goals; p.season.assists += m.perf.assists; p.season.passes += passes;
    if (rating != null) p.season.ratings.push(rating);
    // craque do jogo: sua nota contra uma nota estimada dos outros
    const best = 6.5 + RNG.range(0, 1.6) + (result < 0 ? -0.5 : 0);
    const motm = rating != null && rating >= 7 && rating >= best;
    if (motm) p.stats.motm++;
    p.contract.matchesLeft = Math.max(0, p.contract.matchesLeft - 1);
    const decayed = Skills.tickDecay(g);
    League.playRound(W);
    let season = null;
    if (W.round >= League.roundsInSeason(W)) {
      const div = League.divisionOf(W, p.clubId);
      const pos = League.table(div).findIndex(r => r.id === p.clubId) + 1;
      season = League.endSeason(W);
      season.pos = pos; season.divName = div.name;
      p.age++;
      p.season = { apps: 0, goals: 0, assists: 0, passes: 0, ratings: [] };
    }
    const summary = {
      score: m.score.slice(), mySide: m.mySide, fixture: m.fixture, result, rating, motm,
      perf: m.perf, passes, deltas: relOut, xp, levels, starBefore, starAfter: p.star, pay, decayed, season,
      reserve: m.reserve, subbedOff: m.subbedOff,
    };
    g.lastMatch = summary;
    return summary;
  },
};
