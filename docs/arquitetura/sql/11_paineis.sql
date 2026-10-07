-- =============================================================================
-- SIGC · 11 · Views de tela e de indicadores (seções 17 e 18 do diagnóstico)
-- Todas com security_invoker: cada usuário vê só o que a RLS libera.
-- =============================================================================

-- Fiscalização regular = gestor + fiscal + fiscal substituto + todas as portarias publicadas
create or replace view public.vw_contrato_fiscalizacao with (security_invoker = true) as
with d as (
  select d.contrato_id, d.papel, p.nome, pt.data_publicacao, pt.id as portaria_id
    from public.designacoes d
    join public.pessoas p on p.id = d.pessoa_id
    left join public.portarias pt on pt.id = d.portaria_id
   where (d.inicio is null or d.inicio <= public.fn_hoje()) and (d.fim is null or d.fim >= public.fn_hoje())
)
select c.id as contrato_id, c.orgao_id,
       (select string_agg(nome, ', ') from d where d.contrato_id = c.id and papel = 'gestor')            as gestor,
       (select string_agg(nome, ', ') from d where d.contrato_id = c.id and papel = 'gestor_substituto') as gestor_substituto,
       (select string_agg(nome, ', ' order by papel) from d where d.contrato_id = c.id
          and papel in ('fiscal_presidente', 'fiscal', 'fiscal_tecnico', 'fiscal_administrativo'))      as fiscais,
       (select string_agg(nome, ', ') from d where d.contrato_id = c.id and papel = 'fiscal_substituto') as fiscal_substituto,
       exists (select 1 from d where d.contrato_id = c.id and papel = 'gestor')
       and exists (select 1 from d where d.contrato_id = c.id and papel in ('fiscal_presidente', 'fiscal', 'fiscal_tecnico', 'fiscal_administrativo'))
       and exists (select 1 from d where d.contrato_id = c.id and papel = 'fiscal_substituto')
       and not exists (select 1 from d where d.contrato_id = c.id and d.data_publicacao is null)                as regular
  from public.contratos c
 where c.deleted_at is null;

-- Carteira: a linha da lista de contratos e da ficha (cabeçalho)
create or replace view public.vw_contratos_carteira with (security_invoker = true) as
select c.id as contrato_id, c.orgao_id, o.sigla as orgao,
       c.tipo_instrumento, c.numero, c.ano, c.numero_complemento,
       coalesce(c.numero || '/' || c.ano, 'Sem número') || coalesce(' ' || c.numero_complemento, '')     as numero_rotulo,
       c.fornecedor_id, coalesce(f.nome_fantasia, f.razao_social) as fornecedor, f.cnpj, f.provisorio as fornecedor_provisorio,
       c.objeto, c.categoria, c.regime_legal, c.natureza,
       v.situacao, public.fn_rotulo_situacao(v.situacao, v.faixa_vencimento) as situacao_rotulo, v.faixa_vencimento,
       v.inicio_vigencia, v.data_fim_efetiva, v.fonte_fim, v.dias_para_vencer, v.meses_acumulados, v.limite_vigencia_meses,
       vv.valor_global_original, vv.valor_global_atual, vv.valor_mensal_atual,
       fz.gestor, fz.fiscais, fz.fiscal_substituto, fz.regular as fiscalizacao_regular,
       s.score as saude, r.score as risco, r.nivel as risco_nivel, r.cobertura as risco_cobertura, r.prioridade_atencao,
       q.score as qualidade_dado,
       (select count(*) from public.alertas a where a.contrato_id = c.id and a.resolvido_em is null)::int as alertas_abertos,
       (select max(a.severidade) from public.alertas a where a.contrato_id = c.id and a.resolvido_em is null) as severidade_maxima,
       c.historico_incompleto
  from public.contratos c
  join public.orgaos o on o.id = c.orgao_id
  join public.vw_contrato_vigencia v on v.contrato_id = c.id
  left join public.fornecedores f on f.id = c.fornecedor_id
  left join public.vw_contrato_valores vv on vv.contrato_id = c.id
  left join public.vw_contrato_fiscalizacao fz on fz.contrato_id = c.id
  left join public.vw_contrato_saude s on s.contrato_id = c.id
  left join public.vw_contrato_risco r on r.contrato_id = c.id
  left join public.vw_contrato_qualidade q on q.contrato_id = c.id
 where c.deleted_at is null;

