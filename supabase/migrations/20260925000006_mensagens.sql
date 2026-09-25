-- =============================================================================
-- Migration 06 · Central de mensagens entre integrantes
--
-- · Conversas individuais ou em grupo, opcionalmente vinculadas a uma contratação.
-- · Só os participantes leem a conversa e as mensagens (RLS).
-- · Mensagens não podem ser editadas nem apagadas (rastreabilidade).
-- · Menção com @: o integrante mencionado passa a participar e recebe aviso.
-- · As mensagens NÃO entram na tabela de auditoria: são comunicações privadas
--   entre participantes; a auditoria continua registrando os dados do fluxo.
-- · Migration apenas aditiva: cria tabelas/funções e uma coluna opcional em
--   notificacoes. Nenhum dado existente é alterado.
-- =============================================================================

create table public.conversas (
  id                  uuid primary key default gen_random_uuid(),
  titulo              text,
  contratacao_id      uuid references public.contratacoes(id) on delete set null,
  criado_por          uuid not null references public.integrantes(id),
  created_at          timestamptz not null default now(),
  ultima_mensagem_em  timestamptz not null default now()
);

create table public.conversa_participantes (
  conversa_id    uuid not null references public.conversas(id) on delete cascade,
  integrante_id  uuid not null references public.integrantes(id) on delete cascade,
  lida_ate       timestamptz not null default '2000-01-01',
  created_at     timestamptz not null default now(),
  primary key (conversa_id, integrante_id)
);
create index conversa_participantes_integrante_idx on public.conversa_participantes (integrante_id);

create table public.mensagens (
  id           uuid primary key default gen_random_uuid(),
  conversa_id  uuid not null references public.conversas(id) on delete cascade,
  autor_id     uuid not null references public.integrantes(id),
  texto        text not null check (char_length(btrim(texto)) between 1 and 4000),
  mencoes      uuid[] not null default '{}',
  created_at   timestamptz not null default now()
);
create index mensagens_conversa_idx on public.mensagens (conversa_id, created_at);

-- Aviso de mensagem aponta para a conversa
alter table public.notificacoes add column conversa_id uuid references public.conversas(id) on delete cascade;

comment on table public.conversas is 'Central de mensagens: conversas entre integrantes (privadas aos participantes).';
comment on table public.mensagens is 'Mensagens imutáveis; não entram na auditoria por serem comunicações privadas.';

-- -----------------------------------------------------------------------------
-- Participação (security definer evita recursão nas políticas)
-- -----------------------------------------------------------------------------
create or replace function public.fn_participo(p_conversa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversa_participantes
     where conversa_id = p_conversa and integrante_id = public.fn_meu_integrante()
  );
$$;

-- -----------------------------------------------------------------------------
-- Nova mensagem → atualiza a conversa, marca como lida para o autor,
-- inclui mencionados como participantes e avisa os demais
-- -----------------------------------------------------------------------------
create or replace function public.fn_mensagem_inserida()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_autor text;
  v_conv  record;
  v_ref   text;
begin
  select nome into v_autor from public.integrantes where id = new.autor_id;
  select c.titulo, c.contratacao_id, ct.numero, ct.titulo as ct_titulo
    into v_conv
    from public.conversas c left join public.contratacoes ct on ct.id = c.contratacao_id
   where c.id = new.conversa_id;
  v_ref := coalesce(v_conv.titulo, case when v_conv.numero is not null then format('%s · %s', lpad(v_conv.numero::text, 2, '0'), v_conv.ct_titulo) end, 'Conversa');

  update public.conversas set ultima_mensagem_em = new.created_at where id = new.conversa_id;
  update public.conversa_participantes set lida_ate = new.created_at
   where conversa_id = new.conversa_id and integrante_id = new.autor_id;

  -- Mencionados que ainda não participam passam a participar
  insert into public.conversa_participantes (conversa_id, integrante_id)
  select new.conversa_id, i.id from public.integrantes i
   where i.id = any (new.mencoes) and i.ativo
  on conflict do nothing;

  insert into public.notificacoes (integrante_id, tipo, titulo, texto, contratacao_id, conversa_id)
  select p.integrante_id,
         case when p.integrante_id = any (new.mencoes) then 'mencao' else 'mensagem' end,
         case when p.integrante_id = any (new.mencoes)
              then format('%s mencionou você · %s', v_autor, v_ref)
              else format('Nova mensagem de %s · %s', v_autor, v_ref) end,
         left(new.texto, 140), v_conv.contratacao_id, new.conversa_id
    from public.conversa_participantes p
   where p.conversa_id = new.conversa_id and p.integrante_id <> new.autor_id;
  return new;
end $$;

create trigger trg_mensagem_inserida
  after insert on public.mensagens
  for each row execute function public.fn_mensagem_inserida();

