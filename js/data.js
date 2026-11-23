// Mundo do jogo: ligas, clubes e jogadores (todos fictícios)
const POSITIONS = ['GOL', 'DEF', 'MEI', 'ATA'];
const POS_NAMES = { GOL: 'Goleiro', DEF: 'Defensor', MEI: 'Meio-campo', ATA: 'Atacante' };

const FORMATIONS = {
  '4-4-2': { DEF: 4, MEI: 4, ATA: 2 },
  '4-3-3': { DEF: 4, MEI: 3, ATA: 3 },
  '3-5-2': { DEF: 3, MEI: 5, ATA: 2 },
  '4-5-1': { DEF: 4, MEI: 5, ATA: 1 },
  '5-3-2': { DEF: 5, MEI: 3, ATA: 2 },
  '3-4-3': { DEF: 3, MEI: 4, ATA: 3 },
};

const MENTALITIES = { def: 'Defensiva', bal: 'Equilibrada', att: 'Ofensiva' };

// 30 clubes fictícios divididos em 3 divisões de 10
const TEAM_DEFS = [
  // Primeira Divisão
  ['Real Porto Alvo', 'RPA', '#c62828', '#ffffff', 88],
  ['Atlético Serrano', 'ATS', '#1565c0', '#ffffff', 85],
  ['Sport Maré Alta', 'SMA', '#111111', '#e53935', 82],
  ['União Vale Verde', 'UVV', '#2e7d32', '#ffffff', 80],
  ['Imperial da Colina', 'IMC', '#6a1b9a', '#ffd54f', 77],
  ['Ferroviário Central', 'FER', '#ef6c00', '#111111', 74],
  ['Clube Náutico Aurora', 'NAU', '#00838f', '#ffffff', 72],
  ['Esporte Clube Pinhal', 'ECP', '#33691e', '#ffeb3b', 70],
  ['Operário Bandeirante', 'OPB', '#37474f', '#ffffff', 68],
  ['Associação Rio Claro', 'ARC', '#0277bd', '#ffeb3b', 66],
  // Segunda Divisão
  ['Tupã Futebol Clube', 'TUP', '#bf360c', '#ffffff', 62],
  ['Santa Cruz do Planalto', 'SCP', '#d32f2f', '#000000', 60],
  ['Grêmio Litorâneo', 'GRL', '#283593', '#90caf9', 58],
  ['Botafogo da Serra', 'BOS', '#212121', '#ffffff', 57],
  ['Independente Cerrado', 'IND', '#f9a825', '#1b5e20', 55],
  ['Ypiranga Paulistano', 'YPI', '#7b1fa2', '#ffffff', 54],
  ['Juventude Alvorada', 'JUA', '#558b2f', '#ffffff', 52],
  ['Estrela do Norte', 'EDN', '#c2185b', '#ffffff', 51],
  ['Princesa do Vale', 'PDV', '#4e342e', '#ffcc80', 50],
  ['América das Dunas', 'AMD', '#e65100', '#fff3e0', 49],
  // Terceira Divisão
  ['Barra Funda FC', 'BFC', '#455a64', '#ff7043', 45],
  ['Comercial Ribeira', 'COR', '#1a237e', '#ffffff', 44],
  ['Esportivo Cajueiro', 'ESC', '#827717', '#ffffff', 42],
  ['Guarani da Lagoa', 'GDL', '#00695c', '#ffffff', 41],
  ['Paraná Clube Sul', 'PCS', '#0d47a1', '#e53935', 40],
  ['Vila Nova Paulista', 'VNP', '#b71c1c', '#ffffff', 39],
  ['Rio Branco Mineiro', 'RBM', '#263238', '#cfd8dc', 38],
  ['Olaria Suburbana', 'OLS', '#004d40', '#ffeb3b', 36],
  ['Canto do Rio', 'CDR', '#880e4f', '#f8bbd0', 35],
  ['Mangueiral EC', 'MEC', '#3e2723', '#a5d6a7', 33],
];

const LEAGUE_NAMES = ['Primeira Divisão', 'Segunda Divisão', 'Terceira Divisão'];

