# SIGC · Catálogo de regras de negócio

Cada regra indica **onde está implementada** (arquivo em `sql/`) e **quais testes a comprovam** (em `testes/`). Os testes rodam com `testes/rodar.sh` e usam apenas dados DEMO.

Marcações:
- **[REGRA A CONFIRMAR]**: o valor é um padrão editável que depende de resposta da área.
- **[VALIDAR REGULAMENTAÇÃO ESTADUAL/RJ]**: depende de norma estadual.
- **[DADO AUSENTE]**: a planilha não traz o dado.

Os parâmetros ficam na tabela `parametros`, com a coluna `a_validar` preenchida. A tela de Administração lista o que falta confirmar.

---

## 1. Vigência e situação

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-V01 | O fim efetivo é, nesta ordem: a data da **rescisão** assinada; senão, o maior `nova_data_fim` dos aditivos de prazo **assinados ou publicados**, quando posterior ao término do termo; senão, o término do termo; senão, início + prazo. Aditivo em rascunho, análise jurídica ou aguardando assinatura **não** prorroga | `vw_contrato_vigencia` (04) | T-VIG-01, T-VIG-04, T-VIG-05 |
| RN-V02 | Sem término informado: fim = início + prazo pela convenção do órgão. `edate_menos_1` dá 22/10/2024 + 24 meses = 21/10/2026; `mesmo_dia` dá 22/10/2026. **[REGRA A CONFIRMAR]** (pergunta 29.2 nº 1). O padrão é `edate_menos_1` para todos os órgãos | `fn_fim_por_prazo` (01), parâmetro `vigencia.convencao_termino` | T-VIG-02, T-VIG-03 |
| RN-V03 | A situação é **calculada**: em formalização (sem início), não iniciado, vigente (com faixa de 30/60/90/120/180 dias), vencido ou vigência indefinida. Só **encerrado, rescindido e suspenso** são manuais e exigem data, ato e motivo | `vw_contrato_vigencia` (04), `ck_situacao_manual` (03) | T-VIG-06, T-VIG-07 |
| RN-V04 | Vencido sem ato de encerramento aparece como "**Vencido – vigência a confirmar**" e gera o alerta crítico VIG-VENC. Registrar o encerramento formal fecha o alerta | `fn_rotulo_situacao` (04), VIG-VENC (06) | T-VIG-06, T-MOT-04 |
| RN-V05 | Ao **assinar** um aditivo de prazo, a vigência acumulada não pode passar do limite do regime: 8.666 = 60 meses, 14.133 = 120 meses. Com regime "a confirmar", não há bloqueio, só o alerta DQ-REGIME. Rascunho acima do limite é permitido. **[REGRA A CONFIRMAR]**: a prorrogação excepcional do art. 57, §4º, não foi considerada | `fn_alteracao_validar_limites` (04) | T-VIG-09 |
| RN-V06 | Início da vigência anterior à assinatura só é aceito com justificativa. Na importação, a justificativa é automática e o caso vira DQ-IMPORT até alguém tratá-lo | `ck_inicio_assinatura` (03), `fn_importacao_aprovar` (05) | T-VIG-08, T-IMP-05 |
| RN-V07 | Quando a planilha traz o período vigente vindo de aditivo (DOC. BASE "3º Aditivo"), o contrato entra com `historico_incompleto` marcado e o alerta DQ-HIST. O limite de prorrogação não é verificado até o histórico ser cadastrado | `historico_incompleto` (03), DQ-HIST (06), `VIG-LIM` ignora | T-IMP-02, T-IMP-05, T-IMP-06 |

