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
vm.runInNewContext(source + '\nglobalThis.api={state,renderHistoricoList,renderHistoricoDetail,renderNecRowCompact,montagemRecords,montagemMove,montagemStats,montagemCandidateValid,montagemParseB03,montagemParseCapacity,montagemCapacity,montagemBuildCards,montagemCard,renderMontagemPage,baseAppBuildPlan,baseAppGroupByPosicao,baseAppBuildFerramentaDoc,validateBaseAppRecords};\n})();', context);
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

test('Kanban agrupa pedido/item compatível, expande sem duplicar e preserva a ordem', () => {
  api.state.programacoesByKey = {}; api.state.ferramentas = [];
  const c = { origem:'B03_CART',idNecessidade:'PED-1|ITEM-2',pedido:'PED-1',item:'ITEM-2',
    codigo:'EIR-033',cliente:'Prado',saldoKg:100,kgExtrudar:120,prensasPermitidas:['P7'],liga:'6063',corte:'6000',
    statusPCP:'LIBERADO P/ PCP',programavelAgora:true };
  assert.equal(api.montagemCandidateValid(c),true);
  assert.equal(api.montagemCandidateValid({...c,kgExtrudar:0}),false);
  assert.equal(api.montagemCandidateValid({...c,programavelAgora:false}),false);
  const c2={...c,idNecessidade:'PED-3|ITEM-1',pedido:'PED-3',item:'ITEM-1',cliente:'Quality',saldoKg:30,kgExtrudar:40};
  const c3={...c,idNecessidade:'PED-4|ITEM-1',pedido:'PED-4',item:'ITEM-1',codigo:'EIR-044',kgExtrudar:80};
  const c4={...c,idNecessidade:'PED-5|ITEM-1',pedido:'PED-5',item:'ITEM-1',liga:'6060',kgExtrudar:50};
  const m={data:'2026-09-28',columns:{P7_Dia:[],P7_Noite:[],P4_Dia:[],P4_Noite:[]},
    candidates:[c,c2,c3,c4],tipo:{},step:'editar',sourceValidated:true};
  m.cards=api.montagemBuildCards(m.candidates);
  assert.equal(m.cards.length,3);
  assert.equal(m.cards[0].needs.length,2);
  assert.equal(m.cards[0].kgExtrudar,160);
  assert.equal(m.cards[2].separate,true);
  const id=m.cards[0].id,other=m.cards[1].id;
  assert.equal(api.montagemMove(m,id,'P4_Dia'),false);
  assert.equal(api.montagemMove(m,id,'P7_Noite'),true);
  assert.equal(api.montagemStats(m).n,1);
  assert.equal(api.montagemStats(m,'P7_Noite').kg,160);
  m.tipo[id]='RESERVA';
  assert.equal(api.montagemStats(m,'P7_Noite').reserva,160);
  const rows=api.montagemRecords(m,'Noite','PROXIMA');
  assert.equal(rows.length,2);
  assert.deepEqual(Array.from(rows,r=>r.chaveOrigem),['PED-1|ITEM-2','PED-3|ITEM-1']);
  assert.equal(rows[0].quantidadeKg,120);
  assert.equal(rows[0].saldoKgInformado,100);
  assert.equal(rows[0].secao,'RESERVA');
  api.state.user={uid:'pcp',nome:'PCP'};
  assert.equal(api.baseAppBuildFerramentaDoc(rows[0],'prog','2026-09-27T12:00:00Z').turnoOrigem,'Dia');
  assert.match(api.montagemCard(m,m.cards[0]),/Quality/);
  assert.match(api.montagemCard(m,m.cards[0]),/Pedido PED-3/);
  assert.match(api.montagemCard(m,m.cards[0]),/Reserva ligada/);
  assert.match(api.montagemCard(m,m.cards[2]),/Separada por liga diferente/);
  api.montagemMove(m,other,'P7_Noite');
  api.montagemMove(m,id,'P7_Noite',2);
  assert.deepEqual(Array.from(m.columns.P7_Noite),[other,id]);
  api.montagemMove(m,id,'P7_Noite',0);
  assert.deepEqual(Array.from(m.columns.P7_Noite),[id,other]);
  const first=api.baseAppBuildPlan(api.baseAppGroupByPosicao(api.montagemRecords(m,'Noite','PROXIMA'))).PROXIMA.hash;
  m.columns.P7_Noite.reverse();
  const reordered=api.baseAppBuildPlan(api.baseAppGroupByPosicao(api.montagemRecords(m,'Noite','PROXIMA'))).PROXIMA.hash;
  assert.notEqual(first,reordered);
  api.montagemMove(m,other,'P7_Dia');
  const both=api.montagemRecords(m,'Dia','ATUAL').concat(api.montagemRecords(m,'Noite','PROXIMA'));
  assert.equal(api.validateBaseAppRecords(both).errors.length,0);
  const plan=api.baseAppBuildPlan(api.baseAppGroupByPosicao(both));
  assert.equal(plan.ATUAL.data,'2026-09-28');
  assert.equal(plan.PROXIMA.turno,'Noite');
  assert.equal(plan.PROXIMA.totais.P7.kg,160);
});

