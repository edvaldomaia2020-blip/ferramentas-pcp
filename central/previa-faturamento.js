/* Prévia de faturamento de vários dias — mesmas regras da planilha
   "PRÉVIA DE FATURAMENTO" (aba PROGRAMAÇÃO + FILAS), calculadas no navegador.
   Função pura: recebe carteira, filas e programação; devolve dias, linhas e alertas.
   Regras:
   - Dia útil = segunda a sexta fora de feriado/recesso. Calendário com pelo menos `diasMin` dias úteis.
   - Natural fatura no dia útil seguinte ao dia de produção (D+dNatural).
   - Pintado entra na fila da pintura: fila atual primeiro (por prioridade), depois linhas programadas
     na ordem: prioridade na pintura (pedido ou cliente) > dia de produção > ordem de lançamento.
     Começa no fim do dia de produção; fatura no dia útil seguinte ao dia em que termina de pintar.
   - Pedido normal só fatura com 100% do saldo programado, tudo junto na data da última produção.
   - Clientes agrupados faturam tudo junto na última data do cliente (programação + filas).
   - Data manual (FATURAR EM) vence as demais regras. Pedido fora da carteira = natural, sem regra de 100%.
   - Natural/pintado de cada linha: proporção do saldo do pedido na prensa (ou no pedido todo). */
