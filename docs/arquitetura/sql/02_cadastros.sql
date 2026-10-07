-- =============================================================================
-- SIGC · 02 · Cadastros: órgãos, unidades, usuários e perfis, pessoas,
--                        fornecedores, processos SEI e portarias
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Órgãos (tenant). SEDEICS é sigla anterior da SEDES (decisão do usuário).
-- -----------------------------------------------------------------------------
create table public.orgaos (
  id                 uuid primary key default gen_random_uuid(),
  sigla              text not null unique check (sigla = upper(btrim(sigla))),
  nome               text,                         -- nome oficial [DADO AUSENTE] até a área informar
  siglas_anteriores  text[] not null default '{}', -- ex.: {SEDEICS}; usado na importação e na busca
  cnpj               text check (cnpj is null or public.fn_cnpj_valido(cnpj)), -- necessário para o PNCP (fase 3)
  prefixos_sei       text[] not null default '{}', -- ex.: {480001}; sugere o órgão de um processo
  ativo              boolean not null default true,
  created_at         timestamptz not null default now()
);

alter table public.parametros
  add constraint parametros_orgao_fk foreign key (orgao_id) references public.orgaos(id);

-- Resolve "SEDEICS", "sedes", " SEENEMAR " → id do órgão
create or replace function public.fn_orgao_por_sigla(p_sigla text)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.orgaos o
   where o.sigla = public.fn_normalizar_texto(p_sigla)
      or public.fn_normalizar_texto(p_sigla) = any (o.siglas_anteriores)
   order by (o.sigla = public.fn_normalizar_texto(p_sigla)) desc
   limit 1;
$$;

create table public.unidades (
  id         uuid primary key default gen_random_uuid(),
  orgao_id   uuid not null references public.orgaos(id),
  sigla      text not null,
  nome       text,
  ativo      boolean not null default true,
  unique (orgao_id, sigla)
);

-- -----------------------------------------------------------------------------
-- Usuários (login) e perfis por órgão
-- -----------------------------------------------------------------------------
create table public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text not null unique,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- orgao_id nulo só é aceito para 'admin' e significa "todos os órgãos".
create table public.usuario_perfis (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.usuarios(id) on delete cascade,
  orgao_id    uuid references public.orgaos(id),
  perfil      public.perfil_usuario not null,
  ativo       boolean not null default true,
  concedido_por uuid references public.usuarios(id),
  concedido_em  timestamptz not null default now(),
  unique nulls not distinct (usuario_id, orgao_id, perfil),
  check (orgao_id is not null or perfil = 'admin')
);

-- -----------------------------------------------------------------------------
-- Pessoas designáveis (servidores). Login é opcional (usuario_id).
-- LGPD: não armazenar CPF; matrícula é dado funcional.
-- -----------------------------------------------------------------------------
create table public.pessoas (
  id               uuid primary key default gen_random_uuid(),
  orgao_id         uuid references public.orgaos(id),       -- lotação, quando conhecida
  nome             text not null,
  nome_normalizado text generated always as (public.fn_normalizar_texto(nome)) stored,
  matricula        text,                                     -- "ID" da planilha; ausente em ~75% das menções
  email            text,
  usuario_id       uuid unique references public.usuarios(id),
  situacao         public.situacao_pessoa not null default 'ativo',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  updated_by       uuid,
  deleted_at       timestamptz
);
create unique index pessoas_matricula_uk on public.pessoas (matricula) where matricula is not null and deleted_at is null;
create index pessoas_nome_trgm on public.pessoas using gin (nome_normalizado extensions.gin_trgm_ops);
create trigger trg_pessoas_updated before update on public.pessoas
  for each row execute function public.fn_touch_updated_at();

-- Afastamentos (férias, licença, cessão). Alimenta o alerta FIS-AUS.
create table public.pessoa_afastamentos (
  id         uuid primary key default gen_random_uuid(),
  pessoa_id  uuid not null references public.pessoas(id),
  inicio     date not null,
  fim        date,
  motivo     text not null,
  check (fim is null or fim >= inicio)
);
create index pessoa_afastamentos_pessoa on public.pessoa_afastamentos (pessoa_id);

-- -----------------------------------------------------------------------------
-- Fornecedores (globais: o mesmo CNPJ pode contratar com vários órgãos)
-- Sem CNPJ = provisório (só nasce pela importação; RN-D02). Cobertura atual: 0%.
-- -----------------------------------------------------------------------------
create table public.fornecedores (
  id                 uuid primary key default gen_random_uuid(),
  cnpj               text unique check (cnpj is null or (cnpj ~ '^\d{14}$' and public.fn_cnpj_valido(cnpj))),
  razao_social       text not null,
  nome_fantasia      text,
  nome_normalizado   text generated always as (public.fn_normalizar_texto(coalesce(nome_fantasia, razao_social))) stored,
  provisorio         boolean generated always as (cnpj is null) stored,
  situacao_cadastral text,                                   -- Receita/SICAF, fase 3
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  updated_by         uuid,
  deleted_at         timestamptz
);
create index fornecedores_nome_trgm on public.fornecedores using gin (nome_normalizado extensions.gin_trgm_ops);
create trigger trg_fornecedores_updated before update on public.fornecedores
  for each row execute function public.fn_touch_updated_at();

-- -----------------------------------------------------------------------------
-- Processos SEI (número canônico; o texto original fica na importação)
-- -----------------------------------------------------------------------------
create table public.processos (
  id          uuid primary key default gen_random_uuid(),
  orgao_id    uuid not null references public.orgaos(id),
  numero      text not null unique check (numero ~ '^\d{6}/\d{6}/\d{4}$'),
  assunto     text,
  link_sei    text,
  etapa_atual text,                -- informada manualmente no MVP (sem API do SEI-RJ)
  etapa_em    date,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Portarias de designação
-- orgao_emissor_texto guarda a sigla como está no ato (ex.: "SEDECSCTI").
-- -----------------------------------------------------------------------------
create table public.portarias (
  id                   uuid primary key default gen_random_uuid(),
  orgao_id             uuid not null references public.orgaos(id),    -- órgão que usa a portaria
  orgao_emissor_texto  text not null,
  numero               text not null,
  ano                  int  not null check (ano between 2000 and 2100),
  data_ato             date,
  data_publicacao      date,                                         -- DOERJ
  link                 text,
  created_at           timestamptz not null default now(),
  unique (orgao_emissor_texto, numero, ano),
  check (data_publicacao is null or data_ato is null or data_publicacao >= data_ato)
);
