-- =============================================================================
-- SIGC · 12 · Carga de configuração (sem dados de contratos)
--
-- Contratos, pessoas e fornecedores entram SOMENTE pela importação.
-- Cada parâmetro que responde a uma pergunta em aberto traz a_validar preenchido;
-- a tela Administração lista esses itens até a área confirmar.
-- =============================================================================

-- Órgãos. Nome oficial: [DADO AUSENTE] até a área informar.
insert into public.orgaos (sigla, siglas_anteriores, prefixos_sei) values
  ('SEDES',    array['SEDEICS'], array['220001', '220012']),
  ('SEENEMAR', array[]::text[],  array['480001']);
-- Prefixo 150001 (BRASVIP, METTA, Containers): órgão a confirmar (pergunta 29.2 nº 5)

-- -----------------------------------------------------------------------------
-- Parâmetros globais
-- -----------------------------------------------------------------------------
insert into public.parametros (chave, valor, descricao, a_validar) values
('vigencia.convencao_termino', '"edate_menos_1"',
 'Fim calculado = início + prazo − 1 dia (edate_menos_1) ou mesmo dia do mês (mesmo_dia). Vale só quando o termo não informa o término.',
 '[REGRA A CONFIRMAR] Pergunta 29.2 nº 1: SEDES usa EDATE − 1; SEENEMAR registra +1 dia'),
('vigencia.limite_meses_8666', '60', 'Limite de vigência de serviço contínuo no regime da Lei 8.666/1993 (art. 57, II)',
 '[REGRA A CONFIRMAR] Prorrogação excepcional de 12 meses (art. 57, §4º) não considerada'),
('vigencia.limite_meses_14133', '120', 'Limite de vigência de serviço contínuo na Lei 14.133/2021 (art. 107)', '[REGRA A CONFIRMAR]'),
('valores.limite_acrescimo_pct', '25', 'Limite de acréscimos/supressões quantitativos acumulados (art. 125 da Lei 14.133)',
 '[REGRA A CONFIRMAR] 50% para reforma de edifício ou equipamento'),
('pncp.regime_presumido_desde', '"2024-01-01"',
 'Contratos com regime "a confirmar" assinados a partir desta data são tratados como Lei 14.133 nos alertas de PNCP',
 '[REGRA A CONFIRMAR] Pergunta 29.2 nº 6'),
('doerj.prazo_dias', '20', 'Prazo, em dias corridos, para publicação no DOERJ após a assinatura',
 '[VALIDAR REGULAMENTAÇÃO ESTADUAL/RJ] Pergunta 29.2 nº 7'),
('importacao.marcadores_nao_se_aplica', '["N/C"]', 'Textos da planilha que significam "não se aplica"',
 '[REGRA A CONFIRMAR] Pergunta 29.2 nº 2'),
('importacao.marcadores_nao_informado', '["****", "***", "**", "* * *", "XXX", "-"]', 'Textos da planilha que significam "não informado"',
 '[REGRA A CONFIRMAR] Pergunta 29.2 nº 2'),
('importacao.campanha_coluna_y',
 '{"nome": "Apostilamento de troca do órgão contratante (coluna Y)", "objetivo": "Acompanhar o apostilamento dos contratos marcados na coluna \"Apostilamento p/ SEDEICSCTI\" da planilha"}',
 'Campanha criada na importação a partir da coluna Y', '[REGRA A CONFIRMAR] Pergunta 29.2 nº 3'),
('tarefas.prazo_dias_uteis', '{"critica": 2, "alta": 5, "media": 10, "baixa": 20}', 'Prazo das tarefas geradas pelo motor, por prioridade', '[REGRA A CONFIRMAR]'),
('notificacao.severidade_minima_equipe', '"alto"', 'A partir desta severidade, toda a gestão de contratos do órgão é notificada', null),
('notificacao.severidade_minima_email', '"alerta"', 'A partir desta severidade, a notificação também vai por e-mail', '[REQUISITO A VALIDAR] SMTP institucional (pergunta 29.2 nº 9)'),
('risco.pesos', '{"vigencia": 25, "fiscalizacao": 15, "formalizacao": 10, "publicacoes": 10, "documentacao_garantia": 10, "qualidade_dado": 10, "financeiro": 10, "fornecedor": 5, "ocorrencias": 5}',
 'Pesos das dimensões do Risk Score (seção 16.1)', '[REGRA A CONFIRMAR]'),
('risco.pontos_severidade', '{"planejamento": 20, "atencao": 40, "alerta": 60, "alto": 80, "critico": 100}',
 'Pontos de risco da dimensão conforme o alerta aberto mais grave', '[REGRA A CONFIRMAR]'),
('risco.materialidade', '[{"ate": 100000, "fator": 0.8}, {"ate": 1000000, "fator": 1.0}, {"ate": 5000000, "fator": 1.2}, {"ate": null, "fator": 1.4}]',
 'Fator de materialidade pelo valor global atualizado (ordena o Top 10)', '[REGRA A CONFIRMAR]');

