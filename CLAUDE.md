# CLAUDE.md — ferramentas-pcp (Extrutech)

## O que é este repositório
Front-end estático publicado no GitHub Pages (`https://edvaldomaia2020-blip.github.io/ferramentas-pcp/`).
Não tem build, testes nem dependências locais. Tudo roda no navegador e conversa com o Firebase
do projeto `pcp-correcao` (Auth + Firestore). Usuário digitado sem `@` vira `<usuario>@ferramentas.local`.

| Caminho | Papel |
|---|---|
| `index.html` (~6 mil linhas) | **App PCP Correção**: ferramentas (matrizes) da programação, status da Correção, urgências, notificações, importações (BASE_APP, Espelho, planilha), Kanban de montagem a partir da B03 CART, impressão do Espelho, histórico e auditoria. |
| `central/index.html` | **Central PCP online**: login, leitura da "publicação" (HTML gzip+base64 em partes no Firestore), botões dos robôs locais, publicação/restauração. |
| `central/cloud-menu.js` | Menu lateral e roteamento por `#hash` da Central. |
| `central/cloud-views.js` | Telas de gestão online (Editar painel, Faturamento do dia, Previsão, Programação da fábrica, Histórico, Pendências, Fechamento Acesys) e as regras de validação de cada ação. |

Fora do repositório (no computador PCP, pasta `Desktop\CONCILIAÇÃO`): robôs Python (Aureon, coletor Acesys,
conciliação), a Central local (`127.0.0.1:8765`), o atualizador (`127.0.0.1:8767`) e o controle de
fechamento (`127.0.0.1:8770`), além da planilha Master (abas `B03 CART`, `0.PARAM`, `0.CALEND`, `BASE_APP`).

## Regras de negócio que não podem ser quebradas

### App PCP Correção (`index.html`)
- Perfis: `pcp` (programa, importa, publica) e `correcao` (atualiza status das ferramentas). Perfil lido de `users/{uid}.role`; outro valor derruba o login.
- Prensas válidas: somente **P7** e **P4**. Turnos: **Dia** e **Noite**. Seções: **PRINCIPAL** e **RESERVA**.
- Necessidade = código da ferramenta + prensa + data (+ `programacaoId` quando existir). Chave em `necDocId`. Somar kg de todas as linhas da mesma chave; nunca duplicar por linha bruta.
- Status da ferramenta: Pendente, OK ("Programado"), Soda/Limpeza, Nitretação, Correção interna, Correção externa, Quebrada, Outro. Indicadores agrupam em ok / pendente / quebrada / indisponível.
- Coleção `ferramentas` é imutável (regras proíbem update). Uma programação nova substitui a antiga marcando `programacoes/{id}.vigente=false`; nada é apagado.
- Registro sem `programacaoId` (legado) só vale se não existir programação vigente para a mesma data/turno (`isRecordActive`).
- Urgência só conta como ativa se a programação por trás dela ainda está vigente.
- BASE_APP: aba obrigatória `BASE_APP`; colunas obrigatórias em `BASE_APP_REQUIRED_COLS`; posições ATUAL / PROXIMA / FUTURA; `CHAVE_ORIGEM` única; mesma data e turno dentro de uma posição; kg > 0. Ordem cronológica fora do esperado gera alerta, não bloqueio.
- Montagem (Kanban B03 CART): entra só item com `STATUS_PCP = "LIBERADO P/ PCP"`, `PROGRAMÁVEL AGORA? = 1`, prensa P7/P4 e "KG A EXTRUDAR LÍQUIDO" (BZ) > 0. `PEDIDO_ID+ITEM` repetido bloqueia a importação. Cartões agrupam por ferramenta+prensa+liga+corte.
- Raias: P7/P4 Turno 1 = Noite do dia-base (ATUAL); Turno 2 = Dia do dia seguinte (PROXIMA); Reserva 3 = Noite do dia seguinte (FUTURA). Sequência "Noite-Dia-Noite".
- Capacidade por turno vem de `0.PARAM` (horas por turno, regime normal/reforçado, capacidade líquida P7/P4) e `0.CALEND` (capacidade diária em t). Pode ser editada na tela antes de publicar.
- Publicar a montagem: as três posições ficam vigentes juntas num único lote; se a programação vigente mudou durante a preparação, nada é ativado. Necessidade já ativa em outra programação bloqueia.

### Central online (`central/`)
- Só o UID do Edvaldo (`OWNER` em `central/index.html`) grava, publica, restaura e aciona robôs. Demais usuários só consultam.
- Cada gravação gera uma publicação nova (revisão +1) dentro de transação que confere se a publicação atual não mudou (proteção contra conflito). Histórico `_cloud_history` limitado a 200 entradas.
- Publicar posição salva do PCP é recusado se houver ajustes online não sincronizados ou se a revisão local for anterior à online.
- Editar painel: mover material entre etapas conserva o total físico; excluir da análise reduz o físico e recalcula a diferença teórico × físico. Não altera SAP, Acesys, NF nem carteira.
- Faturamento: comparação por pedido; NF sem pedido não baixa pedido do mesmo cliente; NFs em `materiais.excluir_nf` são ignoradas.
- Programação da fábrica: prensa P4/P7; soma dos dias não ultrapassa o saldo do item; carga do dia não ultrapassa capacidade (kg/h × aproveitamento × turnos × horas); sem fim de semana, feriado, recesso 16–31/12; itens "janeiro" só a partir de 01/01.
- Fechamento Acesys: salvar autorização não executa; executar exige senha e só fecha itens com SIM válido; "executado" só é confirmado após nova coleta da carteira.
- Ações de robô sempre pedem a senha de novo (reautenticação).

## Como trabalhar aqui
- Responder e escrever textos da interface em português do Brasil, mantendo acentuação UTF-8.
- Não há build: editar o HTML/JS diretamente e testar abrindo no navegador. Aumentar o `?v=` dos scripts em `central/index.html` quando mudar `cloud-menu.js` ou `cloud-views.js` (cache do Pages).
- O push para `main` publica em produção na hora. Trabalhar em branch e abrir PR.
- Nunca apagar documentos do Firestore nem relaxar as checagens acima sem pedido explícito.
