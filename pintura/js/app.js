import { ETAPAS, PRIORIDADES, etapaIndex, etapaLabel } from './constants.js';
import { criarLote, avancarLote, progresso, tempoNaEtapa } from './model.js';
import { LocalPinturaStore } from './storage-service.js';
import { createMockData } from './mock-data.js';

const store = new LocalPinturaStore(createMockData);
let db = store.load();
let ui = { view: 'painel', selected: null, modal: null, error: '', toast: '', filters: { busca:'', etapa:'todas', prioridade:'todas', situacao:'ativos' } };
const ACTORS = {
  pcp: { uid:'demo-pcp', nome:'Edvaldo · PCP', perfil:'pcp' },
  operador: { uid:'demo-op', nome:'Carlos · Pintura', perfil:'pintura' },
  recebimento: { uid:'demo-rec', nome:'Solimar · Recebimento', perfil:'pintura' },
  embalagem: { uid:'demo-emb', nome:'Jéssica · Embalagem', perfil:'pintura' }
};
const app = document.querySelector('#app');

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtKg = value => Number(value || 0).toLocaleString('pt-BR',{maximumFractionDigits:3});
const fmtDate = iso => new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso));
const getLote = id => db.lotes.find(l => l.id === id);
const eventsOf = id => db.eventos.filter(e => e.loteId === id).sort((a,b) => new Date(b.criadoEm)-new Date(a.criadoEm));

function filteredLotes(forceFinished = false) {
  const f = ui.filters;
  const term = f.busca.trim().toLocaleLowerCase('pt-BR');
  return db.lotes.filter(l => {
    if (forceFinished && l.status !== 'finalizado') return false;
    if (!forceFinished && f.situacao === 'ativos' && l.status === 'finalizado') return false;
    if (!forceFinished && f.situacao === 'finalizados' && l.status !== 'finalizado') return false;
    if (f.etapa !== 'todas' && l.etapaAtual !== f.etapa) return false;
    if (f.prioridade !== 'todas' && l.prioridade !== f.prioridade) return false;
    if (term && ![l.numero,l.cliente,l.pedido,l.perfil,l.cor].join(' ').toLocaleLowerCase('pt-BR').includes(term)) return false;
    return true;
  }).sort((a,b) => (a.prioridade==='Urgente'?-2:a.prioridade==='Alta'?-1:0) - (b.prioridade==='Urgente'?-2:b.prioridade==='Alta'?-1:0) || new Date(a.atualizadoEm)-new Date(b.atualizadoEm));
}

function render() {
  const active = db.lotes.filter(l=>l.status==='ativo');
  app.innerHTML = `${topbar()}<div class="layout">${sidebar(active)}<main class="main">${page()}</main></div>${modal()}${ui.toast?`<div class="toast">${esc(ui.toast)}</div>`:''}`;
  bind();
}

function topbar(){return `<header class="topbar"><div class="brand"><div class="brand-mark">P</div><div><strong>Extrutech · Pintura</strong><small>Protótipo operacional isolado</small></div></div><div class="actor"><span class="actor-dot"></span><span>${esc(db.actor.nome)} · dados locais</span></div></header>`;}
function sidebar(active){
  const issues=active.filter(l=>l.perdasAcumuladas||l.retrabalhoAberto).length;
  return `<aside class="sidebar"><div><div class="nav-title">Operação</div>
    ${nav('painel','▦','Painel',active.length)}${nav('fluxo','→','Fluxo visual')}${nav('rastreio','⌕','Rastreamento',db.lotes.length)}${nav('finalizados','✓','Finalizados',db.lotes.filter(l=>l.status==='finalizado').length)}
    <div class="nav-title" style="margin-top:18px">Controle</div>${nav('divergencias','!','Divergências',issues)}${nav('consumo','◉','Consumo de tinta')}
    <div class="side-note"><strong>Ambiente de protótipo</strong><br>Dados gravados somente neste navegador. Nenhuma conexão com Firebase ou produção.</div></div></aside>`;
}
function nav(id,icon,label,count=''){return `<button class="nav-btn ${ui.view===id?'active':''}" data-view="${id}"><span>${icon}&nbsp;&nbsp;${label}</span>${count!==''?`<span class="nav-count">${count}</span>`:''}</button>`;}

function page(){
  if(ui.view==='detalhe') return detailPage();
  if(ui.view==='fluxo') return flowPage();
  if(ui.view==='rastreio') return trackingPage();
  if(ui.view==='finalizados') return finishedPage();
  if(ui.view==='divergencias') return issuesPage();
  if(ui.view==='consumo') return consumptionPage();
  return dashboardPage();
}

