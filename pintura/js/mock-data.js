import { criarLote, avancarLote } from './model.js';
import { ETAPAS } from './constants.js';

const USERS = {
  pcp: { uid: 'demo-pcp', nome: 'Edvaldo · PCP', perfil: 'pcp' },
  recebimento: { uid: 'demo-rec', nome: 'Solimar · Recebimento', perfil: 'pintura' },
  operador: { uid: 'demo-op', nome: 'Carlos · Pintura', perfil: 'pintura' },
  embalagem: { uid: 'demo-emb', nome: 'Jéssica · Embalagem', perfil: 'pintura' }
};

const at = hoursAgo => new Date(Date.now() - hoursAgo * 3600000).toISOString();

function build(input, targetIndex, issueAt = -1) {
  const created = criarLote(input, USERS.pcp, at(70));
  let lote = created.lote;
  const eventos = [created.evento];
  for (let i = 1; i <= targetIndex; i++) {
    const issue = i === issueAt;
    const entry = lote.pecasAtuais;
    const perda = issue ? 2 : 0;
    const retrabalho = issue ? 3 : 0;
    const moved = avancarLote(lote, {
      para: ETAPAS[i].id, pecasEntrada: entry, pecasAprovadas: entry - perda - retrabalho,
      retrabalho, perda, divergenciaContagem: 0,
      kg: Math.max(0, lote.kgAtual - perda * 0.62),
      motivo: issue ? 'Duas peças com amassado e três para repintura.' : '',
      observacao: issue ? 'Divergência segregada e identificada.' : ''
    }, i > 7 ? USERS.embalagem : USERS.operador, at(70 - i * 6));
    lote = moved.lote; eventos.push(moved.evento);
  }
  return { lote, eventos };
}

export function createMockData() {
  const samples = [
    build({ numero:'PNT-260901', cliente:'Prado', pedido:'PV-8431', perfil:'EIR-033', corte:'6200', cor:'Branco RAL 9003', pecas:180, kg:742.5, prioridade:'Urgente', origem:'Extrusão P7', observacao:'Prioridade para fechamento de carga.' }, 6, 4),
    build({ numero:'PNT-260902', cliente:'Metalseg', pedido:'PV-8450', perfil:'MT-210', corte:'5800', cor:'Preto RAL 9005', pecas:96, kg:388.8, prioridade:'Alta', origem:'Extrusão P4' }, 3),
    build({ numero:'PNT-260903', cliente:'Pereira Brito', pedido:'PV-8462', perfil:'PB-077', corte:'6000', cor:'Cinza RAL 7040', pecas:240, kg:921.4, prioridade:'Normal', origem:'Extrusão P7' }, 1),
    build({ numero:'PNT-260899', cliente:'Quality', pedido:'PV-8388', perfil:'QL-114', corte:'6100', cor:'Bronze 1002', pecas:120, kg:510, prioridade:'Normal', origem:'Extrusão P4' }, 10, 8)
  ];
  return {
    version: 1, actor: USERS.operador,
    lotes: samples.map(s => s.lote), eventos: samples.flatMap(s => s.eventos),
    consumos: [{ id:'CON-DEMO', loteId:samples[3].lote.id, tinta:'Poliéster Bronze 1002', loteTinta:'TT-9088', kg:18.4, usuario:USERS.operador, criadoEm:at(8) }]
  };
}
