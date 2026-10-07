-- Testes de Saúde, Risco e Qualidade do dado. Dados DEMO; tudo é desfeito no fim.
begin;
set local sigc.data_referencia = '2026-10-07';

do $$
declare c uuid; c_ok uuid; v record;
begin
  -- Contrato vencendo em 14 dias, sem equipe e sem publicações
  c := teste.contrato('SEDES', '904/2024', '2024-10-22', 24, p_fim => '2026-10-21', p_valor => 5990000);
  -- Contrato em ordem, longe do vencimento
  c_ok := teste.contrato('SEDES', '911/2025', '2025-08-26', 36, p_fim => '2028-08-25', p_valor => 50000);
  perform teste.equipe_completa(c_ok);
  insert into public.publicacoes (contrato_id, veiculo, data_publicacao) values (c_ok, 'doerj', '2025-08-27'), (c_ok, 'pncp', '2025-08-27');
  insert into public.processos (orgao_id, numero) values (teste.orgao('SEDES'), '220001/000911/2025');
  insert into public.contrato_processos (contrato_id, processo_id, papel)
  select c_ok, id, 'principal' from public.processos where numero = '220001/000911/2025';
  perform public.fn_motor_alertas();

  -- T-SCO-01: risco com cobertura (financeiro, fornecedor e ocorrências fora do cálculo → 80%)
  select * into v from public.vw_contrato_risco where contrato_id = c;
  perform teste.ok(v.cobertura = 80, 'T-SCO-01 cobertura 80% (sem dados financeiros, de fornecedor e de ocorrências)');
  perform teste.ok((v.componentes -> 'vigencia' ->> 'pontos')::int = 100 and (v.componentes -> 'fiscalizacao' ->> 'pontos')::int = 100,
                   'T-SCO-01 vigência e fiscalização críticas = 100 pontos');
  -- (25×100 + 15×100 + 10×0 + 10×60 + 10×0 + 10×0) / 80 = 57,5 → 58
  perform teste.ok(v.score_calculado = 58 and v.nivel = 'medio', 'T-SCO-01 score 58 (médio) pela média ponderada das dimensões cobertas');
  perform teste.ok(v.fator_materialidade = 1.4 and v.prioridade_atencao = 81.2, 'T-SCO-01 materialidade 1,4 para R$ 5,99 mi');
  perform teste.ok((select score_calculado from public.vw_contrato_risco where contrato_id = c_ok) = 0, 'T-SCO-01 contrato em ordem tem risco 0');

  -- T-SCO-02: ajuste manual só eleva
  insert into public.riscos_ajustes (contrato_id, score_minimo, justificativa, criado_por)
  values (c_ok, 70, 'DEMO fluxo de sindicância em andamento contra a contratada', gen_random_uuid());
  perform teste.ok((select score from public.vw_contrato_risco where contrato_id = c_ok) = 70, 'T-SCO-02 ajuste eleva o risco para 70');
  insert into public.riscos_ajustes (contrato_id, score_minimo, justificativa, criado_por)
  values (c, 10, 'DEMO tentativa de reduzir o risco calculado', gen_random_uuid());
  perform teste.ok((select score from public.vw_contrato_risco where contrato_id = c) = 58, 'T-SCO-02 ajuste abaixo do calculado não reduz');
  perform teste.erro(format($q$insert into public.riscos_ajustes (contrato_id, score_minimo, justificativa, criado_por) values (%L, 90, 'curta', gen_random_uuid())$q$, c),
                     'riscos_ajustes_justificativa_check', 'T-SCO-02 justificativa curta é recusada');

  -- T-SCO-03: saúde explicável
  select * into v from public.vw_contrato_saude where contrato_id = c_ok;
  perform teste.ok(v.score = 100 and v.atendidos = v.aplicaveis, 'T-SCO-03 contrato em ordem: saúde 100');
  perform teste.ok(v.itens @> '[{"item": "Garantia apresentada", "status": "nao_se_aplica"}]', 'T-SCO-03 garantia não exigida = não se aplica');
  select * into v from public.vw_contrato_saude where contrato_id = c;
  perform teste.ok(v.score < 50 and v.itens @> '[{"item": "Gestor designado", "status": "nao_atendido"}]',
                   'T-SCO-03 contrato sem equipe: saúde baixa com o item explicado');

  -- T-SCO-04: qualidade do dado
  perform teste.ok((select completude from public.vw_contrato_qualidade where contrato_id = c_ok) = 100, 'T-SCO-04 completude 100% no contrato em ordem');
  perform teste.ok((select completude from public.vw_contrato_qualidade where contrato_id = c) < 100, 'T-SCO-04 completude menor sem processo e equipe');

  -- T-SCO-05: painel
  perform teste.ok((select vencem_30_dias = 1 and vigentes = 2 from public.vw_painel_cards where orgao = 'SEDES'), 'T-SCO-05 cards do painel');
  perform teste.ok((select contrato_id from public.vw_painel_top_atencao where orgao = 'SEDES' and posicao = 1) = c,
                   'T-SCO-05 Top 10: o contrato de R$ 5,99 mi a 14 dias aparece em 1º');
  perform teste.ok((select motivo_principal like 'Vence em 14 dias%' or motivo_principal like 'Sem gestor%'
                      from public.vw_painel_top_atencao where contrato_id = c), 'T-SCO-05 motivo principal = alerta mais grave');
  perform public.fn_registrar_riscos();
  perform teste.ok((select count(*) from public.riscos_historico where data = '2026-10-07') = 2, 'T-SCO-06 histórico diário de risco');
end $$;

rollback;