function heading(title,sub,action=true){return `<div class="page-head"><div><h1>${title}</h1><p>${sub}</p></div>${action?'<button class="btn btn-primary" data-action="new">+ Novo lote</button>':''}</div>`;}
function stats(){
  const active=db.lotes.filter(l=>l.status==='ativo');
  const totalPieces=active.reduce((s,l)=>s+l.pecasAtuais,0);
  return `<div class="stats"><div class="stat"><div class="value">${active.length}</div><div class="label">Lotes em processo</div></div><div class="stat"><div class="value">${totalPieces.toLocaleString('pt-BR')}</div><div class="label">Peças rastreadas</div></div><div class="stat alert"><div class="value">${active.filter(l=>l.prioridade==='Urgente').length}</div><div class="label">Prioridades urgentes</div></div><div class="stat"><div class="value">${db.lotes.reduce((s,l)=>s+l.perdasAcumuladas,0)}</div><div class="label">Perdas registradas</div></div></div>`;
}
function dashboardPage(){return `${heading('Painel da Pintura','Visão atual dos lotes e prioridades.')}${stats()}<section class="panel"><div class="panel-head"><h2>Lotes ativos</h2><span class="muted mono">Atualização local</span></div>${lotList(db.lotes.filter(l=>l.status==='ativo'))}</section>`;}

function filterBar(includeSituation=true){return `<div class="toolbar"><input class="input" data-filter="busca" placeholder="Buscar lote, cliente, perfil ou cor" value="${esc(ui.filters.busca)}"><select class="input" data-filter="etapa"><option value="todas">Todas as etapas</option>${ETAPAS.map(e=>`<option value="${e.id}" ${ui.filters.etapa===e.id?'selected':''}>${e.label}</option>`).join('')}</select><select class="input" data-filter="prioridade"><option value="todas">Todas as prioridades</option>${PRIORIDADES.map(p=>`<option ${ui.filters.prioridade===p?'selected':''}>${p}</option>`).join('')}</select>${includeSituation?`<select class="input" data-filter="situacao"><option value="todos" ${ui.filters.situacao==='todos'?'selected':''}>Ativos e finalizados</option><option value="ativos" ${ui.filters.situacao==='ativos'?'selected':''}>Somente ativos</option><option value="finalizados" ${ui.filters.situacao==='finalizados'?'selected':''}>Somente finalizados</option></select>`:'<div></div>'}</div>`;}
function trackingPage(){const lots=filteredLotes();return `${heading('Central de rastreamento','Localize qualquer lote e acompanhe sua posição atual.')}${stats()}<section class="panel"><div class="panel-head"><h2>${lots.length} lote${lots.length===1?'':'s'} encontrado${lots.length===1?'':'s'}</h2></div>${filterBar()}${lotList(lots)}</section>`;}
function finishedPage(){const lots=filteredLotes(true);return `${heading('Finalizados','Lotes concluídos e encaminhados para avaliação de faturamento.')}${stats()}<section class="panel"><div class="panel-head"><h2>Histórico de conclusão</h2></div>${filterBar(false)}${lotList(lots)}</section>`;}

function lotList(lots){if(!lots.length)return '<div class="empty">Nenhum lote encontrado com os filtros atuais.</div>';return `<div class="lot-list">${lots.map(l=>`<article class="lot-row"><div class="lot-main"><span class="lot-id">${esc(l.numero)}</span><strong>${esc(l.perfil)} · ${esc(l.cor)}</strong><small>${esc(l.pedido||'Sem pedido')} · atualizado ${fmtDate(l.atualizadoEm)}</small></div><div class="client-cell"><strong>${esc(l.cliente)}</strong><small class="muted">${esc(l.origem)}</small></div><div class="lot-stage"><strong><span>${esc(etapaLabel(l.etapaAtual))}</span><span>${progresso(l)}%</span></strong><div class="progress"><span style="width:${progresso(l)}%"></span></div></div><div class="qty"><strong>${l.pecasAtuais}</strong><small>peças · ${fmtKg(l.kgAtual)} kg</small></div><div class="priority-cell"><span class="priority ${l.prioridade}">${l.prioridade}</span><button class="btn btn-secondary btn-sm" style="margin-top:7px" data-detail="${l.id}">Abrir</button></div><button class="btn btn-secondary btn-sm mobile-only" data-detail="${l.id}">Abrir</button></article>`).join('')}</div>`;}

