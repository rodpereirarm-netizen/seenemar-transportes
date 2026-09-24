-- =============================================================================
-- Migration 03 · Perfis de acesso (RLS) e armazenamento de documentos
--
-- Matriz de perfis (espelha a composição do GT):
--   admin         controle total: integrantes, catálogos, exclusões
--   coordenacao   Frente I · coordenação e aprovação: cria/edita contratações, designa responsáveis
--   conformidade  Frente I · conformidade dos artefatos: edita/valida atividades e situação
--   elaboracao    Frente II · pesquisa e elaboração: atividades das Etapas I–II e as que lhe forem atribuídas
--   ponto_focal   Frente III · lançamento nos sistemas: dados das contratações e Etapas III–V
--   consulta      somente leitura
-- =============================================================================

create or replace function public.fn_pode_editar_contratacao(p_contratacao uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.fn_tem_papel(array['admin','coordenacao','conformidade','ponto_focal']) then true
    when public.fn_tem_papel(array['elaboracao']) then
      exists (select 1 from public.contratacoes c
               where c.id = p_contratacao and c.responsavel_geral_id = public.fn_meu_integrante())
      or exists (select 1 from public.contratacao_responsaveis r
                  where r.contratacao_id = p_contratacao and r.integrante_id = public.fn_meu_integrante())
      or exists (select 1 from public.atividades a
                  where a.contratacao_id = p_contratacao and a.responsavel_id = public.fn_meu_integrante())
    else false
  end;
$$;

create or replace function public.fn_pode_editar_atividade(p_etapa int, p_responsavel uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.fn_tem_papel(array['admin','coordenacao','conformidade']) then true
    when p_responsavel is not null and p_responsavel = public.fn_meu_integrante() then true
    when public.fn_tem_papel(array['elaboracao'])  then p_etapa <= 2
    when public.fn_tem_papel(array['ponto_focal']) then p_etapa >= 3
    else false
  end;
$$;

-- Qualquer integrante ativo lê; só perfis operacionais escrevem.
create or replace function public.fn_integrante_ativo()
returns boolean language sql stable security definer set search_path = public as $$
  select public.fn_meu_integrante() is not null;
$$;

create or replace function public.fn_pode_operar()
returns boolean language sql stable security definer set search_path = public as $$
  select public.fn_tem_papel(array['admin','coordenacao','conformidade','elaboracao','ponto_focal']);
$$;

-- -----------------------------------------------------------------------------
-- Habilita RLS em tudo
-- -----------------------------------------------------------------------------
alter table public.etapas                   enable row level security;
alter table public.modalidades              enable row level security;
alter table public.atividades_modelo        enable row level security;
alter table public.feriados                 enable row level security;
alter table public.areas_demandantes        enable row level security;
alter table public.opcoes_lista             enable row level security;
alter table public.integrantes              enable row level security;
alter table public.atas                     enable row level security;
alter table public.contratacoes             enable row level security;
alter table public.contratacao_responsaveis enable row level security;
alter table public.atividades               enable row level security;
alter table public.andamentos               enable row level security;
alter table public.documentos               enable row level security;
alter table public.notificacoes             enable row level security;
alter table public.auditoria                enable row level security;

-- -----------------------------------------------------------------------------
-- Catálogos: leitura para integrantes; escrita só admin
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['etapas','modalidades','atividades_modelo','feriados','areas_demandantes','opcoes_lista']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (public.fn_integrante_ativo())', t || '_leitura', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.fn_tem_papel(array[''admin''])) with check (public.fn_tem_papel(array[''admin'']))', t || '_admin', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Integrantes: todos veem a equipe (inclusive o próprio cadastro no 1º acesso); só admin altera
-- -----------------------------------------------------------------------------
create policy integrantes_leitura on public.integrantes for select to authenticated
  using (public.fn_integrante_ativo() or user_id = auth.uid());
create policy integrantes_admin on public.integrantes for all to authenticated
  using (public.fn_tem_papel(array['admin'])) with check (public.fn_tem_papel(array['admin']));

-- -----------------------------------------------------------------------------
-- Atas: perfis operacionais cadastram e editam; admin exclui
-- -----------------------------------------------------------------------------
create policy atas_leitura  on public.atas for select to authenticated using (public.fn_integrante_ativo());
create policy atas_inserir  on public.atas for insert to authenticated with check (public.fn_pode_operar());
create policy atas_editar   on public.atas for update to authenticated using (public.fn_pode_operar()) with check (public.fn_pode_operar());
create policy atas_excluir  on public.atas for delete to authenticated using (public.fn_tem_papel(array['admin']));

-- -----------------------------------------------------------------------------
-- Contratações
-- -----------------------------------------------------------------------------
create policy contratacoes_leitura on public.contratacoes for select to authenticated
  using (public.fn_integrante_ativo());
create policy contratacoes_inserir on public.contratacoes for insert to authenticated
  with check (public.fn_tem_papel(array['admin','coordenacao']));
create policy contratacoes_editar on public.contratacoes for update to authenticated
  using (public.fn_pode_editar_contratacao(id)) with check (public.fn_pode_editar_contratacao(id));
create policy contratacoes_excluir on public.contratacoes for delete to authenticated
  using (public.fn_tem_papel(array['admin']));

create policy resp_leitura on public.contratacao_responsaveis for select to authenticated
  using (public.fn_integrante_ativo());
create policy resp_gerir on public.contratacao_responsaveis for all to authenticated
  using (public.fn_tem_papel(array['admin','coordenacao']))
  with check (public.fn_tem_papel(array['admin','coordenacao']));

-- -----------------------------------------------------------------------------
-- Atividades
-- -----------------------------------------------------------------------------
create policy atividades_leitura on public.atividades for select to authenticated
  using (public.fn_integrante_ativo());
create policy atividades_inserir on public.atividades for insert to authenticated
  with check (public.fn_tem_papel(array['admin','coordenacao']));
create policy atividades_editar on public.atividades for update to authenticated
  using (public.fn_pode_editar_atividade(etapa, responsavel_id))
  with check (public.fn_pode_editar_contratacao(contratacao_id) or public.fn_pode_editar_atividade(etapa, responsavel_id));
create policy atividades_excluir on public.atividades for delete to authenticated
  using (public.fn_tem_papel(array['admin','coordenacao']));

-- -----------------------------------------------------------------------------
-- Andamentos (linha do tempo): perfis operacionais registram; só admin corrige/exclui
-- -----------------------------------------------------------------------------
create policy andamentos_leitura on public.andamentos for select to authenticated using (public.fn_integrante_ativo());
create policy andamentos_inserir on public.andamentos for insert to authenticated
  with check (public.fn_pode_operar() and integrante_id = public.fn_meu_integrante());
create policy andamentos_admin on public.andamentos for update to authenticated
  using (public.fn_tem_papel(array['admin'])) with check (public.fn_tem_papel(array['admin']));
create policy andamentos_excluir on public.andamentos for delete to authenticated
  using (public.fn_tem_papel(array['admin']));

-- -----------------------------------------------------------------------------
-- Documentos
-- -----------------------------------------------------------------------------
create policy documentos_leitura on public.documentos for select to authenticated using (public.fn_integrante_ativo());
create policy documentos_inserir on public.documentos for insert to authenticated
  with check (public.fn_pode_operar() and enviado_por = public.fn_meu_integrante());
create policy documentos_editar on public.documentos for update to authenticated
  using (public.fn_tem_papel(array['admin','coordenacao']) or enviado_por = public.fn_meu_integrante())
  with check (public.fn_tem_papel(array['admin','coordenacao']) or enviado_por = public.fn_meu_integrante());
create policy documentos_excluir on public.documentos for delete to authenticated
  using (public.fn_tem_papel(array['admin','coordenacao']) or enviado_por = public.fn_meu_integrante());

-- -----------------------------------------------------------------------------
-- Notificações: cada um vê e marca as suas
-- -----------------------------------------------------------------------------
create policy notificacoes_proprias on public.notificacoes for select to authenticated
  using (integrante_id = public.fn_meu_integrante());
create policy notificacoes_marcar on public.notificacoes for update to authenticated
  using (integrante_id = public.fn_meu_integrante()) with check (integrante_id = public.fn_meu_integrante());
create policy notificacoes_excluir on public.notificacoes for delete to authenticated
  using (integrante_id = public.fn_meu_integrante());

-- -----------------------------------------------------------------------------
-- Auditoria: leitura para admin, coordenação e conformidade. Sem escrita pela API.
-- -----------------------------------------------------------------------------
create policy auditoria_leitura on public.auditoria for select to authenticated
  using (public.fn_tem_papel(array['admin','coordenacao','conformidade']));
revoke insert, update, delete, truncate on public.auditoria from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Grants (o RLS acima restringe as linhas)
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete, truncate on public.auditoria from authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant select on public.vw_atividades, public.vw_contratacoes, public.vw_carga_integrantes to authenticated;

revoke execute on function public.fn_sincronizar_checklist(uuid) from public, anon;
grant  execute on function public.fn_sincronizar_checklist(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: bucket privado para PDF, Word e Excel (até 50 MB por arquivo)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 52428800, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy documentos_storage_leitura on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and public.fn_integrante_ativo());
create policy documentos_storage_envio on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and public.fn_pode_operar());
create policy documentos_storage_exclusao on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (
    public.fn_tem_papel(array['admin','coordenacao'])
    or exists (select 1 from public.documentos d
                where d.storage_path = storage.objects.name and d.enviado_por = public.fn_meu_integrante())));
