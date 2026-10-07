-- Testes do motor de alertas, tarefas e notificações. Dados DEMO; tudo é desfeito no fim.
begin;
set local sigc.data_referencia = '2026-09-01';

do $$
declare
  c_vence uuid; c_vencido uuid; c_sem uuid; c_pncp uuid; c_lic uuid; c_renov uuid; c_dq uuid;
  u_gestor uuid; p_gestor uuid; r record; v_tarefa record; v_proc uuid;
begin
  u_gestor := teste.usuario('DEMO Gestora Usuaria', 'gestor', 'SEDES');
  p_gestor := teste.pessoa('DEMO Gestora Usuaria', u_gestor);

  -- Contrato que vence em 21/10/2026 (50 dias em 01/09)
  c_vence := teste.contrato('SEDES', '904/2024', '2024-10-22', 24, p_fim => '2026-10-21', p_valor => 5990000);
  perform teste.designar(c_vence, p_gestor, 'gestor');
  perform teste.designar(c_vence, teste.pessoa('DEMO Fiscal A'), 'fiscal');
  perform teste.designar(c_vence, teste.pessoa('DEMO Substituto A'), 'fiscal_substituto');
  insert into public.publicacoes (contrato_id, veiculo, data_publicacao) values (c_vence, 'doerj', '2024-10-25'), (c_vence, 'pncp', '2024-10-25');

  -- T-MOT-01: faixa de 60 dias
  select * into r from public.fn_motor_alertas();
  perform teste.ok(teste.alertas(c_vence) = array['VIG-060'], 'T-MOT-01 contrato a 50 dias abre só VIG-060');
  select * into v_tarefa from public.tarefas t join public.alertas a on a.id = t.alerta_id where a.contrato_id = c_vence;
  perform teste.ok(v_tarefa.responsavel_pessoa_id = p_gestor and v_tarefa.prioridade = 'alta' and v_tarefa.origem = 'regra',
                   'T-MOT-01 tarefa alta para o gestor designado');
  perform teste.ok(v_tarefa.prazo = public.fn_somar_dias_uteis('2026-09-01', 5), 'T-MOT-01 prazo da tarefa em dias úteis');
  perform teste.ok(exists (select 1 from public.notificacoes where usuario_id = u_gestor and canal = 'app')
               and exists (select 1 from public.notificacoes where usuario_id = u_gestor and canal = 'email'),
                   'T-MOT-01 gestor notificado no app e por e-mail');

  -- T-MOT-02: idempotência
  select * into r from public.fn_motor_alertas();
  perform teste.ok(r.abertos = 0 and r.atualizados = 0 and r.fechados = 0 and r.tarefas_criadas = 0,
                   'T-MOT-02 segunda execução não muda nada');

  -- T-MOT-03: muda de faixa (60 → 30): fecha o antigo, abre o novo, conclui a tarefa antiga
  perform set_config('sigc.data_referencia', '2026-10-07', true);
  select * into r from public.fn_motor_alertas();
  perform teste.ok(teste.alertas(c_vence) = array['VIG-030'], 'T-MOT-03 em 07/10 o alerta passa a VIG-030');
  perform teste.ok((select resolucao from public.alertas where contrato_id = c_vence and regra_codigo = 'VIG-060') = 'condicao_cessou',
                   'T-MOT-03 VIG-060 fechado automaticamente');
  perform teste.ok((select t.status from public.tarefas t join public.alertas a on a.id = t.alerta_id
                     where a.contrato_id = c_vence and a.regra_codigo = 'VIG-060') = 'concluida',
                   'T-MOT-03 tarefa do VIG-060 concluída automaticamente');
  perform teste.ok((select t.prioridade from public.tarefas t join public.alertas a on a.id = t.alerta_id
                     where a.contrato_id = c_vence and a.regra_codigo = 'VIG-030') = 'critica',
                   'T-MOT-03 nova tarefa crítica');
  perform teste.ok((select titulo from public.alertas where contrato_id = c_vence and regra_codigo = 'VIG-030' and resolvido_em is null)
                   like 'Vence em 14 dias (21/10/2026)%', 'T-MOT-03 título do alerta com dias e data');

  -- T-MOT-04: vencido sem encerramento → VIG-VENC; encerramento formal fecha o alerta
  c_vencido := teste.contrato('SEDES', '905/2023', '2023-08-08', 36, p_fim => '2026-08-07');
  perform teste.equipe_completa(c_vencido);
  insert into public.publicacoes (contrato_id, veiculo, data_publicacao) values (c_vencido, 'doerj', '2023-08-09'), (c_vencido, 'pncp', '2023-08-09');
  perform public.fn_motor_alertas();
  perform teste.ok(teste.alertas(c_vencido) = array['VIG-VENC'], 'T-MOT-04 vencido sem ato abre VIG-VENC');
  update public.contratos set situacao_manual = 'encerrado', situacao_manual_desde = '2026-08-07',
         situacao_manual_ato = 'DEMO termo de encerramento', situacao_manual_motivo = 'DEMO' where id = c_vencido;
  perform public.fn_motor_alertas();
  perform teste.ok(teste.alertas(c_vencido) = '{}', 'T-MOT-04 encerramento formal fecha o alerta');

  -- T-MOT-05: fiscalização
  c_sem := teste.contrato('SEENEMAR', '906/2025', '2025-07-16', 36, p_fim => '2028-07-15');
  insert into public.publicacoes (contrato_id, veiculo, data_publicacao) values (c_sem, 'doerj', '2025-07-17'), (c_sem, 'pncp', '2025-07-17');
  perform public.fn_motor_alertas();
  perform teste.ok(teste.alertas(c_sem) = array['FIS-SEM', 'FIS-SUB'], 'T-MOT-05 sem equipe: FIS-SEM e FIS-SUB');
  perform teste.ok((select severidade from public.alertas where contrato_id = c_sem and regra_codigo = 'FIS-SEM' and resolvido_em is null) = 'critico',
                   'T-MOT-05 FIS-SEM é crítico');
  declare p uuid := teste.pessoa('DEMO Acumula Papeis');
  begin
    perform teste.designar(c_sem, p, 'gestor');
    perform teste.designar(c_sem, p, 'fiscal', false, '2026-01-01');   -- portaria não publicada há mais de 15 dias
  end;
  perform public.fn_motor_alertas();
  perform teste.ok(teste.alertas(c_sem) = array['FIS-PORT', 'FIS-SEG', 'FIS-SUB'],
                   'T-MOT-05 equipe parcial: portaria não publicada, segregação e sem substituto');

  -- FIS-AUS: afastamento em curso
  insert into public.pessoa_afastamentos (pessoa_id, inicio, fim, motivo)
  select pessoa_id, '2026-10-01', '2026-10-30', 'DEMO férias' from public.designacoes where contrato_id = c_vence and papel = 'fiscal';
  perform public.fn_motor_alertas();
  perform teste.ok('FIS-AUS' = any (teste.alertas(c_vence)), 'T-MOT-05 fiscal em férias abre FIS-AUS');

  -- T-MOT-06: PNCP em dias úteis (art. 94). Assinado em 22/09/2026; até 07/10 são 11 dias úteis
  c_pncp := teste.contrato('SEDES', '907/2026', '2026-09-22', 12, p_fim => '2027-09-21', p_forma => 'contratacao_direta');
  c_lic  := teste.contrato('SEDES', '908/2026', '2026-09-22', 12, p_fim => '2027-09-21', p_forma => 'licitacao');
  perform teste.equipe_completa(c_pncp); perform teste.equipe_completa(c_lic);
  insert into public.publicacoes (contrato_id, veiculo, data_publicacao) values (c_pncp, 'doerj', '2026-09-23'), (c_lic, 'doerj', '2026-09-23');
  perform teste.ok(public.fn_dias_uteis_entre('2026-09-22', '2026-10-07') = 11, 'T-MOT-06 11 dias úteis entre 22/09 e 07/10');
  perform public.fn_motor_alertas();
  perform teste.ok('PUB-PNCP' = any (teste.alertas(c_pncp)), 'T-MOT-06 contratação direta: PNCP vencido após 10 dias úteis');
  perform teste.ok(not ('PUB-PNCP' = any (teste.alertas(c_lic))), 'T-MOT-06 licitação: ainda no prazo de 20 dias úteis');
  insert into public.publicacoes (contrato_id, veiculo, data_publicacao, id_pncp) values (c_pncp, 'pncp', '2026-10-07', 'DEMO-PNCP-1');
  perform public.fn_motor_alertas();
  perform teste.ok(not ('PUB-PNCP' = any (teste.alertas(c_pncp))), 'T-MOT-06 publicação no PNCP fecha o alerta');

  -- T-MOT-07: VIG-180 não dispara quando já há processo de prorrogação
  c_renov := teste.contrato('SEDES', '909/2025', '2025-03-01', 24, p_fim => '2027-02-28');   -- 144 dias → VIG-180
  perform teste.equipe_completa(c_renov);
  insert into public.publicacoes (contrato_id, veiculo, data_publicacao) values (c_renov, 'doerj', '2025-03-02'), (c_renov, 'pncp', '2025-03-02');
  perform public.fn_motor_alertas();
  perform teste.ok(teste.alertas(c_renov) = array['VIG-180'], 'T-MOT-07 VIG-180 sem processo de renovação');
  insert into public.processos (orgao_id, numero) values (teste.orgao('SEDES'), '220001/000999/2026') returning id into v_proc;
  insert into public.contrato_processos (contrato_id, processo_id, papel) values (c_renov, v_proc, 'prorrogacao');
  perform public.fn_motor_alertas();
  perform teste.ok(teste.alertas(c_renov) = '{}', 'T-MOT-07 processo de prorrogação vinculado silencia o VIG-180');

  -- T-MOT-08: término +1 dia (padrão SEENEMAR) → DQ-TERM
  c_dq := teste.contrato('SEENEMAR', '910/2025', '2025-08-26', 36, p_fim => '2028-08-26');
  perform teste.equipe_completa(c_dq);
  insert into public.publicacoes (contrato_id, veiculo, data_publicacao) values (c_dq, 'doerj', '2025-08-27'), (c_dq, 'pncp', '2025-08-27');
  perform public.fn_motor_alertas();
  perform teste.ok(teste.alertas(c_dq) = array['DQ-TERM'], 'T-MOT-08 término +1 dia gera DQ-TERM');

  -- T-MOT-09: ALT-PEND — alteração parada há mais de 30 dias
  insert into public.alteracoes_contratuais (contrato_id, tipo, situacao, situacao_desde) values (c_dq, 'apostilamento', 'analise_juridica', '2026-08-01');
  perform public.fn_motor_alertas();
  perform teste.ok('ALT-PEND' = any (teste.alertas(c_dq)), 'T-MOT-09 apostilamento parado há 67 dias abre ALT-PEND');

  -- T-MOT-10: regra desativada por órgão fecha os alertas com resolução própria
  insert into public.regras_alerta_orgao (codigo, orgao_id, ativo) values ('DQ-TERM', teste.orgao('SEENEMAR'), false);
  perform public.fn_motor_alertas();
  perform teste.ok((select resolucao from public.alertas where contrato_id = c_dq and regra_codigo = 'DQ-TERM') = 'regra_desativada',
                   'T-MOT-10 desativar a regra no órgão fecha o alerta como regra_desativada');
end $$;

rollback;