-- -----------------------------------------------------------------------------
-- Regras de alerta (catálogo: REGRAS_DE_NEGOCIO.md)
-- -----------------------------------------------------------------------------
insert into public.regras_alerta (codigo, nome, descricao, dimensao, severidade, parametros, ativo, gera_tarefa, responsavel, base_legal, a_validar) values
('VIG-180', 'Vencimento em até 180 dias', 'Planejar prorrogação ou nova contratação', 'vigencia', 'planejamento', '{"dias": 180, "ignorar_com_renovacao": true}', true, true, 'gestor', null, null),
('VIG-120', 'Vencimento em até 120 dias', 'Abrir processo de prorrogação ou nova contratação', 'vigencia', 'atencao', '{"dias": 120, "ignorar_com_renovacao": true}', true, true, 'gestor', null, null),
('VIG-090', 'Vencimento em até 90 dias', 'Prorrogação ou nova contratação em andamento?', 'vigencia', 'alerta', '{"dias": 90}', true, true, 'gestor', null, null),
('VIG-060', 'Vencimento em até 60 dias', 'Risco de descontinuidade', 'vigencia', 'alto', '{"dias": 60}', true, true, 'gestor', null, null),
('VIG-030', 'Vencimento em até 30 dias', 'Risco iminente de descontinuidade', 'vigencia', 'critico', '{"dias": 30}', true, true, 'gestor', null, null),
('VIG-VENC', 'Vencido sem ato de encerramento', 'Confirmar se houve prorrogação não cadastrada ou registrar o encerramento', 'vigencia', 'critico', '{}', true, true, 'gestao_contratos', null, null),
('VIG-LIM', 'Limite de prorrogação', 'A próxima prorrogação ultrapassa o limite do regime legal', 'vigencia', 'alto', '{"antecedencia_dias": 180, "prorrogacao_tipica_meses": 12}', true, true, 'gestor', 'Lei 8.666 art. 57, II · Lei 14.133 art. 107', '[REGRA A CONFIRMAR] depende do regime legal (pergunta 29.2 nº 6)'),
('FIS-SEM', 'Sem gestor ou fiscal', 'Contrato vigente ou vencido sem gestor ou sem fiscal designado', 'fiscalizacao', 'critico', '{}', true, true, 'gestao_contratos', 'Lei 14.133 art. 117', null),
('FIS-SUB', 'Sem fiscal substituto', 'Contrato vigente sem fiscal substituto', 'fiscalizacao', 'atencao', '{}', true, true, 'gestao_contratos', null, null),
('FIS-PORT', 'Designação sem portaria publicada', 'Designação em vigor sem portaria publicada após N dias', 'fiscalizacao', 'alerta', '{"dias": 15}', true, true, 'gestao_contratos', null, '[REGRA A CONFIRMAR] prazo de 15 dias'),
('FIS-AUS', 'Responsável afastado ou desligado', 'Pessoa designada com afastamento em curso ou desligada', 'fiscalizacao', 'alto', '{}', true, true, 'gestao_contratos', null, null),
('FIS-SEG', 'Segregação de funções', 'A mesma pessoa ocupa mais de um papel no contrato. Recomenda-se designar atores distintos; a operação não é bloqueada', 'fiscalizacao', 'alerta', '{}', true, true, 'gestao_contratos', 'Lei 14.133 art. 7º, §1º', null),
('PUB-PNCP', 'Sem publicação no PNCP', 'Contrato ou aditivo sem PNCP após o prazo em dias úteis', 'publicacoes', 'alerta', '{"prazo_licitacao_dias_uteis": 20, "prazo_direta_dias_uteis": 10, "prazo_presumido_dias_uteis": 10}', true, true, 'gestor', 'Lei 14.133 art. 94', 'Forma de contratação "a confirmar" usa o prazo menor (10 dias úteis)'),
('PUB-DOERJ', 'Sem publicação no DOERJ', 'Contrato ou alteração sem DOERJ após N dias corridos', 'publicacoes', 'alerta', '{"dias": 20}', true, true, 'gestor', null, '[VALIDAR REGULAMENTAÇÃO ESTADUAL/RJ]'),
('GAR-PEND', 'Garantia não apresentada', 'Garantia exigida e não apresentada após N dias do início', 'documentacao_garantia', 'alerta', '{"dias_apos_inicio": 10}', true, true, 'gestor', 'Lei 14.133 art. 96', 'Regra mantida ativa: a área cadastrará as garantias (decisão de 07/10/2026). [REGRA A CONFIRMAR] prazo de apresentação'),
('GAR-VENC', 'Garantia a vencer', 'Garantia vence em até N dias ou antes do fim da vigência + margem', 'documentacao_garantia', 'alerta', '{"dias": 30, "margem_apos_vigencia_dias": 0}', true, true, 'gestor', null, '[REGRA A CONFIRMAR] margem após a vigência · [DADO AUSENTE] validade não consta da planilha'),
('ALT-PEND', 'Alteração parada', 'Aditivo/apostilamento na mesma etapa há mais de N dias', 'formalizacao', 'atencao', '{"dias": 30}', true, true, 'gestor', null, null),
('DQ-TERM', 'Término divergente', 'Término informado difere de início + prazo', 'qualidade_dado', 'atencao', '{"tolerancia_dias": 0}', true, true, 'gestao_contratos', null, 'Depende da convenção de término (pergunta 29.2 nº 1)'),
('DQ-VALOR', 'Valores inconsistentes', 'Σ itens ≠ mensal ou mensal × prazo ≠ global', 'qualidade_dado', 'atencao', '{"tolerancia_pct": 0.5}', true, true, 'gestao_contratos', null, 'Pergunta 29.2 nº 4 (reajustes incluídos no valor?)'),
('DQ-CNPJ', 'Fornecedor sem CNPJ', 'Fornecedor provisório', 'qualidade_dado', 'atencao', '{}', true, false, 'gestao_contratos', null, null),
('DQ-REGIME', 'Regime legal não informado', 'Regime 8.666 × 14.133 a confirmar', 'qualidade_dado', 'atencao', '{}', true, false, 'gestao_contratos', null, null),
('DQ-VIG', 'Vigência indefinida', 'Contrato iniciado sem término nem prazo', 'qualidade_dado', 'alto', '{}', true, true, 'gestao_contratos', null, null),
('DQ-HIST', 'Histórico incompleto', 'Período vigente veio de aditivo; contrato original e alterações a cadastrar', 'qualidade_dado', 'atencao', '{}', true, false, 'gestao_contratos', null, null),
('DQ-IMPORT', 'Inconsistência da importação', 'Aviso da importação ainda não tratado', 'qualidade_dado', 'atencao',
 '{"ignorar_codigos": ["IMP-CNPJ", "IMP-SEM-INICIO", "IMP-TERM-DIV", "IMP-VALOR-GLOBAL", "IMP-QXU"]}', true, true, 'gestao_contratos', null, null),
