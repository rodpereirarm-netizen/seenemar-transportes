-- =============================================================================
-- SIGC · 08 · Saúde (conformidade), Risco (probabilidade × impacto) e Qualidade do dado
--
-- Saúde: checklist explicável  → atendido / não atendido / não se aplica
-- Risco: alertas abertos por dimensão × pesos; dimensões sem dado saem do cálculo
--        (cobertura exibida); ajuste manual só para CIMA, com justificativa; materialidade
-- Qualidade: completude dos campos essenciais + inconsistências abertas
-- =============================================================================

create table public.riscos_ajustes (
  id             uuid primary key default gen_random_uuid(),
  contrato_id    uuid not null references public.contratos(id),
  orgao_id       uuid not null references public.orgaos(id),
  score_minimo   int  not null check (score_minimo between 0 and 100),
  justificativa  text not null check (length(btrim(justificativa)) >= 20),
  valido_ate     date,
  criado_por     uuid not null default auth.uid(),
  criado_em      timestamptz not null default now(),
  revogado_em    timestamptz,
  revogado_por   uuid
);
create index riscos_ajustes_contrato on public.riscos_ajustes (contrato_id) where revogado_em is null;
create trigger trg_riscos_ajustes_orgao before insert or update on public.riscos_ajustes
  for each row execute function public.fn_herdar_orgao_do_contrato();

create table public.riscos_historico (
  contrato_id  uuid not null references public.contratos(id),
  orgao_id     uuid not null references public.orgaos(id),
  data         date not null,
  score        int,
  cobertura    int,
  nivel        text,
  componentes  jsonb not null,
  primary key (contrato_id, data)
);

