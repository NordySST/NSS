// Minijogo de lance: arraste para trás a partir da bola (estilingue) e solte para chutar/passar.
const Kick = {
  W: 640, H: 460,
  GOAL_Y: 22, POST_L: 268, POST_R: 372,

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
    return s;
  },

  // attrs: { chute, passe, tecnica, energia }
  start(host, sc, attrs, onDone) {
    host.innerHTML = `
      <div class="kick-wrap">
        <div class="kick-head"><b>${U.esc(sc.title)}</b><span id="kick-info"></span></div>
        <canvas id="kick-canvas" width="${Kick.W}" height="${Kick.H}"></canvas>
        <div class="kick-controls">
          <span>Efeito:</span>
          <button class="btn sm" id="k-curve-l">↺</button>
          <span id="k-curve" class="curve-val">0</span>
          <button class="btn sm" id="k-curve-r">↻</button>
          <span class="muted small">Arraste para trás a partir da bola e solte. Mais longe = mais força.</span>
        </div>
      </div>`;
    const cv = host.querySelector('#kick-canvas');
    const ctx = cv.getContext('2d');
    const st = {
      ball: { x: sc.ball.x, y: sc.ball.y, vx: 0, vy: 0, moving: false },
      gk: { ...sc.gk }, defs: sc.defenders.map(d => ({ ...d })), mates: sc.mates.map(m => ({ ...m })),
      aiming: false, aim: null, curve: 0, touches: 0, passes: 0, owner: 'user',
      over: false, msg: null, msgT: 0, result: null, spin: 0, blockedAt: null,
    };
    const curveEl = host.querySelector('#k-curve');
    const info = host.querySelector('#kick-info');
    const updInfo = () => info.textContent = `Toques: ${st.touches}/${sc.maxTouches}` + (st.owner === 'mate' ? ' • bola com companheiro' : '');
    updInfo();
    const setCurve = (v) => { st.curve = U.clamp(v, -3, 3); curveEl.textContent = st.curve > 0 ? '+' + st.curve : st.curve; };
    host.querySelector('#k-curve-l').onclick = () => setCurve(st.curve - 1);
    host.querySelector('#k-curve-r').onclick = () => setCurve(st.curve + 1);
    const keyH = (e) => { if (e.key === 'a' || e.key === 'ArrowLeft') setCurve(st.curve - 1); if (e.key === 'd' || e.key === 'ArrowRight') setCurve(st.curve + 1); };
    window.addEventListener('keydown', keyH);

    const toLocal = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * Kick.W / r.width, y: (e.clientY - r.top) * Kick.H / r.height };
    };
    cv.addEventListener('pointerdown', (e) => {
      if (st.ball.moving || st.over) return;
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
      shoot(Math.atan2(dy, dx), pow);
    });

    const isPassAim = (ang) => st.mates.some(m => {
      const vx = m.x - st.ball.x, vy = m.y - st.ball.y;
      const d = Math.hypot(vx, vy);
      if (d < 5) return false;
      const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(vy, vx) - ang), Math.cos(Math.atan2(vy, vx) - ang)));
      return diff < 0.25;
    });

    function shoot(ang, pow) {
      const pass = isPassAim(ang);
      const skill = pass ? attrs.passe : attrs.chute;
      const mateFactor = st.owner === 'mate' ? 0.85 : 1;
      const sd = (0.015 + (1 - attrs.tecnica / 100) * 0.07 + (1 - skill / 100) * 0.06 + (1 - attrs.energia / 100) * 0.05) * (0.6 + pow * 0.6) / mateFactor;
      ang += U.gauss(0, sd);
      const sp = (5 + pow * (8 + attrs.chute / 100 * 6)) * mateFactor;
      st.ball.vx = Math.cos(ang) * sp; st.ball.vy = Math.sin(ang) * sp;
      st.ball.moving = true; st.spin = st.curve; st.touches++;
      st.kickFrom = { x: st.ball.x, y: st.ball.y };
      st.wasPass = pass; updInfo();
    }

    const finish = (result, msg) => {
      if (st.over) return;
      st.over = true; st.result = result; st.msg = msg; st.msgT = 0;
      setTimeout(() => {
        window.removeEventListener('keydown', keyH);
        cancelAnimationFrame(st.raf);
        onDone({ result, passes: st.passes });
      }, 1500);
    };

    function physics() {
      const b = st.ball;
      // goleiro
      const g = st.gk;
      const gkSpeed = 1.4 + g.ovr / 100 * 2.4;
      let tx = b.x;
      if (b.moving && b.vy < 0) tx = b.x + b.vx * ((b.y - g.y) / -b.vy);
      tx = U.clamp(tx, Kick.POST_L + 4, Kick.POST_R - 4);
      if (!st.over) g.x += U.clamp(tx - g.x, -gkSpeed, gkSpeed);

      if (!b.moving) return;
      const sp = Math.hypot(b.vx, b.vy);
      // efeito
      if (st.spin && sp > 1) {
        const k = st.spin * 0.045 * Math.min(sp, 12) / 12;
        b.vx += -b.vy / sp * k; b.vy += b.vx / sp * k;
      }
      b.x += b.vx; b.y += b.vy;
      b.vx *= 0.983; b.vy *= 0.983;

      if (st.over) { if (sp < 0.2) b.moving = false; return; }

      // defensores reagem
      st.defs.forEach(d => {
        const dist = Math.hypot(b.x - d.x, b.y - d.y);
        if (dist < 140) {
          d.x += U.clamp(b.x - d.x, -0.9, 0.9);
          d.y += U.clamp(b.y - d.y, -0.5, 0.5);
        }
        if (dist < 17) {
          b.vx = -b.vx * 0.35 + U.rf(-1, 1); b.vy = -b.vy * 0.35;
          finish('blocked', 'Bloqueado pela defesa!');
        }
      });
      if (st.over) return;
      // companheiros recebem
      for (const m of st.mates) {
        if (Math.hypot(b.x - m.x, b.y - m.y) < 18 && Math.hypot(b.x - st.kickFrom.x, b.y - st.kickFrom.y) > 25) {
          b.x = m.x; b.y = m.y - 14; b.vx = b.vy = 0; b.moving = false;
          st.passes++; st.owner = 'mate';
          st.mates = st.mates.filter(x => x !== m);
          if (st.touches >= sc.maxTouches) return finish('miss', 'Jogada travada. Acabaram os toques.');
          st.msg = 'Passe certo!'; st.msgT = 0; updInfo();
          return;
        }
      }
      // gol / defesa / trave / fora
      if (b.y <= g.y + 6 && b.y >= g.y - 8 && b.vy < 0) {
        const reach = 16 + g.ovr / 100 * 9;
        if (Math.abs(b.x - g.x) < reach && !(sp > 12 && Math.random() < (sp - 12) * 0.07)) {
          b.vy = -b.vy * 0.4; b.vx += U.rf(-2, 2);
          return finish('saved', 'Defesa do goleiro!');
        }
      }
      if (b.y <= Kick.GOAL_Y) {
        if (Math.abs(b.x - Kick.POST_L) < 5 || Math.abs(b.x - Kick.POST_R) < 5) {
          b.vy = -b.vy * 0.6; b.vx = -b.vx * 0.6;
          return finish('miss', 'Na trave!');
        }
        if (b.x > Kick.POST_L && b.x < Kick.POST_R) {
          b.vx *= 0.3; b.vy *= 0.3;
          return finish(st.owner === 'mate' ? 'assist' : 'goal', st.owner === 'mate' ? 'GOL! Assistência sua!' : 'GOOOL!');
        }
        return finish('miss', 'Para fora!');
      }
      if (b.x < 0 || b.x > Kick.W || b.y > Kick.H) return finish('miss', 'Bola perdida pela linha.');
      if (sp < 0.25) {
        b.moving = false;
        finish('miss', 'A bola parou. A defesa recupera.');
      }
    }

    function draw() {
      Kick.drawPitch(ctx);
      const dot = (x, y, f, k, l) => Kick.dot(ctx, x, y, f, k, l);
      st.defs.forEach(d => dot(d.x, d.y, '#d84343', '#7a1010'));
      st.mates.forEach(m => dot(m.x, m.y, '#2f6fd6', '#0f2f66'));
      dot(st.gk.x, st.gk.y, '#f2c12e', '#6b5200');
      const b = st.ball;
      if (!b.moving && !st.over) dot(b.x, b.y + 14, st.owner === 'mate' ? '#2f6fd6' : '#ffffff', st.owner === 'mate' ? '#0f2f66' : '#1d4ed8', st.owner === 'mate' ? '' : 'VOCÊ');
      ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.stroke();

      // mira
      if (st.aiming && st.aim) {
        const dx = b.x - st.aim.x, dy = b.y - st.aim.y;
        const pow = Math.min(Math.hypot(dx, dy), 160) / 160;
        const ang = Math.atan2(dy, dx);
        ctx.setLineDash([6, 6]); ctx.lineWidth = 3;
        ctx.strokeStyle = isPassAim(ang) ? '#8fd3ff' : '#ffe27a';
        ctx.beginPath(); ctx.moveTo(b.x, b.y);
        let x = b.x, y = b.y, vx = Math.cos(ang), vy = Math.sin(ang);
        for (let i = 0; i < 40 + pow * 80; i++) {
          if (st.curve) { vx += -vy * st.curve * 0.004; vy += vx * st.curve * 0.004; const n = Math.hypot(vx, vy); vx /= n; vy /= n; }
          x += vx * 3; y += vy * 3; ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(14, Kick.H - 30, 124, 16);
        ctx.fillStyle = pow > 0.85 ? '#ff6b6b' : '#7cff8a'; ctx.fillRect(16, Kick.H - 28, 120 * pow, 12);
      }
      if (st.msg) {
        st.msgT++;
        ctx.globalAlpha = Math.max(0, 1 - st.msgT / (st.over ? 120 : 60));
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, Kick.H / 2 - 30, Kick.W, 60);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(st.msg, Kick.W / 2, Kick.H / 2 + 10);
        ctx.globalAlpha = 1;
        if (!st.over && st.msgT > 60) st.msg = null;
      }
    }

    Kick._st = st;
    function loop() {
      physics(); draw();
      st.raf = requestAnimationFrame(loop);
    }
    loop();
  },
};
