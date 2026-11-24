// Minijogo dos lances de ataque.
const Kick = {
  W: 640, H: 460,
  GOAL_Y: 22, POST_L: 268, POST_R: 372,

  // velocidade dos lances (guardada no navegador)
  SPEEDS: { lenta: 0.35, normal: 0.55, rapida: 0.85 },
  speedKey() { try { return localStorage.getItem('rag_kick_speed') || 'normal'; } catch (e) { return 'normal'; } },
  speed() { return Kick.SPEEDS[Kick.speedKey()] || 0.55; },
  setSpeed(k) { try { localStorage.setItem('rag_kick_speed', k); } catch (e) { /* ignora */ } },
  speedSelect() {
    const cur = Kick.speedKey();
    return `<label class="inline small">Velocidade do lance
      <select id="kick-speed" onchange="Kick.setSpeed(this.value)">${[['lenta', 'Lenta'], ['normal', 'Normal'], ['rapida', 'Rápida']]
        .map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`;
  },

  // distância de um ponto p ao segmento a-b
  segDist(p, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy || 1;
    const t = U.clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / l2, 0, 1);
    return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
  },

  // velocidade da sua corrida depois de tocar a bola (arrancada)
  runSpeed(attrs) { return (1.2 + attrs.velocidade / 100 * 1.6) * 1.45; },

  CR: 70, // raio da bola grande
  MATE_RADIUS: 80, // distância em que o companheiro sai para buscar a bola

  // estado da bola grande no momento do toque, conforme ela chega
  contactBall(kind, bounce) {
    const W = Kick.W, ground = Kick.H - 70;
    if (kind === 'rasteira') {
      const dir = Math.random() < 0.5 ? 1 : -1;
      return { kind, x: dir > 0 ? -Kick.CR : W + Kick.CR, vx: dir * U.rf(3.2, 4.4), h: 0, vh: 0, rot: 0, ground, scale: 1 };
    }
    if (kind === 'alta') return { kind, x: W / 2 + U.rf(-90, 90), vx: U.rf(-0.6, 0.6), h: 300, vh: 0, rot: 0, ground, scale: 1 };
    if (kind === 'quicando' || bounce > 0.6) return { kind: 'quicando', x: W / 2 + U.rf(-60, 60), vx: U.rf(-0.5, 0.5), h: 90 + bounce * 4, vh: 0, rot: 0, ground, scale: 1 };
    return { kind: 'parada', x: W / 2, vx: 0, h: 0, vh: 0, rot: 0, ground, scale: 1 };
  },

  // avança a animação; retorna true se a bola passou e saiu da tela
  stepContact(c, k) {
    c.x += c.vx * k;
    c.rot += c.vx * k / Kick.CR;
    if (c.kind === 'quicando' || c.kind === 'alta') {
      c.vh -= 0.32 * k; c.h += c.vh * k;
      if (c.h <= 0) { c.h = 0; c.vh = Math.abs(c.vh) > 1.5 ? -c.vh * 0.72 : 0; }
      c.rot += 0.01 * k;
      if (c.x < 120 || c.x > Kick.W - 120) c.vx = -c.vx;
    }
    c.scale = 1 + c.h / 900;
    return c.kind === 'rasteira' && (c.x < -Kick.CR - 5 || c.x > Kick.W + Kick.CR + 5);
  },

  drawContactBall(ctx, c) {
    const R = Kick.CR * c.scale, cx = c.x, cy = c.ground - c.h - Kick.CR;
    // gramado e sombra
    ctx.fillStyle = 'rgba(47,138,60,.5)'; ctx.fillRect(0, c.ground, Kick.W, Kick.H - c.ground);
    const sh = Math.max(0.25, 1 - c.h / 400);
    ctx.beginPath(); ctx.ellipse(cx, c.ground + 4, Kick.CR * sh, 12 * sh, 0, 0, 7); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = '#f4f4f4'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    ctx.fillStyle = '#2b2b2b';
    const pent = (x, y, r, a0) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = a0 + i * 2 * Math.PI / 5; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); };
    pent(cx, cy, R * 0.27, c.rot - Math.PI / 2);
    for (let i = 0; i < 5; i++) { const a = c.rot - Math.PI / 2 + i * 2 * Math.PI / 5; pent(cx + Math.cos(a) * R * 0.87, cy + Math.sin(a) * R * 0.87, R * 0.22, a + Math.PI); }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = '#222'; ctx.stroke();
  },

  drawPitch(ctx) {
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? '#2f8a3c' : '#2a7f36';
      ctx.fillRect(0, i * Kick.H / 10, Kick.W, Kick.H / 10);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
    ctx.strokeRect(10, Kick.GOAL_Y, Kick.W - 20, Kick.H);
    ctx.strokeRect(150, Kick.GOAL_Y, 340, 150);
    ctx.strokeRect(245, Kick.GOAL_Y, 150, 50);
    ctx.beginPath(); ctx.arc(320, Kick.GOAL_Y + 105, 3, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(320, Kick.GOAL_Y + 105, 70, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(320, Kick.H + 60, 90, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
    // gol
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(Kick.POST_L, 4, Kick.POST_R - Kick.POST_L, Kick.GOAL_Y - 4);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
    for (let x = Kick.POST_L; x <= Kick.POST_R; x += 8) { ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, Kick.GOAL_Y); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(Kick.POST_L, Kick.GOAL_Y); ctx.lineTo(Kick.POST_L, 4); ctx.lineTo(Kick.POST_R, 4); ctx.lineTo(Kick.POST_R, Kick.GOAL_Y); ctx.stroke();

  },

  dot(ctx, x, y, fill, stroke, label) {
    ctx.beginPath(); ctx.arc(x, y + 3, 11, 0, 7); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = stroke; ctx.stroke();
    if (label) { ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x, y - 15); }
  },

  ball(ctx, x, y) {
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.stroke();
  },

  banner(ctx, text, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, Kick.H / 2 - 30, Kick.W, 60);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(text, Kick.W / 2, Kick.H / 2 + 10);
    ctx.globalAlpha = 1;
  },

  scenario(type, gkOvr, defOvr) {
    const R = U.rf;
    const s = { type, gk: { x: 320, y: 30, ovr: gkOvr }, defenders: [], mates: [], maxTouches: 2 };
    const def = (x, y) => s.defenders.push({ x, y, ox: x, oy: y });
    const mate = (x, y) => s.mates.push({ x, y });
    switch (type) {
      case 'chance':
        s.title = 'Chance na área!'; s.ball = { x: R(220, 420), y: R(170, 220) };
        def(s.ball.x + R(-50, 50), s.ball.y - R(45, 75));
        if (defOvr > 50) def(320 + R(-60, 60), R(80, 110));
        mate(s.ball.x < 320 ? R(400, 470) : R(170, 240), R(110, 160));
        s.maxTouches = 2; break;
      case 'contra':
        s.title = 'Contra-ataque!'; s.ball = { x: R(280, 360), y: 390 };
        mate(R(140, 220), R(200, 250)); mate(R(420, 500), R(180, 240));
        def(R(260, 380), R(270, 310)); def(R(200, 440), R(130, 170));
        s.maxTouches = 3; break;
      case 'falta': {
        s.title = 'Cobrança de falta'; s.ball = { x: R(200, 440), y: R(215, 260) };
        const d = Math.hypot(320 - s.ball.x, Kick.GOAL_Y - s.ball.y);
        const ux = (320 - s.ball.x) / d, uy = (Kick.GOAL_Y - s.ball.y) / d;
        const cx = s.ball.x + ux * 80, cy = s.ball.y + uy * 80;
        for (let k = -1; k <= 1.01; k += 1) def(cx - uy * k * 23, cy + ux * k * 23);
        s.maxTouches = 1; break;
      }
      case 'longe':
        s.title = 'Bola na entrada da área'; s.ball = { x: R(200, 440), y: R(270, 300) };
        def(s.ball.x + R(-40, 40), s.ball.y - 70); def(R(230, 410), R(120, 160)); def(R(200, 440), R(190, 220));
        mate(s.ball.x < 320 ? R(420, 480) : R(160, 220), R(140, 180));
        s.maxTouches = 2; break;
      case 'passe':
        s.title = 'Armação de jogada'; s.ball = { x: R(260, 380), y: 410 };
        mate(R(120, 200), R(260, 300)); mate(R(440, 520), R(250, 290)); mate(R(260, 380), R(160, 200));
        def(R(250, 390), R(320, 350)); def(R(180, 300), R(200, 230)); def(R(340, 460), R(190, 220));
        s.maxTouches = 3; break;
      case 'penalti':
        s.title = 'Pênalti!'; s.ball = { x: 320, y: 120 }; s.maxTouches = 1; break;
    }
    // como a bola chega até você
    const b = s.ball;
    const arrive = {
      chance: ['rasteira', 'alta', 'quicando'], contra: ['parada', 'rasteira'], longe: ['quicando', 'rasteira', 'quicando'],
      passe: ['parada', 'rasteira'], falta: ['parada'], penalti: ['parada'],
    }[type];
    s.arrive = U.pick(arrive);
    if (s.arrive === 'alta') s.from = { x: b.x < 320 ? 615 : 25, y: R(70, 200) };                 // cruzamento
    else if (s.arrive === 'quicando') s.from = { x: b.x + R(-70, 70), y: Math.max(60, b.y - R(70, 110)) }; // rebote
    else if (s.arrive === 'rasteira') {
      const m = s.mates.find(m => m.y > b.y);
      s.from = m ? { x: m.x, y: m.y } : { x: b.x + R(-120, 120), y: Kick.H - 5 };                // passe de trás
    }
    s.setpiece = type === 'falta' || type === 'penalti';
    return s;
  },

  // attrs: { chute, passe, tecnica, velocidade, energia }
  // Fluxo: 1) arraste e solte para mirar e dar força; 2) toque no ponto da bola onde quer bater
  // (lado = efeito, embaixo = bola alta, em cima = rasteira forte). Você controla só o seu jogador:
  // depois de um passe, o companheiro decide sozinho entre finalizar ou devolver a bola para você.
  start(host, sc, attrs, onDone) {
    host.innerHTML = `
      <div class="kick-wrap">
        <div class="kick-head"><b>${U.esc(sc.title)}</b><span id="kick-info"></span></div>
        <canvas id="kick-canvas" width="${Kick.W}" height="${Kick.H}"></canvas>
        <div class="kick-controls">${Kick.speedSelect()}<span id="kick-hint" class="muted small"></span></div>
      </div>`;
    const cv = host.querySelector('#kick-canvas');
    const ctx = cv.getContext('2d');
    const BAR = 26;          // altura do travessão
    const PLAYER_H = 14;     // acima disso a bola passa por cima dos jogadores
    const st = {
      me: { x: sc.ball.x, y: sc.ball.y + 14, run: null },
      ball: { x: (sc.from || sc.ball).x, y: (sc.from || sc.ball).y, z: 0, vx: 0, vy: 0, vz: 0, moving: false },
      arrKind: sc.arrive || 'parada', arr: { t: 0 }, bounce: 0, bt: 0, press: 0, cv: null,
      gk: { ...sc.gk }, defs: sc.defenders.map(d => ({ ...d })), mates: sc.mates.map(m => ({ ...m })),
      phase: sc.arrive && sc.arrive !== 'parada' ? 'arrive' : 'aim', aim: null, aiming: false, shot: null, contactT: 0,
      owner: 'me', holder: null, mateT: 0, touches: 0, passes: 0, spin: 0, lastKicker: 'me',
      over: false, msg: null, msgT: 0,
    };
    const info = host.querySelector('#kick-info');
    const hint = host.querySelector('#kick-hint');
    const updInfo = () => {
      info.textContent = `Toques: ${st.touches}/${sc.maxTouches}`;
      hint.textContent = st.phase === 'arrive' ? { rasteira: 'A bola vem rasteira até você...', alta: 'Cruzamento! A bola vem pelo alto...', quicando: 'A bola sobra quicando...' }[st.arrKind] || ''
        : st.phase === 'aim' && st.owner === 'me' ? 'Arraste para trás a partir da bola e solte para mirar. Quanto mais longe, mais força.' + (sc.setpiece ? '' : ' Não demore: a marcação chega!')
        : st.phase === 'contact' ? 'Toque no ponto da bola onde quer bater: lado = efeito, embaixo = bola alta, em cima = rasteira forte. Fora da bola = chute mascado.'
        : st.owner === 'mate' ? 'O companheiro está com a bola. Você se desloca para receber.' : '';
    };
    updInfo();

    const toLocal = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * Kick.W / r.width, y: (e.clientY - r.top) * Kick.H / r.height };
    };
    cv.addEventListener('pointerdown', (e) => {
      if (st.over) return;
      if (st.phase === 'contact') {
        const p = toLocal(e), c = st.cv;
        const R = Kick.CR * c.scale;
        const dx = (p.x - c.x) / R, dy = (p.y - (c.ground - c.h - Kick.CR)) / R, d = Math.hypot(dx, dy);
        lockContact({ x: d > 1 ? dx / d : dx, y: d > 1 ? dy / d : dy, h: c.h, mishit: d > 1.12 });
        return;
      }
      if (st.phase !== 'aim' || st.owner !== 'me' || st.ball.moving) return;
      cv.setPointerCapture(e.pointerId);
      st.aiming = true; st.aim = toLocal(e);
    });
    cv.addEventListener('pointermove', (e) => { if (st.aiming) st.aim = toLocal(e); });
    cv.addEventListener('pointerup', (e) => {
      if (!st.aiming) return;
      st.aiming = false;
      const p = toLocal(e);
      const dx = st.ball.x - p.x, dy = st.ball.y - p.y;
      const pow = Math.min(Math.hypot(dx, dy), 160) / 160;
      if (pow < 0.08) return;
      st.shot = { ang: Math.atan2(dy, dx), pow };
      st.cv = Kick.contactBall(st.arrKind, st.bounce);
      st.contactT = 0; st.phase = 'contact'; updInfo();
    });

    const passTarget = (from, ang) => st.mates.find(m => {
      const vx = m.x - from.x, vy = m.y - from.y;
      if (Math.hypot(vx, vy) < 5) return false;
      const a = Math.atan2(vy, vx);
      return Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang))) < 0.25;
    });
    const isPassAim = (from, ang) => st.mates.some(m => {
      const vx = m.x - from.x, vy = m.y - from.y;
      if (Math.hypot(vx, vy) < 5) return false;
      const a = Math.atan2(vy, vx);
      return Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang))) < 0.25;
    });

    function lockContact(c) {
      const s = st.shot, b = st.ball;
      const pass = isPassAim(b, s.ang);
      const skill = pass ? attrs.passe : attrs.chute;
      const volley = Math.min(1.5, c.h / 120); // bater com a bola no ar: mais força, menos controle
      let sd = (0.015 + (1 - attrs.tecnica / 100) * 0.06 + (1 - skill / 100) * 0.05 + (1 - attrs.energia / 100) * 0.04) * (0.6 + s.pow * 0.6) * (1 + volley * 0.7);
      let pow = s.pow;
      if (c.mishit) { pow *= 0.45; sd += 0.25; st.msg = 'Pegou mal na bola!'; st.msgT = 0; }
      const ang = s.ang + U.gauss(0, sd);
      const drive = Math.max(0, -c.y);   // em cima: mais rápida e rasteira
      const lift = Math.max(0, c.y);     // embaixo: sobe
      const sp = (5 + pow * (8 + attrs.chute / 100 * 6)) * (1 + drive * 0.12) * (1 - lift * 0.18) * (1 + volley * 0.08);
      b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp;
      b.z = Math.min(b.z, 4);
      b.vz = lift * (2.5 + pow * 5.5) + (drive ? 0 : 0.4) + volley * 1.2;
      b.moving = true;
      st.spin = -c.x * 3; st.bounce = 0;
      st.mates.forEach(m => { m.chasing = false; });
      st.kickFrom = { x: b.x, y: b.y }; st.lastKicker = 'me';
      st.touches++; st.phase = 'flight'; st.owner = null;
      // você corre para um espaço depois de tocar a bola
      st.me.run = pickRun(passTarget(b, s.ang));
      updInfo();
    }

    // escolhe um espaço livre mais perto do gol para o seu jogador se deslocar
    // se o passe é para um companheiro, você corre para um espaço à frente dele
    function pickRun(ref) {
      let best = null, bestScore = -1e9;
      const yMax = ref ? Math.max(90, ref.y - 50) : Math.max(100, st.me.y - 40);
      const yMin = ref ? Math.max(80, ref.y - 190) : Math.max(90, st.me.y - 170);
      for (let i = 0; i < 30; i++) {
        const x = U.rf(150, 490), y = U.rf(Math.min(yMin, yMax - 10), yMax);
        const free = Math.min(...st.defs.map(d => Math.hypot(d.x - x, d.y - y)), 200);
        const score = free * 1.2 - Math.hypot(x - 320, y - 60) * 0.6 - Math.hypot(x - st.me.x, y - st.me.y) * 0.2;
        if (score > bestScore) { bestScore = score; best = { x, y }; }
      }
      return best;
    }

    const finish = (result, msg) => {
      if (st.over) return;
      st.over = true; st.msg = msg; st.msgT = 0; st.phase = 'over';
      setTimeout(() => { cancelAnimationFrame(st.raf); onDone({ result, passes: st.passes }); }, 1900);
    };

    const pressure = (p) => Math.min(...st.defs.map(d => Math.hypot(d.x - p.x, d.y - p.y)), 300);
    const PASS_SP = 8;
    // onde você vai estar quando um passe saindo de "from" chegar até você
    function leadPoint(from) {
      const me = st.me, mySp = Kick.runSpeed(attrs);
      let lead = { x: me.x, y: me.y - 10 };
      for (let k = 0; k < 4; k++) {
        const t = Math.hypot(lead.x - from.x, lead.y - from.y) / (PASS_SP * 0.9);
        if (!me.run) break;
        const rx = me.run.x - me.x, ry = me.run.y - me.y, rd = Math.hypot(rx, ry);
        const go = Math.min(rd, mySp * t);
        lead = rd > 1 ? { x: me.x + rx / rd * go, y: me.y + ry / rd * go - 10 } : { x: me.x, y: me.y - 10 };
      }
      return lead;
    }

    // o companheiro (robô) decide o que fazer com a bola
    function mateDecide() {
      const m = st.holder;
      const blocked = st.defs.some(d => {
        const t = ((d.x - m.x) * (320 - m.x) + (d.y - m.y) * (Kick.GOAL_Y - m.y)) / (Math.hypot(320 - m.x, Kick.GOAL_Y - m.y) ** 2);
        if (t < 0 || t > 1) return false;
        const px = m.x + t * (320 - m.x), py = m.y + t * (Kick.GOAL_Y - m.y);
        return Math.hypot(d.x - px, d.y - py) < 24;
      });
      const dGoal = Math.hypot(320 - m.x, Kick.GOAL_Y - m.y);
      const canReturn = st.touches < sc.maxTouches;
      const minDist = (p) => Math.min(...st.defs.map(d => Math.hypot(d.x - p.x, d.y - p.y)), 300);
      const pressure = minDist(m), meOpen = minDist(st.me);
      // pesos de cada opção conforme a situação
      let wShoot = dGoal < 130 ? 3 : dGoal < 200 ? 1.6 : dGoal < 280 ? 0.5 : 0.12;
      if (blocked) wShoot *= 0.35;
      // tabela só faz sentido se você estiver à frente dele (mais perto do gol), perto,
      // livre de marcação e com a linha do passe desimpedida
      const L = leadPoint(m);   // ponto onde a bola encontraria você
      const meGoal = Math.hypot(320 - L.x, Kick.GOAL_Y - L.y);
      const meDist = Math.hypot(L.x - m.x, L.y - m.y);
      const ahead = L.y < m.y - 30 && meGoal < dGoal - 30;
      const laneClear = !st.defs.some(d => Kick.segDist(d, m, L) < 22);
      const tabOk = canReturn && ahead && meDist < 230 && meDist > 40 && minDist(L) > 45 && laneClear;
      const wTab = tabOk ? 0.9 + (dGoal - meGoal) / 80 + (minDist(L) > 80 ? 0.5 : 0) : 0;
      void meOpen;
      const wCarry = (m.carries || 0) < 2 && dGoal > 110 ? (pressure > 55 ? 1.2 : 0.3) : 0;
      // se você ainda está correndo para se posicionar, ele pode segurar a bola um pouco
      const runAhead = st.me.run && st.me.run.y < m.y - 30;
      const wHold = !tabOk && canReturn && runAhead && pressure > 40 && (m.holds || 0) < 3 ? 3 : 0;
      const choice = U.weighted(['shoot', 'tab', 'carry', 'hold'], [wShoot, wTab, wCarry, wHold]);
      if (choice === 'hold') { m.holds = (m.holds || 0) + 1; st.mateT = 20; return; }
      if (choice === 'carry') {
        m.carries = (m.carries || 0) + 1;
        const ang = Math.atan2(90 - m.y, 320 - m.x) + U.rf(-0.5, 0.5);
        st.mateCarry = { n: U.ri(35, 60), dx: Math.cos(ang), dy: Math.sin(ang) };
        st.mateT = 25; st.msg = 'O companheiro avança com a bola'; st.msgT = 0;
        return;
      }
      const shoot = choice === 'shoot';
      const b = st.ball;
      b.x = m.x; b.y = m.y - 12; b.z = 0;
      st.kickFrom = { x: b.x, y: b.y }; st.lastKicker = 'mate'; st.spin = 0;
      if (shoot) {
        const tx = U.rf(Kick.POST_L + 8, Kick.POST_R - 8), sp = 11 + U.rf(0, 3);
        const ang = Math.atan2(Kick.GOAL_Y - b.y, tx - b.x) + U.gauss(0, 0.07);
        b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp; b.vz = blocked ? 3 : 0.4;
        st.msg = 'O companheiro finaliza!'; st.msgT = 0;
      } else {
        // passe na frente: onde você vai estar quando a bola chegar
        const sp = PASS_SP;
        const lead = leadPoint(b);
        const laneBlocked = st.defs.some(df => Math.hypot(df.x - (b.x + lead.x) / 2, df.y - (b.y + lead.y) / 2) < 30);
        const ang = Math.atan2(lead.y - b.y, lead.x - b.x) + U.gauss(0, 0.05);
        b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp; b.vz = laneBlocked ? 3.2 : 0;
        st.lastPassLofted = laneBlocked;
        st.msg = 'Tabela!'; st.msgT = 0;
      }
      b.moving = true; st.owner = null; st.holder = null; st.phase = 'flight'; updInfo();
    }

    function physics() {
      const b = st.ball, g = st.gk;
      // seu jogador corre para o espaço
      // quando a bola vem do companheiro, você vai ao encontro dela
      if (!st.over && st.lastKicker === 'mate' && b.moving && st.phase === 'flight' && b.vy !== 0) {
        // vai para o ponto da trajetória da bola mais próximo de você
        const v2 = b.vx * b.vx + b.vy * b.vy;
        const t = Math.max(0, ((st.me.x - b.x) * b.vx + (st.me.y - 14 - b.y) * b.vy) / v2);
        st.me.run = { x: b.x + b.vx * t, y: b.y + b.vy * t + 14 };
      }
      if (st.me.run && !st.over) {
        const sp = Kick.runSpeed(attrs);
        const dx = st.me.run.x - st.me.x, dy = st.me.run.y - st.me.y, d = Math.hypot(dx, dy);
        if (d > 1) { st.me.x += dx / d * Math.min(sp, d); st.me.y += dy / d * Math.min(sp, d); }
      }
      // goleiro
      const gkSpeed = 1.4 + g.ovr / 100 * 2.4;
      let tx = b.x;
      if (b.moving && b.vy < 0) tx = b.x + b.vx * ((b.y - g.y) / -b.vy);
      tx = U.clamp(tx, Kick.POST_L + 4, Kick.POST_R - 4);
      if (!st.over) g.x += U.clamp(tx - g.x, -gkSpeed, gkSpeed);

      // a bola chegando até você
      if (st.phase === 'arrive' && !st.over) {
        const A = st.arr, kind = st.arrKind, from = sc.from, to = sc.ball;
        const T = { rasteira: 75, alta: 95, quicando: 80 }[kind];
        A.t++;
        const u = Math.min(1, A.t / T);
        const e = kind === 'rasteira' ? 1 - (1 - u) * (1 - u) : u;
        b.x = from.x + (to.x - from.x) * e; b.y = from.y + (to.y - from.y) * e;
        b.z = kind === 'alta' ? 4 * 75 * u * (1 - u) : kind === 'quicando' ? Math.abs(Math.sin(u * Math.PI * 2)) * 30 * (1 - u * 0.5) : 0;
        if (u >= 1) {
          st.phase = 'aim'; st.bounce = kind === 'alta' ? 16 : kind === 'quicando' ? 10 : 0; st.bt = 0;
          if (kind === 'rasteira') st.arrKind = 'rasteira';
          updInfo();
        }
        return;
      }
      // bola quicando no seu pé enquanto você mira
      if (st.phase === 'aim' || st.phase === 'contact') {
        if (st.bounce > 0.6) { st.bt++; b.z = st.bounce * Math.abs(Math.sin(st.bt * 0.11)); st.bounce *= 0.994; }
        else { b.z = 0; st.bounce = 0; }
      }
      if (st.phase === 'aim' && st.owner === 'me' && !sc.setpiece && !st.over) {
        st.press++;
        if (st.press > 150 && st.defs.length) {
          const near = st.defs.reduce((a, d) => (Math.hypot(d.x - st.me.x, d.y - st.me.y) < Math.hypot(a.x - st.me.x, a.y - st.me.y) ? d : a));
          near.x += U.clamp(st.me.x - near.x, -0.8, 0.8); near.y += U.clamp(st.me.y - 10 - near.y, -0.8, 0.8);
          if (Math.hypot(near.x - b.x, near.y - b.y) < 16) return finish('blocked', 'Desarmado! Você demorou.');
        }
      }
      // bola com o companheiro: marcação aperta e ele decide
      if (st.owner === 'mate' && !st.over) {
        const m = st.holder;
        const near = st.defs.reduce((a, d) => (Math.hypot(d.x - m.x, d.y - m.y) < Math.hypot(a.x - m.x, a.y - m.y) ? d : a), st.defs[0]);
        if (near) { near.x += U.clamp(m.x - near.x, -0.7, 0.7); near.y += U.clamp(m.y - near.y, -0.7, 0.7); }
        if (st.mateCarry && st.mateCarry.n > 0) {
          m.x = U.clamp(m.x + st.mateCarry.dx * 1.5, 30, Kick.W - 30); m.y = Math.max(70, m.y + st.mateCarry.dy * 1.5);
          b.x = m.x; b.y = m.y - 12; st.mateCarry.n--;
          if (near && Math.hypot(near.x - m.x, near.y - m.y) < 16) {
            if (Math.random() < 0.3) return finish('blocked', 'A defesa roubou a bola do companheiro!');
            near.x -= st.mateCarry.dx * 20; near.y -= 12;   // ele passa pelo marcador
          }
          return;
        }
        st.mateT++;
        if (st.mateT > (pressure(m) < 40 ? 35 : 55)) mateDecide();
        return;
      }
      if (!b.moving) return;
      const sp = Math.hypot(b.vx, b.vy);
      if (st.spin && sp > 1) {
        const k = st.spin * 0.045 * Math.min(sp, 12) / 12;
        b.vx += -b.vy / sp * k; b.vy += b.vx / sp * k;
      }
      b.x += b.vx; b.y += b.vy;
      b.z += b.vz; b.vz -= 0.22;
      if (b.z <= 0) { b.z = 0; b.vz = Math.abs(b.vz) > 1.2 ? -b.vz * 0.35 : 0; }
      const fr = b.z > 0 ? 0.992 : 0.983;
      b.vx *= fr; b.vy *= fr;
      if (st.over) { if (sp < 0.2 && b.z === 0) b.moving = false; return; }

      const low = b.z < PLAYER_H;
      // defensores reagem e bloqueiam bola baixa
      for (const d of st.defs) {
        const dist = Math.hypot(b.x - d.x, b.y - d.y);
        if (dist < 140) { d.x += U.clamp(b.x - d.x, -0.9, 0.9); d.y += U.clamp(b.y - d.y, -0.5, 0.5); }
        if (dist < 17 && low) {
          b.vx = -b.vx * 0.35 + U.rf(-1, 1); b.vy = -b.vy * 0.35;
          return finish('blocked', st.lastKicker === 'me' ? 'Bloqueado pela defesa!' : 'A defesa cortou!');
        }
      }
      const far = Math.hypot(b.x - st.kickFrom.x, b.y - st.kickFrom.y) > 25;
      // companheiros ficam na posição até a bola entrar no raio deles; aí vão ao encontro dela
      if (st.lastKicker === 'me' && b.z < 30 && far) {
        for (const m of st.mates) {
          if (!m.chasing && Math.hypot(b.x - m.x, b.y - m.y) < Kick.MATE_RADIUS) m.chasing = true;
          if (m.chasing) {
            const v2 = b.vx * b.vx + b.vy * b.vy || 1;
            const t = U.clamp(((m.x - b.x) * b.vx + (m.y - b.y) * b.vy) / v2, 0, 12);
            const tx = b.x + b.vx * t, ty = b.y + b.vy * t + 12;
            const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
            if (d > 1) { m.x += dx / d * Math.min(2, d); m.y += dy / d * Math.min(2, d); }
          }
        }
      }
      // companheiro recebe o seu passe
      if (st.lastKicker === 'me' && b.z < 18 && far) {
        for (const m of st.mates) {
          if (Math.hypot(b.x - m.x, b.y - m.y) < 18) {
            b.moving = false; b.vx = b.vy = b.vz = 0; b.z = 0; b.x = m.x; b.y = m.y - 12;
            st.passes++; st.owner = 'mate'; st.holder = m; st.mateT = 0; st.phase = 'mate'; st.mateCarry = null;
            st.mates.forEach(x => { x.chasing = false; });
            st.msg = 'Passe certo!'; st.msgT = 0; updInfo();
            return;
          }
        }
      }
      // você recebe a devolução
      if (st.lastKicker === 'mate' && b.z < 18 && far && Math.hypot(b.x - st.me.x, b.y - st.me.y + 14) < 24) {
        b.moving = false; b.vx = b.vy = b.vz = 0; b.z = 0; b.x = st.me.x; b.y = st.me.y - 14;
        st.me.run = null; st.owner = 'me'; st.phase = 'aim'; st.press = 0;
        st.arrKind = st.lastPassLofted ? 'quicando' : 'rasteira';
        st.bounce = st.lastPassLofted ? 10 : 0; st.bt = 0;
        updInfo();
        return;
      }
      // gol / defesa / trave / fora
      if (b.y <= g.y + 6 && b.y >= g.y - 8 && b.vy < 0 && b.z < 30) {
        const reach = 16 + g.ovr / 100 * 9;
        if (Math.abs(b.x - g.x) < reach && !(sp > 12 && Math.random() < (sp - 12) * 0.07)) {
          b.vy = -b.vy * 0.4; b.vx += U.rf(-2, 2);
          return finish('saved', 'Defesa do goleiro!');
        }
      }
      if (b.y <= Kick.GOAL_Y) {
        const mine = st.lastKicker === 'me';
        if (b.z >= BAR && b.x > Kick.POST_L - 10 && b.x < Kick.POST_R + 10) return finish('miss', 'Por cima do gol!');
        if (Math.abs(b.x - Kick.POST_L) < 5 || Math.abs(b.x - Kick.POST_R) < 5 || Math.abs(b.z - BAR) < 2) {
          b.vy = -b.vy * 0.6; b.vx = -b.vx * 0.6;
          return finish('miss', 'Na trave!');
        }
        if (b.x > Kick.POST_L && b.x < Kick.POST_R) {
          b.vx *= 0.3; b.vy *= 0.3;
          return finish(mine ? 'goal' : 'assist', mine ? 'GOOOL!' : 'GOL! Assistência sua!');
        }
        return finish('miss', 'Para fora!');
      }
      if (b.x < 0 || b.x > Kick.W || b.y > Kick.H) return finish('miss', 'Bola perdida pela linha.');
      if (sp < 0.25 && b.z === 0) {
        b.moving = false;
        finish('miss', 'A bola parou. A defesa recupera.');
      }
    }

    function drawContact() {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, Kick.W, Kick.H);
      const k = (st.rt || 1) * Kick.speed() / 0.55;
      const out = Kick.stepContact(st.cv, k);
      Kick.drawContactBall(ctx, st.cv);
      ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText({ parada: 'Toque na bola onde quer bater', rasteira: 'A bola vem rolando: toque nela!', quicando: 'A bola está quicando: toque nela!', alta: 'Bola alta: toque nela!' }[st.cv.kind], Kick.W / 2, 30);
      ctx.fillStyle = '#cfe3f5'; ctx.font = '12px sans-serif';
      ctx.fillText('em cima = rasteira forte  •  embaixo = bola alta  •  lado esquerdo = curva p/ direita  •  lado direito = curva p/ esquerda', Kick.W / 2, Kick.H - 14);
      if (out) finish('miss', 'A bola passou por você!');
    }

    function draw() {
      Kick.drawPitch(ctx);
      const dot = (x, y, f, k, l) => Kick.dot(ctx, x, y, f, k, l);
      st.defs.forEach(d => dot(d.x, d.y, '#d84343', '#7a1010'));
      st.mates.forEach(m => dot(m.x, m.y, '#2f6fd6', '#0f2f66'));
      dot(st.gk.x, st.gk.y, '#f2c12e', '#6b5200');
      dot(st.me.x, st.me.y, '#ffffff', '#1d4ed8', 'VOCÊ');
      const b = st.ball;
      // sombra + bola (sobe com a altura)
      ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 6, 3, 0, 0, 7); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fill();
      const r = 6 + b.z * 0.08;
      ctx.beginPath(); ctx.arc(b.x, b.y - b.z, r, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.stroke();

      if (st.aiming && st.aim) {
        const dx = b.x - st.aim.x, dy = b.y - st.aim.y;
        const pow = Math.min(Math.hypot(dx, dy), 160) / 160;
        const ang = Math.atan2(dy, dx);
        ctx.setLineDash([6, 6]); ctx.lineWidth = 3;
        ctx.strokeStyle = isPassAim(b, ang) ? '#8fd3ff' : '#ffe27a';
        ctx.beginPath(); ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + Math.cos(ang) * (40 + pow * 240), b.y + Math.sin(ang) * (40 + pow * 240));
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(14, Kick.H - 30, 124, 16);
        ctx.fillStyle = pow > 0.85 ? '#ff6b6b' : '#7cff8a'; ctx.fillRect(16, Kick.H - 28, 120 * pow, 12);
      }
      if (st.phase === 'aim' && st.owner === 'me' && !sc.setpiece && !st.over) {
        const left = Math.max(0, 1 - st.press / 230);
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(Kick.W - 138, Kick.H - 30, 124, 16);
        ctx.fillStyle = left < 0.35 ? '#ff6b6b' : '#ffe27a'; ctx.fillRect(Kick.W - 136, Kick.H - 28, 120 * left, 12);
        ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('Tempo', Kick.W - 144, Kick.H - 18);
      }
      if (st.phase === 'contact') { drawContact(); return; }
      if (st.msg) {
        st.msgT += st.rt || 1;
        Kick.banner(ctx, st.msg, Math.max(0, 1 - st.msgT / (st.over ? 120 : 50)));
        if (!st.over && st.msgT > 50) st.msg = null;
      }
    }

    Kick._st = st;
    function loop(now) {
      // física em passos fixos de 1/60 s, multiplicados pela velocidade escolhida;
      // funciona igual em telas de 60, 90 ou 120 Hz
      const dt = Math.min(50, now - (st.last || now)); st.last = now;
      st.rt = dt / (1000 / 60);
      st.acc = (st.acc || 0) + st.rt * Kick.speed();
      while (st.acc >= 1) { physics(); st.acc -= 1; }
      draw();
      st.raf = requestAnimationFrame(loop);
    }
    st.raf = requestAnimationFrame(loop);
  },
};
