import test from 'node:test';
import assert from 'node:assert/strict';
import { criarLote, avancarLote, validateMovimento, progresso } from '../js/model.js';
import { createMockData } from '../js/mock-data.js';

const actor={uid:'u1',nome:'Operador Teste',perfil:'pintura'};
const base={numero:'T-01',cliente:'Cliente',perfil:'ABC-001',cor:'Branco',pecas:100,kg:420,prioridade:'Normal'};

test('cadastro cria lote e evento inicial sem apagar origem',()=>{
  const {lote,evento}=criarLote(base,actor,'2026-09-20T10:00:00.000Z');
  assert.equal(lote.pecasAtuais,100);
  assert.equal(lote.etapaAtual,'aguardando');
  assert.equal(evento.tipo,'criacao');
  assert.equal(evento.pecasEntrada,100);
});

test('avanço preserva lote original e cria evento independente',()=>{
  const {lote}=criarLote(base,actor);
  const result=avancarLote(lote,{para:'recebido',pecasEntrada:100,pecasAprovadas:100,retrabalho:0,perda:0,divergenciaContagem:0,kg:420},actor);
  assert.equal(lote.etapaAtual,'aguardando');
  assert.equal(result.lote.etapaAtual,'recebido');
  assert.equal(result.evento.de,'aguardando');
  assert.equal(result.evento.para,'recebido');
});

test('bloqueia salto de etapa',()=>{
  const {lote}=criarLote(base,actor);
  assert.throws(()=>avancarLote(lote,{para:'tratamento',pecasEntrada:100,pecasAprovadas:100,kg:420},actor),/próxima etapa/);
});

test('bloqueia movimentação quando a conta das peças não fecha',()=>{
  const {lote}=criarLote(base,actor);
  assert.throws(()=>validateMovimento(lote,{para:'recebido',pecasEntrada:100,pecasAprovadas:98,retrabalho:0,perda:1,divergenciaContagem:0,kg:418}),/conta deve fechar/);
});

test('exige motivo para perda, retrabalho ou divergência',()=>{
  const {lote}=criarLote(base,actor);
  assert.throws(()=>validateMovimento(lote,{para:'recebido',pecasEntrada:100,pecasAprovadas:98,retrabalho:1,perda:1,divergenciaContagem:0,kg:418,motivo:''}),/Informe o motivo/);
});

test('registra perda e retrabalho no saldo e acumuladores',()=>{
  const {lote}=criarLote(base,actor);
  const result=avancarLote(lote,{para:'recebido',pecasEntrada:100,pecasAprovadas:95,retrabalho:3,perda:2,divergenciaContagem:0,kg:411,motivo:'Avaria identificada'},actor);
  assert.equal(result.lote.pecasAtuais,95);
  assert.equal(result.lote.perdasAcumuladas,2);
  assert.equal(result.lote.retrabalhoAberto,3);
  assert.equal(result.evento.motivo,'Avaria identificada');
});

test('progresso começa em zero',()=>{
  const {lote}=criarLote(base,actor);
  assert.equal(progresso(lote),0);
});

test('dados simulados demonstram todas as situações principais',()=>{
  const db=createMockData();
  assert.equal(db.lotes.length,4);
  assert.ok(db.lotes.some(l=>l.status==='finalizado'));
  assert.ok(db.lotes.some(l=>l.status==='ativo'));
  assert.ok(db.eventos.some(e=>e.perda>0));
  assert.ok(db.eventos.some(e=>e.retrabalho>0));
  assert.ok(db.consumos.length>0);
});

test('histórico cresce sem substituir eventos anteriores',()=>{
  const created=criarLote(base,actor,'2026-09-20T10:00:00.000Z');
  const history=[created.evento];
  const first=avancarLote(created.lote,{para:'recebido',pecasEntrada:100,pecasAprovadas:100,retrabalho:0,perda:0,divergenciaContagem:0,kg:420},actor,'2026-09-20T11:00:00.000Z');
  history.push(first.evento);
  const second=avancarLote(first.lote,{para:'gaiola',pecasEntrada:100,pecasAprovadas:100,retrabalho:0,perda:0,divergenciaContagem:0,kg:420},actor,'2026-09-20T12:00:00.000Z');
  history.push(second.evento);
  assert.deepEqual(history.map(e=>e.para),['aguardando','recebido','gaiola']);
  assert.equal(new Set(history.map(e=>e.id)).size,3);
});
