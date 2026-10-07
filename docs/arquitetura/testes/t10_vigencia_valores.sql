-- Testes de vigência, situação e valores (RN-V*, RN-$*). Dados DEMO; tudo é desfeito no fim.
begin;
set local sigc.data_referencia = '2026-10-07';

do $$
declare c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; v record;
begin
  -- T-VIG-01: término informado no termo prevalece
  c1 := teste.contrato('SEDES', '901/2025', '2025-01-13', 24, p_fim => '2027-01-12');
  select * into v from public.vw_contrato_vigencia where contrato_id = c1;
  perform teste.ok(v.data_fim_efetiva = '2027-01-12' and v.fonte_fim = 'termo', 'T-VIG-01 término do termo prevalece');
  perform teste.ok(v.divergencia_termino_dias = 0, 'T-VIG-01 sem divergência na convenção EDATE − 1');

  -- T-VIG-02: sem término → início + prazo − 1 dia (RN-V02)
  c2 := teste.contrato('SEDES', '902/2025', '2025-01-13', 24);
  select * into v from public.vw_contrato_vigencia where contrato_id = c2;
  perform teste.ok(v.data_fim_efetiva = '2027-01-12' and v.fonte_fim = 'calculada', 'T-VIG-02 término calculado EDATE − 1');

  -- T-VIG-03: convenção "mesmo_dia" parametrizada por órgão
  insert into public.parametros (chave, orgao_id, valor, descricao)
  values ('vigencia.convencao_termino', teste.orgao('SEENEMAR'), '"mesmo_dia"', 'DEMO');
  c3 := teste.contrato('SEENEMAR', '903/2025', '2025-01-13', 24, p_fim => '2027-01-13');
  select * into v from public.vw_contrato_vigencia where contrato_id = c3;
  perform teste.ok(v.data_fim_calculada = '2027-01-13' and v.divergencia_termino_dias = 0, 'T-VIG-03 convenção mesmo dia por órgão');
  delete from public.parametros where chave = 'vigencia.convencao_termino' and orgao_id is not null;

  -- T-VIG-04: aditivo de prazo só conta depois de assinado
  insert into public.alteracoes_contratuais (contrato_id, tipo, numero_ordem, situacao, nova_data_fim, prorroga_meses)
  values (c1, 'aditivo_prazo', 1, 'analise_juridica', '2028-01-12', 12);
  perform teste.ok((select data_fim_efetiva from public.vw_contrato_vigencia where contrato_id = c1) = '2027-01-12',
                   'T-VIG-04 aditivo em tramitação não prorroga');
  update public.alteracoes_contratuais set situacao = 'assinado', data_assinatura = '2026-10-01' where contrato_id = c1;
  select * into v from public.vw_contrato_vigencia where contrato_id = c1;
  perform teste.ok(v.data_fim_efetiva = '2028-01-12' and v.fonte_fim = 'alteracao' and v.qtd_prorrogacoes = 1,
                   'T-VIG-04 aditivo assinado prorroga (RN-V01)');

  -- T-VIG-05: rescisão encurta a vigência
  insert into public.alteracoes_contratuais (contrato_id, tipo, situacao, data_assinatura, nova_data_fim)
  values (c2, 'rescisao', 'assinado', '2026-09-30', '2026-09-30');
  select * into v from public.vw_contrato_vigencia where contrato_id = c2;
  perform teste.ok(v.data_fim_efetiva = '2026-09-30' and v.situacao = 'vencido', 'T-VIG-05 rescisão encerra a vigência');

  -- T-VIG-06: situações calculadas
  c4 := teste.contrato('SEDES', '904/2024', '2024-10-22', 24, p_fim => '2026-10-21', p_mensal => 10000);   -- vence em 14 dias
  c5 := teste.contrato('SEDES', '905/2023', '2023-08-08', 36, p_fim => '2026-08-07');   -- vencido
  c6 := teste.contrato('SEDES', '906/2026', '2026-11-01', 12);                           -- assinado, não iniciado
  perform teste.ok((select situacao = 'vigente' and faixa_vencimento = 30 and dias_para_vencer = 14
                      from public.vw_contrato_vigencia where contrato_id = c4), 'T-VIG-06 vigente na faixa de 30 dias');
  perform teste.ok((select situacao from public.vw_contrato_vigencia where contrato_id = c5) = 'vencido', 'T-VIG-06 vencido');
  perform teste.ok((select situacao from public.vw_contrato_vigencia where contrato_id = c6) = 'nao_iniciado', 'T-VIG-06 não iniciado');
  perform teste.ok(public.fn_rotulo_situacao('vencido', null) = 'Vencido – vigência a confirmar', 'T-VIG-06 rótulo RN-V04');
  insert into public.contratos (orgao_id, objeto) values (teste.orgao('SEDES'), 'DEMO demanda sem formalização');
  perform teste.ok((select count(*) from public.vw_contrato_vigencia vg join public.contratos k on k.id = vg.contrato_id
                     where k.objeto = 'DEMO demanda sem formalização' and vg.situacao = 'em_formalizacao') = 1,
                   'T-VIG-06 sem início = em formalização');

  -- T-VIG-07: situação manual exige ato, data e motivo
  perform teste.erro(format('update public.contratos set situacao_manual = %L where id = %L', 'encerrado', c5),
                     'ck_situacao_manual', 'T-VIG-07 encerramento sem ato é recusado');
  update public.contratos set situacao_manual = 'encerrado', situacao_manual_desde = '2026-08-07',
         situacao_manual_ato = 'DEMO Termo de encerramento 1/2026', situacao_manual_motivo = 'DEMO fim do prazo'
   where id = c5;
  perform teste.ok((select situacao from public.vw_contrato_vigencia where contrato_id = c5) = 'encerrado', 'T-VIG-07 encerrado com ato');

  -- T-VIG-08: início antes da assinatura (RN-V06)
  perform teste.erro($q$insert into public.contratos (orgao_id, objeto, data_assinatura, inicio_vigencia)
                        values (teste.orgao('SEDES'), 'DEMO', '2026-03-23', '2026-03-01')$q$,
                     'ck_inicio_assinatura', 'T-VIG-08 início antes da assinatura sem justificativa é recusado');
  insert into public.contratos (orgao_id, objeto, data_assinatura, inicio_vigencia, justificativa_inicio_antes_assinatura)
  values (teste.orgao('SEDES'), 'DEMO', '2026-03-23', '2026-03-01', 'DEMO efeitos retroativos autorizados no processo');
  perform teste.ok(true, 'T-VIG-08 com justificativa é aceito');

  -- T-VIG-09: prorrogação acima do limite do regime (RN-V05) — 8.666: 60 meses
  update public.contratos set regime_legal = 'lei_8666' where id = c4;
  perform teste.erro(format($q$insert into public.alteracoes_contratuais (contrato_id, tipo, situacao, data_assinatura, nova_data_fim)
                               values (%L, 'aditivo_prazo', 'assinado', '2026-10-01', '2029-12-21')$q$, c4),
                     'RN-V05', 'T-VIG-09 prorrogação além de 60 meses é bloqueada');
  insert into public.alteracoes_contratuais (contrato_id, tipo, situacao, data_assinatura, nova_data_fim)
  values (c4, 'aditivo_prazo', 'em_elaboracao', null, '2029-12-21');
  perform teste.ok(true, 'T-VIG-09 rascunho acima do limite é permitido (bloqueio só na assinatura)');

  -- T-VAL-01: valor atualizado = original + Σ deltas assinados (RN-$01)
  insert into public.alteracoes_contratuais (contrato_id, tipo, situacao, data_assinatura, delta_valor)
  values (c3, 'aditivo_valor', 'assinado', '2026-05-01', 30000),
         (c3, 'aditivo_valor', 'em_elaboracao', null, 99999);
  perform teste.ok((select valor_global_atual from public.vw_contrato_valores where contrato_id = c3) = 150000,
                   'T-VAL-01 valor atualizado considera só alterações assinadas');
  perform teste.ok((select acrescimo_acumulado_pct from public.vw_contrato_valores where contrato_id = c3) = 25,
                   'T-VAL-01 acréscimo acumulado = 25%');

  -- T-VAL-02: limite de acréscimos (RN-$03)
  perform teste.erro(format($q$insert into public.alteracoes_contratuais (contrato_id, tipo, situacao, data_assinatura, delta_valor)
                               values (%L, 'aditivo_valor', 'assinado', '2026-06-01', 1)$q$, c3),
                     'RN-$03', 'T-VAL-02 acréscimo acima de 25% é bloqueado');

  -- T-VAL-03: Σ (quantidade × unitário) × valor mensal (RN-$02)
  insert into public.contrato_itens (contrato_id, descricao, quantidade, valor_unitario) values (c4, 'DEMO posto', 2, 5500);
  perform teste.ok((select divergencia_itens_pct from public.vw_contrato_valores where contrato_id = c4) = 10,
                   'T-VAL-03 divergência itens × mensal = 10%');
  perform teste.ok((select divergencia_global_pct from public.vw_contrato_valores where contrato_id = c4) = 100,
                   'T-VAL-03 mensal × prazo (240.000) × global (120.000) = 100%');

  -- T-DES-01/02: designações (RN-F03)
  declare p1 uuid := teste.pessoa('DEMO Pessoa 1'); p2 uuid := teste.pessoa('DEMO Pessoa 2');
  begin
    perform teste.designar(c4, p1, 'fiscal', true, '2026-01-01');
    perform teste.erro(format($q$insert into public.designacoes (contrato_id, pessoa_id, papel, inicio) values (%L, %L, 'fiscal', '2026-06-01')$q$, c4, p1),
                       'ex_designacao_duplicada', 'T-DES-01 mesma pessoa no mesmo papel e período é recusada');
    perform teste.designar(c4, p2, 'gestor', true, '2026-01-01');
    perform teste.erro(format($q$insert into public.designacoes (contrato_id, pessoa_id, papel) values (%L, %L, 'gestor')$q$, c4, p1),
                       'ex_papel_singular', 'T-DES-02 dois gestores titulares ao mesmo tempo são recusados');
    perform teste.erro(format($q$update public.designacoes set fim = '2026-12-31' where contrato_id = %L and papel = 'gestor'$q$, c4),
                       'ck_designacao_motivo_fim', 'T-DES-03 encerrar designação exige motivo');
  end;

  -- T-PUB-01: publicação antes da assinatura (RN-P03)
  perform teste.erro(format($q$insert into public.publicacoes (contrato_id, veiculo, data_publicacao) values (%L, 'doerj', '2024-10-01')$q$, c4),
                     'RN-P03', 'T-PUB-01 publicação anterior à assinatura sem justificativa é recusada');
end $$;

rollback;
