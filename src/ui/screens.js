// Telas do jogo. Informação por ícone + barra + número; frases só na ajuda "?" e em pop-ups.
var G = null;   // GameState da carreira aberta

var REL = {
  boss: { icon: '🧑‍🏫', color: '#42a5f5' },
  team: { icon: '🎽', color: '#66bb6a' },
  fans: { icon: '📣', color: '#ffa726' },
};
var SK_COLOR = { pace: '#26c6da', power: '#ef5350', technique: '#ab47bc', vision: '#ffca28', freekick: '#66bb6a' };

var Screens = {
  // ================= MENU =================
  menu() {
    G = null;
    const slots = Save.list();
    UI.show(`
      <div class="menu-bg"><div class="lights"></div></div>
      <div class="menu">
        <div class="logo"><span>⚽</span><h1>${STR.game}</h1></div>
        <div class="slots">${slots.map((g, i) => g ? `
          <div class="slot" onclick="Screens.open(${i})">
            ${UI.avatar(g.player.look, 64, g.player.gender)}
            <div class="slot-info"><b>${Util.esc(g.player.name)}</b>
              <div class="slot-row">${UI.crest(State.club(g), 28)}<span>🎂 ${g.player.age}</span><span class="gold">⭐ ${g.player.star}</span></div></div>
            <button class="slot-del" data-tip="${STR.icons.delete}" onclick="event.stopPropagation();Screens.delSlot(${i})">🗑</button>
          </div>` : `<div class="slot empty" onclick="Screens.create(${i})"><span class="plus">＋</span></div>`).join('')}
        </div>
        <div class="menu-foot">
          <button class="icon-btn" data-tip="Som" onclick="Sound.toggle();Screens.menu()">${Sound.muted() ? '🔇' : '🔊'}</button>
          <button class="icon-btn" data-tip="${STR.icons.fullscreen}" onclick="UI.goFullscreen()">⛶</button>
          <button class="icon-btn locked" data-tip="Recordes">🏆</button>
        </div>
      </div>`, 'menu');
  },
  delSlot(i) { UI.confirm('🗑', () => { Save.remove(i); Screens.menu(); }); },
  open(i) { G = Save.load(i); if (G) { G.slot = i; Screens.hub(); } },

  // ================= CRIAÇÃO =================
  create(slot) {
    const C = Screens._cr = { slot, name: '', gender: 'm', country: 'BR', pos: 'ATA', look: { skin: LOOKS.skin[1], hair: LOOKS.hair[0], boot: LOOKS.boot[1] } };
    const render = () => {
      UI.show(`
        <div class="create">
          <div class="cr-left">
            <div class="cr-avatar">${UI.avatar(C.look, 150, C.gender)}<div class="cr-boot" style="background:${C.look.boot}"></div></div>
            <div id="cr-look" class="cr-look">
              ${['skin', 'hair', 'boot'].map(k => `<div class="look-row"><button onclick="Screens.crLook('${k}',-1)">◄</button>
                <span class="look-sw" style="background:${C.look[k]}">${{ skin: '🙂', hair: '💇', boot: '👟' }[k]}</span><button onclick="Screens.crLook('${k}',1)">►</button></div>`).join('')}
            </div>
          </div>
          <div class="cr-right">
            <div class="cr-name-row">
              <input id="cr-name" maxlength="18" placeholder="✎" value="${Util.esc(C.name)}" oninput="Screens._cr.name=this.value" autocomplete="off">
              <button id="cr-gender" class="icon-btn big" onclick="Screens._cr.gender=Screens._cr.gender==='m'?'f':'m';Screens._crRender()">${C.gender === 'm' ? '♂' : '♀'}</button>
            </div>
            <div id="cr-country" class="flags">${Object.entries(COUNTRIES).map(([k, c]) => `<button class="flag ${C.country === k ? 'on' : ''}" data-tip="${c.name}" onclick="Screens._cr.country='${k}';Screens._crRender()">${c.flag}</button>`).join('')}</div>
            <div id="cr-pos" class="pos-pick">
              <button class="${C.pos === 'ATA' ? 'on' : ''}" data-tip="Atacante" onclick="Screens._cr.pos='ATA';Screens._crRender()">⚽<small>ATA</small></button>
              <button class="${C.pos === 'MEI' ? 'on' : ''}" data-tip="Meia" onclick="Screens._cr.pos='MEI';Screens._crRender()">🔁<small>MEI</small></button>
            </div>
            <div class="cr-actions"><button class="icon-btn" onclick="Screens.menu()">✖</button>
              <button id="cr-ok" class="btn-main" onclick="Screens.crStart()">✔</button></div>
          </div>
        </div>`, 'create');
    };
    Screens._crRender = render;
    render();
  },
  crLook(k, d) {
    const C = Screens._cr, arr = LOOKS[k];
    C.look[k] = arr[(arr.indexOf(C.look[k]) + d + arr.length) % arr.length];
    Screens._crRender();
  },
  crStart() {
    const C = Screens._cr;
    const name = (C.name || '').trim();
    if (!name) { const i = document.getElementById('cr-name'); i.classList.add('shake'); i.focus(); setTimeout(() => i.classList.remove('shake'), 500); return; }
    G = State.create({ name, gender: C.gender, country: C.country, look: { ...C.look }, pos: C.pos });
    G.slot = C.slot;
    Save.write(G);
    UI.goFullscreen();
    Screens.hub();
  },

  // ================= HUB =================
  topBar() {
    const p = G.player, need = Progression.xpToNext(p.star);
    return `<div class="topbar">
      <button class="tb-avatar" onclick="Screens.profile()" data-tip="${STR.icons.profile}">${UI.avatar(p.look, 46, p.gender)}</button>
      <div class="tb-name"><b>${Util.esc(p.name)}</b><button class="gender" onclick="G.player.gender=G.player.gender==='m'?'f':'m';Save.write(G);Screens.hub()">${p.gender === 'm' ? '♂' : '♀'}</button></div>
      <div id="hub-star" class="tb-item" data-tip="${STR.icons.star}"><span class="gold">⭐ ${p.star}</span>${UI.bar(p.xp, need, '#ffd54f', 'star-bar', 'thin')}</div>
      <div id="hub-money" class="tb-item" data-tip="${STR.icons.money}"><span class="money">🪙 ${Util.fmt(p.money)}</span></div>
      <div id="hub-energy" class="tb-item energy" data-tip="${STR.icons.energy}"><span>⚡</span>${UI.bar(p.energy, 100, p.energy < BALANCE.energy.reserveThreshold ? '#ff5252' : '#ffee58', 'energy-bar')}<b>${Math.round(p.energy)}%</b></div>
    </div>`;
  },

  hub(after) {
    if (!G) return Screens.menu();
    const p = G.player, club = State.club(G), fx = State.nextFixture(G);
    const div = State.division(G);
    const home = fx && fx.h === p.clubId, opp = fx && G.world.clubs[home ? fx.a : fx.h];
    const reserve = Energy.isReserve(G);
    const nav = [['train', '🏃', true], ['social', '🤝', false], ['shop', '🛒', false], ['life', '🏠', false], ['career', '📋', false], ['extras', '🎰', false]];
    UI.show(`
      ${Screens.topBar()}
      <div class="hub-body">
        <div id="hub-rels" class="rels">${Object.entries(REL).map(([k, r]) => UI.vbar(p.rel[k], r.color, 'rel-' + k, r.icon, STR.icons[k])).join('')}</div>
        <div class="hub-center">
          <div class="match-card">
            <div class="mc-teams">
              <div class="mc-team">${UI.crest(home ? club : opp, 92)}</div>
              <div class="mc-vs">VS</div>
              <div class="mc-team">${UI.crest(home ? opp : club, 92)}</div>
            </div>
            <div class="mc-info"><span data-tip="${STR.icons.league}">🏆 ${Util.esc(div.name)}</span><span data-tip="${home ? STR.icons.home : STR.icons.away}">${home ? '🏠' : '✈'}</span>
              <span>📅 ${G.world.round + 1}/${League.roundsInSeason(G.world)}</span></div>
            <button id="hub-play" class="btn-main play" onclick="Screens.prematch()">▶</button>
          </div>
          ${reserve ? `<div class="reserve-band">RESERVA</div>` : ''}
        </div>
      </div>
      <div class="nav">${nav.map(([k, i, on]) => `<button id="nav-${k}" class="nav-btn ${on ? '' : 'nav-locked'}" data-tip="${STR.icons[k]}" onclick="${on ? `Screens.${k}()` : `UI.toast('🔒','${STR.icons.locked}')`}">${i}${on ? '' : '<span class="lock">🔒</span>'}</button>`).join('')}</div>`, 'hub');
    if (after) after();
  },

  // ================= PERFIL =================
  profile() {
    const p = G.player, club = State.club(G), C = COUNTRIES[p.country];
    UI.show(`
      ${Screens.topBar()}
      <div class="profile">
        <div class="pf-left">${UI.avatar(p.look, 170, p.gender)}<div class="pf-boot" style="background:${p.look.boot}">👟</div>
          <div class="pf-tags"><span>${C.flag}</span><span>🎂 ${p.age}</span>${UI.crest(club, 40)}<span>${p.pos === 'ATA' ? '⚽' : '🔁'}</span></div></div>
        <div id="pf-skills" class="pf-skills">${SKILLS.map(k => `<div class="sk-row" data-tip="${STR.icons[k]}"><span class="sk-icon">${Drills.icons[k]}</span>${UI.bar(p.skills[k], 60, SK_COLOR[k])}<b>${p.skills[k]}</b></div>`).join('')}</div>
        <div id="pf-stats" class="pf-stats">
          ${[['👕', p.stats.apps, 'apps'], ['⚽', p.stats.goals, 'goals'], ['🅰', p.stats.assists, 'assists'], ['🔁', p.stats.passes, 'passes'], ['🏅', p.stats.motm, 'motm'], ['💎', '🪙 ' + Util.fmt(Progression.marketValue(G)), 'value']]
            .map(([i, v, k]) => `<div class="stat" data-tip="${STR.icons[k]}"><span>${i}</span><b>${v}</b></div>`).join('')}
        </div>
      </div>
      <button class="icon-btn back" onclick="Screens.hub()">◄</button>`, 'profile');
  },

  // ================= TREINO =================
  practice: false,
  train() {
    const p = G.player, cost = Energy.trainCost(G), can = Energy.canTrain(G) || Screens.practice;
    UI.show(`
      ${Screens.topBar()}
      <div class="train">
        ${SKILLS.map(k => `<button class="tcard ${can ? '' : 'off'}" id="tc-${k}" onclick="Screens.startDrill('${k}')" data-tip="${STR.icons[k]}">
          <span class="tc-icon">${Drills.icons[k]}</span>
          <b class="tc-lvl">${p.skills[k]}</b>
          ${UI.bar(p.skills[k], 60, SK_COLOR[k], 'tb-' + k)}
          <span class="tc-stars">${[0, 1, 2].map(i => `<i class="${p.lastStars[k] != null && i < p.lastStars[k] ? 'on' : ''}">★</i>`).join('')}</span>
          <span class="tc-cost ${Screens.practice ? 'free' : Energy.canTrain(G) ? '' : 'low'}">${Screens.practice ? '∞' : '⚡' + cost}</span>
          ${p.skills[k] >= BALANCE.skills.softCap ? `<span class="tc-cap" data-tip="★★★">⚠</span>` : ''}
        </button>`).join('')}
      </div>
      <div class="train-foot">
        <button class="icon-btn back" onclick="Screens.practice=false;Screens.hub()">◄</button>
        <button id="tr-practice" class="icon-btn ${Screens.practice ? 'on' : ''}" data-tip="${STR.icons.practice}" onclick="Screens.practice=!Screens.practice;Screens.train()">🔶</button>
      </div>`, 'train');
  },
  startDrill(k) {
    const practice = Screens.practice;
    if (!practice && !Energy.canTrain(G)) { UI.float('#hub-energy', '⚡', false); UI.toast('⚡', STR.icons.energy); return; }
    const e0 = G.player.energy;
    if (!practice) { Energy.spend(G, Energy.trainCost(G)); Save.write(G); }   // custa energia mesmo se falhar
    const host = UI.show('<div class="mg-host" id="mg-host"></div>', 'minigame').querySelector('#mg-host');
    UI.stage()._screen._stop = () => host._stop && host._stop();
    Drills.run(host, k, G, { practice }, (stars) => {
      const before = G.player.skills[k];
      let gain = 0;
      if (!practice && stars != null) { gain = Skills.applyTraining(G, k, stars); Save.write(G); }
      Screens.train();
      if (!practice) UI.animateBar('#energy-bar', e0, G.player.energy, 100);
      if (gain) UI.animateBar('#tb-' + k, before, G.player.skills[k], 60);
      else if (!practice && stars != null) UI.float('#tc-' + k, before >= BALANCE.skills.softCap && stars > 0 ? '★★★' : '+0', false);
    });
  },

  // ================= PRÉ-JOGO =================
  prematch() {
    const p = G.player, fx = State.nextFixture(G);
    if (!fx) return;
    const H = G.world.clubs[fx.h], A = G.world.clubs[fx.a];
    const weather = Screens._weather = RNG.pick(['☀', '☀', '⛅', '🌧']);
    const reserve = Energy.isReserve(G);
    const render = () => UI.show(`
      ${Screens.topBar()}
      <div class="prematch">
        <div class="pm-teams">
          <div class="pm-team">${UI.crest(H, 110)}${UI.bar(H.strength, 100, H.id === p.clubId ? '#66bb6a' : '#ef5350')}<b>${H.strength}</b></div>
          <div class="pm-mid"><span>🏆</span><span>${fx.h === p.clubId ? '🏠' : '✈'}</span><span>${weather}</span>${reserve ? '<span class="pm-res" data-tip="RESERVA">🪑</span>' : ''}</div>
          <div class="pm-team">${UI.crest(A, 110)}${UI.bar(A.strength, 100, A.id === p.clubId ? '#66bb6a' : '#ef5350')}<b>${A.strength}</b></div>
        </div>
        <div class="pm-controls">
          <div id="pm-scheme" class="seg">${[['att', '⚔', 'attack'], ['bal', '⚖', 'balance'], ['def', '🛡', 'defend']].map(([v, i, t]) => `<button class="${p.scheme === v ? 'on' : ''}" data-tip="${STR.icons[t]}" onclick="G.player.scheme='${v}';Screens._pmRender()">${i}</button>`).join('')}</div>
          <div id="pm-effort" class="hearts" data-tip="${STR.icons.effort}">${[1, 2, 3].map(n => `<button class="${n <= p.effort ? 'on' : ''}" onclick="G.player.effort=${n};Screens._pmRender()">${n <= p.effort ? '❤' : '♡'}</button>`).join('')}</div>
          <button id="pm-play" class="btn-main play" onclick="Screens.startMatch()">▶</button>
        </div>
      </div>
      <button class="icon-btn back" onclick="Screens.hub()">◄</button>`, 'prematch');
    Screens._pmRender = render;
    render();
  },

  // ================= PARTIDA =================
  startMatch() {
    const p = G.player, fx = State.nextFixture(G);
    const m = Match.create(G, fx, { scheme: p.scheme, effort: p.effort });
    m.weather = Screens._weather;
    const MS = Screens.M = { m, speed: 1, timer: null, paused: false, inMoment: false, eStart: p.energy, timeline: [] };
    const H = G.world.clubs[fx.h], A = G.world.clubs[fx.a];
    UI.show(`
      <div class="match">
        <div id="mt-score" class="mt-top">${UI.crest(H, 44)}<b id="mt-sc">0 × 0</b>${UI.crest(A, 44)}<span id="mt-min" class="mt-min">0'</span>
          <button id="mt-speed" class="icon-btn" data-tip="${STR.icons.speed}" onclick="Screens.mSpeed()">⏩1×</button></div>
        <canvas id="mt-pitch" width="900" height="270"></canvas>
        <div id="mt-timeline" class="timeline"></div>
        <div class="mt-bottom">
          <div id="mt-energy" class="mt-energy" data-tip="${STR.icons.energy}">⚡${UI.bar(p.energy, 100, '#ffee58', 'mt-ebar')}<b id="mt-e">${Math.round(p.energy)}%</b></div>
          <div id="mt-scheme" class="seg small">${[['att', '⚔'], ['bal', '⚖'], ['def', '🛡']].map(([v, i]) => `<button data-v="${v}" class="${m.scheme === v ? 'on' : ''}" onclick="Screens.mScheme('${v}')">${i}</button>`).join('')}</div>
          <div id="mt-effort" class="hearts small">${[1, 2, 3].map(n => `<button data-n="${n}" onclick="Screens.mEffort(${n})">${n <= m.effort ? '❤' : '♡'}</button>`).join('')}</div>
          <div class="mt-status" id="mt-status">${m.onPitch ? '🏃' : '🪑'}</div>
        </div>
        <div id="mt-moment" class="mt-moment" hidden></div>
      </div>`, 'match');
    UI.stage()._screen._stop = () => { clearInterval(MS.timer); cancelAnimationFrame(MS.raf); };
    Sound.play('whistle');
    Screens.mPitchAnim();
    Screens.mRun();
  },
  mRun() {
    const MS = Screens.M;
    clearInterval(MS.timer);
    MS.timer = setInterval(Screens.mTick, BALANCE.match.msPerMinute / MS.speed);
  },
  mSpeed() {
    const MS = Screens.M, sp = BALANCE.match.speeds;
    MS.speed = sp[(sp.indexOf(MS.speed) + 1) % sp.length];
    document.getElementById('mt-speed').textContent = '⏩' + MS.speed + '×';
    Screens.mRun();
  },
  mScheme(v) { Screens.M.m.scheme = v; G.player.scheme = v; document.querySelectorAll('#mt-scheme button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); },
  mEffort(n) { Screens.M.m.effort = n; Screens.M.m.perf.effort = n; G.player.effort = n; document.querySelectorAll('#mt-effort button').forEach(b => b.textContent = +b.dataset.n <= n ? '❤' : '♡'); },
  mTick() {
    const MS = Screens.M, m = MS.m;
    if (MS.paused || MS.inMoment || MG.paused) return;
    const r = Match.step(G, m);
    r.events.forEach(Screens.mEvent);
    Screens.mUpdate();
    if (m.minute === 45 && !MS.halfShown) { MS.halfShown = true; return Screens.mHalf(); }
    if (r.moment) return Screens.mMoment(r.moment);
    if (m.done) { clearInterval(MS.timer); setTimeout(Screens.postMatch, 700); }
  },
  mUpdate() {
    const MS = Screens.M, m = MS.m, p = G.player;
    const sc = document.getElementById('mt-sc'); if (!sc) return;
    sc.textContent = m.score[0] + ' × ' + m.score[1];
    document.getElementById('mt-min').textContent = m.minute + "'";
    UI.setBar(document.getElementById('mt-ebar'), p.energy, 100);
    document.getElementById('mt-e').textContent = Math.round(p.energy) + '%';
    document.getElementById('mt-status').textContent = m.onPitch ? '🏃' : m.subbedOff ? '🔄' : '🪑';
  },
  mEvent(e) {
    const icons = { goal: '⚽', save: '🧤', shot: '🎯', card: '🟨', foul: '⚠', half: '⏱', end: '🏁', intercept: '🛡', missIntercept: '💨', pass: '🔁', lost: '❌', enter: '🔼', subOff: '🔽' };
    const el = document.getElementById('mt-timeline'); if (!el) return;
    const d = document.createElement('span');
    d.className = 'tl-ev ' + (e.side === Screens.M.m.mySide ? 'mine-side' : e.side === -1 ? 'neutral' : 'opp-side') + (e.mine ? ' me' : '') + (e.type === 'goal' ? ' goal' : '');
    d.innerHTML = `${icons[e.type] || '•'}<small>${e.min}'</small>`;
    el.appendChild(d); el.scrollLeft = el.scrollWidth;
    if (e.type === 'goal') { Sound.play('goal'); Screens.M.goalFlash = 1.5; Screens.M.ballTarget = e.side === 0 ? 0.97 : 0.03; }
    if (e.type === 'half' || e.type === 'end') Sound.play('whistle');
  },
  // campo estilizado com bola abstrata
  mPitchAnim() {
    const MS = Screens.M, cv = document.getElementById('mt-pitch'), ctx = cv.getContext('2d');
    const H = G.world.clubs[MS.m.fixture.h], A = G.world.clubs[MS.m.fixture.a];
    MS.ball = { x: 0.5, y: 0.5 }; MS.ballTarget = 0.5;
    let last = 0;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      const m = MS.m, W = cv.width, Hh = cv.height;
      if (!MS.inMoment && Math.random() < 0.03) MS.ballTarget = Util.clamp(0.5 + (Math.random() - 0.5) * 0.8, 0.08, 0.92);
      MS.ball.x += (MS.ballTarget - MS.ball.x) * dt * 1.5;
      MS.ball.y += ((0.5 + Math.sin(now / 900) * 0.3) - MS.ball.y) * dt;
      ctx.fillStyle = '#2c8a3e'; ctx.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 10; i += 2) { ctx.fillStyle = '#33964a'; ctx.fillRect(i * W / 10, 0, W / 10, Hh); }
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, W - 12, Hh - 12); ctx.beginPath(); ctx.moveTo(W / 2, 6); ctx.lineTo(W / 2, Hh - 6); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, Hh / 2, 36, 0, 7); ctx.stroke();
      ctx.strokeRect(6, Hh / 2 - 60, 70, 120); ctx.strokeRect(W - 76, Hh / 2 - 60, 70, 120);
      // jogadores abstratos
      const t = now / 1000;
      [[H, 0], [A, 1]].forEach(([c, s]) => {
        for (let i = 0; i < 10; i++) {
          const bx = (s === 0 ? 0.12 : 0.88) + (s === 0 ? 1 : -1) * ((i % 4) * 0.11) + (MS.ball.x - 0.5) * 0.3;
          const by = 0.15 + ((i * 37) % 70) / 100 + Math.sin(t + i) * 0.02;
          ctx.fillStyle = c.c1; ctx.beginPath(); ctx.arc(bx * W, by * Hh, 6, 0, 7); ctx.fill();
          ctx.strokeStyle = c.c2; ctx.lineWidth = 2; ctx.stroke();
        }
      });
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(MS.ball.x * W, MS.ball.y * Hh, 5, 0, 7); ctx.fill();
      if (MS.goalFlash > 0) {
        MS.goalFlash -= dt;
        ctx.globalAlpha = Math.min(1, MS.goalFlash); ctx.font = '90px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⚽', W / 2, Hh / 2); ctx.globalAlpha = 1;
      }
      MS.raf = requestAnimationFrame(frame);
    };
    MS.raf = requestAnimationFrame(frame);
  },
  mHalf() {
    const MS = Screens.M; MS.paused = true;
    const m = MS.m;
    UI.popup(`<div class="pop-icon">⏱</div><div class="half-score">${m.score[0]} × ${m.score[1]}</div>
      <div class="half-energy">⚡${UI.bar(G.player.energy, 100, '#ffee58')}<b>${Math.round(G.player.energy)}%</b></div>
      <div class="seg">${[['att', '⚔'], ['bal', '⚖'], ['def', '🛡']].map(([v, i]) => `<button class="${m.scheme === v ? 'on' : ''}" onclick="Screens.mScheme('${v}');this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${i}</button>`).join('')}</div>
      <button class="btn-main" onclick="UI.closePopup();Screens.M.paused=false">▶</button>`, { locked: true });
  },
  mMoment(moment) {
    const MS = Screens.M, m = MS.m;
    MS.inMoment = true;
    const host = document.getElementById('mt-moment');
    host.hidden = false;
    const my = G.world.clubs[G.player.clubId], opp = G.world.clubs[m.mySide === 0 ? m.fixture.a : m.fixture.h];
    const ctxInfo = { oppStrength: opp.strength, myColors: [my.c1, my.c2], oppColors: [opp.c1, opp.c2] };
    const runOne = (mo) => {
      const n0 = m.events.length;
      const done = (res) => {
        const next = Match.resolve(G, m, res);
        Screens.mUpdate();
        m.events.slice(n0).forEach(Screens.mEvent);
        if (next) return runOne(next);
        host.hidden = true; host.innerHTML = ''; MS.inMoment = false;
        UI.stage()._screen.dataset.help = 'match';
        if (m.done) { clearInterval(MS.timer); setTimeout(Screens.postMatch, 700); }
      };
      if (window.__autoMoments) return setTimeout(() => done(Match.autoResolve(G, m, mo)), 30);
      Moments.run(host, mo.type, G, ctxInfo, done);
      UI.stage()._screen.dataset.help = 'moment';
    };
    runOne(moment);
  },

  // ================= FIM DE JOGO =================
  postMatch() {
    const MS = Screens.M, m = MS.m, p = G.player;
    const relBefore = { ...p.rel }, moneyBefore = p.money, starBefore = p.star, xpBefore = p.xp;
    const s = Match.finish(G, m);
    Save.write(G);
    const H = G.world.clubs[s.fixture.h], A = G.world.clubs[s.fixture.a];
    const name = p.name.split(' ')[0];
    const pool = !s.perf.played ? STR.headlines.bench : s.perf.goals && s.result > 0 ? STR.headlines.goalsWin : s.perf.goals ? STR.headlines.goals : s.perf.assists ? STR.headlines.assist : (s.rating || 0) >= 6.5 ? STR.headlines.good : STR.headlines.bad;
    const headline = Util.fill(RNG.pick(pool), { n: name });
    UI.show(`
      <div class="post">
        <div class="ps-score">${UI.crest(H, 70)}<b>${s.score[0]} × ${s.score[1]}</b>${UI.crest(A, 70)}</div>
        <div class="ps-headline">📰 ${Util.esc(headline)}</div>
        <div class="ps-grid">
          <div id="ps-rating" class="ps-box">
            <div class="ps-stars">${s.rating != null ? UI.stars5(s.rating) : '🪑'}</div><b class="ps-num">${s.rating != null ? s.rating.toFixed(1) : '-'}</b>
            ${s.motm ? `<div class="motm" data-tip="${STR.icons.motm}">🏅</div>` : ''}
            <div class="ps-icons">${[['⚽', s.perf.goals, 'goals'], ['🅰', s.perf.assists, 'assists'], ['🔁', s.passes, 'passes'], ['🎯', s.perf.chances, 'chances']].map(([i, v, k]) => `<span data-tip="${STR.icons[k]}">${i}<b>${v}</b></span>`).join('')}</div>
          </div>
          <div id="ps-rels" class="ps-box rels-h">${Object.entries(REL).map(([k, r]) => `<div class="ps-rel" data-tip="${STR.icons[k]}"><span>${r.icon}</span>${UI.bar(relBefore[k], 100, r.color, 'psr-' + k)}<b>${Math.round(p.rel[k])}</b></div>`).join('')}
            <div class="ps-rel" data-tip="${STR.icons.star}"><span class="gold">⭐${starBefore}</span>${UI.bar(xpBefore, Progression.xpToNext(starBefore), '#ffd54f', 'psr-xp')}<b class="gold">+${s.xp}</b></div>
          </div>
          <div id="ps-pay" class="ps-box pay">
            <div data-tip="${STR.icons.wage}">💵 <b>${s.pay.wage}</b></div>
            <div data-tip="${STR.icons.goalBonus}">⚽×${p.contract.goalBonus} <b>${s.pay.goals}</b></div>
            <div data-tip="${STR.icons.assistBonus}">🅰×${p.contract.assistBonus} <b>${s.pay.assists}</b></div>
            <div class="pay-total" data-tip="${STR.icons.total}">🪙 <b id="ps-total">0</b></div>
          </div>
        </div>
        <button class="btn-main ps-ok" onclick="Screens.backFromMatch()">✔</button>
      </div>`, 'post');
    // animações de causa -> efeito
    setTimeout(() => Object.keys(REL).forEach(k => UI.animateBar('#psr-' + k, relBefore[k], p.rel[k], 100)), 300);
    setTimeout(() => {
      if (s.levels) UI.setBar(document.getElementById('psr-xp'), Progression.xpToNext(starBefore), Progression.xpToNext(starBefore));
      else UI.setBar(document.getElementById('psr-xp'), p.xp, Progression.xpToNext(p.star));
    }, 500);
    let shown = 0;
    const tot = document.getElementById('ps-total');
    const coin = setInterval(() => { if (!tot.isConnected) return clearInterval(coin); shown = Math.min(s.pay.total, shown + Math.max(1, Math.ceil(s.pay.total / 12))); tot.textContent = shown; Sound.play('coin'); if (shown >= s.pay.total) clearInterval(coin); }, 90);
    setTimeout(() => UI.float('#ps-total', '+' + s.pay.total, true), 1100);
    Object.keys(s.decayed).forEach((k, i) => setTimeout(() => UI.toast(Drills.icons[k] + '↓', STR.icons[k] + ' −1'), 1600 + i * 400));
    if (s.levels) setTimeout(() => Screens.levelUp(s.starAfter), 1500);
    void moneyBefore;
  },
  levelUp(level) {
    Sound.play('star');
    const ov = document.createElement('div'); ov.className = 'levelup';
    ov.innerHTML = `<div class="lu-star">⭐</div><div class="lu-num">${level}</div>`;
    UI.stage().appendChild(ov);
    ov.onclick = () => ov.remove();
    setTimeout(() => ov.remove(), 2600);
  },
  backFromMatch() {
    const s = G.lastMatch, e0 = G.player.energy;
    Energy.recover(G);
    Save.write(G);
    Screens.hub(() => {
      UI.animateBar('#energy-bar', e0, G.player.energy, 100);
      if (s && s.season) {
        const champ = G.world.clubs[s.season.champions[G.world.clubs[G.player.clubId].tier]] || null;
        UI.popup(`<div class="pop-icon">🏁</div><div class="season-pos">${s.season.pos}º</div>${champ ? `<div class="row-center">🏆 ${UI.crest(champ, 48)}</div>` : ''}<div class="row-center">🎂 ${G.player.age}</div><button class="btn-main" onclick="UI.closePopup()">✔</button>`);
      }
    });
  },

  // botões ainda bloqueados (próximas fases)
  social() { UI.toast('🔒', STR.icons.locked); },
};
