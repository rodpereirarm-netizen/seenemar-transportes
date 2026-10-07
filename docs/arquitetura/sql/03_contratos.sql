-- =============================================================================
-- SIGC · 03 · Contratos e tudo que pende deles
--   contratos · contrato_itens · alteracoes_contratuais · contrato_processos
--   designacoes · publicacoes · garantias
--
-- As tabelas filhas repetem orgao_id (herdado do contrato por gatilho) para que a
-- RLS seja um filtro simples por órgão, sem subconsulta ao contrato.
-- `motivo_alteracao` é um campo de passagem: o gatilho de auditoria (08) o exige
-- nas mudanças sensíveis, grava na trilha e o limpa (nunca fica salvo na linha).
-- =============================================================================

create table public.contratos (
  id                      uuid primary key default gen_random_uuid(),
  orgao_id                uuid not null references public.orgaos(id),
  unidade_id              uuid references public.unidades(id),
  tipo_instrumento        public.tipo_instrumento not null default 'contrato',
  numero                  text check (numero ~ '^\d{1,6}$'),       -- "016" de "016/2026"; NE "00376"; nulo = em formalização
  ano                     int  check (ano between 1990 and 2100),
  numero_complemento      text,                                    -- ex.: "(BRASVIP)" de "016/2026 (BRASVIP)"
  fornecedor_id           uuid references public.fornecedores(id),
  objeto                  text not null,
  categoria               text,                                    -- listas.lista = 'categoria_objeto'
  modalidade              text,                                    -- listas.lista = 'modalidade'
  forma_contratacao       public.forma_contratacao not null default 'a_confirmar',
  regime_legal            public.regime_legal not null default 'a_confirmar',   -- pergunta 29.2 nº 6
  natureza                public.natureza_contrato not null default 'a_confirmar',
  data_assinatura         date,
  inicio_vigencia         date,
  prazo_meses_original    int check (prazo_meses_original > 0),
  data_fim_original       date,                                    -- como escrita no termo (pergunta 29.2 nº 1)
  valor_global_original   numeric(15,2) check (valor_global_original >= 0),
  valor_mensal_original   numeric(15,2) check (valor_mensal_original >= 0),
  garantia_exigida        boolean,                                 -- nulo = não informado
  garantia_percentual     numeric(5,2) check (garantia_percentual between 0 and 100),
  prorrogavel             boolean,
  limite_vigencia_meses   int check (limite_vigencia_meses > 0),   -- nulo = deriva do regime legal
  situacao_manual         public.situacao_manual,
  situacao_manual_desde   date,
  situacao_manual_ato     text,
  situacao_manual_motivo  text,
  justificativa_inicio_antes_assinatura text,
  siafe_conferido_em      date,                                    -- coluna AM da planilha
  observacoes             text,
  -- A planilha traz o PERÍODO VIGENTE (após aditivos), não o contrato original.
  -- Na importação, início/prazo/término = período vigente e historico_incompleto = true
  -- até alguém cadastrar o contrato original e as alterações (alerta DQ-HIST).
  historico_incompleto    boolean not null default false,
  doc_base_origem         text,                                    -- coluna U: "3º.Aditivo", "Contrato"…
  importacao_linha_id     bigint,                                  -- FK criada em 05
  motivo_alteracao        text,
  created_at              timestamptz not null default now(),
  created_by              uuid default auth.uid(),
  updated_at              timestamptz not null default now(),
  updated_by              uuid,
  deleted_at              timestamptz,
  deleted_by              uuid,
  deleted_motivo          text,

  -- RN-V06: início anterior à assinatura só com justificativa
  constraint ck_inicio_assinatura check (
    inicio_vigencia is null or data_assinatura is null
    or inicio_vigencia >= data_assinatura
    or nullif(btrim(justificativa_inicio_antes_assinatura), '') is not null),
  -- Término anterior ao início é dado inválido: o importador grava nulo e preserva o original
  constraint ck_fim_apos_inicio check (data_fim_original is null or inicio_vigencia is null or data_fim_original >= inicio_vigencia),
  -- RN-V03: situação manual exige ato, data e motivo
  constraint ck_situacao_manual check (
    situacao_manual is null
    or (situacao_manual_desde is not null and nullif(btrim(situacao_manual_ato), '') is not null
        and nullif(btrim(situacao_manual_motivo), '') is not null)),
  constraint ck_numero_ano check ((numero is null) = (ano is null)),
  constraint ck_soft_delete check (deleted_at is null or nullif(btrim(deleted_motivo), '') is not null)
);

