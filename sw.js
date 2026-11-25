// Service worker: guarda os arquivos para o jogo funcionar offline (PWA).
const CACHE = 'rag2-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './src/ui/style.css',
  './src/data/balance.js', './src/data/clubs.js', './src/data/i18n.js', './src/core/rng.js', './src/core/state.js',
  './src/save/save.js', './src/systems/league.js', './src/systems/energy.js', './src/systems/skills.js',
  './src/systems/progression.js', './src/systems/match.js', './src/minigames/engine.js', './src/minigames/training.js',
  './src/match/moments.js', './src/ui/ui.js', './src/ui/screens.js', './src/main.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
