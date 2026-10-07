-- =============================================================================
-- SIGC · 10 · Segurança: perfis por órgão, RLS e restrições por coluna
--
-- Matriz (seção 20 do diagnóstico). Escopo SEMPRE limitado ao órgão do perfil.
--   leitura           : qualquer perfil ativo no órgão (admin global vê todos)
--   cadastro/edição   : admin, gestao_contratos
--   gestor            : edita só campos descritivos dos contratos em que está designado;
--                       registra alterações em rascunho e publicações dos seus contratos
--   jurídico          : registra parecer em alterações em análise jurídica
--   fiscal            : leitura (ocorrências/medições na fase 2)
--   auditoria         : leitura, inclusive da trilha
--   motor/rotinas     : funções SECURITY DEFINER (não dependem da RLS do usuário)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funções de apoio às políticas
-- -----------------------------------------------------------------------------
create or replace function public.fn_tem_perfil(p_orgao uuid, p_perfis public.perfil_usuario[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.usuario_perfis up join public.usuarios u on u.id = up.usuario_id
     where up.usuario_id = (select auth.uid()) and up.ativo and u.ativo
       and up.perfil = any (p_perfis)
       and (up.orgao_id = p_orgao or (up.orgao_id is null and up.perfil = 'admin')));
$$;

create or replace function public.fn_pode_ver_orgao(p_orgao uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.fn_tem_perfil(p_orgao, enum_range(null::public.perfil_usuario));
$$;

create or replace function public.fn_pode_gerir_orgao(p_orgao uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.fn_tem_perfil(p_orgao, array['admin', 'gestao_contratos']::public.perfil_usuario[]);
$$;

create or replace function public.fn_eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuario_perfis up join public.usuarios u on u.id = up.usuario_id
                  where up.usuario_id = (select auth.uid()) and up.ativo and u.ativo and up.perfil = 'admin');
$$;

-- Usuário com perfil de gestão em ALGUM órgão (cadastros globais: fornecedores, pessoas)
create or replace function public.fn_gere_algum_orgao()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuario_perfis up join public.usuarios u on u.id = up.usuario_id
                  where up.usuario_id = (select auth.uid()) and up.ativo and u.ativo
                    and up.perfil in ('admin', 'gestao_contratos'));
$$;

create or replace function public.fn_tem_algum_perfil()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuario_perfis up join public.usuarios u on u.id = up.usuario_id
                  where up.usuario_id = (select auth.uid()) and up.ativo and u.ativo);
$$;

create or replace function public.fn_pode_importar()
returns boolean language sql stable security definer set search_path = public as $$
  select public.fn_gere_algum_orgao();
$$;

-- Designação ativa do usuário logado no contrato (com um dos papéis informados)
create or replace function public.fn_designado_no_contrato(p_contrato uuid, p_papeis public.papel_designacao[] default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.designacoes d join public.pessoas p on p.id = d.pessoa_id
     where d.contrato_id = p_contrato and p.usuario_id = (select auth.uid())
       and (p_papeis is null or d.papel = any (p_papeis))
       and (d.inicio is null or d.inicio <= public.fn_hoje()) and (d.fim is null or d.fim >= public.fn_hoje()));
$$;

create or replace function public.fn_eh_gestor_do_contrato(p_contrato uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.contratos c where c.id = p_contrato
                  and public.fn_tem_perfil(c.orgao_id, array['gestor']::public.perfil_usuario[]))
     and public.fn_designado_no_contrato(p_contrato, array['gestor', 'gestor_substituto']::public.papel_designacao[]);
$$;

-- -----------------------------------------------------------------------------
-- Restrição por coluna: gestor só altera campos descritivos do contrato
-- -----------------------------------------------------------------------------
create or replace function public.fn_contrato_restringir_gestor()
returns trigger language plpgsql set search_path = public as $$
declare
  v_livres text[] := array['observacoes', 'categoria', 'unidade_id', 'updated_at', 'updated_by', 'motivo_alteracao'];
begin
  if public.fn_contexto_sistema() or public.fn_pode_gerir_orgao(old.orgao_id) then return new; end if;
  if (to_jsonb(new) - v_livres) is distinct from (to_jsonb(old) - v_livres) then
    raise exception 'Perfil gestor: somente observações, categoria e unidade podem ser alteradas'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger trg_contratos_restringir before update on public.contratos
  for each row execute function public.fn_contrato_restringir_gestor();

