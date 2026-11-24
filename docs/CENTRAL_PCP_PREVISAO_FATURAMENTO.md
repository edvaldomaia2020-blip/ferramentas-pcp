# Central PCP — especificação de implementação
Data da transferência: 24/11/2026. Referência funcional: PRÉVIA DE FATURAMENTO FECHAMENTO NOVEMBRO(2).xlsx. Escopo deste commit: documentação.

## 1. Ponto de partida verificado
- Repositório: edvaldomaia2020-blip/ferramentas-pcp. Central publicada em /central/. A auditoria conferiu a correspondência dos blobs de central/index.html, central/cloud-menu.js e central/cloud-views.js com o conteúdo servido na data da análise.
- cloud-menu.js controla grupos e rotas por hash. Reutilizar o grupo Programação. cloud-views.js fornece slots(), billing(), action() e as vistas atuais. index.html configura Firebase Auth com persistência de sessão, lê a publicação, valida seu hash e expõe centralCloud.context. A restrição de proprietário na interface deve ser verificada também nas regras efetivas do Firestore.
- central_pcp/atual aponta para central_publicacoes/{id}/partes/{n}. O formato html-gzip-base64-v1 contém o JSON pcp-base. A gravação atual publica um novo pacote e troca o ponteiro em transação. Uma revisão local foi decodificada e o SHA-256 conferido. O ponteiro autenticado vigente e as regras implantadas não foram confirmados.
- slots() consome resumo_diario.carteira_atual.itens e _gestao.programacao, valida P7/P4, saldo e carga, usa chave item@data e calendário parcialmente fixo. A chave atual pode sobrescrever outra alocação do mesmo item no mesmo dia. Ausência de validação explícita de prensa homologada nessa função. billing() usa materiais.indicador, materiais.linhas, previsao_edicao e _gestao.faturamento; o confronto local é mais detalhado.
- Na pasta autorizada Desktop/CONCILIAÇÃO, consultar conciliacao/carteira.py, config.py, fontes.py, motor.py, painel_web.py, ppcp_web.py e programacao.py. Ler, para entender o fluxo, coletor_acesys_conciliacao/atualizar_tudo.py, publicar_painel.ps1 e ATUALIZAR_CONCILIACAO.bat. Saídas relevantes em saida/painel_web: resumo.json, resumo_diario.json, programacao.json, previsao_edicao.json, materiais.json, pedidos.json, quadros.json e nf_sem_pedido_vinculadas.json. Também existe saida/painel_web.json. programacao.json depende da cópia recalculada da P.P.C.P. e de decisões locais. A retirada da prévia manual e a migração dessas dependências legadas são objetivos distintos.
- A Central pode iniciar o piloto com pcp-base e uma posição congelada. Campos ausentes devem aparecer como pendências. A promoção futura de novos campos para a publicação existente exige autorização própria.

## 2. Mapeamento da planilha
| Aba | Função na versão (2) | Destino |
|---|---|---|
| FATURAMENTO | Grade manual independente, com fórmulas de soma que alcançam o bloco de produção | Referência de conferência |
| PREVISÃO FATURAMENTO | Seis dias úteis, filas + programação, acumulado, ocupação, clientes, maior dia e exceções | Calendário e resumo de fechamento |
| PAINEL DIÁRIO | Agenda P7/P4, Pintura e faturamento com subtotais de filas | Visão por dia e recurso |
| PROGRAMAÇÃO | Premissas, pedido, kg P7/P4, exceções de data, grupos e prioridade de Pintura. Colunas BL:BS ordenam e distribuem a Pintura | Editor e motor por item |
| SUGESTÕES | Saldo e ordenação por menor entrega e prensa | Fila de sugestões por capacidade |
| FILAS | Material existente em Embalagem, Pintura, Embalado e Faturamento Hoje; pedido opcional, kg, prioridade e data manual | Importar posição consolidada com evidência |
| PENDENTES | Saldo acima da tolerância e entrega até o corte | Pendências com causa |
| CARTEIRA | Foto estática por pedido/item | Carteira reconciliada |
| FERRAMENTAS | Foto estática, cruzada por FERRAMENTA_ID/APRENSAS | Catálogo de elegibilidade |
| BASE_CALC | Espelho, saldo e entregas por pedido, proporção natural/pintado e ranking | Modelo normalizado e agregações |

