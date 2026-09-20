import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {matrixToB08Rows,readB08File,importarB08,normalizeB08Row} from '../js/b08-service.js';

const header=['VOLUME','PEDIDO','ITEM','CLIENTE','EQUIPE','BENEFICIADOR','FERRAMENTA','PEÇAS','PESO LÍQUIDO','BENEFICIAMENTO','DATA'];
const record=['V-001','PV-10','20','PRADO','A','001533','EIR-033','144','272,50','BRANCO RAL 9003','20/09/2026'];

test('arquivo tabular válido reconhece a B08',()=>{const r=matrixToB08Rows([header,record]);assert.equal(r.rows.length,1);assert.equal(normalizeB08Row(r.rows[0]).volume,'V-001');});
test('arquivo vazio informa motivo',()=>assert.throws(()=>matrixToB08Rows([]),/Planilha vazia/));
test('cabeçalho pode estar fora da primeira linha',()=>{const r=matrixToB08Rows([['RELATÓRIO B08'],['Gerado em 20/09'],header,record]);assert.equal(r.headerRow,3);assert.equal(r.rows.length,1);});
test('colunas adicionais são toleradas',()=>{const r=matrixToB08Rows([[...header,'COLUNA EXTRA'],[...record,'qualquer valor']]);assert.equal(r.rows[0]['COLUNA EXTRA'],'qualquer valor');});
test('números armazenados como texto são convertidos',()=>{const [v]=matrixToB08Rows([header,record]).rows.map(normalizeB08Row);assert.equal(v.pecas,144);assert.equal(v.pesoLiquido,272.5);});
test('data serial do Excel é convertida',()=>{const line=[...record];line[10]=45555;const [row]=matrixToB08Rows([header,line]).rows;assert.match(row.DATA,/^2024-/);});
test('coluna VOLUME ausente gera erro compreensível',()=>assert.throws(()=>matrixToB08Rows([['PEDIDO','CLIENTE'],['1','PRADO']]),/coluna VOLUME/));
test('registros duplicados não são recriados',()=>{const rows=matrixToB08Rows([header,record]).rows,a=importarB08([],rows),b=importarB08(a.volumes,rows);assert.equal(b.volumes.length,1);assert.equal(b.stats.conhecidos,1);});
test('beneficiador diferente não entra na Pintura',()=>{const line=[...record];line[5]='002000';const r=importarB08([],matrixToB08Rows([header,line]).rows);assert.equal(r.stats.pintura,0);assert.equal(r.stats.ignorados,1);});
test('erro de leitura do arquivo não fica silencioso',async()=>{const file={name:'B08.xlsx',arrayBuffer:async()=>{throw new Error('arquivo corrompido');}};await assert.rejects(()=>readB08File(file,{read(){},utils:{sheet_to_json(){}}}),/Erro ao processar arquivo: arquivo corrompido/);});
test('CSV também aceita linhas antes do cabeçalho',async()=>{const csv=`RELATÓRIO B08;;;;;;;;;;\n${header.join(';')}\n${record.join(';')}`;const r=await readB08File({name:'B08.csv',text:async()=>csv});assert.equal(r.headerRow,2);assert.equal(r.rows.length,1);});

test('XLSX realista é escrito e lido pelo leitor embarcado',async()=>{
 const code=readFileSync(new URL('../vendor/xlsx.full.min.js',import.meta.url),'utf8'),sandbox={exports:{},module:{exports:{}},console,process};sandbox.global=sandbox;sandbox.globalThis=sandbox;vm.runInNewContext(code,sandbox);const XLSX=Object.keys(sandbox.module.exports).length?sandbox.module.exports:sandbox.exports;
 const sheet=XLSX.utils.aoa_to_sheet([['Extrutech - Embalagem da Extrusão'],[],header,record]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,sheet,'B08 Disponível');const bytes=XLSX.write(wb,{bookType:'xlsx',type:'array'});
 const parsed=await readB08File({name:'B08.xlsx',arrayBuffer:async()=>bytes},XLSX);assert.equal(parsed.sheetName,'B08 Disponível');assert.equal(parsed.headerRow,3);assert.equal(normalizeB08Row(parsed.rows[0]).beneficiador,'001533');
});
