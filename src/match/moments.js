// Lances jogáveis da partida: interceptação, passe no meio-campo e jogada de ataque.
// Você controla só o seu jogador; companheiros e adversários são robôs.
var Moments = {
  run(host, type, g, ctxInfo, onDone) {
    const pr = Skills.params(g), look = g.player.look;
    const q = Util.clamp(ctxInfo.oppStrength / 100, 0.15, 0.95);   // dificuldade vem da força do adversário
    const myColors = ctxInfo.myColors, oppColors = ctxInfo.oppColors;
    host.innerHTML = `
      <canvas id="mm-canvas" width="${MG.W}" height="${MG.H}"></canvas>
      <div class="mg-hud"><div class="mm-type">${{ intercept: '🛡', pass: '🔁', attack: '⚽' }[type]}</div>
        <div class="mg-speed">${UI.speedPicker()}</div></div>
      <div id="mm-cards" class="mm-cards"></div>`;
    const cv = host.querySelector('#mm-canvas'), ctx = cv.getContext('2d');
    let S, kc = null, loop, done = false, stamp = null, flash = null;
    const input = { down: false, target: null };

    const finish = (res, icon) => {
      if (done) return;
      done = true;
      flash = { icon: icon || (res.ok || res.result === 'goal' || res.result === 'assist' ? '✔' : '✖'), t: 1.3 };
      Sound.play(flash.icon === '✔' ? 'good' : 'bad');
      setTimeout(() => { loop.stop(); onDone(res); }, 1500);
    };

    // ---------- montar cena ----------
    if (type === 'intercept') {
      const L = Util.clamp(q * 60, 5, 55);
      S = Drills.setup.pace(L, BALANCE.minigame);
      S.t = 0; S.state = 'play';
    } else if (type === 'pass') {
      S = Moments.setupPass(pr, q);
    } else {
      S = Moments.setupAttack(pr, q);
    }
    MG.debug = { get S() { return S; }, get kc() { return kc; } };
    if (!S.pace) {
      kc = MG.KickControl({ pr, onKick: (ang, power, curve) => { MG.kick(S.ball, ang, power, curve, pr); S.kicked = true; S.from = { x: S.ball.x, y: S.ball.y }; S.cardsEl && (S.cardsEl.innerHTML = ''); } });
    }

    // atalhos de passe (cartões na base)
    if (type === 'pass' || type === 'attack') {
      const el = host.querySelector('#mm-cards');
      S.cardsEl = el;
      const cards = S.mates.slice().sort((a, b) => Moments.openness(S, b) - Moments.openness(S, a)).slice(0, 3);
      el.innerHTML = cards.map((m, i) => `<button class="mate-card" data-i="${S.mates.indexOf(m)}" data-tip="${STR.icons.passes}"><span class="mc-shirt" style="background:${myColors[0]};color:${myColors[1]}">${m.num}</span></button>`).join('');
      el.querySelectorAll('.mate-card').forEach(b => b.onclick = () => {
        if (S.kicked || done) return;
        const m = S.mates[+b.dataset.i];
        kc.kickTo({ x: m.x, y: m.y - 0.5 }, S.ball);
      });
    }

    // ---------- entrada ----------
    cv.addEventListener('pointerdown', (e) => {
      if (done) return;
      const p = MG.pointer(cv, e); cv.setPointerCapture(e.pointerId);
      if (S.pace) { input.down = true; input.target = MG.toWorld(S.cam, p.sx, p.sy); return; }
      kc.down(p, MG.toScreen(S.cam, S.ball.x, S.ball.y));
    });
    cv.addEventListener('pointermove', (e) => {
      const p = MG.pointer(cv, e);
      if (S.pace) { if (input.down) input.target = MG.toWorld(S.cam, p.sx, p.sy); return; }
      kc.move(p);
    });
    const up = () => { input.down = false; kc && kc.up(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    // ---------- física ----------
    const step = (dt) => {
      if (done && !S.ball) return;
      S.t = (S.t || 0) + dt;
      if (S.pace) {
        if (!done) Drills.stepPace(S, pr, input, dt, (ok) => { S.state = 'end'; finish({ type: 'intercept', ok }); });
        return;
      }
      Moments.stepWorld(S, dt, q, pr);
      if (done) return;
      const b = S.ball;
      // marcação chega antes do chute
      if (!S.kicked && S.presser && Math.hypot(S.presser.x - b.x, S.presser.y - b.y) < 0.9) {
        return finish(type === 'pass' ? { type, ok: false } : { type, result: 'lost' });
      }
      if (!S.kicked) return;
      // adversários interceptam bola baixa
      for (const o of S.opps) if (MG.hits(b, o, 0.45, 1.9) && Math.hypot(b.x - S.from.x, b.y - S.from.y) > 1.5) {
        b.vx *= -0.2; b.vy *= -0.2;
        return finish(type === 'pass' ? { type, ok: false } : { type, result: 'lost' });
      }
      // companheiro recebe
      for (const m of S.mates) {
        if (Math.hypot(b.x - m.x, b.y - m.y) < 1.0 && b.z < 1.8 && Math.hypot(b.x - S.from.x, b.y - S.from.y) > 2) {
          b.moving = false; b.vx = b.vy = b.vz = 0;
          if (m.offside) { m.showFlag = true; return finish(type === 'pass' ? { type, ok: false } : { type, result: 'lost' }, '🚩'); }
          const dist = Math.hypot(m.x - S.from.x, m.y - S.from.y);
          if (type === 'pass') {
            const backwards = m.y > S.from.y + 1;
            const cls = Match.passClass(dist, backwards);
            stamp = { text: STR.passWords[cls], t: 1.6 };
            return finish({ type, ok: true, dist, backwards });
          }
          // jogada de ataque: o companheiro finaliza
          const chance = BALANCE.match.assistGoalChance * (1.1 - q * 0.5) * (m.y < 12 ? 1.1 : 0.8);
          const scored = RNG.chance(chance);
          return finish({ type, result: scored ? 'assist' : 'saved' }, scored ? '✔' : '🧤');
        }
      }
      if (type === 'attack') {
        if (S.gk) MG.stepGK(S.gk, b, dt);
        const r = MG.goalCheck(b, S.gk);
        if (r) {
          const greedy = S.from.y > 25 && S.mates.some(m => m.y < S.from.y - 6 && Moments.openness(S, m) > 3);
          return finish({ type, result: r === 'goal' ? 'goal' : r === 'saved' ? 'saved' : 'miss', greedy }, r === 'goal' ? '✔' : r === 'saved' ? '🧤' : '✖');
        }
      }
      if (!b.moving || Math.abs(b.x) > 34 || b.y > S.cam.cy + 40 || b.y < -3) return finish(type === 'pass' ? { type, ok: false } : { type, result: 'miss' });
    };

    // ---------- desenho ----------
    const draw = (dt) => {
      kc && kc.update(dt);
      MG.drawPitch(ctx, S.cam, { goal: type === 'attack', half: type === 'pass' });
      if (S.pace) Drills.drawPace(ctx, S, look);
      else {
        const items = [];
        S.opps.forEach(o => items.push({ y: o.y, d: () => MG.drawPlayer(ctx, S.cam, o.x, o.y, { shirt: oppColors[0], trim: oppColors[1], skin: '#c98b5e', hair: '#1b1b1b' }) }));
        const best = Moments.bestMate(S);
        S.mates.forEach(m => items.push({ y: m.y, d: () => MG.drawPlayer(ctx, S.cam, m.x, m.y, { shirt: myColors[0], trim: myColors[1], skin: '#e8b48f', hair: '#4b2e1a', balloon: !S.kicked && m === best, flag: (pr.seeOffside && m.offside) || m.showFlag }) }));
        if (S.gk) items.push({ y: S.gk.y, d: () => MG.drawPlayer(ctx, S.cam, S.gk.x, S.gk.y, { shirt: '#fdd835', skin: '#e8b48f', hair: '#4b2e1a' }) });
        items.push({ y: S.me.y, d: () => MG.drawPlayer(ctx, S.cam, S.me.x, S.me.y, { shirt: myColors[0], trim: myColors[1], skin: look.skin, hair: look.hair, boot: look.boot, ring: '#ffeb3b' }) });
        items.push({ y: S.ball.y, d: () => MG.drawBall(ctx, S.cam, S.ball) });
        items.sort((a, b) => a.y - b.y).forEach(i => i.d());
        if (type === 'attack') MG.drawGoal(ctx, S.cam, 'front');
        if (!S.kicked && kc.phase === 'idle') Drills.drawHint(ctx, S.cam, S.ball, S.t || 0);
        MG.drawAim(ctx, S.cam, S.ball, kc);
        MG.drawEffectBar(ctx, kc);
        // relógio da marcação
        if (!S.kicked && S.presser) Moments.drawPressure(ctx, S);
      }
      if (stamp) { stamp.t -= dt; MG.drawStamp(ctx, stamp.text, stamp.t); if (stamp.t <= 0) stamp = null; }
      if (flash) { flash.t -= dt; MG.drawIconBig(ctx, flash.icon, flash.t); if (flash.t <= 0) flash = null; }
    };
    loop = MG.loop(step, draw);
    host._stop = () => { done = true; loop.stop(); };
  },

  // ---------- cenas ----------
  setupPass(pr, q) {
    const me = { x: RNG.range(-12, 12), y: 44 };
    const ball = MG.ball(me.x, me.y - 0.8);
    const lastLine = RNG.range(14, 20);   // linha do último defensor (impedimento)
    const mates = [];
    for (let i = 0; i < pr.mates; i++) {
      const fwd = i < 2 ? RNG.range(12, 30) : RNG.range(-4, 22);
      const x = Util.clamp(me.x + RNG.range(-24, 24), -30, 30), y = Util.clamp(me.y - fwd, 8, 52);
      mates.push({ x, y, hx: x, hy: y, num: [7, 8, 9, 10, 11][i], offside: false });
    }
    // às vezes um atacante está impedido
    if (RNG.chance(0.45)) { const m = mates[0]; m.y = m.hy = lastLine - RNG.range(1.5, 4); m.offside = true; }
    const opps = mates.map((m, i) => ({ x: (m.x + me.x) / 2 + RNG.range(-4, 4), y: (m.y + me.y) / 2 + RNG.range(-3, 3), mark: i, ph: RNG.range(0, 6) }));
    opps.push({ x: me.x + RNG.range(-6, 6), y: me.y - 9, presser: true, ph: 0 });
    const S = { ball, me, mates, opps, lastLine, cam: MG.fit(-34, me.y - 40, 34, me.y + 6), t: 0 };
    S.presser = opps[opps.length - 1];
    return S;
  },
  setupAttack(pr, q) {
    const me = { x: RNG.range(-14, 14), y: RNG.range(17, 26) };
    const ball = MG.ball(me.x, me.y - 0.8);
    const mates = [];
    const nm = Math.max(1, Math.min(2, pr.mates - 2));
    for (let i = 0; i < nm; i++) { const x = RNG.range(-10, 10), y = RNG.range(7, 13); mates.push({ x, y, hx: x, hy: y, num: [9, 11][i] }); }
    const opps = [];
    const nd = q > 0.55 ? 3 : 2;
    for (let i = 0; i < nd; i++) opps.push({ x: me.x + RNG.range(-8, 8), y: RNG.range(6, me.y - 4), mark: i % mates.length, ph: RNG.range(0, 6) });
    opps.push({ x: me.x + RNG.range(-5, 5), y: me.y - 7, presser: true, ph: 0 });
    const S = { ball, me, mates, opps, gk: MG.gk(Util.clamp(q * 0.9 + 0.1, 0.2, 0.9)), cam: MG.fit(-24, -4, 24, me.y + 7), t: 0 };
    S.presser = opps[opps.length - 1];
    return S;
  },

  // movimento dos robôs
  stepWorld(S, dt, q, pr) {
    const b = S.ball, oppSpeed = 2.2 + q * 3.2;
    const move = (o, tx, ty, sp) => { const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy); if (d > 0.05) { const k = Math.min(sp * dt, d) / d; o.x += dx * k; o.y += dy * k; } };
    S.opps.forEach(o => {
      if (o.presser) {
        // a marcação demora um pouco e depois aperta: esperar demais custa a bola
        const sp = S.t < 1.8 ? 0.4 : oppSpeed * 0.75;
        if (!S.kicked) move(o, S.ball.x, S.ball.y, sp); else move(o, b.x, b.y, oppSpeed * 0.5);
        return;
      }
      const m = S.mates[o.mark] || S.mates[0];
      // fecha a linha de passe, mas oscila (esperar pode abrir espaço)
      const k = 0.45 + 0.3 * Math.sin(S.t * 0.9 + o.ph);
      let tx = S.me.x + (m.x - S.me.x) * k, ty = S.me.y + (m.y - S.me.y) * k;
      if (S.kicked && Math.hypot(b.x - o.x, b.y - o.y) < 6) { tx = b.x; ty = b.y; }
      move(o, tx, ty, oppSpeed * (S.kicked ? 1 : 0.6));
    });
    S.mates.forEach(m => {
      if (S.kicked && b.moving && Math.hypot(b.x - m.x, b.y - m.y) < 6) {   // vai buscar a bola quando ela chega perto
        const v2 = b.vx * b.vx + b.vy * b.vy || 1;
        const t = Util.clamp(((m.x - b.x) * b.vx + (m.y - b.y) * b.vy) / v2, 0, 1.2);
        move(m, b.x + b.vx * t, b.y + b.vy * t, 5);
      } else if (!S.kicked) {
        move(m, m.hx + Math.sin(S.t * 0.7 + m.num) * 1.5, m.hy + Math.cos(S.t * 0.5 + m.num) * 1.0, 1.5);
      }
    });
    if (S.kicked) MG.stepBall(b, null);
  },

  openness(S, m) { return Math.min(...S.opps.map(o => Moments.segDist(o, S.me, m)), 20); },
  bestMate(S) {
    let best = null, bs = -1e9;
    S.mates.forEach(m => { const sc = Moments.openness(S, m) * 2 - m.y * 0.15 - (m.offside ? 50 : 0); if (sc > bs) { bs = sc; best = m; } });
    return best;
  },
  segDist(p, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy || 1;
    const t = Util.clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / l2, 0, 1);
    return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
  },
  drawPressure(ctx, S) {
    const d = Math.hypot(S.presser.x - S.ball.x, S.presser.y - S.ball.y);
    const k = Util.clamp(1 - (d - 0.9) / 9, 0, 1);
    const s = MG.toScreen(S.cam, S.me.x, S.me.y);
    ctx.strokeStyle = k > 0.6 ? '#ff5252' : '#ffeb3b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(s[0], s[1] - 50, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke();
  },
};