-- Gestor: só rascunho (em_elaboracao). Jurídico: só parecer e avanço da análise.
create or replace function public.fn_alteracao_restringir_perfil()
returns trigger language plpgsql set search_path = public as $$
declare v_parecer text[] := array['parecer_juridico', 'situacao', 'situacao_desde', 'updated_at', 'updated_by', 'motivo_alteracao'];
begin
  if public.fn_contexto_sistema() or public.fn_pode_gerir_orgao(new.orgao_id) then return new; end if;
  if public.fn_tem_perfil(new.orgao_id, array['juridico']::public.perfil_usuario[]) and tg_op = 'UPDATE'
     and old.situacao = 'analise_juridica'
     and (to_jsonb(new) - v_parecer) = (to_jsonb(old) - v_parecer)
     and new.situacao in ('analise_juridica', 'aguardando_assinatura', 'em_elaboracao') then
    return new;
  end if;
  if public.fn_eh_gestor_do_contrato(new.contrato_id) and new.situacao = 'em_elaboracao'
     and (tg_op = 'INSERT' or old.situacao = 'em_elaboracao') then
    return new;
  end if;
  raise exception 'Perfil sem permissão para esta etapa da alteração contratual' using errcode = 'insufficient_privilege';
end $$;
create trigger trg_alteracoes_restringir before insert or update on public.alteracoes_contratuais
  for each row execute function public.fn_alteracao_restringir_perfil();

-- Usuário comum só marca a própria notificação como lida / altera status e resultado da própria tarefa
create or replace function public.fn_tarefa_restringir()
returns trigger language plpgsql set search_path = public as $$
declare v_livres text[] := array['status', 'resultado', 'concluida_em', 'concluida_por', 'updated_at', 'updated_by'];
begin
  if new.status in ('concluida', 'cancelada') and old.status not in ('concluida', 'cancelada') then
    new.concluida_em := coalesce(new.concluida_em, now()); new.concluida_por := coalesce(new.concluida_por, auth.uid());
  elsif new.status in ('aberta', 'em_andamento') then
    new.concluida_em := null; new.concluida_por := null;
  end if;
  if public.fn_contexto_sistema() or public.fn_pode_gerir_orgao(old.orgao_id) then return new; end if;
  if (to_jsonb(new) - v_livres) is distinct from (to_jsonb(old) - v_livres) then
    raise exception 'Somente status e resultado da tarefa podem ser alterados pelo responsável'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger trg_tarefas_restringir before update on public.tarefas
  for each row execute function public.fn_tarefa_restringir();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'parametros', 'feriados', 'listas', 'orgaos', 'unidades', 'usuarios', 'usuario_perfis', 'pessoas',
    'pessoa_afastamentos', 'fornecedores', 'processos', 'portarias', 'contratos', 'contrato_itens',
    'alteracoes_contratuais', 'contrato_processos', 'designacoes', 'publicacoes', 'garantias',
    'importacoes', 'importacao_linhas', 'regras_alerta', 'regras_alerta_orgao', 'campanhas', 'alertas',
    'tarefas', 'notificacoes', 'riscos_ajustes', 'riscos_historico', 'auditoria']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Configuração (leitura para quem tem perfil; escrita só admin)
do $$
declare t text;
begin
  foreach t in array array['parametros', 'feriados', 'listas', 'regras_alerta', 'regras_alerta_orgao']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (public.fn_tem_algum_perfil())', t || '_ler', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.fn_eh_admin()) with check (public.fn_eh_admin())', t || '_admin', t);
  end loop;
end $$;

-- Órgãos e unidades
create policy orgaos_ler   on public.orgaos for select to authenticated using (public.fn_pode_ver_orgao(id));
create policy orgaos_admin on public.orgaos for all to authenticated using (public.fn_eh_admin()) with check (public.fn_eh_admin());
create policy unidades_ler    on public.unidades for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));
create policy unidades_gerir  on public.unidades for all to authenticated
  using (public.fn_pode_gerir_orgao(orgao_id)) with check (public.fn_pode_gerir_orgao(orgao_id));

