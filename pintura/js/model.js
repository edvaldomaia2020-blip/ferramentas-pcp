import { ETAPAS, etapaIndex } from './constants.js';

const round = value => Math.round(Number(value || 0) * 1000) / 1000;
export const makeId = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function validateLote(input) {
  const required = ['cliente', 'perfil', 'cor'];
  const missing = required.filter(k => !String(input[k] || '').trim());
  if (missing.length) throw new Error(`Preencha: ${missing.join(', ')}.`);
  if (!(Number(input.pecas) > 0)) throw new Error('A quantidade de peças deve ser maior que zero.');
  if (!(Number(input.kg) > 0)) throw new Error('O peso deve ser maior que zero.');
}

export function criarLote(input, actor, now = new Date().toISOString()) {
  validateLote(input);
  const id = makeId('LOT');
  const pecas = Number(input.pecas);
  const kg = round(input.kg);
  return {
    lote: {
      id,
      numero: input.numero?.trim() || id.toUpperCase(),
      cliente: input.cliente.trim(), pedido: input.pedido?.trim() || '',
      perfil: input.perfil.trim().toUpperCase(), corte: input.corte?.trim() || '',
      cor: input.cor.trim(), prioridade: input.prioridade || 'Normal',
      origem: input.origem?.trim() || 'Extrusão', observacao: input.observacao?.trim() || '',
      etapaAtual: 'aguardando', pecasIniciais: pecas, pecasAtuais: pecas,
      kgInicial: kg, kgAtual: kg, retrabalhoAberto: 0, perdasAcumuladas: 0,
      criadoEm: now, atualizadoEm: now, responsavelAtual: actor.nome,
      status: 'ativo', consumoTintaKg: 0
    },
    evento: {
      id: makeId('EVT'), loteId: id, tipo: 'criacao', de: null, para: 'aguardando',
      pecasEntrada: pecas, pecasAprovadas: pecas, retrabalho: 0, perda: 0,
      divergenciaContagem: 0, kg, motivo: '', observacao: input.observacao?.trim() || '',
      usuario: actor, criadoEm: now
    }
  };
}

export function validateMovimento(lote, input) {
  if (!lote || lote.status === 'finalizado') throw new Error('Este lote não pode ser movimentado.');
  const current = etapaIndex(lote.etapaAtual);
  const next = etapaIndex(input.para);
  if (current < 0 || next !== current + 1) throw new Error('O avanço deve respeitar a próxima etapa do fluxo.');
  const entrada = Number(input.pecasEntrada);
  const aprovadas = Number(input.pecasAprovadas);
  const retrabalho = Number(input.retrabalho || 0);
  const perda = Number(input.perda || 0);
  const contagem = Number(input.divergenciaContagem || 0);
  if ([entrada, aprovadas, retrabalho, perda, contagem].some(v => !Number.isFinite(v) || v < 0)) throw new Error('As quantidades não podem ser negativas.');
  if (entrada !== lote.pecasAtuais) throw new Error(`A entrada deve ser igual ao saldo atual de ${lote.pecasAtuais} peças.`);
  if (entrada !== aprovadas + retrabalho + perda + contagem) throw new Error('A conta deve fechar: entrada = aprovadas + retrabalho + perda + divergência.');
  if ((retrabalho + perda + contagem) > 0 && !String(input.motivo || '').trim()) throw new Error('Informe o motivo da divergência, perda ou retrabalho.');
  if (!(Number(input.kg) >= 0)) throw new Error('Informe um peso válido.');
}

export function avancarLote(lote, input, actor, now = new Date().toISOString()) {
  validateMovimento(lote, input);
  const evento = {
    id: makeId('EVT'), loteId: lote.id, tipo: 'movimentacao', de: lote.etapaAtual, para: input.para,
    pecasEntrada: Number(input.pecasEntrada), pecasAprovadas: Number(input.pecasAprovadas),
    retrabalho: Number(input.retrabalho || 0), perda: Number(input.perda || 0),
    divergenciaContagem: Number(input.divergenciaContagem || 0), kg: round(input.kg),
    motivo: String(input.motivo || '').trim(), observacao: String(input.observacao || '').trim(),
    usuario: actor, criadoEm: now
  };
  const finalizado = input.para === ETAPAS.at(-1).id;
  const atualizado = {
    ...lote, etapaAtual: input.para, pecasAtuais: evento.pecasAprovadas,
    kgAtual: evento.kg, retrabalhoAberto: lote.retrabalhoAberto + evento.retrabalho,
    perdasAcumuladas: lote.perdasAcumuladas + evento.perda,
    atualizadoEm: now, responsavelAtual: actor.nome, status: finalizado ? 'finalizado' : 'ativo'
  };
  return { lote: atualizado, evento };
}

export function progresso(lote) {
  const idx = Math.max(0, etapaIndex(lote.etapaAtual));
  return Math.round((idx / (ETAPAS.length - 1)) * 100);
}

export function tempoNaEtapa(lote, now = Date.now()) {
  const ms = Math.max(0, now - new Date(lote.atualizadoEm).getTime());
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
