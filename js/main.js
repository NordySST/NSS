// Estado global, interface base e salvamento
let G = null;
const SAVE_KEYS = { player: 'rag_save_player', manager: 'rag_save_manager' };

const UI = {
  app() { return document.getElementById('app'); },
  screen(html) { UI.app().innerHTML = html; window.scrollTo(0, 0); },
  modal(html, opts = {}) {
    UI.closeModal();
    const d = document.createElement('div');
    d.className = 'modal-bg'; d.id = 'modal';
    d.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}">${html}</div>`;
    if (!opts.locked) d.addEventListener('click', e => { if (e.target === d) UI.closeModal(); });
    document.body.appendChild(d);
  },
  closeModal() { const m = document.getElementById('modal'); if (m) m.remove(); },
  toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
  },
  badge(t) { return `<span class="badge" style="background:${t.c1};color:${t.c2}">${t.short}</span>`; },
  bar(v, max = 100, cls = '') {
    return `<div class="bar ${cls}"><div style="width:${U.clamp(v / max * 100, 0, 100)}%"></div></div>`;
  },
  ovrCls(o) { return o >= 80 ? 'o-elite' : o >= 70 ? 'o-good' : o >= 55 ? 'o-mid' : 'o-low'; },
  tableHTML(w, league, highlight) {
    const tb = Data.table(league);
    const n = tb.length;
    return `<table class="tbl league"><thead><tr><th>#</th><th class="l">Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th><th class="hide-sm">Forma</th></tr></thead><tbody>` +
      tb.map((r, i) => {
        const t = w.teams[r.id];
        const zone = (league.tier > 0 && i < 2) ? 'up' : (league.tier < 2 && i >= n - 2) ? 'down' : '';
        return `<tr class="${r.id === highlight ? 'me' : ''} ${zone}"><td>${i + 1}</td><td class="l">${UI.badge(t)} ${U.esc(t.name)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td><td class="hide-sm form">${r.form.slice(-5).map(f => `<i class="f-${f}">${f}</i>`).join('')}</td></tr>`;
      }).join('') + '</tbody></table>';
  },
};

const Save = {
  save() {
    if (!G) return;
    try {
      G._uid = U._id;
      localStorage.setItem(SAVE_KEYS[G.mode], JSON.stringify(G));
    } catch (e) { console.warn('Falha ao salvar', e); }
  },
  load(mode) {
    try {
      const raw = localStorage.getItem(SAVE_KEYS[mode]);
      if (!raw) return null;
      const g = JSON.parse(raw);
      U._id = g._uid || 100000;
      return g;
    } catch (e) { return null; }
  },
  has(mode) { try { return !!localStorage.getItem(SAVE_KEYS[mode]); } catch (e) { return false; } },
  del(mode) { try { localStorage.removeItem(SAVE_KEYS[mode]); } catch (e) { /* ignore */ } },
};

const Menu = {
  show() {
    G = null;
    const hp = Save.has('player'), hm = Save.has('manager');
    UI.screen(`
      <div class="menu">
        <div class="logo"><span class="ball">⚽</span><h1>Rumo à Glória</h1><p>Futebol de carreira — escolha seu caminho</p></div>
        <div class="menu-cards">
          <div class="mcard">
            <div class="mc-icon">👟</div>
            <h2>Carreira de Jogador</h2>
            <p>Crie seu atleta, treine, decida os lances dentro de campo, cuide da vida pessoal e chegue ao topo.</p>
            <button class="btn primary" onclick="PM.newGame()">Nova carreira</button>
            ${hp ? `<button class="btn" onclick="PM.continue()">Continuar</button>` : ''}
          </div>
          <div class="mcard">
            <div class="mc-icon">📋</div>
            <h2>Carreira de Técnico</h2>
            <p>Assuma um clube, monte o elenco, defina a tática, negocie transferências e cuide das finanças.</p>
            <button class="btn primary" onclick="MM.newGame()">Nova carreira</button>
            ${hm ? `<button class="btn" onclick="MM.continue()">Continuar</button>` : ''}
          </div>
        </div>
        <p class="muted small center">O progresso é salvo automaticamente no navegador.</p>
      </div>`);
  },
};

window.addEventListener('DOMContentLoaded', Menu.show);
