-- =============================================================================
-- SIGC · 01 · Base: extensões, tipos, parâmetros, calendário e funções utilitárias
--
-- Convenções do schema inteiro
--   · Tabelas de negócio têm orgao_id (multi-órgão desde o MVP) e são protegidas por RLS.
--   · Nada é apagado fisicamente: contratos e cadastros usam soft delete (deleted_at).
--   · Valores importados guardam o original (importacao_linhas.valores_originais).
--   · Lacunas de regra ficam em PARÂMETROS editáveis, marcados com a_validar = true.
--   · "Hoje" vem de fn_hoje(), que aceita uma data de referência fixa
--     (GUC sigc.data_referencia) para testes e reprocessamentos.
-- =============================================================================

create extension if not exists unaccent  with schema extensions;
create extension if not exists pg_trgm   with schema extensions;
create extension if not exists btree_gist with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos (domínios fixos do sistema; listas que a área edita ficam em `listas`)
-- -----------------------------------------------------------------------------

create type public.perfil_usuario as enum (
  'admin',              -- administração do sistema (todos os órgãos quando orgao_id é nulo)
  'gestao_contratos',   -- DGAF / coordenação de contratos
  'gestor',             -- gestor de contrato (escopo: contratos em que está designado)
  'fiscal',             -- fiscal de contrato (escopo: contratos em que está designado)
  'financeiro',
  'juridico',
  'alta_gestao',        -- subsecretaria / direção
  'auditoria'           -- controle interno (somente leitura)
);

create type public.tipo_instrumento as enum (
  'contrato', 'nota_empenho', 'termo_cooperacao', 'termo_descentralizacao',
  'ata_registro_precos', 'resolucao', 'convenio', 'outro'
);

create type public.regime_legal as enum ('lei_8666', 'lei_14133', 'a_confirmar');
create type public.natureza_contrato as enum ('continuo', 'escopo', 'a_confirmar');
create type public.forma_contratacao as enum ('licitacao', 'contratacao_direta', 'adesao_arp', 'a_confirmar');

-- Situações que dependem de ato formal. As demais (vigente, a vencer, vencido…) são calculadas.
create type public.situacao_manual as enum ('encerrado', 'rescindido', 'suspenso');

create type public.tipo_alteracao as enum (
  'aditivo_prazo', 'aditivo_valor', 'aditivo_prazo_valor', 'aditivo_qualitativo',
  'apostilamento', 'reajuste', 'repactuacao', 'supressao', 'rescisao'
);

create type public.situacao_alteracao as enum (
  'em_elaboracao', 'analise_juridica', 'aguardando_assinatura', 'assinado', 'publicado', 'cancelado'
);

create type public.papel_designacao as enum (
  'gestor', 'gestor_substituto',
  'fiscal_presidente', 'fiscal', 'fiscal_tecnico', 'fiscal_administrativo', 'fiscal_substituto'
);

create type public.papel_processo as enum (
  'principal', 'pagamento', 'prorrogacao', 'nova_contratacao', 'alteracao', 'sancao', 'outro'
);

create type public.veiculo_publicacao as enum ('doerj', 'pncp');

create type public.modalidade_garantia as enum ('caucao', 'seguro_garantia', 'fianca_bancaria', 'titulos_divida', 'a_confirmar');
create type public.situacao_garantia as enum ('prevista', 'apresentada', 'nao_apresentada', 'liberada', 'executada');

-- Ordem importa: permite comparar severidades (critico > alto > …).
create type public.severidade as enum ('planejamento', 'atencao', 'alerta', 'alto', 'critico');

create type public.prioridade as enum ('baixa', 'media', 'alta', 'critica');
create type public.status_tarefa as enum ('aberta', 'em_andamento', 'concluida', 'cancelada');
create type public.origem_tarefa as enum ('regra', 'campanha', 'manual', 'importacao');

create type public.situacao_pessoa as enum ('ativo', 'afastado', 'desligado');

-- -----------------------------------------------------------------------------
-- Parâmetros: chave global (orgao_id nulo) ou específica do órgão
-- -----------------------------------------------------------------------------

create table public.parametros (
  id          bigint generated always as identity primary key,
  chave       text not null,
  orgao_id    uuid,                         -- FK criada em 02 (orgaos ainda não existe)
  valor       jsonb not null,
  descricao   text not null,
  a_validar   text,                         -- ex.: '[REGRA A CONFIRMAR] pergunta 29.2 nº 1'
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  unique nulls not distinct (chave, orgao_id)
);

-- Feriados (copiado do GT PROPAG). Usado na contagem de dias úteis (PNCP, tarefas).
create table public.feriados (
  data       date primary key,
  descricao  text not null
);

-- Listas editáveis pela administração (categorias de objeto, unidades de medida, DOC. BASE…)
create table public.listas (
  id        bigint generated always as identity primary key,
  lista     text not null,
  valor     text not null,
  rotulo    text not null,
  ordem     int  not null default 0,
  ativo     boolean not null default true,
  unique (lista, valor)
);

-- -----------------------------------------------------------------------------
-- Datas
-- -----------------------------------------------------------------------------

-- Data de referência. Em produção = hoje no fuso de Brasília.
-- Testes e reprocessamentos fixam a data com: set sigc.data_referencia = '2026-10-07';
create or replace function public.fn_hoje()
returns date language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('sigc.data_referencia', true), '')::date,
                  (now() at time zone 'America/Sao_Paulo')::date);
$$;

