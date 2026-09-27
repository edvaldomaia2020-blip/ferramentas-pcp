const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const source = html.split('<script type="module">')[2].split('/* ================= INIT ================= */')[0];
const context = {
  document: { getElementById: () => ({ innerHTML: '' }) },
  window: {}, localStorage: { getItem: () => null },
  console, Date, setTimeout, clearTimeout
};
vm.runInNewContext(source + '\nglobalThis.api={state,renderHistoricoList,renderHistoricoDetail,renderNecRowCompact,montagemRecords,montagemMove,montagemStats,montagemCandidateValid,montagemParseB03,renderMontagemModal,baseAppBuildPlan,baseAppGroupByPosicao,validateBaseAppRecords};\n})();', context);
const api = context.api;

test('histórico busca código e cliente junto de prensa, turno e tipo', () => {
  api.state.programacoesByKey = {
    old: { vigente: false, data: '2026-09-20', turno: 'Dia', totais: { P7: { n: 2, kg: 30 }, P4: { n: 0, kg: 0 } } },
    other: { vigente: false, data: '2026-09-21', turno: 'Noite', totais: { P7: { n: 0, kg: 0 }, P4: { n: 1, kg: 10 } } }
  };
  api.state.ferramentas = [
    { programacaoId: 'old', codigo: 'EIR-033', cliente: 'Prado', prensa: 'P7', tipo: 'Programação', turno: 'Dia', quantidadeKg: 20 },
    { programacaoId: 'old', codigo: 'EIR-044', cliente: 'Quality', prensa: 'P7', tipo: 'Reserva', turno: 'Dia', quantidadeKg: 10 },
    { programacaoId: 'other', codigo: 'AB-10', cliente: 'Prado', prensa: 'P4', tipo: 'Programação', turno: 'Noite', quantidadeKg: 10 }
  ];
  const h = { step: 'list', filtroData: '__all__', filtroTurno: 'Dia', filtroPrensa: 'P7', filtroTipo: 'Principal', busca: 'prado' };
  const list = api.renderHistoricoList(h);
  assert.match(list, /data-id="old"/);
  assert.doesNotMatch(list, /data-id="other"/);
  h.programacaoId = 'old';
  assert.match(api.renderHistoricoDetail(h), /EIR-033/);
  assert.doesNotMatch(api.renderHistoricoDetail(h), /EIR-044/);
  h.busca = 'eir-044'; h.filtroTipo = 'Reserva';
  assert.match(api.renderHistoricoDetail(h), /EIR-044/);
});

test('lista da Correção mostra programação, status e observação antes das ações', () => {
  api.state.programacoesByKey.current = { turno: 'Noite' };
  api.state.statusByKey = {};
  const row = api.renderNecRowCompact({ key: 'x', codigo: 'EIR-033', prensa: 'P4', data: '2026-09-27',
    programacaoId: 'current', kgTotal: 42, kgProgramacao: 42, kgReserva: 0,
    temObservacaoPCPAtual: true, observacaoPCPAtual: 'Atenção ao corte', observacoes: [] });
  assert.match(row, /EIR-033.*P4.*27\/09\/26.*Noite.*Principal.*Pendente/s);
  assert.match(row, /PCP: Atenção ao corte/);
  assert.match(row, /<details class="nec-compact-details">/);
  assert.match(row, /data-action="quick-nec-status"/);
});

