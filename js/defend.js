// Minijogo defensivo: segure e arraste para mover seu jogador. Encoste no atacante para dar o bote,
// fique na linha do passe para interceptar ou na frente do chute para bloquear.
const Defend = {
  RESULTS: {
    tackle: 'Desarme!', intercept: 'Interceptação!', block: 'Chute bloqueado!', cover: 'O companheiro cortou o passe',
    saved: 'Defesa do goleiro', wide: 'O chute foi para fora', foul: 'Falta!', conceded: 'Gol do adversário',
  },

  scenario(oppOvr, gkOvr) {
    const R = U.rf;
    const n = U.ri(2, 3);
    const attackers = [];
    const lanes = U.shuffle([150, 260, 380, 490]).slice(0, n);
    lanes.forEach((x, i) => attackers.push({ x: x + R(-20, 20), y: R(370, 430), lane: x, seed: R(0, 6) }));
    return {
      title: 'Lance defensivo', oppOvr, gk: { x: 320, y: 30, ovr: gkOvr },
      attackers, carrier: U.ri(0, n - 1),
      me: { x: 320 + R(-60, 60), y: R(215, 250) },
      mate: { x: R(200, 440), y: R(150, 180) },
    };
  },

  // attrs: { forca, velocidade, tecnica, resistencia }
  start(host, sc, attrs, onDone) {
    host.innerHTML = `
      <div class="kick-wrap">
        <div class="kick-head"><b>${U.esc(sc.title)}</b><span>Segure e arraste para mover. Encoste no atacante para dar o bote.</span></div>
        <canvas id="def-canvas" width="${Kick.W}" height="${Kick.H}"></canvas>
      </div>`;
    const cv = host.querySelector('#def-canvas');
    const ctx = cv.getContext('2d');
    const st = {
      me: { ...sc.me }, mate: { ...sc.mate }, gk: { ...sc.gk },
      atk: sc.attackers.map(a => ({ ...a })), carrier: sc.carrier,
      ball: { x: 0, y: 0, vx: 0, vy: 0, mode: 'held', to: null },
      target: null, stun: 0, stamina: 100, t: 0, lastPass: 0, over: false, msg: null, msgT: 0,
    };
    const atkSpeed = 1.2 + sc.oppOvr / 100 * 1.2;
    const mySpeed = 1.4 + attrs.velocidade / 100 * 1.8;

    const toLocal = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * Kick.W / r.width, y: (e.clientY - r.top) * Kick.H / r.height };
    };
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); st.target = toLocal(e); });
    cv.addEventListener('pointermove', (e) => { if (st.target) st.target = toLocal(e); });
    const release = () => { st.target = null; };
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);

    const finish = (result) => {
      if (st.over) return;
      st.over = true; st.msg = Defend.RESULTS[result]; st.msgT = 0;
      setTimeout(() => { cancelAnimationFrame(st.raf); onDone({ result }); }, 1500);
    };
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const moveTo = (o, tx, ty, sp) => {
      const d = Math.hypot(tx - o.x, ty - o.y);
      if (d < 0.5) return 0;
      const k = Math.min(sp, d) / d;
      o.x += (tx - o.x) * k; o.y += (ty - o.y) * k;
      return Math.min(sp, d);
    };

    function shoot(from) {
      const tx = U.rf(Kick.POST_L + 6, Kick.POST_R - 6) + (Math.random() < 0.2 ? U.rf(-40, 40) : 0);
      const sp = 8 + sc.oppOvr / 100 * 4;
      const d = Math.hypot(tx - from.x, Kick.GOAL_Y - 4 - from.y);
      st.ball = { x: from.x, y: from.y - 10, vx: (tx - from.x) / d * sp, vy: (Kick.GOAL_Y - 4 - from.y) / d * sp, mode: 'shot' };
    }

    function physics() {
      st.t++;
      if (st.over) {
        if (st.ball.mode !== 'held') { st.ball.x += st.ball.vx; st.ball.y += st.ball.vy; st.ball.vx *= 0.95; st.ball.vy *= 0.95; }
        return;
      }
      // seu jogador
      if (st.burst > 0) st.burst--;
      if (st.stun > 0) st.stun--;
      else if (st.target) {
        const tired = st.stamina <= 0 ? 0.5 : 1;
        const moved = moveTo(st.me, st.target.x, st.target.y, mySpeed * tired);
        st.stamina = Math.max(0, st.stamina - moved * 0.12 * (1.6 - attrs.resistencia / 100));
      }
      if (!st.target || st.stun > 0) st.stamina = Math.min(100, st.stamina + 0.35);
      st.me.x = U.clamp(st.me.x, 14, Kick.W - 14); st.me.y = U.clamp(st.me.y, Kick.GOAL_Y + 30, Kick.H - 10);

      const car = st.ball.mode === 'held' ? st.atk[st.carrier] : null;
      // atacantes
      st.atk.forEach((a, i) => {
        if (i === st.carrier && car) {
          let tx = 320 + Math.sin(st.t * 0.03 + a.seed) * 90, ty = 60;
          const dm = dist(a, st.me);
          if (dm < 80) { tx += (a.x - st.me.x) * 2.2; ty += 30; }
          moveTo(a, tx, ty, atkSpeed * (st.burst > 0 ? 1.6 : 1));
        } else {
          // os outros acompanham a jogada pelos corredores
          const ref = car ? car.y : st.ball.y;
          moveTo(a, a.lane + Math.sin(st.t * 0.02 + a.seed) * 30, Math.max(110, ref + 10), atkSpeed * 0.85);
        }
      });
      // companheiro marca o atacante livre mais perigoso
      const free = st.atk.filter((a, i) => i !== st.carrier).sort((a, b) => a.y - b.y)[0];
      if (free) moveTo(st.mate, free.x + (320 - free.x) * 0.25, free.y - 30, 1.5);
      // goleiro
      const g = st.gk, gkSp = 1.4 + g.ovr / 100 * 2.4;
      let gx = st.ball.mode === 'held' ? car.x : st.ball.x;
      if (st.ball.mode === 'shot' && st.ball.vy < 0) gx = st.ball.x + st.ball.vx * ((st.ball.y - g.y) / -st.ball.vy);
      g.x += U.clamp(U.clamp(gx, Kick.POST_L + 4, Kick.POST_R - 4) - g.x, -gkSp, gkSp);

      if (st.ball.mode === 'held') {
        st.ball.x = car.x; st.ball.y = car.y - 12;
        // bote
        if (st.stun <= 0 && dist(st.me, car) < 22) {
          const p = U.clamp(0.22 + attrs.forca / 250 + attrs.tecnica / 500 - sc.oppOvr / 400, 0.1, 0.75);
          if (Math.random() < p) return finish('tackle');
          if (Math.random() < 0.18) return finish('foul');
          st.stun = 60; st.burst = 45; st.msg = 'Driblado!'; st.msgT = 0;
          car.y -= 14;
        }
        // passe
        if (dist(st.me, car) < 70 && st.t - st.lastPass > 40 && Math.random() < 0.035) {
          const opts = st.atk.map((a, i) => [a, i]).filter(([a, i]) => i !== st.carrier && dist(a, st.me) > 70);
          if (opts.length) {
            const [rcv, ri] = U.pick(opts);
            const d = dist(rcv, car), sp = 6.5;
            st.ball = { x: car.x, y: car.y - 12, vx: (rcv.x - car.x) / d * sp, vy: (rcv.y - 20 - car.y + 12) / d * sp, mode: 'pass', to: ri };
            st.lastPass = st.t;
          }
        }
        // chute
        if (car.y < 165 || (car.y < 240 && Math.random() < 0.008)) shoot(car);
        return;
      }
      const b = st.ball;
      b.x += b.vx; b.y += b.vy;
      if (b.mode === 'pass') {
        if (dist(b, st.me) < 17 && st.stun <= 0) return finish('intercept');
        if (dist(b, st.mate) < 13) return finish('cover');
        const rcv = st.atk[b.to];
        if (dist(b, rcv) < 18) { st.carrier = b.to; b.mode = 'held'; return; }
        if (b.x < 0 || b.x > Kick.W || b.y < Kick.GOAL_Y || b.y > Kick.H) return finish('cover');
      } else if (b.mode === 'shot') {
        if (dist(b, st.me) < 17) { b.vx = -b.vx * 0.3 + U.rf(-2, 2); b.vy = -b.vy * 0.3; return finish('block'); }
        if (b.y <= g.y + 6 && b.y >= g.y - 8) {
          const sp = Math.hypot(b.vx, b.vy);
          if (Math.abs(b.x - g.x) < 16 + g.ovr / 100 * 9 && !(sp > 11 && Math.random() < (sp - 11) * 0.12)) {
            b.vy = -b.vy * 0.4; return finish('saved');
          }
        }
        if (b.y <= Kick.GOAL_Y) {
          if (b.x > Kick.POST_L && b.x < Kick.POST_R) { b.vx *= 0.3; b.vy *= 0.3; return finish('conceded'); }
          return finish('wide');
        }
      }
    }

    function draw() {
      Kick.drawPitch(ctx);
      st.atk.forEach(a => Kick.dot(ctx, a.x, a.y, '#d84343', '#7a1010'));
      Kick.dot(ctx, st.mate.x, st.mate.y, '#2f6fd6', '#0f2f66');
      Kick.dot(ctx, st.gk.x, st.gk.y, '#f2c12e', '#6b5200');
      Kick.dot(ctx, st.me.x, st.me.y, st.stun > 0 ? '#9aa7b4' : '#ffffff', '#1d4ed8', 'VOCÊ');
      if (st.target && !st.over) {
        ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(st.me.x, st.me.y); ctx.lineTo(st.target.x, st.target.y); ctx.stroke(); ctx.setLineDash([]);
      }
      Kick.ball(ctx, st.ball.x, st.ball.y);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(14, Kick.H - 30, 124, 16);
      ctx.fillStyle = st.stamina < 25 ? '#ff6b6b' : '#7cd8ff'; ctx.fillRect(16, Kick.H - 28, 120 * st.stamina / 100, 12);
      ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Fôlego', 144, Kick.H - 18);
      if (st.msg) {
        st.msgT++;
        Kick.banner(ctx, st.msg, Math.max(0, 1 - st.msgT / (st.over ? 120 : 50)));
        if (!st.over && st.msgT > 50) st.msg = null;
      }
    }

    Defend._st = st;
    function loop() { physics(); draw(); st.raf = requestAnimationFrame(loop); }
    loop();
  },
};