-- -----------------------------------------------------------------------------
-- Saúde
-- -----------------------------------------------------------------------------
create or replace view public.vw_contrato_saude with (security_invoker = true) as
with base as (
  select c.id as contrato_id, c.orgao_id, v.situacao, c.regime_legal, c.data_assinatura, c.garantia_exigida,
         c.historico_incompleto, f.cnpj, v.divergencia_termino_dias,
         public.fn_hoje() as hoje,
         (public.fn_parametro('pncp.regime_presumido_desde', c.orgao_id) #>> '{}')::date as pncp_desde
    from public.contratos c
    join public.vw_contrato_vigencia v on v.contrato_id = c.id
    left join public.fornecedores f on f.id = c.fornecedor_id
   where c.deleted_at is null and v.situacao in ('vigente', 'vencido', 'nao_iniciado', 'vigencia_indefinida')
),
desig as (
  select d.contrato_id, d.papel, d.portaria_id, pt.data_publicacao
    from public.designacoes d left join public.portarias pt on pt.id = d.portaria_id
   where (d.inicio is null or d.inicio <= public.fn_hoje()) and (d.fim is null or d.fim >= public.fn_hoje())
),
itens as (
  select b.contrato_id, b.orgao_id, x.item, x.status
    from base b
   cross join lateral (values
     ('Gestor designado',
       case when exists (select 1 from desig d where d.contrato_id = b.contrato_id and d.papel = 'gestor') then 'atendido' else 'nao_atendido' end),
     ('Fiscal designado',
       case when exists (select 1 from desig d where d.contrato_id = b.contrato_id
                          and d.papel in ('fiscal_presidente', 'fiscal', 'fiscal_tecnico', 'fiscal_administrativo')) then 'atendido' else 'nao_atendido' end),
     ('Fiscal substituto designado',
       case when exists (select 1 from desig d where d.contrato_id = b.contrato_id and d.papel = 'fiscal_substituto') then 'atendido' else 'nao_atendido' end),
     ('Portarias de designação publicadas',
       case when not exists (select 1 from desig d where d.contrato_id = b.contrato_id) then 'nao_se_aplica'
            when exists (select 1 from desig d where d.contrato_id = b.contrato_id and d.data_publicacao is null) then 'nao_atendido'
            else 'atendido' end),
     ('Contrato publicado no PNCP',
       case when b.regime_legal = 'lei_8666' or (b.regime_legal = 'a_confirmar' and b.data_assinatura < b.pncp_desde) then 'nao_se_aplica'
            when exists (select 1 from public.publicacoes p where p.contrato_id = b.contrato_id and p.alteracao_id is null and p.veiculo = 'pncp') then 'atendido'
            else 'nao_atendido' end),
     ('Contrato publicado no DOERJ',
       case when exists (select 1 from public.publicacoes p where p.contrato_id = b.contrato_id and p.alteracao_id is null and p.veiculo = 'doerj') then 'atendido'
            else 'nao_atendido' end),
     ('Fornecedor com CNPJ', case when b.cnpj is not null then 'atendido' else 'nao_atendido' end),
     ('Garantia apresentada',
       case when b.garantia_exigida is distinct from true then 'nao_se_aplica'
            when exists (select 1 from public.garantias g where g.contrato_id = b.contrato_id and g.situacao in ('apresentada', 'liberada')) then 'atendido'
            else 'nao_atendido' end),
     ('Regime legal informado', case when b.regime_legal <> 'a_confirmar' then 'atendido' else 'nao_atendido' end),
     ('Término coerente com início + prazo',
       case when b.divergencia_termino_dias is null then 'nao_se_aplica'
            when b.divergencia_termino_dias = 0 then 'atendido' else 'nao_atendido' end),
     ('Histórico de alterações cadastrado', case when b.historico_incompleto then 'nao_atendido' else 'atendido' end),
     ('Processo SEI principal vinculado',
       case when exists (select 1 from public.contrato_processos cp where cp.contrato_id = b.contrato_id and cp.papel = 'principal') then 'atendido'
            else 'nao_atendido' end),
     ('Sem alteração parada além do prazo',
       case when exists (select 1 from public.alertas a where a.contrato_id = b.contrato_id and a.regra_codigo = 'ALT-PEND' and a.resolvido_em is null)
            then 'nao_atendido' else 'atendido' end)
   ) as x(item, status)
)
select contrato_id, orgao_id,
       round(100.0 * count(*) filter (where status = 'atendido')
             / nullif(count(*) filter (where status <> 'nao_se_aplica'), 0))::int as score,
       count(*) filter (where status = 'atendido')::int     as atendidos,
       count(*) filter (where status <> 'nao_se_aplica')::int as aplicaveis,
       jsonb_agg(jsonb_build_object('item', item, 'status', status) order by status desc, item) as itens
  from itens
 group by contrato_id, orgao_id;

-- -----------------------------------------------------------------------------
-- Risco
-- -----------------------------------------------------------------------------
create or replace function public.fn_nivel_risco(p int)
returns text language sql immutable set search_path = public as $$
  select case when p is null then null when p <= 20 then 'muito_baixo' when p <= 40 then 'baixo'
              when p <= 60 then 'medio' when p <= 80 then 'alto' else 'critico' end;
$$;

create or replace view public.vw_contrato_risco with (security_invoker = true) as
with base as (
  select c.id as contrato_id, c.orgao_id, v.situacao, v.data_fim_efetiva, c.garantia_exigida,
         coalesce(vv.valor_global_atual, 0) as valor,
         public.fn_parametro('risco.pesos', c.orgao_id) as pesos,
         public.fn_parametro('risco.pontos_severidade', c.orgao_id) as pontos,
         public.fn_parametro('risco.materialidade', c.orgao_id) as materialidade
    from public.contratos c
    join public.vw_contrato_vigencia v on v.contrato_id = c.id
    left join public.vw_contrato_valores vv on vv.contrato_id = c.id
   where c.deleted_at is null and v.situacao in ('vigente', 'vencido', 'nao_iniciado', 'vigencia_indefinida')
),
dim as (
  select b.contrato_id, d.dimensao, (b.pesos ->> d.dimensao)::numeric as peso,
         -- MVP: financeiro, fornecedor e ocorrências ainda não têm fonte → fora do cálculo
         case d.dimensao
           when 'vigencia'              then b.data_fim_efetiva is not null
           when 'documentacao_garantia' then b.garantia_exigida is not null
           when 'financeiro'            then false
           when 'fornecedor'            then false
           when 'ocorrencias'           then false
           else true
         end as coberta,
         coalesce((select max((b.pontos ->> a.severidade::text)::int)
                     from public.alertas a join public.regras_alerta r on r.codigo = a.regra_codigo
                    where a.contrato_id = b.contrato_id and a.resolvido_em is null and r.dimensao = d.dimensao), 0) as pontos
    from base b
   cross join lateral jsonb_object_keys(b.pesos) as d(dimensao)
),
calc as (
  select contrato_id,
         round(sum(peso * pontos) filter (where coberta) / nullif(sum(peso) filter (where coberta), 0))::int as score_calculado,
         round(100 * sum(peso) filter (where coberta) / nullif(sum(peso), 0))::int                          as cobertura,
         jsonb_object_agg(dimensao, jsonb_build_object('peso', peso, 'pontos', pontos, 'coberta', coberta)) as componentes
    from dim group by contrato_id
)
select b.contrato_id, b.orgao_id, c.score_calculado, aj.score_minimo as ajuste_manual, aj.justificativa as ajuste_justificativa,
       greatest(c.score_calculado, aj.score_minimo) as score,
       public.fn_nivel_risco(greatest(c.score_calculado, aj.score_minimo)) as nivel,
       c.cobertura, c.componentes, b.valor,
       m.fator as fator_materialidade,
       round(greatest(c.score_calculado, aj.score_minimo) * m.fator, 1) as prioridade_atencao
  from base b
  join calc c on c.contrato_id = b.contrato_id
  left join lateral (select ra.score_minimo, ra.justificativa from public.riscos_ajustes ra
                      where ra.contrato_id = b.contrato_id and ra.revogado_em is null
                        and (ra.valido_ate is null or ra.valido_ate >= public.fn_hoje())
                      order by ra.criado_em desc limit 1) aj on true
  left join lateral (select (x ->> 'fator')::numeric as fator
                       from jsonb_array_elements(b.materialidade) with ordinality t(x, i)
                      where x ->> 'ate' is null or b.valor <= (x ->> 'ate')::numeric
                      order by i limit 1) m on true;

create or replace function public.fn_registrar_riscos()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.riscos_historico (contrato_id, orgao_id, data, score, cobertura, nivel, componentes)
  select r.contrato_id, r.orgao_id, public.fn_hoje(), r.score, r.cobertura, r.nivel, r.componentes
    from public.vw_contrato_risco r
  on conflict (contrato_id, data) do update
     set score = excluded.score, cobertura = excluded.cobertura, nivel = excluded.nivel, componentes = excluded.componentes;
  get diagnostics n = row_count;
  return n;
end $$;

-- -----------------------------------------------------------------------------
-- Qualidade do dado por contrato
-- -----------------------------------------------------------------------------
create or replace view public.vw_contrato_qualidade with (security_invoker = true) as
with campos as (
  select c.id as contrato_id, c.orgao_id,
         array[
           c.numero is not null, f.cnpj is not null, c.objeto is not null and c.objeto <> '[DADO AUSENTE]',
           c.data_assinatura is not null, c.inicio_vigencia is not null, c.prazo_meses_original is not null,
           c.data_fim_original is not null, c.valor_global_original is not null, c.valor_mensal_original is not null,
           c.regime_legal <> 'a_confirmar', c.natureza <> 'a_confirmar', c.garantia_exigida is not null,
           exists (select 1 from public.contrato_processos cp where cp.contrato_id = c.id and cp.papel = 'principal'),
           exists (select 1 from public.designacoes d where d.contrato_id = c.id and d.papel = 'gestor'),
           exists (select 1 from public.designacoes d where d.contrato_id = c.id and d.papel <> 'gestor' and d.papel <> 'gestor_substituto')
         ] as preenchidos,
         (select count(*) from public.alertas a where a.contrato_id = c.id and a.resolvido_em is null and a.regra_codigo like 'DQ-%') as inconsistencias
    from public.contratos c
    left join public.fornecedores f on f.id = c.fornecedor_id
   where c.deleted_at is null
)
select contrato_id, orgao_id,
       round(100.0 * (select count(*) from unnest(preenchidos) x where x) / cardinality(preenchidos))::int as completude,
       inconsistencias::int,
       greatest(0, 100 - 20 * inconsistencias)::int as consistencia,
       round(0.5 * (100.0 * (select count(*) from unnest(preenchidos) x where x) / cardinality(preenchidos))
             + 0.5 * greatest(0, 100 - 20 * inconsistencias))::int as score
  from campos;
