// Save versionado com 3 slots (localStorage). Autosave após partida, compra e evento.
var Save = {
  key(slot) { return 'rag2_slot_' + slot; },
  write(g) {
    if (!g) return false;
    g.rng = RNG.state;
    try { localStorage.setItem(Save.key(g.slot), JSON.stringify(g)); return true; } catch (e) { return false; }
  },
  read(slot) {
    try {
      const raw = localStorage.getItem(Save.key(slot));
      if (!raw) return null;
      return Save.migrate(JSON.parse(raw));
    } catch (e) { return null; }
  },
  remove(slot) { try { localStorage.removeItem(Save.key(slot)); } catch (e) { /* ignora */ } },
  list() { return [0, 1, 2].map(i => Save.read(i)); },
  // migração entre versões do save
  migrate(g) {
    if (!g || !g.saveVersion) return null;
    // (versão 1 é a atual; futuras migrações entram aqui em sequência)
    g.saveVersion = SAVE_VERSION;
    return g;
  },
  load(slot) {
    const g = Save.read(slot);
    if (g) RNG.seed(g.rng || g.seed);
    return g;
  },
};