(function(root){
 'use strict';
 const DAY=86400000;
 const iso=d=>new Date(d).toISOString().slice(0,10);
 const parse=s=>{const t=Date.parse(String(s).slice(0,10)+'T00:00:00Z');if(Number.isNaN(t))throw Error('Data inválida: '+s);return t};
 const ddmm=s=>s?String(s).slice(8,10)+'/'+String(s).slice(5,7):'';
 const up=s=>String(s??'').toLocaleUpperCase('pt-BR').trim();
 const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
 const contains=(text,list)=>{const t=up(text);return list.some(x=>up(x)&&t.includes(up(x)))};

 function calendario(inicio,feriados,minDias,ate){
  const off=new Set((feriados||[]).map(x=>String(x).slice(0,10)));
  const dias=[];let t=parse(inicio);
  const fim=ate?parse(ate):null;
  while(dias.length<minDias||(fim!==null&&t<=fim)){
   const w=new Date(t).getUTCDay(),d=iso(t);
   if(w!==0&&w!==6&&!off.has(d))dias.push(d);
   t+=DAY;if(dias.length>2000)break;
  }
  return dias;
 }

 function calcular(input){
  const cfg=Object.assign({diasMin:15,dNatural:1,fator:1},input.parametros||{});
  const capPint=num(cfg.capPintura);if(capPint<=0)throw Error('Capacidade da pintura não informada.');
  const cap={P7:num(cfg.capP7),P4:num(cfg.capP4),Pintura:capPint};
  const agrupados=(input.agrupados||[]).filter(x=>up(x));
  const prioridade=(input.prioridadePintura||[]).map(x=>String(x).trim()).filter(Boolean);
  const fora=new Map(Object.entries(input.foraCarteira||{}).map(([k,v])=>[String(k).trim(),v]));
  // carteira por pedido
  const ped=new Map();
  for(const c of input.carteira||[]){
   const p=String(c.pedido??'').trim(),kg=num(c.kg);if(!p||kg<=0)continue;
   const o=ped.get(p)||{pedido:p,cliente:c.cliente||'',entrega:null,saldo:0,P7:0,P4:0,natP7:0,natP4:0,nat:0};
   const pr=c.prensa==='P7'||c.prensa==='P4'?c.prensa:'';
   o.saldo+=kg;if(pr){o[pr]+=kg;if(c.natural)o['nat'+pr]+=kg}if(c.natural)o.nat+=kg;
   if(c.entrega&&(!o.entrega||String(c.entrega)<o.entrega))o.entrega=String(c.entrega).slice(0,10);
   if(!o.cliente)o.cliente=c.cliente||'';ped.set(p,o);
  }
  // calendário: programação + 15 dias úteis (estende se algo faturar depois)
  const prog=(input.programacao||[]).filter(x=>String(x.pedido??'').trim());
  const ultimoProg=prog.filter(x=>typeof x.dia==='string').reduce((m,x)=>x.dia>m?x.dia:m,'');
  const maxIdx=prog.filter(x=>typeof x.dia==='number').reduce((m,x)=>Math.max(m,x.dia),0);
  let dias=calendario(cfg.inicio,input.feriados,Math.max(cfg.diasMin,maxIdx),ultimoProg||null);
  const idx=d=>{const s=String(d).slice(0,10);let i=dias.indexOf(s);if(i>=0)return i+1;
   if(s<dias[0])return 0;while(dias[dias.length-1]<s)dias=calendario(cfg.inicio,input.feriados,dias.length+10,null);
   i=dias.findIndex(x=>x>=s);return i+1};
  const dataDe=i=>{while(dias.length<i)dias=calendario(cfg.inicio,input.feriados,dias.length+10,null);return dias[i-1]};
  const pintaPrio=(pedido,cliente)=>prioridade.some(x=>x===pedido||up(cliente).includes(up(x)));

  // linhas da programação
  const linhas=prog.map((x,ordem)=>{
   const pedido=String(x.pedido).trim(),c=ped.get(pedido),p7=num(x.p7),p4=num(x.p4),total=p7+p4;
   const cliente=c?c.cliente:(fora.get(pedido)||'NÃO ESTÁ NA CARTEIRA');
   const fr=pr=>{if(!c)return 1;if(c[pr]>0)return c['nat'+pr]/c[pr];return c.saldo>0?c.nat/c.saldo:1};
   const natural=p7*fr('P7')+p4*fr('P4');
   const dia=typeof x.dia==='number'?x.dia:idx(x.dia);
   return {ordem,dia,data:dataDe(dia),pedido,cliente,entrega:c?.entrega||null,carteiraP7:c?c.P7:0,carteiraP4:c?c.P4:0,
    p7,p4,total,naturalKg:natural,pintadoKg:total-natural,faturarEm:x.faturarEm?String(x.faturarEm).slice(0,10):null,
    naCarteira:!!c,foraCarteira:!c,agrupa:contains(cliente,agrupados)};
  });
  // filas atuais
  const filas=(input.filas||[]).filter(f=>f.fila&&num(f.kg)>0).map((f,ordem)=>({ordem,fila:up(f.fila),cliente:f.cliente||'',
   pedido:f.pedido?String(f.pedido).trim():'',kg:num(f.kg),prioridade:num(f.prioridade)||99,faturarEm:f.faturarEm?String(f.faturarEm).slice(0,10):null}));
  filas.forEach(f=>f.agrupa=contains(f.cliente,agrupados));
  // fila de pintura atual
  let acc=0;
  filas.filter(f=>f.fila==='PINTURA').sort((a,b)=>a.prioridade-b.prioridade||a.ordem-b.ordem).forEach(f=>{f.iniPint=acc;acc+=f.kg/capPint;f.fimPint=acc});
  const fimFila=acc;
  filas.forEach(f=>{
   if(f.fila==='FATURAMENTO HOJE'||f.fila==='EMBALADO')f.tecnico=1;
   else if(f.fila==='EMBALAGEM')f.tecnico=1+cfg.dNatural;
   else if(f.fila==='PINTURA')f.tecnico=Math.ceil(f.fimPint-1e-9)+1;
   else f.tecnico=1;
  });
  // pintura das linhas programadas
  let fim=fimFila;
  linhas.filter(l=>l.pintadoKg>=0.5&&l.dia>0)
   .sort((a,b)=>(pintaPrio(a.pedido,a.cliente)?0:1)-(pintaPrio(b.pedido,b.cliente)?0:1)||a.dia-b.dia||a.ordem-b.ordem)
   .forEach(l=>{fim=Math.max(fim,l.dia)+l.pintadoKg/capPint;l.fimPint=fim;l.iniPint=fim-l.pintadoKg/capPint});
  linhas.forEach(l=>{
   if(l.total<=0)return;
   l.tecnico=l.pintadoKg>=0.5?Math.ceil(l.fimPint-1e-9)+1:l.dia+cfg.dNatural;
   if(l.pintadoKg>=0.5)l.pintaEm=Math.ceil(l.fimPint-1e-9);
  });
  const progPedido=new Map();linhas.forEach(l=>progPedido.set(l.pedido,(progPedido.get(l.pedido)||0)+l.total));
  const maxTec=(arr,f)=>arr.filter(f).reduce((m,x)=>Math.max(m,x.tecnico||0),0);
  const filasP=filas.filter(f=>f.fila!=='FATURAMENTO HOJE');
  linhas.forEach(l=>{
   if(l.total<=0){l.faturaDia=null;return}
   if(l.faturarEm){l.faturaDia=Math.max(1,idx(l.faturarEm));l.regra='DATA MANUAL';return}
   if(l.agrupa){l.faturaDia=Math.max(maxTec(linhas,x=>x.cliente===l.cliente),maxTec(filasP,f=>f.cliente===l.cliente));l.regra='AGRUPADO CLIENTE';return}
   const saldo=ped.get(l.pedido)?.saldo||0;
   if(l.foraCarteira||progPedido.get(l.pedido)>=saldo-1){l.faturaDia=Math.max(maxTec(linhas,x=>x.pedido===l.pedido),maxTec(filasP,f=>f.pedido===l.pedido));l.regra=l.faturaDia>l.tecnico?'FIM DO PEDIDO':'OK';return}
   l.faturaDia=null;l.regra='AGUARDA 100%';l.falta=saldo-progPedido.get(l.pedido);
  });
  filas.forEach(f=>{
   if(f.faturarEm){f.faturaDia=Math.max(1,idx(f.faturarEm));f.regra='DATA MANUAL';return}
   if(f.fila==='FATURAMENTO HOJE'){f.faturaDia=1;f.regra='OK';return}
   if(f.agrupa){f.faturaDia=Math.max(f.tecnico,maxTec(linhas,x=>x.cliente===f.cliente),maxTec(filasP,x=>x.cliente===f.cliente));f.regra='AGRUPADO CLIENTE';return}
   if(!f.pedido){f.faturaDia=f.tecnico;f.regra='OK';return}
   const saldo=ped.get(f.pedido)?.saldo||0;
   if(saldo<=1){f.faturaDia=Math.max(f.tecnico,maxTec(filasP,x=>x.pedido===f.pedido));f.regra='OK';return}
   if((progPedido.get(f.pedido)||0)>=saldo-1){f.faturaDia=Math.max(f.tecnico,maxTec(linhas,x=>x.pedido===f.pedido),maxTec(filasP,x=>x.pedido===f.pedido));f.regra='FIM DO PEDIDO';return}
   f.faturaDia=null;f.regra='AGUARDA 100%';
  });
  // datas e alertas
  const ultimo=cfg.ultimoDiaFaturamento?String(cfg.ultimoDiaFaturamento).slice(0,10):null;
  const maxDia=Math.max(dias.length,...linhas.map(l=>l.faturaDia||0),...filas.map(f=>f.faturaDia||0),...linhas.map(l=>l.pintaEm||0));
  dataDe(maxDia);
  linhas.forEach(l=>{
   l.faturaEm=l.faturaDia?dataDe(l.faturaDia):null;l.pintaAte=l.pintaEm?dataDe(l.pintaEm):null;
   l.acabamento=l.total<=0?'':l.pintadoKg<0.5?'NATURAL':l.naturalKg<0.5?'PINTADO':'MISTO';
   const a=[];
   if(l.total<=0)a.push('INFORME O KG EM P7 E/OU P4');
   if(l.foraCarteira)a.push('FORA DA CARTEIRA (CONSIDERADO NATURAL)');
   if(l.naCarteira&&l.p7>0&&l.carteiraP7===0)a.push('FERRAMENTA SEM CADASTRO NA P7');
   if(l.naCarteira&&l.p4>0&&l.carteiraP4===0)a.push('FERRAMENTA SEM CADASTRO NA P4');
   if(l.regra==='AGUARDA 100%')a.push('AGUARDA FECHAR 100% (falta '+Math.round(l.falta)+' kg)');
   if(l.faturaDia&&l.tecnico&&l.faturaDia>l.tecnico&&!l.faturarEm)a.push('FATURA JUNTO EM '+ddmm(l.faturaEm)+(l.agrupa?' (AGRUPADO CLIENTE)':' (FIM DO PEDIDO)'));
   if(l.faturaEm&&ultimo&&l.faturaEm>ultimo)a.push('FATURA DEPOIS DE '+ddmm(ultimo));
   if(l.faturaEm&&l.entrega&&l.faturaEm>l.entrega)a.push('ATRASA ENTREGA');
   l.alertas=a;
  });
  filas.forEach(f=>{f.faturaEm=f.faturaDia?dataDe(f.faturaDia):null;f.pintaAte=f.fimPint!==undefined?dataDe(Math.max(1,Math.ceil(f.fimPint-1e-9))):null});
  // pintura por dia (fração do intervalo [ini,fim] que cai no dia)
  const fatia=(ini,fimP,j)=>Math.max(0,Math.min(fimP,j)-Math.max(ini,j-1))*capPint;
  const out=[];
  for(let j=1;j<=maxDia;j++){
   const doDia=linhas.filter(l=>l.dia===j);
   const p7=doDia.reduce((s,l)=>s+l.p7,0),p4=doDia.reduce((s,l)=>s+l.p4,0);
   const pintFila=filas.filter(f=>f.fimPint!==undefined).reduce((s,f)=>s+fatia(f.iniPint,f.fimPint,j),0);
   const pintNovo=linhas.filter(l=>l.fimPint!==undefined).reduce((s,l)=>s+fatia(l.iniPint,l.fimPint,j),0);
   const fat=[...linhas.filter(l=>l.faturaDia===j).map(l=>({pedido:l.pedido,cliente:l.cliente,kg:l.total,origem:'PROGRAMAÇÃO'})),
    ...filas.filter(f=>f.faturaDia===j).map(f=>({pedido:f.pedido,cliente:f.cliente,kg:f.kg,origem:f.fila}))];
   const ocup={P7:cap.P7?p7/cap.P7:0,P4:cap.P4?p4/cap.P4:0,Pintura:(pintFila+pintNovo)/capPint};
   const situacao=Math.max(ocup.P7,ocup.P4,ocup.Pintura)>1?'ESTOUROU':Math.min(ocup.P7,ocup.P4)>=0.98?'DIA FECHADO':Math.max(ocup.P7,ocup.P4)>=0.9?'QUASE CHEIO':'ABERTO';
   out.push({dia:j,data:dataDe(j),p7,p4,pinturaFila:pintFila,pinturaNovo:pintNovo,pintura:pintFila+pintNovo,
    faturamento:fat.reduce((s,x)=>s+x.kg,0),faturamentoItens:fat,ocupacao:ocup,situacao,
    sobraP7:cap.P7-p7,sobraP4:cap.P4-p4,sobraPintura:capPint-pintFila-pintNovo});
  }
  let acum=0;out.forEach(d=>{acum+=d.faturamento;d.acumulado=acum});
  const noPeriodo=d=>!ultimo||d.data<=ultimo;
  const periodo=out.filter(noPeriodo);
  const fatLinhas=linhas.filter(l=>l.faturaEm&&(!ultimo||l.faturaEm<=ultimo));
  const resumo={
   previstoKg:periodo.reduce((s,d)=>s+d.faturamento,0),
   pedidos:new Set(fatLinhas.map(l=>l.pedido)).size,
   clientes:new Set(fatLinhas.map(l=>l.cliente)).size,
   maiorDia:periodo.reduce((m,d)=>d.faturamento>(m?.faturamento??-1)?d:m,null),
   aguardando100Kg:linhas.filter(l=>l.regra==='AGUARDA 100%').reduce((s,l)=>s+l.total,0)+filas.filter(f=>f.regra==='AGUARDA 100%').reduce((s,f)=>s+f.kg,0),
   depoisDoPeriodoKg:ultimo?out.filter(d=>d.data>ultimo).reduce((s,d)=>s+d.faturamento,0):0,
   jaProduzidoKg:filas.filter(f=>f.faturaEm&&(!ultimo||f.faturaEm<=ultimo)).reduce((s,f)=>s+f.kg,0),
   fimFilaPinturaDias:fimFila
  };
  // pendentes: entrega até o último dia com saldo não programado
  const pendentes=[...ped.values()].filter(c=>c.entrega&&(!ultimo||c.entrega<=ultimo)).map(c=>({pedido:c.pedido,cliente:c.cliente,entrega:c.entrega,
   saldo:c.saldo,P7:c.P7,P4:c.P4,natural:c.nat,pintado:c.saldo-c.nat,programado:progPedido.get(c.pedido)||0,
   falta:Math.max(0,c.saldo-(progPedido.get(c.pedido)||0)),atrasado:c.entrega<dias[0]})).filter(x=>x.falta>1).sort((a,b)=>a.entrega<b.entrega?-1:a.entrega>b.entrega?1:0);
  // sugestões por prensa (entrega mais antiga primeiro)
  const sugestoes={};
  for(const pr of ['P7','P4']){
   const prog=new Map();linhas.forEach(l=>prog.set(l.pedido,(prog.get(l.pedido)||0)+l[pr.toLowerCase()]));
   sugestoes[pr]=[...ped.values()].filter(c=>c[pr]-(prog.get(c.pedido)||0)>1).map(c=>({pedido:c.pedido,cliente:c.cliente,entrega:c.entrega,
    saldo:c[pr],programado:prog.get(c.pedido)||0,falta:c[pr]-(prog.get(c.pedido)||0),
    acabamento:c['nat'+pr]<0.5?'PINTADO':c['nat'+pr]>=c[pr]-0.5?'NATURAL':'MISTO'})).sort((a,b)=>(a.entrega||'9')<(b.entrega||'9')?-1:(a.entrega||'9')>(b.entrega||'9')?1:0);
  }
  return {parametros:{...cfg,cap},dias:out,linhas,filas,resumo,pendentes,sugestoes,ultimoDiaFaturamento:ultimo};
 }

 /* Monta a entrada a partir da publicação da Central. */
 function capacidades(linhasCap,fator){
  const kg=(k,f)=>{const x=linhasCap?.[k];if(!x)return 0;return num(x.kgh)*num(x.aprov||1)*num(x.horas)*f};
  return {capP7:kg('P7',fator),capP4:kg('P4',fator),capPintura:kg('Pintura',1)};
 }
 function daPublicacao(d,manual){
  manual=manual||{};
  const prog=d.programacao||{},reu=d.resumo_diario?.reuniao||{};
  const fator=1; // Edvaldo 25/11: na prévia de faturamento NÃO aplicar os 90% (pedidos saem com até 10% de excedente); a Carga vs Capacidade segue com 90%
  const caps=capacidades(prog.linhas||{P7:{kgh:950,aprov:0.85,horas:20},P4:{kgh:440,aprov:0.85,horas:20},Pintura:{kgh:450,aprov:1,horas:20}},fator);
  const itens=(prog.itens&&prog.itens.length?prog.itens:(d.resumo_diario?.carteira_atual?.itens||[]));
  const carteira=itens.map(x=>({pedido:x.pedido,cliente:x.cliente,kg:x.kg,prensa:x.prensa,entrega:x.entrega,
   natural:x.pintura!==undefined?!x.pintura:up(x.cor||x.beneficiamento||'NT')==='NT'}));
  const feriados=[...new Set([...(prog.feriados||[]),...(reu.feriados||[]),...recesso(prog.recesso)])];
  const mapa={'FILA DE EMBALAGEM':'EMBALAGEM','FILA DE PINTURA':'PINTURA','EMBALADO EM ESTOQUE':'EMBALADO','FATURAMENTO PREVISTO':'FATURAMENTO HOJE'};
  const nm=x=>up(String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')).replace(/[^A-Z0-9]+/g,' ').trim();
  const mesmo=(a,b)=>{a=nm(a);b=nm(b);return !!a&&!!b&&(a===b||a.startsWith(b+' ')||b.startsWith(a+' '))};
  // data manual da fila: chave exata fila|cliente; a data dada ao cliente em FATURAMENTO HOJE acompanha o material se ele mudar de quadro (ex.: VEPAN foi para EMBALADO)
  const fatEm=Object.entries(manual.faturarEmFila||{});
  const dataExata=(fila,cliente)=>manual.faturarEmFila?.[fila+'|'+cliente];
  const dataFatHoje=cliente=>{const v=fatEm.filter(([k])=>k.startsWith('FATURAMENTO HOJE|')&&mesmo(k.slice(17),cliente)).map(([,v])=>v).sort();return v.length?v[v.length-1]:undefined};
  // linhas já produzidas (dias anteriores ao início) com FATURAR EM manual: o material delas está nas filas do cliente e leva a data junto
  const cliPed=new Map(carteira.map(c=>[String(c.pedido),c.cliente]));
  const herdada=new Map();for(const x of manual.programacaoAnterior||[]){if(!x.faturarEm)continue;const c=cliPed.get(String(x.pedido))||manual.foraCarteira?.[x.pedido];if(!c)continue;const v=String(x.faturarEm).slice(0,10);if(!herdada.has(c)||herdada.get(c)<v)herdada.set(c,v)}
  const dataHerdada=cliente=>{let best;for(const [c,v]of herdada)if(mesmo(c,cliente)&&(!best||v>best))best=v;return best};
  const filas=(d.quadros||[]).filter(q=>mapa[q.quadro]&&num(q.kg)>0).map(q=>{const fila=mapa[q.quadro];
   return {fila,cliente:q.cliente,kg:q.kg,prioridade:manual.prioridadeFila?.[q.cliente],
   faturarEm:dataExata(fila,q.cliente)||(fila!=='FATURAMENTO HOJE'?dataHerdada(q.cliente):undefined)||dataFatHoje(q.cliente)}});
  const hoje=manual.inicio||prog.inicio||new Date().toISOString().slice(0,10);
  return {parametros:{inicio:hoje,ultimoDiaFaturamento:manual.ultimoDiaFaturamento||fimDoMes(hoje),diasMin:15,dNatural:1,fator,...caps},
   carteira,feriados,filas,programacao:manual.programacao||[],agrupados:manual.agrupados||AGRUPADOS_PADRAO,
   foraCarteira:manual.foraCarteira||{},prioridadePintura:manual.prioridadePintura||[]};
 }
 function recesso(r){if(!r||r.length<2)return[];const out=[];for(let t=parse(r[0]);t<=parse(r[1]);t+=DAY)out.push(iso(t));return out}
 function fimDoMes(d){const t=new Date(parse(d));return iso(Date.UTC(t.getUTCFullYear(),t.getUTCMonth()+1,0))}
 const AGRUPADOS_PADRAO=['AELSON TAVARES','TRUCKVAN','AUTOMETAL','LOJA DO VIDRACEIRO','BRASIL DE RONDONIA','PRONTO ALUMINIO'];

 const api={calcular,calendario,daPublicacao,capacidades,AGRUPADOS_PADRAO};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.previaFaturamento=api;
})(typeof self!=='undefined'?self:this);
