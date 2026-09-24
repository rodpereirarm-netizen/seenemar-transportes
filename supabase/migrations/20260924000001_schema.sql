-- =============================================================================
-- GT PROPAG · COMPRAS PÚBLICAS — FAETEC
-- Migration 01 · Estrutura (tabelas, índices, views)
--
-- Fluxo de contratação: 3 macroprocessos · 5 etapas · 32 atividades
-- Prazos legais críticos: SEPLAG 15 corridos · PRODERJ 20 úteis (+20) · CGE 15 corridos
-- Fontes: Decreto 48.816/2023 · Decreto 48.821/2023 (art. 2º) · Decreto 48.843/2023
--         IN PRODERJ/PRE 05/2024 (art. 4º) · Lei 14.133/2021
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Catálogos do fluxo
-- -----------------------------------------------------------------------------

create table public.etapas (
  numero              int primary key check (numero between 1 and 9),
  nome                text not null,
  macroprocesso       int  not null,
  macroprocesso_nome  text not null,
  equipe              text,
  perfil_executor     text,
  frente_executora    text check (frente_executora in ('I','II','III')),
  ponto_atencao       text,
  base_legal          text
);
comment on table public.etapas is 'As 5 etapas do caminho crítico do fluxo de contratação do GT.';

create table public.modalidades (
  codigo     text primary key,
  nome       text not null,
  descricao  text,
  etapas     int[] not null,
  ordem      int not null default 0,
  ativo      boolean not null default true
);
comment on table public.modalidades is 'Enquadramento da contratação. Define quais etapas entram no checklist.';

create table public.atividades_modelo (
  id                 serial primary key,
  etapa              int  not null references public.etapas(numero),
  ordem              int  not null,
  nome               text not null,
  descricao          text,
  tipo_prazo         text check (tipo_prazo in ('corridos','uteis')),
  prazo_dias         int  check (prazo_dias is null or prazo_dias > 0),
  prorrogacao_dias   int  check (prorrogacao_dias is null or prorrogacao_dias > 0),
  prazo_critico      boolean not null default false,
  ponto_atencao      text,
  gate               boolean not null default false,
  base_legal         text,
  reaproveitada_em   text[] not null default '{}',
  ativo              boolean not null default true,
  unique (etapa, ordem),
  check ((tipo_prazo is null) = (prazo_dias is null))
);
comment on table public.atividades_modelo is 'Modelo das 32 atividades. Cada contratação recebe uma cópia conforme a modalidade.';
comment on column public.atividades_modelo.reaproveitada_em is 'Modalidades em que a atividade nasce concluída por reaproveitamento (ex.: ETP do gerenciador para Participante de RP).';

create table public.feriados (
  data       date primary key,
  descricao  text not null
);
comment on table public.feriados is 'Feriados e pontos facultativos usados na contagem de dias úteis.';

create table public.areas_demandantes (
  id     serial primary key,
  nome   text not null unique,
  sigla  text,
  ativo  boolean not null default true
);

create table public.opcoes_lista (
  id      serial primary key,
  lista   text not null,
  valor   text not null,
  ordem   int  not null default 0,
  cor     text check (cor in ('azul','ouro','verde','vermelho','cinza','roxo')),
  ativo   boolean not null default true,
  unique (lista, valor)
);
comment on table public.opcoes_lista is 'Listas suspensas configuráveis do painel (situação, status do DOD, ata, TI, etc).';

-- -----------------------------------------------------------------------------
-- Equipe do GT
-- -----------------------------------------------------------------------------

create table public.integrantes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid unique references auth.users(id) on delete set null,
  nome             text not null,
  email            text,
  orgao            text not null check (orgao in ('SEDES','SECTI','FAETEC','PRODERJ','OUTRO')),
  frente           text check (frente in ('I','II','III')),
  funcao           text,
  papel            text not null default 'consulta'
                   check (papel in ('admin','coordenacao','conformidade','elaboracao','ponto_focal','consulta')),
  modelo_trabalho  text not null default 'Presencial' check (modelo_trabalho in ('Presencial','Híbrido','Remoto')),
  telefone         text,
  membro_gt        boolean not null default true,
  ativo            boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index integrantes_email_uk on public.integrantes (lower(email)) where email is not null;
