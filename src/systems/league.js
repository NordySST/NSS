// Ligas: clubes fictícios, calendário de pontos corridos (ida e volta), tabela e fim de temporada.
var League = {
  createWorld(countryCode) {
    const C = COUNTRIES[countryCode] || COUNTRIES.BR;
    const S = BALANCE.season;
    const clubs = {};
    const divisions = [];
    const usedNames = new Set();
    const cities = RNG.shuffle(C.cities);
    let id = 1, ci = 0;
    for (let tier = 0; tier < S.divisionsPerCountry; tier++) {
      const [lo, hi] = BALANCE.clubs.strengthByTier[tier];
      const teams = [];
      for (let k = 0; k < S.teamsPerDivision; k++) {
        let name, city;
        do {
          city = cities[ci++ % cities.length] + (ci > cities.length ? ' ' + 'II III IV'.split(' ')[Math.floor(ci / cities.length) - 1] : '');
          const pre = RNG.pick(C.prefix);
          name = (pre ? pre + ' ' : '') + city;
        } while (usedNames.has(name));
        usedNames.add(name);
        const [c1, c2] = RNG.pick(CREST_COLORS);
        const words = city.replace(/[^A-Za-zÀ-ú ]/g, '').split(' ').filter(w => w.length > 2);
        const short = (words.length > 1 ? words[0][0] + words[1][0] + (words[2] ? words[2][0] : words[1][1]) : city.slice(0, 3)).toUpperCase();
        clubs[id] = {
          id, name, city, short, c1, c2, shape: RNG.pick(CREST_SHAPES), tier, country: countryCode,
          strength: Math.round(RNG.range(lo, hi)),
        };
        teams.push(id++);
      }
      divisions.push({ tier, name: C.leagues[tier], teams, fixtures: League.fixtures(teams) });
    }
    return { country: countryCode, clubs, divisions, season: 1, round: 0 };
  },

  // turno e returno (método do círculo)
  fixtures(ids) {
    const arr = RNG.shuffle(ids);
    const n = arr.length, rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const rd = [];
      for (let i = 0; i < n / 2; i++) {
        const a = arr[i], b = arr[n - 1 - i];
        rd.push(r % 2 === 0 ? { h: a, a: b, r: null } : { h: b, a: a, r: null });
      }
      rounds.push(rd);
      arr.splice(1, 0, arr.pop());
    }
    return rounds.concat(rounds.map(rd => rd.map(m => ({ h: m.a, a: m.h, r: null }))));
  },

  divisionOf(world, clubId) { return world.divisions[world.clubs[clubId].tier]; },
  roundsInSeason(world) { return world.divisions[0].fixtures.length; },
  fixtureFor(world, clubId, round = world.round) {
    const rd = League.divisionOf(world, clubId).fixtures[round];
    return rd ? rd.find(f => f.h === clubId || f.a === clubId) : null;
  },

  poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= RNG.next(); } while (p > L); return k - 1; },

  // resultado rápido para os jogos dos outros clubes
  quickResult(world, f) {
    const sh = world.clubs[f.h].strength, sa = world.clubs[f.a].strength;
    const r = sh / sa;
    return [League.poisson(1.3 * Math.pow(r, 1.1) * BALANCE.match.homeAdv), League.poisson(1.1 * Math.pow(1 / r, 1.1))];
  },

  // completa a rodada atual (o jogo do jogador já deve ter resultado) e avança
  playRound(world) {
    world.divisions.forEach(d => {
      const rd = d.fixtures[world.round];
      if (rd) rd.forEach(f => { if (!f.r) f.r = League.quickResult(world, f); });
    });
    world.round++;
  },

  table(div) {
    const rows = {};
    div.teams.forEach(id => rows[id] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
    div.fixtures.forEach(rd => rd.forEach(m => {
      if (!m.r) return;
      const [gh, ga] = m.r, H = rows[m.h], A = rows[m.a];
      if (!H || !A) return;
      H.p++; A.p++; H.gf += gh; H.ga += ga; A.gf += ga; A.ga += gh;
      if (gh > ga) { H.w++; A.l++; H.pts += 3; }
      else if (gh < ga) { A.w++; H.l++; A.pts += 3; }
      else { H.d++; A.d++; H.pts++; A.pts++; }
    }));
    return Object.values(rows).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.id - y.id);
  },

  // acesso e rebaixamento; novo calendário
  endSeason(world) {
    const slots = BALANCE.season.promotionSlots;
    const tables = world.divisions.map(d => League.table(d));
    const moves = [];
    tables.forEach((tb, tier) => {
      if (tier > 0) tb.slice(0, slots).forEach(r => moves.push([r.id, tier - 1]));
      if (tier < world.divisions.length - 1) tb.slice(-slots).forEach(r => moves.push([r.id, tier + 1]));
    });
    const champions = tables.map(tb => tb[0].id);
    moves.forEach(([id, t]) => { world.clubs[id].tier = t; });
    world.divisions.forEach((d, tier) => {
      d.teams = Object.values(world.clubs).filter(c => c.tier === tier).map(c => c.id);
      d.fixtures = League.fixtures(d.teams);
    });
    world.season++; world.round = 0;
    return { champions, moves };
  },
};