## 2. Valores

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-$01 | Valor global atualizado = valor original + Σ `delta_valor` das alterações assinadas. O valor mensal atual vem da última alteração com `novo_valor_mensal` | `vw_contrato_valores` (04) | T-VAL-01 |
| RN-$02 | Σ (quantidade × unitário) dos itens comparado ao mensal, e mensal × prazo comparado ao global. Divergência acima de **0,5%** gera DQ-VALOR. Itens sem preço unitário (por demanda, texto livre) não entram na comparação | `vw_contrato_valores` (04), DQ-VALOR (06) | T-VAL-03, T-IMP-06 |
| RN-$03 | Acréscimos quantitativos (`aditivo_valor`) e supressões acumulados não podem passar de **25%** do valor original. A trava atua na assinatura. Reajuste, repactuação e aditivo de prazo com valor não contam para o limite. **[REGRA A CONFIRMAR]**: 50% para reforma; base de cálculo "valor inicial atualizado" (art. 125) | `fn_alteracao_validar_limites` (04), parâmetro `valores.limite_acrescimo_pct` | T-VAL-01, T-VAL-02 |
| RN-$04 | Σ pago ≤ Σ liquidado ≤ Σ empenhado ≤ valor atualizado | Fase 2 (SIAFE). **[DADO AUSENTE]** | — |

## 3. Fiscalização

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-F01 | Contrato vigente ou vencido precisa de gestor **e** fiscal designados. Na falta, o alerta FIS-SEM é crítico | FIS-SEM (06) | T-MOT-05 |
| RN-F02 | Sem fiscal substituto, o alerta é FIS-SUB, de atenção | FIS-SUB (06) | T-MOT-05 |
| RN-F03 | A mesma pessoa não ocupa o **mesmo papel** duas vezes no mesmo contrato em períodos sobrepostos, e há só um titular por vez de gestor, gestor substituto e presidente da comissão. A regra é um **bloqueio** no banco | `ex_designacao_duplicada`, `ex_papel_singular` (03) | T-DES-01, T-DES-02 |
| RN-F04 | A mesma pessoa em **papéis diferentes** no mesmo contrato (ex.: gestor e fiscal) **só gera alerta** (FIS-SEG) e mensagem recomendando atores distintos; **nunca bloqueia** a operação (decisão de 07/10/2026). A tela chama `fn_aviso_segregacao` antes de salvar e exibe o aviso; a importação registra IMP-PESSOA-DUP como aviso | FIS-SEG (06), `fn_aviso_segregacao` (06) | T-MOT-05, T-IMP-06 |
| RN-F05 | Designação em vigor sem portaria publicada há mais de **15 dias** gera FIS-PORT. **[REGRA A CONFIRMAR]** prazo | FIS-PORT (06) | T-MOT-05 |
| RN-F06 | Pessoa designada desligada, afastada ou com afastamento em curso (férias, licença) gera FIS-AUS | FIS-AUS (06), `pessoa_afastamentos` (02) | T-MOT-05 |
| RN-F07 | Encerrar uma designação exige o motivo do fim | `ck_designacao_motivo_fim` (03) | T-DES-03 |
| RN-F08 | Duas grafias da mesma pessoa só são fundidas por decisão humana. A fusão transfere as designações, inativa o cadastro duplicado e recusa matrículas diferentes | `vw_pessoas_possiveis_duplicadas` (11), `fn_fundir_pessoas` (05) | T-IMP-08 |

## 4. Publicações

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-P01 | **PNCP** (Lei 14.133, art. 94): 20 dias úteis após a assinatura em licitação e 10 em contratação direta. Os dias úteis são contados a partir do dia seguinte e excluem fins de semana e a tabela `feriados`. Com forma de contratação "a confirmar", vale o prazo menor (10). Com regime "a confirmar", o contrato é tratado como 14.133 se foi assinado a partir de 01/01/2024 **[REGRA A CONFIRMAR]**, pergunta 29.2 nº 6. O prazo vale para o contrato e para os aditivos; apostilamento não vai ao PNCP | PUB-PNCP (06), `fn_dias_uteis_entre` (01) | T-MOT-06 |
| RN-P02 | **DOERJ**: 20 dias corridos após a assinatura. **[VALIDAR REGULAMENTAÇÃO ESTADUAL/RJ]** | PUB-DOERJ (06), parâmetro `doerj.prazo_dias` | T-MOT-01 (indireto) |
| RN-P03 | Publicação anterior à assinatura do ato só é aceita com justificativa | `fn_publicacao_validar` (03) | T-PUB-01 |
| RN-P04 | O KPI "% de publicações no prazo" compara a data de cada publicação com o prazo aplicável | `vw_publicacoes_prazo` (11) | — |

