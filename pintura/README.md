# Módulo Pintura — validação funcional e visual

Protótipo totalmente isolado do PCP/Correção, sem Firebase, autenticação, Firestore ou serviços de produção. Todos os dados e importações ficam somente no `localStorage` do navegador.

## Regras implementadas

- A B08 é tratada como fotografia diária: `VOLUME` é atualizado sem duplicação e cada mudança acrescenta uma entrada em `historicoB08`.
- Apenas `BENEFICIADOR = 001533` (seis dígitos; `00 15 33`) entra no universo operacional da StruColor. O código anterior `00153` é inválido e não entra na fila. O arquivo original nunca é alterado.
- `EQUIPE A` significa material destinado/disponível para Pintura; `EQUIPE P` é evidência posterior de material pintado e embalado.
- A reconciliação distingue: finalizado no APP aguardando B08, finalizado e confirmado pelo ACESYS, e B08 P sem finalização no APP.
- O volume continua sendo a unidade de rastreabilidade, mas a operação pode ser consolidada por cliente, pedido e cor.
- Todo avanço acrescenta um evento com usuário, data/hora, peças, kg, perda, retrabalho, divergência e motivo. Eventos anteriores não são sobrescritos.

## Interface

Há painel em kg/toneladas, visão por cliente com expansão cliente → pedido → itens, fila por cor, fila B08, rastreamento, finalizados, divergências e reserva para consumo de tinta. O detalhe do lote mostra os 11 passos visuais, os volumes de origem e a linha do tempo.

Em telas de até 700 px, o menu começa recolhido, abre sobre o conteúdo pelo botão no cabeçalho e fecha pelo botão, toque fora, seleção de rota ou tecla Escape. O desktop mantém navegação lateral fixa.

## Arquivos

- `index.html`: entrada exclusiva do protótipo e leitor local de Excel.
- `styles.css`: layout desktop/mobile e componentes responsivos.
- `js/b08-service.js`: normalização, filtro 001533, Equipes A/P, histórico diário e prevenção de duplicidade.
- `js/analytics.js`: reconciliação, indicadores, fila e agrupamentos.
- `js/ui-state.js`: regras testáveis do menu mobile.
- `js/model.js`: formação de lote, movimentações, quantidades e tempos.
- `js/mock-data.js`: duas fotografias B08 e cenários completos de demonstração.
- `js/storage-service.js`: persistência local.
- `js/app.js`: telas, filtros e interações.
- `tests/model.test.mjs`: testes automatizados das regras críticas.

## Executar localmente

Na raiz do repositório:

```bash
npm run serve:pintura
```

Acesse `http://localhost:4173`. Execute `npm test` para validar as regras.

## Diagnóstico da importação B08

O leitor XLSX está armazenado em `vendor/xlsx.full.min.js`, eliminando a dependência do CDN durante a importação. O importador procura o cabeçalho nas primeiras 100 linhas de todas as abas, identifica colunas pelos nomes normalizados e tolera acentos, espaços, pontuação, colunas adicionais, números como texto, células vazias e datas seriais do Excel.

A seleção do arquivo apenas confirma seu nome. O processamento acontece ao pressionar **Processar fotografia diária**, com mensagens para arquivo selecionado, leitura, aba encontrada, linha do cabeçalho, registros lidos, válidos, ignorados, novos, conhecidos, atualizados e vinculados. Importações com zero registros reconhecidos são rejeitadas com o motivo, sem gravar uma falsa conclusão.

## Limitações desta validação

O pareamento A/P usa provisoriamente `pedido + item + ferramenta + beneficiamento`, somente para demonstrar os cenários. Essa composição não é uma decisão de modelagem e não poderá ser levada ao Firebase sem validação com dados reais.

Antes da Fase 2, uma B08 real deverá validar os nomes e formatos de colunas, `BENEFICIADOR = 001533`, Equipes A/P, repetições do mesmo pedido/item em datas diferentes, duplicidades, volumes, peças, kg, cliente, pedido, item, ferramenta/perfil e cor/beneficiamento. A análise deverá determinar se existe uma chave direta A → P ou se será necessária uma composição com volume, pedido, item, perfil, cor, data ou outro identificador do ACESYS.

Não há integração com ACESYS, Firebase, estoque, faturamento ou aplicativo principal. “Confirmado no ACESYS” ainda é apenas uma interpretação local da B08 importada.

## Requisitos visuais registrados para etapa posterior

- identidade visual correta da **StruColor**;
- predominância de tons de azul;
- inclusão do logo oficial da StruColor somente após o fornecimento do arquivo oficial;
- melhoria geral da identidade visual desktop e mobile.

Nenhum logo será inventado ou redesenhado no protótipo atual. A reformulação visual não faz parte desta correção preparatória.
