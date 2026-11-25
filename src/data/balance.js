// Arquivo de balanceamento: TODOS os números do jogo ficam aqui.
// Valores da seção 24 da especificação + parâmetros detalhados da Fase 1.
var BALANCE = {
  start: {
    age: 16, money: 10, energy: 100, wage: 1, goalBonus: 1, assistBonus: 0, starRating: 1,
    skills: { pace: 8, power: 8, technique: 6, vision: 6, freekick: 4 },
    positionBonus: { ATA: { power: 3, freekick: 1 }, MEI: { vision: 3, technique: 1 } },
    rel: { boss: 55, team: 45, fans: 40 },
    contractMatches: 34,
  },
  skills: {
    max: 60, softCap: 30, gain: { 3: 3, 2: 2, 1: 1 },
    decayAfterMatches: 8, decayAfterMatches28: 6, decayAfterMatches32: 4, decayEvery: 2,
    windFromLevel: 15,
    // mapeamento habilidade -> parâmetro (linear entre min e max conforme 0..60)
    map: {
      paceSpeed: [0.6, 1.4], paceDrain: [1.0, 0.6],
      passRange: [15, 45], ballSpeed: [0.7, 1.3],
      curveMax: [0.0, 1.0], aimShake: [1.0, 0.2],
    },
    visionMates: { base: 2, per: 20, max: 5 }, visionOffside: 25,
  },
  energy: {
    trainCost: 40, socialCost: 20, eventCost: 25, baseRecovery: 25, reserveThreshold: 45,
    effortMult: [0.6, 1.0, 1.5],
    matchDrainPerMin: 0.34,   // por minuto em campo, antes dos multiplicadores
    momentCost: 2,            // por lance, multiplicado pelo dreno do Pace
    lowEnergyShake: 0.8,      // tremido extra da mira com energia 0
  },
  relationships: {
    bossReserveBelow: 40, renegotiateMinBoss: 60, hiloFailPenalty: 4, askTooEarlyPenalty: 3,
    transferRequestPenalty: 10, decayPerMatch: 1.5,
    decayEnabled: false,   // liga na Fase 2, junto com o Social (que compensa a queda)
  },
  passRating: { good: 15, great: 20, stunning: 30 },
  match: {
    momentsMin: 4, momentsMax: 8,
    effortMoments: [0.8, 1.0, 1.25],
    reserveMoments: 0.5,
    // probabilidade de cada tipo de lance por posição e esquema
    momentMix: {
      ATA: { intercept: 0.2, pass: 0.3, attack: 0.5 },
      MEI: { intercept: 0.3, pass: 0.45, attack: 0.25 },
    },
    schemeShift: 0.15,
    chancePerMin: 0.1, goalPerChance: 0.11, homeAdv: 1.08, strengthExp: 1.1,
    schemeAttack: { att: 1.15, def: 0.92 }, schemeDefend: { att: 0.88, def: 1.1 },
    // depois de um passe seu, chance do time fazer o gol (você ganha a assistência)
    passGoalChance: { simple: 0.03, good: 0.08, great: 0.13, stunning: 0.22 },
    assistGoalChance: 0.55,
    speeds: [1, 2, 4], msPerMinute: 260,
  },
  rating: {
    base: 6.0, goal: 1.1, assist: 0.8, passGood: 0.15, passGreat: 0.25, passStunning: 0.4,
    chance: 0.15, fail: -0.35, effort: [-0.2, 0, 0.25], win: 0.2, loss: -0.2,
  },
  relDelta: {
    boss: { effort: [-1, 1, 3], pass: 0.8, wasted: -1.5, fail: -0.5 },
    team: { pass: 0.8, assist: 4, greedyShot: -3, lostBall: -2 },
    fans: { effort: [0, 1, 2], goal: 4, win: 5, draw: 1, loss: -3 },
  },
  star: { max: 100, xpBase: 20, xpPerLevel: 4, xpPerMatch: 2 },
  pay: { },
  season: { promotionSlots: 3, teamsPerDivision: 18, divisionsPerCountry: 4 },
  clubs: { strengthByTier: [[72, 92], [52, 72], [36, 54], [20, 38]] },
  minigame: {
    attempts: 3, effectBarPeriod: 1.1, effectBarTimeout: 2.2,
    pxPerM: 11, gravity: 9.8, rollDecel: 3.2, airDrag: 0.0015, spinAccel: 7.5, windMax: 3.2,
    kick: { base: 7, perPower: 21, loftFrom: 0.45, loft: 12 },
    goalWidth: 7.32, barHeight: 2.44,
    pace: { ballSpeed: [9, 17], startDist: [6, 13], fakeFrom: 35, inertiaFrom: 40 },
    power: { dist: [18, 40], gk: [0.35, 0.85] },
    technique: { dist: [12, 32], gap: [4.0, 1.3] },
    vision: { dist: [14, 38], moveFrom: 20, decoyFrom: 30, radius: 0.55 },
    freekick: { dist: [18, 30], gkFrom: 20, gk: [0.4, 0.85] },
  },
  events: { chancePerMatch: 0.35, bribeChance: 0.02 },
  casino: { minAge: 18, underagePenalty: { boss: 20, fans: 15 } },
  retire: { minAge: 30, forcedAge: 40, slots: 3 },
};
