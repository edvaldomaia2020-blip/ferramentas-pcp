// 23/11/2026 (PCP): Carga vs Capacidade a partir de hoje até o recesso (extrusão até 15/12, pintura até 16/12), carteira do dia,
// pintura sem trava em 100% e o que não cabe em 2026 indo para janeiro. Dados: resumo_diario.capacidade (conciliacao\ppcp_web.py).
// 25/11/2026 v3.4: sem cabeçalho interno (datas na faixa 1), alerta da pintura em uma linha.
// 25/11/2026 v3.3: layout 20% mais compacto (espaços, barras, larguras), fontes iguais à v3.2.
// 25/11/2026 v3.2: card CARTEIRA A PRODUZIR (só o que falta extrudar, qualquer prazo; pintura como parte do total) no início da linha dos cards.
// 24/11/2026 v3.1: tamanhos 20% menores (pedido do Edvaldo). v3: só apresentação (cálculo igual) · valores em toneladas, uma informação por linha, cores com significado fixo.
function capacityDashboard(el,r,c,p,analises,x){
const lines=[['P7','p7','#1F3864','#E8EDF6'],['P4','p4','#2E6B5E','#E6F2EF'],['Pintura','pintura','#8A4B08','#FBF0E3']],cols=c.semanas,fd=d=>d?d.split('-').reverse().join('/'):'—',fds=d=>d?d.slice(8,10)+'/'+d.slice(5,7):'—';
const L=c.linhas,t=(n,d=1)=>num((n||0)/1000,d)+' t',pt=L.Pintura;
const css=`<style>
.cvx{--ink:#1B2430;--sub:#4A5565;--line:#D5DBE3;--bg:#F4F6F9;--navy:#1F3864;--ok:#1E7B34;--okbg:#E7F4EA;--bad:#B42318;--badbg:#FDECEA;--warn:#9A5B00;--warnbg:#FFF4E0;--off:#8A94A3;
 color:var(--ink);font-family:"Segoe UI",Calibri,Arial,sans-serif;font-size:11px;line-height:1.25;display:flex;flex-direction:column;gap:9px;color-scheme:light}
.cvx *{box-sizing:border-box}
.cvx .hd{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:4px 13px;border-bottom:2px solid var(--navy);padding-bottom:5px}
.cvx .hd h2{margin:0;font-size:19px;font-weight:700;color:var(--navy)}
.cvx .hd p{margin:2px 0 0;color:var(--sub);font-size:11px}
.cvx .hd .st{font-size:10px;color:var(--sub);text-align:right}.cvx .hd .st b{display:block;color:var(--ink);font-size:11px}
.cvx .band{background:var(--navy);color:#fff;font-weight:700;font-size:12px;padding:5px 8px;border-radius:2px;letter-spacing:.2px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:2px 12px}.cvx .band span{font-weight:400;font-size:11px;color:#C9D4E8}
.cvx .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.cvx .kpi{background:#fff;border:1px solid var(--line);border-top:4px solid var(--c);border-radius:4px;padding:8px 9px;display:flex;flex-direction:column;gap:5px}
.cvx .kpi .nm{display:flex;justify-content:space-between;align-items:baseline}
.cvx .kpi .nm b{font-size:14px;color:var(--c);letter-spacing:.3px}.cvx .kpi .nm span{font-size:10px;color:var(--sub)}
.cvx .kpi .big{font-size:27px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.1}
.cvx .kpi .big small{font-size:12px;font-weight:600;color:var(--sub)}
.cvx .kpi .of{font-size:12px;color:var(--sub)}.cvx .kpi .of b{color:var(--ink)}
.cvx .bar{height:8px;background:#E6EAF0;border-radius:4px;overflow:hidden;position:relative}
.cvx .bar i{display:block;height:100%;background:var(--c);border-radius:4px}
.cvx .bar.over i{background:var(--bad)}
.cvx .pill{align-self:flex-start;font-weight:700;font-size:12px;padding:3px 6px;border-radius:3px}
.cvx .pill.ok{background:var(--okbg);color:var(--ok)}.cvx .pill.bad{background:var(--badbg);color:var(--bad)}
.cvx .kpi .rule{font-size:10px;color:var(--sub);border-top:1px solid var(--line);padding-top:5px}
.cvx .alert{display:flex;flex-wrap:wrap;align-items:center;gap:3px 16px;background:var(--badbg);border:1px solid #F3B8B2;border-left:5px solid var(--bad);border-radius:4px;padding:6px 10px}
.cvx .alert .ic{font-size:18px;font-weight:800;color:var(--bad);line-height:1}
.cvx .alert h3{margin:0;font-size:14px;color:var(--bad)}
.cvx .alert ul{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:2px 17px;font-size:12px}.cvx .alert li b{font-size:14px}
.cvx .alert.okk{background:var(--okbg);border-color:#B7DFC1;border-left-color:var(--ok)}.cvx .alert.okk h3,.cvx .alert.okk .ic{color:var(--ok)}
.cvx .note{font-size:10px;color:var(--sub);background:var(--bg);border-radius:4px;padding:5px 8px}
.cvx .legend{display:flex;flex-wrap:wrap;gap:5px 11px;font-size:10px;color:var(--sub);align-items:center}
.cvx .legend span{display:inline-flex;align-items:center;gap:4px}.cvx .legend i{width:9px;height:9px;border-radius:2px;display:inline-block}
.cvx .wrap{overflow-x:auto;border:1px solid var(--line);border-radius:4px;background:#fff}
.cvx table{border-collapse:separate;border-spacing:0;width:100%;min-width:627px;table-layout:fixed}.cvx table col.ln{width:84px}
.cvx th,.cvx td{overflow:hidden;border-bottom:1px solid var(--line);border-right:1px solid var(--line);padding:0;vertical-align:top}
.cvx thead th{background:var(--bg);padding:6px 6px;text-align:left;font-size:10px;color:var(--sub);font-weight:600}
.cvx thead th b{display:block;font-size:14px;color:var(--ink)}
.cvx thead th.rec{background:#ECEEF1}.cvx thead th.tot{background:#DDE4F0}
.cvx tbody th{background:var(--cl);border-left:4px solid var(--c);padding:8px 6px;text-align:left;width:62px;position:sticky;left:0;z-index:1}
.cvx tbody th b{font-size:14px;color:var(--c)}
.cvx tbody tr:last-child th,.cvx tbody tr:last-child td{border-bottom:0}
.cvx .cell{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;width:100%;min-height:100%;padding:6px 8px;cursor:pointer;font:inherit;color:inherit}
.cvx .cell:hover{background:#F7F9FC}.cvx .cell:focus-visible{outline:2px solid #2F5597;outline-offset:-2px}.cvx .cell.sel{background:#EEF3FB;box-shadow:inset 0 0 0 2px #2F5597}
.cvx .cell .v{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}.cvx .cell .v small{font-size:10px;font-weight:500;color:var(--sub)}
.cvx .cell .s{font-size:11px;font-weight:600}.cvx .cell .s.free{color:var(--ok)}.cvx .cell .s.full{color:var(--sub)}.cvx .cell .s.neg{color:var(--bad)}
.cvx .tag{align-self:flex-start;max-width:100%;width:auto;white-space:normal;font-size:10px;font-weight:700;padding:2px 5px;border-radius:2px;background:var(--badbg);color:var(--bad)}
.cvx .tag.jan{background:var(--warnbg);color:var(--warn)}
.cvx td.rec{background:repeating-linear-gradient(135deg,#F3F4F6 0 5px,#ECEEF1 5px 10px)}
.cvx td.rec .v{color:var(--off)}
.cvx td.tot{background:#F3F6FB}
.cvx .focus{border:1px solid var(--line);border-left:4px solid #2F5597;border-radius:4px;background:#fff;padding:6px 9px;font-size:12px}
.cvx .focus dl{display:flex;flex-wrap:wrap;gap:2px 17px;margin:4px 0 0}.cvx .focus dt{font-size:10px;color:var(--sub);text-transform:uppercase;letter-spacing:.2px}.cvx .focus dd{margin:0;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.cvx .jan{display:grid;grid-template-columns:repeat(auto-fit,minmax(154px,1fr));gap:8px}
.cvx .jan>div{background:#fff;border:1px solid var(--line);border-left:4px solid var(--c);border-radius:4px;padding:6px 9px}
.cvx .jan b{font-size:13px;color:var(--c)}.cvx .jan strong{display:block;font-size:21px;font-variant-numeric:tabular-nums;margin:2px 0}
.cvx .jan ul{margin:2px 0 0;padding:0;list-style:none;font-size:11px;color:var(--sub)}.cvx .jan li b{font-size:11px;color:var(--ink)}
.cvx details{background:#fff;border:1px solid var(--line);border-radius:4px}
.cvx summary{cursor:pointer;padding:6px 9px;font-weight:600;font-size:12px;color:var(--navy)}
.cvx .items{width:100%;min-width:0;border-collapse:collapse;font-size:11px;table-layout:auto}
.cvx .items th,.cvx .items td{border:0;border-top:1px solid var(--line);padding:4px 8px;text-align:left;background:none;position:static;width:auto}
.cvx .items th{font-size:10px;color:var(--sub);text-transform:uppercase}.cvx .items td.k{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.cvx .conf{display:flex;flex-direction:column;gap:2px;padding:0 9px 8px;font-size:11px}
.cvx details ul.pr{margin:0;padding:0 9px 8px 21px;font-size:11px;color:var(--sub)}
.cvx .kpi.tot{background:#1F3864;border:0;color:#fff;box-shadow:0 2px 5px rgba(31,56,100,.25)}
.cvx .kpi.tot .nm b{color:#fff}.cvx .kpi.tot .nm span{color:#C9D4E8}
.cvx .kpi.tot .big small,.cvx .kpi.tot .of{color:#C9D4E8}
.cvx .kpi.tot .stack{display:flex;height:8px;border-radius:4px;overflow:hidden;background:#33507F}
.cvx .kpi.tot .stack i{display:block;height:100%}
.cvx .kpi.tot dl{display:grid;grid-template-columns:1fr auto auto;gap:2px 8px;margin:0;font-size:12px;align-items:center}
.cvx .kpi.tot dt{display:flex;align-items:center;gap:5px;color:#E6ECF6}.cvx .kpi.tot dt i{width:8px;height:8px;border-radius:2px;display:inline-block;flex:none}
.cvx .kpi.tot dd{margin:0;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;color:#fff}
.cvx .kpi.tot dd.x{font-weight:400;color:#C9D4E8}
.cvx .kpi.tot .rule{color:#C9D4E8;border-top-color:#3A5688}
.cvx .more{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:8px;align-items:start}
.cvx .more details[open]{grid-column:1/-1}
@media (max-width:512px){.cvx .hd h2{font-size:16px}.cvx .kpi .big{font-size:22px}.cvx .hd .st{text-align:left}}
</style>`;
const cell=(name,key,s,i)=>{const v=s.linhas[name];
 if(s.recesso){const nc=name==='Pintura'?pt.nao_cabe:L[name].nao_cabe+L[name].adiado_pintura;return `<td class="rec"><button class="cell" id="cap-${key}-${i}"><span class="v">Parado</span>${nc>.5?`<span class="tag jan">${t(nc)} vão p/ janeiro</span>`:'<span class="s full">nada para janeiro</span>'}</button></td>`}
 const ratio=v.cap?v.carga/v.cap:0,late=(v.atraso||0)>.5,free=v.saldo>.5;
 return `<td><button class="cell" id="cap-${key}-${i}" aria-label="${name}, ${s.id}: programado ${num(v.carga)} kg de ${num(v.cap)} kg, saldo ${num(v.saldo)} kg"><span class="v">${t(v.carga)} <small>de ${t(v.cap)}</small></span><span class="bar"><i style="width:${Math.min(100,ratio*100)}%"></i></span><span class="s ${free?'free':'full'}">${free?'Livre '+t(v.saldo):'Semana cheia'}</span>${late?`<span class="tag">Atrasado ${t(v.atraso)}</span>`:''}</button></td>`};
const totalCell=(name,key)=>{const v=L[name],saldo=v.cap-v.carga,neg=saldo<-.5,ratio=v.cap?v.carga/v.cap:0;
 return `<td class="tot"><button class="cell" id="cap-${key}-t"><span class="v">${t(v.carga)} <small>de ${t(v.cap)}</small></span><span class="bar ${neg?'over':''}"><i style="width:${Math.min(100,ratio*100)}%"></i></span><span class="s ${neg?'neg':saldo>.5?'free':'full'}">${neg?'Faltam '+t(-saldo):saldo>.5?'Livre '+t(saldo):'Cheia'} · ${num(ratio*100,0)}%</span></button></td>`};
const head=`<colgroup><col class="ln">${cols.map(()=>'<col>').join('')}<col></colgroup><thead><tr><th>Linha</th>${cols.map(s=>`<th class="${s.recesso?'rec':''}"><b>${s.recesso?'Recesso':'Semana '+s.id.replace('S','')}</b>${s.rotulo}${s.recesso?'':` · ${s.linhas.P7.dias} dias`}</th>`).join('')}<th class="tot"><b>Total</b>até ${fds(pt.ultimo_dia)}</th></tr></thead>`;
const body=`<tbody>${lines.map(([name,key,col,cl])=>`<tr style="--c:${col};--cl:${cl}"><th><b>${name==='Pintura'?'Pintura':name}</b></th>${cols.map((s,i)=>cell(name,key,s,i)).join('')}${totalCell(name,key)}</tr>`).join('')}</tbody>`;
const cards=lines.map(([name,key,col])=>{const v=L[name],ratio=v.cap?v.carga/v.cap:0,ok=v.nao_cabe<=.01,dias=v.cap_dia?v.carga/v.cap_dia:0;
 return `<article class="kpi" style="--c:${col}"><div class="nm"><b>${name==='Pintura'?'PINTURA':name}</b><span>${v.pedidos} pedidos</span></div><div><div class="big">${t(v.carga)} <small>de carga</small></div><div class="of">Capacidade até ${fds(v.ultimo_dia)}: <b>${t(v.cap)}</b> · ${num(dias,1)} de ${v.dias_uteis} dias úteis</div></div><div class="bar ${ratio>1.0001?'over':''}"><i style="width:${Math.min(100,ratio*100)}%"></i></div>${ok?`<span class="pill ok">✓ Cabe em 2026 · termina ${fds(v.fim_previsto)}</span>`:`<span class="pill bad">✕ Não cabe ${t(v.nao_cabe)} → janeiro</span>`}<div class="rule">${v.base==='real'?'Produtividade real de nov.: '+num(v.kgh_usado)+' kg/h':num(v.kgh_usado)+' kg/h'} × ${r.turnos_dia} turnos × ${r.horas_turno} h = <b>${t(v.cap_dia)}/dia</b>${v.base==='real'?' (nominal '+t(v.cap_dia_nominal)+')':''}</div></article>`}).join('');
const tP7=L.P7.carteira+L.P7.reserva_janeiro,tP4=L.P4.carteira+L.P4.reserva_janeiro,tSP=c.sem_prensa_kg||0,tAll=tP7+tP4+tSP,tPt=Math.max(0,pt.carga+pt.reserva_janeiro-(pt.fila_extrudada||0)),sh=n=>tAll?n/tAll*100:0;
const totalCard=`<article class="kpi tot"><div class="nm"><b>CARTEIRA A PRODUZIR</b><span>consolidado</span></div><div><div class="big">${t(tAll)}</div><div class="of">falta extrudar nas prensas · qualquer prazo</div></div><div class="stack"><i style="width:${sh(tP7)}%;background:#8FB0E6"></i><i style="width:${sh(tP4)}%;background:#7CC4B2"></i>${tSP>.5?`<i style="width:${sh(tSP)}%;background:#B8C2D1"></i>`:''}</div><dl><dt><i style="background:#8FB0E6"></i>P7</dt><dd class="x">${num(sh(tP7),0)}%</dd><dd>${t(tP7)}</dd><dt><i style="background:#7CC4B2"></i>P4</dt><dd class="x">${num(sh(tP4),0)}%</dd><dd>${t(tP4)}</dd>${tSP>.5?`<dt><i style="background:#B8C2D1"></i>Sem prensa cadastrada</dt><dd class="x">${num(sh(tSP),0)}%</dd><dd>${t(tSP)}</dd>`:''}<dt><i style="background:#E3A35B"></i>Pintura (dentro do total)</dt><dd class="x">${num(sh(tPt),0)}%</dd><dd>${t(tPt)}</dd></dl><div class="rule">Pintura = parte de P7/P4 que vai para a pintura depois de extrudada. Não entra material já extrudado. Inclui atrasados, bloqueados e entrega 2027.</div></article>`;
const alert=pt.nao_cabe>.01?`<div class="alert"><span class="ic">!</span><h3>A pintura é o gargalo: ${t(pt.nao_cabe)} não cabem até ${fds(pt.ultimo_dia)}</h3><ul><li>Carga <b>${t(pt.carga)}</b></li><li>Capacidade <b>${t(pt.cap)}</b></li><li>Extrusão adiada para janeiro: P7 <b>${t(L.P7.adiado_pintura)}</b> · P4 <b>${t(L.P4.adiado_pintura)}</b>${c.pintura_adiada_sem_prensa?' · sem prensa <b>'+t(c.pintura_adiada_sem_prensa)+'</b>':''}</li></ul></div>`:`<div class="alert okk"><span class="ic">✓</span><h3>Toda a carga da pintura cabe até ${fds(pt.ultimo_dia)}</h3></div>`;
const janRows=[...c.janeiro_pintura.map(i=>({...i,motivo:'pintura'})),...c.janeiro_extrusao.map(i=>({...i,motivo:'extrusão'}))];
const january=`<div class="band">3 · Janeiro/2027 · o que fica para depois do recesso</div><div class="jan">${lines.map(([name,key,col])=>{const v=L[name],nc=name==='Pintura'?v.nao_cabe:v.nao_cabe+v.adiado_pintura;return `<div style="--c:${col}"><b>${name}</b><strong>${t(v.reserva_janeiro+nc)}</strong><ul><li>Não cabe em 2026: <b>${t(nc)}</b>${name!=='Pintura'&&v.adiado_pintura?' (por pintura '+t(v.adiado_pintura)+')':''}</li><li>Entrega já em 2027: <b>${t(v.reserva_janeiro)}</b></li></ul></div>`}).join('')}</div>
<div class="more"><details><summary>Ver os ${janRows.length} itens que não cabem em 2026 (os de entrega mais tarde ficam para janeiro)</summary>${janRows.length?`<table class="items"><thead><tr><th>Prensa</th><th>Pedido</th><th>Ferramenta</th><th>Motivo</th><th>Entrega</th><th style="text-align:right">kg</th></tr></thead><tbody>${janRows.map(i=>`<tr><td>${esc(i.prensa)}</td><td>${esc(i.pedido)}</td><td>${esc(i.ferramenta)}</td><td>${i.motivo}</td><td>${fd(i.entrega)}</td><td class="k">${num(i.kg)}</td></tr>`).join('')}</tbody></table>`:'<p class="conf">Nenhum item: toda a carga cabe até o recesso.</p>'}</details>`;
const conf=lines.filter(([n])=>n!=='Pintura').map(([name])=>{const v=L[name];return `<span><b>${name}</b>: carteira <b>${num(v.carteira+v.reserva_janeiro)} kg</b> = até o recesso ${num(v.cabe)} + pintura adiada ${num(v.adiado_pintura)} + sem capacidade ${num(v.nao_cabe)} + entrega 2027 ${num(v.reserva_janeiro)}</span>`}).join('');
const gen=x.gerado_em?fd(x.gerado_em.slice(0,10))+' '+x.gerado_em.slice(11,16):'—',src=x.fonte_salva_em?fd(x.fonte_salva_em.slice(0,10))+' '+x.fonte_salva_em.slice(11,16):'—';
el.innerHTML=`${css}<div class="cvx"><div class="band"><b>1 · Resumo até o recesso</b><span>Extrusão até ${fds(L.P7.ultimo_dia)} · pintura até ${fds(pt.ultimo_dia)} · carteira P.P.C.P. de ${src} · gerado ${gen}</span></div><div class="kpis">${totalCard}${cards}</div>${alert}
<div class="note">A pintura inclui ${t(pt.fila_extrudada)} já extrudados aguardando pintura. P7 e P4 estão sem a parte de pintura que passa para janeiro. A carteira inclui pedidos bloqueados e atrasados (entrega PCP antes de ${fds(c.inicio)}): P7 ${t(L.P7.atrasado)} · P4 ${t(L.P4.atrasado)} · pintura ${t(pt.atrasado)}.</div>
<div class="band">2 · Semana a semana</div><div class="legend"><span><i style="background:#2F5597"></i>barra = quanto da capacidade está programado</span><span><i style="background:var(--okbg);border:1px solid var(--ok)"></i><b style="color:var(--ok)">Livre</b> = capacidade sobrando</span><span><i style="background:var(--badbg);border:1px solid var(--bad)"></i><b style="color:var(--bad)">Atrasado</b> = pedidos vencidos ainda sem produção</span><span>Toque numa célula para ver o detalhe.</span></div>
<div class="wrap"><table>${head}${body}</table></div>
<div class="focus" id="weekfocus" aria-live="polite">Toque numa semana para ver quanto foi pedido para ela e quanto está programado.</div>
${january}
<details><summary>Conferência da carteira (kg)</summary><div class="conf">${conf}</div></details>
<details><summary>Premissas do cálculo</summary><ul class="pr">${c.premissas.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></details>
${p?`<details class="planmore"><summary>Planilha PLANEJAMENTO E NOVEMBRO (montada em 12/11, só para consulta)</summary><div class="plansupport"><div><h3>Tarugo · consumo nominal do mês</h3><b>${num(p.tarugo)} kg</b><p>Sem dedução de estoque ou recebimentos.</p></div><div><h3>Ligas especiais P7</h3><b>${num(p.ligas,2)} kg</b><p>Conforme a programação mensal salva.</p></div></div>${sourceDetails(analises,'PLANEJAMENTO E NOVEMBRO')}</details>`:''}</div></div>`;
const mark=b=>{el.querySelectorAll('.cvx .cell.sel').forEach(e=>e.classList.remove('sel'));b.classList.add('sel')};
for(const [name,key] of lines){cols.forEach((s,i)=>{const b=$('cap-'+key+'-'+i);b.onclick=()=>{mark(b);const v=s.linhas[name];$('weekfocus').innerHTML=`<b>${name} · ${s.recesso?'Recesso':'Semana '+s.id.replace('S','')} (${s.rotulo})</b><dl><div><dt>Entregas pedidas${i===0?' (com vencidos)':''}</dt><dd>${num(v.entrega)} kg</dd></div><div><dt>Programado</dt><dd>${num(v.carga)} kg</dd></div><div><dt>Capacidade (${v.dias} dias)</dt><dd>${num(v.cap)} kg</dd></div><div><dt>Livre</dt><dd style="color:var(--ok)">${num(v.saldo)} kg</dd></div><div><dt>Atraso acumulado</dt><dd style="color:var(--bad)">${num(v.atraso)} kg</dd></div></dl>`}});
 const tb=$('cap-'+key+'-t');tb.onclick=()=>{mark(tb);const v=L[name];$('weekfocus').innerHTML=`<b>${name} · total até ${fds(v.ultimo_dia)}</b><dl><div><dt>Carga</dt><dd>${num(v.carga)} kg</dd></div><div><dt>Capacidade</dt><dd>${num(v.cap)} kg</dd></div><div><dt>${v.cap-v.carga<-.5?'Faltam':'Livre'}</dt><dd>${num(Math.abs(v.cap-v.carga))} kg</dd></div><div><dt>Não cabe em 2026</dt><dd style="color:var(--bad)">${num(name==='Pintura'?v.nao_cabe:v.nao_cabe+v.adiado_pintura)} kg</dd></div></dl>`}}
}
