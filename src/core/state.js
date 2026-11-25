// Estado único e serializável do jogo (GameState). Nada de estado escondido na interface.
var SAVE_VERSION = 1;
var SKILLS = ['pace', 'power', 'technique', 'vision', 'freekick'];

var State = {
  // cria uma carreira nova
  create(opts) {
    const B = BALANCE.start;
    const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
    RNG.seed(seed);
    const skills = { ...B.skills };
    const bonus = B.positionBonus[opts.pos] || {};
    for (const k in bonus) skills[k] += bonus[k];
    const world = League.createWorld(opts.country);
    // começa num clube semiprofissional da divisão mais baixa
    const lowest = world.divisions[world.divisions.length - 1];
    const clubId = RNG.pick(lowest.teams.slice().sort((a, b) => world.clubs[a].strength - world.clubs[b].strength).slice(0, 8));
    const g = {
      saveVersion: SAVE_VERSION, seed, rng: 0, createdAt: Date.now(),
      player: {
        name: opts.name, gender: opts.gender, country: opts.country, look: opts.look, pos: opts.pos,
        age: B.age, clubId, skills,
        sinceTrain: Object.fromEntries(SKILLS.map(k => [k, 0])),
        lastStars: Object.fromEntries(SKILLS.map(k => [k, null])),
        energy: B.energy, money: B.money, star: B.starRating, xp: 0, starMax: B.starRating,
        rel: { ...B.rel },
        contract: { wage: B.wage, goalBonus: B.goalBonus, assistBonus: B.assistBonus, matchesLeft: B.contractMatches },
        stats: { apps: 0, goals: 0, assists: 0, passes: 0, motm: 0, titles: 0, intl: 0 },
        season: { apps: 0, goals: 0, assists: 0, passes: 0, ratings: [] },
        scheme: 'bal', effort: 2, playedInARow: 0,
      },
      world,
      lastMatch: null,
      seen: {},
    };
    g.rng = RNG.state;
    return g;
  },

  club(g, id) { return g.world.clubs[id ?? g.player.clubId]; },
  division(g) { return g.world.divisions[State.club(g).tier]; },
  nextFixture(g) { return League.fixtureFor(g.world, g.player.clubId); },
};
