/* Tela PRÉVIA DE FATURAMENTO da Central (substitui a planilha de prévia).
   Edição fica num rascunho no navegador e recalcula na hora; SALVAR E PUBLICAR grava tudo de uma vez
   em _gestao.previa (somente o acesso do Edvaldo). */
(()=>{
 'use strict';
 const P=window.previaFaturamento;
 const dayNow=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 const br=d=>d?d.slice(8,10)+'/'+d.slice(5,7):'';
 const wd=d=>d?['dom','seg','ter','qua','qui','sex','sáb'][new Date(d+'T12:00:00Z').getUTCDay()]+' '+br(d):'';
 const pct=x=>Math.round(100*x)+'%';
 const css=document.createElement('style');
 css.textContent='.pv-sit{font-weight:700;white-space:nowrap}.pv-ESTOUROU{color:#9b211c}.pv-QUASE{color:#9a6a00}.pv-FECHADO{color:#12634b}.pv-ABERTO{color:#1f5f99}.pv-alert{color:#9b211c;font-size:12px}.pv-days{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin:16px 0}.pv-day{background:white;border:1px solid #ccd8e5;border-radius:6px;padding:12px;font-size:13px}.pv-day h4{margin:0 0 6px}.pv-day ul{margin:6px 0 0;padding-left:18px}.pv-day li{margin:2px 0}.pv-cfg textarea{width:100%;min-height:110px;font:inherit;padding:8px;border:1px solid #9fb3c9}.pv-cfg{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.pv-dirty{background:#fff3d5;padding:10px;border-left:4px solid #b28629;font-weight:600}.cv-table td input{width:110px;padding:6px}';
 document.head.append(css);
 let draft=null,draftOf=null,dirty=false;

 function render(host,ctx,u){
  const {esc,num,table,save}=u,d=ctx.data,owner=ctx.owner;
  if(!P){host.insertAdjacentHTML('beforeend','<p class="cv-error">Motor da prévia não carregou. Recarregue a página.</p>');return}
  const pub=ctx.meta?.publicacao||'';
  if(draftOf!==pub||!draft){draft=structuredClone(d._gestao?.previa||{});draftOf=pub;dirty=false}
  draft.programacao??=[];draft.agrupados??=P.AGRUPADOS_PADRAO.slice();draft.prioridadePintura??=[];draft.foraCarteira??={};draft.prioridadeFila??={};draft.faturarEmFila??={};
  const hoje=dayNow();
  const manual={...draft,inicio:draft.inicio&&draft.inicio>hoje?draft.inicio:hoje,programacao:draft.programacao.filter(x=>x.dia>=(draft.inicio&&draft.inicio>hoje?draft.inicio:hoje))};
  const passadas=draft.programacao.length-manual.programacao.length;
  let input,r;
  try{input=P.daPublicacao(d,manual);r=P.calcular(input)}catch(e){host.insertAdjacentHTML('beforeend','<p class="cv-error">Não foi possível calcular a prévia: '+esc(e.message)+'</p>');return}
  const semAcab=input.carteira.length&&!(d.programacao?.itens?.length)&&!(d.resumo_diario?.carteira_atual?.itens||[]).some(x=>x.pintura!==undefined||x.cor||x.beneficiamento);
  const add=s=>host.insertAdjacentHTML('beforeend',s);
  const cap=r.parametros.cap,ult=r.ultimoDiaFaturamento,res=r.resumo;
  add('<h2>PRÉVIA DE FATURAMENTO</h2><p class="cv-note">Mesmas regras da planilha de prévia: natural fatura no dia útil seguinte à produção; pintado entra na fila da pintura ('+num(cap.Pintura)+' kg/dia, fila atual primeiro) e fatura no dia seguinte ao fim da pintura; pedido normal só fatura com 100% programado, na data da última produção; clientes agrupados faturam tudo junto; data manual vence. Capacidade das prensas com 90%: P7 '+num(Math.round(cap.P7))+' kg/dia · P4 '+num(Math.round(cap.P4))+' kg/dia. Calendário com pelo menos 15 dias úteis, sem fim de semana, feriado e recesso. Filas atuais vêm da Visão Geral publicada.'+(passadas?' '+passadas+' linha(s) de dias anteriores a hoje não entram (já estão nas filas).':'')+'</p>'+(semAcab?'<p class="cv-error">A carteira publicada não informa natural/pintado: tudo está sendo tratado como natural.</p>':'')+(dirty?'<p class="pv-dirty">Há alterações não publicadas nesta tela. '+(owner?'Use SALVAR E PUBLICAR para gravar.':'Somente o acesso do Edvaldo grava.')+'</p>':''));
  add('<div class="cv-cards">'+[['Faturamento previsto até '+br(ult),num(Math.round(res.previstoKg))+' kg'],['Pedidos (programação)',res.pedidos],['Clientes (programação)',res.clientes],['Maior dia',res.maiorDia?num(Math.round(res.maiorDia.faturamento))+' kg · '+wd(res.maiorDia.data):'—'],['Aguardando fechar 100%',num(Math.round(res.aguardando100Kg))+' kg'],['Fatura após '+br(ult),num(Math.round(res.depoisDoPeriodoKg))+' kg'],['Já produzido (filas) no período',num(Math.round(res.jaProduzidoKg))+' kg']].map(([l,v])=>'<div class="cv-card">'+esc(l)+'<b>'+esc(v)+'</b></div>').join('')+'</div>');
  const sit=s=>'<span class="pv-sit pv-'+s.split(' ').pop()+'">'+esc(s)+'</span>';
  add('<h3>FATURAMENTO POR DIA</h3>'+table(['Dia','Situação','P7 kg','P4 kg','Pintura kg (fila + novo)','Faturamento kg','Acumulado kg'],r.dias.map(x=>[esc(wd(x.data))+(ult&&x.data>ult?' <small>(após '+esc(br(ult))+')</small>':''),sit(x.situacao),num(Math.round(x.p7))+' · '+pct(x.ocupacao.P7),num(Math.round(x.p4))+' · '+pct(x.ocupacao.P4),num(Math.round(x.pinturaFila))+' + '+num(Math.round(x.pinturaNovo))+' · '+pct(x.ocupacao.Pintura),'<b>'+num(Math.round(x.faturamento))+'</b>',num(Math.round(x.acumulado))])));
  add('<h3>O QUE FATURA EM CADA DIA</h3><div class="pv-days">'+r.dias.filter(x=>x.faturamentoItens.length).map(x=>'<div class="pv-day"><h4>'+esc(wd(x.data))+' · '+num(Math.round(x.faturamento))+' kg</h4><ul>'+x.faturamentoItens.map(i=>'<li>'+esc((i.pedido?i.pedido+' · ':'')+i.cliente)+' · '+num(Math.round(i.kg))+' kg <small>('+esc(i.origem==='PROGRAMAÇÃO'?'programação':i.origem.toLowerCase())+')</small></li>').join('')+'</ul></div>').join('')+'</div>');
  // programação
  const dias=r.dias.map(x=>x.data);
  const carteira=new Map();input.carteira.forEach(c=>{const p=String(c.pedido);if(!carteira.has(p))carteira.set(p,c.cliente)});
  add('<h3>PROGRAMAÇÃO P7 / P4</h3><form class="cv-form" id="pv-add"><div class="cv-tools"><label>Dia<select name="dia">'+dias.slice(0,Math.max(15,dias.length)).map(x=>'<option value="'+x+'">'+esc(wd(x))+'</option>').join('')+'</select></label><label>Pedido<input name="pedido" required pattern="[0-9]+" list="pv-ped"></label><datalist id="pv-ped">'+[...carteira].map(([p,c])=>'<option value="'+esc(p)+'">'+esc(c)+'</option>').join('')+'</datalist><label>P7 kg<input name="p7" type="number" min="0" step="1"></label><label>P4 kg<input name="p4" type="number" min="0" step="1"></label><label>Faturar em (manual)<input name="faturarEm" type="date"></label><button>INCLUIR NA PRÉVIA</button></div></form>');
  const linhas=r.linhas;
  add(table(['Dia','Pedido','Cliente','Entrega','Carteira P7/P4','P7 kg','P4 kg','Acabamento','Pinta até','Fatura em','Status / alertas',''],linhas.map(l=>[esc(wd(l.data)),esc(l.pedido),esc(l.cliente),esc(br(l.entrega)),num(Math.round(l.carteiraP7))+' / '+num(Math.round(l.carteiraP4)),num(l.p7),num(l.p4),esc(l.acabamento),esc(br(l.pintaAte)),esc(l.faturaEm?br(l.faturaEm):l.regra)+(l.faturarEm?' <small>(manual)</small>':''),l.alertas.length?'<span class="pv-alert">'+l.alertas.map(esc).join('<br>')+'</span>':'OK','<button type="button" data-pv-del="'+l.ordem+'">REMOVER</button>'])));
  // filas
  add('<h3>FILAS ATUAIS (JÁ PRODUZIDO)</h3>'+table(['Fila','Cliente','kg','Prioridade pintura','Pinta até','Faturar em (manual)','Fatura em','Regra'],r.filas.map(f=>{const k=f.fila+'|'+f.cliente;return [esc(f.fila),esc(f.cliente),num(Math.round(f.kg)),f.fila==='PINTURA'?'<input type="number" min="1" step="1" data-pv-prio="'+esc(f.cliente)+'" value="'+esc(draft.prioridadeFila[f.cliente]??'')+'" placeholder="99">':'',esc(br(f.pintaAte)),'<input type="date" data-pv-fat="'+esc(k)+'" value="'+esc(draft.faturarEmFila[k]||'')+'">',esc(f.faturaEm?wd(f.faturaEm):f.regra),esc(f.regra)]})));
  // pendentes e sugestões
  add('<h3>PEDIDOS PENDENTES (entrega até '+esc(br(ult))+' com saldo não programado)</h3>'+table(['Pedido','Cliente','Entrega','Situação','Saldo kg','P7','P4','Natural','Pintado','Programado','Falta'],r.pendentes.map(x=>[esc(x.pedido),esc(x.cliente),esc(br(x.entrega)),x.atrasado?'<span class="pv-alert">ATRASADO</span>':'NO PRAZO',num(Math.round(x.saldo)),num(Math.round(x.P7)),num(Math.round(x.P4)),num(Math.round(x.natural)),num(Math.round(x.pintado)),num(Math.round(x.programado)),'<b>'+num(Math.round(x.falta))+'</b>'])));
  for(const pr of ['P7','P4']){const s=r.sugestoes[pr],falta=s.reduce((a,x)=>a+x.falta,0);add('<details><summary><b>SUGESTÕES '+pr+'</b> · '+s.length+' pedidos · falta programar '+num(Math.round(falta))+' kg = '+(cap[pr]?(falta/cap[pr]).toLocaleString('pt-BR',{maximumFractionDigits:1}):'—')+' dias de prensa</summary>'+table(['Pedido','Cliente','Entrega','Acabamento','Saldo '+pr,'Programado','Falta'],s.slice(0,150).map(x=>[esc(x.pedido),esc(x.cliente),esc(br(x.entrega))+(x.entrega&&x.entrega<dias[0]?' <span class="pv-alert">atrasado</span>':''),esc(x.acabamento),num(Math.round(x.saldo)),num(Math.round(x.programado)),'<b>'+num(Math.round(x.falta))+'</b>'])))+'</details>'}
  // configurações
  add('<h3>REGRAS EDITÁVEIS</h3><form class="cv-form" id="pv-cfg"><div class="pv-cfg"><label>Clientes com faturamento agrupado (um por linha; basta parte do nome)<textarea name="agrupados">'+esc(draft.agrupados.join('\n'))+'</textarea></label><label>Prioridade na pintura (pedido ou parte do nome do cliente, um por linha)<textarea name="prioridade">'+esc(draft.prioridadePintura.join('\n'))+'</textarea></label><label>Pedidos fora da carteira (pedido;cliente, um por linha)<textarea name="fora">'+esc(Object.entries(draft.foraCarteira).map(([k,v])=>k+';'+v).join('\n'))+'</textarea></label><div><label>Último dia de faturamento do mês<input name="ultimo" type="date" value="'+esc(draft.ultimoDiaFaturamento||ult||'')+'"></label><p><button type="submit">APLICAR REGRAS</button></p></div></div></form>');
  add('<div class="cv-tools">'+(owner?'<label>Motivo<input id="pv-obs" placeholder="Ex.: programação de 26/11"></label><button id="pv-save">SALVAR E PUBLICAR PRÉVIA</button>':'')+'<button id="pv-reset" type="button">DESCARTAR ALTERAÇÕES</button></div>');
  const again=()=>{dirty=true;host.innerHTML='<p id="cv-status" role="status"></p>';render(host,ctx,u)};
  host.querySelector('#pv-add').onsubmit=e=>{e.preventDefault();const f=e.target.elements,p7=Number(f.p7.value||0),p4=Number(f.p4.value||0);
   if(p7<0||p4<0||p7+p4<=0){u.show('Informe o kg em P7 e/ou P4.');return}
   draft.programacao.push({dia:f.dia.value,pedido:f.pedido.value.trim(),p7,p4,...(f.faturarEm.value?{faturarEm:f.faturarEm.value}:{})});again()};
  host.querySelectorAll('[data-pv-del]').forEach(b=>b.onclick=()=>{const l=manual.programacao[Number(b.dataset.pvDel)];draft.programacao.splice(draft.programacao.indexOf(l),1);again()});
  host.querySelectorAll('[data-pv-prio]').forEach(i=>i.onchange=()=>{const v=Number(i.value);if(v>0)draft.prioridadeFila[i.dataset.pvPrio]=v;else delete draft.prioridadeFila[i.dataset.pvPrio];again()});
  host.querySelectorAll('[data-pv-fat]').forEach(i=>i.onchange=()=>{if(i.value)draft.faturarEmFila[i.dataset.pvFat]=i.value;else delete draft.faturarEmFila[i.dataset.pvFat];again()});
  host.querySelector('#pv-cfg').onsubmit=e=>{e.preventDefault();const f=e.target.elements,lines=s=>s.split('\n').map(x=>x.trim()).filter(Boolean);
   draft.agrupados=lines(f.agrupados.value);draft.prioridadePintura=lines(f.prioridade.value);
   const fora={};for(const l of lines(f.fora.value)){const [p,...c]=l.split(';');if(/^\d+$/.test(p.trim())&&c.join(';').trim())fora[p.trim()]=c.join(';').trim()}draft.foraCarteira=fora;
   if(f.ultimo.value)draft.ultimoDiaFaturamento=f.ultimo.value;again()};
  host.querySelector('#pv-reset').onclick=()=>{draft=null;dirty=false;host.innerHTML='<p id="cv-status" role="status"></p>';render(host,ctx,u)};
  if(owner)host.querySelector('#pv-save').onclick=()=>{const obs=host.querySelector('#pv-obs').value.trim();if(!obs){u.show('Informe o motivo.');return}
   const body={action:'previa',previa:structuredClone(draft),obs};draftOf=null;save(body)};
 }
 /* Validação da gravação (usada por centralViews.action). */
 function validar(p){
  if(!p||typeof p!=='object')throw Error('Prévia inválida.');
  const okDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'));
  if(!Array.isArray(p.programacao)||p.programacao.length>2000)throw Error('Programação inválida.');
  const prog=p.programacao.map(x=>{
   const p7=Number(x.p7||0),p4=Number(x.p4||0);
   if(!okDate(x.dia)||!/^\d+$/.test(String(x.pedido))||!(p7>=0)||!(p4>=0)||p7+p4<=0||(x.faturarEm&&!okDate(x.faturarEm)))throw Error('Linha da programação inválida (pedido '+x.pedido+').');
   const w=new Date(x.dia+'T12:00:00Z').getUTCDay();if(w===0||w===6)throw Error('Programação em fim de semana (pedido '+x.pedido+').');
   return {dia:x.dia,pedido:String(x.pedido),p7,p4,...(x.faturarEm?{faturarEm:x.faturarEm}:{})}});
  const list=a=>(Array.isArray(a)?a:[]).map(x=>String(x).trim()).filter(Boolean).slice(0,100);
  const fora={};for(const [k,v]of Object.entries(p.foraCarteira||{}))if(/^\d+$/.test(k)&&String(v).trim())fora[k]=String(v).trim();
  const prio={};for(const [k,v]of Object.entries(p.prioridadeFila||{}))if(Number.isInteger(Number(v))&&Number(v)>0)prio[k]=Number(v);
  const fat={};for(const [k,v]of Object.entries(p.faturarEmFila||{}))if(okDate(v))fat[k]=v;
  if(p.ultimoDiaFaturamento&&!okDate(p.ultimoDiaFaturamento))throw Error('Último dia de faturamento inválido.');
  return {programacao:prog,agrupados:list(p.agrupados),prioridadePintura:list(p.prioridadePintura),foraCarteira:fora,prioridadeFila:prio,faturarEmFila:fat,...(p.ultimoDiaFaturamento?{ultimoDiaFaturamento:p.ultimoDiaFaturamento}:{})};
 }
 window.previaView={render,validar};
})();
