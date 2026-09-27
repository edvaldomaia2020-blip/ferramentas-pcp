# B03_CART → quadro Kanban PCP

Mapeamento conferido em `1 - PROGRAMAÇÃO OFICIAL PPCP(1).xlsx`. A aba real é **B03 CART**; **B03_CART** também é aceita. A importação é local, pela opção **Carregar Master** da tela de montagem. Nenhuma carteira de exemplo é usada.

| Campo da B03_CART | Coluna | Uso |
| --- | --- | --- |
| PEDIDO_ID + ITEM | A + B | Identidade estável da necessidade; o código da ferramenta não identifica o pedido |
| FERRAMENTA_ID | H | Ferramenta do card |
| LIGA | J | Liga exibida e preservada |
| COMPRIMENTO | M | Corte/comprimento, quando disponível |
| PRENSA | AX | Única prensa permitida pela fonte atual; sem liberação cruzada inferida |
| STATUS_PCP | AZ | Deve ser `LIBERADO P/ PCP` |
| CLIENTE (DA CENTRAL) | CG | Cliente do item |
| SALDO A PRODUZIR KG (SD_KG) | BW | Saldo informativo no card e no registro, não substitui BZ |
| PROGRAMÁVEL AGORA? | BX | Deve ter valor numérico `1` |
| KG A EXTRUDAR LÍQUIDO | BZ | Kg do card, do quadro e da programação; requer valor positivo para programar |

O cabeçalho está na linha 5 da cópia oficial; o importador localiza os nomes em até 15 linhas. Há **118** itens com AZ/BX liberados, **117** com prensa P4/P7. Um item (`13156|1`, CDX-180) não tem prensa e aparece como pendência. Outro (`13155|2`, ETQ-060) tem prensa P4, porém BZ é zero e aparece como pendência de kg. A fila programável contém **116** itens nesta cópia; nenhum dos dois pendentes pode ser movido para o quadro. A versão usada na fábrica deve ser carregada novamente antes da montagem.

As quatro colunas P7/P4 turno 1 (Dia) e turno 2 (Noite) correspondem à mesma data escolhida, publicadas como posições ATUAL e PROXIMA. A sequência prossegue no Dia e Noite da data seguinte, em nova montagem. Cada necessidade pode estar em uma só posição do quadro. Principal/Reserva é a seção da ferramenta dentro do turno alvo; a reserva da Noite mantém `turnoOrigem: Dia`. A ordem, identidade e saldo BW ficam gravados no registro publicado. A prévia utiliza o mesmo plano de versão da importação BASE_APP; versões anteriores continuam no Histórico. Promoção da reserva para Principal na data seguinte requer nova montagem, sem copiar automaticamente a necessidade.

Pendência para sincronização automática: caminho/forma de acesso confiável à Master atualizada e critério de atualização. Para mover uma ferramenta entre P4 e P7, é necessária uma fonte explícita das **prensas permitidas por ferramenta**; a B03 atual informa uma única prensa por linha, e a B01_FERRAM desta amostra também só contém P4 ou P7 por ferramenta. O quadro restringe movimentos à prensa informada.
