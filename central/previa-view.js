/* Tela PRÉVIA DE FATURAMENTO da Central (substitui a planilha de prévia).
   Edição fica num rascunho no navegador e recalcula na hora; SALVAR E PUBLICAR grava tudo de uma vez
   em _gestao.previa (somente o acesso do Edvaldo). Visual no padrão da Carga vs Capacidade (.cvx). */
(()=>{
 'use strict';
 const P=window.previaFaturamento;
 const dayNow=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 /* Nome curto do cliente: 1º nome + 2º nome (completo até 10 letras, senão abreviado); ignora DE/DA/DO/E. */
 const curto=n=>{if(/^NÃO ESTÁ NA CARTEIRA/i.test(String(n||'')))return 'FORA DA CARTEIRA';const w=String(n||'').replace(/[()]/g,' ').trim().toLocaleUpperCase('pt-BR').split(/\s+/).filter(x=>x&&!['DE','DA','DO','DOS','DAS','E','&','-'].includes(x));if(!w.length)return '(sem cliente)';if(w.length===1)return w[0];const b=w[1];return w[0]+' '+(b.length<=10?b:b[0]+'.')};
 const br=d=>d?d.slice(8,10)+'/'+d.slice(5,7):'';
 const wd=d=>d?['dom','seg','ter','qua','qui','sex','sáb'][new Date(d+'T12:00:00Z').getUTCDay()]+' '+br(d):'';
 const css=document.createElement('style');
 css.textContent=`.pvx{--ink:#1B2430;--sub:#4A5565;--line:#D5DBE3;--bg:#F4F6F9;--navy:#1F3864;--ok:#1E7B34;--okbg:#E7F4EA;--bad:#B42318;--badbg:#FDECEA;--warn:#9A5B00;--warnbg:#FFF4E0;--p7:#1F3864;--p4:#2E6B5E;--pt:#8A4B08;--ft:#16786b;
 color:var(--ink);font-family:"Segoe UI",Calibri,Arial,sans-serif;font-size:12px;line-height:1.3;display:flex;flex-direction:column;gap:6px;width:100%;max-width:none;overflow-x:hidden}
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
.pvx .cv-note{margin:0;padding:3px 8px;font-size:11px;line-height:1.3;border-radius:3px}.pvx .warn{padding:3px 8px!important;font-size:11px!important}.pvx .hd{padding-bottom:3px}.pvx .hd h2{font-size:16px}.pvx .note{font-size:10px;color:var(--sub);background:var(--bg);border-radius:4px;padding:5px 8px}
.pvx .warn{font-size:12px;font-weight:600;color:var(--bad);background:var(--badbg);border-left:4px solid var(--bad);padding:6px 10px;border-radius:4px}
.pvx .dirty{font-size:12px;font-weight:600;color:var(--warn);background:var(--warnbg);border-left:4px solid #B28629;padding:6px 10px;border-radius:4px}
.pvx details{background:#fff;border:1px solid var(--line);border-radius:4px}.pvx details>summary{cursor:pointer;padding:7px 10px;font-weight:700;color:var(--navy);font-size:12px}.pvx details>summary span{font-weight:400;color:var(--sub);font-size:11px;margin-left:6px}.pvx details[open]>summary{border-bottom:1px solid var(--line)}
.pvx details .in{padding:8px 10px;display:flex;flex-direction:column;gap:8px}.pvx details .wrap{border:0}
.pvx form.row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:end}.pvx label{font-size:10px;color:var(--sub);display:flex;flex-direction:column;gap:2px}
.pvx input,.pvx select,.pvx textarea{font:inherit;font-size:12px;padding:4px 6px;border:1px solid #B8C4D3;border-radius:3px;margin:0}.pvx input[type=number]{width:90px}.pvx td input{width:96px}
.pvx button{font:inherit;font-size:11px;font-weight:700;padding:5px 10px;border-radius:3px;border:1px solid var(--navy);background:var(--navy);color:#fff;cursor:pointer}.pvx button.lnk{background:#fff;color:var(--bad);border-color:#E3B4AF;padding:2px 7px}.pvx button.sec{background:#fff;color:var(--navy)}
.pvx .al{color:var(--bad);font-size:11px}.pvx .ok{color:var(--ok);font-size:11px}
.pvx .cfg{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.pvx .cfg textarea{min-height:90px;width:100%}
.pvx .board{display:grid;grid-template-columns:repeat(5,minmax(175px,1fr));gap:7px;overflow-x:auto}
.pvx .col{background:#fff;border:1px solid var(--line);border-top:5px solid #7F93B5;border-radius:4px;padding:0 0 6px;display:flex;flex-direction:column;gap:4px;min-width:175px;box-shadow:0 1px 2px rgba(20,40,80,.06)}
.pvx .col>*:not(.ch):not(table){margin:0 7px}.pvx .col table{width:calc(100% - 8px);margin:2px 4px 0}
.pvx .col.hoje{border-top-color:#2F5597;box-shadow:0 0 0 2px #2F5597}.pvx .col.ok{border-top-color:var(--ok)}.pvx .col.bad{border-top-color:var(--bad)}.pvx .col.fut{border-top-color:var(--navy)}.pvx .col.feriado{opacity:.6}
.pvx .col .ch{display:flex;justify-content:space-between;align-items:center;gap:4px;background:#E8EDF6;padding:5px 7px;border-bottom:1px solid var(--line)}.pvx .col.ok .ch{background:var(--okbg)}.pvx .col.bad .ch{background:var(--badbg)}.pvx .col.hoje .ch{background:#DCE6F7}
.pvx .col .ch b{font-size:13px;color:var(--navy);text-transform:uppercase;letter-spacing:.3px}
.pvx .tag{font-size:9px;font-weight:700;background:#2F5597;color:#fff;padding:2px 6px;border-radius:3px;white-space:nowrap}.pvx .tag.off{background:#8A94A3}.pvx .tag.tok{background:var(--ok)}.pvx .tag.tbad{background:var(--bad)}
.pvx .blk{border-radius:4px;padding:5px 8px;display:flex;flex-direction:column;gap:1px}.pvx .blk span{font-size:9px;font-weight:700;letter-spacing:.4px}.pvx .blk b{font-size:22px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.1}.pvx .blk b small{font-size:11px;font-weight:600}
.pvx .blk.prev{background:linear-gradient(135deg,#1F3864,#2F5597);color:#fff}.pvx .blk.prev span{color:#C9D4E8}
.pvx .blk.real{background:var(--okbg);border-left:5px solid var(--ok);color:var(--ink)}.pvx .col.bad .blk.real{background:var(--badbg);border-left-color:var(--bad)}.pvx .blk.real span{color:var(--ok)}.pvx .col.bad .blk.real span{color:var(--bad)}.pvx .col.hoje .blk.real{background:#fff;border:1px solid var(--line);border-left:5px solid #2F5597}.pvx .col.hoje .blk.real span{color:#2F5597}
.pvx .blk em{font-style:normal;font-size:11px;font-weight:700;align-self:flex-start;padding:1px 6px;border-radius:3px}.pvx .blk em.pos{background:var(--ok);color:#fff}.pvx .blk em.neg{background:var(--bad);color:#fff}
.pvx .pbar{height:7px;background:#E6EAF0;border-radius:4px;overflow:hidden}.pvx .pbar i{display:block;height:100%;background:var(--bad)}.pvx .pbar.cheio i{background:var(--ok)}.pvx .col.hoje .pbar i{background:#2F5597}
.pvx .acc{font-size:10px;color:var(--sub)}.pvx .acc b{color:var(--ink)}
.pvx .occ{display:flex;gap:4px;flex-wrap:wrap;font-size:10px;color:var(--sub)}.pvx .oc{font-weight:700;font-size:10px;padding:1px 5px;border-radius:3px;color:#fff}.pvx .oc.p7{background:var(--p7)}.pvx .oc.p4{background:var(--p4)}.pvx .oc.pt{background:var(--pt)}.pvx .oc.over{background:var(--bad)}
.pvx .col table{font-size:11px;border-collapse:collapse}.pvx .col td{padding:3px 4px;border-bottom:1px solid #EEF1F5}.pvx .col tr:nth-child(even) td{background:#F6F8FB}.pvx .col td.n{font-weight:700;color:var(--navy)}.pvx .col td.vz{color:#8A94A3;text-align:center;font-weight:400}
.pvx .col .rl{font-size:9px;font-weight:700;color:#fff;background:var(--ok);padding:2px 6px;border-radius:3px;margin-top:5px;align-self:flex-start}.pvx .col table.r td{color:#185E2A}.pvx .col table.r td.n{color:var(--ok)}
.pvx .band{background:linear-gradient(90deg,#1F3864,#2F5597)}
.pvx .imp{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:11px;color:var(--sub)}.pvx .btnf{flex-direction:row;font-size:11px;font-weight:700;padding:5px 10px;border-radius:3px;background:var(--ok);color:#fff;cursor:pointer}
.pvx label.aprog{font-size:11px;font-weight:700;color:#5a6b80}.pvx output.sal{display:block;min-width:84px;margin-top:2px;padding:6px 10px;border-radius:6px;background:#fff;border:2px solid #b9c6d6;font-size:16px;font-weight:800;color:#19344f;text-align:right}.pvx output.sal.p7{border-color:var(--p7,#1f3f7a);background:#e9effa;color:#1f3f7a}.pvx output.sal.p4{border-color:var(--p4,#2f7d5a);background:#e6f4ec;color:#1f6a48}.pvx output.sal.zero{opacity:.55;background:#f1f3f6;border-color:#d6dfea;color:#5a6b80}.pvx .hint{margin-top:6px;font-size:13px;color:#19344f;background:#fff;border:1px solid #d6dfea;border-left:4px solid #2a5aa8;border-radius:6px;padding:6px 10px}.pvx .hint .hs{color:#5a6b80;font-size:12px}
.pvx .tabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:4px}.pvx .tab{all:unset;cursor:pointer;flex:0 0 auto;min-width:128px;background:#fff;border:1px solid var(--line);border-top:4px solid #7F93B5;border-radius:4px;padding:5px 8px;display:flex;flex-direction:column;gap:1px;font-size:10px;color:var(--sub)}.pvx .tab b{font-size:12px;color:var(--navy);text-transform:uppercase}.pvx .tab small{font-size:10px}.pvx .tab.ESTOUROU{border-top-color:var(--bad)}.pvx .tab.CHEIO{border-top-color:#C98A00}.pvx .tab.FECHADO{border-top-color:var(--ok)}.pvx .tab.ABERTO{border-top-color:#2F5597}.pvx .tab.sel{background:var(--navy);border-color:var(--navy)}.pvx .tab.sel b,.pvx .tab.sel span,.pvx .tab.sel small{color:#fff}
.pvx .dayp{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid var(--line);border-top:4px solid var(--navy);border-radius:4px;padding:8px}
.pvx .gauges{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}.pvx .gauge{border:1px solid var(--line);border-left:5px solid var(--c);border-radius:4px;padding:6px 8px;display:flex;flex-direction:column;gap:4px;background:#FBFCFE}.pvx .gauge .gh{display:flex;justify-content:space-between;align-items:baseline}.pvx .gauge .gh b{color:var(--c);font-size:13px}.pvx .gauge .gh span{font-size:11px;color:var(--sub)}.pvx .gauge .bar{height:9px;background:#E6EAF0;border-radius:4px;overflow:hidden}.pvx .gauge .bar i{display:block;height:100%;background:var(--c)}.pvx .gauge .bar.over i{background:var(--bad)}.pvx .gauge .gf{display:flex;justify-content:space-between;align-items:center;font-size:11px}.pvx .gauge em{font-style:normal;font-weight:700;font-size:11px;padding:1px 6px;border-radius:3px}.pvx .gauge em.okk{background:var(--okbg);color:var(--ok)}.pvx .gauge em.warn{background:var(--warnbg);color:var(--warn)}.pvx .gauge em.over{background:var(--bad);color:#fff}.pvx .gauge b.neg{color:var(--bad)}.pvx .gauge .gx{font-size:10px;color:var(--sub)}.pvx .gauge.fat{--c:var(--ft)}.pvx .gauge .fv{font-size:22px;font-weight:700;color:var(--ft)}.pvx .gauge .fv small{font-size:11px}
.pvx table.prog{table-layout:auto}.pvx table.prog th{white-space:normal;font-size:9.5px;padding:4px 4px}.pvx table.prog td{white-space:nowrap;padding:3px 4px;font-size:11px}.pvx table.prog td:nth-child(12){white-space:normal;min-width:110px}.pvx table.prog td input{width:66px;padding:3px 4px;font-size:11px}.pvx table.prog td input[type=date]{width:112px}.pvx table.prog td select{font-size:11px;padding:2px}.pvx .turno{display:flex;flex-direction:column;gap:6px}.pvx .turno>.th{font-weight:700;font-size:12px;color:#fff;padding:4px 8px;border-radius:3px;background:#2F5597}.pvx .turno.noite>.th{background:#3B3F7A}@media(max-width:1000px){.pvx table.prog th:nth-child(1),.pvx table.prog td:nth-child(1),.pvx table.prog th:nth-child(9),.pvx table.prog td:nth-child(9){display:none}}.pvx input.yl{background:#FFF8D6;border-color:#D9C46A}.pvx tr.novo td{background:#FFFDF0}.pvx .ac{font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;background:#E8EDF6;color:var(--navy)}.pvx .ac.PINTADO{background:#FBF0E3;color:var(--pt)}.pvx .ac.MISTO{background:var(--warnbg);color:var(--warn)}
.pvx .sugs{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:8px}.pvx .sug{border:1px solid var(--line);border-top:4px solid var(--c);border-radius:4px}.pvx .sug .sh{font-weight:700;font-size:11px;color:var(--c);padding:5px 8px;background:#F6F8FB;display:flex;justify-content:space-between}.pvx .sug .sh span{color:var(--sub);font-weight:400}.pvx .sug td{padding:3px 6px;font-size:11px}.pvx button.plus{background:#fff;color:var(--ok);border-color:#9CD3AA;padding:1px 7px;font-size:10px}
.pvx .save{display:flex;flex-wrap:wrap;gap:8px;align-items:end;justify-content:flex-end}`;
 document.head.append(css);
 let draft=null,draftOf=null,dirty=false,selDia=null,abertoOrig=false;

 /* Importa a planilha "PRÉVIA DE FATURAMENTO" (abas PROGRAMAÇÃO, FILAS, BASE_CALC) para o rascunho:
    programação com datas, regras e o previsto que a própria planilha calculou (para os dias já passados). */
 let xlsxLib=null;
 function carregarXlsx(){if(window.XLSX)return Promise.resolve(window.XLSX);xlsxLib??=new Promise((ok,ko)=>{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.onload=()=>ok(window.XLSX);sc.onerror=()=>{xlsxLib=null;ko(Error('não foi possível carregar o leitor de Excel'))};document.head.append(sc)});return xlsxLib}
 function porPedido(itens){const m=new Map();for(const i of itens){const key=(i.pedido||'')+'|'+i.cliente;const o=m.get(key)||{pedido:String(i.pedido||''),cliente:i.cliente,kg:0,origem:i.origem};o.kg+=Number(i.kg||0);m.set(key,o)}return [...m.values()].filter(i=>i.kg>=0.5).map(i=>({...i,kg:Math.round(i.kg*10)/10})).sort((a,b)=>b.kg-a.kg)}
 async function importarPlanilha(file,pub){
  const X=await carregarXlsx(),wb=X.read(await file.arrayBuffer(),{cellDates:true});
  const sh=n=>{const w=wb.Sheets[n];if(!w)throw Error('aba '+n+' não encontrada');return w};
  const pr=sh('PROGRAMAÇÃO'),fi=sh('FILAS'),bc=sh('BASE_CALC');
  const v=(w,a)=>w[a]?.v,ds=x=>x instanceof Date?new Date(Date.UTC(x.getFullYear(),x.getMonth(),x.getDate(),12)).toISOString().slice(0,10):typeof x==='number'&&x>40000&&x<60000?new Date(Date.UTC(1899,11,30+Math.floor(x),12)).toISOString().slice(0,10):null;
  const ini=ds(v(pr,'C10'));if(!ini)throw Error('INÍCIO PRODUÇÃO (C10) vazio');
  const util=i=>{const t=new Date(ini+'T12:00:00Z');let n=1;while(n<i){t.setUTCDate(t.getUTCDate()+1);if(t.getUTCDay()%6)n++}return t.toISOString().slice(0,10)};
  const programacao=[];
  for(let r=18;r<=160;r++){const b=v(pr,'B'+r),y=Number(v(pr,'Y'+r));if(typeof b!=='number'||!(y>0))continue;const p7=Number(v(pr,'G'+r))||0,p4=Number(v(pr,'H'+r))||0;if(p7+p4<=0)continue;
   const m=ds(v(pr,'N'+r));programacao.push({dia:util(y),pedido:String(b),p7,p4,...(m?{faturarEm:m}:{})})}
  const col=(c,a,b)=>{const o=[];for(let r=a;r<=b;r++){const x=v(pr,c+r);if(x!==undefined&&x!==null&&String(x).trim())o.push(String(x).trim())}return o};
  const fora={};for(let r=8;r<=15;r++){const a=v(pr,'AD'+r),c=v(pr,'AE'+r);if(a&&c)fora[String(a)]=String(c)}
  const carteira=[];for(let r=6;r<=1005;r++){const a=v(bc,'A'+r);if(a===undefined||a===''||a===null)continue;carteira.push({pedido:String(a),cliente:v(bc,'C'+r),entrega:ds(v(bc,'F'+r)),kg:Number(v(bc,'G'+r))||0,prensa:v(bc,'H'+r)||'',natural:v(bc,'I'+r)==='NATURAL'})}
  const filas=[];for(let r=6;r<=55;r++){const b=v(fi,'B'+r);if(!b)continue;filas.push({fila:b,cliente:v(fi,'C'+r),pedido:String(v(fi,'D'+r)??''),kg:Number(v(fi,'E'+r))||0,prioridade:v(fi,'F'+r),faturarEm:ds(v(fi,'Q'+r))})}
  const ult=ds(v(pr,'C11'));
  const r=P.calcular({parametros:{inicio:ini,ultimoDiaFaturamento:ult,diasMin:6,dNatural:Number(v(pr,'C12'))||1,capP7:Number(v(pr,'E6'))||0,capP4:Number(v(pr,'E7'))||0,capPintura:Number(v(pr,'E8'))||9000},
   carteira,feriados:[],filas,programacao:programacao.map(x=>({...x})),agrupados:col('Y',8,15),foraCarteira:fora,prioridadePintura:col('AG',8,15)});
  const previsto={};for(const d of r.dias){const m=new Map();d.faturamentoItens.forEach(i=>{const k=curto(i.cliente);m.set(k,(m.get(k)||0)+i.kg)});if(m.size)previsto[d.data]=[...m].map(([cliente,kg])=>({cliente,kg:Math.round(kg)})).sort((a,b)=>b.kg-a.kg)}
  const pedidosDia={};for(const d of r.dias){const a=porPedido(d.faturamentoItens);if(a.length)pedidosDia[d.data]=a}
  // data manual e prioridade das FILAS da planilha passam para as filas da Visão Geral (mesmo cliente)
  const mapa={'FILA DE EMBALAGEM':'EMBALAGEM','FILA DE PINTURA':'PINTURA','EMBALADO EM ESTOQUE':'EMBALADO','FATURAMENTO PREVISTO':'FATURAMENTO HOJE'};
  const nm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
  const quadros=(pub?.quadros||[]).filter(q=>mapa[q.quadro]&&Number(q.kg)>0);
  const faturarEmFila={},prioridadeFila={},semPar=[],hojeImp=dayNow();
  for(const f of filas){const a=nm(f.cliente);if(!a)continue;
   const qs=quadros.filter(q=>mapa[q.quadro]===f.fila&&(nm(q.cliente)===a||nm(q.cliente).startsWith(a+' ')||a.startsWith(nm(q.cliente)+' ')));
   if(!qs.length){if(f.faturarEm&&f.faturarEm>=hojeImp){semPar.push(f.fila+' '+f.cliente);faturarEmFila[f.fila+'|'+f.cliente]=f.faturarEm}continue}
   for(const q of qs){if(f.faturarEm&&f.faturarEm>=hojeImp)faturarEmFila[f.fila+'|'+q.cliente]=f.faturarEm;if(f.fila==='PINTURA'&&Number(f.prioridade)>0){const k=q.cliente;prioridadeFila[k]=Math.min(prioridadeFila[k]||99,Number(f.prioridade))}}}
  return {manual:{programacao,agrupados:col('Y',8,15),prioridadePintura:col('AG',8,15),foraCarteira:fora,faturarEmFila,prioridadeFila,...(ult?{ultimoDiaFaturamento:ult}:{})},previsto,pedidosDia,semPar,total:r.resumo.previstoKg};
 }
 function render(host,ctx,u,modo){
  const montar=modo==='montar';
  const {esc,num,save}=u,d=ctx.data,owner=ctx.owner;
  if(!P){host.insertAdjacentHTML('beforeend','<p class="cv-error">Motor da prévia não carregou. Recarregue a página.</p>');return}
  const pub=ctx.meta?.publicacao||'';
  if(montar&&!owner){host.insertAdjacentHTML('beforeend','<h2>MONTAR PROGRAMAÇÃO</h2><p class="cv-note">Somente o acesso pessoal de Edvaldo monta a programação. A consulta fica em FATURAMENTO › PRÉVIA DE FATURAMENTO.</p>');return}
  if(draftOf!==pub||!draft){draft=structuredClone(d._gestao?.previa||{});draftOf=pub;dirty=false}
  const D=montar?draft:structuredClone(d._gestao?.previa||{});
  D.programacao??=[];D.retirados??=[];D.agrupados??=P.AGRUPADOS_PADRAO.slice();D.prioridadePintura??=[];D.foraCarteira??={};D.prioridadeFila??={};D.faturarEmFila??={};
  const hoje=dayNow(),ini=D.inicio&&D.inicio>hoje?D.inicio:hoje;
  const manual={...D,inicio:ini,programacao:D.programacao.filter(x=>x.dia>=ini),programacaoAnterior:D.programacao.filter(x=>x.dia<ini)};
  const passadas=D.programacao.length-manual.programacao.length;
  let input,r;
  try{input=P.daPublicacao(d,manual);r=P.calcular(input)}catch(e){host.insertAdjacentHTML('beforeend','<p class="cv-error">Não foi possível calcular a prévia: '+esc(e.message)+'</p>');return}
  const ci=input.carteiraInfo||{};const semAcab=input.carteira.length&&ci.fonte==='carteira_atual'&&!(d.resumo_diario?.carteira_atual?.itens||[]).some(x=>x.pintura!==undefined||x.cor||x.beneficiamento);
  const cap=r.parametros.cap,ult=r.ultimoDiaFaturamento,res=r.resumo;
  const t=kg=>(Math.round((kg||0)/100)/10).toLocaleString('pt-BR',{minimumFractionDigits:1})+' t',kg=x=>num(Math.round(x||0));
  const meter=(o,c)=>{const p=Math.round(100*o),w=Math.min(100,p);return '<div class="m" style="--c:'+c+'"><div class="bar'+(p>100?' over':'')+'"><i style="width:'+w+'%"></i></div><em'+(p>100?' class="over"':'')+'>'+p+'%</em></div>'};
  const sitTxt={ESTOUROU:'ESTOUROU','QUASE CHEIO':'QUASE CHEIO','DIA FECHADO':'FECHADO',ABERTO:'ABERTO'};
  const ultimoUtil=Math.max(15,...r.dias.map((x,i)=>x.faturamento>0||x.p7||x.p4||x.pintura?i+1:0));
  const dias=r.dias.slice(0,ultimoUtil);
  let h='<div class="pvx">';
  h+=montar?'<div class="hd"><div><h2>MONTAR PROGRAMAÇÃO</h2><p>Filas atuais da Visão Geral + programação P7/P4 · capacidade P7 '+t(cap.P7)+'/dia · P4 '+t(cap.P4)+'/dia (bruta × 85%) · pintura '+t(cap.Pintura)+'/dia</p></div><div class="imp"><label class="btnf">carga inicial: importar planilha antiga<input type="file" id="pv-xlsx" accept=".xlsx,.xlsm" hidden></label><span>Período até <b>'+esc(br(ult))+'</b></span></div></div>':'<div class="hd"><div><h2>PRÉVIA DE FATURAMENTO</h2><p>Filas atuais da Visão Geral + programação P7/P4 · capacidade P7 '+t(cap.P7)+'/dia · P4 '+t(cap.P4)+'/dia (bruta × 85%) · pintura '+t(cap.Pintura)+'/dia</p></div><div class="imp"><span>Período até <b>'+esc(br(ult))+'</b></span></div></div>';
  if(!montar&&!D.programacao.length&&!Object.keys(D.previsto||{}).length)h+='<div class="dirty">Ainda não há programação gravada no site. A programação ainda não foi montada. Ela é lançada em FATURAMENTO › MONTAR PROGRAMAÇÃO.</div>';
  if(ci.fonte==='carteira_atual')h+='<div class="warn">A publicação não traz a carteira a produzir atualizada. A lista de pedidos usa a carteira antiga ('+esc(d.resumo_diario?.carteira_atual?.atualizado_em||'sem data')+') e pode mostrar pedidos já programados ou faturados.</div>';
  else if(ci.em&&montar)h+='<div class="cv-note">Carteira a produzir de '+esc(String(ci.texto||ci.em).replace('T',' ').slice(0,16))+' · '+esc(ci.rotulo||'')+' · '+ci.itens+' itens. Pedidos programados em dias posteriores já estão descontados.</div>';
  if(semAcab)h+='<div class="warn">A carteira publicada não informa natural/pintado: tudo está sendo tratado como natural.</div>';
  if(montar&&dirty)h+='<div class="dirty">Alterações ainda não publicadas. '+(owner?'Use SALVAR E PUBLICAR no fim da página.':'Somente o acesso do Edvaldo grava.')+'</div>';
  // quadro semanal (formato da planilha): previsto por cliente; dias passados = previsto gravado × realizado (NF Aureon)
  const fmt=x=>num(Math.round(x||0));
  const porCliente=itens=>{const m=new Map();for(const i of itens){const k=curto(i.cliente);m.set(k,(m.get(k)||0)+Number(i.kg||0))}return [...m].map(([cliente,kg])=>({cliente,kg})).sort((a,b)=>b.kg-a.kg)};
  const calc=new Map(r.dias.map(x=>[x.data,x]));
  const prevGravado=D.previsto||{};
  const ign=new Set((d.materiais?.excluir_nf||[]).map(String));
  const realDe=dt=>porCliente((d.materiais?.linhas||[]).filter(n=>String(n.data||'').slice(0,10)===dt&&!ign.has(String(n.nota))&&Number(n.kg)>0));
  const off=new Set(input.feriados||[]);
  const seg=s=>{const t=new Date(s+'T12:00:00Z');t.setUTCDate(t.getUTCDate()-((t.getUTCDay()+6)%7));return t.toISOString().slice(0,10)};
  const soma=(s,n)=>{const t=new Date(s+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)};
  // dias que vieram da planilha importada ficam com o previsto da planilha (referência) até o fim do período dela
  const daPlanilha=new Set(D.previstoPlanilha||[]);
  const congelado=dt=>dt<hoje||(dt===hoje&&Array.isArray(prevGravado[dt]))||(daPlanilha.has(dt)&&Array.isArray(prevGravado[dt]));
  const prevDe=dt=>congelado(dt)?porCliente(prevGravado[dt]||[]):porCliente(calc.get(dt)?.faturamentoItens||[]);
  const semana=(ini,titulo)=>{
   const ds=[0,1,2,3,4].map(i=>soma(ini,i));
   let accP=0,accR=0;
   const cols=ds.map(dt=>{
    const p=prevDe(dt),tp=p.reduce((s,x)=>s+x.kg,0),passou=dt<=hoje,rr=passou?realDe(dt):[],tr=rr.reduce((s,x)=>s+x.kg,0),c=calc.get(dt);
    accP+=tp;accR+=tr;
    const st=dt<hoje?(tr>=tp-1?'ok':'bad'):dt===hoje?'hoje':'fut';
    let o='<div class="col '+st+(off.has(dt)?' feriado':'')+'"><div class="ch"><b>'+esc(wd(dt))+'</b>'+(dt===hoje?'<span class="tag">HOJE</span>':'')+(daPlanilha.has(dt)&&dt>=hoje&&prevGravado[dt]?'<span class="tag" title="Previsto da planilha importada">PLANILHA</span>':'')+(off.has(dt)?'<span class="tag off">SEM EXPEDIENTE</span>':'')+(dt<hoje&&(tp||tr)?'<span class="tag '+(tr>=tp-1?'tok':'tbad')+'">'+(tr>=tp-1?'✓ BATEU':'✕ FALTOU')+'</span>':'')+'</div>';
    o+='<div class="blk prev"><span>PREVISTO</span><b>'+fmt(tp)+' <small>kg</small></b></div>';
    if(passou)o+='<div class="blk real"><span>REALIZADO'+(dt===hoje?' ATÉ AGORA':'')+'</span><b>'+fmt(tr)+' <small>kg</small></b>'+(dt<hoje&&(tp||tr)?'<em class="'+(tr>=tp?'pos':'neg')+'">'+(tr>=tp?'+':'')+fmt(tr-tp)+' kg'+(tp?' · '+Math.round(100*tr/tp)+'%':'')+'</em>':'')+'</div>';
    if(passou&&tp>0)o+='<div class="pbar'+(tr>=tp?' cheio':'')+'"><i style="width:'+Math.min(100,Math.round(100*tr/tp))+'%"></i></div>';
    o+='<div class="acc">Acumulado <b>'+fmt(accP)+'</b>'+(passou?' · real <b>'+fmt(accR)+'</b>':'')+'</div>';
    if(c&&dt>=hoje)o+='<div class="occ">'+[['P7','p7',c.ocupacao.P7],['P4','p4',c.ocupacao.P4],['PINT','pt',c.ocupacao.Pintura]].map(([n,k,v])=>'<span class="oc '+k+(v>1?' over':'')+'">'+n+' '+Math.round(100*v)+'%</span>').join('')+'</div>';
    if(dt<hoje&&!prevGravado[dt])o+='<div class="occ">previsto não gravado neste dia</div>';
    o+='<table><tbody>'+p.map(x=>'<tr><td>'+esc(x.cliente)+'</td><td class="n">'+fmt(x.kg)+'</td></tr>').join('')+(p.length?'':'<tr><td colspan="2" class="vz">—</td></tr>')+'</tbody></table>';
    if(passou&&rr.length)o+='<div class="rl">Realizado (NF)</div><table class="r"><tbody>'+rr.map(x=>'<tr><td>'+esc(x.cliente)+'</td><td class="n">'+fmt(x.kg)+'</td></tr>').join('')+'</tbody></table>';
    return o+'</div>'});
   return '<div class="band">'+titulo+'<span>previsto '+fmt(accP)+' kg'+(accR?' · realizado '+fmt(accR)+' kg':'')+'</span></div><div class="board">'+cols.join('')+'</div>';
  };
  const s1=seg(hoje),s2=soma(s1,7),s3=soma(s1,14);
  if(!montar)h+=semana(s1,'SEMANA '+br(s1)+' A '+br(soma(s1,4)));
  if(!montar)h+='<details><summary>SEMANA '+br(s2)+' A '+br(soma(s2,4))+'<span>abrir segunda semana</span></summary><div class="in">'+semana(s2,'SEMANA '+br(s2)+' A '+br(soma(s2,4)))+'</div></details>';
  if(!montar)h+='<details><summary>SEMANA '+br(s3)+' A '+br(soma(s3,4))+'<span>abrir terceira semana</span></summary><div class="in">'+semana(s3,'SEMANA '+br(s3)+' A '+br(soma(s3,4)))+'</div></details>';
  h+='<div class="kpis">'+[['Previsto até '+br(ult),fmt(res.previstoKg)+' kg'],['Aguardando fechar 100%',fmt(res.aguardando100Kg)+' kg'],['Fatura depois de '+br(ult),fmt(res.depoisDoPeriodoKg)+' kg'],['Pedidos · clientes (programação)',res.pedidos+' · '+res.clientes]].map(([l,v])=>'<div class="kpi"><span>'+esc(l)+'</span><b>'+esc(v)+'</b></div>').join('')+'</div>';
  {const itens=[];for(const x of r.dias)if(!ult||x.data<=ult)for(const it of x.faturamentoItens)itens.push({data:x.data,...it});
   const tot=new Map();itens.forEach(it=>tot.set(it.origem,(tot.get(it.origem)||0)+it.kg));
   const exp={'PROGRAMAÇÃO':'ainda vai ser produzido: linhas lançadas na programação','FATURAMENTO HOJE':'já pronto, quadro faturamento previsto','EMBALADO':'já embalado em estoque','EMBALAGEM':'já extrudado, falta embalar','PINTURA':'na fila de pintura'};
   const total=itens.reduce((s,x)=>s+x.kg,0),ret=new Map();for(const x of r.dias)if(!ult||x.data<=ult)for(const it of x.excluidos||[])ret.set(it.cliente,(ret.get(it.cliente)||0)+it.kg);
   for(const c of D.retirados)if(!ret.has(c)&&![...ret.keys()].some(k=>k.toUpperCase().includes(c.toUpperCase())))ret.set(c,0);
   const gm=new Map();for(const it of itens){const k=it.data+'|'+it.cliente,o=gm.get(k)||{data:it.data,cliente:it.cliente,kg:0,o:new Set(),p:new Set(),r:new Set()};o.kg+=it.kg;o.o.add(it.origem);if(it.pedido)o.p.add(it.pedido);if(it.regra)o.r.add(it.regra);gm.set(k,o)}
   const grupos=[...gm.values()].map(o=>({data:o.data,cliente:o.cliente,kg:o.kg,origem:[...o.o].join(' + '),pedido:[...o.p].join(', '),regra:[...o.r].join(' · ')})).sort((a,b)=>a.data.localeCompare(b.data)||b.kg-a.kg);
   h+='<details id="pv-orig"'+(abertoOrig?' open':'')+'><summary>DE ONDE VEM O PREVISTO<span>'+fmt(total)+' kg até '+esc(br(ult))+' · '+itens.length+' itens · '+grupos.length+' linhas por cliente/dia · abra para conferir</span></summary><div class="in"><div class="chips">'+[...tot].sort((a,b)=>b[1]-a[1]).map(([o,v])=>'<span><b>'+esc(o)+'</b> '+fmt(v)+' kg <em>('+esc(exp[o]||'fila')+')</em></span>').join('')+'</div>'+(D.retirados.length?'<div class="warn">RETIRADOS DO PREVISTO (não contam nos números acima): '+D.retirados.map(c=>{const kgR=[...ret].filter(([k])=>k.toUpperCase().includes(c.toUpperCase())).reduce((s,[,v])=>s+v,0);return '<b>'+esc(c)+'</b> '+fmt(kgR)+' kg'+(montar?' <button type="button" class="lnk" data-pv-volta="'+esc(c)+'">voltar</button>':'')}).join(' · ')+'</div>':'')+'<div class="wrap"><table><thead><tr><th>Fatura em</th><th>Origem</th><th>Pedido</th><th>Cliente</th><th class="n">kg</th><th>Regra</th>'+(montar?'<th></th>':'')+'</tr></thead><tbody>'+grupos.map(it=>'<tr><td>'+esc(wd(it.data))+'</td><td>'+esc(it.origem)+'</td><td>'+esc(it.pedido||'—')+'</td><td>'+esc(curto(it.cliente))+'</td><td class="n">'+fmt(it.kg)+'</td><td>'+esc(it.regra||'—')+'</td>'+(montar?'<td><button type="button" class="lnk" data-pv-ret="'+esc(it.cliente)+'" title="Tira este cliente do previsto">tirar do previsto</button></td>':'')+'</tr>').join('')+'</tbody></table></div></div></details>'}
  // ===== MONTAR PROGRAMAÇÃO (substitui a aba PROGRAMAÇÃO da planilha) =====
  if(montar){
  const carteira=new Map();input.carteira.forEach(c=>{const p=String(c.pedido);if(!carteira.has(p))carteira.set(p,c.cliente)});
  const diasProg=r.dias.slice(0,Math.max(15,ultimoUtil)).filter(x=>x.data>=hoje);
  if(!diasProg.some(x=>x.data===selDia))selDia=diasProg[0]?.data;
  const dSel=r.dias.find(x=>x.data===selDia)||diasProg[0];
  const comAlerta=r.linhas.filter(l=>l.alertas.length).length;
  h+='<div class="band">MONTAR PROGRAMAÇÃO — DIA A DIA<span>escolha o dia, lance pedido e kg na P7/P4; a prévia recalcula na hora'+(passadas?' · '+passadas+' linha(s) de dias passados ficam fora da conta (já estão nas filas)':'')+'</span></div>';
  h+='<div class="tabs">'+diasProg.map(x=>{const n=r.linhas.filter(l=>l.data===x.data).length;return '<button type="button" class="tab '+x.situacao.split(' ').pop()+(x.data===selDia?' sel':'')+'" data-pv-tab="'+x.data+'"><b>'+esc(wd(x.data))+'</b><span>P7 '+Math.round(100*x.ocupacao.P7)+'% · P4 '+Math.round(100*x.ocupacao.P4)+'%</span><span>P7 '+fmt(x.p7)+' kg · P4 '+fmt(x.p4)+' kg</span><small>'+n+' pedido'+(n===1?'':'s')+'</small></button>'}).join('')+'</div>';
  if(dSel){
   const gauge=(nome,cor,usado,capd,extra)=>{const o=capd?usado/capd:0,p=Math.round(100*o);return '<div class="gauge" style="--c:'+cor+'"><div class="gh"><b>'+nome+'</b><span>'+fmt(usado)+' / '+fmt(capd)+' kg</span></div><div class="bar'+(o>1?' over':'')+'"><i style="width:'+Math.min(100,p)+'%"></i></div><div class="gf"><em class="'+(o>1?'over':o>=0.9?'warn':'okk')+'">'+p+'%</em><span>'+(capd-usado>=0?'sobra <b>'+fmt(capd-usado)+'</b> kg':'<b class="neg">estourou '+fmt(usado-capd)+' kg</b>')+'</span></div>'+(extra||'')+'</div>'};
   const capT={P7:cap.P7/2,P4:cap.P4/2},usoT={Dia:{p7:0,p4:0},Noite:{p7:0,p4:0}};
   const doDia=r.linhas.filter(l=>l.data===dSel.data);
   doDia.forEach(l=>{if(l.turno==='Dia'||l.turno==='Noite'){usoT[l.turno].p7+=l.p7;usoT[l.turno].p4+=l.p4}});
   doDia.forEach(l=>{if(l.turno==='Dia'||l.turno==='Noite'){l.tf=l.turno;return}
    const d=usoT.Dia,cabe=d.p7+l.p7<=capT.P7+1&&d.p4+l.p4<=capT.P4+1,t=cabe?'Dia':'Noite';l.tf=t;l.auto=true;usoT[t].p7+=l.p7;usoT[t].p4+=l.p4});
   const sobraT={Dia:{P7:capT.P7-usoT.Dia.p7,P4:capT.P4-usoT.Dia.p4},Noite:{P7:capT.P7-usoT.Noite.p7,P4:capT.P4-usoT.Noite.p4}};
   h+='<div class="dayp"><div class="gauges">'+gauge('P7 · DIA','var(--p7)',usoT.Dia.p7,capT.P7)+gauge('P7 · NOITE','var(--p7)',usoT.Noite.p7,capT.P7)+gauge('P4 · DIA','var(--p4)',usoT.Dia.p4,capT.P4)+gauge('P4 · NOITE','var(--p4)',usoT.Noite.p4,capT.P4)+gauge('PINTURA','var(--pt)',dSel.pintura,cap.Pintura,'<div class="gx">fila '+fmt(dSel.pinturaFila)+' · novo '+fmt(dSel.pinturaNovo)+'</div>')+'<div class="gauge fat"><div class="gh"><b>FATURA NO DIA</b></div><div class="fv">'+fmt(dSel.faturamento)+' <small>kg</small></div><div class="gx">'+dSel.faturamentoItens.length+' pedido(s)/fila(s)</div></div></div>';
   const cab='<thead><tr><th>#</th><th>Pedido</th><th>Cliente</th><th>Entrega</th><th class="n">Cart. P7</th><th class="n">Cart. P4</th><th>Prog. P7</th><th>Prog. P4</th><th>Acab.</th><th>Fatura em</th><th>Faturar em (manual)</th><th>Status / alertas</th><th>Turno</th><th></th></tr></thead>';
   const linhaHtml=(l,i)=>'<tr><td>'+(i+1)+'</td><td><b>'+esc(l.pedido)+'</b></td><td>'+esc(curto(l.cliente))+'</td><td>'+esc(br(l.entrega))+'</td><td class="n">'+fmt(l.carteiraP7)+'</td><td class="n">'+fmt(l.carteiraP4)+'</td><td><input class="yl" type="number" min="0" step="1" data-pv-ed="'+l.ordem+'|p7" value="'+(l.p7||'')+'"></td><td><input class="yl" type="number" min="0" step="1" data-pv-ed="'+l.ordem+'|p4" value="'+(l.p4||'')+'"></td><td><span class="ac '+l.acabamento+'">'+esc(l.acabamento.slice(0,3))+'</span></td><td><b>'+esc(l.faturaEm?br(l.faturaEm):l.regra)+'</b></td><td><input class="yl" type="date" data-pv-ed="'+l.ordem+'|faturarEm" value="'+esc(l.faturarEm||'')+'"></td><td>'+(l.alertas.length?'<span class="al">'+l.alertas.map(esc).join(' · ')+'</span>':'<span class="ok">✔ OK</span>')+'</td><td><select data-pv-ed="'+l.ordem+'|turno"><option value="Dia"'+(l.tf==='Dia'?' selected':'')+'>Dia</option><option value="Noite"'+(l.tf==='Noite'?' selected':'')+'>Noite</option></select></td><td><button type="button" class="lnk" data-pv-del="'+l.ordem+'">remover</button></td></tr>';
   ['Dia','Noite'].forEach(t=>{const ls=doDia.filter(l=>l.tf===t);h+='<div class="turno '+t.toLowerCase()+'"><div class="th">TURNO '+t.toUpperCase()+' · P7 '+fmt(usoT[t].p7)+' / '+fmt(capT.P7)+' kg · P4 '+fmt(usoT[t].p4)+' / '+fmt(capT.P4)+' kg</div><div class="wrap"><table class="prog">'+cab+'<tbody>'+(ls.length?ls.map(linhaHtml).join(''):'<tr><td colspan="14" class="vz">nenhum pedido neste turno</td></tr>')+'</tbody></table></div></div>'});
   h+='<div class="wrap"><table class="prog"><tbody><tr class="novo"><td colspan="14"><form class="row" id="pv-add"><input type="hidden" name="dia" value="'+dSel.data+'"><label>Pedido<input class="yl" name="pedido" required pattern="[0-9]+" list="pv-ped" autocomplete="off" style="width:90px"></label><datalist id="pv-ped">'+r.saldos.map(x=>'<option value="'+esc(x.pedido)+'" label="'+esc(curto(x.cliente)+' · P7 '+fmt(x.faltaP7)+' · P4 '+fmt(x.faltaP4)+' · total '+fmt(x.falta))+'">'+esc(curto(x.cliente)+' · P7 '+fmt(x.faltaP7)+' · P4 '+fmt(x.faltaP4)+' · total '+fmt(x.falta))+'</option>').join('')+'</datalist><label class="aprog">A programar P7<output id="pv-f7" class="sal">—</output></label><label>Prog. P7 kg<input class="yl" name="p7" type="number" min="0" step="1"></label><label class="aprog">A programar P4<output id="pv-f4" class="sal">—</output></label><label>Prog. P4 kg<input class="yl" name="p4" type="number" min="0" step="1"></label><label>Turno<select name="turno"><option>Dia</option><option>Noite</option></select></label><label>Faturar em (manual)<input class="yl" name="faturarEm" type="date"></label><button>LANÇAR EM '+esc(wd(dSel.data).toUpperCase())+'</button></form><div id="pv-hint" class="hint">Digite ou escolha o pedido: o que falta programar aparece nos quadros A PROGRAMAR P7 e P4.</div></td></tr></tbody></table></div>';
   // sugestões ao lado: o que falta programar, entrega mais antiga primeiro
   h+='<div class="sugs">'+['P7','P4'].map(pr=>{const s=r.sugestoes[pr].slice(0,12),tt=sobraT.Dia[pr]>1?'Dia':'Noite',sobra=Math.max(0,sobraT[tt][pr]);return '<div class="sug" style="--c:var(--'+pr.toLowerCase()+')"><div class="sh">SUGESTÕES '+pr+' <span>sobra Dia '+fmt(Math.max(0,sobraT.Dia[pr]))+' · Noite '+fmt(Math.max(0,sobraT.Noite[pr]))+' kg</span></div><table><tbody>'+s.map(x=>'<tr><td><b>'+esc(x.pedido)+'</b> '+esc(curto(x.cliente))+'</td><td>'+esc(br(x.entrega))+(x.entrega&&x.entrega<hoje?' <span class="al">atras.</span>':'')+'</td><td><span class="ac '+x.acabamento+'">'+esc(x.acabamento.slice(0,3))+'</span></td><td class="n">'+fmt(x.falta)+'</td><td><button type="button" class="plus" data-pv-sug="'+esc(pr+'|'+x.pedido+'|'+Math.round(Math.min(x.falta,sobra||x.falta))+'|'+tt)+'">+ lançar</button></td></tr>').join('')+'</tbody></table></div>'}).join('')+'</div></div>';
  }
  h+='<details><summary>TODA A PROGRAMAÇÃO<span>'+r.linhas.length+' linhas'+(comAlerta?' · '+comAlerta+' com alerta':'')+'</span></summary><div class="in">';
  h+='<div class="wrap"><table><thead><tr><th>Dia</th><th>Pedido</th><th>Cliente</th><th class="n">P7</th><th class="n">P4</th><th>Acab.</th><th>Fatura</th><th>Alertas</th><th></th></tr></thead><tbody>'+r.linhas.map(l=>'<tr><td>'+esc(wd(l.data))+'</td><td>'+esc(l.pedido)+'</td><td>'+esc(l.cliente)+'</td><td class="n">'+(l.p7?kg(l.p7):'')+'</td><td class="n">'+(l.p4?kg(l.p4):'')+'</td><td>'+esc(l.acabamento.slice(0,3))+(l.pintaAte?' <small>pinta '+esc(br(l.pintaAte))+'</small>':'')+'</td><td><b>'+esc(l.faturaEm?br(l.faturaEm):l.regra)+'</b>'+(l.faturarEm?' <small>manual</small>':'')+'</td><td>'+(l.alertas.length?'<span class="al">'+l.alertas.map(esc).join(' · ')+'</span>':'<span class="ok">OK</span>')+'</td><td><button type="button" class="lnk" data-pv-del="'+l.ordem+'">remover</button></td></tr>').join('')+'</tbody></table></div></div></details>';
  // filas
  const totFila=r.filas.reduce((s,f)=>s+f.kg,0);
  h+='<details><summary>FILAS ATUAIS (já produzido)<span>'+r.filas.length+' linhas · '+t(totFila)+' · vêm da Visão Geral</span></summary><div class="in"><div class="wrap"><table><thead><tr><th>Fila</th><th>Cliente</th><th class="n">kg</th><th>Prioridade pintura</th><th>Faturar em (manual)</th><th>Fatura</th></tr></thead><tbody>'+r.filas.map(f=>{const k=f.fila+'|'+f.cliente;return '<tr><td>'+esc(f.fila.toLowerCase())+'</td><td>'+esc(f.cliente)+'</td><td class="n">'+kg(f.kg)+'</td><td>'+(f.fila==='PINTURA'?'<input type="number" min="1" step="1" data-pv-prio="'+esc(f.cliente)+'" value="'+esc(D.prioridadeFila[f.cliente]??'')+'" placeholder="99">':'')+'</td><td><input type="date" data-pv-fat="'+esc(k)+'" value="'+esc(D.faturarEmFila[k]||'')+'"></td><td><b>'+esc(f.faturaEm?wd(f.faturaEm):f.regra)+'</b></td></tr>'}).join('')+'</tbody></table></div></div></details>';
  // pendentes
  h+='<details><summary>PEDIDOS PENDENTES<span>'+r.pendentes.length+' pedidos com entrega até '+esc(br(ult))+' ainda sem programar · '+t(r.pendentes.reduce((s,x)=>s+x.falta,0))+'</span></summary><div class="in"><div class="wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th class="n">P7</th><th class="n">P4</th><th class="n">Pintado</th><th class="n">Falta programar</th></tr></thead><tbody>'+r.pendentes.map(x=>'<tr><td>'+esc(x.pedido)+'</td><td>'+esc(x.cliente)+'</td><td>'+esc(br(x.entrega))+(x.atrasado?' <span class="al">atrasado</span>':'')+'</td><td class="n">'+kg(x.P7)+'</td><td class="n">'+kg(x.P4)+'</td><td class="n">'+kg(x.pintado)+'</td><td class="n"><b>'+kg(x.falta)+'</b></td></tr>').join('')+'</tbody></table></div></div></details>';
  for(const pr of ['P7','P4']){const s=r.sugestoes[pr],falta=s.reduce((a,x)=>a+x.falta,0);
   h+='<details><summary>SUGESTÕES '+pr+'<span>'+s.length+' pedidos · falta '+t(falta)+' = '+(cap[pr]?(falta/cap[pr]).toLocaleString('pt-BR',{maximumFractionDigits:1}):'—')+' dias de prensa · entrega mais antiga primeiro</span></summary><div class="in"><div class="wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Acab.</th><th class="n">Saldo</th><th class="n">Programado</th><th class="n">Falta</th></tr></thead><tbody>'+s.slice(0,150).map(x=>'<tr><td>'+esc(x.pedido)+'</td><td>'+esc(x.cliente)+'</td><td>'+esc(br(x.entrega))+(x.entrega&&x.entrega<dias[0].data?' <span class="al">atrasado</span>':'')+'</td><td>'+esc(x.acabamento.slice(0,3))+'</td><td class="n">'+kg(x.saldo)+'</td><td class="n">'+kg(x.programado)+'</td><td class="n"><b>'+kg(x.falta)+'</b></td></tr>').join('')+'</tbody></table></div></div></details>'}
  h+='<details open><summary>CONTROLES DA PRÉVIA<span>clientes agrupados, prioridade na pintura, pedidos fora da carteira, último dia</span></summary><div class="in"><form id="pv-cfg"><div class="cfg"><label>Clientes com faturamento agrupado (um por linha)<textarea name="agrupados">'+esc(D.agrupados.join('\n'))+'</textarea></label><label>Prioridade na pintura (pedido ou cliente)<textarea name="prioridade">'+esc(D.prioridadePintura.join('\n'))+'</textarea></label><label>Pedidos fora da carteira (pedido;cliente)<textarea name="fora">'+esc(Object.entries(D.foraCarteira).map(([k,v])=>k+';'+v).join('\n'))+'</textarea></label><label>Último dia de faturamento<input name="ultimo" type="date" value="'+esc(D.ultimoDiaFaturamento||ult||'')+'"><button type="submit" style="margin-top:8px">APLICAR</button></label></div></form>';
  h+='<div class="note">Regras: natural fatura no dia útil seguinte à produção · pintado fatura no dia seguinte ao fim da pintura (fila atual primeiro) · pedido normal só fatura com 100% programado, na última produção · clientes agrupados faturam tudo junto · data manual vence · fora da carteira = natural · calendário sem fim de semana, feriado e recesso.</div></div></details>';
  h+='<div class="save">'+(owner?'<label>Motivo<input id="pv-obs" placeholder="Ex.: programação de 26/11" style="width:240px"></label><button id="pv-save">SALVAR E PUBLICAR PRÉVIA</button>':'')+'<button id="pv-reset" type="button" class="sec">DESCARTAR ALTERAÇÕES</button></div>';
  }else h+='<div class="note">Consulta. A programação e os controles são montados em FATURAMENTO › MONTAR PROGRAMAÇÃO (acesso do Edvaldo).</div>';
  h+='</div>';
  host.insertAdjacentHTML('beforeend',h);
  host.querySelector('#pv-orig')?.addEventListener('toggle',e=>{abertoOrig=e.target.open});
  if(!montar)return;
  const again=()=>{dirty=true;host.innerHTML='<p id="cv-status" role="status"></p>';render(host,ctx,u,modo)};
  {const f=host.querySelector('#pv-add').elements,hint=host.querySelector('#pv-hint'),o7=host.querySelector('#pv-f7'),o4=host.querySelector('#pv-f4'),mapa=new Map(r.saldos.map(x=>[String(x.pedido),x]));
   const mostrar=()=>{const x=mapa.get(f.pedido.value.trim());
    if(!f.pedido.value.trim()){hint.textContent='Digite ou escolha o pedido: o que falta programar aparece nos quadros A PROGRAMAR P7 e P4.';f.p7.placeholder='';f.p4.placeholder='';o7.textContent='—';o4.textContent='—';o7.className=o4.className='sal';return}
    if(!x){hint.innerHTML='<b>'+esc(f.pedido.value.trim())+'</b>: sem saldo a programar na carteira (já programado, atendido ou fora da carteira).';f.p7.placeholder='';f.p4.placeholder='';o7.textContent='0';o4.textContent='0';o7.className=o4.className='sal zero';return}
    f.p7.placeholder='';f.p4.placeholder='';o7.textContent=fmt(x.faltaP7);o4.textContent=fmt(x.faltaP4);o7.className='sal p7'+(x.faltaP7<1?' zero':'');o4.className='sal p4'+(x.faltaP4<1?' zero':'');
    hint.innerHTML='<b>'+esc(x.pedido)+'</b> · '+esc(curto(x.cliente))+' · entrega '+esc(x.entrega?br(x.entrega):'—')+' — a programar: <b>total '+fmt(x.falta)+' kg</b>'+(x.progP7+x.progP4>0?' <span class="hs">(carteira P7 '+fmt(x.carteiraP7)+' · P4 '+fmt(x.carteiraP4)+'; já lançado P7 '+fmt(x.progP7)+' · P4 '+fmt(x.progP4)+')</span>':'')};
   f.pedido.addEventListener('input',mostrar);f.pedido.addEventListener('change',mostrar)}
  host.querySelector('#pv-add').onsubmit=e=>{e.preventDefault();const f=e.target.elements,p7=Number(f.p7.value||0),p4=Number(f.p4.value||0);
   if(p7<0||p4<0||p7+p4<=0){u.show('Informe o kg em P7 e/ou P4.');return}
   D.programacao.push({dia:f.dia.value,pedido:f.pedido.value.trim(),p7,p4,turno:f.turno.value,...(f.faturarEm.value?{faturarEm:f.faturarEm.value}:{})});again()};
  host.querySelectorAll('[data-pv-ret]').forEach(b=>b.onclick=()=>{const c=b.dataset.pvRet;if(!D.retirados.includes(c))D.retirados.push(c);again()});
  host.querySelectorAll('[data-pv-volta]').forEach(b=>b.onclick=()=>{D.retirados=D.retirados.filter(x=>x!==b.dataset.pvVolta);again()});
  host.querySelectorAll('[data-pv-tab]').forEach(b=>b.onclick=()=>{selDia=b.dataset.pvTab;host.innerHTML='<p id="cv-status" role="status"></p>';render(host,ctx,u,modo)});
  host.querySelectorAll('[data-pv-ed]').forEach(i=>i.onchange=()=>{const [o,f]=i.dataset.pvEd.split('|'),l=manual.programacao[Number(o)];if(!l)return;
   if(f==='turno'){l.turno=i.value}else if(f==='faturarEm'){if(i.value)l.faturarEm=i.value;else delete l.faturarEm}else l[f]=Math.max(0,Number(i.value)||0);
   if(!(Number(l.p7)+Number(l.p4)>0))D.programacao.splice(D.programacao.indexOf(l),1);again()});
  host.querySelectorAll('[data-pv-sug]').forEach(b=>b.onclick=()=>{const [pr,ped,kgv,tur]=b.dataset.pvSug.split('|');D.programacao.push({dia:selDia,turno:tur||'Dia',pedido:ped,p7:pr==='P7'?Number(kgv):0,p4:pr==='P4'?Number(kgv):0});again()});
  host.querySelectorAll('[data-pv-del]').forEach(b=>b.onclick=()=>{const l=manual.programacao[Number(b.dataset.pvDel)];D.programacao.splice(D.programacao.indexOf(l),1);again()});
  host.querySelectorAll('[data-pv-prio]').forEach(i=>i.onchange=()=>{const v=Number(i.value);if(v>0)D.prioridadeFila[i.dataset.pvPrio]=v;else delete D.prioridadeFila[i.dataset.pvPrio];again()});
  host.querySelectorAll('[data-pv-fat]').forEach(i=>i.onchange=()=>{if(i.value)D.faturarEmFila[i.dataset.pvFat]=i.value;else delete D.faturarEmFila[i.dataset.pvFat];again()});
  host.querySelector('#pv-cfg').onsubmit=e=>{e.preventDefault();const f=e.target.elements,lines=s=>s.split('\n').map(x=>x.trim()).filter(Boolean);
   D.agrupados=lines(f.agrupados.value);D.prioridadePintura=lines(f.prioridade.value);
   const fora={};for(const l of lines(f.fora.value)){const [p,...c]=l.split(';');if(/^\d+$/.test(p.trim())&&c.join(';').trim())fora[p.trim()]=c.join(';').trim()}D.foraCarteira=fora;
   if(f.ultimo.value)D.ultimoDiaFaturamento=f.ultimo.value;again()};
  host.querySelector('#pv-xlsx').onchange=async e=>{const f=e.target.files[0];if(!f)return;u.show('Lendo a planilha…',true);
   try{const x=await importarPlanilha(f,d);Object.assign(draft,x.manual);D.previsto={...(D.previsto||{}),...x.previsto};D.previstoPlanilha=Object.keys(x.previsto).filter(k=>!x.manual.ultimoDiaFaturamento||k<=x.manual.ultimoDiaFaturamento).sort();D.pedidosDia={...(D.pedidosDia||{}),...x.pedidosDia};dirty=true;host.innerHTML='<p id="cv-status" role="status"></p>';render(host,ctx,u,modo);u.show('Planilha importada: '+x.manual.programacao.length+' linhas de programação, previsto de '+Object.keys(x.previsto).length+' dias (hoje e dias passados ficam congelados como na planilha) e '+Object.keys(x.manual.faturarEmFila).length+' datas manuais das filas.'+(x.semPar.length?' Guardadas pelo nome do cliente (sem fila igual hoje): '+x.semPar.join(', ')+'.':'')+' Confira e use SALVAR E PUBLICAR.',true)}
   catch(err){u.show('Não foi possível importar: '+err.message)}};
  host.querySelector('#pv-reset').onclick=()=>{draft=null;dirty=false;host.innerHTML='<p id="cv-status" role="status"></p>';render(host,ctx,u,modo)};
  if(owner)host.querySelector('#pv-save').onclick=()=>{const obs=host.querySelector('#pv-obs').value.trim();if(!obs){u.show('Informe o motivo.');return}
   {const pub0=(d._gestao?.previa?.programacao||[]).filter(x=>x.dia>=hoje),novas=D.programacao.filter(x=>x.dia>=hoje),perdidas=pub0.length-novas.length;
    if(perdidas>0&&!confirm('Atenção: esta gravação remove '+perdidas+' linha(s) de programação de hoje em diante ('+pub0.length+' publicadas, '+novas.length+' agora). Deseja gravar mesmo assim?'))return}
   const fixo=new Set(D.previstoPlanilha||[]);
   const prev={};for(const [k,v]of Object.entries(D.previsto||{}))if((k<=hoje||fixo.has(k))&&k>=soma(s1,-35))prev[k]=v;
   for(const x of r.dias)if(!fixo.has(x.data)&&(x.data>hoje||(x.data===hoje&&!prev[hoje]))&&x.data<=soma(s1,25))prev[x.data]=porCliente(x.faturamentoItens).map(i=>({cliente:i.cliente,kg:Math.round(i.kg)}));
   // por pedido: alimenta o quadro "faturamento do dia" de MATERIAIS FATURADOS
   const ped={};for(const [k,v]of Object.entries(D.pedidosDia||{}))if((k<=hoje||fixo.has(k))&&k>=soma(s1,-35))ped[k]=v;
   for(const x of r.dias)if(!fixo.has(x.data)&&(x.data>hoje||(x.data===hoje&&!ped[hoje]))&&x.data<=soma(s1,25)){const a=porPedido(x.faturamentoItens);if(a.length)ped[x.data]=a}
   const body={action:'previa',previa:{...structuredClone(draft),previsto:prev,pedidosDia:ped},obs};draftOf=null;save(body)};
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
   return {dia:x.dia,pedido:String(x.pedido),p7,p4,...(x.turno==='Dia'||x.turno==='Noite'?{turno:x.turno}:{}),...(x.faturarEm?{faturarEm:x.faturarEm}:{})}});
  const list=a=>(Array.isArray(a)?a:[]).map(x=>String(x).trim()).filter(Boolean).slice(0,100);
  const fora={};for(const [k,v]of Object.entries(p.foraCarteira||{}))if(/^\d+$/.test(k)&&String(v).trim())fora[k]=String(v).trim();
  const prio={};for(const [k,v]of Object.entries(p.prioridadeFila||{}))if(Number.isInteger(Number(v))&&Number(v)>0)prio[k]=Number(v);
  const fat={};for(const [k,v]of Object.entries(p.faturarEmFila||{}))if(okDate(v))fat[k]=v;
  if(p.ultimoDiaFaturamento&&!okDate(p.ultimoDiaFaturamento))throw Error('Último dia de faturamento inválido.');
  const previsto={};for(const [k,v]of Object.entries(p.previsto||{}).slice(0,80))if(okDate(k)&&Array.isArray(v))previsto[k]=v.slice(0,200).map(x=>({cliente:String(x.cliente||'').slice(0,120),kg:Number(x.kg)||0})).filter(x=>x.kg>0);
  const pedidosDia={};for(const [k,v]of Object.entries(p.pedidosDia||{}).slice(0,80))if(okDate(k)&&Array.isArray(v))pedidosDia[k]=v.slice(0,300).map(x=>({pedido:/^\d+$/.test(String(x.pedido||''))?String(x.pedido):'',cliente:String(x.cliente||'').slice(0,120),kg:Number(x.kg)||0,origem:String(x.origem||'').slice(0,40)})).filter(x=>x.kg>0);
  const previstoPlanilha=(Array.isArray(p.previstoPlanilha)?p.previstoPlanilha:[]).filter(okDate).slice(0,60);
  return {previsto,pedidosDia,previstoPlanilha,programacao:prog,agrupados:list(p.agrupados),retirados:list(p.retirados),prioridadePintura:list(p.prioridadePintura),foraCarteira:fora,prioridadeFila:prio,faturarEmFila:fat,...(p.ultimoDiaFaturamento?{ultimoDiaFaturamento:p.ultimoDiaFaturamento}:{})};
 }
 window.previaView={render,validar};
})();
