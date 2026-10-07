-- =============================================================================
-- SIGC · 09 · Auditoria (somente inserção), motivo obrigatório e soft delete
--
-- RN-A01: mudança de valor, data, situação ou designação exige MOTIVO.
--         O cliente envia `motivo_alteracao` junto do UPDATE; o gatilho BEFORE valida,
--         guarda o texto numa variável da transação (por registro) e limpa a coluna;
--         o gatilho AFTER grava antes/depois/motivo na trilha.
-- RN-A02: contrato não é excluído fisicamente; soft delete só pelo admin, com motivo.
-- =============================================================================

create table public.auditoria (
  id                bigint generated always as identity primary key,
  orgao_id          uuid,
  contrato_id       uuid,
  tabela            text not null,
  registro_id       text not null,
  operacao          text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  campos_alterados  text[],
  antes             jsonb,
  depois            jsonb,
  motivo            text,
  usuario_id        uuid,
  usuario_nome      text not null,
  em                timestamptz not null default now()
);
create index auditoria_contrato on public.auditoria (contrato_id, em desc);
create index auditoria_tabela on public.auditoria (tabela, registro_id);

create or replace function public.fn_auditoria_imutavel()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'A trilha de auditoria é somente inserção' using errcode = 'insufficient_privilege';
end $$;
create trigger trg_auditoria_imutavel before update or delete on public.auditoria
  for each row execute function public.fn_auditoria_imutavel();

-- Variável da transação que carrega o motivo de UM registro até o gatilho AFTER
create or replace function public.fn_chave_motivo(p_tabela text, p_id text)
returns text language sql immutable set search_path = public as $$
  select 'sigc.m_' || md5(p_tabela || ':' || p_id);
$$;

-- BEFORE UPDATE. Argumentos do gatilho = colunas sensíveis da tabela.
create or replace function public.fn_exigir_motivo()
returns trigger language plpgsql set search_path = public as $$
declare
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_col text;
  v_mudou text[] := '{}';
begin
  foreach v_col in array tg_argv loop
    if (v_new -> v_col) is distinct from (v_old -> v_col) then v_mudou := v_mudou || v_col; end if;
  end loop;

  if cardinality(v_mudou) > 0 and nullif(btrim(new.motivo_alteracao), '') is null
     and not public.fn_contexto_sistema() then  -- rotinas do sistema não passam por aqui
    raise exception 'RN-A01: informe o motivo da alteração de %', array_to_string(v_mudou, ', ')
      using errcode = 'check_violation';
  end if;

  perform set_config(public.fn_chave_motivo(tg_table_name, new.id::text), coalesce(new.motivo_alteracao, ''), true);
  new.motivo_alteracao := null;
  return new;
end $$;

create or replace function public.fn_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb; v_new jsonb; v_row jsonb;
  v_campos text[];
  v_id text;
  v_motivo text;
  v_nome text;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old) - 'motivo_alteracao'; end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new) - 'motivo_alteracao'; end if;
  v_row := coalesce(v_new, v_old);

  if tg_op = 'UPDATE' then
    select array_agg(k order by k) into v_campos
      from jsonb_object_keys(v_new) k
     where k not in ('updated_at', 'updated_by')
       and (v_new -> k) is distinct from (v_old -> k);
    if v_campos is null then return new; end if;
  end if;

  v_id := coalesce(v_row ->> 'id', v_row ->> 'codigo', v_row ->> 'data', v_row ->> 'chave');
  v_motivo := nullif(current_setting(public.fn_chave_motivo(tg_table_name, coalesce(v_row ->> 'id', '')), true), '');
  select u.nome into v_nome from public.usuarios u where u.id = auth.uid();

  insert into public.auditoria (orgao_id, contrato_id, tabela, registro_id, operacao, campos_alterados,
                                antes, depois, motivo, usuario_id, usuario_nome)
  values ((v_row ->> 'orgao_id')::uuid,
          case when tg_table_name = 'contratos' then (v_row ->> 'id')::uuid else (v_row ->> 'contrato_id')::uuid end,
          tg_table_name, coalesce(v_id, '?'), tg_op, v_campos, v_old, v_new, v_motivo, auth.uid(),
          coalesce(v_nome, case when auth.uid() is null then 'Sistema' else 'Usuário sem cadastro' end));
  return coalesce(new, old);
