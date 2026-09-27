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
vm.runInNewContext(source + '\nglobalThis.api={state,renderHistoricoList,renderHistoricoDetail,renderNecRowCompact,montagemRecords,baseAppBuildPlan,baseAppGroupByPosicao,validateBaseAppRecords};\n})();', context);
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

test('montagem usa o plano de versão existente sem alterar os outros turnos', () => {
  api.state.programacoesByKey = {};
  api.state.ferramentas = [];
  const m = { draftId: 'test', posicao: 'ATUAL', data: '2026-09-27', turno: 'Dia', rows: [
    { ferramenta: 'eir-033', cliente: 'Prado', quantidadeKg: '120', prensa: 'P7', secao: 'PRINCIPAL', corte: '', liga: '', observacao: '' },
    { ferramenta: 'eir-044', cliente: 'Quality', quantidadeKg: '30', prensa: 'P4', secao: 'RESERVA', corte: '', liga: '', observacao: '' }
  ] };
  const rows = api.montagemRecords(m);
  assert.equal(api.validateBaseAppRecords(rows).errors.length, 0);
  const plan = api.baseAppBuildPlan(api.baseAppGroupByPosicao(rows)).ATUAL;
  assert.equal(plan.situacao, 'NOVA');
  assert.equal(plan.totais.P7.kg, 120);
  assert.equal(plan.totais.P4.kg, 30);
  assert.equal(plan.secaoCount.RESERVA, 1);
  api.state.programacoesByKey = {
    old: { vigente: true, data: '2026-09-27', turno: 'Dia', papel: 'atual', conteudoHash: 'outro' },
    night: { vigente: true, data: '2026-09-27', turno: 'Noite', papel: 'proxima', conteudoHash: 'independente' }
  };
  api.state.ferramentas = [{ programacaoId: 'old', codigo: 'EIR-033', prensa: 'P7', quantidadeKg: 100 }];
  const replacement = api.baseAppBuildPlan(api.baseAppGroupByPosicao(rows)).ATUAL;
  assert.equal(replacement.situacao, 'NOVA_VERSAO');
  assert.equal(replacement.existing.id, 'old');
  assert.equal(api.state.programacoesByKey.night.vigente, true);
});
