// Motor dos minigames e lances: câmera, física da bola (metros), controle de chute e desenho.
// Coordenadas do mundo em metros: x para a direita, y para baixo (o gol fica em y = 0, no topo).
var MG = {
  W: 960, H: 540, TILT: 0.8, DT: 1 / 60,

  // velocidade da simulação dos lances (ajuste do jogador)
  SPEEDS: { slow: 0.4, normal: 0.6, fast: 0.85 },
  speedKey() { try { return localStorage.getItem('rag2_speed') || 'normal'; } catch (e) { return 'normal'; } },
  speed() { return MG.SPEEDS[MG.speedKey()] || 0.6; },
  setSpeed(k) { try { localStorage.setItem('rag2_speed', k); } catch (e) { /* ignora */ } },

  camera(cx, cy, ppm) { return { cx, cy, ppm }; },
  // câmera que enquadra um retângulo do mundo
  fit(x0, y0, x1, y1) {
    const ppm = Math.min(MG.W / (x1 - x0), MG.H / ((y1 - y0) * MG.TILT));
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, ppm };
  },
  toScreen(cam, x, y, z = 0) {
    return [MG.W / 2 + (x - cam.cx) * cam.ppm, MG.H / 2 + (y - cam.cy) * cam.ppm * MG.TILT - z * cam.ppm * 0.9];
  },
  toWorld(cam, sx, sy) {
    return { x: cam.cx + (sx - MG.W / 2) / cam.ppm, y: cam.cy + (sy - MG.H / 2) / (cam.ppm * MG.TILT) };
  },
  pointer(canvas, e) {
    const r = canvas.getBoundingClientRect();
    return { sx: (e.clientX - r.left) * MG.W / r.width, sy: (e.clientY - r.top) * MG.H / r.height };
  },

  // ---------- física ----------
  ball(x, y) { return { x, y, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, moving: false, t: 0 }; },
  wind(level) {
    const B = BALANCE.minigame;
    if (level < BALANCE.skills.windFromLevel) return { x: 0, y: 0, s: 0 };
    const s = B.windMax * Util.clamp((level - BALANCE.skills.windFromLevel) / 45 + RNG.range(0.1, 0.5), 0.15, 1);
    const a = RNG.range(0, Math.PI * 2);
    return { x: Math.cos(a) * s, y: Math.sin(a) * s, s };
  },
  stepBall(b, wind) {
    const B = BALANCE.minigame, dt = MG.DT;
    if (!b.moving) return;
    b.t += dt;
    const sp = Math.hypot(b.vx, b.vy);
    if (b.spin && sp > 0.5) {   // efeito (curva) perpendicular à direção
      const k = B.spinAccel * b.spin * Math.min(1, sp / 18) * dt;
      b.vx += -b.vy / sp * k; b.vy += b.vx / sp * k;
      b.spin *= 0.996;
    }
    if (wind && wind.s) { const f = b.z > 0.3 ? 1 : 0.15; b.vx += wind.x * f * dt; b.vy += wind.y * f * dt; }
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (b.z > 0 || b.vz > 0) b.vz -= B.gravity * dt;
    if (b.z <= 0) {
      b.z = 0;
      if (b.vz < -2) { b.vz = -b.vz * 0.45; b.vx *= 0.8; b.vy *= 0.8; } else b.vz = 0;
    }
    const drag = 1 - B.airDrag;
    b.vx *= drag; b.vy *= drag;
    if (b.z === 0 && b.vz === 0) {   // rolando
      const s2 = Math.hypot(b.vx, b.vy), dec = B.rollDecel * dt;
      if (s2 <= dec) { b.vx = b.vy = 0; b.moving = false; } else { b.vx -= b.vx / s2 * dec; b.vy -= b.vy / s2 * dec; }
    }
  },
  // chute: ângulo (rad), força 0..1, curva -1..1
  kick(b, ang, power, curve, pr) {
    const B = BALANCE.minigame.kick;
    const h = (B.base + power * B.perPower * Math.sqrt(pr.passRange / 30)) * pr.ballSpeed;
    b.vx = Math.cos(ang) * h; b.vy = Math.sin(ang) * h;
    b.vz = Math.max(0, power - B.loftFrom) * B.loft;
    b.spin = curve * pr.curveMax;
    b.moving = true; b.t = 0;
  },
  // prevê a trajetória (sem vento e sem efeito) para a linha pontilhada
  predict(b, ang, power, pr, steps = 90) {
    const t = { ...b }; MG.kick(t, ang, power, 0, pr);
    const pts = [];
    for (let i = 0; i < steps && t.moving; i++) { MG.stepBall(t, null); if (i % 3 === 0) pts.push([t.x, t.y, t.z]); }
    return pts;
  },
  // bola passa perto de um objeto (cilindro de raio r e altura h)?
  hits(b, o, r, h = 1.9) { return Math.hypot(b.x - o.x, b.y - o.y) < r + 0.11 && b.z < h; },

  // goleiro: se posiciona na direção da bola e tenta defender quando ela cruza a linha
  gk(q) { return { x: 0, y: 0.6, q, react: 0, dive: 0 }; },
  stepGK(gk, b, dt = MG.DT) {
    const sp = 2.5 + gk.q * 4.5;
    let tx = b.x * 0.35;
    if (b.moving && b.vy < -0.5) {
      gk.react += dt;
      if (gk.react > 0.22 - gk.q * 0.12) tx = b.x + b.vx * ((b.y - gk.y) / -b.vy);
    }
    tx = Util.clamp(tx, -3.4, 3.4);
    gk.x += Util.clamp(tx - gk.x, -sp * dt, sp * dt);
  },
  // resultado no gol: 'goal' | 'saved' | 'post' | 'over' | 'wide' | null (ainda não chegou)
  goalCheck(b, gk) {
    const B = BALANCE.minigame, half = B.goalWidth / 2;
    if (gk && b.vy < 0 && b.y <= gk.y + 0.3 && b.y >= gk.y - 0.4) {
      const reach = 0.75 + gk.q * 1.1, sp = Math.hypot(b.vx, b.vy);
      if (Math.abs(b.x - gk.x) < reach && b.z < 2.2 + gk.q * 0.3 && !(sp > 20 && RNG.chance((sp - 20) * 0.05))) {
        b.vy = -b.vy * 0.35; b.vx = (b.x - gk.x) * 3; b.vz = 2;
        gk.dive = Math.sign(b.x - gk.x) || 1;
        return 'saved';
      }
    }
    if (b.y <= 0) {
      if (Math.abs(Math.abs(b.x) - half) < 0.12 && b.z < B.barHeight) { b.vy = -b.vy * 0.5; return 'post'; }
      if (Math.abs(b.x) < half && Math.abs(b.z - B.barHeight) < 0.1) { b.vy = -b.vy * 0.5; return 'post'; }
      if (Math.abs(b.x) < half && b.z < B.barHeight) { b.vx *= 0.2; b.vy *= 0.2; return 'goal'; }
      return b.z >= B.barHeight && Math.abs(b.x) < half + 1 ? 'over' : 'wide';
    }
    return null;
  },

  // ---------- controle do chute: arrastar a partir da bola -> soltar -> tocar na barra de efeito ----------
  KickControl(opts) {
    const c = {
      phase: 'idle', drag: null, ang: 0, power: 0, bar: 0, barT: 0, t: 0,
      canStart: opts.canStart || (() => true),
      onKick: opts.onKick,
      pr: opts.pr,
      // atalho: chuta direto para um ponto (cartões de passe)
      kickTo(target, from) {
        const d = Math.hypot(target.x - from.x, target.y - from.y);
        c.onKick(Math.atan2(target.y - from.y, target.x - from.x), Util.clamp(0.35 + d / (c.pr.passRange * 1.4), 0.3, 1), 0);
        c.phase = 'done';
      },
    };
    const MAXDRAG = 230;
    c.down = (p, ballScreen) => {
      if (c.phase === 'effect') { c.release(); return true; }
      if (c.phase !== 'idle' || !c.canStart()) return false;
      if (Math.hypot(p.sx - ballScreen[0], p.sy - ballScreen[1]) > 80) return false;
      c.phase = 'drag'; c.drag = { ...p, bs: ballScreen }; c.cur = p; return true;
    };
    c.move = (p) => { if (c.phase === 'drag') c.cur = p; };
    c.up = () => {
      if (c.phase !== 'drag') return;
      const dx = c.cur.sx - c.drag.bs[0], dy = (c.cur.sy - c.drag.bs[1]) / MG.TILT;
      const len = Math.hypot(dx, dy);
      if (len < 20) { c.phase = 'idle'; return; }
      c.ang = Math.atan2(dy, dx) + c.wobble(); c.power = Math.min(1, len / MAXDRAG);
      c.phase = 'effect'; c.barT = 0;
    };
    c.release = () => {
      if (c.phase !== 'effect') return;
      c.phase = 'done';
      c.onKick(c.ang, c.power, c.bar);
    };
    // tremido da mira (menor com Técnica alta)
    c.wobble = () => c.pr.shake * 0.07 * Math.sin(c.t * 7.3) + c.pr.shake * 0.03 * Math.sin(c.t * 17.1);
    c.aim = () => {
      if (c.phase !== 'drag') return null;
      const dx = c.cur.sx - c.drag.bs[0], dy = (c.cur.sy - c.drag.bs[1]) / MG.TILT;
      const len = Math.hypot(dx, dy);
      return { ang: Math.atan2(dy, dx) + c.wobble(), power: Math.min(1, len / MAXDRAG), len };
    };
    c.update = (dt) => {
      c.t += dt;
      if (c.phase === 'effect') {
        c.barT += dt;
        c.bar = Math.sin(c.barT / BALANCE.minigame.effectBarPeriod * Math.PI * 2);
        if (c.barT > BALANCE.minigame.effectBarTimeout) { c.bar = 0; c.release(); }
      }
    };
    c.reset = () => { c.phase = 'idle'; c.drag = null; };
    return c;
  },

  // ---------- desenho ----------
  drawPitch(ctx, cam, opts = {}) {
    ctx.fillStyle = '#2c8a3e'; ctx.fillRect(0, 0, MG.W, MG.H);
    // faixas do gramado (a cada 5 m)
    for (let y = -10; y < 80; y += 5) {
      if (((y / 5) | 0) % 2) continue;
      const a = MG.toScreen(cam, 0, y)[1], b = MG.toScreen(cam, 0, y + 5)[1];
      ctx.fillStyle = '#33964a'; ctx.fillRect(0, a, MG.W, b - a);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
    const line = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => { const s = MG.toScreen(cam, x, y); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke(); };
    line([[-34, 0], [34, 0]]);
    line([[-20.15, 0], [-20.15, 16.5], [20.15, 16.5], [20.15, 0]]);
    line([[-9.15, 0], [-9.15, 5.5], [9.15, 5.5], [9.15, 0]]);
    const ps = MG.toScreen(cam, 0, 11); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ps[0], ps[1], 3, 0, 7); ctx.fill();
    const arc = []; for (let a = 0.93; a <= 2.21; a += 0.05) arc.push([Math.cos(a) * 9.15, 11 + Math.sin(a) * 9.15]);
    line(arc);
    if (opts.half) line([[-34, 52.5], [34, 52.5]]);
    if (opts.goal !== false) MG.drawGoal(ctx, cam, 'back');
  },
  drawGoal(ctx, cam, part) {
    const B = BALANCE.minigame, hw = B.goalWidth / 2, bh = B.barHeight;
    const P = (x, y, z) => MG.toScreen(cam, x, y, z);
    if (part === 'back') {   // rede atrás
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      const a = P(-hw, -1.8, 0), b = P(hw, -1.8, 0), c = P(hw, -1.8, bh * 0.8), d = P(-hw, -1.8, bh * 0.8);
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
      for (let x = -hw; x <= hw; x += 0.6) { ctx.beginPath(); ctx.moveTo(...P(x, -1.8, 0)); ctx.lineTo(...P(x, -1.8, bh * 0.8)); ctx.stroke(); }
      return;
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(...P(-hw, 0, 0)); ctx.lineTo(...P(-hw, 0, bh)); ctx.lineTo(...P(hw, 0, bh)); ctx.lineTo(...P(hw, 0, 0)); ctx.stroke();
  },
  // boneco visto de cima com leve inclinação
  drawPlayer(ctx, cam, x, y, o = {}) {
    const s = MG.toScreen(cam, x, y), r = Math.max(8, 0.55 * cam.ppm);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(s[0], s[1] + 2, r * 1.1, r * 0.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = o.shirt || '#1e88e5'; ctx.beginPath(); ctx.ellipse(s[0], s[1] - r * 0.9, r * 0.95, r * 1.05, 0, 0, 7); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = o.trim || 'rgba(0,0,0,.35)'; ctx.stroke();
    ctx.fillStyle = o.skin || '#e8b48f'; ctx.beginPath(); ctx.arc(s[0], s[1] - r * 2.1, r * 0.62, 0, 7); ctx.fill();
    if (o.hair) { ctx.fillStyle = o.hair; ctx.beginPath(); ctx.arc(s[0], s[1] - r * 2.25, r * 0.6, Math.PI, 0); ctx.fill(); }
    if (o.boot) { ctx.fillStyle = o.boot; ctx.fillRect(s[0] - r * 0.7, s[1] - r * 0.2, r * 0.5, r * 0.35); ctx.fillRect(s[0] + r * 0.2, s[1] - r * 0.2, r * 0.5, r * 0.35); }
    if (o.ring) { ctx.strokeStyle = o.ring; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(s[0], s[1] + 2, r * 1.5, r * 0.7, 0, 0, 7); ctx.stroke(); }
    if (o.flag) { ctx.fillStyle = '#ffeb3b'; ctx.fillRect(s[0] + r, s[1] - r * 3.2, r * 0.9, r * 0.6); ctx.fillStyle = '#e53935'; ctx.fillRect(s[0] + r, s[1] - r * 3.2, r * 0.18, r * 1.5); }
    if (o.balloon) {
      const bx = s[0], by = s[1] - r * 3.6;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(bx, by, r * 1.1, r * 0.8, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx - 3, by + r * 0.6); ctx.lineTo(bx, by + r * 1.1); ctx.lineTo(bx + 4, by + r * 0.6); ctx.fill();
      ctx.fillStyle = '#111'; ctx.font = `bold ${Math.round(r)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚽', bx, by + 1);
    }
    return s;
  },
  drawBall(ctx, cam, b) {
    const g = MG.toScreen(cam, b.x, b.y, 0), s = MG.toScreen(cam, b.x, b.y, b.z);
    const r = Math.max(6, 0.3 * cam.ppm) * (1 + b.z * 0.06);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(g[0], g[1], r, r * 0.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s[0], s[1] - r * 0.6, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(s[0], s[1] - r * 0.6, r * 0.35, 0, 7); ctx.fill();
    return [s[0], s[1] - r * 0.6];
  },
  drawAim(ctx, cam, b, kc) {
    const a = kc.aim();
    if (!a) return;
    const pts = MG.predict(b, a.ang, a.power, kc.pr);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    pts.forEach(([x, y, z], i) => { const s = MG.toScreen(cam, x, y, z); ctx.globalAlpha = 1 - i / pts.length * 0.8; ctx.beginPath(); ctx.arc(s[0], s[1], 3, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    // medidor de força
    const x = 24, y = MG.H - 150;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y, 18, 120);
    ctx.fillStyle = a.power > 0.85 ? '#ff5252' : '#69f0ae'; ctx.fillRect(x + 2, y + 2 + 116 * (1 - a.power), 14, 116 * a.power);
  },
  drawEffectBar(ctx, kc) {
    if (kc.phase !== 'effect') return;
    const w = 360, x = (MG.W - w) / 2, y = MG.H - 70;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - 10, y - 14, w + 20, 46);
    const grd = ctx.createLinearGradient(x, 0, x + w, 0);
    grd.addColorStop(0, '#42a5f5'); grd.addColorStop(0.5, '#ffffff'); grd.addColorStop(1, '#ff7043');
    ctx.fillStyle = grd; ctx.fillRect(x, y, w, 18);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('↶', x - 26, y + 9); ctx.fillText('↷', x + w + 26, y + 9);
    const mx = x + (kc.bar + 1) / 2 * w;
    ctx.fillStyle = '#111'; ctx.fillRect(mx - 4, y - 8, 8, 34);
    ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2; ctx.strokeRect(mx - 4, y - 8, 8, 34);
  },
  drawWind(ctx, wind) {
    if (!wind || !wind.s) return;
    const cx = MG.W - 120, cy = 48, L = 14 + wind.s * 10;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(wind.y * MG.TILT, wind.x));
    ctx.fillStyle = '#e3f2fd'; ctx.strokeStyle = '#0d47a1'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-L, -5); ctx.lineTo(L - 8, -5); ctx.lineTo(L - 8, -11); ctx.lineTo(L + 6, 0); ctx.lineTo(L - 8, 11); ctx.lineTo(L - 8, 5); ctx.lineTo(-L, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // carimbo animado (única exceção de texto: 1 palavra)
  drawStamp(ctx, text, t, color = '#ffd740') {
    if (t <= 0) return;
    const s = 1 + Math.max(0, 0.4 - (1.6 - t)) * 1.5;
    ctx.save(); ctx.globalAlpha = Math.min(1, t); ctx.translate(MG.W / 2, MG.H / 2 - 40); ctx.rotate(-0.12); ctx.scale(s, s);
    ctx.font = 'bold 54px "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(text, 0, 0);
    ctx.fillStyle = color; ctx.fillText(text, 0, 0);
    ctx.restore();
  },
  drawIconBig(ctx, icon, t) {
    if (t <= 0) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, t); ctx.font = '120px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, MG.W / 2, MG.H / 2); ctx.restore();
  },

  // laço com passos fixos de física (funciona igual em 60/90/120 Hz)
  loop(step, draw) {
    const L = { raf: 0, last: 0, acc: 0, stopped: false };
    const tick = (now) => {
      if (L.stopped) return;
      const dt = Math.min(0.05, (now - (L.last || now)) / 1000); L.last = now;
      L.acc += dt * MG.speed();
      if (MG.paused) L.acc = 0;
      while (L.acc >= MG.DT) { step(MG.DT); L.acc -= MG.DT; }
      draw(dt);
      L.raf = requestAnimationFrame(tick);
    };
    L.raf = requestAnimationFrame(tick);
    L.stop = () => { L.stopped = true; cancelAnimationFrame(L.raf); };
    return L;
  },
};
