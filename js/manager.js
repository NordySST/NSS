// Modo Carreira de Técnico
const TV_MONEY = [6000000, 2800000, 1800000];

const MM = {
  get w() { return G.world; },
  get g() { return G.mgr; },
  get team() { return G.world.teams[G.mgr.teamId]; },

  newGame() {
    const w = Data.createWorld();
    G = { mode: 'manager', world: w, mgr: null, tmp: w };
    const opts = (tier) => Object.values(w.teams).filter(t => t.tier === tier)
      .map(t => `<option value="${t.id}">${U.esc(t.name)} (rep. ${t.rep})</option>`).join('');
    UI.screen(`
      <div class="panel narrow">
        <h2>Novo técnico</h2>
        <label>Seu nome <input id="m-name" value="${U.pick(NAMES.first)} ${U.pick(NAMES.last)}" maxlength="30"></label>
        <label>Escolha o clube
          <select id="m-team">
            <optgroup label="Terceira Divisão (recomendado)">${opts(2)}</optgroup>
            <optgroup label="Segunda Divisão">${opts(1)}</optgroup>
            <optgroup label="Primeira Divisão">${opts(0)}</optgroup>
          </select>
        </label>
        <p class="muted small">Clubes maiores têm mais dinheiro, mas a diretoria cobra mais.</p>
        <div class="row"><button class="btn" onclick="Menu.show()">Voltar</button>
        <button class="btn primary" onclick="MM.create()">Assumir o clube</button></div>
      </div>`);
  },

  create() {
    const name = document.getElementById('m-name').value.trim() || 'Técnico';
    const teamId = +document.getElementById('m-team').value;
    const w = G.tmp;
    G = {
      mode: 'manager', world: w,
      mgr: {
        name, teamId, confidence: 60, inbox: [], history: [], tab: 'home', fired: false,
        lineup: null, offers: [], forSale: [], fin: { lastIn: 0, lastOut: 0, seasonIn: 0, seasonOut: 0, log: [] },
        trophies: [], seasons: 0,
      },
    };
    const t = w.teams[teamId];
    t.budget += TV_MONEY[t.tier];
    MM.msg(`A diretoria do ${t.name} te apresenta como novo técnico. Expectativa: ${MM.expectText()}.`);
    MM.msg(`Cota de TV da temporada recebida: ${U.money(TV_MONEY[t.tier])}.`);
    MM.resetLineup();
    Save.save(); MM.hub();
  },

  continue() { G = Save.load('manager'); if (G) MM.hub(); else Menu.show(); },

  msg(text) { MM.g.inbox.unshift({ s: MM.w.season, r: MM.w.round, text }); MM.g.inbox = MM.g.inbox.slice(0, 50); },

  expectedPos() {
    const w = MM.w, t = MM.team;
    const lg = Data.leagueOf(w, t.id);
    const byRep = lg.teams.slice().sort((a, b) => w.teams[b].rep - w.teams[a].rep);
    return byRep.indexOf(t.id) + 1;
  },
  expectText() {
    const e = MM.expectedPos(), tier = MM.team.tier;
    if (e <= 2) return tier === 0 ? 'brigar pelo título' : 'conseguir o acesso';
    if (e <= 5) return 'terminar na parte de cima da tabela';
    if (e <= 8) return 'fazer uma campanha segura no meio da tabela';
    return 'evitar o rebaixamento';
  },

  resetLineup() {
    MM.g.lineup = Engine.autoLineup(MM.w, MM.team);
  },
  validateLineup() {
    const w = MM.w, t = MM.team, L = MM.g.lineup;
    if (!L) return MM.resetLineup();
    const ok = (id) => id != null && t.players.includes(id) && Engine.available(w, id);
    const used = new Set();
    L.xi = L.xi.map(id => (ok(id) && !used.has(id) && used.add(id)) ? id : null);
    L.bench = L.bench.filter(id => ok(id) && !used.has(id) && used.add(id));
    // preenche vagas
    L.xi = L.xi.map((id, i) => {
      if (id != null) return id;
      const pos = Engine.slotPos(t.formation, i);
      const cands = t.players.filter(x => ok(x) && !used.has(x)).sort((a, b) =>
        (w.players[b].pos === pos) - (w.players[a].pos === pos) || w.players[b].ovr - w.players[a].ovr);
      if (cands[0]) { used.add(cands[0]); L.bench = L.bench.filter(b => b !== cands[0]); }
      return cands[0] ?? null;
    });
    while (L.xi.length < 11) L.xi.push(null);
    const rest = t.players.filter(x => ok(x) && !used.has(x)).sort((a, b) => w.players[b].ovr - w.players[a].ovr);
    while (L.bench.length < 7 && rest.length) L.bench.push(rest.shift());
  },

  hub(tab) {
    if (tab) MM.g.tab = tab;
    if (MM.g.fired) return MM.firedScreen();
    const w = MM.w, g = MM.g, t = MM.team;
    const tabs = { home: 'Início', elenco: 'Elenco', tatica: 'Tática', mercado: 'Transferências', financas: 'Finanças', tabela: 'Tabelas', calendario: 'Calendário', msgs: 'Mensagens' };
    UI.screen(`
      <div class="topbar">
        <div class="tb-left">${UI.badge(t)}<div><b>${U.esc(t.name)}</b><div class="muted small">Técnico ${U.esc(g.name)} • ${Data.leagueOf(w, t.id).name} • ${w.season}</div></div></div>
        <div class="tb-stats">
          <div><span class="muted small">Caixa</span><b class="${t.budget < 0 ? 'o-low' : ''}">${U.money(t.budget)}</b></div>
          <div><span class="muted small">Diretoria</span>${UI.bar(g.confidence, 100, g.confidence < 30 ? 'red' : '')}</div>
          <div><span class="muted small">Rodada</span><b>${Math.min(w.round + 1, Engine.roundsInSeason(w))}/${Engine.roundsInSeason(w)}</b></div>
        </div>
        <button class="btn sm" onclick="Save.save();Menu.show()">Menu</button>
      </div>
      <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab ${g.tab === k ? 'active' : ''}" onclick="MM.hub('${k}')">${v}${k === 'msgs' && g.offers.length ? ` <span class="pill">${g.offers.length}</span>` : ''}</button>`).join('')}</div>
      <div class="content">${MM['tab_' + g.tab]()}</div>`);
  },

  tab_home() {
    const w = MM.w, t = MM.team, g = MM.g;
    const fx = Engine.fixtureFor(w, t.id);
    const lg = Data.leagueOf(w, t.id);
    const tb = Data.table(lg);
    const pos = tb.findIndex(r => r.id === t.id) + 1;
    let next = '<p>Temporada encerrada.</p>';
    if (fx) {
      const opp = w.teams[fx.h === t.id ? fx.a : fx.h];
      const oppStr = Math.round(U.avg(Engine.autoLineup(w, opp).xi.map(id => w.players[id].ovr)));
      MM.validateLineup();
      const myStr = Math.round(U.avg(g.lineup.xi.filter(x => x != null).map(id => w.players[id].ovr)));
      next = `<div class="next-match">
        <div class="nm-teams">${UI.badge(w.teams[fx.h])} <b>${U.esc(w.teams[fx.h].name)}</b> <span class="muted">x</span> <b>${U.esc(w.teams[fx.a].name)}</b> ${UI.badge(w.teams[fx.a])}</div>
        <div class="muted small">${fx.h === t.id ? 'Em casa' : 'Fora'} • Adversário: ${tb.findIndex(r => r.id === opp.id) + 1}º, formação ${opp.formation}, força média ${oppStr} (sua: ${myStr})</div>
        <button class="btn primary big" onclick="MM.preMatch()">Jogar partida ▶</button></div>`;
    }
    const injured = t.players.map(id => w.players[id]).filter(p => p.injury > 0 || p.suspended);
    return `<div class="grid2">
      <div class="panel"><h3>Próximo jogo</h3>${next}</div>
      <div class="panel"><h3>Situação</h3>
        <div class="kv"><span>Posição</span><b>${pos}º</b></div>
        <div class="kv"><span>Expectativa da diretoria</span><b>${MM.expectText()} (${MM.expectedPos()}º)</b></div>
        <div class="kv"><span>Confiança da diretoria</span>${UI.bar(g.confidence)}</div>
        <div class="kv"><span>Formação / Mentalidade</span><b>${t.formation} • ${MENTALITIES[t.mentality]}</b></div>
        <div class="kv"><span>Elenco</span><b>${t.players.length} jogadores</b></div>
      </div>
      <div class="panel"><h3>Departamento médico</h3>${injured.length ? injured.map(p => `<div class="kv"><span>${U.esc(Data.pname(p))} (${p.pos})</span><span class="o-low">${p.injury > 0 ? 'Lesionado: ' + p.injury + ' sem.' : 'Suspenso'}</span></div>`).join('') : '<p class="muted">Todos disponíveis.</p>'}</div>
      <div class="panel"><h3>${U.esc(lg.name)}</h3>${MM.miniTable(lg)}</div>
    </div>`;
  },

  miniTable(lg) {
    const w = MM.w, tb = Data.table(lg);
    return `<table class="tbl"><tbody>${tb.map((r, i) => `<tr class="${r.id === MM.team.id ? 'me' : ''}"><td>${i + 1}</td><td class="l">${U.esc(w.teams[r.id].name)}</td><td>${r.p}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table>`;
  },

  // ---------- Elenco ----------
  sort: 'pos',
  tab_elenco() {
    const w = MM.w, t = MM.team, g = MM.g;
    const order = { GOL: 0, DEF: 1, MEI: 2, ATA: 3 };
    const ps = t.players.map(id => w.players[id]).sort((a, b) => MM.sort === 'pos' ? order[a.pos] - order[b.pos] || b.ovr - a.ovr : b[MM.sort] - a[MM.sort]);
    const wages = ps.reduce((s, p) => s + p.wage, 0);
    const th = (k, l) => `<th class="sortable" onclick="MM.sort='${k}';MM.hub()">${l}</th>`;
    return `<div class="panel"><h3>Elenco (${ps.length}) — folha ${U.money(wages)}/sem</h3>
      <div class="scroll"><table class="tbl squad"><thead><tr>${th('pos', 'Pos')}<th class="l">Nome</th>${th('age', 'Idade')}${th('ovr', 'Geral')}<th>Pot.</th><th>Cond.</th><th>Moral</th><th>J</th><th>G</th><th>Nota</th>${th('value', 'Valor')}<th>Salário</th><th>Contr.</th><th></th></tr></thead><tbody>
      ${ps.map(p => `<tr class="${p.injury > 0 ? 'inj' : ''}">
        <td><span class="pos pos-${p.pos}">${p.pos}</span></td>
        <td class="l">${U.esc(Data.pname(p))}${p.injury > 0 ? ' ✚' : ''}${p.suspended ? ' 🟥' : ''}${g.forSale.includes(p.id) ? ' <span class="pill">à venda</span>' : ''}</td>
        <td>${p.age}</td><td><b class="${UI.ovrCls(p.ovr)}">${p.ovr}</b></td><td class="muted">${MM.potText(p)}</td>
        <td>${Math.round(p.fitness)}%</td><td>${Math.round(p.morale)}</td><td>${p.s.apps}</td><td>${p.s.goals}</td><td>${Engine.avgRating(p)}</td>
        <td>${U.money(p.value)}</td><td>${U.money(p.wage)}</td><td class="${p.contract <= 0 ? 'o-low' : ''}">${p.contract}</td>
        <td class="nowrap"><button class="btn xs" onclick="MM.playerMenu(${p.id})">⋯</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  },
  potText(p) {
    const d = p.pot - p.ovr;
    return d >= 12 ? '★★★' : d >= 6 ? '★★' : d >= 2 ? '★' : '-';
  },

  playerMenu(id) {
    const p = MM.w.players[id], g = MM.g;
    const sale = g.forSale.includes(id);
    UI.modal(`<h3>${U.esc(Data.pname(p))}</h3>
      <p class="muted">${POS_NAMES[p.pos]} • ${p.age} anos • Geral ${p.ovr} • Valor ${U.money(p.value)} • Salário ${U.money(p.wage)}/sem • Contrato ${p.contract}</p>
      <button class="btn block" onclick="MM.toggleSale(${id})">${sale ? 'Retirar da lista de venda' : 'Colocar à venda'}</button>
      <button class="btn block" onclick="MM.renew(${id})">Renovar contrato (+3 temporadas)</button>
      <button class="btn block danger" onclick="MM.release(${id})">Dispensar (multa ${U.money(p.wage * 8 * Math.max(1, p.contract))})</button>`);
  },
  toggleSale(id) {
    const g = MM.g;
    g.forSale = g.forSale.includes(id) ? g.forSale.filter(x => x !== id) : g.forSale.concat(id);
    UI.closeModal(); Save.save(); MM.hub();
  },
  renew(id) {
    const p = MM.w.players[id];
    const newWage = Math.round(p.wage * (p.morale > 60 ? 1.1 : 1.3) / 100) * 100;
    if (p.age >= 34 && Math.random() < 0.3) { UI.closeModal(); return UI.toast(`${Data.short(p)} prefere não renovar.`); }
    if (!confirm(`${Data.short(p)} pede ${U.money(newWage)}/semana por 3 temporadas. Aceitar?`)) return;
    p.wage = newWage; p.contract = 3; p.morale = Math.min(100, p.morale + 10);
    UI.closeModal(); UI.toast('Contrato renovado.'); Save.save(); MM.hub();
  },
  release(id) {
    const w = MM.w, t = MM.team, p = w.players[id];
    if (t.players.length <= 16) return UI.toast('Elenco mínimo de 16 jogadores.');
    const fee = p.wage * 8 * Math.max(1, p.contract);
    if (!confirm(`Dispensar ${Data.short(p)} pagando ${U.money(fee)}?`)) return;
    t.budget -= fee; MM.removeFromTeam(p);
    p.teamId = null; w.freeAgents.push(p.id);
    UI.closeModal(); Save.save(); MM.hub();
  },
  removeFromTeam(p) {
    const t = MM.w.teams[p.teamId], g = MM.g;
    t.players = t.players.filter(x => x !== p.id);
    g.forSale = g.forSale.filter(x => x !== p.id);
    if (g.lineup) { g.lineup.xi = g.lineup.xi.map(x => x === p.id ? null : x); g.lineup.bench = g.lineup.bench.filter(x => x !== p.id); }
  },

  // ---------- Tática ----------
  sel: null,
  tab_tatica() {
    const w = MM.w, t = MM.team, L = (MM.validateLineup(), MM.g.lineup);
    const inLU = new Set([...L.xi, ...L.bench]);
    const reserves = t.players.filter(id => !inLU.has(id));
    const row = (id, label, kind, idx) => {
      const p = id != null ? w.players[id] : null;
      const sel = MM.sel && MM.sel.kind === kind && MM.sel.idx === idx;
      const wrong = p && kind === 'xi' && p.pos !== label;
      return `<div class="lu-row ${sel ? 'sel' : ''} ${p && !Engine.available(w, id) ? 'inj' : ''}" onclick="MM.pick('${kind}',${idx})">
        <span class="pos pos-${label}">${label}</span><span class="lu-name">${p ? U.esc(Data.pname(p)) : '<i class="muted">vazio</i>'}${wrong ? ' <span class="o-low small">(' + p.pos + ')</span>' : ''}</span>
        ${p ? `<span class="muted small">${Math.round(p.fitness)}%</span><b class="${UI.ovrCls(p.ovr)}">${p.ovr}</b>` : ''}</div>`;
    };
    return `<div class="grid3">
      <div class="panel"><h3>Estratégia</h3>
        <label>Formação <select onchange="MM.setFormation(this.value)">${Object.keys(FORMATIONS).map(f => `<option ${f === t.formation ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
        <label>Mentalidade <select onchange="MM.team.mentality=this.value;Save.save();MM.hub()">${Object.entries(MENTALITIES).map(([k, v]) => `<option value="${k}" ${k === t.mentality ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <button class="btn block" onclick="MM.resetLineup();MM.sel=null;Save.save();MM.hub()">Escalação automática</button>
        <p class="muted small">Clique em um jogador e depois em outro para trocá-los de lugar. Jogadores fora de posição rendem menos.</p>
        <canvas id="lu-pitch" width="300" height="400"></canvas>
      </div>
      <div class="panel"><h3>Titulares</h3>${L.xi.map((id, i) => row(id, Engine.slotPos(t.formation, i), 'xi', i)).join('')}</div>
      <div class="panel"><h3>Reservas (banco)</h3>${L.bench.map((id, i) => row(id, w.players[id].pos, 'bench', i)).join('')}
        <h3>Não relacionados</h3>${reserves.map((id, i) => row(id, w.players[id].pos, 'res', i)).join('') || '<p class="muted">-</p>'}</div>
    </div>`;
  },
  afterTatica() {
    const cv = document.getElementById('lu-pitch');
    if (!cv) return;
    const ctx = cv.getContext('2d'), t = MM.team, L = MM.g.lineup, w = MM.w;
    ctx.fillStyle = '#2a7f36'; ctx.fillRect(0, 0, 300, 400);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.strokeRect(6, 6, 288, 388);
    ctx.beginPath(); ctx.moveTo(6, 200); ctx.lineTo(294, 200); ctx.stroke();
    ctx.strokeRect(80, 330, 140, 64); ctx.strokeRect(80, 6, 140, 64);
    const f = FORMATIONS[t.formation];
    const rows = [['GOL', 1, 370], ['DEF', f.DEF, 300], ['MEI', f.MEI, 200], ['ATA', f.ATA, 95]];
    let i = 0;
    rows.forEach(([pos, n, y]) => {
      for (let k = 0; k < n; k++, i++) {
        const x = 300 * (k + 1) / (n + 1);
        const p = w.players[L.xi[i]];
        ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fillStyle = t.c1; ctx.fill(); ctx.strokeStyle = t.c2; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(p ? p.last.slice(0, 10) : '?', x, y + 27);
        ctx.fillStyle = t.c2; ctx.fillText(p ? p.ovr : '', x, y + 4);
      }
    });
  },
  setFormation(f) { MM.team.formation = f; MM.resetLineup(); MM.sel = null; Save.save(); MM.hub(); },
  pick(kind, idx) {
    const L = MM.g.lineup, t = MM.team;
    const inLU = new Set([...L.xi, ...L.bench]);
    const reserves = t.players.filter(id => !inLU.has(id));
    const get = (k, i) => k === 'xi' ? L.xi[i] : k === 'bench' ? L.bench[i] : reserves[i];
    if (!MM.sel) { MM.sel = { kind, idx }; return MM.hub(); }
    const a = MM.sel, b = { kind, idx };
    MM.sel = null;
    if (a.kind === b.kind && a.idx === b.idx) return MM.hub();
    const ida = get(a.kind, a.idx), idb = get(b.kind, b.idx);
    const set = (s, v) => {
      if (s.kind === 'xi') L.xi[s.idx] = v;
      else if (s.kind === 'bench') { if (v == null) L.bench.splice(s.idx, 1); else L.bench[s.idx] = v; }
    };
    if (a.kind === 'res' && b.kind === 'res') return MM.hub();
    set(a, idb); set(b, ida);
    L.bench = L.bench.filter(x => x != null);
    Save.save(); MM.hub();
  },

  // ---------- Mercado ----------
  mkt: { pos: 'ALL', max: 0, free: false },
  tab_mercado() {
    const w = MM.w, t = MM.team, f = MM.mkt;
    let list;
    if (f.free) list = w.freeAgents.map(id => w.players[id]).filter(Boolean);
    else list = Object.values(w.players).filter(p => p.teamId && p.teamId !== t.id && !p.isUser);
    list = list.filter(p => (f.pos === 'ALL' || p.pos === f.pos) && (!f.max || p.value <= f.max));
    list.sort((a, b) => b.ovr - a.ovr);
    list = list.slice(0, 60);
    return `<div class="panel"><h3>Mercado de transferências</h3>
      <div class="row wrap">
        <select onchange="MM.mkt.pos=this.value;MM.hub()">${['ALL', ...POSITIONS].map(p => `<option value="${p}" ${f.pos === p ? 'selected' : ''}>${p === 'ALL' ? 'Todas as posições' : POS_NAMES[p]}</option>`).join('')}</select>
        <select onchange="MM.mkt.max=+this.value;MM.hub()">${[0, 200000, 500000, 1000000, 2000000, 5000000].map(v => `<option value="${v}" ${f.max === v ? 'selected' : ''}>${v ? 'Até ' + U.money(v) : 'Qualquer valor'}</option>`).join('')}</select>
        <label class="inline"><input type="checkbox" ${f.free ? 'checked' : ''} onchange="MM.mkt.free=this.checked;MM.hub()"> Apenas sem clube</label>
        <span class="muted small">Caixa: <b>${U.money(t.budget)}</b></span>
      </div>
      <div class="scroll"><table class="tbl"><thead><tr><th>Pos</th><th class="l">Nome</th><th>Idade</th><th>Geral</th><th>Pot.</th><th class="l">Clube</th><th>Valor</th><th>Salário</th><th></th></tr></thead><tbody>
      ${list.map(p => `<tr><td><span class="pos pos-${p.pos}">${p.pos}</span></td><td class="l">${U.esc(Data.pname(p))}</td><td>${p.age}</td><td><b class="${UI.ovrCls(p.ovr)}">${p.ovr}</b></td><td class="muted">${MM.potText(p)}</td>
        <td class="l">${p.teamId ? U.esc(w.teams[p.teamId].short) : '<i class="muted">livre</i>'}</td><td>${p.teamId ? U.money(p.value) : '-'}</td><td>${U.money(p.wage)}</td>
        <td><button class="btn xs" onclick="MM.bid(${p.id})">${p.teamId ? 'Proposta' : 'Contratar'}</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  },

  bid(id) {
    const w = MM.w, p = w.players[id], t = MM.team;
    if (t.players.length >= 30) return UI.toast('Elenco cheio (30).');
    const seller = p.teamId ? w.teams[p.teamId] : null;
    const def = seller ? Math.round(p.value * 1.1 / 1000) * 1000 : 0;
    const wage = Math.round(p.wage * (seller ? 1.1 : 1) / 100) * 100;
    UI.modal(`<h3>${seller ? 'Proposta por' : 'Contratar'} ${U.esc(Data.pname(p))}</h3>
      <p class="muted">${POS_NAMES[p.pos]} • ${p.age} anos • Geral ${p.ovr} • ${seller ? U.esc(seller.name) : 'Sem clube'}</p>
      ${seller ? `<label>Valor oferecido (R$) <input id="bid-v" type="number" step="10000" value="${def}"></label>` : ''}
      <label>Salário semanal oferecido (R$) <input id="bid-w" type="number" step="100" value="${wage}"></label>
      <p class="muted small">Caixa disponível: ${U.money(t.budget)}</p>
      <button class="btn primary" onclick="MM.sendBid(${id})">Enviar</button>`);
  },

  sendBid(id) {
    const w = MM.w, p = w.players[id], t = MM.team;
    const v = p.teamId ? +document.getElementById('bid-v').value : 0;
    const wage = +document.getElementById('bid-w').value;
    if (v > t.budget) return UI.toast('Dinheiro insuficiente.');
    // o jogador aceita ir?
    const fromRep = p.teamId ? w.teams[p.teamId].rep : 30;
    const wantsWage = p.wage * (1 + Math.max(0, fromRep - t.rep) / 40);
    if (wage < wantsWage * 0.95 || (fromRep - t.rep > 25)) {
      UI.closeModal();
      return MM.result(`${Data.short(p)} não aceitou seus termos${fromRep - t.rep > 25 ? ' — não quer jogar em um clube menor' : ` (quer cerca de ${U.money(Math.round(wantsWage / 100) * 100)}/sem)`}.`);
    }
    if (p.teamId) {
      const seller = w.teams[p.teamId];
      const need = p.value * U.rf(1.0, 1.35);
      const squadOk = seller.players.filter(x => w.players[x].pos === p.pos).length > (p.pos === 'GOL' ? 2 : 3);
      if (v < need || !squadOk) {
        UI.closeModal();
        return MM.result(`${seller.name} recusou a proposta${squadOk ? `. Eles querem algo perto de ${U.money(Math.round(need / 10000) * 10000)}` : ': o jogador é peça importante'}.`);
      }
      seller.players = seller.players.filter(x => x !== p.id);
      seller.budget += v;
      Engine.fillSquad(w, seller);
    } else w.freeAgents = w.freeAgents.filter(x => x !== p.id);
    t.budget -= v;
    MM.g.fin.seasonOut += v;
    p.teamId = t.id; p.wage = wage; p.contract = U.ri(2, 4); p.morale = 80;
    t.players.push(p.id);
    MM.msg(`Contratação: ${Data.pname(p)} (${p.pos}, ${p.ovr}) por ${U.money(v)}.`);
    Save.save(); UI.closeModal();
    MM.result(`Negócio fechado! ${Data.pname(p)} é o novo reforço.`);
  },
  result(text) { UI.modal(`<p>${U.esc(text)}</p><button class="btn primary" onclick="UI.closeModal();MM.hub()">OK</button>`); },

  // ---------- Finanças ----------
  tab_financas() {
    const t = MM.team, f = MM.g.fin, w = MM.w;
    const wages = t.players.reduce((s, id) => s + w.players[id].wage, 0);
    return `<div class="grid2"><div class="panel"><h3>Resumo</h3>
      <div class="kv"><span>Caixa</span><b>${U.money(t.budget)}</b></div>
      <div class="kv"><span>Folha salarial semanal</span><b>${U.money(wages)}</b></div>
      <div class="kv"><span>Capacidade do estádio</span><b>${t.stadium.toLocaleString('pt-BR')}</b></div>
      <div class="kv"><span>Preço médio do ingresso</span><b>${U.money(MM.ticket(t))}</b></div>
      <div class="kv"><span>Cota de TV por temporada</span><b>${U.money(TV_MONEY[t.tier])}</b></div>
      <div class="kv"><span>Receitas na temporada</span><b class="o-good">${U.money(f.seasonIn)}</b></div>
      <div class="kv"><span>Despesas na temporada</span><b class="o-low">${U.money(f.seasonOut)}</b></div>
      <button class="btn" onclick="MM.expandStadium()">Ampliar estádio (+5.000 lugares por ${U.money(MM.expandCost())})</button>
      </div>
      <div class="panel"><h3>Movimentações</h3>${f.log.slice(0, 20).map(l => `<div class="kv"><span>${U.esc(l.t)}</span><b class="${l.v >= 0 ? 'o-good' : 'o-low'}">${U.money(l.v)}</b></div>`).join('') || '<p class="muted">Nada ainda.</p>'}</div></div>`;
  },
  ticket(t) { return 8 + t.rep * 0.12; },
  expandCost() { return Math.round(MM.team.stadium * 120 / 100000) * 100000 + 1000000; },
  expandStadium() {
    const t = MM.team, c = MM.expandCost();
    if (t.budget < c) return UI.toast('Dinheiro insuficiente.');
    if (!confirm(`Ampliar o estádio por ${U.money(c)}?`)) return;
    t.budget -= c; t.stadium += 5000; MM.g.fin.seasonOut += c;
    MM.g.fin.log.unshift({ t: 'Ampliação do estádio', v: -c });
    Save.save(); MM.hub();
  },

  tab_tabela() {
    const w = MM.w;
    return w.leagues.map(lg => `<div class="panel"><h3>${lg.name}</h3>${UI.tableHTML(w, lg, MM.team.id)}
      ${MM.topScorers(lg)}</div>`).join('');
  },
  topScorers(lg) {
    const w = MM.w;
    const top = lg.teams.flatMap(id => w.teams[id].players).map(id => w.players[id]).filter(p => p.s.goals > 0)
      .sort((a, b) => b.s.goals - a.s.goals).slice(0, 5);
    return top.length ? `<p class="muted small">Artilheiros: ${top.map(p => `${U.esc(Data.short(p))} (${w.teams[p.teamId].short}) ${p.s.goals}`).join(' • ')}</p>` : '';
  },

  tab_calendario() {
    const w = MM.w, t = MM.team, lg = Data.leagueOf(w, t.id);
    return `<div class="panel"><h3>Calendário ${w.season}</h3><table class="tbl"><tbody>${lg.fixtures.map((rd, i) => {
      const f = rd.find(x => x.h === t.id || x.a === t.id);
      const home = f.h === t.id, opp = w.teams[home ? f.a : f.h];
      let res = '', cls = '';
      if (f.r) {
        const my = home ? f.r[0] : f.r[1], ot = home ? f.r[1] : f.r[0];
        res = `${f.r[0]} - ${f.r[1]}`; cls = my > ot ? 'f-V' : my < ot ? 'f-D' : 'f-E';
      }
      return `<tr class="${i === w.round ? 'me' : ''}"><td>R${i + 1}</td><td>${home ? 'Casa' : 'Fora'}</td><td class="l">${UI.badge(opp)} ${U.esc(opp.name)}</td><td><span class="${cls}">${res}</span></td></tr>`;
    }).join('')}</tbody></table></div>`;
  },

  tab_msgs() {
    const g = MM.g, w = MM.w;
    const offers = g.offers.map((o, i) => {
      const p = w.players[o.pid], buyer = w.teams[o.from];
      if (!p || !buyer) return '';
      return `<div class="offer">${UI.badge(buyer)}<div><b>${U.esc(buyer.name)}</b> oferece <b>${U.money(o.value)}</b> por ${U.esc(Data.pname(p))} (${p.pos}, ${p.ovr})<div class="muted small">Valor de mercado: ${U.money(p.value)}</div></div>
        <button class="btn sm primary" onclick="MM.acceptSale(${i})">Aceitar</button><button class="btn sm" onclick="MM.g.offers.splice(${i},1);Save.save();MM.hub()">Recusar</button></div>`;
    }).join('');
    return `<div class="panel"><h3>Propostas por seus jogadores</h3>${offers || '<p class="muted">Nenhuma.</p>'}</div>
      <div class="panel"><h3>Mensagens</h3>${g.inbox.map(m => `<div class="msg"><span class="muted small">T${m.s} R${m.r}</span> ${U.esc(m.text)}</div>`).join('')}</div>`;
  },

  acceptSale(i) {
    const g = MM.g, w = MM.w, o = g.offers[i], p = w.players[o.pid], t = MM.team;
    if (!p || p.teamId !== t.id) { g.offers.splice(i, 1); return MM.hub(); }
    if (t.players.length <= 16) return UI.toast('Elenco mínimo de 16 jogadores.');
    MM.removeFromTeam(p);
    const buyer = w.teams[o.from];
    buyer.players.push(p.id); buyer.budget -= o.value; p.teamId = buyer.id;
    t.budget += o.value; g.fin.seasonIn += o.value;
    g.fin.log.unshift({ t: 'Venda: ' + Data.short(p), v: o.value });
    g.offers = g.offers.filter(x => x.pid !== o.pid);
    MM.msg(`${Data.pname(p)} foi vendido ao ${buyer.name} por ${U.money(o.value)}.`);
    Save.save(); MM.hub();
  },

  // ---------- Partida ----------
  preMatch() {
    MM.validateLineup();
    const L = MM.g.lineup;
    if (L.xi.some(x => x == null)) return UI.toast('Escalação incompleta.');
    const w = MM.w, t = MM.team, fx = Engine.fixtureFor(w, t.id);
    const sideIdx = fx.h === t.id ? 0 : 1;
    const m = Engine.createMatch(w, fx.h, fx.a, { lineups: { [t.id]: L }, userTeam: t.id });
    MM.ctx = { m, fx, sideIdx, subOut: null };
    MatchView.open(UI.app(), w, m, {
      userSide: sideIdx,
      extraPanel: (mm) => MM.matchPanel(mm),
      onEnd: () => MM.postMatch(),
    });
  },

  matchPanel(m) {
    const w = MM.w, c = MM.ctx, side = m.sides[c.sideIdx];
    const on = Engine.onPitch(m, side);
    return `<div class="panel mini"><b>Comando técnico</b>
      <label>Mentalidade <select onchange="MM.ctx.m.sides[${c.sideIdx}].mentality=this.value">${Object.entries(MENTALITIES).map(([k, v]) => `<option value="${k}" ${k === side.mentality ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Formação <select onchange="MM.ctx.m.sides[${c.sideIdx}].formation=this.value;MatchView.refresh()">${Object.keys(FORMATIONS).map(f => `<option ${f === side.formation ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
      <div class="muted small">Substituições restantes: ${side.subs}</div>
      ${side.subs > 0 ? `
      <label>Sai <select id="sub-out">${on.map(id => `<option value="${id}">${Engine.slotPos(side.formation, side.xi.indexOf(id))} ${U.esc(Data.short(w.players[id]))} (${Math.round(w.players[id].fitness)}%) ${(side.ratings[id] || 6).toFixed(1)}</option>`).join('')}</select></label>
      <label>Entra <select id="sub-in">${side.bench.filter(id => Engine.available(w, id)).map(id => `<option value="${id}">${w.players[id].pos} ${U.esc(Data.short(w.players[id]))} (${w.players[id].ovr})</option>`).join('')}</select></label>
      <button class="btn sm" onclick="MM.doSub()">Fazer substituição</button>` : ''}
      </div>`;
  },
  doSub() {
    const c = MM.ctx, out = +document.getElementById('sub-out').value, inn = +document.getElementById('sub-in')?.value;
    if (!inn) return;
    if (Engine.substitute(MM.w, c.m, c.sideIdx, out, inn)) MatchView.addEvents(c.m.events.slice(-1));
    MatchView.refresh();
  },

  postMatch() {
    const c = MM.ctx, w = MM.w, t = MM.team, g = MM.g, m = c.m;
    Engine.finish(w, m, c.fx);
    const my = m.score[c.sideIdx], ot = m.score[1 - c.sideIdx];
    const res = my > ot ? 'V' : my < ot ? 'D' : 'E';
    // diretoria
    const exp = MM.expectedPos();
    const oppRep = w.teams[m.sides[1 - c.sideIdx].id].rep;
    let dc = res === 'V' ? 3 : res === 'D' ? -3 : 0;
    if (res === 'D' && oppRep > t.rep + 10) dc += 2;
    if (res === 'V' && oppRep > t.rep + 10) dc += 2;
    g.confidence = U.clamp(g.confidence + dc, 0, 100);
    // finanças da rodada
    let inc = 0, out = 0;
    if (c.sideIdx === 0) {
      const lg = Data.leagueOf(w, t.id);
      const pos = Data.table(lg).findIndex(r => r.id === t.id);
      const fill = U.clamp(0.55 + t.rep / 300 + (5 - pos) * 0.02 + U.rf(-0.05, 0.05), 0.3, 1);
      inc = Math.round(t.stadium * fill * MM.ticket(t));
      g.fin.log.unshift({ t: `Bilheteria (${Math.round(t.stadium * fill).toLocaleString('pt-BR')} torcedores)`, v: inc });
    }
    out = t.players.reduce((s, id) => s + w.players[id].wage, 0);
    g.fin.log.unshift({ t: 'Salários da semana', v: -out });
    g.fin.log = g.fin.log.slice(0, 40);
    t.budget += inc - out; g.fin.seasonIn += inc; g.fin.seasonOut += out;
    const ratings = m.sides[c.sideIdx].used.map(id => [w.players[id], m.sides[c.sideIdx].ratings[id]]).sort((a, b) => b[1] - a[1]);
    Engine.playRound(w);
    MM.genOffers();
    const H = w.teams[c.fx.h], A = w.teams[c.fx.a];
    Save.save();
    void exp;
    UI.modal(`<h3>Fim de jogo</h3>
      <div class="final">${UI.badge(H)} ${U.esc(H.name)} <b>${c.fx.r[0]} - ${c.fx.r[1]}</b> ${U.esc(A.name)} ${UI.badge(A)}</div>
      <p>Confiança da diretoria: ${dc >= 0 ? '+' : ''}${dc}</p>
      <h4>Notas</h4><div class="ratings">${ratings.map(([p, r]) => `<div class="kv"><span>${p.pos} ${U.esc(Data.short(p))}</span><b class="${r >= 7 ? 'o-good' : r < 6 ? 'o-low' : ''}">${r.toFixed(1)}</b></div>`).join('')}</div>
      <p class="muted small">Receita: ${U.money(inc)} • Salários: ${U.money(out)}</p>
      <button class="btn primary" onclick="UI.closeModal();MM.afterMatch()">Continuar</button>`, { locked: true, wide: true });
  },

  genOffers() {
    const w = MM.w, t = MM.team, g = MM.g;
    t.players.forEach(id => {
      const p = w.players[id];
      const listed = g.forSale.includes(id);
      if (Math.random() < (listed ? 0.35 : 0.025 * (p.ovr > t.rep * 0.42 + 45 ? 2 : 1))) {
        const buyers = Object.values(w.teams).filter(b => b.id !== t.id && b.budget > p.value * 0.8 && Math.abs((40 + b.rep * 0.42) - p.ovr) < 12);
        if (!buyers.length) return;
        const b = U.pick(buyers);
        g.offers.push({ pid: id, from: b.id, value: Math.round(p.value * U.rf(listed ? 0.7 : 0.9, listed ? 1.15 : 1.4) / 10000) * 10000 });
        MM.msg(`${b.name} fez uma proposta por ${Data.pname(p)}.`);
      }
    });
    g.offers = g.offers.slice(-8);
  },

  afterMatch() {
    const w = MM.w, g = MM.g;
    if (g.confidence <= 0) return MM.fire('A diretoria perdeu a confiança no seu trabalho.');
    if (MM.team.budget < -2000000) return MM.fire('As dívidas do clube ficaram insustentáveis.');
    if (w.round >= Engine.roundsInSeason(w)) return MM.seasonEnd();
    MM.hub('home');
  },

  seasonEnd() {
    const w = MM.w, g = MM.g, t = MM.team;
    const lg = Data.leagueOf(w, t.id);
    const tb = Data.table(lg);
    const pos = tb.findIndex(r => r.id === t.id) + 1;
    const exp = MM.expectedPos();
    const diff = exp - pos;
    g.confidence = U.clamp(g.confidence + diff * 6 + (pos === 1 ? 15 : 0), 0, 100);
    g.history.push({ season: w.season, team: t.name, league: lg.name, pos });
    if (pos === 1) g.trophies.push(`${lg.name} ${w.season} — ${t.name}`);
    // contratos vencidos do seu time
    const leaving = t.players.map(id => w.players[id]).filter(p => p.contract <= 1);
    const summary = Engine.endSeason(w, [t.id]);
    leaving.forEach(p => {
      if (p.contract <= 0 && w.players[p.id]) {
        MM.removeFromTeam(p); p.teamId = null; w.freeAgents.push(p.id);
        MM.msg(`${Data.pname(p)} saiu de graça ao fim do contrato.`);
      }
    });
    Engine.fillSquad(w, t);
    t.budget += TV_MONEY[t.tier];
    g.fin.seasonIn = TV_MONEY[t.tier]; g.fin.seasonOut = 0;
    g.fin.log.unshift({ t: 'Cota de TV', v: TV_MONEY[t.tier] });
    g.offers = []; g.forSale = g.forSale.filter(id => t.players.includes(id));
    MM.resetLineup();
    const myL = summary.leagues.find(L => L.up.includes(t.id) || L.down.includes(t.id));
    let fate = '';
    if (myL && myL.up.includes(t.id)) fate = '<p class="o-good"><b>ACESSO!</b> Seu time subiu de divisão!</p>';
    if (myL && myL.down.includes(t.id)) fate = '<p class="o-low"><b>Rebaixado.</b> Seu time caiu de divisão.</p>';
    Save.save();
    const champ = summary.leagues.map(L => `<div class="kv"><span>${L.name}</span><b>${U.esc(w.teams[L.champ].name)}</b></div>`).join('');
    UI.modal(`<h3>Fim da temporada ${summary.season}</h3>
      <p>Você terminou em <b>${pos}º</b> (expectativa: ${exp}º).</p>${fate}
      <h4>Campeões</h4>${champ}
      <p>Confiança da diretoria: ${Math.round(g.confidence)}</p>
      <p class="muted small">Jogadores envelheceram, jovens evoluíram e alguns veteranos se aposentaram. Contratos vencidos foram encerrados.</p>
      <button class="btn primary" onclick="UI.closeModal();MM.afterSeason()">Nova temporada</button>`, { locked: true });
  },
  afterSeason() {
    if (MM.g.confidence <= 5) return MM.fire('A diretoria decidiu não renovar com você após a temporada.');
    MM.msg(`Nova temporada! Expectativa da diretoria: ${MM.expectText()}.`);
    Save.save(); MM.hub('home');
  },

  fire(reason) {
    const g = MM.g, w = MM.w;
    g.fired = true; g.firedReason = reason;
    const cur = MM.team;
    g.jobOffers = U.shuffle(Object.values(w.teams).filter(t => t.id !== cur.id && t.rep <= cur.rep + 3)).slice(0, 3).map(t => t.id);
    Save.save(); MM.firedScreen();
  },
  firedScreen() {
    const g = MM.g, w = MM.w;
    UI.screen(`<div class="panel narrow"><h2>Você foi demitido</h2><p>${U.esc(g.firedReason || '')}</p>
      <h4>Clubes interessados</h4>
      ${(g.jobOffers || []).map(id => `<button class="btn block" onclick="MM.takeJob(${id})">${UI.badge(w.teams[id])} ${U.esc(w.teams[id].name)} — ${LEAGUE_NAMES[w.teams[id].tier]}</button>`).join('') || '<p class="muted">Nenhum.</p>'}
      <h4>Histórico</h4>${g.history.map(h => `<div class="kv"><span>${h.season} ${U.esc(h.team)}</span><b>${h.pos}º ${h.league}</b></div>`).join('') || '<p class="muted">-</p>'}
      <div class="row"><button class="btn" onclick="Menu.show()">Menu</button><button class="btn danger" onclick="Save.del('manager');Menu.show()">Apagar save</button></div></div>`);
  },
  takeJob(id) {
    const g = MM.g;
    g.fired = false; g.teamId = id; g.confidence = 55; g.offers = []; g.forSale = [];
    MM.resetLineup();
    MM.msg(`Você assumiu o ${MM.team.name}. Expectativa: ${MM.expectText()}.`);
    Save.save(); MM.hub('home');
  },
};

// desenha o campinho da tática após renderizar
const _mmHub = MM.hub;
MM.hub = function (tab) { _mmHub.call(MM, tab); if (MM.g && MM.g.tab === 'tatica' && !MM.g.fired) MM.afterTatica(); };