-- RN-D01: chave única por órgão (os números 008/2023, 002/2024 e 007/2025 se repetem entre SEDES e SEENEMAR)
create unique index contratos_chave_uk on public.contratos (orgao_id, tipo_instrumento, numero, ano)
  where deleted_at is null and numero is not null;
create index contratos_orgao on public.contratos (orgao_id) where deleted_at is null;
create index contratos_fornecedor on public.contratos (fornecedor_id);
create index contratos_objeto_trgm on public.contratos using gin (public.fn_normalizar_texto(objeto) extensions.gin_trgm_ops);

create trigger trg_contratos_updated before update on public.contratos
  for each row execute function public.fn_touch_updated_at();

-- Gatilho comum às filhas: herda orgao_id do contrato e impede mudar de contrato.
create or replace function public.fn_herdar_orgao_do_contrato()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.contrato_id is distinct from old.contrato_id then
    raise exception 'Não é permitido mover o registro para outro contrato' using errcode = 'check_violation';
  end if;
  select c.orgao_id into new.orgao_id from public.contratos c where c.id = new.contrato_id;
  if new.orgao_id is null then
    raise exception 'Contrato % não encontrado', new.contrato_id using errcode = 'foreign_key_violation';
  end if;
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Itens e preços (colunas E, G, H, I da planilha)
-- -----------------------------------------------------------------------------
create table public.contrato_itens (
  id                 uuid primary key default gen_random_uuid(),
  contrato_id        uuid not null references public.contratos(id),
  orgao_id           uuid not null references public.orgaos(id),
  ordem              int not null default 1,
  descricao          text not null,
  unidade_medida     text,
  quantidade         numeric(15,4) check (quantidade >= 0),
  quantidade_maxima  numeric(15,4) check (quantidade_maxima >= 0),
  tipo_preco         text not null default 'unitario'
                     check (tipo_preco in ('unitario', 'por_demanda', 'percentual_indice', 'parcela_unica', 'por_produto')),
  valor_unitario     numeric(15,4) check (valor_unitario >= 0),
  regra_preco        text,           -- texto livre quando o preço não é unitário (ex.: "% sobre tarifa")
  created_at         timestamptz not null default now()
);
create index contrato_itens_contrato on public.contrato_itens (contrato_id);
create trigger trg_itens_orgao before insert or update on public.contrato_itens
  for each row execute function public.fn_herdar_orgao_do_contrato();