test('Kanban só aceita necessidade da B03 liberada, com identidade e prensa permitida', () => {
  api.state.programacoesByKey = {};
  api.state.ferramentas = [];
  const c = { origem: 'B03_CART', idNecessidade: 'PED-1|ITEM-2', pedido: 'PED-1', item: 'ITEM-2',
    codigo: 'EIR-033', cliente: 'Prado', saldoKg: 120, prensasPermitidas: ['P7'], liga: '6063',
    statusPCP: 'LIBERADO P/ PCP', programavelAgora: true };
  assert.equal(api.montagemCandidateValid(c), true);
  assert.equal(api.montagemCandidateValid({ ...c, idNecessidade: '' }), false);
  assert.equal(api.montagemCandidateValid({ ...c, programavelAgora: false }), false);
  assert.equal(api.montagemCandidateValid({ ...c, statusPCP: 'STAND-BY' }), false);
  const m = { data: '2026-09-27', columns: {P7_Dia:[],P7_Noite:[],P4_Dia:[],P4_Noite:[]},
    candidates: [c], tipo: {}, step: 'editar', sourceValidated: true };
  assert.equal(api.montagemMove(m,c.idNecessidade,'P4_Dia'),false);
  assert.equal(api.montagemMove(m,c.idNecessidade,'P7_Dia'),true);
  assert.equal(api.montagemMove(m,c.idNecessidade,'P7_Noite'),true);
  assert.equal(api.montagemStats(m).n,1);
  assert.equal(api.montagemStats(m,'P7_Noite').kg,120);
  m.tipo[c.idNecessidade]='RESERVA';
  const rows = api.montagemRecords(m,'Noite','PROXIMA');
  assert.equal(api.validateBaseAppRecords(rows).errors.length, 0);
  assert.equal(rows[0].chaveOrigem,'PED-1|ITEM-2');
  assert.equal(rows[0].secao,'RESERVA');
  const plan = api.baseAppBuildPlan(api.baseAppGroupByPosicao(rows)).PROXIMA;
  assert.equal(plan.situacao, 'NOVA');
  assert.equal(plan.totais.P7.kg, 120);
  assert.equal(plan.secaoCount.RESERVA, 1);
  const c2={...c,idNecessidade:'PED-3|ITEM-1',pedido:'PED-3',item:'ITEM-1',saldoKg:40};
  m.candidates.push(c2);api.montagemMove(m,c2.idNecessidade,'P7_Noite');
  const first=api.baseAppBuildPlan(api.baseAppGroupByPosicao(api.montagemRecords(m,'Noite','PROXIMA'))).PROXIMA.hash;
  m.columns.P7_Noite.reverse();
  const reordered=api.baseAppBuildPlan(api.baseAppGroupByPosicao(api.montagemRecords(m,'Noite','PROXIMA'))).PROXIMA.hash;
  assert.notEqual(first,reordered);
});

test('sem alimentação B03, quadro vazio e publicação bloqueada', () => {
  api.state.montagem={step:'editar',data:'2026-09-27',busca:'',columns:{P7_Dia:[],P7_Noite:[],P4_Dia:[],P4_Noite:[]},tipo:{},candidates:[],sourceValidated:false};
  const html=api.renderMontagemModal();
  for(const label of ['P7 turno 1','P7 turno 2','P4 turno 1','P4 turno 2']) assert.ok(html.includes(label));
  assert.match(html,/Carregue a B03_CART/);
  assert.match(html,/data-action="montagem-preview" disabled/);
  assert.doesNotMatch(html,/data-action="montagem-add"/);
});

test('importador B03 diferencia pedidos com a mesma ferramenta e filtra AZ/BX', () => {
  const heads=['PEDIDO_ID','ITEM','FERRAMENTA_ID','LIGA','COMPRIMENTO','PRENSA','STATUS_PCP','PROGRAMÁVEL AGORA?','SALDO A PRODUZIR KG (SD_KG)','CLIENTE (DA CENTRAL)'];
  const grid=[[],[],[],heads,
    ['100','1','EIR-033','6063','6000','P7','LIBERADO P/ PCP','1','120','Prado'],
    ['101','2','EIR-033','6063','6000','P7','LIBERADO P/ PCP','1','40','Quality'],
    ['102','1','EIR-033','6063','6000','P7','CANCELADO','0','50','Prado']];
  context.XLSX={utils:{sheet_to_json:()=>grid}};
  const sheet={H5:{t:'n',v:1},I5:{t:'n',v:120},H6:{t:'n',v:1},I6:{t:'n',v:40},H7:{t:'n',v:0},I7:{t:'n',v:50}};
  const r=api.montagemParseB03({Sheets:{B03_CART:sheet}});
  assert.equal(r.candidates.length,2);
  assert.equal(r.candidates.map(c=>c.idNecessidade).join(','),'100|1,101|2');
  assert.equal(r.excluded,1);
});