## 5. Garantia e formalização

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-G01 | Garantia exigida e não apresentada **10 dias** após o início gera GAR-PEND (regra mantida ativa: a área cadastrará as garantias, decisão de 07/10/2026; prazo **[REGRA A CONFIRMAR]**). Na planilha, "SIM" = exigida, "N/C" = não se aplica e "****" = não informado | GAR-PEND (06), `fn_importacao_normalizar` (05) | T-IMP-02 |
| RN-G02 | Garantia apresentada que vence em até 30 dias, ou antes do fim da vigência mais a margem, gera GAR-VENC. A validade é **[DADO AUSENTE]** na planilha | GAR-VENC (06) | — |
| RN-A03 | Alteração parada na mesma etapa (rascunho, análise jurídica, aguardando assinatura) há mais de **30 dias** gera ALT-PEND | ALT-PEND (06), `situacao_desde` (03) | T-MOT-09 |
| RN-A04 | O gestor só cria e edita alteração **em rascunho**. O jurídico só registra parecer e avança a alteração que está em análise jurídica. Assinar, alterar valores e registrar prazos cabe à gestão de contratos | `fn_alteracao_restringir_perfil` (10) | T-SEG-03, T-SEG-04 |

## 6. Dados, auditoria e exclusão

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-D01 | A chave única do contrato é (órgão, tipo, número, ano). Os números 008/2023, 002/2024 e 007/2025 existem nos dois órgãos e são aceitos | `contratos_chave_uk` (03) | T-IMP-02 |
| RN-D02 | CNPJ é validado pelos dígitos verificadores. Fornecedor sem CNPJ é **provisório** e gera DQ-CNPJ | `fn_cnpj_valido` (01), `fornecedores.provisorio` (02) | T-IMP-05, T-IMP-06 |
| RN-D03 | Processo SEI no formato `NNNNNN/NNNNNN/AAAA`. As grafias da planilha ("SEI-", espaços, ponto) são normalizadas e o original fica guardado | `fn_processo_canonico` (01) | T-IMP-01 |
| RN-D04 | "SEDEICS" é sigla anterior da **SEDES** e é convertida na importação | `orgaos.siglas_anteriores`, `fn_orgao_por_sigla` (02) | T-IMP-01, T-IMP-02 |
| RN-D05 | Sem órgão na linha, o importador tenta o **prefixo do processo SEI** (220001/220012 → SEDES; 480001 → SEENEMAR) e marca para confirmação. O prefixo 150001 está sem órgão **[A VALIDAR]**, pergunta 29.2 nº 5 | `fn_importacao_normalizar` (05) | aceite |
| RN-A01 | Mudar valor, data, situação, regime, fornecedor ou designação exige **motivo**. O motivo vai para a trilha e não fica gravado na linha | `fn_exigir_motivo`, `fn_auditoria` (09) | T-SEG-05 |
| RN-A02 | Contrato **nunca** é excluído fisicamente, nem pelo superusuário. O soft delete é só do admin, com motivo, e fecha os alertas | `trg_contratos_sem_delete`, `fn_excluir_contrato` (09) | T-SEG-06 |
| RN-A05 | A trilha de auditoria só aceita inserção | `fn_auditoria_imutavel` (09) | T-SEG-05 |