-- -----------------------------------------------------------------------------
-- Alterações contratuais: aditivos, apostilamentos, reajustes, repactuações,
-- supressões e rescisão. Uma tabela só (seção 11.1 do diagnóstico).
-- -----------------------------------------------------------------------------
create table public.alteracoes_contratuais (
  id                 uuid primary key default gen_random_uuid(),
  contrato_id        uuid not null references public.contratos(id),
  orgao_id           uuid not null references public.orgaos(id),
  tipo               public.tipo_alteracao not null,
  numero_ordem       int check (numero_ordem > 0),           -- 1º, 2º termo aditivo…
  descricao          text,
  situacao           public.situacao_alteracao not null default 'em_elaboracao',
  situacao_desde     date not null default public.fn_hoje(),     -- base do alerta ALT-PEND
  data_assinatura    date,
  efeito_inicio      date,
  nova_data_fim      date,                                    -- prorrogação ou, na rescisão, a data de extinção
  prorroga_meses     int check (prorroga_meses > 0),
  delta_valor        numeric(15,2),                           -- + acréscimo / − supressão no valor global
  novo_valor_mensal  numeric(15,2) check (novo_valor_mensal >= 0),
  indice             text,                                    -- IPCA, IST, convenção coletiva…
  percentual         numeric(7,4),
  processo_id        uuid references public.processos(id),
  parecer_juridico   text,
  campanha_id        uuid,                                    -- FK criada em 05
  motivo_alteracao   text,
  created_at         timestamptz not null default now(),
  created_by         uuid default auth.uid(),
  updated_at         timestamptz not null default now(),
  updated_by         uuid,
  check (situacao not in ('assinado', 'publicado') or data_assinatura is not null),
  check (tipo <> 'rescisao' or nova_data_fim is not null or situacao not in ('assinado', 'publicado')),
  check (tipo not in ('aditivo_prazo', 'aditivo_prazo_valor') or nova_data_fim is not null
         or situacao not in ('assinado', 'publicado'))
);
create index alteracoes_contrato on public.alteracoes_contratuais (contrato_id);
create unique index alteracoes_ordem_uk on public.alteracoes_contratuais (contrato_id, tipo, numero_ordem)
  where numero_ordem is not null and situacao <> 'cancelado';
create trigger trg_alteracoes_orgao before insert or update on public.alteracoes_contratuais
  for each row execute function public.fn_herdar_orgao_do_contrato();
create trigger trg_alteracoes_updated before update on public.alteracoes_contratuais
  for each row execute function public.fn_touch_updated_at();

create or replace function public.fn_alteracao_situacao_desde()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.situacao is distinct from old.situacao then
    new.situacao_desde := public.fn_hoje();
  end if;
  return new;
end $$;
create trigger trg_alteracoes_situacao before update on public.alteracoes_contratuais
  for each row execute function public.fn_alteracao_situacao_desde();

-- -----------------------------------------------------------------------------
-- Processos vinculados (coluna M = principal; colunas "FAT." = pagamento por exercício)
-- -----------------------------------------------------------------------------
create table public.contrato_processos (
  id           uuid primary key default gen_random_uuid(),
  contrato_id  uuid not null references public.contratos(id),
  orgao_id     uuid not null references public.orgaos(id),
  processo_id  uuid not null references public.processos(id),
  papel        public.papel_processo not null,
  exercicio    int check (exercicio between 2000 and 2100),
  created_at   timestamptz not null default now(),
  unique nulls not distinct (contrato_id, processo_id, papel, exercicio),
  check (papel <> 'pagamento' or exercicio is not null)
);
create unique index contrato_processo_principal_uk on public.contrato_processos (contrato_id) where papel = 'principal';
create index contrato_processos_processo on public.contrato_processos (processo_id);
create trigger trg_cproc_orgao before insert or update on public.contrato_processos
  for each row execute function public.fn_herdar_orgao_do_contrato();

-- -----------------------------------------------------------------------------
-- Designações: pessoa × contrato × papel × portaria × período
-- RN-F03: a mesma pessoa não ocupa o MESMO papel duas vezes no mesmo período (bloqueio).
--         Papéis diferentes para a mesma pessoa (ex.: gestor e fiscal) geram alerta
--         FIS-SEG, porque a vedação depende de confirmação (RN-F04).
-- -----------------------------------------------------------------------------
create table public.designacoes (
  id           uuid primary key default gen_random_uuid(),
  contrato_id  uuid not null references public.contratos(id),
  orgao_id     uuid not null references public.orgaos(id),
  pessoa_id    uuid not null references public.pessoas(id),
  papel        public.papel_designacao not null,
  portaria_id  uuid references public.portarias(id),
  inicio       date,                            -- nulo = desde o início do contrato (não informado)
  fim          date,                            -- nulo = em vigor
  motivo_fim   text,
  motivo_alteracao text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  check (fim is null or inicio is null or fim >= inicio),
  constraint ck_designacao_motivo_fim check (fim is null or nullif(btrim(motivo_fim), '') is not null),
  constraint ex_designacao_duplicada exclude using gist (
    contrato_id with =, pessoa_id with =, papel with =,
    daterange(inicio, fim, '[]') with &&),
  -- Um titular por vez para os papéis singulares
  constraint ex_papel_singular exclude using gist (
    contrato_id with =, papel with =, daterange(inicio, fim, '[]') with &&)
    where (papel in ('gestor', 'gestor_substituto', 'fiscal_presidente'))
);
create index designacoes_pessoa on public.designacoes (pessoa_id);
create trigger trg_designacoes_orgao before insert or update on public.designacoes
  for each row execute function public.fn_herdar_orgao_do_contrato();
