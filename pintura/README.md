# Módulo Pintura — protótipo isolado

Protótipo da Fase 1 do rastreamento da Pintura. Ele não importa o aplicativo PCP/Correção, não usa Firebase e não modifica `../index.html`.

## Executar

Na raiz do repositório:

```bash
npm run serve:pintura
```

Acesse `http://localhost:4173`. Os dados ficam somente no `localStorage` do navegador, na chave `extrutech.pintura.prototype.v1`. Uma janela anônima inicia outra base local.

Testes das regras de negócio:

```bash
npm test
```

## Estrutura

- `index.html`: ponto de entrada exclusivo do módulo.
- `styles.css`: identidade visual responsiva para computador e celular.
- `js/constants.js`: etapas, prioridades e tipos de divergência.
- `js/model.js`: regras puras de cadastro, movimentação, saldo e validação.
- `js/storage-service.js`: persistência local substituível por um serviço futuro.
- `js/mock-data.js`: lotes e históricos simulados para demonstrar o fluxo.
- `js/app.js`: renderização das telas, filtros e eventos de interface.
- `tests/model.test.mjs`: testes automatizados das regras críticas.

## Funcionamento

O lote mantém somente seu estado atual para leitura rápida. Cada criação ou avanço produz também um novo evento. Eventos anteriores nunca são atualizados nem removidos pela aplicação. A linha do tempo é derivada dessa lista de eventos.

O avanço é estritamente sequencial. A movimentação só é aceita quando:

```text
peças de entrada = aprovadas + retrabalho + perda + divergência de contagem
```

Quando qualquer valor de retrabalho, perda ou divergência for maior que zero, o motivo é obrigatório. O lote, o evento e os dados simulados são gravados localmente em um único snapshot, sem rede.

## Decisões da Fase 1

- Desenvolvimento em `feature/modulo-pintura` e em diretório próprio.
- Nenhum link foi incluído no app atual.
- Nenhum perfil, regra ou coleção Firebase foi criado.
- O consumo de tinta tem modelo e tela consultiva, mas o apontamento ficou reservado para a Fase 2.
- Usuários demonstrativos são selecionados na movimentação para comprovar autoria no histórico.

## Aprovações necessárias para a Fase 2

1. Forma de acesso ao módulo e eventual tela inicial compartilhada.
2. Novo perfil `pintura` e matriz de permissões por etapa.
3. Coleções Firebase e regras de segurança exclusivas da Pintura.
4. Uso de transação atômica para atualizar lote e inserir evento juntos.
5. Regras do consumo de tinta: unidade, estoque, tolerância, devolução e aprovadores.
6. Tratamento do retrabalho: retorno para etapa anterior ou fila paralela.
7. Integração com carteira/BASE_APP e critério de liberação para faturamento.
