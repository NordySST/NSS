// Modo Carreira de Jogador
const ATTRS = {
  chute: 'Chute', passe: 'Passe', tecnica: 'Técnica', velocidade: 'Velocidade', forca: 'Força', resistencia: 'Resistência',
};
const ATTR_W = {
  ATA: { chute: .34, tecnica: .2, velocidade: .2, forca: .1, passe: .1, resistencia: .06 },
  MEI: { passe: .34, tecnica: .25, chute: .14, resistencia: .11, velocidade: .1, forca: .06 },
  DEF: { forca: .3, velocidade: .2, resistencia: .2, passe: .15, tecnica: .1, chute: .05 },
};

// Provas da peneira por posição
const TRIALS = {
  ATA: [
    { name: 'Finalização', type: 'chance', n: 3, attrs: ['chute', 'forca'], tip: 'faça o gol com o goleiro e a marcação na frente.' },
    { name: 'Contra-ataque', type: 'contra', n: 2, attrs: ['velocidade', 'passe'], tip: 'passe para um companheiro: ele decide se finaliza ou devolve para você, que se desloca.' },
    { name: 'Bola parada', type: 'falta', n: 2, attrs: ['tecnica'], tip: 'bata embaixo da bola para passar por cima da barreira, ou de lado para curvar.' },
  ],
  MEI: [
    { name: 'Armação', type: 'passe', n: 3, attrs: ['passe', 'tecnica'], tip: 'passe para os companheiros e receba de volta mais perto do gol. Cada passe certo vale pontos.' },
    { name: 'Chute de fora', type: 'longe', n: 2, attrs: ['chute'], tip: 'finalize de fora da área.' },
    { name: 'Transição', type: 'contra', n: 2, attrs: ['velocidade'], tip: 'puxe o contra-ataque.' },
    { name: 'Recomposição', type: 'defesa', n: 1, attrs: ['resistencia', 'forca'], tip: 'volte para marcar e recupere a bola.' },
  ],
  DEF: [
    { name: 'Marcação', type: 'defesa', n: 3, attrs: ['forca', 'tecnica'], tip: 'encoste no atacante para dar o bote, ou fique na linha do passe.' },
    { name: 'Cobertura', type: 'defesa', n: 2, attrs: ['velocidade', 'resistencia'], tip: 'acompanhe a jogada sem perder o fôlego.' },
    { name: 'Saída de bola', type: 'passe', n: 2, attrs: ['passe'], tip: 'troque passes com os companheiros.' },
    { name: 'Bola parada', type: 'falta', n: 1, attrs: ['chute'], tip: 'cobre a falta.' },
  ],
};

// Exercício de cada treino (usa o mesmo minijogo das partidas)
const TRAIN_DRILLS = {
  chute: { name: 'Finalização', type: 'chance', n: 3, tip: 'faça o gol. Bater no canto e com força conta.' },
  passe: { name: 'Troca de passes', type: 'passe', n: 3, tip: 'passe para os companheiros e chegue ao gol. Cada passe certo vale pontos.' },
  tecnica: { name: 'Bola parada', type: 'falta', n: 3, tip: 'escolha bem o ponto da bola: embaixo para passar a barreira, de lado para curvar.' },
  velocidade: { name: 'Contra-ataque', type: 'contra', n: 3, tip: 'decida rápido antes que a marcação chegue e conclua a jogada.' },
  forca: { name: 'Disputa de bola', type: 'defesa', n: 3, tip: 'encoste no atacante para dar o bote e recupere a bola.' },
  resistencia: { name: 'Marcação contínua', type: 'defesa', n: 3, tip: 'acompanhe a jogada sem perder o fôlego.' },
};

const SHOP = [
  { id: 'chut1', cat: 'Equipamento', name: 'Chuteira de treino', price: 6000, desc: '+2 Chute', fx: { chute: 2 } },
  { id: 'chut2', cat: 'Equipamento', name: 'Chuteira profissional', price: 45000, desc: '+3 Chute, +2 Técnica', fx: { chute: 3, tecnica: 2 } },
  { id: 'chut3', cat: 'Equipamento', name: 'Chuteira sob medida', price: 350000, desc: '+4 Chute, +3 Técnica, +2 Passe', fx: { chute: 4, tecnica: 3, passe: 2 } },
  { id: 'trainer', cat: 'Equipe pessoal', name: 'Preparador físico', price: 30000, desc: 'Treinos rendem +30%', fx: {} },
  { id: 'nutri', cat: 'Equipe pessoal', name: 'Nutricionista', price: 60000, desc: '+10 de energia recuperada por semana', fx: {} },
  { id: 'fisio', cat: 'Equipe pessoal', name: 'Fisioterapeuta', price: 150000, desc: 'Descanso recupera +15 de energia', fx: {} },
  { id: 'game', cat: 'Estilo de vida', name: 'Videogame', price: 3000, desc: '+6 Felicidade', happy: 6 },
  { id: 'car1', cat: 'Estilo de vida', name: 'Carro popular', price: 50000, desc: '+8 Felicidade', happy: 8 },
  { id: 'watch', cat: 'Estilo de vida', name: 'Relógio de luxo', price: 90000, desc: '+6 Felicidade, +3 Fama', happy: 6, fame: 3 },
  { id: 'apt', cat: 'Estilo de vida', name: 'Apartamento', price: 400000, desc: '+12 Felicidade', happy: 12 },
  { id: 'car2', cat: 'Estilo de vida', name: 'Carro esportivo', price: 600000, desc: '+14 Felicidade, +6 Fama', happy: 14, fame: 6 },
  { id: 'mansion', cat: 'Estilo de vida', name: 'Mansão', price: 4000000, desc: '+25 Felicidade, +10 Fama', happy: 25, fame: 10 },
  { id: 'heli', cat: 'Estilo de vida', name: 'Helicóptero', price: 9000000, desc: '+20 Felicidade, +15 Fama', happy: 20, fame: 15 },
  { id: 'yacht', cat: 'Estilo de vida', name: 'Iate', price: 15000000, desc: '+30 Felicidade, +20 Fama', happy: 30, fame: 20 },
];

