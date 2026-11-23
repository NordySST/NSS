// Tela de partida ao vivo (compartilhada pelos dois modos)
const MatchView = {
  SPEEDS: { 1: 450, 2: 180, 3: 50 },

  open(host, w, m, opts) {
    const H = w.teams[m.sides[0].id], A = w.teams[m.sides[1].id];
    host.innerHTML = `
      <div class="match">
        <div class="scoreboard">
          <div class="sb-team"><span class="badge" style="background:${H.c1};color:${H.c2}">${H.short}</span>${U.esc(H.name)}</div>
          <div class="sb-score"><span id="mv-score">0 - 0</span><small id="mv-min">0'</small></div>
          <div class="sb-team right">${U.esc(A.name)}<span class="badge" style="background:${A.c1};color:${A.c2}">${A.short}</span></div>
        </div>
        <div class="match-body">
          <div class="match-main">
            <canvas id="mv-pitch" width="640" height="380"></canvas>
            <div id="mv-moment" class="hidden"></div>
            <div class="mv-bar">
              <button class="btn sm" id="mv-pause">⏸ Pausar</button>
              <span class="muted small">Velocidade:</span>
              <button class="btn sm sp" data-sp="1">1x</button>
              <button class="btn sm sp" data-sp="2">2x</button>
              <button class="btn sm sp" data-sp="3">4x</button>
              <button class="btn sm" id="mv-skip">⏭ Simular até o fim</button>
            </div>
            <div class="mv-stats" id="mv-stats"></div>
          </div>
          <div class="match-side">
            <div id="mv-extra"></div>
            <h4>Narração</h4>
            <div id="mv-feed" class="feed"></div>
          </div>
        </div>
      </div>`;
    const S = {
      speed: opts.speed || 2, paused: false, timer: null, ended: false, skipping: false,
      dots: null, ballPos: { x: 0.5, y: 0.5 }, ballTarget: { x: 0.5, y: 0.5 }, flash: 0,
    };
    const $ = (id) => host.querySelector('#' + id);
    const feed = $('mv-feed');

    const renderStats = () => {
      const tot = m.stats.poss[0] + m.stats.poss[1] || 1;
      const ph = Math.round(m.stats.poss[0] / tot * 100);
      $('mv-stats').innerHTML = `
        <div class="srow"><b>${ph}%</b><span>Posse de bola</span><b>${100 - ph}%</b></div>
        <div class="srow"><b>${m.stats.shots[0]}</b><span>Finalizações</span><b>${m.stats.shots[1]}</b></div>
        <div class="srow"><b>${m.stats.onT[0]}</b><span>No gol</span><b>${m.stats.onT[1]}</b></div>`;
      $('mv-score').textContent = m.score[0] + ' - ' + m.score[1];
      $('mv-min').textContent = m.minute + "'";
    };
    const addEvents = (evs) => evs.forEach(e => {
      const div = document.createElement('div');
      div.className = 'ev ev-' + e.type + (e.side === opts.userSide ? ' mine' : '');
      const icon = { goal: '⚽', save: '🧤', miss: '↗', yellow: '🟨', red: '🟥', injury: '✚', sub: '⇄', ht: '⏱', ft: '🏁', moment: '★' }[e.type] || '•';
      div.innerHTML = `<span class="evmin">${e.min}'</span> ${icon} ${U.esc(e.text)}`;
      feed.prepend(div);
      if (e.type === 'goal') S.flash = 60;
    });
    MatchView.addEvents = addEvents;
    const renderExtra = () => { if (opts.extraPanel) $('mv-extra').innerHTML = opts.extraPanel(m); };
    MatchView.refresh = () => { renderExtra(); renderStats(); };

    const tick = () => {
      if (S.paused || S.ended || S.waiting) return;
      if (opts.hook && opts.hook(m, resume, $('mv-moment'))) { S.waiting = true; return; }
      const evs = Engine.step(w, m);
      addEvents(evs);
      S.ballTarget = { x: m.ball, y: U.rf(0.15, 0.85) };
      renderStats();
      if (evs.some(e => e.type === 'goal' || e.type === 'injury' || e.type === 'red' || e.type === 'sub')) renderExtra();
      if (m.done) end();
    };
    function resume() {
      S.waiting = false;
      $('mv-moment').classList.add('hidden');
      $('mv-pitch').classList.remove('hidden');
      renderStats(); renderExtra();
    }
    function end() {
      S.ended = true; clearInterval(S.timer); cancelAnimationFrame(S.raf);
      $('mv-pause').disabled = true; $('mv-skip').disabled = true;
      renderStats();
      opts.onEnd(m);
    }
    const setSpeed = (sp) => {
      S.speed = sp; clearInterval(S.timer);
      S.timer = setInterval(tick, MatchView.SPEEDS[sp]);
      host.querySelectorAll('.sp').forEach(b => b.classList.toggle('active', +b.dataset.sp === sp));
    };
    host.querySelectorAll('.sp').forEach(b => b.onclick = () => setSpeed(+b.dataset.sp));
    $('mv-pause').onclick = () => {
      S.paused = !S.paused;
      $('mv-pause').textContent = S.paused ? '▶ Continuar' : '⏸ Pausar';
    };
    $('mv-skip').onclick = () => {
      if (opts.confirmSkip && !confirm(opts.confirmSkip)) return;
      clearInterval(S.timer);
      while (!m.done) {
        if (opts.hook && opts.hook(m, resume, $('mv-moment'), true)) continue;
        addEvents(Engine.step(w, m));
      }
      end();
    };
    MatchView.pause = (v) => { S.paused = v; $('mv-pause').textContent = S.paused ? '▶ Continuar' : '⏸ Pausar'; };

    // animação do campo
    const cv = $('mv-pitch'), ctx = cv.getContext('2d');
    const layout = (side, i) => {
      const f = FORMATIONS[side.formation];
      const pos = Engine.slotPos(side.formation, i);
      const counts = { GOL: 1, DEF: f.DEF, MEI: f.MEI, ATA: f.ATA };
      const idx = pos === 'GOL' ? 0 : pos === 'DEF' ? i - 1 : pos === 'MEI' ? i - 1 - f.DEF : i - 1 - f.DEF - f.MEI;
      const xs = { GOL: 0.05, DEF: 0.2, MEI: 0.36, ATA: 0.47 };
      return { x: xs[pos], y: (idx + 1) / (counts[pos] + 1) };
    };
    const draw = () => {
      const W = cv.width, Hh = cv.height;
      for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#2f8a3c' : '#2a7f36'; ctx.fillRect(i * W / 12, 0, W / 12, Hh); }
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, W - 16, Hh - 16);
      ctx.beginPath(); ctx.moveTo(W / 2, 8); ctx.lineTo(W / 2, Hh - 8); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, Hh / 2, 45, 0, 7); ctx.stroke();
      ctx.strokeRect(8, Hh / 2 - 80, 80, 160); ctx.strokeRect(W - 88, Hh / 2 - 80, 80, 160);
      ctx.strokeRect(8, Hh / 2 - 35, 28, 70); ctx.strokeRect(W - 36, Hh / 2 - 35, 28, 70);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(2, Hh / 2 - 22, 6, 44); ctx.fillRect(W - 8, Hh / 2 - 22, 6, 44);

      S.ballPos.x += (S.ballTarget.x - S.ballPos.x) * 0.05;
      S.ballPos.y += (S.ballTarget.y - S.ballPos.y) * 0.05;
      const t = performance.now() / 1000;
      m.sides.forEach((side, si) => {
        const team = si === 0 ? H : A;
        side.xi.forEach((pid, i) => {
          if (pid == null || side.off.includes(pid)) return;
          const L = layout(side, i);
          const shift = (S.ballPos.x - 0.5) * 0.35;
          let x = si === 0 ? L.x + shift + (i ? 0.02 : 0) : 1 - L.x + shift - (i ? 0.02 : 0);
          if (i === 0) x = si === 0 ? 0.04 : 0.96;
          let y = L.y + (S.ballPos.y - 0.5) * 0.2 + Math.sin(t * 1.3 + pid) * 0.015;
          x += Math.cos(t * 0.9 + pid * 2) * 0.008;
          const X = 8 + x * (W - 16), Y = 8 + y * (Hh - 16);
          ctx.beginPath(); ctx.arc(X, Y, 8, 0, 7);
          ctx.fillStyle = team.c1; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = team.c2; ctx.stroke();
          if (pid === opts.highlight) { ctx.beginPath(); ctx.arc(X, Y, 13, 0, 7); ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2; ctx.stroke(); }
        });
      });
      const bx = 8 + S.ballPos.x * (W - 16), by = 8 + S.ballPos.y * (Hh - 16);
      ctx.beginPath(); ctx.arc(bx, by, 5, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
      if (S.flash > 0) {
        S.flash--;
        ctx.fillStyle = `rgba(0,0,0,${Math.min(0.5, S.flash / 60)})`; ctx.fillRect(0, Hh / 2 - 40, W, 80);
        ctx.fillStyle = '#ffeb3b'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center';
        ctx.globalAlpha = Math.min(1, S.flash / 30); ctx.fillText('GOL!', W / 2, Hh / 2 + 16); ctx.globalAlpha = 1;
      }
      S.raf = requestAnimationFrame(draw);
    };
    draw();
    renderExtra(); renderStats();
    setSpeed(S.speed);
    return S;
  },
};
