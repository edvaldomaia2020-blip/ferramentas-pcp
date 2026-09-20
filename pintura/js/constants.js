export const ETAPAS=[
 {id:'formado',label:'Lote formado',short:'Formado',operational:false},
 {id:'recebido',label:'Recebido na Pintura',short:'Recebido',operational:true},
 {id:'processo',label:'Início da montagem dos carrinhos',short:'Em processo',operational:true},
 {id:'finalizado',label:'Embalagem finalizada',short:'Finalizado',operational:true}
];
export const PRIORIDADES=['Normal','Alta','Urgente'];
export const STATUS_VOLUME={disponivel:'Disponível',vinculado:'Vinculado a lote'};
export const etapaIndex=id=>ETAPAS.findIndex(e=>e.id===id);
export const etapaLabel=id=>ETAPAS.find(e=>e.id===id)?.label||id;
