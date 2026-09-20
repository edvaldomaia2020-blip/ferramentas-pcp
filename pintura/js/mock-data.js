import{importarB08}from'./b08-service.js';
import{formarLote,registrarRecebimento,iniciarProcesso,finalizarEmbalagem}from'./model.js';
export const USERS={pcp:{uid:'demo-pcp',nome:'Edvaldo · PCP',perfil:'pcp'},recebimento:{uid:'demo-rec',nome:'Carlos · Recebimento',perfil:'pintura'},operador:{uid:'demo-op',nome:'João · Pintura',perfil:'pintura'},embalagem:{uid:'demo-emb',nome:'Maria · Embalagem',perfil:'pintura'}};
const at=h=>new Date(Date.now()-h*3600000).toISOString();
const row=(volume,pedido,item,cliente,equipe,ferramenta,pecas,peso,cor,beneficiador='001533')=>({VOLUME:volume,PEDIDO:pedido,ITEM:item,CLIENTE:cliente,DATA:'20/09/2026',EQUIPE:equipe,BENEFICIADOR:beneficiador,FERRAMENTA:ferramenta,AMARRA:`A-${volume}`,PEÇAS:String(pecas),'PESO LÍQUIDO':String(peso).replace('.',','),COMPRIMENTO:'6000',BENEFICIAMENTO:cor,ENTREGA:'28/09/2026'});
export const B08_ROWS=[
 row('A1001','PV-8431','10','PRADO','A','EIR-033',144,272,'BRANCO RAL 9003'),row('A1002','PV-8431','10','PRADO','A','EIR-033',112,366.5,'BRANCO RAL 9003'),
 row('A1010','PV-8432','20','PRADO','A','EIR-077',176,421,'PRETO RAL 9005'),row('A1011','PV-8433','10','PRADO','A','EIR-088',96,310,'BRONZE'),
 row('A1020','PV-8440','10','PRADO','A','EIR-090',120,460.7,'CINZA RAL 7040'),row('P1020','PV-8440','10','PRADO','P','EIR-090',120,455,'CINZA RAL 7040'),
 row('A2001','PV-8450','10','METALSEG','A','MT-210',96,388.8,'PRETO RAL 9005'),row('A2002','PV-8450','20','METALSEG','A','MT-211',84,340.2,'PRETO RAL 9005'),
 row('A3001','PV-8463','10','QUALITY','A','QL-114',120,510,'BRONZE'),row('P3001','PV-8463','10','QUALITY','P','QL-114',120,505,'BRONZE'),
 row('A4001','PV-8470','10','ALUMÍNIO SUL','A','AS-010',200,800,'BRANCO RAL 9003'),row('P4001','PV-8470','10','ALUMÍNIO SUL','P','AS-010',200,790,'BRANCO RAL 9003'),
 row('N9001','PV-9000','10','CLIENTE NATURAL','A','NT-001',300,900,'NATURAL','00200')
];
export function createMockData(){const day1=importarB08([],B08_ROWS.filter(r=>r.EQUIPE!=='P'),at(90));let volumes=day1.volumes,lotes=[],eventos=[];const form=(ids,input,h)=>{const r=formarLote(volumes.filter(v=>ids.includes(v.volume)),input,USERS.pcp,at(h));volumes=volumes.map(v=>r.volumes.find(x=>x.id===v.id)||v);lotes.push(r.lote);eventos.push(r.evento);return r.lote;};const replace=r=>{lotes=lotes.map(l=>l.id===r.lote.id?r.lote:l);eventos.push(r.evento);return r.lote;};
 let a=form(['A1001','A1002'],{numero:'PNT-PRADO-01',prioridade:'Urgente'},70);a=replace(registrarRecebimento(a,{quantidadeVolumes:2,pecas:256,kg:638.5},USERS.recebimento,at(55)));a=replace(iniciarProcesso(a,{pecas:256,kg:638.5},USERS.operador,at(50)));a=replace(finalizarEmbalagem(a,{pecasBoas:249,kg:622,perda:4,retrabalho:3,divergencia:0,motivo:'Quatro peças amassadas e três separadas para repintura.'},USERS.embalagem,at(43)));
 let b=form(['A1010'],{numero:'PNT-PRADO-02',prioridade:'Alta'},28);b=replace(registrarRecebimento(b,{quantidadeVolumes:1,pecas:176,kg:421},USERS.recebimento,at(20)));b=replace(iniciarProcesso(b,{pecas:176,kg:421},USERS.operador,at(16)));
 let c=form(['A1020'],{numero:'PNT-PRADO-03',prioridade:'Normal'},20);c=replace(registrarRecebimento(c,{quantidadeVolumes:1,pecas:120,kg:460.7},USERS.recebimento,at(14)));c=replace(iniciarProcesso(c,{pecas:120,kg:460.7},USERS.operador,at(12)));c=replace(finalizarEmbalagem(c,{pecasBoas:120,kg:455,perda:0,retrabalho:0,divergencia:0},USERS.embalagem,at(8)));
 let d=form(['A3001'],{numero:'PNT-QUAL-01',prioridade:'Alta'},12);d=replace(registrarRecebimento(d,{quantidadeVolumes:1,pecas:120,kg:510},USERS.recebimento,at(10)));d=replace(iniciarProcesso(d,{pecas:120,kg:510},USERS.operador,at(9)));
 const day2=importarB08(volumes,B08_ROWS,at(4));volumes=day2.volumes;return{version:4,actor:USERS.operador,volumes,lotes,eventos,consumos:[],importacoes:[{...day1.importacao,arquivo:'B08_DIA_1_SIMULADA.csv'},{...day2.importacao,arquivo:'B08_DIA_2_COMPLETA_SIMULADA.csv'}]};}
