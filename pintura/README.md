# Módulo Pintura — validação B08 e fluxo macro

Protótipo isolado, sem Firebase e sem integração com o PCP/Correção. Os dados ficam no armazenamento local do navegador.

## Fluxo validado

B08 → volumes disponíveis → formar lote → Recebido na Pintura → Início da montagem dos carrinhos (EM PROCESSO) → Embalagem finalizada (aguarda avaliação do PCP).

O VOLUME é a unidade de rastreabilidade da Extrusão. Um lote pode conter um ou vários volumes do mesmo beneficiamento/cor. Cada volume mantém pedido, item, cliente, ferramenta, peças, kg, comprimento, data de embalagem e campos originais.

## Importação B08

A tela Materiais B08 aceita CSV e Excel. Na reimportação, cada volume é classificado como NOVO, JÁ IMPORTADO, ATUALIZADO ou JÁ VINCULADO A LOTE. Volumes vinculados não são sobrescritos e não podem entrar em outro lote.

## Rastreabilidade

Cada marco cria um evento novo e imutável com usuário, data/hora, peças, kg e ocorrências. O lote preserva recebidoEm, inicioProcessoEm e finalizadoEm. Assim o sistema calcula espera antes do processo, tempo efetivo de processo e tempo total no setor.

## Arquivos

- index.html — entrada do protótipo e leitor Excel.
- styles.css — interface responsiva.
- js/b08-service.js — normalização, CSV e controle de duplicidade.
- js/model.js — formação do lote, marcos, quantidades e tempos.
- js/mock-data.js — B08 e lotes demonstrativos.
- js/storage-service.js — persistência local.
- js/app.js — telas e interações.
- tests/model.test.mjs — testes das regras críticas.

## Executar

Na raiz do repositório execute npm run serve:pintura e acesse http://localhost:4173. Para testar, execute npm test.

## Limites desta etapa

Não há conexão automática com Planilha Master, ACESYS, Firebase, estoque de tinta ou faturamento. Embalagem finalizada significa apenas que a Pintura terminou e o lote aguarda avaliação do PCP.