## 7. Importação (regra de não destruição)

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-I01 | Cada célula é guardada como veio, em `valores_originais`, e essa coluna é **imutável**: nem o superusuário a altera. Linhas e cargas não são excluídas, só rejeitadas com motivo | `fn_importacao_original_imutavel`, `fn_importacao_sem_exclusao` (05) | T-IMP-03 |
| RN-I02 | O revisor corrige por `ajustes`, que se sobrepõem ao normalizado. Ao validar de novo, o normalizado é recalculado a partir do original e os ajustes são reaplicados | `fn_importacao_validar` (05) | T-IMP-04 |
| RN-I03 | Erro bloqueia a linha. Aviso não bloqueia: a linha entra e o aviso vira o alerta DQ-IMPORT até ser marcado como tratado | `fn_importacao_aprovar` (05), DQ-IMPORT (06) | T-IMP-05, T-IMP-06 |
| RN-I04 | **Segregação**: quem carregou o arquivo não aprova a mesma importação | `fn_importacao_aprovar`, check em `importacoes` (05) | T-IMP-04 |
| RN-I05 | O mesmo arquivo (hash SHA-256) não entra duas vezes, salvo se a carga anterior foi rejeitada | `importacoes_arquivo_uk` (05) | T-IMP-07 |
| RN-I06 | Contrato já cadastrado é **vinculado**, nunca sobrescrito | `fn_importacao_aprovar` (05) | — |
| RN-I07 | Na coluna Y, cada valor vira uma tarefa da campanha do órgão: "Pendente" = aberta, "Assinado e Publicado" = concluída, "Não será executado" = cancelada. **[REGRA A CONFIRMAR]** pergunta 29.2 nº 3 | `fn_importacao_aprovar` (05) | T-IMP-05 |

### Códigos de erro e aviso da importação

| Código | Severidade | Significado |
|---|---|---|
| IMP-ORGAO | erro | Órgão não reconhecido, nem pela sigla, nem pelo prefixo do processo |
| IMP-ORGAO-PREFIXO | aviso | Órgão inferido pelo prefixo do processo SEI |
| IMP-OBJETO | erro / aviso | Sem objeto. Em demanda sem número e sem início, é só aviso e o objeto entra como [DADO AUSENTE] |
| IMP-DUP | erro | Mesmo órgão, tipo, número e ano em outra linha da carga |
| IMP-DATA | erro | Data ilegível |
| IMP-NUM / IMP-NUM-COMPL | aviso | Número fora do padrão, ou com complemento como "(BRASVIP)" |
| IMP-SEM-INICIO | aviso | Sem início de vigência: entra como "Em formalização" |
| IMP-TERM-DIV | aviso | Término ≠ início + prazo |
| IMP-TERM-INICIO | aviso | Término anterior ao início: é descartado e vale o cálculo |
| IMP-INICIO-ASSIN / IMP-PUB-ASSIN | aviso | Início ou publicação antes da assinatura |
| IMP-ITENS / IMP-QXU / IMP-VALOR-GLOBAL | aviso | Itens em texto livre, ou valores que não fecham |
| IMP-PORTARIA / IMP-PORTARIA-DATA | aviso | Portaria sem número ou sem data |
| IMP-PESSOA-DUP | aviso | A mesma pessoa em dois papéis na linha |
| IMP-CNPJ | aviso | Fornecedor sem CNPJ (provisório) |
| IMP-JA-CADASTRADO | aviso | O contrato já existe e será apenas vinculado |