const EVENTS = [
  { t: 'Um jornalista pergunta sobre a fase do time na coletiva.', o: [
    ['Elogiar o técnico e o grupo', { tecnico: 5, elenco: 3 }],
    ['Dizer que merece mais oportunidades', { tecnico: -6, fama: 3, torcida: 2 }]] },
  { t: 'Torcedores esperam você na saída do treino pedindo fotos.', o: [
    ['Atender todo mundo com calma', { torcida: 6, energia: -8 }],
    ['Acenar e ir embora', { torcida: -3 }]] },
  { t: 'Os companheiros te chamam para uma festa no meio da semana.', o: [
    ['Ir à festa', { elenco: 7, energia: -20, tecnico: -3, felicidade: 6 }],
    ['Ficar em casa descansando', { elenco: -3, energia: 8 }]] },
  { t: 'O treinador pede que você fique para um treino extra.', o: [
    ['Topar o treino extra', { tecnico: 6, energia: -15, xp: 1 }],
    ['Dizer que está cansado', { tecnico: -5 }]] },
  { t: 'Uma marca esportiva local quer você em uma campanha.', need: 20, o: [
    ['Aceitar o contrato', { dinheiro: 'promo', fama: 4 }],
    ['Recusar para focar no futebol', { tecnico: 2 }]] },
  { t: 'Um colega de time está sendo criticado pela torcida nas redes.', o: [
    ['Defender o companheiro publicamente', { elenco: 6, torcida: -2 }],
    ['Não se envolver', { elenco: -2 }]] },
  { t: 'Uma escola da sua cidade natal convida você para uma visita.', o: [
    ['Visitar as crianças', { fama: 3, torcida: 3, felicidade: 5, energia: -10 }],
    ['Mandar uma camisa autografada', { fama: 1 }]] },
  { t: 'Um empresário promete te levar para um clube maior por uma taxa.', o: [
    ['Pagar a taxa', { dinheiro: -15000, fama: 2, offer: 1 }],
    ['Desconfiar e recusar', {}]] },
  { t: 'A diretoria pede que você participe de um evento com patrocinadores.', o: [
    ['Participar', { tecnico: 2, fama: 2, energia: -10, dinheiro: 3000 }],
    ['Inventar uma desculpa', { tecnico: -3 }]] },
];