end $$;

-- Colunas sensíveis por tabela (RN-A01)
create trigger trg_motivo before update on public.contratos for each row execute function public.fn_exigir_motivo(
  'orgao_id', 'fornecedor_id', 'numero', 'ano', 'data_assinatura', 'inicio_vigencia', 'prazo_meses_original',
  'data_fim_original', 'valor_global_original', 'valor_mensal_original', 'situacao_manual', 'regime_legal', 'deleted_at');
create trigger trg_motivo before update on public.alteracoes_contratuais for each row execute function public.fn_exigir_motivo(
  'data_assinatura', 'nova_data_fim', 'delta_valor', 'novo_valor_mensal', 'percentual');
create trigger trg_motivo before update on public.designacoes for each row execute function public.fn_exigir_motivo(
  'pessoa_id', 'papel', 'inicio', 'fim', 'portaria_id');
create trigger trg_motivo before update on public.publicacoes for each row execute function public.fn_exigir_motivo(
  'veiculo', 'data_publicacao', 'alteracao_id');
create trigger trg_motivo before update on public.garantias for each row execute function public.fn_exigir_motivo(
  'valor', 'percentual', 'validade', 'situacao');

do $$
declare t text;
begin
  foreach t in array array[
    'orgaos', 'unidades', 'usuarios', 'usuario_perfis', 'pessoas', 'pessoa_afastamentos', 'fornecedores',
    'processos', 'portarias', 'contratos', 'contrato_itens', 'alteracoes_contratuais', 'contrato_processos',
    'designacoes', 'publicacoes', 'garantias', 'regras_alerta', 'regras_alerta_orgao', 'parametros',
    'feriados', 'listas', 'campanhas', 'tarefas', 'riscos_ajustes', 'importacoes']
  loop
    execute format('create trigger trg_auditoria after insert or update or delete on public.%I
                    for each row execute function public.fn_auditoria()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Soft delete (RN-A02)
-- -----------------------------------------------------------------------------
create or replace function public.fn_contrato_sem_exclusao_fisica()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'RN-A02: contratos não são excluídos fisicamente; use fn_excluir_contrato(id, motivo)'
    using errcode = 'insufficient_privilege';
end $$;
create trigger trg_contratos_sem_delete before delete on public.contratos
  for each row execute function public.fn_contrato_sem_exclusao_fisica();

create or replace function public.fn_excluir_contrato(p_contrato uuid, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
declare v_orgao uuid;
begin
  select orgao_id into v_orgao from public.contratos where id = p_contrato and deleted_at is null;
  if v_orgao is null then raise exception 'Contrato não encontrado'; end if;
  if not public.fn_tem_perfil(v_orgao, array['admin']::public.perfil_usuario[]) then
    raise exception 'Somente o administrador exclui contratos' using errcode = 'insufficient_privilege';
  end if;
  if nullif(btrim(p_motivo), '') is null then raise exception 'RN-A02: informe o motivo da exclusão'; end if;
  update public.contratos
     set deleted_at = now(), deleted_by = auth.uid(), deleted_motivo = p_motivo, motivo_alteracao = p_motivo
   where id = p_contrato;
  perform public.fn_motor_alertas(null, p_contrato);
end $$;

create or replace function public.fn_restaurar_contrato(p_contrato uuid, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
declare v_orgao uuid;
begin
  select orgao_id into v_orgao from public.contratos where id = p_contrato and deleted_at is not null;
  if v_orgao is null then raise exception 'Contrato excluído não encontrado'; end if;
  if not public.fn_tem_perfil(v_orgao, array['admin']::public.perfil_usuario[]) then
    raise exception 'Somente o administrador restaura contratos' using errcode = 'insufficient_privilege';
  end if;
  update public.contratos
     set deleted_at = null, deleted_by = null, deleted_motivo = null, motivo_alteracao = p_motivo
   where id = p_contrato;
end $$;
