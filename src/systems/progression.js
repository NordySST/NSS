// Nota da partida, reação de técnico/time/torcida, Star Rating e pagamento.
var Progression = {
  xpToNext(level) { const S = BALANCE.star; return S.xpBase + level * S.xpPerLevel; },

  // perf: { goals, assists, passes:{simple,good,great,stunning}, chances, fails, wasted, greedy, lost, effort, played }
  rating(perf, result) {
    const R = BALANCE.rating;
    if (!perf.played) return null;
    let r = R.base + perf.goals * R.goal + perf.assists * R.assist
      + perf.passes.good * R.passGood + perf.passes.great * R.passGreat + perf.passes.stunning * R.passStunning
      + perf.chances * R.chance + perf.fails * R.fail + R.effort[perf.effort - 1]
      + (result > 0 ? R.win : result < 0 ? R.loss : 0);
    return Util.clamp(Math.round(r * 2) / 2, 0, 10);
  },

  relDeltas(perf, result) {
    const D = BALANCE.relDelta;
    const passes = perf.passes.simple + perf.passes.good + perf.passes.great + perf.passes.stunning;
    const good = perf.passes.good + perf.passes.great + perf.passes.stunning;
    if (!perf.played) return { boss: -1, team: 0, fans: result > 0 ? 1 : result < 0 ? -1 : 0 };
    return {
      boss: Math.round(D.boss.effort[perf.effort - 1] + good * D.boss.pass + perf.wasted * D.boss.wasted + perf.fails * D.boss.fail),
      team: Math.round(passes * D.team.pass + perf.assists * D.team.assist + perf.greedy * D.team.greedyShot + perf.lost * D.team.lostBall),
      fans: Math.round(D.fans.effort[perf.effort - 1] + perf.goals * D.fans.goal + (result > 0 ? D.fans.win : result < 0 ? D.fans.loss : D.fans.draw)),
    };
  },

  applyRel(g, deltas) {
    const out = {};
    for (const k in deltas) {
      const before = g.player.rel[k];
      g.player.rel[k] = Util.clamp(before + deltas[k], 0, 100);
      out[k] = g.player.rel[k] - before;
    }
    return out;
  },

  // decaimento leve de quem não recebeu atenção (aplicado antes dos ganhos da partida)
  decayRel(g) {
    if (!BALANCE.relationships.decayEnabled) return;
    const d = BALANCE.relationships.decayPerMatch;
    for (const k in g.player.rel) g.player.rel[k] = Util.clamp(g.player.rel[k] - d, 0, 100);
  },

  // XP vem da combinação de técnico + time + torcida
  xpFrom(deltas, perf) {
    return BALANCE.star.xpPerMatch + Math.max(0, deltas.boss) + Math.max(0, deltas.team) + Math.max(0, deltas.fans) + (perf.played ? 1 : 0);
  },

  addXp(g, xp) {
    const p = g.player;
    let levels = 0;
    p.xp += xp;
    while (p.star < BALANCE.star.max && p.xp >= Progression.xpToNext(p.star)) {
      p.xp -= Progression.xpToNext(p.star); p.star++; levels++;
    }
    if (p.star >= BALANCE.star.max) p.xp = 0;
    p.starMax = Math.max(p.starMax, p.star);
    return levels;
  },

  payment(g, perf) {
    const c = g.player.contract;
    const pay = { wage: c.wage, goals: perf.goals * c.goalBonus, assists: perf.assists * c.assistBonus };
    pay.total = pay.wage + pay.goals + pay.assists;
    return pay;
  },

  marketValue(g) {
    const p = g.player;
    const skill = Util.avg(SKILLS.map(k => p.skills[k]));
    const ageF = p.age <= 21 ? 1.4 : p.age <= 26 ? 1.2 : p.age <= 30 ? 1 : 0.6;
    return Math.round((p.star * 40 + skill * skill * 3) * ageF);
  },
};
