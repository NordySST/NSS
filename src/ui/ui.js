// Base da interface: palco 16:9 em tela cheia, componentes, animações de valor, toque longo, ajuda e som.
var UI = {
  stage() { return document.getElementById('stage'); },
  scale: 1,

  fitStage() {
    const st = UI.stage();
    const vw = window.innerWidth, vh = window.innerHeight;
    UI.scale = Math.min(vw / MG.W, vh / MG.H);
    st.style.transform = `translate(-50%, -50%) scale(${UI.scale})`;
    document.getElementById('rotate').hidden = !(vh > vw * 1.05);
  },

  // tela cheia + paisagem (o navegador pode recusar; tudo bem)
  goFullscreen() {
    const el = document.documentElement;
    try {
      const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen && el.webkitRequestFullscreen();
      if (r && r.catch) r.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* ignora */ } }).catch(() => {});
    } catch (e) { /* ignora */ }
  },

  // troca de tela: conteúdo + botão "?" fixo
  show(html, helpKey) {
    const st = UI.stage();
    if (st._screen && st._screen._stop) st._screen._stop();
    st.innerHTML = `<div class="screen">${html}</div><button class="help-btn ${Help.isNew(helpKey) ? 'pulse' : ''}" id="help-btn" data-tip="${STR.icons.help}">?</button>`;
    st._screen = st.firstElementChild;
    st._screen.dataset.help = helpKey || '';
    st.querySelector('#help-btn').onclick = () => Help.open(st._screen.dataset.help || helpKey);
    return st._screen;
  },

  // ---------- componentes ----------
  bar(v, max, color, id, extraCls = '') {
    return `<div class="bar ${extraCls}" ${id ? `id="${id}"` : ''} data-v="${v}" data-max="${max}"><div class="bar-fill" style="width:${Util.clamp(v / max * 100, 0, 100)}%;background:${color}"></div></div>`;
  },
  vbar(v, color, id, icon, tip) {
    return `<div class="vbar-wrap" ${id ? `id="${id}"` : ''} data-tip="${tip}"><div class="vbar"><div class="vbar-fill" style="height:${Util.clamp(v, 0, 100)}%;background:${color}"></div></div><span class="vbar-icon">${icon}</span></div>`;
  },
  setBar(el, v, max) {
    if (!el) return;
    const f = el.querySelector('.bar-fill, .vbar-fill');
    const pct = Util.clamp(v / (max || 100) * 100, 0, 100) + '%';
    if (f.classList.contains('vbar-fill')) f.style.height = pct; else f.style.width = pct;
  },
  crest(c, size = 56) {
    const s = size, sh = c.shape;
    const path = sh === 'round' ? `<circle cx="50" cy="50" r="46"/>`
      : sh === 'diamond' ? `<path d="M50 4 L96 50 L50 96 L4 50 Z"/>`
      : sh === 'square' ? `<rect x="8" y="8" width="84" height="84" rx="14"/>`
      : `<path d="M10 8 H90 V48 C90 74 70 88 50 96 C30 88 10 74 10 48 Z"/>`;
    return `<svg class="crest" width="${s}" height="${s}" viewBox="0 0 100 100" data-tip="${Util.esc(c.name)}">
      <g fill="${c.c1}" stroke="${c.c2}" stroke-width="6">${path}</g>
      <path d="M30 28 H70 V40 H30Z" fill="${c.c2}" opacity=".85"/>
      <text x="50" y="72" font-size="26" font-weight="900" text-anchor="middle" fill="${c.c2}" font-family="Arial Black, sans-serif">${Util.esc(c.short)}</text></svg>`;
  },
  avatar(look, size = 48, gender = 'm') {
    const s = size, longHair = gender === 'f';
    return `<svg class="avatar" width="${s}" height="${s}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#1d2b3a"/>
      <path d="M18 100 C20 74 34 66 50 66 C66 66 80 74 82 100 Z" fill="#1e88e5"/>
      ${longHair ? `<path d="M26 44 C24 70 30 78 36 80 L64 80 C70 78 76 70 74 44 Z" fill="${look.hair}"/>` : ''}
      <circle cx="50" cy="44" r="22" fill="${look.skin}"/>
      <path d="M28 40 C28 22 40 16 50 16 C62 16 74 22 72 40 C66 30 58 28 50 28 C42 28 34 30 28 40 Z" fill="${look.hair}"/>
      <circle cx="42" cy="46" r="2.6" fill="#222"/><circle cx="58" cy="46" r="2.6" fill="#222"/>
      <path d="M43 55 Q50 60 57 55" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
  },
  stars5(rating) {   // nota 0..10 como 5 estrelas meio-a-meio
    let h = '';
    for (let i = 0; i < 5; i++) {
      const v = rating / 2 - i;
      h += `<span class="star5 ${v >= 1 ? 'full' : v >= 0.5 ? 'half' : ''}">★</span>`;
    }
    return h;
  },
  speedPicker() {
    const k = MG.speedKey();
    return `<div class="speed-pick" data-tip="${STR.icons.speed}">${[['slow', '🐢'], ['normal', '▶'], ['fast', '⏩']].map(([v, i]) =>
      `<button class="${k === v ? 'on' : ''}" onclick="MG.setSpeed('${v}');this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${i}</button>`).join('')}</div>`;
  },

  // ---------- feedback de valor (+3 verde sobe, −2 vermelho desce) ----------
  float(target, text, positive, opts = {}) {
    const st = UI.stage(), el = typeof target === 'string' ? st.querySelector(target) : target;
    if (!el) return;
    const r = el.getBoundingClientRect(), sr = st.getBoundingClientRect();
    const x = (r.left + r.width / 2 - sr.left) / UI.scale, y = (r.top - sr.top) / UI.scale;
    const f = document.createElement('div');
    f.className = 'float ' + (positive ? 'up' : 'down');
    f.textContent = text;
    f.style.left = x + 'px'; f.style.top = (y + (opts.dy || 0)) + 'px';
    st.appendChild(f);
    setTimeout(() => f.remove(), 1600);
  },
  // anima uma barra até o novo valor e mostra o número flutuante
  animateBar(sel, from, to, max, fmt) {
    const el = typeof sel === 'string' ? UI.stage().querySelector(sel) : sel;
    if (!el) return;
    UI.setBar(el, from, max);
    requestAnimationFrame(() => requestAnimationFrame(() => UI.setBar(el, to, max)));
    const d = Math.round(to - from);
    if (d) UI.float(el, (d > 0 ? '+' : '') + (fmt ? fmt(d) : d), d > 0);
  },

  toast(icon, label) {
    const st = UI.stage(), t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = `<span>${icon}</span>${label ? `<small>${Util.esc(label)}</small>` : ''}`;
    st.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 1800);
  },
  popup(html, opts = {}) {
    UI.closePopup();
    const st = UI.stage(), p = document.createElement('div');
    p.className = 'popup-bg'; p.id = 'popup';
    p.innerHTML = `<div class="popup ${opts.cls || ''}">${html}</div>`;
    if (!opts.locked) p.addEventListener('click', e => { if (e.target === p) UI.closePopup(); });
    st.appendChild(p);
    return p;
  },
  closePopup() { const p = document.getElementById('popup'); if (p) p.remove(); },
  confirm(icon, onYes) {
    UI._yes = onYes;
    UI.popup(`<div class="pop-icon">${icon}</div><div class="row-center"><button class="btn-round" onclick="UI.closePopup()">✖</button><button class="btn-round main" onclick="UI.closePopup();UI._yes()">✔</button></div>`);
  },

  // toque longo mostra o nome do ícone
  initLongPress() {
    let timer = null, tip = null;
    const clear = () => { clearTimeout(timer); if (tip) { tip.remove(); tip = null; } };
    document.addEventListener('pointerdown', (e) => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      clear();
      if (!el) return;
      timer = setTimeout(() => {
        const st = UI.stage(), r = el.getBoundingClientRect(), sr = st.getBoundingClientRect();
        tip = document.createElement('div'); tip.className = 'tip'; tip.textContent = el.dataset.tip;
        tip.style.left = ((r.left + r.width / 2 - sr.left) / UI.scale) + 'px';
        tip.style.top = ((r.top - sr.top) / UI.scale - 8) + 'px';
        st.appendChild(tip);
      }, 450);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => document.addEventListener(ev, () => setTimeout(clear, ev === 'pointerup' ? 900 : 0)));
    // no computador, passar o mouse também mostra o nome
    document.addEventListener('mouseover', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && !el.title) el.title = el.dataset.tip; });
  },
};

// ---------- ajuda "?" com balões apontando para os elementos ----------
var Help = {
  seenKey: 'rag2_help_seen',
  isNew(key) { try { return key && !(JSON.parse(localStorage.getItem(Help.seenKey) || '{}')[key]); } catch (e) { return false; } },
  markSeen(key) { try { const s = JSON.parse(localStorage.getItem(Help.seenKey) || '{}'); s[key] = 1; localStorage.setItem(Help.seenKey, JSON.stringify(s)); } catch (e) { /* ignora */ } },
  open(key) {
    const st = UI.stage(), items = STR.help[key] || [];
    Help.markSeen(key);
    MG.paused = true;
    const btn = st.querySelector('#help-btn'); if (btn) btn.classList.remove('pulse');
    const ov = document.createElement('div'); ov.className = 'help-ov';
    const sr = st.getBoundingClientRect();
    let html = '';
    items.forEach(([sel, text]) => {
      const el = st.querySelector(sel);
      if (!el || !el.getClientRects().length) return;
      const r = el.getBoundingClientRect();
      const x = (r.left + r.width / 2 - sr.left) / UI.scale, top = (r.top - sr.top) / UI.scale, bottom = (r.bottom - sr.top) / UI.scale;
      const below = top < MG.H / 2;
      const bx = Util.clamp(x, 130, MG.W - 130);
      html += `<div class="hl" style="left:${(r.left - sr.left) / UI.scale - 4}px;top:${top - 4}px;width:${r.width / UI.scale + 8}px;height:${r.height / UI.scale + 8}px"></div>
        <div class="balloon ${below ? 'below' : 'above'}" style="left:${bx}px;top:${below ? bottom + 14 : top - 14}px">${Util.esc(text)}</div>`;
    });
    const more = STR.more[key];
    ov.innerHTML = html + (more ? `<button class="help-more" id="help-more">📖</button>` : '');
    ov.addEventListener('click', (e) => {
      if (e.target.id === 'help-more') { ov.innerHTML = `<div class="help-page">${Util.esc(more)}</div>`; return; }
      ov.remove(); MG.paused = false;
    });
    st.appendChild(ov);
    // afasta balões que ficaram um em cima do outro
    const placed = [];
    ov.querySelectorAll('.balloon').forEach(bl => {
      let r = Help.rect(bl), guard = 0;
      while (placed.some(p => Help.overlap(p, r)) && guard++ < 12) {
        const dy = bl.classList.contains('above') ? -(r.h + 8) : r.h + 8;
        bl.style.top = (parseFloat(bl.style.top) + dy) + 'px';
        r = Help.rect(bl);
      }
      if (r.y + r.h > MG.H - 4) bl.style.top = (parseFloat(bl.style.top) - (r.y + r.h - MG.H + 4)) + 'px';
      if (r.y < 4) bl.style.top = (parseFloat(bl.style.top) + 4 - r.y) + 'px';
      placed.push(Help.rect(bl));
    });
  },
  rect(el) {
    const sr = UI.stage().getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: (r.left - sr.left) / UI.scale, y: (r.top - sr.top) / UI.scale, w: r.width / UI.scale, h: r.height / UI.scale };
  },
  overlap(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; },
};

// ---------- som simples (Web Audio) e vibração ----------
var Sound = {
  ctx: null,
  muted() { try { return localStorage.getItem('rag2_mute') === '1'; } catch (e) { return false; } },
  toggle() { try { localStorage.setItem('rag2_mute', Sound.muted() ? '0' : '1'); } catch (e) { /* ignora */ } },
  play(kind) {
    if (Sound.muted()) return;
    try {
      Sound.ctx = Sound.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const c = Sound.ctx, now = c.currentTime;
      const tone = (f, t0, dur, type = 'sine', vol = 0.15) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.setValueAtTime(f, now + t0);
        g.gain.setValueAtTime(vol, now + t0); g.gain.exponentialRampToValueAtTime(0.001, now + t0 + dur);
        o.connect(g); g.connect(c.destination); o.start(now + t0); o.stop(now + t0 + dur);
      };
      ({
        kick: () => tone(90, 0, 0.12, 'triangle', 0.3),
        good: () => { tone(660, 0, 0.12); tone(880, 0.1, 0.18); },
        bad: () => { tone(220, 0, 0.2, 'sawtooth', 0.08); },
        star: () => { tone(784, 0, 0.12); tone(988, 0.12, 0.12); tone(1318, 0.24, 0.3); },
        whistle: () => { tone(2100, 0, 0.25, 'sine', 0.1); tone(2100, 0.3, 0.5, 'sine', 0.1); },
        coin: () => { tone(1200, 0, 0.08); tone(1600, 0.07, 0.12); },
        goal: () => { tone(523, 0, 0.15); tone(659, 0.12, 0.15); tone(784, 0.24, 0.4); },
      }[kind] || (() => {}))();
    } catch (e) { /* sem áudio */ }
    if (['goal', 'bad', 'star'].includes(kind) && navigator.vibrate) { try { navigator.vibrate(kind === 'bad' ? 40 : [60, 40, 60]); } catch (e) { /* ignora */ } }
  },
};
