/* Tela PRÉVIA DE FATURAMENTO da Central (substitui a planilha de prévia).
   Edição fica num rascunho no navegador e recalcula na hora; SALVAR E PUBLICAR grava tudo de uma vez
   em _gestao.previa (somente o acesso do Edvaldo). Visual no padrão da Carga vs Capacidade (.cvx). */
(()=>{
 'use strict';
 const P=window.previaFaturamento;
 const dayNow=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 const br=d=>d?d.slice(8,10)+'/'+d.slice(5,7):'';
 const wd=d=>d?['dom','seg','ter','qua','qui','sex','sáb'][new Date(d+'T12:00:00Z').getUTCDay()]+' '+br(d):'';
 const css=document.createElement('style');
 css.textContent=`.pvx{--ink:#1B2430;--sub:#4A5565;--line:#D5DBE3;--bg:#F4F6F9;--navy:#1F3864;--ok:#1E7B34;--okbg:#E7F4EA;--bad:#B42318;--badbg:#FDECEA;--warn:#9A5B00;--warnbg:#FFF4E0;--p7:#1F3864;--p4:#2E6B5E;--pt:#8A4B08;--ft:#16786b;
 color:var(--ink);font-family:"Segoe UI",Calibri,Arial,sans-serif;font-size:12px;line-height:1.3;display:flex;flex-direction:column;gap:10px;max-width:1280px}
.pvx *{box-sizing:border-box}
.pvx .hd{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:4px 13px;border-bottom:2px solid var(--navy);padding-bottom:5px}
.pvx .hd h2{margin:0;font-size:19px;color:var(--navy)}.pvx .hd p{margin:2px 0 0;color:var(--sub);font-size:11px}
.pvx .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.pvx .kpi{background:#fff;border:1px solid var(--line);border-top:4px solid var(--c,var(--navy));border-radius:4px;padding:7px 9px}
.pvx .kpi span{display:block;font-size:10px;color:var(--sub);text-transform:uppercase;letter-spacing:.2px}
.pvx .kpi b{display:block;font-size:22px;font-variant-numeric:tabular-nums;line-height:1.15}.pvx .kpi small{font-size:11px;color:var(--sub)}
.pvx .band{background:var(--navy);color:#fff;font-weight:700;font-size:12px;padding:5px 8px;border-radius:2px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.pvx .band span{font-weight:400;color:#C9D4E8;font-size:11px}
.pvx .wrap{overflow-x:auto;border:1px solid var(--line);border-radius:4px;background:#fff}
.pvx table{border-collapse:collapse;width:100%;font-size:12px}
.pvx th{background:var(--bg);color:var(--sub);font-size:10px;font-weight:600;text-align:left;padding:5px 7px;border-bottom:1px solid var(--line);white-space:nowrap}
.pvx td{padding:4px 7px;border-bottom:1px solid #E8ECF1;vertical-align:middle;font-variant-numeric:tabular-nums}
.pvx td.n,.pvx th.n{text-align:right}
.pvx tr.dia{cursor:pointer}.pvx tr.dia:hover td{background:#F7F9FC}.pvx tr.depois td{color:#8A94A3}
.pvx tr.det td{background:#FAFBFD;padding:6px 10px 8px 28px;font-size:11px;color:var(--sub)}
.pvx .m{display:flex;align-items:center;gap:6px;min-width:120px}.pvx .m .bar{flex:1;height:7px;background:#E6EAF0;border-radius:4px;overflow:hidden}.pvx .m .bar i{display:block;height:100%;background:var(--c)}.pvx .m .bar.over i{background:var(--bad)}.pvx .m em{font-style:normal;font-size:11px;width:34px;text-align:right}.pvx .m em.over{color:var(--bad);font-weight:700}
.pvx .pill{display:inline-block;font-weight:700;font-size:10px;padding:2px 6px;border-radius:3px;white-space:nowrap}
.pvx .pill.ESTOUROU{background:var(--badbg);color:var(--bad)}.pvx .pill.QUASE{background:var(--warnbg);color:var(--warn)}.pvx .pill.FECHADO{background:var(--okbg);color:var(--ok)}.pvx .pill.ABERTO{background:#E8EDF6;color:var(--navy)}
.pvx .ft{font-weight:700}.pvx .chips{display:flex;flex-wrap:wrap;gap:4px 10px}.pvx .chips span{white-space:nowrap}.pvx .chips b{color:var(--ink)}
.pvx .note{font-size:10px;color:var(--sub);background:var(--bg);border-radius:4px;padding:5px 8px}
.pvx .warn{font-size:12px;font-weight:600;color:var(--bad);background:var(--badbg);border-left:4px solid var(--bad);padding:6px 10px;border-radius:4px}
.pvx .dirty{font-size:12px;font-weight:600;color:var(--warn);background:var(--warnbg);border-left:4px solid #B28629;padding:6px 10px;border-radius:4px}
.pvx details{background:#fff;border:1px solid var(--line);border-radius:4px}.pvx details>summary{cursor:pointer;padding:7px 10px;font-weight:700;color:var(--navy);font-size:12px}.pvx details>summary span{font-weight:400;color:var(--sub);font-size:11px;margin-left:6px}.pvx details[open]>summary{border-bottom:1px solid var(--line)}
.pvx details .in{padding:8px 10px;display:flex;flex-direction:column;gap:8px}.pvx details .wrap{border:0}
.pvx form.row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:end}.pvx label{font-size:10px;color:var(--sub);display:flex;flex-direction:column;gap:2px}
.pvx input,.pvx select,.pvx textarea{font:inherit;font-size:12px;padding:4px 6px;border:1px solid #B8C4D3;border-radius:3px;margin:0}.pvx input[type=number]{width:90px}.pvx td input{width:96px}
.pvx button{font:inherit;font-size:11px;font-weight:700;padding:5px 10px;border-radius:3px;border:1px solid var(--navy);background:var(--navy);color:#fff;cursor:pointer}.pvx button.lnk{background:#fff;color:var(--bad);border-color:#E3B4AF;padding:2px 7px}.pvx button.sec{background:#fff;color:var(--navy)}
.pvx .al{color:var(--bad);font-size:11px}.pvx .ok{color:var(--ok);font-size:11px}
.pvx .cfg{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.pvx .cfg textarea{min-height:90px;width:100%}
.pvx .save{display:flex;flex-wrap:wrap;gap:8px;align-items:end;justify-content:flex-end}`;
 document.head.append(css);
 let draft=null,draftOf=null,dirty=false;

 function render(host,ctx,u){
  const {esc,num,save}=u,d=ctx.data,owner=ctx.owner;
  if(!P){host.insertAdjacentHTML('beforeend','<p class="cv-error">Motor da prévia não carregou. Recarregue a página.</p>');return}
  const pub=ctx.meta?.publicacao||'';
  if(draftOf!==pub||!draft){draft=structuredClone(d._gestao?.previa||{});draftOf=pub;dirty=false}
  draft.programacao??=[];draft.agrupados??=P.AGRUPADOS_PADRAO.slice();draft.prioridadePintura??=[];draft.foraCarteira??={};draft.prioridadeFila??={};draft.faturarEmFila??={};
  const hoje=dayNow(),ini=draft.inicio&&draft.inicio>hoje?draft.inicio:hoje;
  const manual={...draft,inicio:ini,programacao:draft.programacao.filter(x=>x.dia>=ini)};
  const passadas=draft.programacao.length-manual.programacao.length;
  let input,r;
  try{input=P.daPublicacao(d,manual);r=P.calcular(input)}catch(e){host.insertAdjacentHTML('beforeend','<p class="cv-error">Não foi possível calcular a prévia: '+esc(e.message)+'</p>');return}
  const semAcab=input.carteira.length&&!(d.programacao?.itens?.length)&&!(d.resumo_diario?.carteira_atual?.itens||[]).some(x=>x.pintura!==undefined||x.cor||x.beneficiamento);
  const cap=r.parametros.cap,ult=r.ultimoDiaFaturamento,res=r.resumo;
  const t=kg=>(Math.round((kg||0)/100)/10).toLocaleString('pt-BR',{minimumFractionDigits:1})+' t',kg=x=>num(Math.round(x||0));
  const meter=(o,c)=>{const p=Math.round(100*o),w=Math.min(100,p);return '<div class="m" style="--c:'+c+'"><div class="bar'+(p>100?' over':'')+'"><i style="width:'+w+'%"></i></div><em'+(p>100?' class="over"':'')+'>'+p+'%</em></div>'};
  const sitTxt={ESTOUROU:'ESTOUROU','QUASE CHEIO':'QUASE CHEIO','DIA FECHADO':'FECHADO',ABERTO:'ABERTO'};
  const ultimoUtil=Math.max(15,...r.dias.map((x,i)=>x.faturamento>0||x.p7||x.p4||x.pintura?i+1:0));
  const dias=r.dias.slice(0,ultimoUtil);
  let h='<div class="pvx">';
  h+='<div class="hd"><div><h2>PRÉVIA DE FATURAMENTO</h2><p>Filas atuais da Visão Geral + programação P7/P4 · capacidade P7 '+t(cap.P7)+'/dia · P4 '+t(cap.P4)+'/dia (bruta × 85%) · pintura '+t(cap.Pintura)+'/dia</p></div><p>Período até <b>'+esc(br(ult))+'</b></p></div>';
  if(semAcab)h+='<div class="warn">A carteira publicada não informa natural/pintado: tudo está sendo tratado como natural.</div>';
  if(dirty)h+='<div class="dirty">Alterações ainda não publicadas. '+(owner?'Use SALVAR E PUBLICAR no fim da página.':'Somente o acesso do Edvaldo grava.')+'</div>';
  h+='<div class="kpis">'+[['Faturamento previsto','<b>'+t(res.previstoKg)+'</b><small>até '+esc(br(ult))+'</small>','var(--ft)'],['Maior dia',res.maiorDia?'<b>'+t(res.maiorDia.faturamento)+'</b><small>'+esc(wd(res.maiorDia.data))+'</small>':'<b>—</b>','var(--navy)'],['Pedidos · clientes','<b>'+res.pedidos+' · '+res.clientes+'</b><small>da programação</small>','var(--navy)'],['Aguardando 100%','<b>'+t(res.aguardando100Kg)+'</b><small>produzido sem fechar pedido</small>','var(--warn)'],['Fatura depois','<b>'+t(res.depoisDoPeriodoKg)+'</b><small>após '+esc(br(ult))+'</small>','#8A94A3']].map(([l,v,c])=>'<div class="kpi" style="--c:'+c+'"><span>'+l+'</span>'+v+'</div>').join('')+'</div>';
  h+='<div class="band">FATURAMENTO POR DIA<span>clique no dia para ver os pedidos</span></div><div class="wrap"><table><thead><tr><th>Dia</th><th>Situação</th><th>P7</th><th>P4</th><th>Pintura</th><th class="n">Fatura</th><th class="n">Acumulado</th></tr></thead><tbody>';
  dias.forEach((x,i)=>{const dep=ult&&x.data>ult;
   h+='<tr class="dia'+(dep?' depois':'')+'" data-pv-dia="'+i+'"><td><b>'+esc(wd(x.data))+'</b></td><td><span class="pill '+x.situacao.split(' ').pop()+'">'+esc(sitTxt[x.situacao]||x.situacao)+'</span></td><td>'+meter(x.ocupacao.P7,'var(--p7)')+'</td><td>'+meter(x.ocupacao.P4,'var(--p4)')+'</td><td>'+meter(x.ocupacao.Pintura,'var(--pt)')+'</td><td class="n ft">'+(x.faturamento?t(x.faturamento):'—')+'</td><td class="n">'+t(x.acumulado)+'</td></tr>';
   h+='<tr class="det" data-pv-det="'+i+'" hidden><td colspan="7"><div>Produz P7 '+kg(x.p7)+' kg · P4 '+kg(x.p4)+' kg · pinta '+kg(x.pinturaFila)+' kg da fila + '+kg(x.pinturaNovo)+' kg novos</div>'+(x.faturamentoItens.length?'<div class="chips" style="margin-top:4px">'+x.faturamentoItens.map(i=>'<span>'+esc((i.pedido?i.pedido+' ':'')+i.cliente)+' <b>'+kg(i.kg)+'</b>'+(i.origem!=='PROGRAMAÇÃO'?' <small>('+esc(i.origem.toLowerCase())+')</small>':'')+'</span>').join('')+'</div>':'<div>Nada fatura neste dia.</div>')+'</td></tr>';
  });
  h+='</tbody></table></div>';
  // programação
  const carteira=new Map();input.carteira.forEach(c=>{const p=String(c.pedido);if(!carteira.has(p))carteira.set(p,c.cliente)});
  const comAlerta=r.linhas.filter(l=>l.alertas.length).length;
  h+='<details open><summary>PROGRAMAÇÃO P7 / P4<span>'+r.linhas.length+' linhas'+(comAlerta?' · '+comAlerta+' com alerta':'')+(passadas?' · '+passadas+' de dias passados fora da conta (já estão nas filas)':'')+'</span></summary><div class="in">';
  h+='<form class="row" id="pv-add"><label>Dia<select name="dia">'+dias.map(x=>'<option value="'+x.data+'">'+esc(wd(x.data))+'</option>').join('')+'</select></label><label>Pedido<input name="pedido" required pattern="[0-9]+" list="pv-ped" style="width:90px"></label><datalist id="pv-ped">'+[...carteira].map(([p,c])=>'<option value="'+esc(p)+'">'+esc(c)+'</option>').join('')+'</datalist><label>P7 kg<input name="p7" type="number" min="0" step="1"></label><label>P4 kg<input name="p4" type="number" min="0" step="1"></label><label>Faturar em (manual)<input name="faturarEm" type="date"></label><button>INCLUIR</button></form>';
  h+='<div class="wrap"><table><thead><tr><th>Dia</th><th>Pedido</th><th>Cliente</th><th class="n">P7</th><th class="n">P4</th><th>Acab.</th><th>Fatura</th><th>Alertas</th><th></th></tr></thead><tbody>'+r.linhas.map(l=>'<tr><td>'+esc(wd(l.data))+'</td><td>'+esc(l.pedido)+'</td><td>'+esc(l.cliente)+'</td><td class="n">'+(l.p7?kg(l.p7):'')+'</td><td class="n">'+(l.p4?kg(l.p4):'')+'</td><td>'+esc(l.acabamento.slice(0,3))+(l.pintaAte?' <small>pinta '+esc(br(l.pintaAte))+'</small>':'')+'</td><td><b>'+esc(l.faturaEm?br(l.faturaEm):l.regra)+'</b>'+(l.faturarEm?' <small>manual</small>':'')+'</td><td>'+(l.alertas.length?'<span class="al">'+l.alertas.map(esc).join(' · ')+'</span>':'<span class="ok">OK</span>')+'</td><td><button type="button" class="lnk" data-pv-del="'+l.ordem+'">remover</button></td></tr>').join('')+'</tbody></table></div></div></details>';
  // filas
  const totFila=r.filas.reduce((s,f)=>s+f.kg,0);
  h+='<details><summary>FILAS ATUAIS (já produzido)<span>'+r.filas.length+' linhas · '+t(totFila)+' · vêm da Visão Geral</span></summary><div class="in"><div class="wrap"><table><thead><tr><th>Fila</th><th>Cliente</th><th class="n">kg</th><th>Prioridade pintura</th><th>Faturar em (manual)</th><th>Fatura</th></tr></thead><tbody>'+r.filas.map(f=>{const k=f.fila+'|'+f.cliente;return '<tr><td>'+esc(f.fila.toLowerCase())+'</td><td>'+esc(f.cliente)+'</td><td class="n">'+kg(f.kg)+'</td><td>'+(f.fila==='PINTURA'?'<input type="number" min="1" step="1" data-pv-prio="'+esc(f.cliente)+'" value="'+esc(draft.prioridadeFila[f.cliente]??'')+'" placeholder="99">':'')+'</td><td><input type="date" data-pv-fat="'+esc(k)+'" value="'+esc(draft.faturarEmFila[k]||'')+'"></td><td><b>'+esc(f.faturaEm?wd(f.faturaEm):f.regra)+'</b></td></tr>'}).join('')+'</tbody></table></div></div></details>';
  // pendentes
  h+='<details><summary>PEDIDOS PENDENTES<span>'+r.pendentes.length+' pedidos com entrega até '+esc(br(ult))+' ainda sem programar · '+t(r.pendentes.reduce((s,x)=>s+x.falta,0))+'</span></summary><div class="in"><div class="wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th class="n">P7</th><th class="n">P4</th><th class="n">Pintado</th><th class="n">Falta programar</th></tr></thead><tbody>'+r.pendentes.map(x=>'<tr><td>'+esc(x.pedido)+'</td><td>'+esc(x.cliente)+'</td><td>'+esc(br(x.entrega))+(x.atrasado?' <span class="al">atrasado</span>':'')+'</td><td class="n">'+kg(x.P7)+'</td><td class="n">'+kg(x.P4)+'</td><td class="n">'+kg(x.pintado)+'</td><td class="n"><b>'+kg(x.falta)+'</b></td></tr>').join('')+'</tbody></table></div></div></details>';
  for(const pr of ['P7','P4']){const s=r.sugestoes[pr],falta=s.reduce((a,x)=>a+x.falta,0);
   h+='<details><summary>SUGESTÕES '+pr+'<span>'+s.length+' pedidos · falta '+t(falta)+' = '+(cap[pr]?(falta/cap[pr]).toLocaleString('pt-BR',{maximumFractionDigits:1}):'—')+' dias de prensa · entrega mais antiga primeiro</span></summary><div class="in"><div class="wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Acab.</th><th class="n">Saldo</th><th class="n">Programado</th><th class="n">Falta</th></tr></thead><tbody>'+s.slice(0,150).map(x=>'<tr><td>'+esc(x.pedido)+'</td><td>'+esc(x.cliente)+'</td><td>'+esc(br(x.entrega))+(x.entrega&&x.entrega<dias[0].data?' <span class="al">atrasado</span>':'')+'</td><td>'+esc(x.acabamento.slice(0,3))+'</td><td class="n">'+kg(x.saldo)+'</td><td class="n">'+kg(x.programado)+'</td><td class="n"><b>'+kg(x.falta)+'</b></td></tr>').join('')+'</tbody></table></div></div></details>'}
  h+='<details><summary>REGRAS EDITÁVEIS<span>clientes agrupados, prioridade na pintura, pedidos fora da carteira, último dia</span></summary><div class="in"><form id="pv-cfg"><div class="cfg"><label>Clientes com faturamento agrupado (um por linha)<textarea name="agrupados">'+esc(draft.agrupados.join('\n'))+'</textarea></label><label>Prioridade na pintura (pedido ou cliente)<textarea name="prioridade">'+esc(draft.prioridadePintura.join('\n'))+'</textarea></label><label>Pedidos fora da carteira (pedido;cliente)<textarea name="fora">'+esc(Object.entries(draft.foraCarteira).map(([k,v])=>k+';'+v).join('\n'))+'</textarea></label><label>Último dia de faturamento<input name="ultimo" type="date" value="'+esc(draft.ultimoDiaFaturamento||ult||'')+'"><button type="submit" style="margin-top:8px">APLICAR</button></label></div></form>';
  h+='<div class="note">Regras: natural fatura no dia útil seguinte à produção · pintado fatura no dia seguinte ao fim da pintura (fila atual primeiro) · pedido normal só fatura com 100% programado, na última produção · clientes agrupados faturam tudo junto · data manual vence · fora da carteira = natural · calendário sem fim de semana, feriado e recesso.</div></div></details>';
  h+='<div class="save">'+(owner?'<label>Motivo<input id="pv-obs" placeholder="Ex.: programação de 26/11" style="width:240px"></label><button id="pv-save">SALVAR E PUBLICAR PRÉVIA</button>':'')+'<button id="pv-reset" type="button" class="sec">DESCARTAR ALTERAÇÕES</button></div></div>';
  host.insertAdjacentHTML('beforeend',h);
  host.querySelectorAll('[data-pv-dia]').forEach(tr=>tr.onclick=()=>{const det=host.querySelector('[data-pv-det="'+tr.dataset.pvDia+'"]');det.hidden=!det.hidden});
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