-- Faixa de cards do painel (6 cards)
create or replace view public.vw_painel_cards with (security_invoker = true) as
select k.orgao_id, k.orgao,
       count(*) filter (where k.situacao = 'vigente')                                       as vigentes,
       count(*) filter (where k.situacao = 'vencido')                                       as vencidos_sem_encerramento,
       count(*) filter (where k.situacao = 'vigente' and k.faixa_vencimento = 30)           as vencem_30_dias,
       coalesce(sum(k.valor_global_atual) filter (where k.situacao = 'vigente'), 0)        as valor_vigente,
       round(100.0 * count(*) filter (where k.situacao = 'vigente' and k.fiscalizacao_regular)
             / nullif(count(*) filter (where k.situacao = 'vigente'), 0))::int              as fiscalizacao_regular_pct,
       (select count(*) from public.tarefas t
         where t.orgao_id = k.orgao_id and t.status in ('aberta', 'em_andamento') and t.prioridade = 'critica')::int as pendencias_criticas,
       count(*) filter (where k.situacao = 'em_formalizacao')                               as em_formalizacao
  from public.vw_contratos_carteira k
 group by k.orgao_id, k.orgao;

-- Régua de vencimentos (30/60/90/120/180)
create or replace view public.vw_painel_regua with (security_invoker = true) as
select k.orgao_id, k.faixa_vencimento as faixa, count(*)::int as quantidade,
       coalesce(sum(k.valor_global_atual), 0) as valor
  from public.vw_contratos_carteira k
 where k.situacao = 'vigente' and k.faixa_vencimento is not null
 group by k.orgao_id, k.faixa_vencimento;

-- Top contratos que exigem atenção: risco × materialidade, com o motivo principal
create or replace view public.vw_painel_top_atencao with (security_invoker = true) as
select k.orgao_id, k.orgao, k.contrato_id, k.numero_rotulo, k.fornecedor, k.objeto, k.situacao_rotulo,
       k.data_fim_efetiva, k.dias_para_vencer, k.valor_global_atual, k.risco, k.risco_nivel, k.risco_cobertura,
       k.prioridade_atencao, k.gestor,
       (select a.titulo from public.alertas a where a.contrato_id = k.contrato_id and a.resolvido_em is null
         order by a.severidade desc, a.aberto_em limit 1) as motivo_principal,
       rank() over (partition by k.orgao_id order by k.prioridade_atencao desc nulls last, k.valor_global_atual desc nulls last) as posicao
  from public.vw_contratos_carteira k
 where k.prioridade_atencao is not null;

-- Carga por pessoa (designações em vigor)
create or replace view public.vw_carga_pessoas with (security_invoker = true) as
select p.id as pessoa_id, p.nome, p.matricula, p.situacao, d.orgao_id,
       count(*)::int as designacoes,
       count(distinct d.contrato_id)::int as contratos,
       count(*) filter (where d.papel in ('gestor', 'gestor_substituto'))::int as como_gestor,
       count(*) filter (where d.papel not in ('gestor', 'gestor_substituto'))::int as como_fiscal
  from public.designacoes d
  join public.pessoas p on p.id = d.pessoa_id
  join public.vw_contrato_vigencia v on v.contrato_id = d.contrato_id and v.situacao in ('vigente', 'vencido', 'nao_iniciado')
 where (d.inicio is null or d.inicio <= public.fn_hoje()) and (d.fim is null or d.fim >= public.fn_hoje())
 group by p.id, p.nome, p.matricula, p.situacao, d.orgao_id;