test('primeira tela carrega Master; página tem cinco colunas e capacidade separada da Reserva', () => {
  api.state.montagem={step:'carregar',data:'2026-09-28',busca:'',filtroPrensa:'Todas',columns:{P7_Dia:[],P7_Noite:[],P4_Dia:[],P4_Noite:[]},tipo:{},candidates:[],cards:[],sourceValidated:false};
  const upload=api.renderMontagemPage();
  assert.match(upload,/Carregar Master/);
  assert.doesNotMatch(upload,/montagem-board/);
  assert.doesNotMatch(upload,/modal-overlay/);
  const m=api.state.montagem;m.step='editar';m.capacity={calendar:{'2026-09-28':{P7:20064,P4:9292.8}},hoursDay:10,hoursNight:9,normal:19,reinforced:24,start:'2026-09-22',end:'2026-09-29',nightActive:true};
  assert.equal(api.montagemCapacity(m,'P7','Dia'),10032);
  assert.equal(api.montagemCapacity(m,'P4','Noite'),4646.4);
  const html=api.renderMontagemPage();
  for(const label of ['Disponíveis','P7 turno 1','P7 turno 2','P4 turno 1','P4 turno 2']) assert.ok(html.includes(label));
  assert.match(html,/data-montagem-scroll="queue"/);
  assert.match(html,/data-action="montagem-preview" disabled/);
  assert.doesNotMatch(html,/data-action="montagem-add"/);
  m.data='2026-09-30';m.capacity.calendar['2026-09-30']={P7:15884,P4:7356.8};
  assert.equal(api.montagemCapacity(m,'P7','Dia'),8360);
  assert.equal(api.montagemCapacity(m,'P7','Noite'),7524);
  const heavy={origem:'B03_CART',idNecessidade:'99|1',pedido:'99',item:'1',codigo:'P7-TESTE',cliente:'Teste',
    saldoKg:11000,kgExtrudar:11000,prensasPermitidas:['P7'],liga:'6063',corte:'6000',statusPCP:'LIBERADO P/ PCP',programavelAgora:true};
  m.candidates=[heavy];m.cards=api.montagemBuildCards(m.candidates);m.columns.P7_Dia=[m.cards[0].id];m.sourceValidated=true;
  assert.match(api.renderMontagemPage(),/Principal excede em 2\.640 kg/);
  m.tipo[m.cards[0].id]='RESERVA';
  assert.doesNotMatch(api.renderMontagemPage(),/Principal excede/);
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
  const cards=api.montagemBuildCards(result.candidates);
  assert.ok(cards.length<result.candidates.length);
  assert.equal(cards.reduce((sum,c)=>sum+c.needs.length,0),116);
  const master={...fixture.param.sheet,__grid:fixture.param.grid};
  const calendar={...fixture.calendar.sheet,__grid:fixture.calendar.grid};
  context.XLSX={utils:{sheet_to_json:s=>s.__grid},SSF:{parse_date_code:()=>null}};
  const capacity=api.montagemParseCapacity({Sheets:{'0.PARAM':master,'0.CALEND':calendar}});
  const m={data:'2026-09-28',capacity};
  assert.equal(api.montagemCapacity(m,'P7','Dia'),10032);
  assert.equal(api.montagemCapacity(m,'P4','Noite'),4646.4);
  m.data='2026-09-27';assert.equal(api.montagemCapacity(m,'P7','Dia'),0);
  m.data='2026-09-30';assert.equal(api.montagemCapacity(m,'P7','Dia'),8360);
});