const PM = {
  get w() { return G.world; },
  get u() { return G.user; },
  get p() { return G.world.players[G.user.pid]; },
  get team() { return G.world.teams[PM.p.teamId]; },

  computeOvr(attrs, pos) {
    const wts = ATTR_W[pos];
    return Math.round(Object.keys(wts).reduce((s, k) => s + attrs[k] * wts[k], 0));
  },
  syncPlayer() {
    const p = PM.p;
    p.ovr = PM.computeOvr(PM.u.attrs, p.pos);
    p.pot = Math.max(p.pot, p.ovr);
    p.fitness = PM.u.energia;
    p.morale = U.clamp(40 + PM.u.felicidade * 0.3 + PM.u.rel.elenco * 0.3, 10, 100);
    Data.updateValue(p);
  },

  newGame() {
    UI.screen(`
      <div class="panel narrow">
        <h2>Criar jogador</h2>
        <label>Nome <input id="c-first" value="${U.pick(NAMES.first)}" maxlength="16"></label>
        <label>Sobrenome <input id="c-last" value="${U.pick(NAMES.last)}" maxlength="16"></label>
        <label>Posição
          <select id="c-pos">
            <option value="ATA">Atacante</option><option value="MEI">Meio-campo</option><option value="DEF">Defensor</option>
          </select>
        </label>
        <p class="muted small">Antes de assinar, você passa por uma <b>peneira</b> com provas da sua posição. O desempenho define seus atributos iniciais e qual clube vai te contratar.</p>
        <div class="row wrap"><button class="btn" onclick="Menu.show()">Voltar</button>
        <button class="btn" onclick="PM.skipTrial()">Pular peneira</button>
        <button class="btn primary" onclick="PM.startTrial()">Fazer a peneira</button></div>
      </div>`);
  },

  readForm() {
    return {
      first: document.getElementById('c-first').value.trim() || 'Jogador',
      last: document.getElementById('c-last').value.trim() || 'Novo',
      pos: document.getElementById('c-pos').value,
    };
  },

  skipTrial() {
    const f = PM.readForm();
    const attrs = {};
    Object.keys(ATTRS).forEach(k => attrs[k] = U.ri(34, 42));
    Object.keys(ATTR_W[f.pos]).sort((a, b) => ATTR_W[f.pos][b] - ATTR_W[f.pos][a]).slice(0, 2).forEach(k => attrs[k] += 4);
    PM.create(f, attrs, 2);
  },

  // ---------- Peneira ----------
  startTrial() {
    const f = PM.readForm();
    PM.trial = { form: f, drills: TRIALS[f.pos].map(d => ({ ...d, scores: [] })), di: 0 };
    PM.trialStep();
  },

  trialStep() {
    const T = PM.trial;
    const d = T.drills[T.di];
    if (!d) return PM.trialResult();
    const k = d.scores.length + 1;
    const list = T.drills.map((x, i) => `<li class="${i === T.di ? 'cur' : i < T.di ? 'done' : ''}">${x.name} ${i < T.di ? '— ' + PM.grade(U.avg(x.scores)) : ''}</li>`).join('');
    UI.screen(`
      <div class="trial">
        <div class="panel"><h2>Peneira — ${POS_NAMES[T.form.pos]}</h2>
          <ol class="trial-list">${list}</ol>
          <p><b>${d.name}</b> (tentativa ${k}/${d.n}): ${d.tip}</p>
          <p class="muted small">Avalia: ${d.attrs.map(a => ATTRS[a]).join(', ')}</p>
        </div>
        <div id="trial-host"></div>
      </div>`);
    const host = document.getElementById('trial-host');
    const base = { chute: 50, passe: 50, tecnica: 50, velocidade: 50, forca: 50, resistencia: 50, energia: 100 };
    const done = (r) => {
      d.scores.push(PM.trialScore(r));
      if (d.scores.length >= d.n) T.di++;
      PM.trialStep();
    };
    if (d.type === 'defesa') Defend.start(host, Defend.scenario(48, 50), base, done);
    else Kick.start(host, Kick.scenario(d.type, 45, 45), base, done);
  },

  trialScore(r) {
    const map = {
      goal: 1, assist: 0.85, saved: 0.4, blocked: 0.2, miss: 0.15,
      tackle: 1, intercept: 1, block: 0.9, cover: 0.5, wide: 0.45, foul: 0.15, conceded: 0,
    };
    let v = map[r.result] ?? 0.2;
    if (r.passes) v = Math.min(1, v + r.passes * 0.15);
    return v;
  },

  grade(v) { return v >= 0.85 ? 'A' : v >= 0.65 ? 'B' : v >= 0.45 ? 'C' : v >= 0.25 ? 'D' : 'E'; },

  trialResult() {
    const T = PM.trial;
    const acc = {};
    T.drills.forEach(d => d.attrs.forEach(a => (acc[a] = acc[a] || []).push(U.avg(d.scores))));
    const overall = U.avg(T.drills.map(d => U.avg(d.scores)));
    const attrs = {};
    Object.keys(ATTRS).forEach(k => {
      attrs[k] = acc[k] ? Math.round(30 + 22 * U.avg(acc[k])) + U.ri(-1, 1) : 30 + Math.round(10 * overall) + U.ri(0, 3);
    });
    const tier = overall >= 0.6 ? 1 : 2;
    T.attrs = attrs; T.tier = tier;
    const ovr = PM.computeOvr(attrs, T.form.pos);
    UI.screen(`<div class="panel narrow"><h2>Resultado da peneira</h2>
      ${T.drills.map(d => `<div class="kv"><span>${d.name}</span><b class="grade g-${PM.grade(U.avg(d.scores))}">${PM.grade(U.avg(d.scores))}</b></div>`).join('')}
      <div class="kv"><span>Nota geral</span><b class="grade g-${PM.grade(overall)}">${PM.grade(overall)}</b></div>
      <h4>Atributos iniciais</h4>
      ${Object.entries(ATTRS).map(([k, v]) => `<div class="kv"><span>${v}${acc[k] ? '' : ' <span class="muted small">(estimado)</span>'}</span><b class="${UI.ovrCls(attrs[k])}">${attrs[k]}</b></div>`).join('')}
      <div class="kv"><span>Geral como ${POS_NAMES[T.form.pos]}</span><b>${ovr}</b></div>
      <p>${tier === 1 ? 'Ótima peneira! Um clube da <b>Segunda Divisão</b> quer te contratar.' : 'Um clube da <b>Terceira Divisão</b> quer te contratar.'}</p>
      <div class="row"><button class="btn" onclick="PM.startTrial()">Refazer peneira</button>
      <button class="btn primary" onclick="PM.create(PM.trial.form, PM.trial.attrs, PM.trial.tier)">Assinar contrato</button></div></div>`);
  },

  create(f, attrs, tier) {
    const { first, last, pos } = f;
    const w = Data.createWorld();
    const pool = Object.values(w.teams).filter(t => t.tier === tier).sort((a, b) => a.rep - b.rep);
    const teamId = U.pick(pool.slice(0, Math.ceil(pool.length / 2))).id;
    const p = Data.makePlayer(pos, 40, 17);
    Object.assign(p, { first, last, isUser: true, teamId, pot: 99, contract: 2 });
    const salary = tier === 1 ? 1500 : 800;
    w.players[p.id] = p; w.teams[teamId].players.push(p.id);
    G = {
      mode: 'player', world: w,
      user: {
        pid: p.id, attrs, xp: {}, energia: 100, felicidade: 60, dinheiro: 5000, fama: 0,
        rel: { tecnico: 50, torcida: 40, elenco: 50 },
        items: [], salary, career: [], trophies: [], offers: [], inbox: [],
        lastRatings: [], tab: 'home', retired: false,
      },
    };
    PM.syncPlayer();
    PM.msg(`Bem-vindo ao ${w.teams[teamId].name}! Você assinou seu primeiro contrato profissional (${U.money(salary)}/semana, 2 temporadas).`);
    Save.save();
    PM.hub();
  },

  continue() { G = Save.load('player'); if (G) PM.hub(); else Menu.show(); },

  msg(text) { PM.u.inbox.unshift({ s: G.world.season, r: G.world.round, text }); PM.u.inbox = PM.u.inbox.slice(0, 40); },

  hub(tab) {
    if (tab) PM.u.tab = tab;
    if (PM.u.retired) return PM.retiredScreen();
    PM.syncPlayer();
    const w = PM.w, u = PM.u, p = PM.p, t = PM.team;
    const tabs = { home: 'Início', treino: 'Treino', loja: 'Loja', vida: 'Vida pessoal', tabela: 'Tabela', carreira: 'Carreira', msgs: 'Mensagens' };
    UI.screen(`
      <div class="topbar">
        <div class="tb-left">${UI.badge(t)}<div><b>${U.esc(Data.pname(p))}</b><div class="muted small">${POS_NAMES[p.pos]} • ${p.age} anos • ${U.esc(t.name)}</div></div></div>
        <div class="tb-stats">
          <div><span class="muted small">Geral</span><b class="${UI.ovrCls(p.ovr)}">${p.ovr}</b></div>
          <div><span class="muted small">Energia</span>${UI.bar(u.energia, 100, u.energia < 35 ? 'red' : '')}</div>
          <div><span class="muted small">Dinheiro</span><b>${U.money(u.dinheiro)}</b></div>
          <div><span class="muted small">Fama</span><b>${Math.round(u.fama)}</b></div>
        </div>
        <button class="btn sm" onclick="Save.save();Menu.show()">Menu</button>
      </div>
      <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab ${u.tab === k ? 'active' : ''}" onclick="PM.hub('${k}')">${v}${k === 'msgs' && u.offers.length ? ` <span class="pill">${u.offers.length}</span>` : ''}</button>`).join('')}</div>
      <div class="content">${PM['tab_' + u.tab]()}</div>`);
  },

  tab_home() {
    const w = PM.w, u = PM.u, p = PM.p, t = PM.team;
    const fx = Engine.fixtureFor(w, t.id);
    const lg = Data.leagueOf(w, t.id);
    const pos = Data.table(lg).findIndex(r => r.id === t.id) + 1;
    let next = '<p>Fim da temporada.</p>';
    if (fx) {
      const opp = w.teams[fx.h === t.id ? fx.a : fx.h];
      next = `<div class="next-match">
        <div class="nm-teams">${UI.badge(w.teams[fx.h])} <b>${U.esc(w.teams[fx.h].name)}</b> <span class="muted">x</span> <b>${U.esc(w.teams[fx.a].name)}</b> ${UI.badge(w.teams[fx.a])}</div>
        <div class="muted small">${lg.name} • Rodada ${w.round + 1}/${lg.fixtures.length} • ${fx.h === t.id ? 'Em casa' : 'Fora'} • Adversário: ${Data.table(lg).findIndex(r => r.id === opp.id) + 1}º</div>
        <button class="btn primary big" onclick="PM.preMatch()">Ir para a partida ▶</button></div>`;
    }
    const avg = u.lastRatings.length ? U.avg(u.lastRatings).toFixed(1) : '-';
    return `<div class="grid2">
      <div class="panel"><h3>Próximo jogo</h3>${next}</div>
      <div class="panel"><h3>Temporada ${w.season}</h3>
        <div class="kv"><span>Posição do clube</span><b>${pos}º na ${lg.name}</b></div>
        <div class="kv"><span>Jogos</span><b>${p.s.apps}</b></div>
        <div class="kv"><span>Gols</span><b>${p.s.goals}</b></div>
        <div class="kv"><span>Assistências</span><b>${p.s.assists}</b></div>
        <div class="kv"><span>Nota média</span><b>${Engine.avgRating(p)}</b></div>
        <div class="kv"><span>Últimas 5 notas</span><b>${avg}</b></div>
        <div class="kv"><span>Salário</span><b>${U.money(u.salary)}/sem</b></div>
        <div class="kv"><span>Contrato</span><b>${p.contract} temporada(s)</b></div>
      </div>
      <div class="panel"><h3>Ações da semana</h3>
        <p class="muted small">Cada treino gasta energia. Jogar cansado deixa seus chutes imprecisos.</p>
        <div class="row wrap">
          <button class="btn" onclick="PM.hub('treino')">🏋 Treinar</button>
          <button class="btn" onclick="PM.rest()">😴 Descansar (+${35 + (u.items.includes('fisio') ? 15 : 0)} energia)</button>
          <button class="btn" onclick="PM.hub('loja')">🛍 Loja</button>
        </div>
      </div>
      <div class="panel"><h3>Relacionamentos</h3>${PM.relHTML()}</div>
    </div>`;
  },

  relHTML() {
    const u = PM.u;
    return `<div class="kv"><span>Treinador</span>${UI.bar(u.rel.tecnico)}</div>
      <div class="kv"><span>Torcida</span>${UI.bar(u.rel.torcida)}</div>
      <div class="kv"><span>Elenco</span>${UI.bar(u.rel.elenco)}</div>
      <div class="kv"><span>Felicidade</span>${UI.bar(u.felicidade)}</div>`;
  },

  tab_treino() {
    const u = PM.u;
    return `<div class="panel"><h3>Treino</h3>
      <p class="muted small">Cada sessão é um exercício com 3 tentativas e custa 20 de energia. Quanto melhor você jogar, mais o atributo evolui; quanto mais alto ele já for, mais devagar sobe. Energia atual: <b>${Math.round(u.energia)}</b>.</p>
      <div class="attr-list">${Object.entries(ATTRS).map(([k, v]) => `
        <div class="attr">
          <div class="attr-name">${v}</div>
          <div class="attr-val ${UI.ovrCls(u.attrs[k])}">${u.attrs[k]}</div>
          <div class="attr-xp">${UI.bar((u.xp[k] || 0) * 100, 100, 'thin')}</div>
          <button class="btn sm" ${u.energia < 20 ? 'disabled' : ''} onclick="PM.train('${k}')" title="${TRAIN_DRILLS[k].name}">Treinar</button>
        </div>`).join('')}</div>
      <p class="muted small">Pesos no seu geral (${POS_NAMES[PM.p.pos]}): ${Object.entries(ATTR_W[PM.p.pos]).map(([k, v]) => ATTRS[k] + ' ' + Math.round(v * 100) + '%').join(' • ')}</p>
    </div>`;
  },

  // ---------- Treino jogável: o ganho depende do seu desempenho ----------
  train(k) {
    const u = PM.u;
    if (u.energia < 20) return UI.toast('Sem energia. Descanse.');
    u.energia -= 20;
    Save.save();
    PM.session = { k, d: TRAIN_DRILLS[k], scores: [] };
    PM.trainStep();
  },

  trainStep() {
    const S = PM.session, d = S.d, u = PM.u;
    if (S.scores.length >= d.n) return PM.trainResult();
    UI.screen(`
      <div class="trial">
        <div class="panel"><h2>Treino de ${ATTRS[S.k]} — ${d.name}</h2>
          <p><b>Tentativa ${S.scores.length + 1}/${d.n}:</b> ${d.tip}</p>
          <p class="muted small">Quanto melhor você for no exercício, mais o atributo evolui. Notas até agora: ${S.scores.map(v => `<b class="grade g-${PM.grade(v)}">${PM.grade(v)}</b>`).join(' ') || '-'}</p>
          <button class="btn sm" onclick="PM.trainQuit()">Encerrar treino</button>
        </div>
        <div id="trial-host"></div>
      </div>`);
    const host = document.getElementById('trial-host');
    // os adversários do treino têm o nível do seu elenco
    const lvl = Math.round(U.avg(PM.team.players.map(id => PM.w.players[id].ovr)));
    const attrs = { ...u.attrs, energia: Math.max(30, u.energia) };
    const done = (r) => {
      if (PM.session !== S) return;
      S.scores.push(PM.trialScore(r));
      PM.trainStep();
    };
    if (d.type === 'defesa') Defend.start(host, Defend.scenario(lvl, lvl), attrs, done);
    else Kick.start(host, Kick.scenario(d.type, lvl, lvl), attrs, done);
  },

  trainQuit() {
    const S = PM.session;
    // para a animação do exercício que estava rodando
    [Kick._st, Defend._st].forEach(st => { if (st) { st.over = true; cancelAnimationFrame(st.raf); } });
    S.played = S.scores.length;
    while (S.scores.length < S.d.n) S.scores.push(0);
    PM.trainResult();
  },

  trainResult() {
    const S = PM.session, u = PM.u, k = S.k;
    PM.session = null;
    const perf = U.avg(S.scores);
    const v = u.attrs[k];
    const ageF = PM.p.age <= 21 ? 1.3 : PM.p.age <= 26 ? 1 : PM.p.age <= 30 ? 0.7 : 0.4;
    // desempenho fraco quase não rende; desempenho ótimo rende bem mais
    const played = S.played ?? S.scores.length;
    const gain = played === 0 ? 0 : (0.05 + 0.95 * Math.pow(perf, 1.5)) * 0.9 * ageF * (u.items.includes('trainer') ? 1.3 : 1) * Math.max(0.15, (100 - v) / 55);
    u.xp[k] = (u.xp[k] || 0) + gain;
    let up = 0;
    while (u.xp[k] >= 1 && u.attrs[k] < 99) { u.xp[k] -= 1; u.attrs[k]++; up++; }
    const relD = perf >= 0.6 ? 2 : perf < 0.3 ? -1 : 1;
    u.rel.tecnico = U.clamp(u.rel.tecnico + relD, 0, 100);
    Save.save();
    PM.hub('treino');
    UI.modal(`<h3>Fim do treino</h3>
      <div class="kv"><span>Desempenho</span><b class="grade g-${PM.grade(perf)}">${PM.grade(perf)}</b></div>
      <div class="kv"><span>Evolução de ${ATTRS[k]}</span><b>+${Math.round(gain * 100)}% de uma barra</b></div>
      ${up ? `<p class="o-good"><b>${ATTRS[k]} subiu para ${u.attrs[k]}!</b></p>` : ''}
      <div class="kv"><span>Treinador</span><b>${relD > 0 ? '+' : ''}${relD}</b></div>
      <p class="muted small">${perf >= 0.6 ? 'O treinador gostou do que viu.' : perf < 0.3 ? 'Treino fraco. O treinador ficou de olho.' : 'Treino razoável.'}</p>
      <button class="btn primary" onclick="UI.closeModal()">OK</button>`);
  },

  rest() {
    const u = PM.u;
    u.energia = Math.min(100, u.energia + 35 + (u.items.includes('fisio') ? 15 : 0));
    u.felicidade = Math.min(100, u.felicidade + 1);
    UI.toast('Você descansou.'); Save.save(); PM.hub();
  },

  tab_loja() {
    const u = PM.u;
    const cats = [...new Set(SHOP.map(i => i.cat))];
    return cats.map(c => `<div class="panel"><h3>${c}</h3><div class="shop">${SHOP.filter(i => i.cat === c).map(i => {
      const owned = u.items.includes(i.id);
      return `<div class="shop-item ${owned ? 'owned' : ''}"><b>${i.name}</b><span class="muted small">${i.desc}</span><span>${U.money(i.price)}</span>
        ${owned ? '<span class="pill ok">Comprado</span>' : `<button class="btn sm" ${u.dinheiro < i.price ? 'disabled' : ''} onclick="PM.buy('${i.id}')">Comprar</button>`}</div>`;
    }).join('')}</div></div>`).join('');
  },

  buy(id) {
    const u = PM.u, it = SHOP.find(i => i.id === id);
    if (!it || u.items.includes(id) || u.dinheiro < it.price) return;
    u.dinheiro -= it.price; u.items.push(id);
    for (const k in (it.fx || {})) u.attrs[k] = Math.min(99, u.attrs[k] + it.fx[k]);
    if (it.happy) u.felicidade = Math.min(100, u.felicidade + it.happy);
    if (it.fame) u.fama += it.fame;
    UI.toast('Comprado: ' + it.name); Save.save(); PM.hub();
  },

  tab_vida() {
    const u = PM.u;
    const owned = SHOP.filter(i => u.items.includes(i.id));
    return `<div class="grid2"><div class="panel"><h3>Relacionamentos</h3>${PM.relHTML()}
      <p class="muted small">Treinador alto aumenta suas chances de ser titular. Torcida e fama trazem propostas melhores. Felicidade melhora seu moral em campo e a recuperação de energia.</p></div>
      <div class="panel"><h3>Seus bens</h3>${owned.length ? owned.map(i => `<div class="kv"><span>${i.name}</span><span class="muted small">${i.cat}</span></div>`).join('') : '<p class="muted">Nada ainda. Visite a loja.</p>'}</div></div>`;
  },

  tab_tabela() {
    const w = PM.w;
    return w.leagues.map(lg => `<div class="panel"><h3>${lg.name}</h3>${UI.tableHTML(w, lg, PM.team.id)}</div>`).join('');
  },

  tab_carreira() {
    const u = PM.u, p = PM.p;
    const rows = u.career.map(c => `<tr><td>${c.season}</td><td class="l">${U.esc(c.team)}</td><td>${c.league}</td><td>${c.apps}</td><td>${c.goals}</td><td>${c.assists}</td><td>${c.avg}</td><td>${c.ovr}</td></tr>`).join('');
    return `<div class="panel"><h3>Histórico</h3><table class="tbl"><thead><tr><th>Temp.</th><th class="l">Clube</th><th>Divisão</th><th>J</th><th>G</th><th>A</th><th>Nota</th><th>Geral</th></tr></thead>
      <tbody>${rows}<tr class="me"><td>${PM.w.season}</td><td class="l">${U.esc(PM.team.name)}</td><td>${Data.leagueOf(PM.w, PM.team.id).name}</td><td>${p.s.apps}</td><td>${p.s.goals}</td><td>${p.s.assists}</td><td>${Engine.avgRating(p)}</td><td>${p.ovr}</td></tr></tbody></table></div>
      <div class="panel"><h3>Títulos e prêmios</h3>${u.trophies.length ? u.trophies.map(t => `<div>🏆 ${U.esc(t)}</div>`).join('') : '<p class="muted">Nenhum ainda.</p>'}</div>
      <div class="panel"><button class="btn danger" onclick="PM.retire()">Encerrar carreira</button></div>`;
  },

  tab_msgs() {
    const u = PM.u, w = PM.w;
    const offers = u.offers.map((o, i) => {
      const t = w.teams[o.teamId];
      return `<div class="offer">${UI.badge(t)} <div><b>${U.esc(t.name)}</b> (${LEAGUE_NAMES[t.tier]}) quer te contratar<div class="muted small">${U.money(o.wage)}/semana • ${o.years} temporada(s)${o.renew ? ' • renovação' : ''}</div></div>
        <button class="btn sm primary" onclick="PM.acceptOffer(${i})">Aceitar</button><button class="btn sm" onclick="PM.rejectOffer(${i})">Recusar</button></div>`;
    }).join('');
    return `<div class="panel"><h3>Propostas</h3>${offers || '<p class="muted">Nenhuma proposta no momento.</p>'}</div>
      <div class="panel"><h3>Mensagens</h3>${u.inbox.map(m => `<div class="msg"><span class="muted small">T${m.s} R${m.r}</span> ${U.esc(m.text)}</div>`).join('') || '<p class="muted">Vazio.</p>'}</div>`;
  },

  makeOffers(n, renewOnly) {
    const w = PM.w, p = PM.p, u = PM.u;
    const cur = PM.team;
    if (renewOnly || p.contract <= 1) {
      const wage = Math.round(Math.max(u.salary * 1.15, p.wage * (0.8 + u.rel.tecnico / 250)) / 100) * 100;
      if (u.rel.tecnico > 30) u.offers.push({ teamId: cur.id, wage, years: U.ri(2, 4), renew: true });
    }
    if (renewOnly) return;
    const level = p.ovr + u.fama * 0.08 + u.rel.torcida * 0.04;
    const cands = Object.values(w.teams).filter(t => t.id !== cur.id && Math.abs((40 + t.rep * 0.42) - level) < 12);
    U.shuffle(cands).slice(0, n).forEach(t => {
      const wage = Math.round(p.wage * U.rf(0.9, 1.5) * (1 + (2 - t.tier) * 0.25) / 100) * 100;
      u.offers.push({ teamId: t.id, wage: Math.max(wage, 500), years: U.ri(1, 4) });
    });
    if (u.offers.length) PM.msg(`Você recebeu ${u.offers.length} proposta(s). Veja em Mensagens.`);
  },

  acceptOffer(i) {
    const o = PM.u.offers[i], w = PM.w, p = PM.p;
    if (!o) return;
    if (!o.renew) {
      const old = w.teams[p.teamId];
      old.players = old.players.filter(id => id !== p.id);
      w.teams[o.teamId].players.push(p.id);
      p.teamId = o.teamId;
      PM.u.rel.tecnico = 45; PM.u.rel.elenco = 45; PM.u.rel.torcida = 40;
      PM.msg(`Transferência concluída! Você agora joga pelo ${w.teams[o.teamId].name}.`);
    } else PM.msg('Contrato renovado com o ' + w.teams[o.teamId].name + '.');
    PM.u.salary = o.wage; p.contract = o.years;
    PM.u.offers = [];
    Save.save(); PM.hub('home');
  },
  rejectOffer(i) { PM.u.offers.splice(i, 1); Save.save(); PM.hub(); },

  // ---------- Partida ----------
  preMatch() {
    const w = PM.w, t = PM.team, p = PM.p, u = PM.u;
    const fx = Engine.fixtureFor(w, t.id);
    if (!fx) return;
    PM.syncPlayer();
    const lu = Engine.autoLineup(w, t);
    let starter = lu.xi.includes(p.id);
    // o treinador considera relacionamento e forma recente
    const form = u.lastRatings.length ? U.avg(u.lastRatings.slice(-3)) : 6.5;
    if (!starter && p.injury <= 0) {
      const same = lu.xi.map((id, i) => [id, i]).filter(([id, i]) => Engine.slotPos(t.formation, i) === p.pos);
      const worst = same.sort((a, b) => w.players[a[0]].ovr - w.players[b[0]].ovr)[0];
      if (worst) {
        const score = p.ovr + (u.rel.tecnico - 50) * 0.15 + (form - 6.5) * 3;
        if (score >= w.players[worst[0]].ovr - 2) { lu.xi[worst[1]] = p.id; starter = true; lu.bench = lu.bench.filter(id => id !== p.id); }
      }
    }
    if (!starter && !lu.bench.includes(p.id)) { lu.bench.pop(); lu.bench.push(p.id); }
    if (starter) lu.bench = lu.bench.filter(id => id !== p.id);
    const sideIdx = fx.h === t.id ? 0 : 1;
    const m = Engine.createMatch(w, fx.h, fx.a, { lineups: { [t.id]: lu }, exclude: p.id });
    const nMom = { ATA: U.ri(4, 6), MEI: U.ri(4, 5), DEF: U.ri(3, 4) }[p.pos];
    let enterAt = starter ? 0 : (Math.random() < 0.85 + (u.rel.tecnico - 50) / 200 ? U.ri(50, 75) : 999);
    const mins = [];
    while (mins.length < nMom) {
      const mm = U.ri(Math.max(3, enterAt + 2), 88);
      if (mm < 89 && !mins.includes(mm)) mins.push(mm);
      if (enterAt > 85) break;
    }
    if (!starter) mins.splice(Math.ceil(mins.length / 2));
    mins.sort((a, b) => a - b);
    if (!starter && enterAt < 999) m.sides[sideIdx].reserve = 1;
    if (starter) m.sides[sideIdx].suppress = PM.suppress(p.pos);
    const ctx = { m, fx, sideIdx, starter, enterAt, mins, goals: 0, assists: 0, tackles: 0, bonus: 0, entered: starter };
    PM.ctx = ctx;
    UI.modal(`<h3>${starter ? 'Você é titular!' : 'Você começa no banco'}</h3>
      <p>${starter ? 'O treinador confia em você. Faça valer!' : 'Fique atento: você pode entrar no segundo tempo.'}</p>
      <p class="muted small">Energia: ${Math.round(u.energia)} • Lances previstos: aparecem quando a bola chegar até você.</p>
      <button class="btn primary" onclick="UI.closeModal();PM.play()">Entrar em campo</button>`, { locked: true });
  },

  play() {
    const c = PM.ctx, w = PM.w, p = PM.p;
    MatchView.open(UI.app(), w, c.m, {
      userSide: c.sideIdx, highlight: p.id,
      confirmSkip: 'Simular até o fim? Seus lances serão decididos automaticamente.',
      extraPanel: () => `<div class="panel mini"><b>${U.esc(Data.short(p))}</b> — ${c.entered ? 'em campo' : 'no banco'}<br>
        <span class="muted small">Nota: ${c.entered ? (c.m.sides[c.sideIdx].ratings[p.id] || 6).toFixed(1) : '-'} • Gols ${c.goals} • Assist. ${c.assists}${p.pos !== 'ATA' ? ' • Desarmes ' + c.tackles : ''}</span></div>`,
      hook: (m, resume, host, skip) => PM.hook(m, resume, host, skip),
      onEnd: () => PM.postMatch(),
    });
  },

  hook(m, resume, host, skip) {
    const c = PM.ctx, w = PM.w, p = PM.p, side = m.sides[c.sideIdx];
    if (!c.entered && m.minute >= c.enterAt) {
      // entra no lugar do jogador mais cansado da mesma posição
      const outs = Engine.onPitch(m, side).filter(id => side.xi.indexOf(id) > 0)
        .sort((a, b) => (w.players[b].pos === p.pos) - (w.players[a].pos === p.pos) || w.players[a].fitness - w.players[b].fitness);
      if (side.subs > 0 && outs.length && Engine.substitute(w, m, c.sideIdx, outs[0], p.id)) {
        c.entered = true; side.reserve = 0;
        side.suppress = PM.suppress(p.pos);
        if (MatchView.addEvents) MatchView.addEvents(m.events.slice(-1));
      } else c.enterAt = 999;
    }
    if (c.entered && side.off.includes(p.id)) return false;
    if (!c.entered || !c.mins.length || m.minute + 1 < c.mins[0]) return false;
    c.mins.shift();
    const opp = m.sides[1 - c.sideIdx];
    const gk = w.players[opp.xi[0]];
    const defOvr = U.avg(Engine.onPitch(m, opp).map(id => w.players[id].ovr));
    const types = {
      ATA: ['chance', 'chance', 'contra', 'longe', 'falta'],
      MEI: ['passe', 'passe', 'longe', 'contra', 'falta', 'chance', 'defesa'],
      DEF: ['defesa', 'defesa', 'defesa', 'defesa', 'passe', 'longe', 'falta'],
    }[p.pos];
    let type = U.pick(types);
    if (type !== 'defesa' && Math.random() < 0.06) type = 'penalti';
    const attrs = { ...PM.u.attrs, energia: Math.max(20, PM.u.energia - m.minute * 0.15) };
    const tired = attrs.energia / 100;
    if (skip) {
      const sk = (p.ovr + attrs.energia * 0.2) / 100;
      const r = Math.random();
      let res;
      if (type === 'defesa') res = r < 0.3 + sk * 0.3 ? 'tackle' : r < 0.55 + sk * 0.2 ? 'cover' : r < 0.85 ? 'saved' : 'conceded';
      else res = r < 0.1 + sk * 0.2 ? 'goal' : r < 0.18 + sk * 0.3 ? 'assist' : 'miss';
      PM.resolveMoment(m, res, 0);
      return false;
    }
    host.classList.remove('hidden');
    host.parentElement.querySelector('#mv-pitch').classList.add('hidden');
    const done = (r) => { PM.resolveMoment(m, r.result, r.passes || 0); resume(); };
    if (type === 'defesa') {
      const myGk = w.players[side.xi[0]];
      const atkOvr = U.avg(Engine.onPitch(m, opp).filter(id => ['ATA', 'MEI'].includes(w.players[id].pos)).map(id => w.players[id].ovr)) || defOvr;
      const sc = Defend.scenario(atkOvr, myGk ? myGk.ovr : 50);
      Engine.ev(m, 'moment', c.sideIdx, 'Lance seu: o adversário ataca! Marque!');
      MatchView.addEvents(m.events.slice(-1));
      // cansaço reduz velocidade e fôlego
      Defend.start(host, sc, { ...attrs, velocidade: attrs.velocidade * (0.75 + 0.25 * tired), resistencia: attrs.resistencia * (0.6 + 0.4 * tired) }, done);
      return true;
    }
    const sc = Kick.scenario(type, gk ? gk.ovr : 50, defOvr);
    Engine.ev(m, 'moment', c.sideIdx, `Lance seu: ${sc.title}`);
    MatchView.addEvents(m.events.slice(-1));
    Kick.start(host, sc, attrs, done);
    return true;
  },

  resolveMoment(m, result, passes) {
    const c = PM.ctx, w = PM.w, p = PM.p, side = m.sides[c.sideIdx];
    const tn = w.teams[side.id].name;
    side.ratings[p.id] = (side.ratings[p.id] || 6) + passes * 0.1;
    let e;
    if (result === 'goal') {
      m.score[c.sideIdx]++; c.goals++; p.s.goals++;
      side.ratings[p.id] += 1.1;
      m.stats.shots[c.sideIdx]++; m.stats.onT[c.sideIdx]++;
      e = Engine.ev(m, 'goal', c.sideIdx, `GOOOL! ${Data.short(p)} marca para o ${tn}!`, p.id);
    } else if (result === 'assist') {
      const sc = Engine.pickPlayer(w, m, c.sideIdx, { ATA: 5, MEI: 3, DEF: 1 }) || p.id;
      m.score[c.sideIdx]++; c.assists++; p.s.assists++;
      if (sc !== p.id) { w.players[sc].s.goals++; side.ratings[sc] += 1; }
      side.ratings[p.id] += 0.8;
      m.stats.shots[c.sideIdx]++; m.stats.onT[c.sideIdx]++;
      e = Engine.ev(m, 'goal', c.sideIdx, `GOOOL! ${Data.short(w.players[sc])} marca após passe de ${Data.short(p)}!`, sc);
    } else if (Defend.RESULTS[result]) {
      return PM.resolveDefense(m, result);
    } else {
      side.ratings[p.id] -= result === 'blocked' ? 0.1 : 0.2;
      m.stats.shots[c.sideIdx]++;
      if (result === 'saved') m.stats.onT[c.sideIdx]++;
      e = Engine.ev(m, result === 'saved' ? 'save' : 'miss', c.sideIdx,
        { saved: 'O goleiro defende o seu chute.', blocked: 'Seu lance é travado pela defesa.', miss: 'Você desperdiça a jogada.' }[result] || 'Lance perdido.', p.id);
    }
    if (MatchView.addEvents) MatchView.addEvents([e]);
  },

  resolveDefense(m, result) {
    const c = PM.ctx, w = PM.w, p = PM.p, si = c.sideIdx, side = m.sides[si], opp = m.sides[1 - si];
    const delta = { tackle: 0.45, intercept: 0.45, block: 0.4, cover: 0.05, saved: -0.1, wide: 0, foul: -0.25, conceded: -0.5 }[result];
    side.ratings[p.id] = (side.ratings[p.id] || 6) + delta;
    const atk = Engine.pickPlayer(w, m, 1 - si, { ATA: 5, MEI: 2, DEF: 0.3 });
    const an = atk ? Data.short(w.players[atk]) : 'o atacante';
    let e;
    if (['tackle', 'intercept', 'block'].includes(result)) {
      c.tackles++;
      e = Engine.ev(m, 'moment', si, { tackle: `Que desarme de ${Data.short(p)} em cima de ${an}!`, intercept: `${Data.short(p)} lê a jogada e intercepta o passe.`, block: `${Data.short(p)} se joga na frente e bloqueia o chute de ${an}!` }[result], p.id);
    } else if (result === 'cover') {
      e = Engine.ev(m, 'moment', si, 'A defesa se recompõe e afasta o perigo.');
    } else if (result === 'foul') {
      side.yellow[p.id] = (side.yellow[p.id] || 0) + 1;
      if (side.yellow[p.id] >= 2) {
        side.off.push(p.id); p.suspended = 2; c.mins = [];
        e = Engine.ev(m, 'red', si, `Segundo amarelo! ${Data.short(p)} é expulso.`, p.id);
      } else e = Engine.ev(m, 'yellow', si, `Falta dura de ${Data.short(p)}. Cartão amarelo.`, p.id);
    } else if (result === 'conceded') {
      m.score[1 - si]++; m.stats.shots[1 - si]++; m.stats.onT[1 - si]++;
      if (atk) { w.players[atk].s.goals++; opp.ratings[atk] += 1; }
      e = Engine.ev(m, 'goal', 1 - si, `Gol do ${w.teams[opp.id].name}! ${an} passa pela marcação e marca.`, atk);
    } else {
      m.stats.shots[1 - si]++;
      if (result === 'saved') m.stats.onT[1 - si]++;
      e = Engine.ev(m, result === 'saved' ? 'save' : 'miss', 1 - si, result === 'saved' ? `${an} finaliza e o goleiro defende.` : `${an} finaliza para fora.`, atk);
    }
    if (MatchView.addEvents) MatchView.addEvents([e]);
  },

  suppress(pos) { return { DEF: 0.8, MEI: 0.95, ATA: 1 }[pos]; },

  postMatch() {
    const c = PM.ctx, w = PM.w, p = PM.p, u = PM.u, m = c.m;
    const myGoals = m.score[c.sideIdx], oppGoals = m.score[1 - c.sideIdx];
    Engine.finish(w, m, c.fx);
    const played = c.entered;
    const rating = played ? m.sides[c.sideIdx].ratings[p.id] : null;
    const res = myGoals > oppGoals ? 'V' : myGoals < oppGoals ? 'D' : 'E';
    let lines = [];
    if (played) {
      u.lastRatings.push(rating); u.lastRatings = u.lastRatings.slice(-5);
      const d = rating - 6.5;
      u.rel.tecnico = U.clamp(u.rel.tecnico + d * 3, 0, 100);
      u.rel.torcida = U.clamp(u.rel.torcida + d * 3 + c.goals * 2, 0, 100);
      u.rel.elenco = U.clamp(u.rel.elenco + (res === 'V' ? 2 : res === 'D' ? -1 : 0) + c.assists, 0, 100);
      u.fama += Math.max(0, d) * (3 - PM.team.tier) * 0.6 + c.goals * (3 - PM.team.tier) * 0.8;
      u.energia = Math.max(0, u.energia - (c.starter ? 30 : 15));
      lines.push(`Sua nota: <b class="${rating >= 7 ? 'o-good' : rating < 6 ? 'o-low' : ''}">${rating.toFixed(1)}</b>`);
    } else {
      u.rel.tecnico = U.clamp(u.rel.tecnico - 1, 0, 100);
      lines.push('Você não entrou em campo.');
    }
    const bonus = res === 'V' ? Math.round(u.salary * 0.5) : 0;
    u.dinheiro += u.salary + bonus + c.goals * Math.round(u.salary * 0.3);
    lines.push(`Salário recebido: ${U.money(u.salary)}${bonus ? ` + bônus de vitória ${U.money(bonus)}` : ''}${c.goals ? ` + bônus por gols ${U.money(c.goals * Math.round(u.salary * 0.3))}` : ''}`);
    // fim da rodada
    Engine.playRound(w);
    u.energia = Math.min(100, u.energia + 15 + (u.items.includes('nutri') ? 10 : 0) + (u.felicidade - 50) / 10);
    u.felicidade = U.clamp(u.felicidade - 1.5 + (res === 'V' ? 1 : 0), 0, 100);
    if (w.round === Math.floor(Engine.roundsInSeason(w) / 2)) PM.makeOffers(U.ri(0, 2));
    const H = w.teams[c.fx.h], A = w.teams[c.fx.a];
    Save.save();
    UI.modal(`<h3>Fim de jogo</h3>
      <div class="final">${UI.badge(H)} ${U.esc(H.name)} <b>${c.fx.r[0]} - ${c.fx.r[1]}</b> ${U.esc(A.name)} ${UI.badge(A)}</div>
      ${lines.map(l => `<p>${l}</p>`).join('')}
      ${played ? `<p class="muted small">Gols: ${c.goals} • Assistências: ${c.assists} • Desarmes/cortes: ${c.tackles}</p>` : ''}
      <button class="btn primary" onclick="UI.closeModal();PM.afterMatch()">Continuar</button>`, { locked: true });
  },

  afterMatch() {
    const w = PM.w;
    if (w.round >= Engine.roundsInSeason(w)) return PM.seasonEnd();
    if (Math.random() < 0.55) return PM.randomEvent();
    PM.hub('home');
  },

  randomEvent() {
    const u = PM.u;
    const evs = EVENTS.filter(e => !e.need || u.fama >= e.need);
    const e = U.pick(evs);
    PM.curEvent = e;
    UI.modal(`<h3>Acontecimento</h3><p>${e.t}</p>
      ${e.o.map((o, i) => `<button class="btn block" onclick="PM.chooseEvent(${i})">${o[0]}</button>`).join('')}`, { locked: true });
  },

  chooseEvent(i) {
    const u = PM.u, fx = PM.curEvent.o[i][1];
    if (typeof fx.dinheiro === 'number' && fx.dinheiro < 0 && u.dinheiro < -fx.dinheiro) return UI.toast('Dinheiro insuficiente.');
    const out = [];
    for (const k in fx) {
      let v = fx[k];
      if (k === 'dinheiro') {
        if (v === 'promo') v = Math.round(2000 + u.fama * 400);
        u.dinheiro += v; out.push(`${v > 0 ? '+' : ''}${U.money(v)}`);
      } else if (k === 'energia') { u.energia = U.clamp(u.energia + v, 0, 100); out.push(`Energia ${v > 0 ? '+' : ''}${v}`); }
      else if (k === 'felicidade') { u.felicidade = U.clamp(u.felicidade + v, 0, 100); out.push(`Felicidade +${v}`); }
      else if (k === 'fama') { u.fama += v; out.push(`Fama +${v}`); }
      else if (k === 'xp') { const a = U.pick(Object.keys(ATTRS)); u.attrs[a] = Math.min(99, u.attrs[a] + 1); out.push(`${ATTRS[a]} +1`); }
      else if (k === 'offer') { if (Math.random() < 0.4) { PM.makeOffers(1); out.push('Surgiu uma proposta!'); } else out.push('O empresário sumiu com o dinheiro...'); }
      else { u.rel[k] = U.clamp(u.rel[k] + v, 0, 100); out.push(`${{ tecnico: 'Treinador', torcida: 'Torcida', elenco: 'Elenco' }[k]} ${v > 0 ? '+' : ''}${v}`); }
    }
    Save.save();
    UI.modal(`<p>${out.join(' • ') || 'Nada mudou.'}</p><button class="btn primary" onclick="UI.closeModal();PM.hub('home')">OK</button>`);
  },

  seasonEnd() {
    const w = PM.w, u = PM.u, p = PM.p, t = PM.team;
    const lg = Data.leagueOf(w, t.id);
    const tb = Data.table(lg);
    const pos = tb.findIndex(r => r.id === t.id) + 1;
    u.career.push({ season: w.season, team: t.name, league: lg.name, apps: p.s.apps, goals: p.s.goals, assists: p.s.assists, avg: Engine.avgRating(p), ovr: p.ovr });
    if (pos === 1) u.trophies.push(`Campeão da ${lg.name} ${w.season} (${t.name})`);
    // artilheiro
    const scorers = lg.teams.flatMap(id => w.teams[id].players).map(id => w.players[id]).sort((a, b) => b.s.goals - a.s.goals);
    if (scorers[0] && scorers[0].id === p.id && p.s.goals > 0) u.trophies.push(`Artilheiro da ${lg.name} ${w.season} (${p.s.goals} gols)`);
    const summary = Engine.endSeason(w, [p.id]);
    p.contract--;
    // declínio com a idade
    if (p.age >= 31) Object.keys(u.attrs).forEach(k => u.attrs[k] = Math.max(20, u.attrs[k] - U.ri(0, p.age >= 34 ? 3 : 2)));
    u.energia = 100;
    u.offers = [];
    PM.makeOffers(U.ri(1, 3) + (u.fama > 50 ? 1 : 0));
    const champ = summary.leagues.map(L => `<div class="kv"><span>${L.name}</span><b>${U.esc(w.teams[L.champ].name)}</b></div>`).join('');
    let extra = '';
    if (p.contract <= 0 && !u.offers.some(o => o.renew)) {
      extra = '<p class="o-low">Seu contrato acabou. Escolha uma proposta ou você ficará sem salário.</p>';
      if (!u.offers.length) PM.makeOffers(3);
    }
    Save.save();
    UI.modal(`<h3>Fim da temporada ${summary.season}</h3>
      <p>Seu clube terminou em <b>${pos}º</b> na ${lg.name}.</p>
      <h4>Campeões</h4>${champ}
      <p>Agora você tem ${p.age} anos.</p>${extra}
      <button class="btn primary" onclick="UI.closeModal();PM.hub('msgs')">Ver propostas</button>`, { locked: true });
    if (p.age >= 38) PM.retire(true);
  },

  retire(forced) {
    const go = () => { PM.u.retired = true; Save.save(); PM.retiredScreen(); };
    if (forced) return go();
    UI.confirm('Encerrar a carreira? Isso finaliza este save.', go, 'Encerrar');
  },

  retiredScreen() {
    const u = PM.u;
    const tot = u.career.reduce((a, c) => ({ apps: a.apps + c.apps, goals: a.goals + c.goals, assists: a.assists + c.assists }), { apps: 0, goals: 0, assists: 0 });
    UI.screen(`<div class="panel narrow"><h2>Fim de carreira</h2>
      <p><b>${U.esc(Data.pname(PM.p))}</b> pendurou as chuteiras.</p>
      <div class="kv"><span>Temporadas</span><b>${u.career.length}</b></div>
      <div class="kv"><span>Jogos</span><b>${tot.apps}</b></div>
      <div class="kv"><span>Gols</span><b>${tot.goals}</b></div>
      <div class="kv"><span>Assistências</span><b>${tot.assists}</b></div>
      <div class="kv"><span>Fortuna</span><b>${U.money(u.dinheiro)}</b></div>
      <h4>Títulos</h4>${u.trophies.map(t => `<div>🏆 ${U.esc(t)}</div>`).join('') || '<p class="muted">Nenhum.</p>'}
      <div class="row"><button class="btn" onclick="Menu.show()">Menu</button><button class="btn danger" onclick="Save.del('player');Menu.show()">Apagar save</button></div></div>`);
  },
};