-- -----------------------------------------------------------------------------
-- Criar conversa com participantes e primeira mensagem (atômico)
-- -----------------------------------------------------------------------------
create or replace function public.fn_criar_conversa(
  p_participantes uuid[], p_texto text, p_contratacao uuid default null, p_titulo text default null, p_mencoes uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := public.fn_meu_integrante();
  v_id uuid;
begin
  if v_eu is null then raise exception 'Integrante não identificado.'; end if;
  if coalesce(array_length(p_participantes, 1), 0) = 0 then raise exception 'Informe ao menos um destinatário.'; end if;
  if coalesce(btrim(p_texto), '') = '' then raise exception 'Escreva a mensagem.'; end if;

  insert into public.conversas (titulo, contratacao_id, criado_por)
  values (nullif(btrim(p_titulo), ''), p_contratacao, v_eu) returning id into v_id;

  insert into public.conversa_participantes (conversa_id, integrante_id)
  select v_id, i.id from public.integrantes i
   where i.ativo and (i.id = v_eu or i.id = any (p_participantes))
  on conflict do nothing;

  insert into public.mensagens (conversa_id, autor_id, texto, mencoes)
  values (v_id, v_eu, btrim(p_texto), coalesce(p_mencoes, '{}'));
  return v_id;
end $$;

-- -----------------------------------------------------------------------------
-- Minhas conversas, com a última mensagem e a quantidade não lida
-- -----------------------------------------------------------------------------
create or replace function public.fn_minhas_conversas()
returns table (
  id uuid, titulo text, contratacao_id uuid, contratacao_numero int, contratacao_titulo text,
  ultima_mensagem_em timestamptz, ultimo_texto text, ultimo_autor text, nao_lidas bigint, participantes jsonb)
language sql stable security definer set search_path = public as $$
  select c.id, c.titulo, c.contratacao_id, ct.numero, ct.titulo, c.ultima_mensagem_em,
         um.texto, ua.nome,
         (select count(*) from public.mensagens m
           where m.conversa_id = c.id and m.created_at > eu.lida_ate and m.autor_id <> eu.integrante_id),
         (select jsonb_agg(jsonb_build_object('id', i.id, 'nome', i.nome) order by i.nome)
            from public.conversa_participantes p join public.integrantes i on i.id = p.integrante_id
           where p.conversa_id = c.id)
    from public.conversa_participantes eu
    join public.conversas c on c.id = eu.conversa_id
    left join public.contratacoes ct on ct.id = c.contratacao_id
    left join lateral (select m.texto, m.autor_id from public.mensagens m
                        where m.conversa_id = c.id order by m.created_at desc limit 1) um on true
    left join public.integrantes ua on ua.id = um.autor_id
   where eu.integrante_id = public.fn_meu_integrante()
   order by c.ultima_mensagem_em desc;
$$;

create or replace function public.fn_mensagens_nao_lidas()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from public.mensagens m
    join public.conversa_participantes p on p.conversa_id = m.conversa_id
   where p.integrante_id = public.fn_meu_integrante() and m.created_at > p.lida_ate and m.autor_id <> p.integrante_id;
$$;

create or replace function public.fn_marcar_conversa_lida(p_conversa uuid)
returns void language sql security definer set search_path = public as $$
  update public.conversa_participantes set lida_ate = now()
   where conversa_id = p_conversa and integrante_id = public.fn_meu_integrante();
  update public.notificacoes set lida = true
   where conversa_id = p_conversa and integrante_id = public.fn_meu_integrante() and not lida;
$$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.conversas               enable row level security;
alter table public.conversa_participantes  enable row level security;
alter table public.mensagens               enable row level security;

create policy conversas_leitura on public.conversas for select to authenticated
  using (public.fn_participo(id));
create policy participantes_leitura on public.conversa_participantes for select to authenticated
  using (public.fn_participo(conversa_id));
create policy mensagens_leitura on public.mensagens for select to authenticated
  using (public.fn_participo(conversa_id));
create policy mensagens_enviar on public.mensagens for insert to authenticated
  with check (public.fn_participo(conversa_id) and autor_id = public.fn_meu_integrante());
-- Sem políticas de update/delete: mensagens e conversas não são editadas nem apagadas pela API.

-- -----------------------------------------------------------------------------
-- Permissões das funções (mesmo padrão da migration 05)
-- -----------------------------------------------------------------------------
revoke execute on function public.fn_mensagem_inserida() from public, anon, authenticated;
revoke execute on function public.fn_participo(uuid) from public, anon;
revoke execute on function public.fn_criar_conversa(uuid[], text, uuid, text, uuid[]) from public, anon;
revoke execute on function public.fn_minhas_conversas() from public, anon;
revoke execute on function public.fn_mensagens_nao_lidas() from public, anon;
revoke execute on function public.fn_marcar_conversa_lida(uuid) from public, anon;
grant execute on function public.fn_participo(uuid) to authenticated;
grant execute on function public.fn_criar_conversa(uuid[], text, uuid, text, uuid[]) to authenticated;
grant execute on function public.fn_minhas_conversas() to authenticated;
grant execute on function public.fn_mensagens_nao_lidas() to authenticated;
grant execute on function public.fn_marcar_conversa_lida(uuid) to authenticated;

grant select, insert on public.mensagens to authenticated;
grant select on public.conversas, public.conversa_participantes to authenticated;
revoke all on public.conversas, public.conversa_participantes, public.mensagens from anon;
-- Reforço: sem edição/exclusão pela API (independe das permissões padrão do projeto)
revoke insert, update, delete, truncate on public.conversas, public.conversa_participantes from authenticated;
revoke update, delete, truncate on public.mensagens from authenticated;
