// Energia: custos, dreno na partida e recuperação.
var Energy = {
  trainCost(g) { return BALANCE.energy.trainCost; },
  canTrain(g) { return g.player.energy >= Energy.trainCost(g); },
  spend(g, amount) {
    const before = g.player.energy;
    g.player.energy = Util.clamp(before - amount, 0, 100);
    return g.player.energy - before;
  },
  // dreno por minuto em campo
  drainPerMinute(g, effort) {
    const E = BALANCE.energy;
    const paceF = Util.skillMap(Skills.effective(g, 'pace'), BALANCE.skills.map.paceDrain);
    return E.matchDrainPerMin * E.effortMult[effort - 1] * paceF;
  },
  momentCost(g) {
    return BALANCE.energy.momentCost * Util.skillMap(Skills.effective(g, 'pace'), BALANCE.skills.map.paceDrain);
  },
  recoveryAmount(g) { return BALANCE.energy.baseRecovery; },
  recover(g) {
    const before = g.player.energy;
    g.player.energy = Util.clamp(before + Energy.recoveryAmount(g), 0, 100);
    return g.player.energy - before;
  },
  // começa no banco se estiver cansado ou se o técnico não confia
  isReserve(g) {
    return g.player.energy < BALANCE.energy.reserveThreshold || g.player.rel.boss < BALANCE.relationships.bossReserveBelow;
  },
};