-- Publicações: prazo cumprido? (KPI "% publicações no prazo")
create or replace view public.vw_publicacoes_prazo with (security_invoker = true) as
select p.id as publicacao_id, p.orgao_id, p.contrato_id, p.alteracao_id, p.veiculo,
       coalesce(a.data_assinatura, c.data_assinatura) as assinatura, p.data_publicacao,
       case p.veiculo
         when 'pncp' then public.fn_dias_uteis_entre(coalesce(a.data_assinatura, c.data_assinatura), p.data_publicacao)
         else p.data_publicacao - coalesce(a.data_assinatura, c.data_assinatura) end as dias_apos_assinatura,
       case p.veiculo
         when 'pncp' then case c.forma_contratacao when 'licitacao' then 20 else 10 end
         else (public.fn_parametro('doerj.prazo_dias', p.orgao_id) #>> '{}')::int end as prazo,
       case p.veiculo
         when 'pncp' then public.fn_dias_uteis_entre(coalesce(a.data_assinatura, c.data_assinatura), p.data_publicacao)
                          <= case c.forma_contratacao when 'licitacao' then 20 else 10 end
         else p.data_publicacao - coalesce(a.data_assinatura, c.data_assinatura)
                          <= (public.fn_parametro('doerj.prazo_dias', p.orgao_id) #>> '{}')::int end as no_prazo
  from public.publicacoes p
  join public.contratos c on c.id = p.contrato_id and c.deleted_at is null
  left join public.alteracoes_contratuais a on a.id = p.alteracao_id;

-- Qualidade dos dados por órgão + principais problemas
create or replace view public.vw_qualidade_orgao with (security_invoker = true) as
select q.orgao_id, round(avg(q.score))::int as score, round(avg(q.completude))::int as completude,
       sum(q.inconsistencias)::int as inconsistencias,
       (select jsonb_agg(jsonb_build_object('regra', x.regra_codigo, 'nome', x.nome, 'quantidade', x.qtd) order by x.qtd desc)
          from (select a.regra_codigo, r.nome, count(*) as qtd
                  from public.alertas a join public.regras_alerta r on r.codigo = a.regra_codigo
                 where a.orgao_id = q.orgao_id and a.resolvido_em is null and r.dimensao = 'qualidade_dado'
                 group by a.regra_codigo, r.nome order by qtd desc limit 5) x) as principais_problemas
  from public.vw_contrato_qualidade q
 group by q.orgao_id;

-- Prováveis variações de grafia do mesmo servidor (13 casos na planilha). Fusão é manual.
create or replace view public.vw_pessoas_possiveis_duplicadas with (security_invoker = true) as
select a.id as pessoa_a, a.nome as nome_a, b.id as pessoa_b, b.nome as nome_b,
       round(extensions.similarity(a.nome_normalizado, b.nome_normalizado)::numeric, 2) as similaridade
  from public.pessoas a
  join public.pessoas b on a.id < b.id
 where a.deleted_at is null and b.deleted_at is null
   and extensions.similarity(a.nome_normalizado, b.nome_normalizado) >= 0.6
   and (a.matricula is null or b.matricula is null or a.matricula = b.matricula);

-- Minhas pendências (responsável direto) e fila da equipe (perfil do órgão)
create or replace view public.vw_minhas_tarefas with (security_invoker = true) as
select t.*, o.sigla as orgao, k.numero_rotulo, k.fornecedor,
       case when p.usuario_id = (select auth.uid()) then 'minha' else 'equipe' end as visao,
       t.prazo < public.fn_hoje() and t.status in ('aberta', 'em_andamento') as atrasada
  from public.tarefas t
  join public.orgaos o on o.id = t.orgao_id
  left join public.pessoas p on p.id = t.responsavel_pessoa_id
  left join public.vw_contratos_carteira k on k.contrato_id = t.contrato_id
 where t.status in ('aberta', 'em_andamento')
   and (p.usuario_id = (select auth.uid())
        or (t.responsavel_perfil is not null and public.fn_tem_perfil(t.orgao_id, array[t.responsavel_perfil])));

-- Progresso das campanhas
create or replace view public.vw_campanhas_progresso with (security_invoker = true) as
select cp.id as campanha_id, cp.orgao_id, cp.nome, cp.objetivo, cp.inicio, cp.fim_previsto, cp.ativa,
       count(t.id)::int as total,
       count(t.id) filter (where t.status = 'concluida')::int as concluidas,
       count(t.id) filter (where t.status = 'cancelada')::int as canceladas,
       count(t.id) filter (where t.status in ('aberta', 'em_andamento'))::int as pendentes,
       round(100.0 * count(t.id) filter (where t.status in ('concluida', 'cancelada')) / nullif(count(t.id), 0))::int as progresso_pct
  from public.campanhas cp
  left join public.tarefas t on t.campanha_id = cp.id
 group by cp.id;

grant select on all tables in schema public to authenticated;
