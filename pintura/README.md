# Módulo Pintura — validação funcional e visual

Protótipo totalmente isolado do PCP/Correção, sem Firebase, autenticação, Firestore ou serviços de produção. Todos os dados e importações ficam somente no `localStorage` do navegador.

## Regras implementadas

- A B08 é tratada como fotografia diária: `VOLUME` é atualizado sem duplicação e cada mudança acrescenta uma entrada em `historicoB08`.
- Apenas `BENEFICIADOR = 00153` entra no universo operacional. O arquivo original nunca é alterado.
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
- `js/b08-service.js`: normalização, filtro 00153, Equipes A/P, histórico diário e prevenção de duplicidade.
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

## Limitações desta validação

O pareamento A/P usa a chave simulada `pedido + item + ferramenta + beneficiamento`. Um arquivo B08 real deverá confirmar nomes de colunas e a chave de negócio definitiva. Não há integração com ACESYS, Firebase, estoque, faturamento ou aplicativo principal. “Confirmado no ACESYS” é apenas a interpretação local da B08 importada.