-- Usuários e perfis: cada um vê a si; gestão vê quem tem perfil no seu órgão; só admin concede perfis
create policy usuarios_ler on public.usuarios for select to authenticated using (
  id = (select auth.uid()) or public.fn_eh_admin()
  or exists (select 1 from public.usuario_perfis up where up.usuario_id = usuarios.id and public.fn_pode_gerir_orgao(up.orgao_id)));
create policy usuarios_admin on public.usuarios for all to authenticated using (public.fn_eh_admin()) with check (public.fn_eh_admin());
create policy perfis_ler on public.usuario_perfis for select to authenticated using (
  usuario_id = (select auth.uid()) or public.fn_eh_admin() or public.fn_pode_gerir_orgao(orgao_id));
create policy perfis_admin on public.usuario_perfis for all to authenticated using (public.fn_eh_admin()) with check (public.fn_eh_admin());

-- Cadastros globais (fornecedores, pessoas): leitura por quem tem perfil; escrita pela gestão de qualquer órgão
create policy fornecedores_ler   on public.fornecedores for select to authenticated using (public.fn_tem_algum_perfil() and (deleted_at is null or public.fn_eh_admin()));
create policy fornecedores_gerir on public.fornecedores for insert to authenticated with check (public.fn_gere_algum_orgao());
create policy fornecedores_editar on public.fornecedores for update to authenticated using (public.fn_gere_algum_orgao()) with check (public.fn_gere_algum_orgao());
create policy pessoas_ler   on public.pessoas for select to authenticated using (public.fn_tem_algum_perfil() and (deleted_at is null or public.fn_eh_admin()));
create policy pessoas_gerir on public.pessoas for insert to authenticated with check (public.fn_gere_algum_orgao());
create policy pessoas_editar on public.pessoas for update to authenticated using (public.fn_gere_algum_orgao()) with check (public.fn_gere_algum_orgao());
create policy afast_ler   on public.pessoa_afastamentos for select to authenticated using (public.fn_tem_algum_perfil());
create policy afast_gerir on public.pessoa_afastamentos for all to authenticated using (public.fn_gere_algum_orgao()) with check (public.fn_gere_algum_orgao());

-- Processos e portarias: por órgão
create policy processos_ler   on public.processos for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));
create policy processos_gerir on public.processos for all to authenticated using (public.fn_pode_gerir_orgao(orgao_id)) with check (public.fn_pode_gerir_orgao(orgao_id));
create policy portarias_ler   on public.portarias for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));
create policy portarias_gerir on public.portarias for all to authenticated using (public.fn_pode_gerir_orgao(orgao_id)) with check (public.fn_pode_gerir_orgao(orgao_id));

-- Contratos
create policy contratos_ler on public.contratos for select to authenticated
  using (public.fn_pode_ver_orgao(orgao_id) and (deleted_at is null or public.fn_eh_admin()));
create policy contratos_criar on public.contratos for insert to authenticated
  with check (public.fn_pode_gerir_orgao(orgao_id) and deleted_at is null);
create policy contratos_editar on public.contratos for update to authenticated
  using (deleted_at is null and (public.fn_pode_gerir_orgao(orgao_id) or public.fn_eh_gestor_do_contrato(id)))
  with check (deleted_at is null and (public.fn_pode_gerir_orgao(orgao_id) or public.fn_eh_gestor_do_contrato(id)));
-- sem política de DELETE: exclusão só via fn_excluir_contrato (soft delete)

-- Filhas do contrato: leitura por órgão; escrita pela gestão (e pelo gestor do contrato onde indicado)
do $$
declare t text;
begin
  foreach t in array array['contrato_itens', 'contrato_processos', 'designacoes', 'garantias']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (public.fn_pode_ver_orgao(orgao_id))', t || '_ler', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.fn_pode_gerir_orgao(orgao_id)) with check (public.fn_pode_gerir_orgao(orgao_id))', t || '_gerir', t);
  end loop;
end $$;

create policy publicacoes_ler on public.publicacoes for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));
create policy publicacoes_gerir on public.publicacoes for all to authenticated
  using (public.fn_pode_gerir_orgao(orgao_id) or public.fn_eh_gestor_do_contrato(contrato_id))
  with check (public.fn_pode_gerir_orgao(orgao_id) or public.fn_eh_gestor_do_contrato(contrato_id));

