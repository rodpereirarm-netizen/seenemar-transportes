-- =============================================================================
-- Migration 02 · Regras de negócio
--   · contagem de prazos (dias corridos / úteis, com feriados)
--   · geração do checklist conforme a modalidade
--   · propagação de responsáveis por etapa
--   · andamentos automáticos e notificações
--   · auditoria (quem / quando / o quê)
--   · views consolidadas para os painéis
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Identidade do usuário logado
-- -----------------------------------------------------------------------------

create or replace function public.fn_meu_integrante()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.integrantes where user_id = auth.uid() and ativo limit 1;
$$;

create or replace function public.fn_meu_papel()
returns text language sql stable security definer set search_path = public as $$
  select papel from public.integrantes where user_id = auth.uid() and ativo limit 1;
$$;

create or replace function public.fn_tem_papel(p_papeis text[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.fn_meu_papel() = any(p_papeis), false);
$$;

-- -----------------------------------------------------------------------------
-- Datas e prazos (fuso de Brasília; art. 183 da Lei 14.133/2021:
-- exclui o dia do começo, inclui o do vencimento, prorroga para o 1º dia útil)
-- -----------------------------------------------------------------------------

create or replace function public.fn_hoje()
returns date language sql stable set search_path = public as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

create or replace function public.fn_eh_dia_util(p_data date)
returns boolean language sql stable set search_path = public as $$
  select extract(isodow from p_data) < 6
     and not exists (select 1 from public.feriados f where f.data = p_data);
$$;

create or replace function public.fn_proximo_dia_util(p_data date)
returns date language plpgsql stable set search_path = public as $$
declare d date := p_data;
begin
  while not public.fn_eh_dia_util(d) loop d := d + 1; end loop;
  return d;
end $$;

create or replace function public.fn_somar_dias_uteis(p_inicio date, p_dias int)
returns date language plpgsql stable set search_path = public as $$
declare d date := p_inicio; n int := 0;
begin
  if p_dias is null or p_dias <= 0 then return p_inicio; end if;
  while n < p_dias loop
    d := d + 1;
    if public.fn_eh_dia_util(d) then n := n + 1; end if;
  end loop;
  return d;
end $$;

-- Dias úteis de p_de (exclusive) até p_ate (inclusive). Negativo quando p_ate < p_de.
create or replace function public.fn_dias_uteis_entre(p_de date, p_ate date)
returns int language sql stable set search_path = public as $$
  select case
    when p_ate >= p_de then
      (select count(*)::int from generate_series(p_de + 1, p_ate, interval '1 day') g
        where public.fn_eh_dia_util(g::date))
    else
      -(select count(*)::int from generate_series(p_ate + 1, p_de, interval '1 day') g
        where public.fn_eh_dia_util(g::date))
  end;
$$;

create or replace function public.fn_calcular_prazo(p_inicio date, p_tipo text, p_dias int)
returns date language sql stable set search_path = public as $$
  select case
    when p_inicio is null or p_tipo is null or p_dias is null then null
    when p_tipo = 'uteis'    then public.fn_somar_dias_uteis(p_inicio, p_dias)
    when p_tipo = 'corridos' then public.fn_proximo_dia_util(p_inicio + p_dias)
  end;
$$;

-- -----------------------------------------------------------------------------
-- updated_at
-- -----------------------------------------------------------------------------

create or replace function public.fn_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trg_integrantes_updated  before update on public.integrantes  for each row execute function public.fn_touch_updated_at();
create trigger trg_atas_updated         before update on public.atas         for each row execute function public.fn_touch_updated_at();
create trigger trg_contratacoes_updated before update on public.contratacoes for each row execute function public.fn_touch_updated_at();
create trigger trg_atividades_updated   before update on public.atividades   for each row execute function public.fn_touch_updated_at();

-- -----------------------------------------------------------------------------
-- Atividade: prazo legal e datas automáticas
-- -----------------------------------------------------------------------------

create or replace function public.fn_atividade_antes_gravar()
returns trigger language plpgsql set search_path = public as $$
begin
  new.prazo_legal := public.fn_calcular_prazo(
    new.data_envio,
    new.tipo_prazo,
    new.prazo_dias + case when new.prorrogado then coalesce(new.prorrogacao_dias, 0) else 0 end
  );

  if new.status in ('em_andamento','aguardando') and new.data_inicio is null then
    new.data_inicio := public.fn_hoje();
  end if;

  if new.status = 'concluida' and new.data_conclusao is null then
    new.data_conclusao := public.fn_hoje();
  elsif new.status <> 'concluida' then
    new.data_conclusao := null;
  end if;

  return new;
end $$;

create trigger trg_atividade_antes_gravar
  before insert or update on public.atividades
  for each row execute function public.fn_atividade_antes_gravar();

-- -----------------------------------------------------------------------------
-- Checklist: gera/ajusta as atividades conforme a modalidade
-- -----------------------------------------------------------------------------

create or replace function public.fn_sincronizar_checklist(p_contratacao uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_modalidade text;
  v_etapas int[];
begin
  select c.modalidade, m.etapas into v_modalidade, v_etapas
    from public.contratacoes c join public.modalidades m on m.codigo = c.modalidade
   where c.id = p_contratacao;
  if not found then return; end if;

  -- 1. cria as atividades das etapas aplicáveis que ainda não existem
  insert into public.atividades (
    contratacao_id, modelo_id, etapa, ordem, nome, tipo_prazo, prazo_dias, prorrogacao_dias,
    prazo_critico, ponto_atencao, gate, base_legal, status, observacao, responsavel_id)
  select p_contratacao, m.id, m.etapa, m.ordem, m.nome, m.tipo_prazo, m.prazo_dias, m.prorrogacao_dias,
         m.prazo_critico, m.ponto_atencao, m.gate, m.base_legal,
         case when v_modalidade = any(m.reaproveitada_em) then 'concluida' else 'pendente' end,
         case when v_modalidade = any(m.reaproveitada_em) then 'Reaproveitado do órgão gerenciador da ata.' end,
         (select r.integrante_id from public.contratacao_responsaveis r
           where r.contratacao_id = p_contratacao and r.etapa = m.etapa)
    from public.atividades_modelo m
   where m.ativo
     and m.etapa = any(v_etapas)
     and not exists (select 1 from public.atividades a
                      where a.contratacao_id = p_contratacao and a.modelo_id = m.id);

  -- 2. reativa atividades que tinham sido marcadas como "não se aplica" por troca de modalidade
  update public.atividades a
     set status = 'pendente'
   where a.contratacao_id = p_contratacao
     and a.etapa = any(v_etapas)
     and a.status = 'nao_se_aplica';

  -- 3. etapas que deixaram de se aplicar: apaga o que nunca foi tocado, marca o restante
  delete from public.atividades a
   where a.contratacao_id = p_contratacao
     and not (a.etapa = any(v_etapas))
     and a.status = 'pendente'
     and a.data_envio is null
     and a.observacao is null
     and not exists (select 1 from public.documentos d where d.atividade_id = a.id)
     and not exists (select 1 from public.andamentos n where n.atividade_id = a.id);

  update public.atividades a
     set status = 'nao_se_aplica'
   where a.contratacao_id = p_contratacao
     and not (a.etapa = any(v_etapas))
     and a.status not in ('concluida','nao_se_aplica');
end $$;

create or replace function public.fn_contratacao_checklist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.modalidade is distinct from old.modalidade then
    perform public.fn_sincronizar_checklist(new.id);
  end if;
  return new;
end $$;

create trigger trg_contratacao_checklist
  after insert or update of modalidade on public.contratacoes
  for each row execute function public.fn_contratacao_checklist();

-- -----------------------------------------------------------------------------
-- Responsável por etapa → atividades abertas da etapa
-- -----------------------------------------------------------------------------

create or replace function public.fn_propagar_responsavel_etapa()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old uuid := case when tg_op = 'UPDATE' then old.integrante_id end;
  v_c record;
  v_etapa text;
begin
  if new.integrante_id is not distinct from v_old then return new; end if;

  perform set_config('app.notificacao_em_lote', 'on', true);
  update public.atividades
     set responsavel_id = new.integrante_id
   where contratacao_id = new.contratacao_id
     and etapa = new.etapa
     and status not in ('concluida','nao_se_aplica')
     and (responsavel_id is null or responsavel_id is not distinct from v_old);
  perform set_config('app.notificacao_em_lote', 'off', true);

  if new.integrante_id is not null then
    select numero, titulo into v_c from public.contratacoes where id = new.contratacao_id;
    select nome into v_etapa from public.etapas where numero = new.etapa;
    insert into public.notificacoes (integrante_id, tipo, titulo, texto, contratacao_id)
    values (new.integrante_id, 'atribuicao',
            format('Você é responsável pela Etapa %s em %s · %s', to_char(new.etapa, 'FMRN'), lpad(v_c.numero::text, 2, '0'), v_c.titulo),
            v_etapa, new.contratacao_id);
  end if;
  return new;
end $$;

create trigger trg_propagar_responsavel_etapa
  after insert or update of integrante_id on public.contratacao_responsaveis
  for each row execute function public.fn_propagar_responsavel_etapa();

-- -----------------------------------------------------------------------------
-- Atividade alterada → andamento automático + notificações
-- -----------------------------------------------------------------------------

create or replace function public.fn_rotulo_status(p_status text)
returns text language sql immutable set search_path = public as $$
  select case p_status
    when 'pendente'      then 'Pendente'
    when 'em_andamento'  then 'Em andamento'
    when 'aguardando'    then 'Aguardando terceiros'
    when 'devolvida'     then 'Devolvida'
    when 'concluida'     then 'Concluída'
    when 'nao_se_aplica' then 'Não se aplica'
    else p_status end;
$$;

create or replace function public.fn_atividade_depois_gravar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_c record;
  v_eu uuid := public.fn_meu_integrante();
  v_ref text;
begin
  select numero, titulo, responsavel_geral_id into v_c from public.contratacoes where id = new.contratacao_id;
  v_ref := lpad(v_c.numero::text, 2, '0') || ' · ' || v_c.titulo;

  -- mudança de status → linha do tempo
  if new.status is distinct from old.status then
    insert into public.andamentos (contratacao_id, atividade_id, integrante_id, tipo, texto)
    values (new.contratacao_id, new.id, v_eu,
            case new.status when 'concluida' then 'conclusao' when 'devolvida' then 'devolucao' else 'sistema' end,
            format('%s: %s → %s', new.nome, public.fn_rotulo_status(old.status), public.fn_rotulo_status(new.status)));

    if new.status = 'devolvida' and v_c.responsavel_geral_id is not null
       and v_c.responsavel_geral_id is distinct from v_eu then
      insert into public.notificacoes (integrante_id, tipo, titulo, texto, contratacao_id)
      values (v_c.responsavel_geral_id, 'devolucao', format('%s devolvida', v_ref), new.nome, new.contratacao_id);
    end if;
  end if;

  -- registro da data de envio → início da contagem do prazo legal
  if new.data_envio is distinct from old.data_envio and new.data_envio is not null and new.tipo_prazo is not null then
    insert into public.andamentos (contratacao_id, atividade_id, integrante_id, tipo, texto)
    values (new.contratacao_id, new.id, v_eu, 'envio',
            format('%s: envio em %s · prazo legal até %s', new.nome,
                   to_char(new.data_envio, 'DD/MM/YYYY'), to_char(new.prazo_legal, 'DD/MM/YYYY')));
  end if;

  -- nova atribuição individual
  if new.responsavel_id is distinct from old.responsavel_id
     and new.responsavel_id is not null
     and new.responsavel_id is distinct from v_eu
     and coalesce(current_setting('app.notificacao_em_lote', true), 'off') <> 'on' then
    insert into public.notificacoes (integrante_id, tipo, titulo, texto, contratacao_id)
    values (new.responsavel_id, 'atribuicao', format('Atividade atribuída em %s', v_ref), new.nome, new.contratacao_id);
  end if;

  return new;
end $$;

create trigger trg_atividade_depois_gravar
  after update on public.atividades
  for each row execute function public.fn_atividade_depois_gravar();

-- -----------------------------------------------------------------------------
-- Andamento manual → último andamento da contratação + aviso ao responsável geral
-- -----------------------------------------------------------------------------

create or replace function public.fn_andamento_inserido()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_c record; v_autor text;
begin
  if new.tipo = 'sistema' then return new; end if;

  update public.contratacoes
     set ultimo_andamento = new.texto, ultimo_andamento_em = new.created_at
   where id = new.contratacao_id
  returning numero, titulo, responsavel_geral_id into v_c;

  if v_c.responsavel_geral_id is not null and v_c.responsavel_geral_id is distinct from new.integrante_id then
    select split_part(nome, ' ', 1) into v_autor from public.integrantes where id = new.integrante_id;
    insert into public.notificacoes (integrante_id, tipo, titulo, texto, contratacao_id)
    values (v_c.responsavel_geral_id, 'andamento',
            format('%s registrou andamento em %s · %s', coalesce(v_autor, 'Sistema'), lpad(v_c.numero::text, 2, '0'), v_c.titulo),
            left(new.texto, 180), new.contratacao_id);
  end if;
  return new;
end $$;

create trigger trg_andamento_inserido
  after insert on public.andamentos
  for each row execute function public.fn_andamento_inserido();

-- -----------------------------------------------------------------------------
-- Autor padrão
-- -----------------------------------------------------------------------------

create or replace function public.fn_definir_autor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- IFs aninhados: o PL/pgSQL só resolve o campo de NEW no ramo da tabela certa
  if tg_table_name = 'andamentos' then
    if new.integrante_id is null then new.integrante_id := public.fn_meu_integrante(); end if;
  elsif tg_table_name = 'documentos' then
    if new.enviado_por is null then new.enviado_por := public.fn_meu_integrante(); end if;
  elsif tg_table_name = 'contratacoes' then
    if new.created_by is null then new.created_by := public.fn_meu_integrante(); end if;
    -- Nº de controle sequencial sem lacunas (lock evita número duplicado em inserções simultâneas)
    if new.numero is null then
      perform pg_advisory_xact_lock(hashtext('contratacoes.numero'));
      select coalesce(max(numero), 0) + 1 into new.numero from public.contratacoes;
    end if;
  end if;
  return new;
end $$;

create trigger trg_andamentos_autor   before insert on public.andamentos   for each row execute function public.fn_definir_autor();
create trigger trg_documentos_autor   before insert on public.documentos   for each row execute function public.fn_definir_autor();
create trigger trg_contratacoes_autor before insert on public.contratacoes for each row execute function public.fn_definir_autor();

-- -----------------------------------------------------------------------------
-- Vínculo entre conta de acesso (auth.users) e integrante do GT
-- Só e-mails cadastrados como integrantes ativos conseguem criar conta.
-- -----------------------------------------------------------------------------

create or replace function public.fn_vincular_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.integrantes
     set user_id = new.id
   where lower(email) = lower(new.email) and ativo and user_id is null;
  if not found then
    raise exception 'E-mail % não está cadastrado como integrante ativo do GT. Solicite acesso ao administrador.', new.email;
  end if;
  return new;
end $$;

create trigger trg_vincular_usuario
  after insert on auth.users
  for each row execute function public.fn_vincular_usuario();

create or replace function public.fn_integrante_vincular_conta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is not null and (tg_op = 'INSERT' or new.email is distinct from old.email) then
    new.email := lower(trim(new.email));
    new.user_id := (select u.id from auth.users u where lower(u.email) = new.email limit 1);
  end if;
  return new;
end $$;

create trigger trg_integrante_vincular_conta
  before insert or update of email on public.integrantes
  for each row execute function public.fn_integrante_vincular_conta();

-- Impede que o sistema fique sem administrador ativo.
create or replace function public.fn_proteger_ultimo_admin()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.papel = 'admin' and old.ativo
     and (tg_op = 'DELETE' or new.papel <> 'admin' or not new.ativo)
     and not exists (select 1 from public.integrantes where papel = 'admin' and ativo and id <> old.id) then
    raise exception 'Operação bloqueada: o sistema precisa de ao menos um administrador ativo.';
  end if;
  return coalesce(new, old);
end $$;

create trigger trg_proteger_ultimo_admin
  before update or delete on public.integrantes
  for each row execute function public.fn_proteger_ultimo_admin();

-- -----------------------------------------------------------------------------
-- Auditoria genérica
-- -----------------------------------------------------------------------------

create or replace function public.fn_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_campos text[];
  v_registro text;
  v_contratacao uuid;
  v_integrante uuid;
  v_nome text;
begin
  if tg_op in ('UPDATE','DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('INSERT','UPDATE') then v_new := to_jsonb(new); end if;

  if tg_op = 'UPDATE' then
    select array_agg(k order by k) into v_campos
      from jsonb_object_keys(v_new) k
     where k not in ('updated_at')
       and (v_new -> k) is distinct from (v_old -> k);
    if v_campos is null then return new; end if;
  end if;

  v_registro := coalesce(
    coalesce(v_new, v_old) ->> 'id',
    coalesce(v_new, v_old) ->> 'data',
    (coalesce(v_new, v_old) ->> 'contratacao_id') || ':' || (coalesce(v_new, v_old) ->> 'etapa'));

  v_contratacao := case
    when tg_table_name = 'contratacoes' then (coalesce(v_new, v_old) ->> 'id')::uuid
    else (coalesce(v_new, v_old) ->> 'contratacao_id')::uuid end;

  select id, nome into v_integrante, v_nome from public.integrantes where user_id = auth.uid();

  insert into public.auditoria (tabela, operacao, registro_id, contratacao_id, usuario_id, integrante_id,
                                usuario_nome, campos_alterados, dados_anteriores, dados_novos)
  values (tg_table_name, tg_op, v_registro, v_contratacao, auth.uid(), v_integrante,
          coalesce(v_nome, case when auth.uid() is null then 'Sistema' else 'Usuário sem cadastro' end),
          v_campos, v_old, v_new);

  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['contratacoes','contratacao_responsaveis','atividades','andamentos','documentos',
                           'integrantes','atas','areas_demandantes','opcoes_lista','feriados',
                           'atividades_modelo','modalidades','etapas']
  loop
    execute format('create trigger trg_auditoria after insert or update or delete on public.%I
                    for each row execute function public.fn_auditoria()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Views dos painéis (security_invoker: respeitam o RLS de quem consulta)
-- -----------------------------------------------------------------------------

create or replace view public.vw_atividades with (security_invoker = true) as
select
  a.*,
  c.numero            as contratacao_numero,
  c.titulo            as contratacao_titulo,
  c.situacao          as contratacao_situacao,
  c.modalidade        as contratacao_modalidade,
  c.responsavel_geral_id,
  e.nome              as etapa_nome,
  i.nome              as responsavel_nome,
  i.orgao             as responsavel_orgao,
  i.frente            as responsavel_frente,
  coalesce(a.prazo_legal, a.prazo_meta) as prazo_efetivo,
  case
    when coalesce(a.prazo_legal, a.prazo_meta) is null then null
    when a.prazo_legal is not null and a.tipo_prazo = 'uteis'
      then public.fn_dias_uteis_entre(public.fn_hoje(), a.prazo_legal)
    else coalesce(a.prazo_legal, a.prazo_meta) - public.fn_hoje()
  end as dias_restantes,
  case
    when a.status = 'nao_se_aplica' then 'nao_se_aplica'
    when a.status = 'concluida' then
      case when coalesce(a.prazo_legal, a.prazo_meta) is null then 'sem_prazo'
           when a.data_conclusao <= coalesce(a.prazo_legal, a.prazo_meta) then 'cumprido'
           else 'cumprido_com_atraso' end
    when coalesce(a.prazo_legal, a.prazo_meta) is null then
      case when a.tipo_prazo is not null then 'aguardando_envio' else 'sem_prazo' end
    when coalesce(a.prazo_legal, a.prazo_meta) < public.fn_hoje() then 'vencido'
    when coalesce(a.prazo_legal, a.prazo_meta) - public.fn_hoje() <= 3 then 'atencao'
    else 'no_prazo'
  end as situacao_prazo
from public.atividades a
join public.contratacoes c on c.id = a.contratacao_id
join public.etapas e on e.numero = a.etapa
left join public.integrantes i on i.id = a.responsavel_id;

create or replace view public.vw_contratacoes with (security_invoker = true) as
with base as (
  select
    a.contratacao_id,
    coalesce(min(a.etapa) filter (where a.status not in ('concluida','nao_se_aplica')), max(a.etapa)) as etapa_atual,
    count(*) filter (where a.status <> 'nao_se_aplica')                     as total_atividades,
    count(*) filter (where a.status = 'concluida')                          as atividades_concluidas,
    count(*) filter (where a.status not in ('concluida','nao_se_aplica')
                       and coalesce(a.prazo_legal, a.prazo_meta) < public.fn_hoje()) as prazos_vencidos,
    count(*) filter (where a.status not in ('concluida','nao_se_aplica')
                       and a.prazo_legal is not null)                       as prazos_legais_em_curso,
    min(coalesce(a.prazo_legal, a.prazo_meta))
      filter (where a.status not in ('concluida','nao_se_aplica'))          as proximo_prazo
  from public.atividades a
  group by a.contratacao_id
)
select
  c.*,
  ad.nome                     as area_nome,
  m.nome                      as modalidade_nome,
  m.etapas                    as modalidade_etapas,
  ata.numero                  as ata_numero,
  ata.orgao_gerenciador       as ata_orgao,
  rg.nome                     as responsavel_geral_nome,
  b.etapa_atual,
  et.nome                     as etapa_atual_nome,
  coalesce(b.total_atividades, 0)       as total_atividades,
  coalesce(b.atividades_concluidas, 0)  as atividades_concluidas,
  coalesce(b.prazos_vencidos, 0)        as prazos_vencidos,
  coalesce(b.prazos_legais_em_curso, 0) as prazos_legais_em_curso,
  b.proximo_prazo,
  pe.etapa_total,
  pe.etapa_concluidas,
  aa.id                       as atividade_atual_id,
  aa.nome                     as atividade_atual_nome,
  aa.status                   as atividade_atual_status,
  aa.responsavel_id           as atividade_atual_responsavel_id,
  ra.nome                     as atividade_atual_responsavel_nome
from public.contratacoes c
join public.modalidades m on m.codigo = c.modalidade
left join public.areas_demandantes ad on ad.id = c.area_demandante_id
left join public.atas ata on ata.id = c.ata_id
left join public.integrantes rg on rg.id = c.responsavel_geral_id
left join base b on b.contratacao_id = c.id
left join public.etapas et on et.numero = b.etapa_atual
left join lateral (
  select count(*) filter (where x.status <> 'nao_se_aplica') as etapa_total,
         count(*) filter (where x.status = 'concluida')      as etapa_concluidas
    from public.atividades x
   where x.contratacao_id = c.id and x.etapa = b.etapa_atual
) pe on true
left join lateral (
  select x.*
    from public.atividades x
   where x.contratacao_id = c.id
     and x.status not in ('concluida','nao_se_aplica')
   order by case when x.status in ('em_andamento','aguardando','devolvida') then 0 else 1 end,
            x.etapa, x.ordem
   limit 1
) aa on true
left join public.integrantes ra on ra.id = aa.responsavel_id;

create or replace view public.vw_carga_integrantes with (security_invoker = true) as
select
  i.id, i.nome, i.orgao, i.frente, i.funcao, i.papel, i.modelo_trabalho, i.membro_gt, i.ativo,
  count(a.id) filter (where a.status not in ('concluida','nao_se_aplica'))                        as atividades_abertas,
  count(a.id) filter (where a.status in ('em_andamento','aguardando','devolvida'))                as atividades_em_curso,
  count(a.id) filter (where a.status not in ('concluida','nao_se_aplica')
                        and coalesce(a.prazo_legal, a.prazo_meta) < public.fn_hoje())               as atividades_vencidas,
  count(a.id) filter (where a.status not in ('concluida','nao_se_aplica')
                        and coalesce(a.prazo_legal, a.prazo_meta) between public.fn_hoje() and public.fn_hoje() + 5) as vencem_5_dias,
  count(a.id) filter (where a.status = 'concluida')                                               as atividades_concluidas,
  count(distinct a.contratacao_id) filter (where a.status not in ('concluida','nao_se_aplica'))   as contratacoes_envolvidas,
  (select count(*) from public.contratacoes c
    where c.responsavel_geral_id = i.id and c.situacao not in ('Concluída','Cancelada'))            as contratacoes_coordenadas
from public.integrantes i
left join public.atividades a on a.responsavel_id = i.id
group by i.id;
