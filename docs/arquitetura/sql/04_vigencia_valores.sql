-- =============================================================================
-- SIGC · 04 · Vigência, situação e valores CALCULADOS (nunca digitados)
--
-- RN-V01 fim efetivo · RN-V02 fim por prazo · RN-V03/V04 situação
-- RN-$01 valor atualizado · RN-$02 itens × mensal · RN-$03 limites de acréscimo
-- Views com security_invoker: respeitam a RLS de quem consulta.
-- =============================================================================

create or replace view public.vw_contrato_vigencia with (security_invoker = true) as
with alt as (
  select a.contrato_id,
         max(a.nova_data_fim) filter (where a.tipo <> 'rescisao')                    as fim_prorrogado,
         min(a.nova_data_fim) filter (where a.tipo = 'rescisao')                     as fim_rescisao,
         count(*) filter (where a.tipo in ('aditivo_prazo', 'aditivo_prazo_valor'))  as qtd_prorrogacoes
    from public.alteracoes_contratuais a
   where a.situacao in ('assinado', 'publicado')
   group by a.contrato_id
),
base as (
  select c.id as contrato_id, c.orgao_id, c.situacao_manual, c.inicio_vigencia, c.prazo_meses_original,
         c.data_fim_original, c.natureza, c.regime_legal, c.prorrogavel, c.limite_vigencia_meses,
         public.fn_fim_por_prazo(c.inicio_vigencia, c.prazo_meses_original,
           coalesce(public.fn_parametro('vigencia.convencao_termino', c.orgao_id) #>> '{}', 'edate_menos_1')) as data_fim_calculada,
         alt.fim_prorrogado, alt.fim_rescisao, coalesce(alt.qtd_prorrogacoes, 0) as qtd_prorrogacoes,
         public.fn_hoje() as hoje
    from public.contratos c
    left join alt on alt.contrato_id = c.id
   where c.deleted_at is null
),
efetiva as (
  select b.*,
         case
           when b.fim_rescisao is not null then b.fim_rescisao
           when b.fim_prorrogado is not null
                and b.fim_prorrogado > coalesce(b.data_fim_original, b.data_fim_calculada, '-infinity') then b.fim_prorrogado
           else coalesce(b.data_fim_original, b.data_fim_calculada)
         end as data_fim_efetiva,
         case
           when b.fim_rescisao is not null then 'rescisao'
           when b.fim_prorrogado is not null
                and b.fim_prorrogado > coalesce(b.data_fim_original, b.data_fim_calculada, '-infinity') then 'alteracao'
           when b.data_fim_original is not null then 'termo'
           when b.data_fim_calculada is not null then 'calculada'
         end as fonte_fim
    from base b
)
select e.contrato_id,
       e.orgao_id,
       e.inicio_vigencia,
       e.data_fim_original,
       e.data_fim_calculada,
       e.data_fim_efetiva,
       e.fonte_fim,
       e.data_fim_original - e.data_fim_calculada                         as divergencia_termino_dias,
       e.data_fim_efetiva - e.hoje                                       as dias_para_vencer,
       e.qtd_prorrogacoes,
       -- meses de vigência acumulados (início até o fim efetivo, inclusive)
       case when e.inicio_vigencia is not null and e.data_fim_efetiva is not null then
         (extract(year from age(e.data_fim_efetiva + 1, e.inicio_vigencia)) * 12
          + extract(month from age(e.data_fim_efetiva + 1, e.inicio_vigencia)))::int
       end                                                                as meses_acumulados,
       coalesce(e.limite_vigencia_meses,
                case e.regime_legal
                  when 'lei_8666'  then (public.fn_parametro('vigencia.limite_meses_8666',  e.orgao_id) #>> '{}')::int
                  when 'lei_14133' then (public.fn_parametro('vigencia.limite_meses_14133', e.orgao_id) #>> '{}')::int
                end)                                                      as limite_vigencia_meses,
       case
         when e.situacao_manual is not null                    then e.situacao_manual::text
         when e.inicio_vigencia is null                        then 'em_formalizacao'
         when e.hoje < e.inicio_vigencia                       then 'nao_iniciado'
         when e.data_fim_efetiva is null                       then 'vigencia_indefinida'
         when e.hoje > e.data_fim_efetiva                      then 'vencido'
         else 'vigente'
       end                                                                as situacao,
       case
         when e.situacao_manual is not null or e.inicio_vigencia is null or e.data_fim_efetiva is null
              or e.hoje > e.data_fim_efetiva or e.hoje < e.inicio_vigencia then null
         when e.data_fim_efetiva - e.hoje <= 30  then 30
         when e.data_fim_efetiva - e.hoje <= 60  then 60
         when e.data_fim_efetiva - e.hoje <= 90  then 90
         when e.data_fim_efetiva - e.hoje <= 120 then 120
         when e.data_fim_efetiva - e.hoje <= 180 then 180
       end                                                                as faixa_vencimento
  from efetiva e;

comment on view public.vw_contrato_vigencia is
  'RN-V01..V04. situacao: em_formalizacao | nao_iniciado | vigente | vencido | vigencia_indefinida | encerrado | rescindido | suspenso. '
  '"vencido" é sempre "Vencido – vigência a confirmar": o encerramento formal vira situacao_manual = encerrado.';

-- Rótulo de tela (um só lugar para o texto exibido)
create or replace function public.fn_rotulo_situacao(p_situacao text, p_faixa int)
returns text language sql immutable set search_path = public as $$
  select case p_situacao
    when 'em_formalizacao'     then 'Em formalização'
    when 'nao_iniciado'        then 'Assinado, não iniciado'
    when 'vigencia_indefinida' then 'Vigência indefinida (dado ausente)'
    when 'vencido'             then 'Vencido – vigência a confirmar'
    when 'encerrado'           then 'Encerrado'
    when 'rescindido'          then 'Rescindido'
    when 'suspenso'            then 'Suspenso'
    when 'vigente' then case when p_faixa is null then 'Vigente' else 'A vencer em até ' || p_faixa || ' dias' end
  end;
$$;

-- -----------------------------------------------------------------------------
-- Valores
-- -----------------------------------------------------------------------------
create or replace view public.vw_contrato_valores with (security_invoker = true) as
with alt as (
  select a.contrato_id,
         sum(coalesce(a.delta_valor, 0))                                                   as delta_total,
         sum(a.delta_valor) filter (where a.tipo = 'aditivo_valor' and a.delta_valor > 0)  as acrescimos_quantitativos,
         -sum(a.delta_valor) filter (where a.tipo = 'supressao' and a.delta_valor < 0)     as supressoes,
         (array_agg(a.novo_valor_mensal order by coalesce(a.efeito_inicio, a.data_assinatura) desc)
            filter (where a.novo_valor_mensal is not null))[1]                             as ultimo_valor_mensal
    from public.alteracoes_contratuais a
   where a.situacao in ('assinado', 'publicado')
   group by a.contrato_id
),
itens as (
  select i.contrato_id,
         sum(i.quantidade * i.valor_unitario) filter (where i.tipo_preco = 'unitario')  as mensal_por_itens,
         count(*) filter (where i.tipo_preco <> 'unitario')                             as itens_sem_preco_unitario,
         count(*)                                                                       as qtd_itens
    from public.contrato_itens i
   group by i.contrato_id
)
select c.id                                                       as contrato_id,
       c.orgao_id,
       c.valor_global_original,
       c.valor_global_original + coalesce(alt.delta_total, 0)     as valor_global_atual,          -- RN-$01
       c.valor_mensal_original,
       coalesce(alt.ultimo_valor_mensal, c.valor_mensal_original) as valor_mensal_atual,
       itens.mensal_por_itens,
       coalesce(itens.qtd_itens, 0)                               as qtd_itens,
       coalesce(itens.itens_sem_preco_unitario, 0)                as itens_sem_preco_unitario,
       -- RN-$02: Σ(q × u) × valor mensal (só quando todos os itens têm preço unitário)
       case when itens.itens_sem_preco_unitario = 0 and c.valor_mensal_original > 0 and itens.mensal_por_itens is not null
            then round(abs(itens.mensal_por_itens - c.valor_mensal_original) / c.valor_mensal_original * 100, 2)
       end                                                        as divergencia_itens_pct,
       -- valor mensal × prazo × valor global informado
       case when c.valor_mensal_original > 0 and c.prazo_meses_original > 0 and c.valor_global_original > 0
            then round(abs(c.valor_mensal_original * c.prazo_meses_original - c.valor_global_original)
                       / c.valor_global_original * 100, 2)
       end                                                        as divergencia_global_pct,
       -- RN-$03: acréscimos e supressões acumulados sobre o valor inicial atualizado [REGRA A CONFIRMAR: art. 125]
       case when c.valor_global_original > 0
            then round(coalesce(alt.acrescimos_quantitativos, 0) / c.valor_global_original * 100, 2) end as acrescimo_acumulado_pct,
       case when c.valor_global_original > 0
            then round(coalesce(alt.supressoes, 0) / c.valor_global_original * 100, 2) end               as supressao_acumulada_pct
  from public.contratos c
  left join alt   on alt.contrato_id = c.id
  left join itens on itens.contrato_id = c.id
 where c.deleted_at is null;

-- Bloqueio de alterações acima do limite legal (RN-$03) e de prorrogação acima do limite (RN-V05).
-- Só atua quando a alteração passa a "assinado"; rascunhos são livres.
create or replace function public.fn_alteracao_validar_limites()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_original   numeric;
  v_acrescimo  numeric;
  v_supressao  numeric;
  v_limite     numeric := coalesce((public.fn_parametro('valores.limite_acrescimo_pct', new.orgao_id) #>> '{}')::numeric, 25);
  v_inicio     date;
  v_limite_m   int;
  v_meses      int;
begin
  if new.situacao not in ('assinado', 'publicado') then return new; end if;

  select c.valor_global_original, c.inicio_vigencia,
         coalesce(c.limite_vigencia_meses,
                  case c.regime_legal
                    when 'lei_8666'  then (public.fn_parametro('vigencia.limite_meses_8666',  c.orgao_id) #>> '{}')::int
                    when 'lei_14133' then (public.fn_parametro('vigencia.limite_meses_14133', c.orgao_id) #>> '{}')::int
                  end)
    into v_original, v_inicio, v_limite_m
    from public.contratos c where c.id = new.contrato_id;

  if new.tipo in ('aditivo_valor', 'supressao') and v_original > 0 then
    select coalesce(sum(delta_valor) filter (where tipo = 'aditivo_valor' and delta_valor > 0), 0),
           coalesce(-sum(delta_valor) filter (where tipo = 'supressao' and delta_valor < 0), 0)
      into v_acrescimo, v_supressao
      from public.alteracoes_contratuais
     where contrato_id = new.contrato_id and situacao in ('assinado', 'publicado') and id <> new.id;
    if new.tipo = 'aditivo_valor' and new.delta_valor > 0 then v_acrescimo := v_acrescimo + new.delta_valor; end if;
    if new.tipo = 'supressao' and new.delta_valor < 0 then v_supressao := v_supressao - new.delta_valor; end if;
    if v_acrescimo / v_original * 100 > v_limite or v_supressao / v_original * 100 > v_limite then
      raise exception 'RN-$03: acréscimos (% %%) ou supressões (% %%) acumulados acima do limite de % %%',
        round(v_acrescimo / v_original * 100, 2), round(v_supressao / v_original * 100, 2), v_limite
        using errcode = 'check_violation';
    end if;
  end if;

  if new.tipo in ('aditivo_prazo', 'aditivo_prazo_valor') and v_limite_m is not null and v_inicio is not null then
    v_meses := (extract(year from age(new.nova_data_fim + 1, v_inicio)) * 12
                + extract(month from age(new.nova_data_fim + 1, v_inicio)))::int;
    if v_meses > v_limite_m then
      raise exception 'RN-V05: a prorrogação leva a vigência a % meses; o limite do regime é % meses', v_meses, v_limite_m
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger trg_alteracoes_limites before insert or update on public.alteracoes_contratuais
  for each row execute function public.fn_alteracao_validar_limites();
