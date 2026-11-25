// Carrega os scripts do jogo (sem interface) num contexto isolado para os testes.
const fs = require('fs'), path = require('path'), vm = require('vm');
const FILES = ['data/balance.js', 'data/clubs.js', 'data/i18n.js', 'core/rng.js', 'core/state.js',
  'systems/league.js', 'systems/energy.js', 'systems/skills.js', 'systems/progression.js', 'systems/match.js'];
module.exports = function load() {
  const ctx = { console, Math, Date, JSON, Object, Array, Set, Number, String };
  vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, { filename: f });
  return ctx;
};
