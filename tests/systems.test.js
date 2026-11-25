const test = require('node:test');
const assert = require('node:assert');
const load = require('./load');

const newGame = (G, extra = {}) => G.State.create({ name: 'Teste', gender: 'm', country: 'BR', pos: 'ATA', look: {}, seed: 42, ...extra });

test('RNG com semente é reprodutível', () => {
  const G = load();
  G.RNG.seed(7); const a = [G.RNG.next(), G.RNG.next()];
  G.RNG.seed(7); const b = [G.RNG.next(), G.RNG.next()];
  assert.deepStrictEqual(a, b);
});

test('criação: valores iniciais do balance', () => {
  const G = load(); const g = newGame(G);
  assert.strictEqual(g.player.age, 16);
  assert.strictEqual(g.player.money, 10);
  assert.strictEqual(g.player.energy, 100);
  assert.strictEqual(g.player.contract.wage, 1);
  assert.strictEqual(g.world.clubs[g.player.clubId].tier, 3, 'começa na divisão mais baixa');
  assert.strictEqual(g.player.skills.power, 8 + 3, 'bônus de atacante em força');
});

test('energia: treino custa 40, recuperação 25, reserva abaixo de 45', () => {
  const G = load(); const g = newGame(G);
  assert.ok(G.Energy.canTrain(g));
  G.Energy.spend(g, G.Energy.trainCost(g));
  assert.strictEqual(g.player.energy, 60);
  G.Energy.spend(g, 20);
  assert.strictEqual(G.Energy.isReserve(g), true);
  assert.strictEqual(G.Energy.recover(g), 25);
  assert.strictEqual(g.player.energy, 65);
  G.Energy.spend(g, 500);
  assert.strictEqual(g.player.energy, 0);
});

test('habilidade: estrelas e teto suave em 30', () => {
  const G = load();
  assert.strictEqual(G.Skills.starsFor(0), 3);
  assert.strictEqual(G.Skills.starsFor(1), 2);
  assert.strictEqual(G.Skills.starsFor(2), 1);
  assert.strictEqual(G.Skills.starsFor(null), 0);
  assert.strictEqual(G.Skills.gainFor(10, 3), 3);
  assert.strictEqual(G.Skills.gainFor(10, 1), 1);
  assert.strictEqual(G.Skills.gainFor(30, 2), 0, 'acima de 30 só com 3 estrelas');
  assert.strictEqual(G.Skills.gainFor(30, 3), 3);
  assert.strictEqual(G.Skills.gainFor(59, 3), 1, 'não passa de 60');
});

test('habilidade: declínio após 8 partidas sem treino', () => {
  const G = load(); const g = newGame(G);
  const v0 = g.player.skills.vision;
  for (let i = 0; i < 8; i++) G.Skills.tickDecay(g);
  assert.strictEqual(g.player.skills.vision, v0, 'ainda não caiu');
  G.Skills.tickDecay(g); G.Skills.tickDecay(g);
  assert.strictEqual(g.player.skills.vision, v0 - 1, 'cai 1 a cada 2 partidas depois do limite');
  G.Skills.applyTraining(g, 'vision', 3);
  assert.strictEqual(g.player.sinceTrain.vision, 0);
});

test('pagamento: salário + bônus', () => {
  const G = load(); const g = newGame(G);
  g.player.contract = { wage: 3, goalBonus: 2, assistBonus: 1, matchesLeft: 10 };
  const pay = G.Progression.payment(g, { goals: 2, assists: 1 });
  assert.deepStrictEqual({ ...pay }, { wage: 3, goals: 4, assists: 1, total: 8 });
});

test('Star Rating: sobe de nível ao completar XP', () => {
  const G = load(); const g = newGame(G);
  const need = G.Progression.xpToNext(1);
  assert.strictEqual(G.Progression.addXp(g, need - 1), 0);
  assert.strictEqual(G.Progression.addXp(g, 1), 1);
  assert.strictEqual(g.player.star, 2);
});

test('classificação do passe por distância', () => {
  const G = load();
  assert.strictEqual(G.Match.passClass(10, false), 'simple');
  assert.strictEqual(G.Match.passClass(25, true), 'simple');
  assert.strictEqual(G.Match.passClass(15, false), 'good');
  assert.strictEqual(G.Match.passClass(20, false), 'great');
  assert.strictEqual(G.Match.passClass(31, false), 'stunning');
});

test('tabela da liga: pontos, saldo e ordem', () => {
  const G = load();
  const div = { teams: [1, 2, 3], fixtures: [[{ h: 1, a: 2, r: [2, 0] }], [{ h: 2, a: 3, r: [1, 1] }], [{ h: 3, a: 1, r: [0, 1] }]] };
  const tb = G.League.table(div);
  assert.deepStrictEqual(tb.map(r => r.id), [1, 3, 2]);
  assert.strictEqual(tb[0].pts, 6);
  assert.strictEqual(tb[1].pts, 1);
  assert.strictEqual(tb[0].gf - tb[0].ga, 3);
});

test('calendário: cada time joga 34 vezes, ida e volta', () => {
  const G = load(); const g = newGame(G);
  const div = g.world.divisions[3];
  assert.strictEqual(div.fixtures.length, 34);
  const count = {};
  div.fixtures.forEach(rd => rd.forEach(f => { count[f.h] = (count[f.h] || 0) + 1; count[f.a] = (count[f.a] || 0) + 1; }));
  Object.values(count).forEach(c => assert.strictEqual(c, 34));
});

test('10 partidas simuladas: energia e dinheiro mudam e o nível sobe', () => {
  const G = load(); const g = newGame(G);
  const money0 = g.player.money;
  let goals = 0, games = 0, drained = false;
  for (let i = 0; i < 10; i++) {
    const fx = G.State.nextFixture(g);
    const m = G.Match.create(g, fx, { scheme: 'bal', effort: 2 });
    const e0 = g.player.energy;
    while (!m.done) {
      const r = G.Match.step(g, m);
      let mo = r.moment;
      while (mo) mo = G.Match.resolve(g, m, G.Match.autoResolve(g, m, mo));
    }
    if (g.player.energy < e0) drained = true;
    const s = G.Match.finish(g, m);
    goals += s.score[0] + s.score[1]; games++;
    G.Energy.recover(g);
  }
  assert.ok(g.player.money > money0, 'ganhou dinheiro');
  assert.ok(g.player.star >= 2, 'subiu de nível (nível ' + g.player.star + ')');
  assert.ok(drained, 'energia gasta nas partidas');
  const gpg = goals / games;
  assert.ok(gpg > 1.2 && gpg < 5, 'gols por jogo plausível: ' + gpg.toFixed(2));
});