## 3. Contrato de dados e armazenamento
| Medida | Campo ou caminho observado | Identidade, atualização e restrições |
|---|---|---|
| Demanda de produção | CARTEIRA_A_PRODUZIR: PEDIDO_ID, ITEM, FILIAL, CODIGO, TRATAMENTO, ENTREGA, ENTREGAPCP, SL_KG, PR_KG, RJ_KG, EM_KG, FT_KG, SD_KG; publicação carteira_atual.itens[].chave e kg | Pedido/item, validar colisão entre filiais; a cada coleta de carteira |
| Demanda comercial | CARTEIRA_A_FATURAR: SD_KG comercial, EM_KG, FT_KG; carteira.py::unir_carteiras() | Mesmo pedido/item; precedência A Produzir em duplicatas. Item exclusivo da carteira comercial tem zero a produzir |
| Ferramenta e rota | FERRAMENTA_ID, APRENSAS, SEQUENCIA, STATUS, LIGA, TEMPERA, COMPRIMENTO, BENEFICIAMENTO, BENEFICIADOR; programacao.json[].prensas_ok, cor, corte, pintura (em itens) | Ferramenta/perfil e sequência; EXTRUCOLOR identificada por código 01533 em BENEFICIADOR. Conferir atualidade da exportação |
| Produção | PRODUCAO_EXTRUSAO: PRODUCAO_ID, PRENSA, INICIO, FIM, TURNO, PESOLIQUIDO, PESOBRUTO; resumo_diario.reuniao.diario | Evento e pedido/item; atualização por rodada; produção tem corte operacional documentado às 06h |
| Embalagem, trânsito e estoque | EMBALADOS_*, TRANSFERIDOS_*, CANCELADOS_*, VOLUMES_ESTOQUE: VOLUME_ID, PEDIDO_ID, ITEM, DATA, STATUS, PROCESSO_ID, PESOLIQUIDO | Identidade do volume e transição válida; fonte por rodada; reserva identificada para atribuir estoque sem cliente |
| Pintura | carteira.py::_fila_pintura(), previsao_edicao.central[].na_pintura; TRATAMENTO, FERRAMENTA_ID, COMPRIMENTO, BENEFICIAMENTO | Cliente normalizado + perfil + corte + cor para achar candidatos; usar remessa, data, volume e saldo para alocar retornos; janela de coleta limita o histórico |
| Fiscal e preço | Aureon: Data, NotaFiscal, PedidoAcesys, Produto, Quantidade, ValorNF, ValorLiquidoSemIPI; materiais.linhas[].data, nota, pedido, produto, kg, valor, liquido; previsao_edicao: preco_kg, preco_origem | Nota e identidade da linha fiscal; confronto por pedido/produto/item; pode usar última exportação válida quando a coleta falha |
| Conciliação física | SAP MB51: 101, 601/602, 651, 541/542; massa e resumo; estoque de abertura fixo do mês | Documento/item do movimento a homologar. Expedição física e NF são eventos diferentes. Uso de MB52 por liga/lote requer validação |
| Capacidade e decisões | resumo_diario.reuniao.prensas.*.kgh, aproveitamento, turnos_dia, horas_turno, pintura_kgh, turnos, feriados; programacao.json: linhas, dias, recesso, dias_embalagem, lancar | Recurso/data/turno; decisão por pedido/item/grupo; validar escala futura e a precedência de prioridades |

Proposta Firestore em homologação: posição de origem imutável com publicação, hash, versão, corte e idade por fonte; cenário com revisão, estado, autor, meta e versão de regras; subcoleção de alocações com ID próprio, item/lote, etapa, recurso, data, turno, kg e motivo; calendário por recurso/data/turno; decisões com vigência, evidência e autor; resultados diários por versão. Cenários em rascunho podem compartilhar a mesma base. Apenas uma revisão aprovada compromete a agenda operacional. Publicação por transação com verificação de revisão e base, revalidação ao trocar a posição e restauração de revisão anterior. Testar as regras implantadas com proprietário, diretoria, Correção e usuário sem acesso.

## 4. Motor proposto
1. Reconstruir a posição inicial por item e parcela, com estado físico único, saldo, origem e data. Dado ausente ou defasado aparece como pendência. Conservar rastreabilidade quando o pedido muda na Pintura.
2. Capacidade líquida por recurso/turno = horas disponíveis × kg/h × aproveitamento, com paradas consideradas uma vez. Confirmar base de peso bruto/líquido. A referência da planilha é P7 = 950 × 20 × 0,85 = 16.150 kg, P4 = 440 × 20 × 0,85 = 7.480 kg e Pintura = 450 × 20 = 9.000 kg. Confirmar taxas alternativas, escala real, recesso e expediente por recurso. O código auditado tem dois intervalos divergentes de recesso (16 e 21 de dezembro como início).
3. Programar por item e turno. A soma das alocações não pode ultrapassar SD_KG nem a capacidade. Validar prensa homologada, ferramenta, liga, status, reservas e prioridade vigente. Sugestões ordenadas por prioridade aprovada, entrega e capacidade a jusante, com desempate estável. A planilha escolhe P7 antes de P4 quando ambas são elegíveis e estima acabamento por proporção; a implementação usa o roteiro efetivo do item.
4. Pintura: reservar a fila inicial e inserir a produção elegível em capacidade remanescente. A versão (2) põe a fila inicial antes da produção nova; prioridade P7/P4 altera a ordem apenas entre entradas novas de Pintura. Confirmar essa precedência com PCP. Particionar kg em dias quando permitido, propagar conclusão e enviar excesso para a próxima capacidade válida. Fixar escala, calendário e precisão para evitar sobras de arredondamento.
5. Previsão: estoques prontos e filas entram como origem do kg previsto. A versão (2) usa natural D+1 útil e pintado no dia útil após a Pintura terminar; o parâmetro C13 deixou de comandar esse prazo. Embalagem inicia em D+1 na prévia. Homologar prazos por roteiro, incluindo a aplicação da referência D+7, tratamento e embalagem. Pedido comum prevê o conjunto na última prontidão com saldo coberto; parcial depende de autorização; agrupar por identidade comercial estável. A data solicitada não antecipa a data viável sem evidência de prontidão.
6. Liberação de hoje: reaproveitar o cálculo reconciliado já existente, que usa 90% produzido, 90% embalado, até 25 kg de sobra de embalagem e condição de Pintura/decisões. Preservar os filtros por idade, quantidade e quadro conforme sua finalidade. Não converter a condição de 100% programado da prévia em liberação física.
7. Faturamento real vem das notas conciliadas. Descontar somente parcelas atribuídas, aplicar cancelamentos, ratear notas com vários pedidos, preservar hora de corte, expor sem vínculo e preço sem evidência. Fechamento = realizado acumulado + previsão remanescente elegível até o corte. Valor projetado = kg × preço com fonte. Meta é parâmetro do período.
8. Tela: Programação → Programação e Previsão de Faturamento. Mostrar calendário P7/P4/Pintura/Faturamento, capacidade, carga, folga, caixa de sugestões, pendências, data solicitada, data viável, realizado, valor e distância da meta.

