import{etapaIndex}from'./constants.js';
export const round=v=>Math.round(Number(v||0)*1000)/1000;
export const makeId=p=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const positive=(v,l)=>{if(!(Number(v)>0))throw new Error(`${l} deve ser maior que zero.`);};
const actor=a=>({uid:a.uid,nome:a.nome,perfil:a.perfil});
const base=(l,t,a,n)=>({id:makeId('EVT'),loteId:l.id,tipo:t,usuario:actor(a),criadoEm:n});
const reason=(issue,m)=>{if(issue&&!String(m||'').trim())throw new Error('Informe o motivo da divergência, perda ou retrabalho.');};
export function formarLote(volumes,input,user,now=new Date().toISOString()){
 if(!volumes.length)throw new Error('Selecione ao menos um volume da B08.');
 if(volumes.some(v=>v.beneficiador!=='01533'||v.equipe!=='A'))throw new Error('Somente materiais BENEFICIADOR 01533 / EQUIPE A podem formar lote.');
 if(volumes.some(v=>v.status!=='disponivel'||v.loteId))throw new Error('Um ou mais volumes já pertencem a outro lote.');
 if(new Set(volumes.map(v=>(v.beneficiamento||'').trim().toLowerCase())).size>1)throw new Error('Selecione somente volumes com o mesmo beneficiamento/cor.');
 const id=makeId('LOT'),pecas=volumes.reduce((s,v)=>s+Number(v.pecas||0),0),kg=round(volumes.reduce((s,v)=>s+Number(v.pesoLiquido||0),0));
 positive(pecas,'O total de peças');positive(kg,'O total de kg');
 const lote={id,numero:String(input.numero||'').trim()||id.toUpperCase(),volumeIds:volumes.map(v=>v.id),quantidadeVolumes:volumes.length,
 cliente:[...new Set(volumes.map(v=>v.cliente).filter(Boolean))].join(' / '),pedido:[...new Set(volumes.map(v=>v.pedido).filter(Boolean))].join(' / '),
 perfil:[...new Set(volumes.map(v=>v.ferramenta).filter(Boolean))].join(' / '),cor:volumes[0].beneficiamento||'',prioridade:input.prioridade||'Normal',
 observacao:String(input.observacao||'').trim(),etapaAtual:'formado',pecasB08:pecas,kgB08:kg,pecasAtuais:pecas,kgAtual:kg,pecasBoas:null,
 perdasAcumuladas:0,retrabalhoAcumulado:0,divergenciasAcumuladas:0,recebidoEm:null,inicioProcessoEm:null,finalizadoEm:null,
 criadoEm:now,atualizadoEm:now,responsavelAtual:user.nome,status:'ativo',entrada:'b08'};
 const evento={...base(lote,'formacao',user,now),de:null,para:'formado',volumeIds:[...lote.volumeIds],quantidadeVolumes:volumes.length,pecasReferencia:pecas,pecas,kg,perda:0,retrabalho:0,divergencia:0,motivo:'',observacao:lote.observacao};
 return{lote,evento,volumes:volumes.map(v=>({...v,status:'vinculado',loteId:id,atualizadoEm:now}))};
}
export function registrarRecebimento(lote,input,user,now=new Date().toISOString()){
 if(lote.etapaAtual!=='formado')throw new Error('O lote não está aguardando recebimento.');
 const pecas=Number(input.pecas),kg=round(input.kg),qtd=Number(input.quantidadeVolumes);positive(pecas,'Peças recebidas');positive(kg,'Kg recebidos');positive(qtd,'Volumes recebidos');
 const div=Math.abs(lote.pecasB08-pecas);reason(div>0||qtd!==lote.quantidadeVolumes||kg!==lote.kgB08,input.motivo);
 const evento={...base(lote,'recebimento',user,now),de:'formado',para:'recebido',quantidadeVolumes:qtd,pecasReferencia:lote.pecasB08,pecas,kg,perda:0,retrabalho:0,divergencia:div,motivo:String(input.motivo||'').trim(),observacao:String(input.observacao||'').trim()};
 return{lote:{...lote,etapaAtual:'recebido',pecasAtuais:pecas,kgAtual:kg,recebidoEm:now,atualizadoEm:now,responsavelAtual:user.nome,divergenciasAcumuladas:lote.divergenciasAcumuladas+div},evento};
}
export function iniciarProcesso(lote,input,user,now=new Date().toISOString()){
 if(lote.etapaAtual!=='recebido')throw new Error('O lote precisa estar recebido antes de entrar em processo.');
 const pecas=Number(input.pecas),kg=round(input.kg),div=Math.abs(lote.pecasAtuais-pecas);positive(pecas,'Peças em processo');positive(kg,'Kg em processo');reason(div>0||kg!==lote.kgAtual,input.motivo);
 const evento={...base(lote,'inicio_processo',user,now),de:'recebido',para:'processo',pecasReferencia:lote.pecasAtuais,pecas,kg,perda:0,retrabalho:0,divergencia:div,motivo:String(input.motivo||'').trim(),observacao:String(input.observacao||'').trim()};
 return{lote:{...lote,etapaAtual:'processo',pecasAtuais:pecas,kgAtual:kg,inicioProcessoEm:now,atualizadoEm:now,responsavelAtual:user.nome,divergenciasAcumuladas:lote.divergenciasAcumuladas+div},evento};
}
export function finalizarEmbalagem(lote,input,user,now=new Date().toISOString()){
 if(lote.etapaAtual!=='processo')throw new Error('O lote precisa estar em processo para finalizar.');
 const boas=Number(input.pecasBoas),perda=Number(input.perda||0),retrabalho=Number(input.retrabalho||0),div=Number(input.divergencia||0),kg=round(input.kg);
 if([boas,perda,retrabalho,div,kg].some(v=>!Number.isFinite(v)||v<0))throw new Error('Quantidades não podem ser negativas.');
 if(lote.pecasAtuais!==boas+perda+retrabalho+div)throw new Error('A conta deve fechar: entrada = boas + perda + retrabalho + divergência.');
 reason(perda+retrabalho+div>0,input.motivo);
 const evento={...base(lote,'finalizacao',user,now),de:'processo',para:'finalizado',pecasReferencia:lote.pecasAtuais,pecas:boas,kg,perda,retrabalho,divergencia:div,motivo:String(input.motivo||'').trim(),observacao:String(input.observacao||'').trim()};
 return{lote:{...lote,etapaAtual:'finalizado',pecasAtuais:boas,pecasBoas:boas,kgAtual:kg,finalizadoEm:now,atualizadoEm:now,responsavelAtual:user.nome,perdasAcumuladas:lote.perdasAcumuladas+perda,retrabalhoAcumulado:lote.retrabalhoAcumulado+retrabalho,divergenciasAcumuladas:lote.divergenciasAcumuladas+div,status:'finalizado'},evento};
}
export function duracaoMs(i,f){if(!i||!f)return null;return Math.max(0,new Date(f)-new Date(i));}
export function temposLote(l){return{esperaMs:duracaoMs(l.recebidoEm,l.inicioProcessoEm),processoMs:duracaoMs(l.inicioProcessoEm,l.finalizadoEm),totalSetorMs:duracaoMs(l.recebidoEm,l.finalizadoEm)};}
export function progresso(l){return Math.max(0,Math.round(etapaIndex(l.etapaAtual)/3*100));}
