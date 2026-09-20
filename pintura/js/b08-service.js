import{round}from'./model.js';
export const BENEFICIADOR_PINTURA='001533';
const aliases={volume:['volume','volume_id','volume id','vol','n volume','nr volume','numero volume','nº volume'],pedido:['pedido','pedido_id','pedido id','ordem','pedido venda'],item:['item','item pedido'],cliente:['cliente','tratamento','tratamento cliente','tratamento/cliente','nome cliente'],dataEmbalagem:['data','data embalagem','data de embalagem'],equipe:['equipe','equipe embalagem'],beneficiadorId:['beneficiador_id','beneficiador id'],beneficiadorCodigo:['beneficiador'],ferramenta:['ferramenta','ferramenta_id','ferramenta id','perfil','ferramenta perfil'],amarrados:['amarrados','amarra'],pecas:['pecas','peças','qtd pecas','quantidade peças','quantidade de peças'],pesoLiquido:['pesoliquido','peso liquido','peso líquido','kg','peso','peso líquido kg'],pesoBruto:['pesobruto','peso bruto'],liga:['liga'],tempera:['tempera','têmpera'],comprimento:['comprimento','corte'],beneficiamento:['beneficiamento','cor','codigo descricao beneficiamento','código/descrição de beneficiamento'],entrega:['entrega','data entrega'],bfTratamento:['bf_tratamento','bf tratamento'],retornoBenef:['retorno_benef','retorno benef'],observacao:['observacao','observação'],liberado:['liberado']};
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const normHeader=s=>norm(s).replace(/[^a-z0-9]/g,'');
const num=v=>{let s=String(v??'').trim();if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const n=Number(s);return Number.isFinite(n)?n:0;};
const read=(row,names)=>{const keys=Object.keys(row);for(const n of names){const k=keys.find(x=>normHeader(x)===normHeader(n));if(k!==undefined)return row[k];}return'';};
// Hipótese exclusiva do protótipo. A chave definitiva A → P depende da validação da B08 real.
export const chaveMaterialProvisoria=v=>[v.pedido,v.item,v.ferramenta,v.beneficiamento].map(norm).join('|');
export const chaveMaterial=chaveMaterialProvisoria;
export const pertencePintura=v=>String(v?.beneficiador||'').padStart(6,'0')===BENEFICIADOR_PINTURA;
export const interpretarEquipe=v=>String(v?.equipe||'').trim().toUpperCase()==='P'?'PINTADO_ACESYS':String(v?.equipe||'').trim().toUpperCase()==='A'?'FILA_PINTURA':'EQUIPE_NAO_MAPEADA';
export function normalizeBeneficiador(beneficiadorIdOriginal,beneficiadorOriginal){const id=String(beneficiadorIdOriginal??'').trim(),codigo=String(beneficiadorOriginal??'').trim(),numeric=v=>/^\d+$/.test(v);const escolhido=numeric(id)?id:numeric(codigo)?codigo:id||codigo;return{beneficiador: numeric(escolhido)?escolhido.padStart(6,'0'):escolhido,beneficiadorFonte:numeric(id)?'BENEFICIADOR_ID':numeric(codigo)?'BENEFICIADOR':'NÃO IDENTIFICADA',beneficiadorIdOriginal:id,beneficiadorOriginal:codigo};}
export function normalizeB08Row(row){const volume=String(read(row,aliases.volume)||'').trim();if(!volume)return null;const equipe=String(read(row,aliases.equipe)||'').trim().toUpperCase(),benef=normalizeBeneficiador(read(row,aliases.beneficiadorId),read(row,aliases.beneficiadorCodigo)),amarrados=read(row,aliases.amarrados);const v={id:`B08-${volume}`,volume,pedido:String(read(row,aliases.pedido)||'').trim(),item:String(read(row,aliases.item)||'').trim(),cliente:String(read(row,aliases.cliente)||'').trim(),dataEmbalagem:String(read(row,aliases.dataEmbalagem)||'').trim(),equipe,...benef,ferramenta:String(read(row,aliases.ferramenta)||'').trim(),amarra:String(amarrados??'').trim(),amarrados:num(amarrados),pecas:num(read(row,aliases.pecas)),pesoLiquido:round(num(read(row,aliases.pesoLiquido))),pesoBruto:round(num(read(row,aliases.pesoBruto))),liga:String(read(row,aliases.liga)||'').trim(),tempera:String(read(row,aliases.tempera)||'').trim(),comprimento:String(read(row,aliases.comprimento)||'').trim(),beneficiamento:String(read(row,aliases.beneficiamento)||'').trim(),entrega:String(read(row,aliases.entrega)||'').trim(),bfTratamento:String(read(row,aliases.bfTratamento)||'').trim(),retornoBenef:String(read(row,aliases.retornoBenef)||'').trim(),observacao:String(read(row,aliases.observacao)||'').trim(),liberado:String(read(row,aliases.liberado)??'').trim(),camposOriginais:{...row},status:'disponivel',loteId:null};return{...v,chaveMaterial:chaveMaterialProvisoria(v),interpretacaoEquipe:interpretarEquipe(v),confirmadoAcesys:equipe==='P'};}
const changed=(a,b)=>['pedido','item','cliente','dataEmbalagem','equipe','beneficiador','ferramenta','pecas','pesoLiquido','comprimento','beneficiamento','entrega'].some(k=>String(a[k]??'')!==String(b[k]??''));
export function importarB08(existing,rows,now=new Date().toISOString()){
 const map=new Map(existing.map(v=>[v.volume,v])),resultado=[],stats={totalLidos:0,pintura:0,equipeA:0,equipeP:0,ignorados:0,novos:0,atualizados:0,conhecidos:0,vinculados:0,ignoradosPorMotivo:{beneficiadorDiferente:0}};
 for(const raw of rows){const incoming=normalizeB08Row(raw);if(!incoming)continue;stats.totalLidos++;if(!pertencePintura(incoming)){stats.ignorados++;stats.ignoradosPorMotivo.beneficiadorDiferente++;resultado.push({volume:incoming.volume,situacao:'IGNORADO — BENEFICIADOR DIFERENTE DE 001533',beneficiadorIdOriginal:incoming.beneficiadorIdOriginal,beneficiadorOriginal:incoming.beneficiadorOriginal});continue;}stats.pintura++;if(incoming.equipe==='A')stats.equipeA++;if(incoming.equipe==='P')stats.equipeP++;const old=map.get(incoming.volume);
  if(!old){Object.assign(incoming,{importadoEm:now,atualizadoEm:now,historicoB08:[{em:now,equipe:incoming.equipe,pesoLiquido:incoming.pesoLiquido}]});map.set(incoming.volume,incoming);stats.novos++;resultado.push({volume:incoming.volume,situacao:'NOVO'});continue;}
  if(old.loteId)stats.vinculados++;
  if(changed(old,incoming)){const history=[...(old.historicoB08||[]),{em:now,equipe:incoming.equipe,pesoLiquido:incoming.pesoLiquido}];map.set(old.volume,{...old,...incoming,id:old.id,importadoEm:old.importadoEm,atualizadoEm:now,status:old.status,loteId:old.loteId,historicoB08:history});stats.atualizados++;resultado.push({volume:old.volume,situacao:old.loteId?'ATUALIZADO — VINCULADO A LOTE':'ATUALIZADO'});}else{stats.conhecidos++;resultado.push({volume:old.volume,situacao:old.loteId?'JÁ CONHECIDO — VINCULADO A LOTE':'JÁ CONHECIDO'});}
 }
 const volumes=[...map.values()];const pKeys=new Set(volumes.filter(v=>v.equipe==='P').map(chaveMaterialProvisoria));for(const v of volumes)if(v.equipe==='A')v.confirmadoAcesys=pKeys.has(chaveMaterialProvisoria(v));
 return{volumes,resultado,stats,importacao:{id:`IMP-${Date.now()}`,criadoEm:now,stats,resultado}};
}
const knownHeaders=new Set(Object.values(aliases).flat().map(normHeader));
const excelDate=value=>{if(!(typeof value==='number'&&value>0&&value<100000))return value;const d=new Date(Date.UTC(1899,11,30)+value*86400000);return Number.isNaN(d.getTime())?value:d.toISOString().slice(0,10);};
const headerType=h=>Object.entries(aliases).find(([,names])=>names.some(n=>normHeader(n)===normHeader(h)))?.[0];
export function matrixToB08Rows(matrix){
 if(!Array.isArray(matrix)||!matrix.length)throw new Error('Planilha vazia: nenhuma linha encontrada.');
 let best={index:-1,score:-1,hasVolume:false};
 matrix.slice(0,100).forEach((line,index)=>{const cells=Array.isArray(line)?line:[],normalized=cells.map(normHeader),score=normalized.filter(v=>knownHeaders.has(v)).length,hasVolume=normalized.some(v=>aliases.volume.some(a=>normHeader(a)===v));if(hasVolume&&score>best.score)best={index,score,hasVolume};});
 if(best.index<0)throw new Error('Não foi possível localizar a coluna VOLUME. Verifique o cabeçalho da B08.');
 const headers=matrix[best.index].map((h,i)=>String(h??'').trim()||`COL_${i+1}`),types=headers.map(headerType);
 const rows=matrix.slice(best.index+1).filter(line=>Array.isArray(line)&&line.some(v=>String(v??'').trim()!=='')).map(line=>Object.fromEntries(headers.map((h,i)=>[h,types[i]==='dataEmbalagem'?excelDate(line[i]):line[i]??''])));
 if(!rows.length)throw new Error('Planilha sem registros abaixo do cabeçalho da B08.');
 return{rows,headerRow:best.index+1,headers,physicalRows:matrix.length};
}
const parseCsvMatrix=text=>{const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);if(!lines.some(l=>l.trim()))throw new Error('Arquivo CSV vazio.');const delimiter=(lines.find(l=>l.trim())?.match(/;/g)||[]).length>(lines.find(l=>l.trim())?.match(/,/g)||[]).length?';':',';const parse=line=>{const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='\"'){if(quoted&&line[i+1]==='\"'){cur+='\"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;};return lines.map(parse);};
export function parseCsv(text){return matrixToB08Rows(parseCsvMatrix(text)).rows;}
export function extractWorkbookRows(workbook,xlsx){
 if(!workbook?.SheetNames?.length)throw new Error('Arquivo Excel sem planilhas/abas disponíveis.');
 const failures=[];
 const ordered=[...workbook.SheetNames].sort((a,b)=>(a==='AceManager'?-1:b==='AceManager'?1:0));
 for(const sheetName of ordered){try{const matrix=xlsx.utils.sheet_to_json(workbook.Sheets[sheetName],{header:1,defval:'',raw:true,blankrows:true});const parsed=matrixToB08Rows(matrix);return{...parsed,sheetName};}catch(error){failures.push(`${sheetName}: ${error.message}`);}}
 throw new Error(`Formato de B08 não reconhecido em nenhuma aba. ${failures.join(' | ')}`);
}
export async function readB08File(file,xlsx=globalThis.XLSX){
 if(!file?.name)throw new Error('Nenhum arquivo foi selecionado.');
 const ext=file.name.toLowerCase().split('.').pop();
 try{
  if(ext==='csv'){const text=await file.text();return{...matrixToB08Rows(parseCsvMatrix(text)),sheetName:'CSV'};}
  if(!['xlsx','xls'].includes(ext))throw new Error('Formato não suportado. Selecione um arquivo CSV, XLSX ou XLS.');
  if(!xlsx?.read||!xlsx?.utils?.sheet_to_json)throw new Error('Leitor XLSX indisponível no navegador. Recarregue a página e tente novamente.');
  const buffer=await file.arrayBuffer();if(!buffer?.byteLength)throw new Error('Arquivo Excel vazio.');
  return extractWorkbookRows(xlsx.read(buffer,{type:'array',cellDates:true}),xlsx);
 }catch(error){if(/^(Nenhum|Formato|Leitor|Arquivo|Planilha|Não foi|Formato de)/.test(error.message))throw error;throw new Error(`Erro ao processar arquivo: ${error.message||'falha de leitura desconhecida'}`);}
}