('FIN-EXEC', 'Execução financeira desproporcional', 'Executado acima de X% com mais de Y% de prazo restante', 'financeiro', 'alerta', '{}', false, true, 'gestor', null, '[DADO AUSENTE] fase 2 (SIAFE)'),
('SLA-OCOR', 'SLA abaixo do contratado', 'Medição abaixo do nível de serviço', 'ocorrencias', 'alerta', '{}', false, true, 'gestor', null, '[DADO AUSENTE] fase 2 (medições)');

-- -----------------------------------------------------------------------------
-- Feriados (mesma carga do GT PROPAG; editáveis em Administração)
-- -----------------------------------------------------------------------------
insert into public.feriados (data, descricao) values
('2026-01-01', 'Confraternização Universal'),
('2026-01-20', 'São Sebastião (Município do Rio)'),
('2026-02-16', 'Carnaval (ponto facultativo)'),
('2026-02-17', 'Carnaval'),
('2026-04-03', 'Paixão de Cristo'),
('2026-04-21', 'Tiradentes'),
('2026-04-23', 'São Jorge (RJ)'),
('2026-05-01', 'Dia do Trabalho'),
('2026-06-04', 'Corpus Christi (ponto facultativo)'),
('2026-09-07', 'Independência do Brasil'),
('2026-10-12', 'Nossa Senhora Aparecida'),
('2026-10-28', 'Dia do Servidor Público (ponto facultativo)'),
('2026-11-02', 'Finados'),
('2026-11-15', 'Proclamação da República'),
('2026-11-20', 'Dia Nacional de Zumbi e da Consciência Negra'),
('2026-12-25', 'Natal'),
('2027-01-01', 'Confraternização Universal'),
('2027-01-20', 'São Sebastião (Município do Rio)'),
('2027-02-08', 'Carnaval (ponto facultativo)'),
('2027-02-09', 'Carnaval'),
('2027-03-26', 'Paixão de Cristo'),
('2027-04-21', 'Tiradentes'),
('2027-04-23', 'São Jorge (RJ)'),
('2027-05-01', 'Dia do Trabalho'),
('2027-05-27', 'Corpus Christi (ponto facultativo)'),
('2027-09-07', 'Independência do Brasil'),
('2027-10-12', 'Nossa Senhora Aparecida'),
('2027-10-28', 'Dia do Servidor Público (ponto facultativo)'),
('2027-11-02', 'Finados'),
('2027-11-15', 'Proclamação da República'),
('2027-11-20', 'Dia Nacional de Zumbi e da Consciência Negra'),
('2027-12-25', 'Natal');