create policy alteracoes_ler on public.alteracoes_contratuais for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));
create policy alteracoes_criar on public.alteracoes_contratuais for insert to authenticated
  with check (public.fn_pode_gerir_orgao(orgao_id) or public.fn_eh_gestor_do_contrato(contrato_id));
create policy alteracoes_editar on public.alteracoes_contratuais for update to authenticated
  using (public.fn_pode_gerir_orgao(orgao_id) or public.fn_eh_gestor_do_contrato(contrato_id)
         or public.fn_tem_perfil(orgao_id, array['juridico']::public.perfil_usuario[]))
  with check (public.fn_pode_gerir_orgao(orgao_id) or public.fn_eh_gestor_do_contrato(contrato_id)
         or public.fn_tem_perfil(orgao_id, array['juridico']::public.perfil_usuario[]));

-- Importação: gestão do órgão da linha; a carga em si, para quem gere algum órgão
create policy importacoes_ler on public.importacoes for select to authenticated using (public.fn_pode_importar());
create policy importacoes_criar on public.importacoes for insert to authenticated
  with check (public.fn_pode_importar() and carregada_por = (select auth.uid()) and situacao = 'carregada');
create policy imp_linhas_ler on public.importacao_linhas for select to authenticated using (
  case when orgao_id is null
       then exists (select 1 from public.importacoes i where i.id = importacao_id and i.carregada_por = (select auth.uid()))
            or public.fn_eh_admin()
       else public.fn_pode_gerir_orgao(orgao_id) end);
create policy imp_linhas_criar on public.importacao_linhas for insert to authenticated with check (
  exists (select 1 from public.importacoes i where i.id = importacao_id and i.carregada_por = (select auth.uid()) and i.situacao = 'carregada'));
-- Revisor ajusta, rejeita ou marca inconsistências como tratadas (o original é imutável por gatilho)
-- Linha sem órgão reconhecido: só quem carregou (ou o admin) a corrige, informando o órgão em `ajustes`
create policy imp_linhas_revisar on public.importacao_linhas for update to authenticated
  using (case when orgao_id is null
              then exists (select 1 from public.importacoes i where i.id = importacao_id and i.carregada_por = (select auth.uid()))
                   or public.fn_eh_admin()
              else public.fn_pode_gerir_orgao(orgao_id) end)
  with check (case when orgao_id is null
              then exists (select 1 from public.importacoes i where i.id = importacao_id and i.carregada_por = (select auth.uid()))
                   or public.fn_eh_admin()
              else public.fn_pode_gerir_orgao(orgao_id) end);

-- Campanhas, alertas, tarefas
create policy campanhas_ler   on public.campanhas for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));
create policy campanhas_gerir on public.campanhas for all to authenticated using (public.fn_pode_gerir_orgao(orgao_id)) with check (public.fn_pode_gerir_orgao(orgao_id));

create policy alertas_ler on public.alertas for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));
-- "ciente": qualquer perfil do órgão (só ciente_por/ciente_em; o motor cuida do resto)
create policy alertas_ciente on public.alertas for update to authenticated
  using (public.fn_pode_ver_orgao(orgao_id)) with check (public.fn_pode_ver_orgao(orgao_id));
create or replace function public.fn_alerta_so_ciente()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.fn_contexto_sistema() then return new; end if;
  if (to_jsonb(new) - array['ciente_por', 'ciente_em']) is distinct from (to_jsonb(old) - array['ciente_por', 'ciente_em']) then
    raise exception 'Alertas são mantidos pelo motor; o usuário só registra ciência' using errcode = 'insufficient_privilege';
  end if;
  new.ciente_por := auth.uid(); new.ciente_em := now();
  return new;
end $$;
create trigger trg_alertas_ciente before update on public.alertas
  for each row execute function public.fn_alerta_so_ciente();

create policy tarefas_ler on public.tarefas for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));
create policy tarefas_criar on public.tarefas for insert to authenticated with check (
  origem = 'manual' and (public.fn_pode_gerir_orgao(orgao_id)
                         or (contrato_id is not null and public.fn_eh_gestor_do_contrato(contrato_id))));