## 5. Conflitos e testes bloqueantes
| Teste | Critério |
|---|---|
| Paridade de referência | Reproduzir totais diários gravados na versão (2) em modo de comparação. Relatar diferenças de datas, capacidade e saldos por pedido. Não forçar equivalência do motor operacional com as exceções da planilha |
| Antecipação manual | Uma parcela tecnicamente pronta no próximo mês não entra no fechamento por uma data solicitada anterior. Com duas parcelas em meses distintos, verificar pedido completo e parcial autorizado. O agrupamento deve reavaliar material de fila vinculado |
| Capacidade | Com carga de 13.500 kg e capacidade de 9.000 kg, deslocar 4.500 kg e recalcular faturamento. Cobrir perda de 1 turno de P7 e P4, pintura com capacidade zero, recesso, feriado e turno extra aprovado |
| Pintura e duplicidade | Pedido muda entre envio e retorno; duas remessas têm mesma chave composta; retorno parcial e cancelado. Cada kg retorna uma vez. Confrontar fila e embalado usando vínculo de volume e a tolerância existente de max(30 kg, 5%) como referência de homologação |
| Carteiras e volumes | Mesmo item em A Produzir/A Faturar, item 100% produzido, transferido/cancelado, estoque sem cliente e lote reservado. Cada medida tem sua própria origem |
| Nota fiscal | Pedido ainda aberto no Acesys, NF parcial, cancelada, refaturada, exportada duas vezes, com vários pedidos ou sem vínculo, embalagem após a NF, exportação defasada. Preservar posição e evitar baixa dupla |
| Fila manual e agrupamento | Material indicado como Faturamento Hoje, mas agendado para outro dia, aparece como previsão. Grupos, dependências, bloqueios comerciais e pedidos fora da carteira exigem evidência antes de comprometer kg |
| Consistência de agenda | Mesmo item em dois turnos ou recursos elegíveis no mesmo dia, soma dentro do saldo. A troca de posição indica alocação órfã ou alterada e evita publicação com revisão vencida |
| Qualidade de relatório | O total diário inclui todas as linhas, sem truncamento por seis dias ou 20/25 posições. Regressão para seis subtotais com #VALUE! e célula de cliente sobrescrita na planilha |
| Segurança | Proprietário edita; diretoria lê; Correção mantém o acesso existente; usuário sem autorização é recusado. Validar acesso direto com emulador/homologação, concorrência e restauração |

## 6. Sequência de trabalho e fronteira de segurança
- Primeiro trabalho no Codex: inspecionar o código da branch, obter do PCP a posição congelada e o anexo (2) em área autorizada, montar uma tabela de cobertura dos campos e validar o calendário real. Apresentar diferenças antes de propor reaproveitamento de funções.
- Implementação seguinte, quando autorizada: adaptador e motor de leitura em branch de desenvolvimento, com testes de regressão. Depois cenários persistidos em ambiente de homologação e acompanhamento operacional em paralelo. Liberar produção após testes, permissões e aceite PCP.
- Nesta transferência, escopo restrito ao documento. Na fase de piloto, ler o artefato publicado ou uma cópia congelada. Usar dados sintéticos ou amostras autorizadas nos testes. A branch pública contém somente especificação e casos de teste genéricos.
- Preservar robôs de coleta, lançamentos SAP e fechamento Acesys, agendadores, exportadores, atualizadores, origem dos relatórios, planilhas operacionais, regras e dados do Firebase de produção. Não invocar comandos operacionais para testar a tela. Não alterar main, GitHub Pages, ponteiro de publicação, regras ou permissões nesta etapa. Qualquer alteração futura nesses componentes requer escopo próprio e aceite.
