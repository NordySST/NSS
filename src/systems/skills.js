// Habilidades: ganho por estrelas, declínio sem treino e parâmetros derivados.
var Skills = {
  effective(g, k) { return Util.clamp(g.player.skills[k] + (g.player.bootBonus?.[k] || 0), 0, BALANCE.skills.max); },
  // estrelas pela tentativa em que acertou (0, 1, 2) ou falhou (null)
  starsFor(successAttempt) { return successAttempt == null ? 0 : 3 - successAttempt; },
  gainFor(level, stars) {
    const S = BALANCE.skills;
    if (!stars) return 0;
    if (level >= S.softCap && stars < 3) return 0;   // acima de 30 só com ★★★
    return Math.min(S.gain[stars], S.max - level);
  },
  applyTraining(g, k, stars) {
    const gain = Skills.gainFor(g.player.skills[k], stars);
    g.player.skills[k] += gain;
    g.player.sinceTrain[k] = 0;
    g.player.lastStars[k] = stars;
    return gain;
  },
  decayThreshold(age) {
    const S = BALANCE.skills;
    return age >= 32 ? S.decayAfterMatches32 : age >= 28 ? S.decayAfterMatches28 : S.decayAfterMatches;
  },
  // chamado a cada partida: habilidade sem treino perde 1 ponto a cada 2 partidas depois do limite
  tickDecay(g) {
    const th = Skills.decayThreshold(g.player.age), lost = {};
    SKILLS.forEach(k => {
      const n = ++g.player.sinceTrain[k];
      if (n > th && (n - th) % BALANCE.skills.decayEvery === 0 && g.player.skills[k] > 0) {
        g.player.skills[k]--; lost[k] = 1;
      }
    });
    return lost;
  },
  // parâmetros de jogo derivados das habilidades
  params(g) {
    const M = BALANCE.skills.map, V = BALANCE.skills.visionMates;
    const e = (k) => Skills.effective(g, k);
    const shakeLow = 1 + (1 - g.player.energy / 100) * BALANCE.energy.lowEnergyShake;
    return {
      runSpeed: Util.skillMap(e('pace'), M.paceSpeed),
      passRange: Util.skillMap(e('power'), M.passRange),
      ballSpeed: Util.skillMap(e('power'), M.ballSpeed),
      curveMax: Util.skillMap(e('technique'), M.curveMax),
      shake: Util.skillMap(e('technique'), M.aimShake) * shakeLow,
      mates: Math.min(V.max, V.base + Math.floor(e('vision') / V.per)),
      seeOffside: e('vision') >= BALANCE.skills.visionOffside,
      fk: e('freekick'),
    };
  },
};
