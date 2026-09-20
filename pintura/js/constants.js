export const ETAPAS = [
  { id: 'aguardando', label: 'Aguardando chegada', short: 'Aguardando' },
  { id: 'recebido', label: 'Recebido na Pintura', short: 'Recebido' },
  { id: 'gaiola', label: 'Montagem de gaiola', short: 'Gaiola' },
  { id: 'tratamento', label: 'Banhos e tratamento', short: 'Tratamento' },
  { id: 'secagem', label: 'Estufa de secagem', short: 'Secagem' },
  { id: 'enganche', label: 'Engancheiramento', short: 'Enganche' },
  { id: 'aplicacao', label: 'Aplicação da tinta', short: 'Aplicação' },
  { id: 'cura', label: 'Cura', short: 'Cura' },
  { id: 'embalagem', label: 'Embalagem', short: 'Embalagem' },
  { id: 'finalizado', label: 'Finalizado', short: 'Finalizado' },
  { id: 'faturamento', label: 'Avaliação de faturamento', short: 'Faturamento' }
];

export const PRIORIDADES = ['Normal', 'Alta', 'Urgente'];
export const TIPOS_DIVERGENCIA = [
  { id: 'retrabalho', label: 'Retrabalho', hint: 'A peça permanece no fluxo.' },
  { id: 'perda', label: 'Perda definitiva', hint: 'A peça sai do saldo do lote.' },
  { id: 'contagem', label: 'Divergência de contagem', hint: 'Diferença física a apurar.' }
];

export const etapaIndex = id => ETAPAS.findIndex(e => e.id === id);
export const etapaLabel = id => ETAPAS.find(e => e.id === id)?.label || id;