create policy tarefas_editar on public.tarefas for update to authenticated using (
  public.fn_pode_gerir_orgao(orgao_id)
  or exists (select 1 from public.pessoas p where p.id = responsavel_pessoa_id and p.usuario_id = (select auth.uid())))
  with check (public.fn_pode_ver_orgao(orgao_id));

create policy notificacoes_minhas on public.notificacoes for select to authenticated using (usuario_id = (select auth.uid()));
create policy notificacoes_lidas on public.notificacoes for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

-- Risco: ajuste manual por gestão e alta gestão; leitura por órgão
create policy riscos_aj_ler on public.riscos_ajustes for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));
create policy riscos_aj_criar on public.riscos_ajustes for insert to authenticated with check (
  public.fn_tem_perfil(orgao_id, array['admin', 'gestao_contratos', 'alta_gestao', 'gestor']::public.perfil_usuario[])
  and criado_por = (select auth.uid()));
create policy riscos_hist_ler on public.riscos_historico for select to authenticated using (public.fn_pode_ver_orgao(orgao_id));

-- Auditoria: leitura por admin, gestão, alta gestão e auditoria do órgão; gestor vê a dos seus contratos
create policy auditoria_ler on public.auditoria for select to authenticated using (
  public.fn_eh_admin()
  or (orgao_id is not null and public.fn_tem_perfil(orgao_id, array['gestao_contratos', 'alta_gestao', 'auditoria']::public.perfil_usuario[]))
  or (contrato_id is not null and public.fn_designado_no_contrato(contrato_id)));

-- -----------------------------------------------------------------------------
-- Grants (a RLS decide as linhas; o grant decide a operação)
-- -----------------------------------------------------------------------------
grant select, insert, update on all tables in schema public to authenticated;
revoke insert, update on public.auditoria, public.riscos_historico, public.alertas from authenticated;
grant update (ciente_por, ciente_em) on public.alertas to authenticated;
-- Na linha importada, o revisor só mexe em ajustes e na decisão (o original é imutável)
revoke update on public.importacao_linhas from authenticated;
grant update (ajustes, situacao, decisao_motivo, decidido_por, decidido_em, erros_tratados_em, erros_tratados_por)
  on public.importacao_linhas to authenticated;
grant delete on public.contrato_itens, public.contrato_processos, public.publicacoes, public.garantias,
                public.pessoa_afastamentos, public.unidades, public.listas, public.feriados,
                public.regras_alerta_orgao, public.usuario_perfis to authenticated;
grant select on all sequences in schema public to authenticated;

-- Funções internas: ninguém chama pela API
do $$
declare f text;
begin
  foreach f in array array[
    'fn_touch_updated_at()', 'fn_herdar_orgao_do_contrato()', 'fn_alteracao_situacao_desde()', 'fn_publicacao_validar()',
    'fn_alteracao_validar_limites()', 'fn_importacao_original_imutavel()', 'fn_importacao_sem_exclusao()',
    'fn_auditoria_imutavel()', 'fn_exigir_motivo()', 'fn_auditoria()', 'fn_contrato_sem_exclusao_fisica()',
    'fn_contrato_restringir_gestor()', 'fn_alteracao_restringir_perfil()', 'fn_tarefa_restringir()', 'fn_alerta_so_ciente()',
    'fn_motor_alertas(uuid, uuid)', 'fn_rotina_diaria()', 'fn_registrar_riscos()', 'fn_importacao_normalizar(jsonb)']
  loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
  -- RPCs da tela e funções usadas nas políticas: só autenticados
  foreach f in array array[
    'fn_tem_perfil(uuid, public.perfil_usuario[])', 'fn_pode_ver_orgao(uuid)', 'fn_pode_gerir_orgao(uuid)', 'fn_eh_admin()',
    'fn_gere_algum_orgao()', 'fn_tem_algum_perfil()', 'fn_pode_importar()',
    'fn_designado_no_contrato(uuid, public.papel_designacao[])', 'fn_eh_gestor_do_contrato(uuid)',
    'fn_importacao_validar(uuid)', 'fn_importacao_aprovar(uuid)', 'fn_recalcular_contrato(uuid)',
    'fn_excluir_contrato(uuid, text)', 'fn_restaurar_contrato(uuid, text)', 'fn_parametro(text, uuid)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
