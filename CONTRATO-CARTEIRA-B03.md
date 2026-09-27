# Contrato pendente: B03_CART → montagem no app

O app não consulta a Planilha Master nesta versão. A montagem manual é uma decisão do PCP e publica um dia/turno por vez. A importação `BASE_APP` continua disponível, com o contrato atual de `POSICAO_PROGRAMACAO`, `ORIGEM`, `DATA_PROGRAMACAO`, `TURNO`, `PRENSA`, `FERRAMENTA`, `CLIENTE`, `QUANTIDADE_KG`, `CORTE`, `LIGA`, `OBSERVACAO`, `ORDEM_ORIGEM`, `CHAVE_ORIGEM` e `SECAO`.

## Entrada candidata da carteira

| Informação | Fonte conhecida | Uso previsto | Validar na planilha real |
| --- | --- | --- | --- |
| Estado de liberação do PCP | `B03_CART!AZ` (`STATUS_PCP`) | Somente linhas liberadas pelo PCP podem ser candidatas | Valores reais, fórmulas e linhas de exemplo |
| Portão técnico | `B03_CART!BX` (`PROGRAMÁVEL AGORA?`) | Aceitar apenas o valor que significa programável | Valores e tipos retornados, inclusive vazios/erros |
| Identidade estável da necessidade/pedido | A identificar | Evitar duplicidade e rastrear retirada/alteração | Nome da coluna, chave composta se necessária, exemplos repetidos |
| Ferramenta, cliente, saldo em kg, prensa e liga | A identificar | Exibir candidatos para seleção e preencher linhas da programação | Cabeçalhos, unidades, fórmulas e amostras com P4/P7 e liga especial |
| Observação e corte, se disponíveis | A identificar | Levar contexto operacional sem obrigar campos ausentes | Cabeçalhos e exemplos reais |

`DATA_PROGRAMACAO`, `TURNO`, posição `ATUAL`/`PROXIMA`/`FUTURA` e seção `PRINCIPAL`/`RESERVA` são decisões da montagem pelo PCP, não devem ser inferidas de `AZ` ou `BX`. A sequência operacional conhecida é Dia(X) → Noite(X) → Dia(X+1) → Noite(X+1); a Reserva da Noite(X) corresponde à Principal do Dia(X+1). O app ainda não automatiza essa transferência.

Para fechar o mapeamento, fornecer um recorte **real e anonimizado se necessário** da `B03_CART`, com cabeçalhos e aproximadamente 10 a 20 linhas: liberadas, bloqueadas, P4/P7, saldos parciais, ferramentas repetidas e liga especial. Informar também como a Master identifica um pedido/grupo e qual coluna representa o **saldo ainda a produzir em kg**. Antes de qualquer robô, validar se a saída operacional da Master será lida da própria `B03_CART` ou de uma aba/exportação controlada.

Nenhuma alteração foi feita na Master, `3.PROGRAMAÇÃO` ou `4.ESPELHO`.