comment on column public.integrantes.papel is 'Perfil de acesso: admin · coordenacao (Frente I) · conformidade (Frente I) · elaboracao (Frente II) · ponto_focal (Frente III) · consulta.';
comment on column public.integrantes.membro_gt is 'Falso para contas técnicas (ex.: administrador do sistema) que não compõem o GT.';

-- -----------------------------------------------------------------------------
-- Atas de registro de preços
-- -----------------------------------------------------------------------------

create table public.atas (
  id                 uuid primary key default gen_random_uuid(),
  numero             text not null,
  orgao_gerenciador  text not null,
  objeto             text,
  fornecedor         text,
  forma_uso          text not null default 'Adesão' check (forma_uso in ('Adesão','Participante')),
  vigencia_inicio    date,
  vigencia_fim       date,
  situacao           text not null default 'Vigente',
  link               text,
  observacao         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Contratações (carteira do GT)
-- -----------------------------------------------------------------------------

create table public.contratacoes (
  id                      uuid primary key default gen_random_uuid(),
  numero                  int  not null unique check (numero > 0),
  titulo                  text not null,
  objeto                  text not null,
  categoria               text not null default 'Bem' check (categoria in ('Bem','Serviço','Ambos')),
  area_demandante_id      int  references public.areas_demandantes(id),
  solucao_tic             boolean not null default true,
  processo_sei_origem     text,
  processo_sei            text,
  justificativa_recebida  boolean not null default false,
  -- Planejamento e PCA
  consta_pca              boolean,
  item_pca                text,
  id_siga                 text,
  valor_estimado          numeric(16,2) check (valor_estimado is null or valor_estimado >= 0),
  origem_estimativa       text,
  data_meta               date,
  -- Enquadramento
  modalidade              text not null default 'a_definir' references public.modalidades(codigo),
  ata_id                  uuid references public.atas(id) on delete set null,
  via_descricao           text,
  nenhuma_ata_compativel  boolean not null default false,
  -- Responsabilidade
  responsavel_geral_id    uuid references public.integrantes(id) on delete set null,
  prioridade              text not null default 'Média' check (prioridade in ('Alta','Média','Baixa')),
  situacao                text not null default 'Em instrução',
  rascunho                boolean not null default false,
  -- Colunas do painel (planilha de andamento do GT)
  dod_status              text,
  dod_obs                 text,
  ata_status              text,
  ata_obs                 text,
  ti_status               text,
  ti_obs                  text,
  docs_prep_status        text,
  docs_prep_obs           text,
  divergencia_obs         text,
  ultimo_andamento        text,
  ultimo_andamento_em     timestamptz,
  observacao              text,
  link_pasta              text,
  created_by              uuid references public.integrantes(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index contratacoes_modalidade_idx on public.contratacoes (modalidade);
create index contratacoes_situacao_idx   on public.contratacoes (situacao);
create index contratacoes_resp_idx       on public.contratacoes (responsavel_geral_id);

create table public.contratacao_responsaveis (
  contratacao_id  uuid not null references public.contratacoes(id) on delete cascade,
  etapa           int  not null references public.etapas(numero),
  integrante_id   uuid references public.integrantes(id) on delete set null,
  primary key (contratacao_id, etapa)
);
comment on table public.contratacao_responsaveis is 'Responsável por etapa. Propaga para as atividades abertas da etapa.';

-- -----------------------------------------------------------------------------
-- Atividades (checklist da contratação — cópia do modelo)
-- -----------------------------------------------------------------------------

create table public.atividades (
  id                uuid primary key default gen_random_uuid(),
  contratacao_id    uuid not null references public.contratacoes(id) on delete cascade,
  modelo_id         int  references public.atividades_modelo(id) on delete set null,
  etapa             int  not null references public.etapas(numero),
  ordem             int  not null,
  nome              text not null,
  tipo_prazo        text check (tipo_prazo in ('corridos','uteis')),
  prazo_dias        int,
  prorrogacao_dias  int,
  prazo_critico     boolean not null default false,
  ponto_atencao     text,
  gate              boolean not null default false,
  base_legal        text,
  status            text not null default 'pendente'
                    check (status in ('pendente','em_andamento','aguardando','devolvida','concluida','nao_se_aplica')),
  responsavel_id    uuid references public.integrantes(id) on delete set null,
  data_inicio       date,
  data_envio        date,
  prorrogado        boolean not null default false,
  prazo_legal       date,
  prazo_meta        date,
  data_conclusao    date,
  observacao        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (contratacao_id, modelo_id)
);
create index atividades_contratacao_idx on public.atividades (contratacao_id, etapa, ordem);
create index atividades_responsavel_idx on public.atividades (responsavel_id) where status not in ('concluida','nao_se_aplica');
comment on column public.atividades.data_envio  is 'Marco de início da contagem do prazo legal (ex.: data de envio à SEPLAG).';
comment on column public.atividades.prazo_legal is 'Calculado automaticamente a partir de data_envio, tipo_prazo, prazo_dias e prorrogação.';
comment on column public.atividades.prazo_meta  is 'Prazo interno definido pela coordenação para atividades sem prazo legal.';

-- -----------------------------------------------------------------------------
-- Andamentos, documentos, notificações
-- -----------------------------------------------------------------------------

create table public.andamentos (
  id              uuid primary key default gen_random_uuid(),
  contratacao_id  uuid not null references public.contratacoes(id) on delete cascade,
  atividade_id    uuid references public.atividades(id) on delete set null,
  integrante_id   uuid references public.integrantes(id) on delete set null,
  tipo            text not null default 'andamento'
                  check (tipo in ('andamento','envio','devolucao','divergencia','conclusao','sistema')),
  texto           text not null,
  created_at      timestamptz not null default now()
);
create index andamentos_contratacao_idx on public.andamentos (contratacao_id, created_at desc);

create table public.documentos (
  id              uuid primary key default gen_random_uuid(),
  contratacao_id  uuid not null references public.contratacoes(id) on delete cascade,
  atividade_id    uuid references public.atividades(id) on delete set null,
  tipo_documento  text not null default 'Outro',
  nome_arquivo    text not null check (nome_arquivo ~* '\.(pdf|doc|docx|xls|xlsx)$'),
  storage_path    text not null unique,
  mime_type       text,
  tamanho_bytes   bigint,
  descricao       text,
  enviado_por     uuid references public.integrantes(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index documentos_contratacao_idx on public.documentos (contratacao_id);

create table public.notificacoes (
  id              bigserial primary key,
  integrante_id   uuid not null references public.integrantes(id) on delete cascade,
  tipo            text not null default 'info',
  titulo          text not null,
  texto           text,
  contratacao_id  uuid references public.contratacoes(id) on delete cascade,
  lida            boolean not null default false,
  created_at      timestamptz not null default now()
);
create index notificacoes_integrante_idx on public.notificacoes (integrante_id, lida, created_at desc);

-- -----------------------------------------------------------------------------
-- Auditoria (imutável: só triggers gravam; ninguém altera ou apaga)
-- -----------------------------------------------------------------------------

create table public.auditoria (
  id                bigserial primary key,
  created_at        timestamptz not null default now(),
  tabela            text not null,
  operacao          text not null check (operacao in ('INSERT','UPDATE','DELETE')),
  registro_id       text,
  contratacao_id    uuid,
  usuario_id        uuid,
  integrante_id     uuid,
  usuario_nome      text,
  campos_alterados  text[],
  dados_anteriores  jsonb,
  dados_novos       jsonb
);
create index auditoria_data_idx        on public.auditoria (created_at desc);
create index auditoria_tabela_idx      on public.auditoria (tabela, registro_id);
create index auditoria_contratacao_idx on public.auditoria (contratacao_id, created_at desc);
create index auditoria_integrante_idx  on public.auditoria (integrante_id, created_at desc);