## 8. Motor de alertas

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-M01 | O motor é **idempotente**: rodar duas vezes não muda nada | `fn_motor_alertas` (07) | T-MOT-02 |
| RN-M02 | Há um alerta aberto por regra × contrato × chave. Ao mudar de faixa (ex.: de 60 para 30 dias), o alerta antigo **fecha** e o novo **abre**, e o histórico fica preservado | `alertas_abertos_uk` (06), motor (07) | T-MOT-03 |
| RN-M03 | Alerta fechado conclui a tarefa automaticamente. Se a severidade sobe, a prioridade da tarefa sobe junto | motor (07) | T-MOT-03 |
| RN-M04 | A tarefa vai para o **gestor designado** quando a regra é do gestor; senão, fica na fila da gestão de contratos. O prazo é contado em dias úteis por prioridade: crítica 2, alta 5, média 10, baixa 20 **[REGRA A CONFIRMAR]** | motor (07), parâmetro `tarefas.prazo_dias_uteis` | T-MOT-01 |
| RN-M05 | Alerta novo, ou que subiu de severidade, notifica o responsável no app e também por e-mail a partir de "alerta". A partir de "alto", notifica toda a gestão do órgão | motor (07), parâmetros `notificacao.*` | T-MOT-01 |
| RN-M06 | VIG-180 e VIG-120 silenciam quando já há processo de prorrogação ou nova contratação vinculado, ou aditivo de prazo em tramitação. VIG-090 em diante **não** silenciam | VIG-* (06) | T-MOT-07 |
| RN-M07 | Regra desativada (globalmente ou só no órgão) fecha os alertas abertos com a resolução `regra_desativada` | motor (07), `regras_alerta_orgao` (06) | T-MOT-10 |
| RN-M08 | O usuário só registra **ciência** no alerta: não muda severidade, não fecha, não apaga | `fn_alerta_so_ciente` (10) | T-SEG-07 |

## 9. Saúde, risco e qualidade

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-S01 | **Saúde** = itens atendidos ÷ itens aplicáveis. São 13 itens explicáveis, cada um com status atendido, não atendido ou não se aplica | `vw_contrato_saude` (08) | T-SCO-03 |
| RN-R01 | **Risco** por dimensão = pontos do alerta aberto mais grave da dimensão: planejamento 20, atenção 40, alerta 60, alto 80, crítico 100. Os pesos são vigência 25, fiscalização 15, formalização 10, publicações 10, documentação e garantia 10, qualidade 10, financeiro 10, fornecedor 5 e ocorrências 5 **[REGRA A CONFIRMAR]** | `vw_contrato_risco` (08) | T-SCO-01 |
| RN-R02 | Dimensão **sem dado** sai do cálculo e a **cobertura** é exibida. No MVP, financeiro, fornecedor e ocorrências ficam de fora, o que dá cobertura de 80% | `vw_contrato_risco` (08) | T-SCO-01 |
| RN-R03 | Materialidade: fator de 0,8 até R$ 100 mil, 1,0 até R$ 1 mi, 1,2 até R$ 5 mi e 1,4 acima de R$ 5 mi **[REGRA A CONFIRMAR]**. Ordena o Top 10 | `vw_contrato_risco`, `vw_painel_top_atencao` (08, 11) | T-SCO-01, T-SCO-05 |
| RN-R04 | Ajuste manual **só eleva** o risco e exige justificativa de pelo menos 20 caracteres | `riscos_ajustes` (08) | T-SCO-02 |
| RN-R05 | O risco de cada contrato é registrado diariamente, para mostrar a tendência | `fn_registrar_riscos` (08) | T-SCO-06 |
| RN-Q01 | **Qualidade do dado** do contrato = 50% completude (15 campos essenciais) + 50% consistência (100 − 20 por inconsistência DQ aberta) **[REGRA A CONFIRMAR]** | `vw_contrato_qualidade` (08) | T-SCO-04 |

## 10. Segurança (perfis e órgão)

| Código | Regra | Implementação | Testes |
|---|---|---|---|
| RN-SEG01 | Cada usuário só vê os órgãos em que tem perfil. Admin com órgão nulo vê todos. As views também respeitam a RLS (`security_invoker`) | RLS (10) | T-SEG-01 |
| RN-SEG02 | Fiscal, financeiro, jurídico, alta gestão e auditoria **leem**. Só admin e gestão de contratos criam e alteram | RLS (10) | T-SEG-02 |
| RN-SEG03 | O gestor designado só altera observações, categoria e unidade do contrato | `fn_contrato_restringir_gestor` (10) | T-SEG-03 |
| RN-SEG04 | Usuário anônimo não acessa nada | grants (10) | T-SEG-08 |
| RN-SEG05 | Rotinas internas (motor, cron) rodam em contexto de sistema. A API não consegue ligar esse contexto, porque `set_config` não é exposto | `fn_contexto_sistema` (01) | T-MOT-* |
