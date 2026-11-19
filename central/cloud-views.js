/* Authenticated management over immutable published snapshots. */
(()=>{
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>Number(x||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
 const table=(heads,rows)=>'<div class="cv-table"><table><thead><tr>'+heads.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 const css=document.createElement('style');css.textContent='.cv-table{overflow:auto;background:white;border:1px solid #ccd8e5;border-radius:6px;margin:16px 0}.cv-table table{width:100%;border-collapse:collapse;font-size:13px}.cv-table th,.cv-table td{padding:11px;border-bottom:1px solid #dce4ed;text-align:left;vertical-align:top}.cv-table th{background:#e7eef7}.cv-cards{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}.cv-card{padding:18px;background:white;border-left:5px solid #16786b;min-width:180px}.cv-card b{display:block;font-size:25px}.cv-tools{display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin:16px 0}.cv-tools label{display:block;margin:0}.cv-tools input,.cv-tools select{width:auto;max-width:100%;margin:6px 0;padding:10px;border:1px solid #9fb3c9}.cv-note{padding:15px;background:#fff3d5;line-height:1.6;border-left:4px solid #b28629}.cv-form{background:white;padding:18px;border:1px solid #ccd8e5;border-radius:6px}.cv-form input,.cv-form select{max-width:250px}.cv-error{color:#9b211c;font-weight:600}.cv-ok{color:#12634b;font-weight:600}';document.head.append(css);
 const dayNow=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 function billing(data,day){
  const m=data.materiais||{},ind=m.indicador||{};
  let rows=ind.data===day?structuredClone(ind.pedidos||[]):[];
  if(data.previsao_edicao?.dia===day)rows=structuredClone(data.previsao_edicao.pedidos||rows);
  const map=new Map(rows.map(x=>[String(x.pedido),x]));
  for(const [id,e]of Object.entries(data._gestao?.faturamento?.[day]||{}))if(e.incluir)map.set(id,{...map.get(id),...e,pedido:id});else map.delete(id);
  const ignored=new Set((m.excluir_nf||[]).map(String));
  const notas=(m.linhas||[]).filter(x=>String(x.data||'').slice(0,10)===day&&!ignored.has(String(x.nota))&&Number(x.kg)>0);
  return {pedidos:[...map.values()].map(x=>{const real=notas.filter(n=>String(n.pedido||'').trim()===String(x.pedido)).reduce((s,n)=>s+Number(n.kg||0),0);return {...x,faturado_kg:real,saldo_kg:Math.max(0,Number(x.kg)-real)}}),notas,fonte:m.exportado_em};
 }
 function slots(data,edits){
  const items=new Map((data.resumo_diario?.carteira_atual?.itens||[]).map(x=>[x.chave,x]));const r=data.resumo_diario?.reuniao;
  const days=new Map(),sums=new Map();
  for(const [key,e]of Object.entries(edits)){
   const item=items.get(e.chave||key),kg=Number(e.kg);if(!item)throw Error('Item fora da carteira.');
   if(!['P4','P7'].includes(e.prensa)||!Number.isFinite(kg)||kg<0||kg>Number(item.kg)+.0001)throw Error('Prensa ou quantidade inválida.');
   if(!e.data||e.segurar||!kg)continue;
   const d=new Date(e.data+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(e.data)||Number.isNaN(+d)||d.toISOString().slice(0,10)!==e.data)throw Error('Data inválida.');
   if(e.data<'2026-11-18'||[0,6].includes(d.getUTCDay())||new Set([...(r?.feriados||[]),'2026-11-20','2026-12-25','2027-01-01']).has(e.data)||(e.data>='2026-12-16'&&e.data<='2026-12-31'))throw Error('Data encerrada, feriado, fim de semana ou recesso.');
   if(item.planejar_janeiro&&e.data<'2027-01-01')throw Error('Este item está reservado para janeiro.');
   const total=(sums.get(item.chave)||0)+kg;sums.set(item.chave,total);if(total>Number(item.kg)+.0001)throw Error('Soma dos dias ultrapassa o saldo do item.');
   const id=e.data+'|'+e.prensa,cap=Number(r?.prensas?.[e.prensa]?.kgh)*Number(r?.aproveitamento)*Number(r?.turnos_dia)*Number(r?.horas_turno);if(!Number.isFinite(cap)||cap<=0)throw Error('Capacidade indisponível.');
   const row=days.get(id)||{data:e.data,prensa:e.prensa,carga:0,capacidade:cap};row.carga+=kg;row.saldo=cap-row.carga;if(row.saldo<-.0001)throw Error('Carga acima da capacidade real de '+e.prensa+' em '+e.data+'.');days.set(id,row);
  }return [...days.values()].sort((a,b)=>(a.data+a.prensa).localeCompare(b.data+b.prensa));
 }
 const stages=[['FILA DE EMBALAGEM','fila_embalagem','Fila de embalagem'],['FILA DE PINTURA','fila_pintura','Fila de pintura'],['EMBALADO EM ESTOQUE','embalado_estoque','Embalado em estoque'],['FATURAMENTO PREVISTO','faturamento_previsto','Faturamento previsto'],['ESTOQUE SEM CLIENTE','estoque_sem_cliente','Estoque sem cliente'],['AGUARDANDO LIBERAÇÃO COMERCIAL','aguardando_liberacao','Aguardando liberação']];
 function recalcStages(next){
  const summary=next.resumo[0],oldPaint=Number(summary.fila_pintura||0);
  for(const [stage,key,label]of stages){const total=Math.round(next.quadros.filter(x=>x.quadro===stage).reduce((s,x)=>s+Number(x.kg||0),0)*1000)/1000;summary[key]=total;const mass=next.massa.find(x=>x.bloco==='FISICO_PERFIL'&&x.rotulo===label);if(!mass)throw Error('Etapa sem correspondência na conciliação.');mass.kg=total;}
  summary.carteira_pintura_kg=Number(summary.carteira_pintura_kg||0)+summary.fila_pintura-oldPaint;
  const r=next.resumo_diario?.reuniao,cap=Number(r?.pintura_kgh||450)*Number(r?.turnos_dia||2)*Number(r?.horas_turno||10);summary.carteira_pintura_dias=summary.carteira_pintura_kg/cap;
  const physical=next.massa.filter(x=>x.bloco.startsWith('FISICO_')).reduce((s,x)=>s+Number(x.kg||0),0),theory=Number(next.massa.find(x=>x.bloco==='TEORICO')?.kg);if(!Number.isFinite(theory))throw Error('Saldo teórico indisponível.');
  summary.diferenca_massa=Math.round((theory-physical)*1000)/1000;summary.diferenca_massa_pct=theory?100*summary.diferenca_massa/theory:0;
  for(const x of next.massa){if(x.bloco==='RESULTADO'&&x.rotulo.startsWith('Mapeado'))x.kg=physical;if(x.bloco==='RESULTADO'&&x.rotulo.startsWith('Diferen')){x.kg=summary.diferenca_massa;x.detalhe='Após ajustes manuais da análise';}}
  next._cloud_status={...next._cloud_status,diferenca_kg:summary.diferenca_massa,conciliacao:Math.abs(summary.diferenca_massa)<.001?'SEM DIFERENÇA':'DIVERGENCIA EM APURACAO'};
 }
 function action(data,body){
  const next=structuredClone(data);next._gestao??={};next._gestao.faturamento??={};next._gestao.programacao??={};
  if(!String(body.obs||'').trim())throw Error('Informe o motivo.');
  if(['mover_material','excluir_analise'].includes(body.action)){
   const origin=next.quadros.find(x=>x.quadro===body.origem&&x.cliente===body.cliente);if(!origin||!stages.some(x=>x[0]===body.origem))throw Error('Linha não encontrada na etapa selecionada.');
   const kg=body.action==='excluir_analise'?Number(origin.kg):Number(body.kg);if(!Number.isFinite(kg)||kg<=0||kg>Number(origin.kg)+.00001)throw Error('Quantidade deve ser positiva e não superar o saldo da origem.');
   if(body.action==='mover_material'){
    if(body.destino===body.origem||!stages.some(x=>x[0]===body.destino))throw Error('Escolha outra etapa de destino.');
    let target=next.quadros.find(x=>x.quadro===body.destino&&x.cliente===body.cliente);if(!target){target={quadro:body.destino,cliente:body.cliente,kg:0};next.quadros.push(target)}target.kg=Math.round((Number(target.kg)+kg)*1000)/1000;
   }
   origin.kg=Math.round((Number(origin.kg)-kg)*1000)/1000;next.quadros=next.quadros.filter(x=>x!==origin||origin.kg>0);recalcStages(next);
   body={...body,obs:body.cliente+' · '+kg+' kg · '+body.origem+(body.destino?' → '+body.destino:' · excluído desta etapa')+' · '+body.obs};
  }else if(body.action==='faturamento'){

   if(!/^\d+$/.test(body.pedido)||!String(body.cliente||'').trim()||!/^\d{4}-\d{2}-\d{2}$/.test(body.dia)||!Number.isFinite(Number(body.kg))||Number(body.kg)<0)throw Error('Confira pedido, cliente, data e quantidade.');
   next._gestao.faturamento[body.dia]??={};next._gestao.faturamento[body.dia][body.pedido]={pedido:body.pedido,cliente:body.cliente,kg:Number(body.kg),incluir:body.incluir===true,obs:body.obs};
  }else if(body.action==='programacao'){
   const item=next.resumo_diario?.carteira_atual?.itens.find(x=>x.chave===body.chave);if(!item)throw Error('Item não encontrado.');
   if(!Number.isInteger(Number(body.prioridade))||Number(body.prioridade)<0)throw Error('Prioridade inválida.');
   const e={chave:body.chave,prensa:body.prensa,data:body.data,kg:Number(body.kg),prioridade:Number(body.prioridade),segurar:body.segurar===true,status:body.status,obs:body.obs};
   next._gestao.programacao[e.chave+'@'+(e.data||'sem-data')]=e;slots(next,next._gestao.programacao);item.prensa=e.prensa;item.status=e.status;
  }else if(body.action==='retirar_programacao'){
   if(!next._gestao.programacao[body.allocation])throw Error('Alocação não encontrada.');delete next._gestao.programacao[body.allocation];
  }else if(body.action!=='confirmar_publicacao')throw Error('Ação inválida.');
  next._cloud_history=[{at:new Date().toISOString(),action:body.action,reason:body.obs},...(next._cloud_history||[])].slice(0,200);return next;
 }
 let active='',host=null,context=null,filter='',press='',day=dayNow();
 function show(text,ok=false){const e=host.querySelector('#cv-status');if(e){e.textContent=text;e.className=ok?'cv-ok':'cv-error'}}
 async function save(body){host.querySelectorAll('button').forEach(b=>b.disabled=true);try{show('Salvando e publicando…',true);await window.centralCloud.save(body);show('SALVO E PUBLICADO. Todos consultam a mesma versão.',true)}catch(e){show(e.message)}finally{host.querySelectorAll('button').forEach(b=>b.disabled=false)}}
 async function render(key,target,ctx){active=key;host=target;context=ctx;const d=ctx.data||{};if(!d.resumo_diario){host.innerHTML='<p class="cv-note">Aguarde o carregamento da posição publicada.</p>';return}
  const owner=ctx.owner;host.innerHTML='<p id="cv-status" role="status"></p>';
  const append=s=>host.insertAdjacentHTML('beforeend',s);
  if(key==='ajustes'){
   append('<h2>EDITAR PAINEL</h2><p class="cv-note">Mover material conserva o total físico. Excluir da análise retira o saldo da linha escolhida e recalcula a diferença. Estas ações não alteram SAP, Acesys, notas fiscais nem a carteira por pedido. O histórico permite restaurar uma publicação anterior.</p>');
   if(!owner){append('<p>Somente o acesso pessoal de Edvaldo pode editar.</p>');return;}
   const rows=(d.quadros||[]).filter(x=>Number(x.kg)>0&&stages.some(s=>s[0]===x.quadro));
   append('<form class="cv-form" id="cv-metal"><div class="cv-tools"><label>Pesquisar cliente<input id="cv-metal-search" placeholder="Nome do cliente"></label><label>Cliente e etapa de origem<select name="origem"></select></label><label>Ação<select name="operacao"><option value="mover_material">Mover material</option><option value="excluir_analise">Excluir linha da análise</option></select></label><label data-move>Destino<select name="destino">'+stages.map(x=>'<option>'+esc(x[0])+'</option>').join('')+'</select></label><label data-move>Quantidade kg<input name="kg" type="number" step=".001" min=".001" required></label><label>Motivo<input name="obs" required></label><button>SALVAR E PUBLICAR</button></div><p id="cv-metal-balance"></p></form>');
   const form=host.querySelector('#cv-metal'),origin=form.elements.origem;
   function picked(){const row=rows[Number(origin.value)];if(!row)return;form.elements.kg.value=row.kg;form.elements.kg.max=row.kg;host.querySelector('#cv-metal-balance').textContent='Saldo da linha: '+num(row.kg)+' kg. '+(form.elements.operacao.value==='excluir_analise'?'A exclusão afeta somente esta etapa.':'Escolha a quantidade que vai mudar de etapa.');}
   function options(){const q=host.querySelector('#cv-metal-search').value.toLocaleUpperCase('pt-BR');origin.innerHTML=rows.map((x,i)=>({x,i})).filter(({x})=>x.cliente.toLocaleUpperCase('pt-BR').includes(q)).map(({x,i})=>'<option value="'+i+'">'+esc(x.cliente+' · '+x.quadro+' · '+num(x.kg)+' kg')+'</option>').join('');picked();}
   host.querySelector('#cv-metal-search').oninput=options;origin.onchange=picked;form.elements.operacao.onchange=()=>{const move=form.elements.operacao.value==='mover_material';form.querySelectorAll('[data-move]').forEach(x=>x.hidden=!move);form.elements.kg.required=move;picked()};options();
   form.onsubmit=e=>{e.preventDefault();const row=rows[Number(origin.value)];if(!row)return show('Selecione uma linha.');const action=form.elements.operacao.value;if(action==='excluir_analise'&&!confirm('Excluir '+row.cliente+' da etapa '+row.quadro+' ('+num(row.kg)+' kg)? O total físico da análise será reduzido.'))return;save({action,origem:row.quadro,cliente:row.cliente,kg:Number(form.elements.kg.value),...(action==='mover_material'?{destino:form.elements.destino.value}:{}),obs:form.elements.obs.value});};
  }else if(['dia','previsao'].includes(key)){

   const b=billing(d,day),sum=f=>b.pedidos.reduce((s,x)=>s+Number(x[f]||0),0);
   append('<h2>'+(key==='dia'?'FATURAMENTO DO DIA':'PREVISÃO DE FATURAMENTO')+'</h2><div class="cv-tools"><label>Data<input id="cv-day" type="date" value="'+day+'"></label></div><p class="cv-note">Fonte: '+esc(b.fonte||'conforme horário da base')+'. Comparação por pedido. Notas sem pedido não baixam outro pedido do mesmo cliente. A previsão por pedido é separada dos ajustes do quadro físico.</p><div class="cv-cards">'+[['Previsto',sum('kg')],['Faturado na base',b.notas.reduce((s,x)=>s+Number(x.kg),0)],['Falta nos previstos',sum('saldo_kg')]].map(([l,v])=>'<div class="cv-card">'+l+'<b>'+num(v)+' kg</b></div>').join('')+'</div>');
   append(table(['Pedido','Cliente','Previsto kg','Faturado kg','Falta kg'],b.pedidos.map(x=>[esc(x.pedido),esc(x.cliente),num(x.kg),num(x.faturado_kg),num(x.saldo_kg)])));
   if(key==='dia')append('<h3>NOTAS DO DIA</h3>'+table(['NF','Pedido','Cliente','Data','kg'],b.notas.map(x=>[esc(x.nota),esc(x.pedido),esc(x.cliente),esc(x.data),num(x.kg)])));
   host.querySelector('#cv-day').onchange=e=>{day=e.target.value;render(active,host,context)};
   if(key==='previsao'&&owner){append('<form class="cv-form" id="cv-bill"><h3>ALTERAR PREVISÃO POR PEDIDO</h3><div class="cv-tools"><label>Pedido<input name="pedido" required pattern="[0-9]+" list="cv-orders"></label><datalist id="cv-orders">'+b.pedidos.map(x=>'<option value="'+esc(x.pedido)+'">'+esc(x.cliente)+'</option>').join('')+'</datalist><label>Cliente<input name="cliente" required></label><label>Quantidade kg<input name="kg" type="number" min="0" step=".001" required></label><label>Ação<select name="incluir"><option value="true">Incluir / atualizar</option><option value="false">Retirar da previsão</option></select></label><label>Motivo<input name="obs" required></label><button>SALVAR E PUBLICAR</button></div></form>');const form=host.querySelector('#cv-bill');form.elements.pedido.onchange=()=>{const row=b.pedidos.find(x=>String(x.pedido)===form.elements.pedido.value);if(row){form.elements.cliente.value=row.cliente;form.elements.kg.value=row.kg}};form.onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(form));save({...v,action:'faturamento',dia:day,incluir:v.incluir==='true'})};}
  }else if(key==='programacao'){
   const all=d.resumo_diario.carteira_atual?.itens||[],edits=d._gestao?.programacao||{};let agenda=[],warning='';try{agenda=slots(d,edits)}catch(e){warning=e.message}
   const items=all.filter(x=>(!filter||(x.pedido+' '+x.cliente+' '+x.perfil).toLocaleUpperCase('pt-BR').includes(filter.toLocaleUpperCase('pt-BR')))&&(!press||x.prensa===press));
   append('<h2>PROGRAMAÇÃO DA FÁBRICA</h2><p class="cv-note">Somente alocações salvas entram na agenda. A lista da carteira não representa produção programada. Feriado de 20/11 e reservas de janeiro preservados. '+esc(warning)+'</p><h3>AGENDA ATRIBUÍDA</h3>'+table(['Data','Prensa','Capacidade kg','Carga kg','Saldo kg'],agenda.map(x=>[esc(x.data),x.prensa,num(x.capacidade),num(x.carga),num(x.saldo)]))+(agenda.length?'':'<p>Nenhuma alocação por dia foi salva.</p>'));
   append('<h3>ALOCAÇÕES POR ITEM</h3>'+table(['Item','Data','Prensa','kg','Segurar','Prioridade'],Object.values(edits).map(x=>[esc(x.chave),esc(x.data||'Sem data'),esc(x.prensa),num(x.kg),x.segurar?'SIM':'NÃO',esc(x.prioridade)])));
   append('<div class="cv-tools"><label>Cliente, pedido ou ferramenta<input id="cv-filter" value="'+esc(filter)+'"></label><label>Prensa<select id="cv-press"><option value="">Todas</option><option'+(press==='P7'?' selected':'')+'>P7</option><option'+(press==='P4'?' selected':'')+'>P4</option></select></label><button id="cv-search">FILTRAR</button></div><p>'+items.length+' itens da carteira.</p>'+table(['Pedido/item','Cliente','Ferramenta','Entrega','Saldo kg','Prensa','Status','Reserva'],items.map(x=>[esc(x.pedido+'/'+x.item),esc(x.cliente),esc(x.perfil),esc(x.entrega),num(x.kg),esc(x.prensa),esc(x.status),x.planejar_janeiro?'JANEIRO':''])));
   host.querySelector('#cv-search').onclick=()=>{filter=host.querySelector('#cv-filter').value;press=host.querySelector('#cv-press').value;render(active,host,context)};
   if(owner){append('<form class="cv-form" id="cv-plan"><h3>PROGRAMAR ITEM</h3><div class="cv-tools"><label>Item<select name="chave">'+items.map(x=>'<option value="'+esc(x.chave)+'">'+esc(x.pedido+'/'+x.item+' · '+x.cliente+' · '+x.perfil)+'</option>').join('')+'</select></label><label>Data<input name="data" type="date" required min="'+dayNow()+'"></label><label>Prensa<select name="prensa"><option>P7</option><option>P4</option></select></label><label>kg<input name="kg" type="number" min=".001" step=".001" required></label><label>Prioridade<input name="prioridade" type="number" min="0" step="1" value="0"></label><label>Status<select name="status"><option>LIBERADO P/ PROGRAMAR</option><option>AGUARDANDO LIBERAÇÃO PCP</option></select></label><label>Segurar<input name="segurar" type="checkbox"></label><label>Motivo<input name="obs" required></label><button>SALVAR E PUBLICAR</button></div></form>');const form=host.querySelector('#cv-plan');form.onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(form));save({...v,action:'programacao',segurar:form.elements.segurar.checked})};}
  }else if(key==='historico'){
   append('<h2>HISTÓRICO E RESTAURAÇÃO</h2><p class="cv-note">Restaurar cria uma nova publicação completa. As versões anteriores permanecem preservadas.</p>'+table(['Quando','Ação','Motivo'],(d._cloud_history||[]).map(x=>[esc(new Date(x.at).toLocaleString('pt-BR')),esc(x.action),esc(x.reason)]))+'<p>Versão publicada: '+esc(ctx.meta?.revision)+'</p>');
   try{const rows=await window.centralCloud.history();if(active!==key||host!==target)return;append(table(['Versão','Publicada em','Ação'],rows.map(x=>[esc(x.revision),esc(new Date(x.publicadoEm).toLocaleString('pt-BR')),x.publicacao===ctx.meta.publicacao?'ATUAL':owner?'<button data-cv-restore="'+esc(x.publicacao)+'">RESTAURAR</button>':'Consulta'])));host.querySelectorAll('[data-cv-restore]').forEach(b=>b.onclick=()=>{if(confirm('Restaurar esta posição completa? A posição atual continuará preservada no histórico.'))save({action:'restaurar',publicacao:b.dataset.cvRestore})});}catch(e){show('Não foi possível listar as publicações: '+e.message)}
  }else if(key==='pendencias'){
   const s=d._cloud_status;append('<h2>PENDÊNCIAS DE ATUALIZAÇÃO</h2><p class="cv-note">Horário da publicação não significa nova coleta. Consulte abaixo os horários das fontes.</p>'+table(['Fonte','Posição'],[['Carteira / Acesys',esc(d.resumo?.[0]?.carteira_em)],['Aureon',esc(d.resumo?.[0]?.aureon_em)],['Conciliação',esc(d.resumo?.[0]?.atualizado_em)],['Programação',esc(d.programacao_origem?.gerado_em)],['Coleta automática',esc(s?.automacao?.etapa||'Sem nova coleta confirmada nesta publicação')],['Pendências de importação',esc(s?String(s.conflicts):'Conferir na Central PCP local')]]));
  }else if(key==='fechamento'){
   append('<h2>FECHAMENTO NO ACESYS</h2><p class="cv-note">Autorize cada item com SIM e salve. Salvar não executa. A execução exige confirmação de senha e usa somente as autorizações válidas desta base. Itens já enviados ou com base alterada ficam bloqueados.</p>');
   if(!owner){append('<p>Controle disponível somente ao acesso pessoal de Edvaldo.</p>');return;}
   append('<div class="cv-tools"><button id="cf-connect">CONECTAR / RECARREGAR CONTROLE</button></div><div id="cf-content"></div>');
   const target=host,area=host.querySelector('#cf-content');let timer=null,current=null;
   async function refresh(){
    if(active!=='fechamento'||host!==target)return;
    try{current=await window.centralCloud.closing('/state');draw(current);show('Controle conectado. Salvar autorizações não executa.',true);if(current.operacao?.running)timer=setTimeout(refresh,3000)}
    catch(e){show('Controle desconectado: '+e.message);area.innerHTML='<p class="cv-note">No computador PCP, abra uma vez INICIAR_FECHAMENTO_CENTRAL.bat na pasta pcp_protegido atualizada. Depois clique CONECTAR CONTROLE. Abrir o serviço não inicia coleta nem fechamento.</p>';}
   }
   async function call(path,body){clearTimeout(timer);target.querySelectorAll('button').forEach(b=>b.disabled=true);try{current=await window.centralCloud.closing(path,body);draw(current);show(path==='/save'?'AUTORIZAÇÕES SALVAS. Nenhum fechamento iniciado.':'Comando recebido. Acompanhe o estado abaixo.',true);if(current.operacao?.running)timer=setTimeout(refresh,3000)}catch(e){show(e.message);target.querySelectorAll('button').forEach(b=>b.disabled=false)}}
   function draw(s){
    const running=s.operacao?.running,rows=s.todos||[],authorized=rows.filter(x=>x.estado==='AUTORIZADO');
    const progress=window.centralCloud.closingProgress(s),progressHtml=progress.tracked?'<h3>RESULTADO DA RODADA</h3><p><b>'+progress.sucesso+' de '+progress.total+' itens fechados com sucesso</b></p><progress max="'+progress.total+'" value="'+progress.sucesso+'" style="width:100%;height:22px" aria-label="Itens fechados com sucesso"></progress><div class="cv-cards">'+[['Fechados com sucesso',progress.sucesso],['Confirmados após nova coleta',progress.confirmados],['Precisam de conferência',progress.conferir],[(progress.running?'Ainda não executados':'Não executados'),progress.restantes],['Ainda constam na carteira',progress.revisar]].map(([label,n])=>'<div class="cv-card">'+label+'<b>'+n+' itens</b></div>').join('')+'</div><p>Sucesso representa o registro do robô no Acesys. A confirmação de saída da carteira depende de nova coleta. Envio sem resultado confirmado não conta como sucesso.</p>':'<h3>RESULTADOS REGISTRADOS</h3><div class="cv-cards"><div class="cv-card">Sucessos no último lote registrado<b>'+progress.sucesso+' itens</b></div><div class="cv-card">Itens com sucesso no histórico<b>'+progress.historico_total+'</b></div></div><p>A próxima execução iniciada pela Central mostrará também o total da rodada e quantos faltam.</p>';
    area.innerHTML='<p>Base: '+esc(s.gerado_em||'não informada')+' · Aureon: '+esc(s.aureon_exportado_em||'não informado')+'</p>'+(s.erro?'<p class="cv-error">'+esc(s.erro)+'</p>':'')+'<p>'+esc(running?'EM ANDAMENTO: '+s.operacao.tipo:s.operacao?.tipo?'Última operação: '+s.operacao.tipo+' · código '+s.operacao.exit_code:'Nenhuma operação iniciada nesta sessão.')+'</p><div class="cv-cards"><div class="cv-card">Autorizados válidos<b>'+authorized.length+' itens</b></div><div class="cv-card">Peso autorizado<b>'+num(s.resumo?.kg)+' kg</b></div></div><div class="cv-tools"><button id="cf-collect">04 — COLETAR BASES DO FECHAMENTO</button><button id="cf-save">SALVAR AUTORIZAÇÕES</button><button id="cf-execute">EXECUTAR AUTORIZADOS</button></div>'+table(['Pedido/item','Cliente','Perfil','kg a fechar','Situação','Autorização'],rows.map((x,i)=>[esc(x.pedido+'/'+x.item),esc(x.cliente),esc(x.perfil),num(x.kg_fechamento),esc(x.estado),'<select data-cf-choice="'+i+'"><option value="">Sem autorização</option><option value="SIM"'+(x.autorizacao==='SIM'?' selected':'')+'>SIM</option><option value="NÃO"'+(x.autorizacao==='NÃO'?' selected':'')+'>NÃO</option></select>']))+'<h3>BUSCAR PEDIDO PARA INCLUSÃO MANUAL</h3><form id="cf-search" class="cv-tools"><label>Pedido<input name="pedido" pattern="[0-9]+" required></label><button>BUSCAR</button></form><div id="cf-search-results"></div><h3>HISTÓRICO E CONFERÊNCIA</h3>'+table(['Quando','Pedido','Itens','Cliente','kg','Resultado'],(s.execucoes?.historico||[]).map(x=>[esc(x.quando),esc(x.pedido),esc(x.itens.join(', ')),esc(x.cliente),num(x.kg),esc(x.status)]))+'<p>Envios anteriores pendentes de confirmação: '+esc((s.execucoes?.envios_pendentes||[]).join(', ')||'nenhum')+'. Executado só fica confirmado após uma nova coleta da carteira.</p>';
    area.insertAdjacentHTML('afterbegin',progressHtml);
    area.querySelector('#cf-save').onclick=()=>{const choices={};area.querySelectorAll('[data-cf-choice]').forEach(e=>{choices[rows[Number(e.dataset.cfChoice)].chave]=e.value});call('/save',{escolhas:choices,snapshot:s.snapshot,revisao:s.revisao})};
    area.querySelector('#cf-collect').onclick=()=>call('/collect',{});
    area.querySelector('#cf-execute').onclick=()=>{if(confirm('Fechar no Acesys os '+authorized.length+' itens com SIM válido ('+num(s.resumo?.kg)+' kg)? Confira a lista antes de continuar.'))call('/execute',{snapshot:s.snapshot,revisao:s.revisao,itens:authorized.map(x=>x.chave).sort()})};
    area.querySelector('#cf-search').onsubmit=async e=>{e.preventDefault();try{const pedido=e.target.elements.pedido.value,result=await window.centralCloud.closing('/search',{pedido});const box=area.querySelector('#cf-search-results');box.innerHTML=table(['Pedido/item','Cliente','Perfil','Disponível kg','Ação'],result.itens.map((x,i)=>[esc(x.pedido+'/'+x.item),esc(x.cliente),esc(x.perfil),num(x.disponivel_acesys),x.ja_na_lista||x.ja_enviado?'Já listado/enviado':'<button data-cf-include="'+i+'">INCLUIR PARA CONFERÊNCIA</button>']));box.querySelectorAll('[data-cf-include]').forEach(button=>button.onclick=()=>{const row=result.itens[Number(button.dataset.cfInclude)],motivo=prompt('Motivo para incluir '+row.pedido+'/'+row.item+' na conferência manual:');if(motivo?.trim())call('/include',{pedido:row.pedido,item:row.item,motivo,snapshot:result.snapshot})});}catch(err){show(err.message)}};
    area.querySelectorAll('button,select,input').forEach(e=>e.disabled=!!running);area.querySelector('#cf-execute').disabled=!!running||!!s.erro||!authorized.length;area.querySelector('#cf-save').disabled=!!running||!!s.erro||!rows.length;
   }
   host.querySelector('#cf-connect').onclick=refresh;await refresh();

  }
 }
 window.centralViews={render,billing,slots,action};
})();
