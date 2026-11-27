/* FILA DA PINTURA — DIA A DIA (painel de MONTAR PROGRAMAÇÃO, pedido do Edvaldo 27/11/2026).
   Uma linha por cliente + cor; uma coluna por dia útil; o kg vai sendo distribuído pela capacidade diária da pintura.
   Regras:
   - Só pinta o que está liberado: FILA DE PINTURA (já passou pelo apontamento de embalagem da extrusão) libera no 1º dia;
     perfil pintado na FILA DE EMBALAGEM libera no dia útil seguinte; a parte pintada da programação P7/P4 do dia D libera em D+1.
   - Cada dia: primeiro entram as células digitadas (ajuste manual, ficam travadas); o resto da capacidade vai, nesta ordem, para
     ordem manual da fila (pinturaOrdem, linhas movidas pelo Edvaldo) > prioridade (lista "prioridade na pintura" / prioridade da fila) > entrega mais antiga > cliente > cor, só com o que já está liberado.
   - Dentro da linha o material sai na ordem em que foi liberado; o dia em que cada lote termina de pintar vai para a prévia de faturamento.
   - Pintura parada no recesso (2026: pinta até 16/12, volta em 04/01/2027).
   Funções puras: `montar` lê a publicação + o resultado da prévia; `distribuir` faz a conta. */