const Data = {
  makePlayer(pos, baseOvr, age) {
    const n = U.name();
    age = age || U.ri(18, 34);
    const ovr = Math.round(U.clamp(U.gauss(baseOvr, 5) - (age < 21 ? (21 - age) * 1.5 : 0), 25, 95));
    const potBonus = age < 24 ? U.ri(3, 18) : age < 28 ? U.ri(0, 5) : 0;
    const p = {
      id: U.uid(), first: n.first, last: n.last, age, pos, ovr,
      pot: Math.min(97, ovr + potBonus),
      teamId: null, fitness: 100, morale: 70, injury: 0,
      contract: U.ri(1, 4),
      s: { apps: 0, goals: 0, assists: 0, rsum: 0 },
    };
    Data.updateValue(p);
    return p;
  },

  updateValue(p) {
    const agef = p.age <= 21 ? 1.5 : p.age <= 25 ? 1.3 : p.age <= 29 ? 1.0 : p.age <= 32 ? 0.6 : 0.3;
    p.value = Math.round(Math.pow(Math.max(p.ovr - 30, 1), 2.6) * 120 * agef / 1000) * 1000;
    p.wage = Math.max(500, Math.round(Math.pow(Math.max(p.ovr - 30, 1), 2.3) * 3 / 100) * 100);
  },

  createWorld() {
    const w = {
      season: 2026, round: 0, week: 0,
      teams: {}, players: {}, leagues: [], news: [],
    };
    TEAM_DEFS.forEach((d, i) => {
      const tier = Math.floor(i / 10);
      const t = {
        id: i + 1, name: d[0], short: d[1], c1: d[2], c2: d[3], rep: d[4],
        tier, players: [],
        formation: U.pick(Object.keys(FORMATIONS)), mentality: 'bal',
        budget: Math.round(Math.pow(d[4], 2.4) * 120 / 1000) * 1000,
        stadium: Math.round(d[4] * d[4] * 6 / 1000) * 1000 + 5000,
      };
      w.teams[t.id] = t;
      const base = 40 + d[4] * 0.42;
      const comp = { GOL: 2, DEF: 7, MEI: 7, ATA: 4 };
      for (const pos in comp) {
        for (let k = 0; k < comp[pos]; k++) {
          const p = Data.makePlayer(pos, base);
          p.teamId = t.id;
          w.players[p.id] = p;
          t.players.push(p.id);
        }
      }
    });
    // agentes livres
    w.freeAgents = [];
    for (let i = 0; i < 25; i++) {
      const p = Data.makePlayer(U.pick(POSITIONS), U.ri(42, 62));
      w.players[p.id] = p; w.freeAgents.push(p.id);
    }
    for (let tier = 0; tier < 3; tier++) {
      const ids = Object.values(w.teams).filter(t => t.tier === tier).map(t => t.id);
      w.leagues.push({ tier, name: LEAGUE_NAMES[tier], teams: ids, fixtures: Data.makeFixtures(ids) });
    }
    return w;
  },

  // Turno e returno (round-robin)
  makeFixtures(ids) {
    const teams = U.shuffle(ids);
    const n = teams.length;
    const rounds = [];
    const arr = teams.slice();
    for (let r = 0; r < n - 1; r++) {
      const round = [];
      for (let i = 0; i < n / 2; i++) {
        const a = arr[i], b = arr[n - 1 - i];
        round.push(r % 2 === 0 ? { h: a, a: b, r: null } : { h: b, a: a, r: null });
      }
      rounds.push(round);
      arr.splice(1, 0, arr.pop());
    }
    const second = rounds.map(rd => rd.map(m => ({ h: m.a, a: m.h, r: null })));
    return rounds.concat(second);
  },

  leagueOf(w, teamId) { return w.leagues[w.teams[teamId].tier]; },

  table(league) {
    const rows = {};
    league.teams.forEach(id => rows[id] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] });
    league.fixtures.forEach(rd => rd.forEach(m => {
      if (!m.r) return;
      const [gh, ga] = m.r;
      const H = rows[m.h], A = rows[m.a];
      H.p++; A.p++; H.gf += gh; H.ga += ga; A.gf += ga; A.ga += gh;
      if (gh > ga) { H.w++; A.l++; H.pts += 3; H.form.push('V'); A.form.push('D'); }
      else if (gh < ga) { A.w++; H.l++; A.pts += 3; A.form.push('V'); H.form.push('D'); }
      else { H.d++; A.d++; H.pts++; A.pts++; H.form.push('E'); A.form.push('E'); }
    }));
    return Object.values(rows).sort((x, y) =>
      y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || y.w - x.w);
  },

  pname(p) { return p.first + ' ' + p.last; },
  short(p) { return p.first[0] + '. ' + p.last; },
};
