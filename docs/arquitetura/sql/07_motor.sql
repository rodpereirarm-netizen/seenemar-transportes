-- =============================================================================
-- SIGC · 07 · Motor de alertas (idempotente)
--
-- fn_motor_alertas(órgão?, contrato?)
--   1. lê vw_alertas_condicoes (o que é verdade hoje)
--   2. atualiza alertas abertos que mudaram (severidade, título, detalhe)
--   3. abre alertas novos            → cria tarefa (se a regra gera tarefa) e notifica
--   4. fecha alertas cuja condição cessou → conclui a tarefa automaticamente
-- Rodar duas vezes seguidas não muda nada (teste T-MOT-02).
-- =============================================================================

create or replace function public.fn_prioridade_da_severidade(p public.severidade)
returns public.prioridade language sql immutable set search_path = public as $$
  select case p
    when 'critico' then 'critica'::public.prioridade
    when 'alto'    then 'alta'::public.prioridade
    when 'alerta'  then 'media'::public.prioridade
    when 'atencao' then 'media'::public.prioridade
    else 'baixa'::public.prioridade
  end;
$$;

create or replace function public.fn_motor_alertas(p_orgao uuid default null, p_contrato uuid default null)
returns table (abertos int, atualizados int, fechados int, tarefas_criadas int, tarefas_concluidas int, notificacoes int)
language plpgsql security definer set search_path = public as $$
declare
  v_abertos int; v_atualizados int; v_fechados int; v_tc int; v_tf int; v_not int;
  v_hoje date := public.fn_hoje();
