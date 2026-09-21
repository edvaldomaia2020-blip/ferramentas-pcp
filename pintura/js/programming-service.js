import{makeId,round}from'./model.js';

const actor=u=>({uid:u.uid,nome:u.nome,perfil:u.perfil});
const sum=(xs,key)=>round(xs.reduce((n,x)=>n+Number(x[key]||0),0));
export const blocoKey=(cliente,cor)=>`${String(cliente).trim()}||${String(cor).trim()}`;

export function blocosDisponiveis(volumes,programacoes=[]){
 const reserved=new Set(programacoes.flatMap(p=>p.blocos).filter(b=>b.status!=='removido').flatMap(b=>b.volumeIds));
 const eligible=volumes.filter(v=>v.beneficiador==='01533'&&v.equipe==='A'&&!v.loteId&&!reserved.has(v.id));
 return[...eligible.reduce((m,v)=>{const key=blocoKey(v.cliente,v.beneficiamento),b=m.get(key)||{key,cliente:v.cliente,cor:v.beneficiamento,volumeIds:[],volumes:[],kg:0,pecas:0};b.volumeIds.push(v.id);b.volumes.push(v);b.kg=round(b.kg+Number(v.pesoLiquido||0));b.pecas+=Number(v.pecas||0);m.set(key,b);return m;},new Map()).values()].sort((a,b)=>b.kg-a.kg);
}

export function criarProgramacao(input,user,now=new Date().toISOString()){
 if(!String(input.data||'').trim())throw new Error('Informe a data da programação.');
 if(!['DIA','NOITE'].includes(input.turno))throw new Error('Selecione o turno Dia ou Noite.');
 return{id:makeId('PRG'),data:input.data,turno:input.turno,capacidadeKg:input.capacidadeKg?Number(input.capacidadeKg):null,status:'rascunho',blocos:[],historico:[{tipo:'criacao',criadoEm:now,usuario:actor(user)}],criadoEm:now,atualizadoEm:now};
}

export function adicionarBloco(programacao,bloco,user,now=new Date().toISOString()){
 if(!bloco?.volumeIds?.length)throw new Error('Selecione um cliente e uma cor disponíveis.');
 const item={id:makeId('BLK'),ordem:programacao.blocos.length+1,cliente:bloco.cliente,cor:bloco.cor,volumeIds:[...bloco.volumeIds],kg:round(bloco.kg),pecas:Number(bloco.pecas),status:'programado',loteId:null,adicionadoEm:now};
 return{...programacao,blocos:[...programacao.blocos,item],atualizadoEm:now,historico:[...programacao.historico,{tipo:'inclusao',blocoId:item.id,ordem:item.ordem,criadoEm:now,usuario:actor(user)}]};
}

const reorder=blocks=>blocks.map((b,i)=>({...b,ordem:i+1}));
export function moverBloco(programacao,blocoId,direcao,user,now=new Date().toISOString()){
 const blocks=[...programacao.blocos],i=blocks.findIndex(b=>b.id===blocoId);if(i<0)throw new Error('Bloco não encontrado.');
 if(blocks[i].status!=='programado')throw new Error('Blocos iniciados não podem ser reordenados.');
 const j=direcao==='subir'?i-1:i+1;if(j<0||j>=blocks.length)return programacao;if(blocks[j].status!=='programado')throw new Error('A sequência já executada deve ser preservada.');
 [blocks[i],blocks[j]]=[blocks[j],blocks[i]];return{...programacao,blocos:reorder(blocks),atualizadoEm:now,historico:[...programacao.historico,{tipo:'reordenacao',blocoId,criadoEm:now,usuario:actor(user)}]};
}

export function removerBloco(programacao,blocoId,user,now=new Date().toISOString()){
 const item=programacao.blocos.find(b=>b.id===blocoId);if(!item)throw new Error('Bloco não encontrado.');if(item.status!=='programado')throw new Error('Blocos iniciados não podem ser removidos.');
 return{...programacao,blocos:reorder(programacao.blocos.filter(b=>b.id!==blocoId)),atualizadoEm:now,historico:[...programacao.historico,{tipo:'remocao',blocoId,criadoEm:now,usuario:actor(user)}]};
}

export function vincularLote(programacao,blocoId,loteId,status='recebido',now=new Date().toISOString()){
 return{...programacao,blocos:programacao.blocos.map(b=>b.id===blocoId?{...b,loteId,status}:b),atualizadoEm:now};
}

export function resumoProgramacao(programacao){
 const ativos=programacao?.blocos?.filter(b=>b.status!=='removido')||[],kg=sum(ativos,'kg'),pecas=sum(ativos,'pecas'),porCor=[...ativos.reduce((m,b)=>m.set(b.cor,round((m.get(b.cor)||0)+b.kg)),new Map())].map(([cor,peso])=>({cor,kg:peso,percentual:kg?round(peso/kg*100):0})).sort((a,b)=>b.kg-a.kg);
 return{kg,pecas,blocos:ativos.length,porCor,capacidadeKg:programacao?.capacidadeKg||null,utilizacao:programacao?.capacidadeKg?round(kg/programacao.capacidadeKg*100):null};
}

export function resumoCarteira(volumes,programacoes=[]){
 const elegiveis=volumes.filter(v=>v.beneficiador==='01533'&&v.equipe==='A'&&!v.loteId),total=sum(elegiveis,'pesoLiquido');
 const ids=new Set(programacoes.flatMap(p=>p.blocos).filter(b=>b.status!=='removido').flatMap(b=>b.volumeIds)),sequenciado=sum(elegiveis.filter(v=>ids.has(v.id)),'pesoLiquido');
 return{disponivel:total,sequenciado,naoSequenciado:round(total-sequenciado)};
}