create or replace function public.fn_eh_dia_util(p_data date)
returns boolean language sql stable set search_path = public as $$
  select extract(isodow from p_data) < 6
     and not exists (select 1 from public.feriados f where f.data = p_data);
$$;

-- Soma dias úteis a partir do dia seguinte (art. 183 da Lei 14.133: exclui o dia do começo).
create or replace function public.fn_somar_dias_uteis(p_inicio date, p_dias int)
returns date language plpgsql stable set search_path = public as $$
declare d date := p_inicio; n int := 0;
begin
  if p_inicio is null or p_dias is null then return null; end if;
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
    when p_de is null or p_ate is null then null
    when p_ate >= p_de then
      (select count(*)::int from generate_series(p_de + 1, p_ate, interval '1 day') g
        where public.fn_eh_dia_util(g::date))
    else
      -(select count(*)::int from generate_series(p_ate + 1, p_de, interval '1 day') g
        where public.fn_eh_dia_util(g::date))
  end;
$$;

-- -----------------------------------------------------------------------------
-- Parâmetros: leitura com precedência órgão > global
-- -----------------------------------------------------------------------------

create or replace function public.fn_parametro(p_chave text, p_orgao uuid default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select valor from public.parametros
   where chave = p_chave and (orgao_id = p_orgao or orgao_id is null)
   order by orgao_id nulls last
   limit 1;
$$;

-- Fim de vigência calculado por início + prazo, segundo a convenção do órgão.
--   'edate_menos_1' : 01/01/2026 + 12 meses → 31/12/2026 (fórmula usada nas linhas da SEDES)
--   'mesmo_dia'     : 01/01/2026 + 12 meses → 01/01/2027 (padrão observado nas linhas da SEENEMAR)
create or replace function public.fn_fim_por_prazo(p_inicio date, p_meses int, p_convencao text)
returns date language sql immutable set search_path = public as $$
  select case
    when p_inicio is null or p_meses is null then null
    when p_convencao = 'mesmo_dia' then (p_inicio + make_interval(months => p_meses))::date
    else (p_inicio + make_interval(months => p_meses))::date - 1
  end;
$$;

-- -----------------------------------------------------------------------------
-- Texto e identificadores
-- -----------------------------------------------------------------------------

-- Maiúsculas, sem acento e com espaços simples. Base de busca e de deduplicação de nomes.
create or replace function public.fn_normalizar_texto(p text)
returns text language sql immutable set search_path = public, extensions as $$
  select nullif(regexp_replace(upper(extensions.unaccent(btrim(p))), '\s+', ' ', 'g'), '');
$$;

create or replace function public.fn_somente_digitos(p text)
returns text language sql immutable set search_path = public as $$
  select nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '');
$$;

-- CNPJ válido pelos dígitos verificadores (RN-D02).
create or replace function public.fn_cnpj_valido(p_cnpj text)
returns boolean language plpgsql immutable set search_path = public as $$
declare
  d text := public.fn_somente_digitos(p_cnpj);
  p1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  p2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  s int; r int; i int;
begin
  if d is null or length(d) <> 14 or d ~ '^(\d)\1{13}$' then return false; end if;
  s := 0; for i in 1..12 loop s := s + substr(d, i, 1)::int * p1[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  if r <> substr(d, 13, 1)::int then return false; end if;
  s := 0; for i in 1..13 loop s := s + substr(d, i, 1)::int * p2[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  return r = substr(d, 14, 1)::int;
end $$;

-- Processo SEI no formato canônico NNNNNN/NNNNNN/AAAA (RN-D03).
-- Aceita as variações da planilha: "SEI-480001/000228/2023", "480001/ 000228/ 2023", "480001.000228/2023."
-- Texto sem o padrão → null (o original continua em importacao_linhas).
create or replace function public.fn_processo_canonico(p text)
returns text language sql immutable set search_path = public as $$
  select case
    when m is null then null
    else m[1] || '/' || lpad(m[2], 6, '0') || '/' || m[3]
  end
  from (select regexp_match(coalesce(p, ''), '(\d{6})\D{1,3}(\d{1,6})\D{1,3}(\d{4})') as m) x;
$$;

-- Marcadores de lacuna usados na planilha (pergunta 29.2 nº 2).
-- Retorna 'nao_se_aplica', 'nao_informado' ou null (valor comum).
create or replace function public.fn_marcador_lacuna(p text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when p is null or btrim(p) = '' then 'nao_informado'
    when upper(btrim(p)) = any (select jsonb_array_elements_text(public.fn_parametro('importacao.marcadores_nao_se_aplica')))
      then 'nao_se_aplica'
    when upper(btrim(p)) = any (select jsonb_array_elements_text(public.fn_parametro('importacao.marcadores_nao_informado')))
      then 'nao_informado'
  end;
$$;


-- Contexto de sistema: rotinas internas (motor, importação aprovada, pg_cron) ligam esta
-- marca durante a transação para que as restrições por perfil não se apliquem a elas.
-- A API não expõe set_config, então o cliente não consegue ligá-la.
create or replace function public.fn_contexto_sistema()
returns boolean language sql stable set search_path = public as $$
  select auth.uid() is null or coalesce(current_setting('sigc.sistema', true), '') = 'on';
$$;

-- -----------------------------------------------------------------------------
-- Gatilho genérico de updated_at
-- -----------------------------------------------------------------------------

create or replace function public.fn_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

create trigger trg_parametros_updated before update on public.parametros
  for each row execute function public.fn_touch_updated_at();
