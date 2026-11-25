// RNG com semente (mulberry32). O estado fica salvo no GameState para reprodutibilidade.
var RNG = {
  state: 1,
  seed(s) { RNG.state = (s >>> 0) || 1; },
  next() {
    let t = (RNG.state = (RNG.state + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },
  int(a, b) { return a + Math.floor(RNG.next() * (b - a + 1)); },
  range(a, b) { return a + RNG.next() * (b - a); },
  chance(p) { return RNG.next() < p; },
  pick(arr) { return arr[Math.floor(RNG.next() * arr.length)]; },
  gauss(m = 0, sd = 1) {
    let u = 0, v = 0;
    while (u === 0) u = RNG.next();
    while (v === 0) v = RNG.next();
    return m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RNG.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },
  weighted(items, weights) {
    const tot = weights.reduce((s, w) => s + w, 0);
    let r = RNG.next() * tot;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  },
};

var Util = {
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  // mapeia habilidade 0..60 para [min,max]
  skillMap(level, range) { return Util.lerp(range[0], range[1], Util.clamp(level / BALANCE.skills.max, 0, 1)); },
  avg(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; },
  esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  fmt(n) { return Math.round(n).toLocaleString('pt-BR'); },
  fill(tpl, vars) { return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? ''); },
};