function flowPage(){
  const counts=Object.fromEntries(ETAPAS.map(e=>[e.id,db.lotes.filter(l=>l.etapaAtual===e.id).length]));
  return `${heading('Fluxo visual','Distribuição dos lotes por etapa operacional.')}<section class="panel"><div class="flow-wrap"><div class="flow">${ETAPAS.map((e,i)=>`<div class="flow-step ${counts[e.id]?'current':''}"><div class="num">ETAPA ${String(i+1).padStart(2,'0')}</div><div class="name">${e.label}</div><div style="margin-top:9px"><strong>${counts[e.id]}</strong> <small class="muted">lote(s)</small></div></div>`).join('')}</div></div></section><div style="height:16px"></div><section class="panel"><div class="panel-head"><h2>Todos os lotes</h2></div>${lotList(db.lotes)}</section>`;
}

function detailPage(){
  const l=getLote(ui.selected); if(!l){ui.view='painel';return dashboardPage();}
  const idx=etapaIndex(l.etapaAtual), next=ETAPAS[idx+1];
  return `${heading(`${esc(l.numero)} · ${esc(l.cliente)}`,`${esc(l.perfil)} · ${esc(l.cor)} · ${esc(l.pedido||'sem pedido')}`,false)}<button class="btn btn-secondary btn-sm" data-action="back">← Voltar</button><div style="height:12px"></div>
  <section class="panel"><div class="flow-wrap"><div class="flow">${ETAPAS.map((e,i)=>`<div class="flow-step ${i<idx?'done':i===idx?'current':''}"><div class="num">${i<idx?'CONCLUÍDA':i===idx?'ETAPA ATUAL':String(i+1).padStart(2,'0')}</div><div class="name">${e.label}</div></div>`).join('')}</div></div></section><div style="height:16px"></div>
  <div class="detail-grid"><section class="panel"><div class="panel-head"><h2>Linha do tempo</h2><span class="muted">${eventsOf(l.id).length} eventos imutáveis</span></div>${timeline(l)}</section><div><section class="panel"><div class="panel-head"><h2>Resumo do lote</h2></div><div class="summary">${summary('Etapa',etapaLabel(l.etapaAtual))}${summary('Saldo',`${l.pecasAtuais} peças`)}${summary('Peso',`${fmtKg(l.kgAtual)} kg`)}${summary('Tempo na etapa',tempoNaEtapa(l))}${summary('Perdas',l.perdasAcumuladas)}${summary('Retrabalho',l.retrabalhoAberto)}${summary('Responsável',l.responsavelAtual)}${summary('Prioridade',l.prioridade)}</div></section>${next?`<button class="btn btn-primary" style="width:100%;margin-top:12px" data-advance="${l.id}">Avançar para ${next.short}</button>`:''}</div></div>`;
}
function summary(label,value){return `<div class="summary-item"><span>${label}</span><strong>${esc(value)}</strong></div>`;}
function timeline(l){return `<div class="timeline">${eventsOf(l.id).map(e=>`<div class="event"><div class="event-icon">${e.tipo==='criacao'?'+':'✓'}</div><div class="event-body"><div class="event-title"><span>${e.tipo==='criacao'?'Lote criado':`${etapaLabel(e.de)} → ${etapaLabel(e.para)}`}</span><span class="mono muted">${fmtDate(e.criadoEm)}</span></div><div class="event-meta">${esc(e.usuario.nome)}</div><div class="event-qty"><span class="tag">Entrada ${e.pecasEntrada}</span><span class="tag">Aprovadas ${e.pecasAprovadas}</span><span class="tag">${fmtKg(e.kg)} kg</span>${e.retrabalho?`<span class="tag warn">Retrabalho ${e.retrabalho}</span>`:''}${e.perda?`<span class="tag loss">Perda ${e.perda}</span>`:''}${e.divergenciaContagem?`<span class="tag warn">Contagem ${e.divergenciaContagem}</span>`:''}</div>${e.motivo?`<div class="issue"><strong>Motivo:</strong> ${esc(e.motivo)}${e.observacao?`<br>${esc(e.observacao)}`:''}</div>`:''}</div></div>`).join('')}</div>`;}