(function(root){
 'use strict';
 const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
 const up=s=>String(s??'').toLocaleUpperCase('pt-BR').trim();
 const nm=x=>up(String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'')).replace(/[^A-Z0-9]+/g,' ').trim();
 const mesmo=(a,b)=>{a=nm(a);b=nm(b);return !!a&&!!b&&(a===b||a.startsWith(b+' ')||b.startsWith(a+' '))};
 const PARADA_PADRAO=[['2026-12-17','2027-01-03']]; // recesso 2026 da pintura (memória do projeto, 25/11)
 const SEM_COR='—';

 /* rows: [{key,cliente,cor,entrega,prio,lotes:[{kg,libera(índice do dia, 1 = primeiro),origem,ref}]}]
    dias: ['AAAA-MM-DD',...]; manual: {key:{data:kg}} */
 function distribuir(rows,dias,cap,manual,parada,ordemManual){
  const N=dias.length,par=parada||PARADA_PADRAO;
  const capDia=dias.map(d=>par.some(([a,b])=>d>=a&&d<=b)?0:cap);
  rows=rows.map(r=>({...r,lotes:r.lotes.map(l=>({...l,resta:l.kg,fim:null})).sort((a,b)=>a.libera-b.libera),aloc:new Array(N).fill(0),aprog:new Array(N).fill(0),man:new Array(N).fill(false),acima:new Array(N).fill(false)}));
  // ordem manual: linhas listadas vêm primeiro, na sequência escolhida; as demais (novas) depois, pela regra automática
  const pos=new Map((ordemManual||[]).map((k,i)=>[k,i])),po=r=>pos.has(r.key)?pos.get(r.key):1e9;
  const ordem=rows.slice().sort((a,b)=>po(a)-po(b)||a.prio-b.prio||String(a.entrega||'9').localeCompare(String(b.entrega||'9'))||a.cliente.localeCompare(b.cliente)||a.cor.localeCompare(b.cor));
  const liberado=(r,j)=>r.lotes.filter(l=>l.libera<=j).reduce((s,l)=>s+l.resta,0);
  const tira=(r,j,kg)=>{let f=kg;for(const l of r.lotes){if(f<=1e-6)break;if(l.resta<=1e-6)continue;const x=Math.min(l.resta,f);l.resta-=x;f-=x;if(l.origem==='PROGRAMAÇÃO')r.aprog[j-1]+=x;if(l.resta<=1e-6){l.resta=0;l.fim=j}}return kg-f};
  const usado=new Array(N).fill(0),entrada=new Array(N).fill(0),entradaProg=new Array(N).fill(0);
  rows.forEach(r=>r.lotes.forEach(l=>{if(l.libera>=1&&l.libera<=N){entrada[l.libera-1]+=l.kg;if(l.origem==='PROGRAMAÇÃO')entradaProg[l.libera-1]+=l.kg}}));
  // kg digitado em dias seguintes fica reservado: a sugestão de hoje não usa o material que o Edvaldo mandou pintar depois
  const mval=(r,i)=>{const m=manual?.[r.key],v=m?m[dias[i]]:undefined;return v===undefined||v===null||v===''?null:Math.max(0,num(v))};
  const reserva=(r,j)=>{let t=0;for(let i=j;i<N;i++){const v=mval(r,i);if(v!==null)t+=v}return t};
  for(let j=1;j<=N;j++){
   const d=dias[j-1];
   // 1) células digitadas (valem mesmo acima da capacidade; não passam do que existe na linha)
   for(const r of ordem){const m=manual?.[r.key];if(!m||m[d]===undefined||m[d]===null||m[d]==='')continue;
    const resto=r.lotes.reduce((s,l)=>s+l.resta,0),lib=liberado(r,j),q=Math.max(0,num(m[d]));
    const x=Math.min(q,resto);r.acima[j-1]=q>lib+0.5;
    if(x>0)tira(r,j,x);r.aloc[j-1]=x;r.man[j-1]=true;usado[j-1]+=x}
   // 2) sugestão: capacidade que sobrou, só com o que já está liberado
   for(const r of ordem){if(r.man[j-1])continue;const livre=capDia[j-1]-usado[j-1];if(livre<1)break;
    const x=Math.min(livre,liberado(r,j)-reserva(r,j));if(x<1)continue;tira(r,j,x);r.aloc[j-1]+=x;usado[j-1]+=x}
  }
  rows.forEach(r=>{r.total=r.lotes.reduce((s,l)=>s+l.kg,0);r.depois=r.lotes.reduce((s,l)=>s+l.resta,0);
   const u=r.aloc.reduce((m,v,i)=>v>0.5?i+1:m,0);r.ultimo=u||null;r.fim=r.depois>0.5?null:r.ultimo});
  return {rows:ordem.map(o=>rows.find(r=>r.key===o.key)),dias,capDia,usado,entrada,entradaProg,
   sobra:capDia.map((c,i)=>c-usado[i]),
   // dia (índice) em que termina cada lote: fila/embalagem por cliente, programação por linha (ordem)
   fim:(()=>{const f={fila:{},embalagem:{},linha:{}},depois=N+1;
    rows.forEach(r=>r.lotes.forEach(l=>{const v=l.fim||depois;
     if(l.origem==='FILA')f.fila[r.cliente]=Math.max(f.fila[r.cliente]||0,v);
     else if(l.origem==='EMBALAGEM')f.embalagem[r.cliente]=Math.max(f.embalagem[r.cliente]||0,v);
     else f.linha[l.ref]=Math.max(f.linha[l.ref]||0,v)}));return f})(),
   porDia:(()=>{const fila=new Array(N).fill(0),novo=new Array(N).fill(0);
    // pintado de cada dia separado em "já produzido" (fila + embalagem) e "novo" (programação da extrusão)
    rows.forEach(r=>r.aloc.forEach((v,i)=>{fila[i]+=v-r.aprog[i];novo[i]+=r.aprog[i]}));
    return {fila,novo}})()};
 }

 /* Pesos por cor dos itens pintados da carteira (kg a produzir). */
 function pesos(itens){const m=new Map();for(const x of itens){if(x.natural)continue;const c=x.cor&&x.cor!=='NT'?x.cor:SEM_COR;m.set(c,(m.get(c)||0)+Math.max(0,num(x.kg)))}
  const t=[...m.values()].reduce((s,v)=>s+v,0);return t>0?[...m].map(([cor,kg])=>[cor,kg/t]):[]}
 function divide(kg,ws){return ws.length?ws.map(([cor,w])=>[cor,kg*w]):[[SEM_COR,kg]]}

 /* d = publicação; input = entrada da prévia (daPublicacao); r = resultado de calcular; manual = rascunho da prévia */
 function montar(d,input,r,manual){
  manual=manual||{};
  const dias=r.dias.map(x=>x.data),N=dias.length,cart=input.carteira||[];
  const prio=(manual.prioridadePintura||[]).map(x=>String(x).trim()).filter(Boolean);
  const rows=[],aviso=[];
  const linha=(cliente,cor)=>{let o=rows.find(x=>x.cor===cor&&mesmo(x.cliente,cliente));if(!o){o={key:cliente+'|'+cor,cliente,cor,entrega:null,lotes:[],pedidos:new Set()};rows.push(o)}return o};
  const entregaCor=(cliente,cor)=>cart.filter(c=>!c.natural&&mesmo(c.cliente,cliente)&&(cor===SEM_COR||c.cor===cor)).reduce((m,c)=>c.entrega&&(!m||c.entrega<m)?String(c.entrega).slice(0,10):m,null);
  let semCor=0,semEmb=true;
  for(const q of d.quadros||[]){
   const kg=num(q.kg);if(kg<=0)continue;
   if(q.quadro==='FILA DE PINTURA'){
    const det=q.cores&&typeof q.cores==='object'?Object.entries(q.cores).filter(([,v])=>num(v)>0):[];
    const td=det.reduce((s,[,v])=>s+num(v),0);
    const partes=td>0?det.map(([c,v])=>[up(c)||SEM_COR,kg*num(v)/td]):divide(kg,pesos(cart.filter(c=>mesmo(c.cliente,q.cliente))));
    if(!(td>0))semCor++;
    for(const [cor,v] of partes)linha(q.cliente,cor).lotes.push({kg:v,libera:1,origem:'FILA'});
   }else if(q.quadro==='FILA DE EMBALAGEM'&&q.cores_pintura&&typeof q.cores_pintura==='object'){
    semEmb=false;
    let resto=kg;for(const [c,v] of Object.entries(q.cores_pintura)){const x=Math.min(resto,Math.max(0,num(v)));if(x<1)continue;resto-=x;linha(q.cliente,up(c)||SEM_COR).lotes.push({kg:x,libera:Math.min(2,N),origem:'EMBALAGEM'})}
   }
  }
  for(const l of r.linhas||[]){
   if(!(l.pintadoKg>=0.5)||!(l.dia>0))continue;
   const ws=pesos(cart.filter(c=>String(c.pedido)===l.pedido));
   for(const [cor,v] of divide(l.pintadoKg,ws)){const o=linha(l.cliente,cor);o.lotes.push({kg:v,libera:l.dia+1,origem:'PROGRAMAÇÃO',ref:l.ordem,data:l.data,pedido:l.pedido});o.pedidos.add(l.pedido);
    if(l.entrega&&(!o.entrega||l.entrega<o.entrega))o.entrega=l.entrega}
  }
  rows.forEach(o=>{const e=entregaCor(o.cliente,o.cor);if(e&&(!o.entrega||e<o.entrega))o.entrega=e;
   const pf=num(manual.prioridadeFila?.[o.cliente])||0,lst=prio.some(x=>[...o.pedidos].includes(x)||up(o.cliente).includes(up(x)));
   o.prio=lst?0:pf>0?pf:99;o.pedidos=[...o.pedidos]});
  // linhas removidas pelo Edvaldo (ex.: cliente que não existe mais): sai o material já produzido (fila + embalagem);
  // o que estiver programado na extrusão continua (tirar na programação). O kg tirado volta para a prévia, que deixa de contar.
  const remSet=new Set(manual.pinturaRemovidas||[]),removidas=[],tirar={fila:{},embalagem:{}};
  for(const o of rows){if(!remSet.has(o.key))continue;const kgF=o.lotes.filter(l=>l.origem==='FILA').reduce((s,l)=>s+l.kg,0),kgE=o.lotes.filter(l=>l.origem==='EMBALAGEM').reduce((s,l)=>s+l.kg,0);
   if(kgF)tirar.fila[o.cliente]=(tirar.fila[o.cliente]||0)+kgF;if(kgE)tirar.embalagem[o.cliente]=(tirar.embalagem[o.cliente]||0)+kgE;
   removidas.push({key:o.key,cliente:o.cliente,cor:o.cor,kg:kgF+kgE});o.lotes=o.lotes.filter(l=>l.origem==='PROGRAMAÇÃO')}
  for(const k of remSet)if(!removidas.some(x=>x.key===k)){const c=k.lastIndexOf('|');removidas.push({key:k,cliente:k.slice(0,c),cor:k.slice(c+1),kg:0})}
  if(semCor)aviso.push('A publicação ainda não traz a fila de pintura por cor: a cor de '+semCor+' cliente(s) foi estimada pelos itens pintados da carteira.');
  if(semEmb)aviso.push('A publicação ainda não traz o perfil pintado da fila de embalagem: ele entra na pintura só quando chegar à fila de pintura.');
  const res=distribuir(rows.filter(o=>o.lotes.some(l=>l.kg>=0.5)),dias,num(r.parametros?.cap?.Pintura)||9000,manual.pinturaManual||{},manual.pinturaParada,manual.pinturaOrdem);
  res.ordemManual=(manual.pinturaOrdem||[]).length>0;res.aviso=aviso;res.removidas=removidas;res.tirar=tirar;return res;
 }

 const api={montar,distribuir,PARADA_PADRAO,SEM_COR};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.pinturaFila=api;
})(typeof self!=='undefined'?self:this);
