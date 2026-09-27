# B03_CART → quadro Kanban PCP

Mapeamento conferido no arquivo da Master de 08/09/2026. A importação é local, pela opção **Carregar Master** da tela de montagem. Nenhuma carteira de exemplo é usada.

| Campo da B03_CART | Coluna | Uso |
| --- | --- | --- |
| PEDIDO_ID + ITEM | A + B | Identidade estável da necessidade; o código da ferramenta não identifica o pedido |
| FERRAMENTA_ID | H | Ferramenta do card |
| LIGA | J | Liga exibida e preservada |
| COMPRIMENTO | M | Corte/comprimento, quando disponível |
| PRENSA | AX | Única prensa permitida pela fonte atual; sem liberação cruzada inferida |
| STATUS_PCP | AZ | Deve ser `LIBERADO P/ PCP` |
| CLIENTE (DA CENTRAL) | CG | Cliente do item |
| SALDO A PRODUZIR KG (SD_KG) | BW | Kg da necessidade (deve ser positivo) |
| PROGRAMÁVEL AGORA? | BX | Deve ter valor numérico `1` |

O cabeçalho está na linha 4 da versão analisada; o importador localiza os nomes em até 15 linhas. O arquivo analisado tinha 139 pedidos/itens, 96 com os dois portões liberados; um deles não tinha prensa válida e seria excluído da fila. A versão real usada na fábrica pode ter valores diferentes e deve ser carregada novamente antes da montagem.

As colunas Dia/Noite são do dia escolhido e cada necessidade pode estar em uma só posição do quadro. A ordem e Principal/Reserva ficam gravadas no registro publicado. A prévia utiliza o mesmo plano de versão da importação BASE_APP; versões anteriores continuam no Histórico.

Pendência para sincronização automática: caminho/forma de acesso confiável à Master atualizada e critério de atualização. Para mover uma ferramenta entre P4 e P7, é necessária uma fonte explícita das **prensas permitidas por ferramenta**; a B03 atual informa uma única prensa por linha, e a B01_FERRAM desta amostra também só contém P4 ou P7 por ferramenta. O quadro restringe movimentos à prensa informada.