create trigger trg_designacoes_updated before update on public.designacoes
  for each row execute function public.fn_touch_updated_at();

-- -----------------------------------------------------------------------------
-- Publicações (DOERJ e PNCP) do contrato ou de uma alteração
-- RN-P03: publicação antes da assinatura do ato só com justificativa.
-- -----------------------------------------------------------------------------
create table public.publicacoes (
  id                uuid primary key default gen_random_uuid(),
  contrato_id       uuid not null references public.contratos(id),
  orgao_id          uuid not null references public.orgaos(id),
  alteracao_id      uuid references public.alteracoes_contratuais(id),   -- nulo = publicação do contrato
  veiculo           public.veiculo_publicacao not null,
  data_publicacao   date not null,
  id_pncp           text,
  edicao_pagina     text,
  link              text,
  justificativa_inconsistencia text,
  motivo_alteracao  text,
  created_at        timestamptz not null default now(),
  check (veiculo = 'pncp' or id_pncp is null)
);
create unique index publicacoes_ato_uk on public.publicacoes
  (contrato_id, coalesce(alteracao_id, '00000000-0000-0000-0000-000000000000'::uuid), veiculo);
create trigger trg_publicacoes_orgao before insert or update on public.publicacoes
  for each row execute function public.fn_herdar_orgao_do_contrato();

create or replace function public.fn_publicacao_validar()
returns trigger language plpgsql set search_path = public as $$
declare v_assinatura date; v_contrato uuid;
begin
  if new.alteracao_id is not null then
    select a.data_assinatura, a.contrato_id into v_assinatura, v_contrato
      from public.alteracoes_contratuais a where a.id = new.alteracao_id;
    if v_contrato is distinct from new.contrato_id then
      raise exception 'A alteração não pertence a este contrato' using errcode = 'check_violation';
    end if;
  else
    select c.data_assinatura into v_assinatura from public.contratos c where c.id = new.contrato_id;
  end if;
  if v_assinatura is not null and new.data_publicacao < v_assinatura
     and nullif(btrim(new.justificativa_inconsistencia), '') is null then
    raise exception 'RN-P03: publicação (%) anterior à assinatura do ato (%) exige justificativa',
      new.data_publicacao, v_assinatura using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger trg_publicacoes_validar before insert or update on public.publicacoes
  for each row execute function public.fn_publicacao_validar();

-- -----------------------------------------------------------------------------
-- Garantias (coluna W). Validade, seguradora e apólice: [DADO AUSENTE] hoje.
-- -----------------------------------------------------------------------------
create table public.garantias (
  id            uuid primary key default gen_random_uuid(),
  contrato_id   uuid not null references public.contratos(id),
  orgao_id      uuid not null references public.orgaos(id),
  modalidade    public.modalidade_garantia not null default 'a_confirmar',
  percentual    numeric(5,2) check (percentual between 0 and 100),
  valor         numeric(15,2) check (valor >= 0),
  inicio        date,
  validade      date,
  seguradora    text,
  apolice       text,
  situacao      public.situacao_garantia not null default 'prevista',
  observacao    text,
  motivo_alteracao text,
  created_at    timestamptz not null default now(),
  check (validade is null or inicio is null or validade >= inicio),
  check (situacao <> 'apresentada' or (valor is not null or percentual is not null))
);
create index garantias_contrato on public.garantias (contrato_id);
create trigger trg_garantias_orgao before insert or update on public.garantias
  for each row execute function public.fn_herdar_orgao_do_contrato();
