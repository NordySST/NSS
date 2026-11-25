// Treino de velocidade: slalom entre cones conduzindo a bola.
// Segure e arraste o dedo (ou o mouse): o jogador segue o dedo.
const Cones = {
  START_Y: 425, FINISH_Y: 78, LANE: 44,

  scenario() {
    const n = U.ri(5, 6);
    const cones = [];
    const gap = (Cones.START_Y - 70 - (Cones.FINISH_Y + 50)) / (n - 1);
    let side = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < n; i++) {
      cones.push({ x: 320 + U.rf(-70, 70), y: Cones.START_Y - 70 - i * gap, side, hit: false, passed: false });
      side = -side;   // lados alternados: zigue-zague
    }
    return { title: 'Slalom de cones', cones };
  },

  // attrs: { velocidade, tecnica, energia }
  start(host, sc, attrs, onDone) {
    host.innerHTML = `
      <div class="kick-wrap">
        <div class="kick-head"><b>${U.esc(sc.title)}</b><span>Passe pelo lado indicado pela seta verde.</span></div>
        <canvas id="cones-canvas" width="${Kick.W}" height="${Kick.H}"></canvas>
        <div class="kick-controls">${Kick.speedSelect()}<span class="muted small">Segure e arraste o dedo: o jogador segue o seu dedo. Tocar no cone: +1 s. Lado errado: +3 s.</span></div>
      </div>`;
    const cv = host.querySelector('#cones-canvas');
    const ctx = cv.getContext('2d');
    const speed = 1.3 + attrs.velocidade / 100 * 2.2 * (0.8 + 0.2 * (attrs.energia ?? 100) / 100);
    const grip = 0.12 + attrs.tecnica / 100 * 0.25;   // quanto a bola acompanha o pé
    const st = {
      me: { x: 320, y: Cones.START_Y + 15 }, ball: { x: 320, y: Cones.START_Y + 3 },
      dir: { x: 0, y: -1 }, target: null, started: false, steps: 0, penalty: 0, slow: 0,
      cones: sc.cones.map(c => ({ ...c })), over: false, msg: null, msgT: 0, wrong: 0, hits: 0,
    };
    // tempo ideal: percurso em zigue-zague na sua velocidade máxima
    let path = 0, px = 320, py = Cones.START_Y + 15;
    st.cones.forEach(c => { const tx = c.x + c.side * Cones.LANE; path += Math.hypot(tx - px, c.y - py); px = tx; py = c.y; });
    path += Math.hypot(320 - px, Cones.FINISH_Y - 10 - py);
    const par = path / speed / 60 * 1.12;

    const toLocal = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * Kick.W / r.width, y: (e.clientY - r.top) * Kick.H / r.height };
    };
    cv.addEventListener('pointerdown', (e) => { if (st.over) return; cv.setPointerCapture(e.pointerId); st.target = toLocal(e); st.started = true; });
    cv.addEventListener('pointermove', (e) => { if (st.target) st.target = toLocal(e); });
    const release = () => { st.target = null; };
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);

    const finish = (timedOut) => {
      if (st.over) return;
      st.over = true;
      const t = st.steps / 60 + st.penalty;
      // no tempo ideal (ou melhor) = nota máxima; 80% acima dele = zero
      const score = timedOut ? 0 : U.clamp(1 - (t / par - 1) / 0.8, 0, 1);
      st.msg = timedOut ? 'Tempo esgotado!' : `Tempo: ${t.toFixed(2)} s`;
      st.msgT = 0;
      st.result = { result: 'cones', score, time: t, par };
      setTimeout(() => { cancelAnimationFrame(st.raf); onDone(st.result); }, 1900);
    };

    function physics() {
      if (st.over) return;
      if (st.started) st.steps++;
      if (st.steps > 60 * 30) return finish(true);
      const me = st.me;
      if (st.target) {
        const dx = st.target.x - me.x, dy = st.target.y - me.y, d = Math.hypot(dx, dy);
        const sp = speed * (st.slow > 0 ? 0.45 : 1);
        if (d > 1) {
          const mv = Math.min(sp, d);
          me.x += dx / d * mv; me.y += dy / d * mv;
          st.dir = { x: dx / d, y: dy / d };
        }
      }
      if (st.slow > 0) st.slow--;
      me.x = U.clamp(me.x, 20, Kick.W - 20); me.y = U.clamp(me.y, 20, Kick.H - 10);
      // a bola vai um pouco à frente do pé; com pouca técnica ela se solta nas curvas
      const bx = me.x + st.dir.x * 13, by = me.y + st.dir.y * 13 - 4;
      st.ball.x += (bx - st.ball.x) * grip; st.ball.y += (by - st.ball.y) * grip;

      st.cones.forEach(c => {
        if (!c.hit && (Math.hypot(me.x - c.x, me.y - c.y) < 15 || Math.hypot(st.ball.x - c.x, st.ball.y - c.y) < 10)) {
          c.hit = true; st.penalty += 1; st.hits++; st.slow = 30;
          st.msg = 'Derrubou o cone! +1 s'; st.msgT = 0;
        }
        if (!c.passed && me.y < c.y) {
          c.passed = true;
          if (Math.sign(me.x - c.x) !== c.side) { st.penalty += 3; st.wrong++; c.wrong = true; st.msg = 'Lado errado! +3 s'; st.msgT = 0; }
        }
      });
      if (me.y < Cones.FINISH_Y) finish(false);
    }

    function drawCone(c) {
      if (c.hit) {   // cone derrubado
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(1.2);
        ctx.fillStyle = '#c95a12'; ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(6, 8); ctx.lineTo(0, -10); ctx.closePath(); ctx.fill();
        ctx.restore(); return;
      }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 8, 10, 4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(c.x - 9, c.y + 8); ctx.lineTo(c.x + 9, c.y + 8); ctx.lineTo(c.x, c.y - 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(c.x - 5, c.y - 2, 10, 3);
      // seta do lado em que você deve passar
      if (!c.passed) {
        const ax = c.x + c.side * Cones.LANE;
        ctx.strokeStyle = '#7cff8a'; ctx.fillStyle = '#7cff8a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ax, c.y + 12); ctx.lineTo(ax, c.y - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax - 6, c.y - 4); ctx.lineTo(ax, c.y - 14); ctx.lineTo(ax + 6, c.y - 4); ctx.closePath(); ctx.fill();
      } else if (c.wrong) {
        ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✕', c.x + c.side * Cones.LANE, c.y + 4);
      }
    }

    function draw() {
      for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#2f8a3c' : '#2a7f36'; ctx.fillRect(0, i * Kick.H / 10, Kick.W, Kick.H / 10); }
      // largada e chegada
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(40, Cones.START_Y, Kick.W - 80, 3);
      for (let x = 40; x < Kick.W - 40; x += 16) {
        ctx.fillStyle = ((x / 16) | 0) % 2 ? '#111' : '#fff'; ctx.fillRect(x, Cones.FINISH_Y - 6, 16, 6);
        ctx.fillStyle = ((x / 16) | 0) % 2 ? '#fff' : '#111'; ctx.fillRect(x, Cones.FINISH_Y, 16, 6);
      }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('CHEGADA', 44, Cones.FINISH_Y - 12); ctx.fillText('LARGADA', 44, Cones.START_Y + 18);
      st.cones.forEach(drawCone);
      if (st.target && !st.over) {
        ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(st.me.x, st.me.y); ctx.lineTo(st.target.x, st.target.y); ctx.stroke(); ctx.setLineDash([]);
      }
      Kick.dot(ctx, st.me.x, st.me.y, st.slow > 0 ? '#9aa7b4' : '#ffffff', '#1d4ed8', 'VOCÊ');
      Kick.ball(ctx, st.ball.x, st.ball.y);
      // cronômetro
      const t = st.steps / 60 + st.penalty;
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(Kick.W - 200, 6, 188, 50);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(t.toFixed(2) + ' s', Kick.W - 20, 30);
      ctx.font = '11px sans-serif'; ctx.fillStyle = '#cfe3f5';
      ctx.fillText(`ideal ${par.toFixed(1)} s • penalidades ${st.penalty.toFixed(1)} s`, Kick.W - 20, 48);
      if (!st.started) Kick.banner(ctx, 'Toque e arraste para começar', 0.9);
      if (st.msg) {
        st.msgT += st.rt || 1;
        if (st.over) Kick.banner(ctx, st.msg, Math.max(0, 1 - st.msgT / 120));
        else {
          ctx.globalAlpha = Math.max(0, 1 - st.msgT / 70);
          ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(12, 6, 230, 28);
          ctx.fillStyle = '#ffb4a8'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(st.msg, 22, 26); ctx.globalAlpha = 1;
          if (st.msgT > 70) st.msg = null;
        }
      }
    }

    Cones._st = st;
    function loop(now) {
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
