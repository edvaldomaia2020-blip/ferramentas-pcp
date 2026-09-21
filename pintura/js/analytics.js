import{round}from'./model.js';
export const toneladas=kg=>round(Number(kg||0)/1000);
export const statusConfronto=(lote,volumes)=>{const origem=(lote.volumeIds||[]).map(id=>volumes.find(v=>v.id===id)).filter(Boolean),temP=origem.some(v=>v.confirmadoAcesys),todosP=origem.length>0&&origem.every(v=>v.confirmadoAcesys);if(lote.etapaAtual==='finalizado')return todosP?'CONFIRMADO_ACESYS':'AGUARDANDO_B08';if(temP)return'DIVERGENCIA_B08_SEM_APP';return'PENDENTE_APP';};
export const labelConfronto=s=>({CONFIRMADO_ACESYS:'Confirmado no ACESYS',AGUARDANDO_B08:'Aguardando confirmação B08',DIVERGENCIA_B08_SEM_APP:'B08 P sem finalização no app',PENDENTE_APP:'Pendente no app'})[s]||s;
export const filaPintura=volumes=>volumes.filter(v=>v.beneficiador==='01533'&&v.equipe==='A');
const group=(items,key)=>[...items.reduce((m,v)=>{const k=v[key]||'Não informado',g=m.get(k)||{chave:k,itens:[],kg:0,pecas:0};g.itens.push(v);g.kg=round(g.kg+Number(v.pesoLiquido||0));g.pecas+=Number(v.pecas||0);m.set(k,g);return m;},new Map()).values()].sort((a,b)=>b.kg-a.kg);
export const agruparPorCliente=volumes=>group(volumes,'cliente');
export const agruparPorPedido=volumes=>group(volumes,'pedido');
export const agruparPorCor=volumes=>group(volumes,'beneficiamento');
export function indicadores(volumes,lotes){const all=volumes.filter(v=>v.beneficiador==='01533'&&v.equipe==='A'),sum=xs=>round(xs.reduce((s,v)=>s+Number(v.pesoLiquido||0),0)),lotKg=stage=>round(lotes.filter(l=>stage(l)).reduce((s,l)=>s+Number(l.kgAtual||0),0));return{programado:sum(all),fila:sum(filaPintura(volumes).filter(v=>!v.loteId)),recebido:lotKg(l=>l.etapaAtual==='recebido'),processo:lotKg(l=>l.etapaAtual==='processo'),finalizadoApp:lotKg(l=>l.etapaAtual==='finalizado'),confirmadoAcesys:sum(volumes.filter(v=>v.beneficiador==='01533'&&v.equipe==='P'))};}
export function filtrarFila(volumes,f={}){const q=String(f.busca||'').toLowerCase();return filaPintura(volumes).filter(v=>(!q||[v.cliente,v.pedido,v.item,v.ferramenta,v.beneficiamento,v.volume].join(' ').toLowerCase().includes(q))&&(!f.cor||f.cor==='todas'||v.beneficiamento===f.cor)&&(!f.data||v.dataEmbalagem===f.data));}