begin
  perform set_config('sigc.sistema', 'on', true);
  if to_regclass('pg_temp._cond') is null then
    create temp table _cond (
      regra_codigo text, orgao_id uuid, contrato_id uuid, chave text,
      severidade public.severidade, titulo text, detalhe jsonb) on commit drop;
    create temp table _eventos (alerta_id bigint, tipo text) on commit drop;
  end if;
  truncate _cond, _eventos;

  insert into _cond
  select * from public.vw_alertas_condicoes v
   where (p_orgao is null or v.orgao_id = p_orgao)
     and (p_contrato is null or v.contrato_id = p_contrato);

  -- 2. Atualiza os abertos que mudaram
  with alvo as (
    select a.id, a.severidade as sev_anterior, c.severidade, c.titulo, c.detalhe
      from public.alertas a
      join _cond c on c.regra_codigo = a.regra_codigo and c.contrato_id is not distinct from a.contrato_id and c.chave = a.chave
     where a.resolvido_em is null
       and (a.severidade, a.titulo, a.detalhe) is distinct from (c.severidade, c.titulo, c.detalhe)
  ), upd as (
    update public.alertas a
       set severidade = alvo.severidade, titulo = alvo.titulo, detalhe = alvo.detalhe, atualizado_em = now()
      from alvo where a.id = alvo.id
    returning a.id, alvo.severidade > alvo.sev_anterior as subiu
  )
  insert into _eventos select id, case when subiu then 'subiu' else 'mudou' end from upd;
  get diagnostics v_atualizados = row_count;

  -- 3. Abre os novos
  with ins as (
    insert into public.alertas (regra_codigo, orgao_id, contrato_id, chave, severidade, titulo, detalhe)
    select c.regra_codigo, c.orgao_id, c.contrato_id, c.chave, c.severidade, c.titulo, c.detalhe
      from _cond c
     where not exists (select 1 from public.alertas a
                        where a.resolvido_em is null and a.regra_codigo = c.regra_codigo
                          and a.contrato_id is not distinct from c.contrato_id and a.chave = c.chave)
    returning id
  )
  insert into _eventos select id, 'novo' from ins;
  get diagnostics v_abertos = row_count;

  -- 4. Fecha os que deixaram de valer
  with fech as (
    update public.alertas a
       set resolvido_em = now(),
           resolucao = case when exists (select 1 from public.vw_regras_efetivas r
                                          where r.codigo = a.regra_codigo and r.orgao_id = a.orgao_id and r.ativo)
                            then 'condicao_cessou' else 'regra_desativada' end
     where a.resolvido_em is null
       and (p_orgao is null or a.orgao_id = p_orgao)
       and (p_contrato is null or a.contrato_id = p_contrato)
       and not exists (select 1 from _cond c
                        where c.regra_codigo = a.regra_codigo and c.contrato_id is not distinct from a.contrato_id and c.chave = a.chave)
    returning a.id
  )
  insert into _eventos select id, 'fechado' from fech;
  get diagnostics v_fechados = row_count;

  -- Tarefas dos alertas novos
  insert into public.tarefas (orgao_id, contrato_id, alerta_id, titulo, descricao,
                              responsavel_pessoa_id, responsavel_perfil, prazo, prioridade, origem)
  select a.orgao_id, a.contrato_id, a.id, a.titulo, r.nome,
         case when r.responsavel = 'gestor' then
           (select d.pessoa_id from public.designacoes d
             where d.contrato_id = a.contrato_id and d.papel = 'gestor'
               and (d.inicio is null or d.inicio <= v_hoje) and (d.fim is null or d.fim >= v_hoje) limit 1) end,
         'gestao_contratos',
         public.fn_somar_dias_uteis(v_hoje,
           coalesce((public.fn_parametro('tarefas.prazo_dias_uteis', a.orgao_id)
                     ->> public.fn_prioridade_da_severidade(a.severidade)::text)::int, 10)),
         public.fn_prioridade_da_severidade(a.severidade), 'regra'
    from _eventos ev
    join public.alertas a on a.id = ev.alerta_id
    join public.regras_alerta r on r.codigo = a.regra_codigo
   where ev.tipo = 'novo' and r.gera_tarefa;
  get diagnostics v_tc = row_count;

  -- Severidade subiu → prioridade da tarefa sobe junto
  update public.tarefas t
     set prioridade = public.fn_prioridade_da_severidade(a.severidade), titulo = a.titulo
    from _eventos ev join public.alertas a on a.id = ev.alerta_id
   where ev.tipo in ('subiu', 'mudou') and t.alerta_id = a.id and t.status in ('aberta', 'em_andamento');

  -- Alerta fechado → tarefa concluída automaticamente
  update public.tarefas t
     set status = 'concluida', concluida_em = now(),
         resultado = 'Concluída automaticamente: a condição do alerta deixou de existir'
    from _eventos ev
   where ev.tipo = 'fechado' and t.alerta_id = ev.alerta_id and t.status in ('aberta', 'em_andamento');
  get diagnostics v_tf = row_count;

  -- Notificações: alertas novos ou que subiram de severidade
  with destinatarios as (
    -- quem responde pela tarefa
    select distinct a.id as alerta_id, p.usuario_id, a.severidade, a.titulo
      from _eventos ev
      join public.alertas a on a.id = ev.alerta_id
      join public.tarefas t on t.alerta_id = a.id
      join public.pessoas p on p.id = t.responsavel_pessoa_id
     where ev.tipo in ('novo', 'subiu') and p.usuario_id is not null
    union
    -- a equipe de gestão de contratos do órgão, a partir da severidade configurada
    select distinct a.id, up.usuario_id, a.severidade, a.titulo
      from _eventos ev
      join public.alertas a on a.id = ev.alerta_id
      join public.usuario_perfis up on up.orgao_id = a.orgao_id and up.perfil = 'gestao_contratos' and up.ativo
     where ev.tipo in ('novo', 'subiu')
       and a.severidade >= coalesce(public.fn_parametro('notificacao.severidade_minima_equipe', a.orgao_id) #>> '{}', 'alto')::public.severidade
  ), ins as (
    insert into public.notificacoes (usuario_id, alerta_id, canal, titulo)
    select d.usuario_id, d.alerta_id, canal.c,
           '[ALERTA CONTRATUAL] ' || o.sigla || ' · ' || d.titulo
      from destinatarios d
      join public.alertas a on a.id = d.alerta_id
      join public.orgaos o on o.id = a.orgao_id
     cross join lateral (select 'app' as c
                         union all
                         select 'email' where d.severidade >= coalesce(public.fn_parametro('notificacao.severidade_minima_email', a.orgao_id) #>> '{}', 'alerta')::public.severidade) canal
    returning 1
  )
  select count(*) into v_not from ins;

  perform set_config('sigc.sistema', '', true);
  return query select v_abertos, v_atualizados, v_fechados, v_tc, v_tf, v_not;
end $$;

-- Recalcular um contrato depois de salvar (chamado pela tela; respeita quem pode ver o contrato)
create or replace function public.fn_recalcular_contrato(p_contrato uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.contratos c where c.id = p_contrato and public.fn_pode_ver_orgao(c.orgao_id)) then
    raise exception 'Contrato não encontrado' using errcode = 'insufficient_privilege';
  end if;
  perform public.fn_motor_alertas(null, p_contrato);
end $$;

-- Rotina das 07:00 (pg_cron, ver 12_agendamentos.sql)
create or replace function public.fn_rotina_diaria()
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; v_snap int;
begin
  select * into r from public.fn_motor_alertas();
  v_snap := public.fn_registrar_riscos();
  return jsonb_build_object('data', public.fn_hoje(), 'alertas_abertos', r.abertos, 'alertas_atualizados', r.atualizados,
                            'alertas_fechados', r.fechados, 'tarefas_criadas', r.tarefas_criadas,
                            'tarefas_concluidas', r.tarefas_concluidas, 'notificacoes', r.notificacoes,
                            'riscos_registrados', v_snap);
end $$;