function issuesPage(){
  const events=db.eventos.filter(e=>e.retrabalho||e.perda||e.divergenciaContagem).sort((a,b)=>new Date(b.criadoEm)-new Date(a.criadoEm));
  return `${heading('Divergências','Perdas, retrabalhos e diferenças de contagem preservados no histórico.')}<section class="panel"><div class="panel-head"><h2>${events.length} ocorrência(s)</h2></div><div class="timeline">${events.map(e=>{const l=getLote(e.loteId);return `<div class="event"><div class="event-icon">!</div><div class="event-body"><div class="event-title"><button class="btn btn-secondary btn-sm" data-detail="${l?.id}">${esc(l?.numero||e.loteId)}</button><span class="mono muted">${fmtDate(e.criadoEm)}</span></div><div class="event-qty">${e.retrabalho?`<span class="tag warn">Retrabalho ${e.retrabalho}</span>`:''}${e.perda?`<span class="tag loss">Perda ${e.perda}</span>`:''}${e.divergenciaContagem?`<span class="tag warn">Contagem ${e.divergenciaContagem}</span>`:''}</div><div class="issue"><strong>${esc(e.usuario.nome)}</strong><br>${esc(e.motivo)}</div></div></div>`}).join('')}</div></section>`;
}
function consumptionPage(){return `${heading('Consumo de tinta','Estrutura reservada para a próxima evolução do módulo.')}<section class="panel"><div class="panel-head"><h2>Apontamentos demonstrativos</h2></div><div class="consumption"><div class="placeholder"><strong>Modelo preparado:</strong> lote, produto/tinta, lote da tinta, kg consumidos, usuário e data/hora. Nesta Fase 1 a tela é somente consultiva; o lançamento operacional será liberado após definição de saldo, unidade e regras de aprovação.</div>${db.consumos.map(c=>{const l=getLote(c.loteId);return `<div class="lot-row" style="grid-template-columns:1fr 1fr 1fr"><div><span class="lot-id">${esc(l?.numero)}</span><strong style="display:block">${esc(c.tinta)}</strong></div><div><strong>${fmtKg(c.kg)} kg</strong><small class="muted" style="display:block">Lote tinta ${esc(c.loteTinta)}</small></div><div class="muted">${esc(c.usuario.nome)}<br>${fmtDate(c.criadoEm)}</div></div>`}).join('')}</div></section>`;}

function modal(){
  if(ui.modal==='new') return newLoteModal();
  if(ui.modal==='advance') return advanceModal();
  return '';
}
function modalShell(title,body){return `<div class="modal-backdrop" data-action="close"><section class="modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><div class="modal-head"><h2>${title}</h2><button class="close" data-action="close">×</button></div>${body}</section></div>`;}
function newLoteModal(){return modalShell('Cadastrar lote de pintura',`<form id="new-lote" class="form"><div class="form-grid">${field('numero','Número do lote','text','Gerado automaticamente')}${field('cliente','Cliente *','text','Ex.: Prado')}${field('pedido','Pedido / carteira','text','Ex.: PV-8500')}${field('perfil','Perfil *','text','Ex.: EIR-033')}${field('corte','Corte','text','Ex.: 6000')}${field('cor','Cor *','text','Ex.: Branco RAL 9003')}${field('pecas','Quantidade de peças *','number','0','min="1"')}${field('kg','Peso inicial (kg) *','number','0','min="0.001" step="0.001"')}${selectField('prioridade','Prioridade',PRIORIDADES)}${field('origem','Origem','text','Extrusão P4/P7')}<div class="field span-2"><label>Observação PCP</label><textarea class="input" name="observacao" placeholder="Orientações do lote"></textarea></div></div>${ui.error?`<div class="form-error">${esc(ui.error)}</div>`:''}<div class="form-actions"><button type="button" class="btn btn-secondary" data-action="close">Cancelar</button><button class="btn btn-primary">Cadastrar lote</button></div></form>`);}
function advanceModal(){const l=getLote(ui.selected),next=ETAPAS[etapaIndex(l.etapaAtual)+1];return modalShell(`Avançar para ${next.label}`,`<form id="advance-lote" class="form"><p class="muted">Lote <strong>${esc(l.numero)}</strong> · saldo atual ${l.pecasAtuais} peças e ${fmtKg(l.kgAtual)} kg.</p><input type="hidden" name="para" value="${next.id}"><div class="form-grid">${field('pecasEntrada','Peças de entrada','number',l.pecasAtuais,'min="0" readonly')}${field('pecasAprovadas','Peças aprovadas','number',l.pecasAtuais,'min="0"')}${field('retrabalho','Retrabalho','number','0','min="0"')}${field('perda','Perda definitiva','number','0','min="0"')}${field('divergenciaContagem','Divergência de contagem','number','0','min="0"')}${field('kg','Peso nesta etapa (kg)','number',l.kgAtual,'min="0" step="0.001"')}${selectActors()}<div class="field span-2"><label>Motivo da divergência</label><input class="input" name="motivo" placeholder="Obrigatório quando retrabalho, perda ou divergência for maior que zero"></div><div class="field span-2"><label>Observação</label><textarea class="input" name="observacao"></textarea></div></div><div class="equation" id="equation">Entrada = aprovadas + retrabalho + perda + divergência</div>${ui.error?`<div class="form-error">${esc(ui.error)}</div>`:''}<div class="form-actions"><button type="button" class="btn btn-secondary" data-action="close">Cancelar</button><button class="btn btn-primary">Registrar e avançar</button></div></form>`);}
function field(name,label,type,placeholder,attrs=''){return `<div class="field"><label>${label}</label><input class="input" name="${name}" type="${type}" placeholder="${esc(placeholder)}" ${type==='number'&&placeholder!==''?`value="${esc(placeholder)}"`:''} ${attrs}></div>`;}
function selectField(name,label,options){return `<div class="field"><label>${label}</label><select class="input" name="${name}">${options.map(o=>`<option>${o}</option>`).join('')}</select></div>`;}
function selectActors(){return `<div class="field"><label>Usuário responsável</label><select class="input" name="actor">${Object.entries(ACTORS).filter(([k])=>k!=='pcp').map(([k,a])=>`<option value="${k}">${a.nome}</option>`).join('')}</select></div>`;}

