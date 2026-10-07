-- Testes de RLS, perfis, motivo obrigatório, auditoria e soft delete. Dados DEMO; tudo é desfeito no fim.
begin;
set local sigc.data_referencia = '2026-10-07';

do $$
declare
  u_admin uuid; u_dgaf_sedes uuid; u_dgaf_seen uuid; u_gestor uuid; u_fiscal uuid; u_juridico uuid;
  c_sedes uuid; c_seen uuid; v_alt uuid; v_alerta bigint; n int;
begin
  u_admin     := teste.usuario('DEMO Admin', 'admin', null);   -- admin global (todos os órgãos)
  u_dgaf_sedes:= teste.usuario('DEMO DGAF SEDES', 'gestao_contratos', 'SEDES');
  u_dgaf_seen := teste.usuario('DEMO DGAF SEENEMAR', 'gestao_contratos', 'SEENEMAR');
  u_gestor    := teste.usuario('DEMO Gestor SEDES', 'gestor', 'SEDES');
  u_fiscal    := teste.usuario('DEMO Fiscal SEDES', 'fiscal', 'SEDES');
  u_juridico  := teste.usuario('DEMO Juridico SEDES', 'juridico', 'SEDES');

  c_sedes := teste.contrato('SEDES', '920/2025', '2025-01-13', 24, p_fim => '2027-01-12');
  c_seen  := teste.contrato('SEENEMAR', '921/2025', '2025-01-13', 24, p_fim => '2027-01-12');
  perform teste.designar(c_sedes, teste.pessoa('DEMO Gestor SEDES', u_gestor), 'gestor');
  perform public.fn_motor_alertas();

  -- T-SEG-01: isolamento por órgão
  perform teste.entrar(u_dgaf_sedes);
  perform teste.ok((select count(*) from public.contratos where id in (c_sedes, c_seen)) = 1, 'T-SEG-01 DGAF da SEDES não vê contrato da SEENEMAR');
  perform teste.ok((select count(*) from public.vw_contratos_carteira where contrato_id = c_seen) = 0, 'T-SEG-01 a view da carteira também respeita a RLS');
  perform teste.ok((select count(*) from public.alertas where contrato_id = c_seen) = 0, 'T-SEG-01 alertas da SEENEMAR invisíveis');
  perform teste.sair();
  perform teste.entrar(u_admin);
  perform teste.ok((select count(*) from public.contratos where id in (c_sedes, c_seen)) = 2, 'T-SEG-01 admin global vê os dois órgãos');
  perform teste.sair();
  perform teste.entrar(u_dgaf_seen);
  perform teste.erro(format($q$insert into public.contratos (orgao_id, objeto) values (%L, 'DEMO')$q$, teste.orgao('SEDES')),
                     'row-level security', 'T-SEG-01 DGAF da SEENEMAR não cria contrato na SEDES');
  perform teste.sair();

  -- T-SEG-02: fiscal só lê
  perform teste.entrar(u_fiscal);
  perform teste.ok((select count(*) from public.contratos where id = c_sedes) = 1, 'T-SEG-02 fiscal lê a carteira do órgão');
  perform teste.erro(format($q$insert into public.contratos (orgao_id, objeto) values (%L, 'DEMO')$q$, teste.orgao('SEDES')),
                     'row-level security', 'T-SEG-02 fiscal não cria contrato');
  update public.contratos set observacoes = 'DEMO tentativa' where id = c_sedes;
  get diagnostics n = row_count;
  perform teste.ok(n = 0, 'T-SEG-02 fiscal não altera contrato (0 linhas)');
  perform teste.sair();

  -- T-SEG-03: gestor designado altera só campos descritivos
  perform teste.entrar(u_gestor);
  update public.contratos set observacoes = 'DEMO observação do gestor' where id = c_sedes;
  perform teste.ok((select observacoes from public.contratos where id = c_sedes) = 'DEMO observação do gestor', 'T-SEG-03 gestor altera observações');
  perform teste.erro(format($q$update public.contratos set valor_global_original = 1, motivo_alteracao = 'DEMO' where id = %L$q$, c_sedes),
                     'Perfil gestor', 'T-SEG-03 gestor não altera valor');
  insert into public.alteracoes_contratuais (contrato_id, tipo, situacao) values (c_sedes, 'aditivo_prazo', 'em_elaboracao') returning id into v_alt;
  perform teste.ok(v_alt is not null, 'T-SEG-03 gestor cria alteração em rascunho');
  perform teste.erro(format($q$update public.alteracoes_contratuais set situacao = 'assinado', data_assinatura = '2026-10-01', nova_data_fim = '2028-01-12' where id = %L$q$, v_alt),
                     'sem permissão', 'T-SEG-03 gestor não assina a alteração');
  perform teste.sair();

  -- T-SEG-04: jurídico registra parecer só na análise jurídica
  update public.alteracoes_contratuais set situacao = 'analise_juridica' where id = v_alt;
  perform teste.entrar(u_juridico);
  update public.alteracoes_contratuais set parecer_juridico = 'DEMO parecer favorável', situacao = 'aguardando_assinatura' where id = v_alt;
  perform teste.ok((select situacao from public.alteracoes_contratuais where id = v_alt) = 'aguardando_assinatura', 'T-SEG-04 jurídico emite parecer e avança');
  perform teste.erro(format($q$update public.alteracoes_contratuais set delta_valor = 1000, motivo_alteracao = 'x' where id = %L$q$, v_alt),
                     'sem permissão', 'T-SEG-04 jurídico não altera valores');
  perform teste.sair();

  -- T-SEG-05: motivo obrigatório e auditoria (RN-A01)
  perform teste.entrar(u_dgaf_sedes);
  perform teste.erro(format($q$update public.contratos set valor_global_original = 130000 where id = %L$q$, c_sedes),
                     'RN-A01', 'T-SEG-05 alterar valor sem motivo é recusado');
  update public.contratos set valor_global_original = 130000, motivo_alteracao = 'DEMO 1º termo de apostilamento: reajuste IPCA' where id = c_sedes;
  perform teste.ok((select motivo_alteracao is null from public.contratos where id = c_sedes), 'T-SEG-05 o motivo não fica gravado na linha');
  perform teste.sair();
  select count(*) into n from public.auditoria
   where tabela = 'contratos' and registro_id = c_sedes::text and operacao = 'UPDATE'
     and motivo = 'DEMO 1º termo de apostilamento: reajuste IPCA' and 'valor_global_original' = any (campos_alterados)
     and usuario_nome = 'DEMO DGAF SEDES' and (antes ->> 'valor_global_original')::numeric = 120000;
  perform teste.ok(n = 1, 'T-SEG-05 auditoria com antes, depois, motivo e usuário');
  perform teste.erro('delete from public.auditoria', 'somente inserção', 'T-SEG-05 auditoria não pode ser apagada');

  -- T-SEG-06: exclusão (RN-A02)
  perform teste.entrar(u_dgaf_sedes);
  perform teste.erro(format('select public.fn_excluir_contrato(%L, %L)', c_sedes, 'DEMO'), 'administrador', 'T-SEG-06 DGAF não exclui contrato');
  perform teste.erro(format('delete from public.contratos where id = %L', c_sedes), 'permission denied', 'T-SEG-06 API não tem permissão de DELETE em contratos');
  perform teste.sair();
  perform teste.erro(format('delete from public.contratos where id = %L', c_sedes), 'RN-A02', 'T-SEG-06 nem o superusuário apaga fisicamente');
  perform teste.entrar(u_admin);
  perform public.fn_excluir_contrato(c_sedes, 'DEMO cadastro em duplicidade');
  perform teste.sair();
  perform teste.entrar(u_dgaf_sedes);
  perform teste.ok((select count(*) from public.contratos where id = c_sedes) = 0, 'T-SEG-06 contrato excluído some para o usuário comum');
  perform teste.sair();
  perform teste.ok((select deleted_motivo from public.contratos where id = c_sedes) = 'DEMO cadastro em duplicidade', 'T-SEG-06 soft delete guarda o motivo');
  perform teste.ok(not exists (select 1 from public.alertas where contrato_id = c_sedes and resolvido_em is null), 'T-SEG-06 alertas do excluído são fechados');

  -- T-SEG-07: alerta — usuário só registra ciência
  select id into v_alerta from public.alertas where contrato_id = c_seen and resolvido_em is null limit 1;
  perform teste.entrar(u_dgaf_seen);
  perform teste.erro(format($q$update public.alertas set severidade = 'planejamento' where id = %L$q$, v_alerta),
                     'permission denied', 'T-SEG-07 usuário não rebaixa alerta');
  update public.alertas set ciente_em = now() where id = v_alerta;
  perform teste.sair();
  perform teste.ok((select ciente_por from public.alertas where id = v_alerta) = u_dgaf_seen, 'T-SEG-07 ciência registrada com o usuário');

  -- T-SEG-08: anon não lê nada
  execute 'set local role anon';
  perform teste.erro('select * from public.contratos', 'permission denied', 'T-SEG-08 anônimo sem acesso');
  execute 'reset role';
end $$;

rollback;
