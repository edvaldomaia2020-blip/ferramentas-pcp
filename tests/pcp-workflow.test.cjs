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
vm.runInNewContext(source + '\nglobalThis.api={state,renderHistoricoList,renderHistoricoDetail,renderNecRowCompact,montagemRecords,montagemMove,montagemStats,montagemCandidateValid,montagemParseB03,renderMontagemModal,baseAppBuildPlan,baseAppGroupByPosicao,baseAppBuildFerramentaDoc,validateBaseAppRecords};\n})();', context);
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
    codigo: 'EIR-033', cliente: 'Prado', saldoKg: 100, kgExtrudar: 120, prensasPermitidas: ['P7'], liga: '6063',
    statusPCP: 'LIBERADO P/ PCP', programavelAgora: true };
  assert.equal(api.montagemCandidateValid(c), true);
  assert.equal(api.montagemCandidateValid({ ...c, idNecessidade: '' }), false);
  assert.equal(api.montagemCandidateValid({ ...c, programavelAgora: false }), false);
  assert.equal(api.montagemCandidateValid({ ...c, statusPCP: 'STAND-BY' }), false);
  assert.equal(api.montagemCandidateValid({ ...c, kgExtrudar: 0 }), false);
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
  assert.equal(rows[0].saldoKgInformado,100);
  assert.equal(rows[0].quantidadeKg,120);
  assert.equal(rows[0].secao,'RESERVA');
  const plan = api.baseAppBuildPlan(api.baseAppGroupByPosicao(rows)).PROXIMA;
  assert.equal(plan.situacao, 'NOVA');
  assert.equal(plan.totais.P7.kg, 120);
  assert.equal(plan.secaoCount.RESERVA, 1);
  api.state.user={uid:'pcp',nome:'PCP'};
  const doc=api.baseAppBuildFerramentaDoc(rows[0],'prog','2026-09-27T12:00:00Z');
  assert.equal(doc.quantidadeKg,120);
  assert.equal(doc.saldoKgInformado,100);
  assert.equal(doc.turnoOrigem,'Dia');
  const c2={...c,idNecessidade:'PED-3|ITEM-1',pedido:'PED-3',item:'ITEM-1',saldoKg:30,kgExtrudar:40};
  m.candidates.push(c2);api.montagemMove(m,c2.idNecessidade,'P7_Noite');
  const first=api.baseAppBuildPlan(api.baseAppGroupByPosicao(api.montagemRecords(m,'Noite','PROXIMA'))).PROXIMA.hash;
  m.columns.P7_Noite.reverse();
  const reordered=api.baseAppBuildPlan(api.baseAppGroupByPosicao(api.montagemRecords(m,'Noite','PROXIMA'))).PROXIMA.hash;
  assert.notEqual(first,reordered);
  api.montagemMove(m,c2.idNecessidade,'P7_Dia');
  const both=api.montagemRecords(m,'Dia','ATUAL').concat(api.montagemRecords(m,'Noite','PROXIMA'));
  assert.equal(api.validateBaseAppRecords(both).errors.length,0);
  const planBoth=api.baseAppBuildPlan(api.baseAppGroupByPosicao(both));
  assert.equal(planBoth.ATUAL.data,'2026-09-27');
  assert.equal(planBoth.PROXIMA.data,'2026-09-27');
  assert.equal(planBoth.ATUAL.turno,'Dia');
  assert.equal(planBoth.PROXIMA.turno,'Noite');
});

test('sem alimentação B03, quadro vazio e publicação bloqueada', () => {
  api.state.montagem={step:'editar',data:'2026-09-27',busca:'',columns:{P7_Dia:[],P7_Noite:[],P4_Dia:[],P4_Noite:[]},tipo:{},candidates:[],sourceValidated:false};
  const html=api.renderMontagemModal();
  for(const label of ['P7 turno 1','P7 turno 2','P4 turno 1','P4 turno 2']) assert.ok(html.includes(label));
  assert.match(html,/Carregue a B03 CART/);
  assert.match(html,/data-action="montagem-preview" disabled/);
  assert.doesNotMatch(html,/data-action="montagem-add"/);
});

test('importador B03 aceita ambas as abas, usa BZ e mostra pendência sem prensa', () => {
  const heads=['PEDIDO_ID','ITEM','FERRAMENTA_ID','LIGA','COMPRIMENTO','PRENSA','STATUS_PCP','PROGRAMÁVEL AGORA?','SALDO A PRODUZIR KG (SD_KG)','KG A EXTRUDAR LÍQUIDO','CLIENTE (DA CENTRAL)'];
  const grid=[[],[],[],heads,
    ['100','1','EIR-033','6063','6000','P7','LIBERADO P/ PCP','1','100','120','Prado'],
    ['101','2','EIR-033','6063','6000','P7','LIBERADO P/ PCP','1','30','40','Quality'],
    ['103','1','CDX-180','6063','6000','','LIBERADO P/ PCP','1','300','315','Diviflex'],
    ['104','1','ETQ-060','6063','6000','P4','LIBERADO P/ PCP','1','647','0','David'],
    ['102','1','EIR-033','6063','6000','P7','CANCELADO','0','50','52.5','Prado']];
  context.XLSX={utils:{sheet_to_json:()=>grid}};
  const sheet={H5:{t:'n',v:1},I5:{t:'n',v:100},J5:{t:'n',v:120},H6:{t:'n',v:1},I6:{t:'n',v:30},J6:{t:'n',v:40},
    H7:{t:'n',v:1},I7:{t:'n',v:300},J7:{t:'n',v:315},H8:{t:'n',v:1},I8:{t:'n',v:647},J8:{t:'n',v:0},H9:{t:'n',v:0}};
  const r=api.montagemParseB03({Sheets:{'B03 CART':sheet}});
  assert.equal(r.candidates.length,2);
  assert.equal(r.candidates.map(c=>c.idNecessidade).join(','),'100|1,101|2');
  assert.equal(r.candidates[0].kgExtrudar,120);
  assert.equal(r.candidates[0].saldoKg,100);
  assert.equal(r.gateCount,4);
  assert.equal(r.pressCount,3);
  assert.equal(r.pending.length,2);
  assert.equal(r.pending[0].idNecessidade,'103|1');
  assert.equal(r.pending[1].reason,'BZ sem kg positivo');
  assert.equal(r.excluded,1);
  assert.equal(api.montagemParseB03({Sheets:{B03_CART:sheet}}).candidates.length,2);
});

if (process.env.B03_TEST_FIXTURE) test('cópia oficial: 118 elegíveis, 117 com P4/P7 e pendências explícitas', () => {
  const fixture=JSON.parse(fs.readFileSync(process.env.B03_TEST_FIXTURE,'utf8'));
  context.XLSX={utils:{sheet_to_json:()=>fixture.grid}};
  const result=api.montagemParseB03({Sheets:{'B03 CART':fixture.sheet}});
  assert.equal(result.gateCount,118);
  assert.equal(result.pressCount,117);
  assert.equal(result.candidates.length,116);
  assert.equal(result.pending.length,2);
  assert.equal(result.pending.find(c=>c.idNecessidade==='13156|1').reason,'Prensa ausente ou diferente de P4/P7');
  assert.equal(result.pending.find(c=>c.idNecessidade==='13155|2').reason,'BZ sem kg positivo');
});