function bind(){
  app.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>{ui.view=el.dataset.view;ui.modal=null;render();});
  app.querySelectorAll('[data-detail]').forEach(el=>el.onclick=()=>{ui.selected=el.dataset.detail;ui.view='detalhe';render();});
  app.querySelectorAll('[data-action="new"]').forEach(el=>el.onclick=()=>{ui.modal='new';ui.error='';render();});
  app.querySelectorAll('[data-action="close"]').forEach(el=>el.onclick=()=>{ui.modal=null;ui.error='';render();});
  app.querySelectorAll('[data-action="back"]').forEach(el=>el.onclick=()=>{ui.view='painel';render();});
  app.querySelectorAll('[data-advance]').forEach(el=>el.onclick=()=>{ui.selected=el.dataset.advance;ui.modal='advance';ui.error='';render();});
  app.querySelectorAll('[data-filter]').forEach(el=>el.oninput=()=>{ui.filters[el.dataset.filter]=el.value;render();});
  const newForm=app.querySelector('#new-lote'); if(newForm)newForm.onsubmit=submitNew;
  const advanceForm=app.querySelector('#advance-lote'); if(advanceForm){advanceForm.onsubmit=submitAdvance;advanceForm.querySelectorAll('input[type="number"]').forEach(el=>el.oninput=updateEquation);}
}
function formObject(form){return Object.fromEntries(new FormData(form).entries());}
function submitNew(event){event.preventDefault();try{const result=criarLote(formObject(event.currentTarget),ACTORS.pcp);db={...db,lotes:[result.lote,...db.lotes],eventos:[...db.eventos,result.evento]};store.save(db);ui.modal=null;ui.selected=result.lote.id;ui.view='detalhe';notify('Lote cadastrado com rastreabilidade iniciada.');}catch(err){ui.error=err.message;render();}}
function submitAdvance(event){event.preventDefault();try{const data=formObject(event.currentTarget),actor=ACTORS[data.actor]||ACTORS.operador;const result=avancarLote(getLote(ui.selected),data,actor);db={...db,lotes:db.lotes.map(l=>l.id===result.lote.id?result.lote:l),eventos:[...db.eventos,result.evento]};store.save(db);ui.modal=null;notify(`Lote avançado para ${etapaLabel(result.lote.etapaAtual)}.`);}catch(err){ui.error=err.message;render();}}
function updateEquation(){const form=app.querySelector('#advance-lote'),d=formObject(form),entry=Number(d.pecasEntrada),sum=Number(d.pecasAprovadas)+Number(d.retrabalho)+Number(d.perda)+Number(d.divergenciaContagem),el=form.querySelector('#equation');el.textContent=`${entry} = ${sum} · ${entry===sum?'conta fechada':'ajuste necessário'}`;el.style.background=entry===sum?'#eef6f5':'#fde9e9';}
function notify(message){ui.toast=message;render();setTimeout(()=>{ui.toast='';render();},2400);}

render();
