// Os 5 minigames de treino. Cada um: até 3 tentativas; acertar na 1ª = ★★★, 2ª = ★★, 3ª = ★.
var Drills = {
  icons: { pace: '👟', power: '💥', technique: '🌀', vision: '👁', freekick: '🎯' },

  // monta a cena de uma tentativa conforme o nível da habilidade
  setup: {
    power(L, B) {
      const t = L / 60, d = Util.lerp(B.power.dist[0], B.power.dist[1], t);
      const ball = MG.ball(RNG.range(-7, 7), d);
      return { ball, gk: MG.gk(Util.lerp(B.power.gk[0], B.power.gk[1], t)), cam: MG.fit(-22, -5, 22, d + 6), goal: true };
    },
    technique(L, B) {
      const t = L / 60, d = Util.lerp(B.technique.dist[0], B.technique.dist[1], t), gap = Util.lerp(B.technique.gap[0], B.technique.gap[1], t);
      const cx = RNG.range(-4, 4);
      return { ball: MG.ball(RNG.range(-3, 3), d), poles: [{ x: cx - gap / 2, y: 2 }, { x: cx + gap / 2, y: 2 }], cam: MG.fit(-18, -4, 18, d + 6), goal: false };
    },
    vision(L, B) {
      const t = L / 60, d = Util.lerp(B.vision.dist[0], B.vision.dist[1], t);
      const target = { x: RNG.range(-6, 6), y: 3, bx: 0, moving: L >= B.vision.moveFrom, phase: RNG.range(0, 6), target: true };
      target.bx = target.x;
      const dummies = [target];
      if (L >= B.vision.decoyFrom) for (let i = 0; i < 2; i++) dummies.push({ x: target.x + (i ? 1 : -1) * RNG.range(2.2, 4), y: 3 + RNG.range(-1.5, 1.5), decoy: true });
      return { ball: MG.ball(RNG.range(-4, 4), d), dummies, cam: MG.fit(-18, -3, 18, d + 6), goal: false };
    },
    freekick(L, B) {
      const t = L / 60, d = Util.lerp(B.freekick.dist[0], B.freekick.dist[1], t);
      const ball = MG.ball(RNG.range(-10, 10), d);
      const ang = Math.atan2(0 - ball.y, 0 - ball.x), n = L >= 30 ? 5 : L >= 12 ? 4 : 3;
      const wx = ball.x + Math.cos(ang) * 9.15, wy = ball.y + Math.sin(ang) * 9.15;
      const wall = [];
      for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; wall.push({ x: wx - Math.sin(ang) * k * 0.6, y: wy + Math.cos(ang) * k * 0.6 }); }
      return { ball, wall, gk: L >= B.freekick.gkFrom ? MG.gk(Util.lerp(B.freekick.gk[0], B.freekick.gk[1], t)) : null, cam: MG.fit(-22, -5, 22, d + 6), goal: true };
    },
    pace(L, B) {
      const t = L / 60;
      const sp = Util.lerp(B.pace.ballSpeed[0], B.pace.ballSpeed[1], t);
      const dir = RNG.chance(0.5) ? 1 : -1;
      const mk = (y, delay, fake) => ({ x: -dir * 26, y, z: 0, vx: dir * sp * (fake ? RNG.range(0.85, 1.15) : 1), vy: 0, delay, fake, gone: false });
      const lineY = RNG.range(8, 12);
      const balls = [mk(lineY, 0, false)];
      if (L >= B.pace.fakeFrom) { balls.push(mk(lineY + RNG.range(-5, -3), RNG.range(0, 0.5), true)); balls.push(mk(lineY + RNG.range(3, 5), RNG.range(0, 0.5), true)); }
      const me = { x: RNG.range(-6, 6), y: lineY + Util.lerp(B.pace.startDist[0], B.pace.startDist[1], t), vx: 0, vy: 0 };
      return { pace: true, balls, me, dir, inertia: L >= B.pace.inertiaFrom, cam: MG.fit(-26, lineY - 10, 26, lineY + 16), goal: false };
    },
  },

  // abre o minigame em tela cheia. onDone(stars, successAttempt)
  run(host, kind, g, opts, onDone) {
    const B = BALANCE.minigame, L = Skills.effective(g, kind), pr = Skills.params(g);
    const look = g.player.look;
    host.innerHTML = `
      <canvas id="mg-canvas" width="${MG.W}" height="${MG.H}"></canvas>
      <div class="mg-hud">
        <button class="icon-btn mg-exit" data-tip="${STR.icons.back}">✖</button>
        <div id="mg-tries" class="tries"></div>
        <div class="mg-kind">${Drills.icons[kind]} <b>${L}</b></div>
        <div id="mg-wind" class="mg-wind-slot"></div>
        <div class="mg-speed">${UI.speedPicker()}</div>
      </div>`;
    const cv = host.querySelector('#mg-canvas'), ctx = cv.getContext('2d');
    const triesEl = host.querySelector('#mg-tries');
    let attempt = 0, success = null, S = null, kc = null, flash = null, loop = null, finished = false;
    const results = [];

    const renderTries = () => {
      triesEl.innerHTML = [0, 1, 2].map(i => `<span class="try ${results[i] === true ? 'ok' : results[i] === false ? 'bad' : i === attempt ? 'cur' : ''}"></span>`).join('');
    };

    const newAttempt = () => {
      S = Drills.setup[kind](L, B);
      S.wind = kind === 'pace' ? null : MG.wind(L);
      S.state = 'play'; S.t = 0; S.result = null;
      MG.debug = { get S() { return S; }, get kc() { return kc; } };
      if (!S.pace) {
        kc = MG.KickControl({ pr, onKick: (ang, power, curve) => { MG.kick(S.ball, ang, power, curve, pr); S.kicked = true; } });
      }
      renderTries();
    };

    const endAttempt = (ok) => {
      if (S.state !== 'play') return;
      S.state = 'result'; results[attempt] = ok;
      flash = { icon: ok ? '✔' : '✖', t: 1.4, color: ok ? '#69f0ae' : '#ff5252' };
      Sound.play(ok ? 'good' : 'bad');
      setTimeout(() => {
        if (finished) return;
        if (ok) { success = attempt; return finish(); }
        attempt++;
        if (attempt >= B.attempts) return finish();
        newAttempt();
      }, 1300);
    };

    const finish = () => {
      finished = true;
      const stars = Skills.starsFor(success);
      renderTries();
      loop && loop.stop();
      Drills.showStars(host, stars, () => onDone(stars, success));
    };

    // ----- entrada -----
    let pace = { down: false, target: null };
    cv.addEventListener('pointerdown', (e) => {
      if (!S || S.state !== 'play') return;
      const p = MG.pointer(cv, e);
      cv.setPointerCapture(e.pointerId);
      if (S.pace) { pace.down = true; pace.target = MG.toWorld(S.cam, p.sx, p.sy); return; }
      kc.down(p, MG.toScreen(S.cam, S.ball.x, S.ball.y));
    });
    cv.addEventListener('pointermove', (e) => {
      if (!S) return;
      const p = MG.pointer(cv, e);
      if (S.pace) { if (pace.down) pace.target = MG.toWorld(S.cam, p.sx, p.sy); return; }
      kc && kc.move(p);
    });
    const up = () => { pace.down = false; kc && kc.up(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    host.querySelector('.mg-exit').onclick = () => { if (finished) return; finished = true; loop && loop.stop(); onDone(null, null); };

    // ----- passo de física -----
    const step = (dt) => {
      if (!S || S.state === 'done') return;
      S.t += dt;
      if (S.pace) return Drills.stepPace(S, pr, pace, dt, endAttempt);
      const b = S.ball;
      if (S.gk) MG.stepGK(S.gk, b, dt);
      if (S.dummies) S.dummies.forEach(d => { if (d.moving) d.x = d.bx + Math.sin(S.t * 1.3 + d.phase) * 2.5; });
      MG.stepBall(b, S.wind);
      if (S.state !== 'play' || !S.kicked) return;
      // obstáculos
      for (const w of S.wall || []) if (MG.hits(b, w, 0.35, 1.85)) { b.vx *= -0.3; b.vy *= -0.3; return endAttempt(false); }
      for (const p of S.poles || []) if (MG.hits(b, p, 0.08, 1.6)) { b.vx *= -0.4; b.vy *= -0.2; return endAttempt(false); }
      for (const d of S.dummies || []) if (MG.hits(b, d, d.target ? B.vision.radius : 0.45, 1.85)) { b.vx *= -0.3; b.vy *= -0.3; return endAttempt(!!d.target); }
      if (S.goal) {
        const r = MG.goalCheck(b, S.gk);
        if (r) return endAttempt(r === 'goal');
      }
      if (S.poles && b.y <= S.poles[0].y) {
        const [a, c] = S.poles;
        return endAttempt(b.x > Math.min(a.x, c.x) && b.x < Math.max(a.x, c.x) && b.z < 1.6);
      }
      if (S.dummies && b.y < 1) return endAttempt(false);
      if (!b.moving || b.y > S.cam.cy + 40 || Math.abs(b.x) > 40) return endAttempt(false);
    };

    // ----- desenho -----
    const draw = (dt) => {
      if (!S) return;
      kc && kc.update(dt);
      MG.drawPitch(ctx, S.cam, { goal: S.goal });
      if (S.pace) Drills.drawPace(ctx, S, look);
      else {
        const items = [];
        (S.poles || []).forEach(p => items.push({ y: p.y, d: () => Drills.drawPole(ctx, S.cam, p) }));
        (S.dummies || []).forEach(d => items.push({ y: d.y, d: () => Drills.drawDummy(ctx, S.cam, d, S.t) }));
        (S.wall || []).forEach(w => items.push({ y: w.y, d: () => MG.drawPlayer(ctx, S.cam, w.x, w.y, { shirt: '#e53935', skin: '#c98b5e', hair: '#1b1b1b' }) }));
        if (S.gk) items.push({ y: S.gk.y, d: () => MG.drawPlayer(ctx, S.cam, S.gk.x, S.gk.y, { shirt: '#fdd835', skin: '#e8b48f', hair: '#4b2e1a' }) });
        if (!S.shooter) S.shooter = { x: S.ball.x - 0.7, y: S.ball.y + 1.2 };
        items.push({ y: S.shooter.y, d: () => MG.drawPlayer(ctx, S.cam, S.shooter.x, S.shooter.y, { shirt: '#1e88e5', skin: look.skin, hair: look.hair, boot: look.boot }) });
        items.push({ y: S.ball.y, d: () => MG.drawBall(ctx, S.cam, S.ball) });
        items.sort((a, b) => a.y - b.y).forEach(i => i.d());
        if (S.goal) MG.drawGoal(ctx, S.cam, 'front');
        if (!S.kicked && kc.phase === 'idle') Drills.drawHint(ctx, S.cam, S.ball, S.t);
        MG.drawAim(ctx, S.cam, S.ball, kc);
        MG.drawEffectBar(ctx, kc);
        MG.drawWind(ctx, S.wind);
      }
      if (flash) { flash.t -= dt; ctx.save(); ctx.fillStyle = flash.color; MG.drawIconBig(ctx, flash.icon, flash.t); ctx.restore(); if (flash.t <= 0) flash = null; }
    };

    newAttempt();
    loop = MG.loop(step, draw);
    host._stop = () => { finished = true; loop && loop.stop(); };
  },

  // ----- Velocidade: chegar na linha da bola antes dela passar -----
  stepPace(S, pr, input, dt, end) {
    const me = S.me, base = 6.2 * pr.runSpeed;
    if (input.down && input.target) {
      const dx = input.target.x - me.x, dy = input.target.y - me.y, d = Math.hypot(dx, dy);
      const want = d > 0.2 ? { x: dx / d * base, y: dy / d * base } : { x: 0, y: 0 };
      const k = S.inertia ? 3.5 * dt : 1;   // inércia nos níveis altos
      me.vx += (want.x - me.vx) * Math.min(1, k); me.vy += (want.y - me.vy) * Math.min(1, k);
      if (d < 0.3) { me.vx *= 0.5; me.vy *= 0.5; }
    } else { me.vx *= S.inertia ? 0.93 : 0.6; me.vy *= S.inertia ? 0.93 : 0.6; }
    me.x += me.vx * dt; me.y += me.vy * dt;
    for (const b of S.balls) {
      if (b.gone) continue;
      if (S.t < b.delay) continue;
      b.x += b.vx * dt;
      if (S.state !== 'play') continue;
      if (Math.hypot(b.x - me.x, b.y - me.y) < 0.85) {
        if (b.fake) { b.gone = true; continue; }
        b.vx = 0; return end(true);
      }
      if (!b.fake && Math.abs(b.x) > 27) return end(false);
    }
  },
  drawPace(ctx, S, look) {
    const cam = S.cam;
    // trajetória fantasma da bola real (alvo mostrado visualmente)
    const real = S.balls[0];
    if (S.t < 1.2 && S.state === 'play') {
      ctx.setLineDash([8, 10]); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3;
      const a = MG.toScreen(cam, -26, real.y), b = MG.toScreen(cam, 26, real.y);
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.setLineDash([]);
    }
    const passer = MG.toScreen(cam, -S.dir * 26, real.y);
    void passer;
    MG.drawPlayer(ctx, cam, S.me.x, S.me.y, { shirt: '#1e88e5', skin: look.skin, hair: look.hair, boot: look.boot, ring: '#ffeb3b' });
    S.balls.forEach(b => { if (!b.gone && S.t >= b.delay) { ctx.globalAlpha = b.fake ? 0.8 : 1; MG.drawBall(ctx, cam, b); ctx.globalAlpha = 1; } });
  },
  drawPole(ctx, cam, p) {
    const a = MG.toScreen(cam, p.x, p.y, 0), b = MG.toScreen(cam, p.x, p.y, 1.6);
    ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 5; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.setLineDash([]);
  },
  drawDummy(ctx, cam, d, t) {
    const s = MG.toScreen(cam, d.x, d.y), r = Math.max(6, 0.45 * cam.ppm);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(s[0], s[1] + 2, r, r * 0.45, 0, 0, 7); ctx.fill();
    ctx.fillStyle = d.target ? '#b0bec5' : '#6d7a80';
    ctx.fillRect(s[0] - r * 0.7, s[1] - r * 3.2, r * 1.4, r * 3.2);
    ctx.beginPath(); ctx.arc(s[0], s[1] - r * 3.6, r * 0.6, 0, 7); ctx.fill();
    if (d.target) {   // alvo piscando
      ctx.strokeStyle = `rgba(255,235,59,${0.5 + 0.5 * Math.sin(t * 8)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(s[0], s[1] - r * 1.8, r * 2.2, 0, 7); ctx.stroke();
    }
  },
  // mão fantasma mostrando o gesto de arrastar
  drawHint(ctx, cam, b, t) {
    if (t > 3) return;
    const s = MG.toScreen(cam, b.x, b.y), k = (t % 1.5) / 1.5;
    ctx.globalAlpha = 0.8 * (1 - k); ctx.font = '34px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('👆', s[0] + 46 + k * 10, s[1] + 40 - k * 90); ctx.globalAlpha = 1;
  },

  showStars(host, stars, cb) {
    const ov = document.createElement('div');
    ov.className = 'stars-overlay';
    ov.innerHTML = `<div class="big-stars">${[0, 1, 2].map(i => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>
      <button class="btn-main" id="stars-ok">✔</button>`;
    host.appendChild(ov);
    Sound.play(stars ? 'star' : 'bad');
    ov.querySelector('#stars-ok').onclick = () => cb();
  },
};
