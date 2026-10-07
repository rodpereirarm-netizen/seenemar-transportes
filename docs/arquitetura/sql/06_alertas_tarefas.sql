-- =============================================================================
-- SIGC · 06 · Motor de alertas, pendências (tarefas), campanhas e notificações
--
-- Desenho
--   1. vw_alertas_condicoes: UMA linha por condição verdadeira hoje
--      (regra × contrato × chave). Cada regra é um bloco do UNION ALL.
--   2. fn_motor_alertas(): compara a view com os alertas abertos e
--      abre / atualiza severidade / fecha sozinho (idempotente).
--   3. Alerta aberto com regra.gera_tarefa → uma tarefa; alerta fechado → tarefa concluída.
--   4. Alerta novo ou que subiu de severidade → notificação (app + e-mail).
-- =============================================================================

create table public.regras_alerta (
  codigo        text primary key,
  nome          text not null,
  descricao     text not null,
  dimensao      text not null check (dimensao in
                  ('vigencia', 'fiscalizacao', 'formalizacao', 'publicacoes', 'documentacao_garantia',
                   'qualidade_dado', 'financeiro', 'fornecedor', 'ocorrencias')),
  severidade    public.severidade not null,
  parametros    jsonb not null default '{}',
  ativo         boolean not null default true,
  gera_tarefa   boolean not null default true,
  responsavel   text not null default 'gestao_contratos'
                check (responsavel in ('gestor', 'gestao_contratos', 'importador')),
  base_legal    text,
  a_validar     text,                        -- marcação [REGRA A CONFIRMAR] / [DADO AUSENTE]…
  updated_at    timestamptz not null default now(),
  updated_by    uuid
);
create trigger trg_regras_updated before update on public.regras_alerta
  for each row execute function public.fn_touch_updated_at();

-- Ajuste por órgão (liga/desliga e sobrepõe parâmetros)
create table public.regras_alerta_orgao (
  codigo      text not null references public.regras_alerta(codigo),
  orgao_id    uuid not null references public.orgaos(id),
  ativo       boolean,
  parametros  jsonb not null default '{}',
  primary key (codigo, orgao_id)
);

-- Regra efetiva por órgão (parâmetros do órgão sobrepõem os globais)
create or replace view public.vw_regras_efetivas with (security_invoker = true) as
select r.codigo, o.id as orgao_id, r.dimensao,
       r.severidade, coalesce(ro.ativo, r.ativo) as ativo,
       r.parametros || coalesce(ro.parametros, '{}') as p,
       r.gera_tarefa, r.responsavel
  from public.regras_alerta r
 cross join public.orgaos o
  left join public.regras_alerta_orgao ro on ro.codigo = r.codigo and ro.orgao_id = o.id;

-- -----------------------------------------------------------------------------
-- Campanhas (ações em lote; ex.: coluna Y "Apostilamento p/ SEDEICSCTI")
-- -----------------------------------------------------------------------------
create table public.campanhas (
  id          uuid primary key default gen_random_uuid(),
  orgao_id    uuid not null references public.orgaos(id),
  nome        text not null,
  objetivo    text not null,
  inicio      date not null default public.fn_hoje(),
  fim_previsto date,
  ativa       boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid()
);
alter table public.alteracoes_contratuais
  add constraint alteracoes_campanha_fk foreign key (campanha_id) references public.campanhas(id);

-- -----------------------------------------------------------------------------
-- Alertas
-- -----------------------------------------------------------------------------
create table public.alertas (
  id             bigint generated always as identity primary key,
  regra_codigo   text not null references public.regras_alerta(codigo),
  orgao_id       uuid not null references public.orgaos(id),
  contrato_id    uuid references public.contratos(id),
  chave          text not null default '',   -- distingue alertas da mesma regra no mesmo contrato (ex.: id da designação)
  severidade     public.severidade not null,
  titulo         text not null,
  detalhe        jsonb not null default '{}',
  aberto_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  resolvido_em   timestamptz,
  resolucao      text check (resolucao in ('condicao_cessou', 'regra_desativada')),
  ciente_por     uuid references public.usuarios(id),
  ciente_em      timestamptz
);
-- Um alerta aberto por regra × contrato × chave
create unique index alertas_abertos_uk on public.alertas (regra_codigo, coalesce(contrato_id, '00000000-0000-0000-0000-000000000000'::uuid), chave)
  where resolvido_em is null;
create index alertas_contrato on public.alertas (contrato_id) where resolvido_em is null;
create index alertas_orgao on public.alertas (orgao_id, severidade) where resolvido_em is null;

-- -----------------------------------------------------------------------------
-- Tarefas (pendências)
-- -----------------------------------------------------------------------------
create table public.tarefas (
  id                     uuid primary key default gen_random_uuid(),
  orgao_id               uuid not null references public.orgaos(id),
  contrato_id            uuid references public.contratos(id),
  alerta_id              bigint unique references public.alertas(id),
  campanha_id            uuid references public.campanhas(id),
  titulo                 text not null,
  descricao              text,
  responsavel_pessoa_id  uuid references public.pessoas(id),
  responsavel_perfil     public.perfil_usuario,        -- fila da equipe quando não há pessoa definida
  prazo                  date,
  prioridade             public.prioridade not null default 'media',
  status                 public.status_tarefa not null default 'aberta',
  origem                 public.origem_tarefa not null,
  resultado              text,
  concluida_em           timestamptz,
  concluida_por          uuid,
  created_at             timestamptz not null default now(),
  created_by             uuid default auth.uid(),
  updated_at             timestamptz not null default now(),
  updated_by             uuid,
  check (status not in ('concluida', 'cancelada') or concluida_em is not null),
  check (origem <> 'regra' or alerta_id is not null),
  check (origem <> 'campanha' or campanha_id is not null)
);
create index tarefas_responsavel on public.tarefas (responsavel_pessoa_id) where status in ('aberta', 'em_andamento');
create index tarefas_orgao on public.tarefas (orgao_id, status);
create trigger trg_tarefas_updated before update on public.tarefas
  for each row execute function public.fn_touch_updated_at();

-- -----------------------------------------------------------------------------
-- Notificações (sininho e e-mail; o envio fica na Edge Function)
-- -----------------------------------------------------------------------------
create table public.notificacoes (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null references public.usuarios(id),
  alerta_id   bigint references public.alertas(id),
  tarefa_id   uuid references public.tarefas(id),
  canal       text not null check (canal in ('app', 'email')),
  titulo      text not null,
  criada_em   timestamptz not null default now(),
  enviada_em  timestamptz,
  lida_em     timestamptz
);
create index notificacoes_usuario on public.notificacoes (usuario_id) where lida_em is null;
create index notificacoes_email_pendente on public.notificacoes (criada_em) where canal = 'email' and enviada_em is null;

-- =============================================================================
-- Condições: cada bloco implementa uma regra do catálogo (REGRAS_DE_NEGOCIO.md)
-- Colunas: regra_codigo, orgao_id, contrato_id, chave, severidade, titulo, detalhe
-- =============================================================================

create or replace view public.vw_alertas_condicoes with (security_invoker = true) as
with
r as (select * from public.vw_regras_efetivas where ativo),
c as (
  select k.id, k.orgao_id, k.numero, k.ano, k.numero_complemento, k.regime_legal, k.forma_contratacao, k.natureza,
         k.prorrogavel, k.data_assinatura, k.inicio_vigencia, k.garantia_exigida, k.fornecedor_id,
         k.historico_incompleto, k.doc_base_origem,
         coalesce(k.numero || '/' || k.ano, 'sem número') || coalesce(' ' || k.numero_complemento, '') ||
           coalesce(' (' || f.nome_fantasia || ')', ' (' || f.razao_social || ')', '') as rotulo,
         v.situacao, v.data_fim_efetiva, v.dias_para_vencer, v.meses_acumulados, v.limite_vigencia_meses,
         v.divergencia_termino_dias, v.data_fim_calculada, v.data_fim_original, f.cnpj,
         public.fn_hoje() as hoje
    from public.contratos k
    join public.vw_contrato_vigencia v on v.contrato_id = k.id
    left join public.fornecedores f on f.id = k.fornecedor_id
   where k.deleted_at is null
),
desig as (   -- designações em vigor hoje
  select d.*, p.nome as pessoa_nome, p.situacao as pessoa_situacao
    from public.designacoes d
    join public.pessoas p on p.id = d.pessoa_id
   where (d.inicio is null or d.inicio <= public.fn_hoje())
     and (d.fim is null or d.fim >= public.fn_hoje())
),
renovacao as (  -- existe processo de prorrogação/nova contratação ou aditivo de prazo em tramitação
  select cp.contrato_id from public.contrato_processos cp where cp.papel in ('prorrogacao', 'nova_contratacao')
  union
  select a.contrato_id from public.alteracoes_contratuais a
   where a.tipo in ('aditivo_prazo', 'aditivo_prazo_valor')
     and a.situacao in ('em_elaboracao', 'analise_juridica', 'aguardando_assinatura')
),
-- Atos sujeitos a publicação: o contrato e cada alteração assinada (apostilamento não vai ao PNCP)
atos as (
  select c.id as contrato_id, c.orgao_id, null::uuid as alteracao_id, c.data_assinatura,
         'Contrato ' || c.rotulo as ato, c.regime_legal, c.forma_contratacao, true as vai_pncp, c.situacao
    from c where c.data_assinatura is not null
  union all
  select c.id, c.orgao_id, a.id, a.data_assinatura,
         coalesce(a.numero_ordem || 'º ', '') || replace(a.tipo::text, '_', ' ') || ' · ' || c.rotulo,
         c.regime_legal, c.forma_contratacao, a.tipo <> 'apostilamento', c.situacao
    from c join public.alteracoes_contratuais a on a.contrato_id = c.id
   where a.situacao in ('assinado', 'publicado') and a.data_assinatura is not null
)

-- VIG-030 … VIG-180: faixa mais próxima entre as regras ativas -------------------------------
select x.codigo as regra_codigo, x.orgao_id, x.id as contrato_id, ''::text as chave, x.severidade,
       'Vence em ' || x.dias_para_vencer || ' dias (' || to_char(x.data_fim_efetiva, 'DD/MM/YYYY') || ') · ' || x.rotulo as titulo,
       jsonb_build_object('data_fim', x.data_fim_efetiva, 'dias', x.dias_para_vencer, 'tem_processo_renovacao', x.tem_renov) as detalhe
  from (
    select distinct on (c.id) r.codigo, c.orgao_id, c.id, r.severidade, c.dias_para_vencer, c.data_fim_efetiva, c.rotulo,
           exists (select 1 from renovacao rv where rv.contrato_id = c.id) as tem_renov,
           coalesce((r.p ->> 'ignorar_com_renovacao')::boolean, false) as ignorar
      from c join r on r.orgao_id = c.orgao_id and r.codigo ~ '^VIG-\d{3}$'
     where c.situacao = 'vigente' and c.dias_para_vencer <= (r.p ->> 'dias')::int
     order by c.id, (r.p ->> 'dias')::int
  ) x
 where not (x.ignorar and x.tem_renov)

-- VIG-VENC: vencido sem ato de encerramento ------------------------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade,
       'Vencido há ' || -c.dias_para_vencer || ' dias sem ato de encerramento · ' || c.rotulo,
       jsonb_build_object('data_fim', c.data_fim_efetiva, 'dias_vencido', -c.dias_para_vencer)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'VIG-VENC'
 where c.situacao = 'vencido'

-- VIG-LIM: próxima prorrogação ultrapassa o limite do regime --------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade,
       'Próxima prorrogação ultrapassa o limite de ' || c.limite_vigencia_meses || ' meses · ' || c.rotulo,
       jsonb_build_object('meses_acumulados', c.meses_acumulados, 'limite', c.limite_vigencia_meses,
                          'prorrogacao_tipica_meses', (r.p ->> 'prorrogacao_tipica_meses')::int)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'VIG-LIM'
 where c.situacao = 'vigente' and c.natureza = 'continuo' and coalesce(c.prorrogavel, true)
   and c.limite_vigencia_meses is not null and not c.historico_incompleto
   and c.dias_para_vencer <= (r.p ->> 'antecedencia_dias')::int
   and c.meses_acumulados + (r.p ->> 'prorrogacao_tipica_meses')::int > c.limite_vigencia_meses

-- FIS-SEM: vigente sem gestor ou sem fiscal ------------------------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade,
       'Sem ' || concat_ws(' e sem ',
                  case when not exists (select 1 from desig d where d.contrato_id = c.id and d.papel = 'gestor') then 'gestor' end,
                  case when not exists (select 1 from desig d where d.contrato_id = c.id
                                         and d.papel in ('fiscal_presidente', 'fiscal', 'fiscal_tecnico', 'fiscal_administrativo'))
                       then 'fiscal' end) || ' designado · ' || c.rotulo,
       '{}'::jsonb
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'FIS-SEM'
 where c.situacao in ('vigente', 'vencido')
   and (not exists (select 1 from desig d where d.contrato_id = c.id and d.papel = 'gestor')
        or not exists (select 1 from desig d where d.contrato_id = c.id
                        and d.papel in ('fiscal_presidente', 'fiscal', 'fiscal_tecnico', 'fiscal_administrativo')))

-- FIS-SUB: sem fiscal substituto ----------------------------------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade, 'Sem fiscal substituto · ' || c.rotulo, '{}'::jsonb
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'FIS-SUB'
 where c.situacao = 'vigente'
   and not exists (select 1 from desig d where d.contrato_id = c.id and d.papel = 'fiscal_substituto')

-- FIS-PORT: designação sem portaria publicada há mais de N dias ------------------------------
union all
select r.codigo, c.orgao_id, c.id, d.id::text, r.severidade,
       'Designação de ' || d.pessoa_nome || ' (' || replace(d.papel::text, '_', ' ') || ') sem portaria publicada · ' || c.rotulo,
       jsonb_build_object('designacao_id', d.id, 'portaria_id', d.portaria_id)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'FIS-PORT'
  join desig d on d.contrato_id = c.id
  left join public.portarias pt on pt.id = d.portaria_id
 where c.situacao = 'vigente'
   and pt.data_publicacao is null
   and c.hoje - coalesce(d.inicio, c.inicio_vigencia) > (r.p ->> 'dias')::int

-- FIS-AUS: pessoa designada desligada, afastada ou com afastamento em curso ------------------
union all
select r.codigo, c.orgao_id, c.id, d.id::text, r.severidade,
       d.pessoa_nome || ' (' || replace(d.papel::text, '_', ' ') || ') está ' ||
         case when d.pessoa_situacao = 'desligado' then 'desligado(a)' else 'afastado(a)' end || ' · ' || c.rotulo,
       jsonb_build_object('designacao_id', d.id, 'pessoa_id', d.pessoa_id)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'FIS-AUS'
  join desig d on d.contrato_id = c.id
 where c.situacao = 'vigente'
   and (d.pessoa_situacao <> 'ativo'
        or exists (select 1 from public.pessoa_afastamentos af where af.pessoa_id = d.pessoa_id
                    and af.inicio <= c.hoje and (af.fim is null or af.fim >= c.hoje)))

-- FIS-SEG: mesma pessoa em mais de um papel no mesmo contrato (RN-F04) -----------------------
union all
select r.codigo, c.orgao_id, c.id, x.pessoa_id::text, r.severidade,
       x.pessoa_nome || ' acumula ' || x.papeis || ' · ' || c.rotulo,
       jsonb_build_object('pessoa_id', x.pessoa_id)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'FIS-SEG'
  join (select d.contrato_id, d.pessoa_id, d.pessoa_nome,
               string_agg(replace(d.papel::text, '_', ' '), ' e ' order by d.papel) as papeis
          from desig d group by d.contrato_id, d.pessoa_id, d.pessoa_nome having count(*) > 1) x
    on x.contrato_id = c.id
 where c.situacao in ('vigente', 'nao_iniciado')

-- PUB-PNCP: ato sem PNCP depois do prazo em dias úteis (art. 94 da Lei 14.133) ---------------
union all
select r.codigo, a.orgao_id, a.contrato_id, coalesce(a.alteracao_id::text, ''), r.severidade,
       'Sem publicação no PNCP · ' || a.ato,
       jsonb_build_object('alteracao_id', a.alteracao_id, 'assinatura', a.data_assinatura,
                          'prazo_dias_uteis', x.prazo, 'prazo_presumido', a.forma_contratacao = 'a_confirmar',
                          'regime_presumido', a.regime_legal = 'a_confirmar')
  from atos a
  join r on r.orgao_id = a.orgao_id and r.codigo = 'PUB-PNCP'
 cross join lateral (select case a.forma_contratacao
                              when 'licitacao' then (r.p ->> 'prazo_licitacao_dias_uteis')::int
                              when 'contratacao_direta' then (r.p ->> 'prazo_direta_dias_uteis')::int
                              else (r.p ->> 'prazo_presumido_dias_uteis')::int
                            end as prazo) x
 where a.vai_pncp
   and a.situacao not in ('em_formalizacao', 'encerrado', 'rescindido')
   and (a.regime_legal = 'lei_14133'
        or (a.regime_legal = 'a_confirmar'
            and a.data_assinatura >= (public.fn_parametro('pncp.regime_presumido_desde', a.orgao_id) #>> '{}')::date))
   and not exists (select 1 from public.publicacoes p where p.contrato_id = a.contrato_id
                    and p.alteracao_id is not distinct from a.alteracao_id and p.veiculo = 'pncp')
   and public.fn_dias_uteis_entre(a.data_assinatura, public.fn_hoje()) > x.prazo

-- PUB-DOERJ: ato sem DOERJ depois de N dias corridos [VALIDAR REGULAMENTAÇÃO ESTADUAL/RJ] -------
union all
select r.codigo, a.orgao_id, a.contrato_id, coalesce(a.alteracao_id::text, ''), r.severidade,
       'Sem publicação no DOERJ · ' || a.ato,
       jsonb_build_object('alteracao_id', a.alteracao_id, 'assinatura', a.data_assinatura, 'prazo_dias', (r.p ->> 'dias')::int)
  from atos a
  join r on r.orgao_id = a.orgao_id and r.codigo = 'PUB-DOERJ'
 where a.situacao not in ('em_formalizacao', 'encerrado', 'rescindido')
   and not exists (select 1 from public.publicacoes p where p.contrato_id = a.contrato_id
                    and p.alteracao_id is not distinct from a.alteracao_id and p.veiculo = 'doerj')
   and public.fn_hoje() - a.data_assinatura > (r.p ->> 'dias')::int

-- GAR-PEND: garantia exigida e não apresentada --------------------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade, 'Garantia exigida e não apresentada · ' || c.rotulo, '{}'::jsonb
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'GAR-PEND'
 where c.situacao = 'vigente' and c.garantia_exigida
   and c.hoje - c.inicio_vigencia > (r.p ->> 'dias_apos_inicio')::int
   and not exists (select 1 from public.garantias g where g.contrato_id = c.id and g.situacao in ('apresentada', 'liberada'))

-- GAR-VENC: garantia apresentada vence antes do fim da vigência (+ margem) ou em ≤ N dias -------
union all
select r.codigo, c.orgao_id, c.id, g.id::text, r.severidade,
       'Garantia vence em ' || to_char(g.validade, 'DD/MM/YYYY') || ' · ' || c.rotulo,
       jsonb_build_object('garantia_id', g.id, 'validade', g.validade, 'fim_vigencia', c.data_fim_efetiva)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'GAR-VENC'
  join public.garantias g on g.contrato_id = c.id and g.situacao = 'apresentada' and g.validade is not null
 where c.situacao = 'vigente'
   and (g.validade - c.hoje <= (r.p ->> 'dias')::int
        or g.validade < c.data_fim_efetiva + (r.p ->> 'margem_apos_vigencia_dias')::int)

-- ALT-PEND: alteração parada na mesma etapa há mais de N dias -------------------------------
union all
select r.codigo, c.orgao_id, c.id, a.id::text, r.severidade,
       replace(a.tipo::text, '_', ' ') || ' em "' || replace(a.situacao::text, '_', ' ') || '" há ' ||
         (c.hoje - a.situacao_desde) || ' dias · ' || c.rotulo,
       jsonb_build_object('alteracao_id', a.id, 'desde', a.situacao_desde, 'campanha_id', a.campanha_id)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'ALT-PEND'
  join public.alteracoes_contratuais a on a.contrato_id = c.id
 where a.situacao in ('em_elaboracao', 'analise_juridica', 'aguardando_assinatura')
   and c.hoje - a.situacao_desde > (r.p ->> 'dias')::int

-- DQ-TERM: término informado diverge de início + prazo -------------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade,
       'Término informado difere de início + prazo em ' || c.divergencia_termino_dias || ' dia(s) · ' || c.rotulo,
       jsonb_build_object('informado', c.data_fim_original, 'calculado', c.data_fim_calculada, 'dias', c.divergencia_termino_dias)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'DQ-TERM'
 where abs(c.divergencia_termino_dias) > (r.p ->> 'tolerancia_dias')::int

-- DQ-VALOR: Σ itens ≠ mensal, ou mensal × prazo ≠ global -----------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade,
       'Valores inconsistentes (' || concat_ws('; ',
          case when vv.divergencia_itens_pct  > (r.p ->> 'tolerancia_pct')::numeric then 'itens × mensal ' || vv.divergencia_itens_pct || '%' end,
          case when vv.divergencia_global_pct > (r.p ->> 'tolerancia_pct')::numeric then 'mensal × prazo × global ' || vv.divergencia_global_pct || '%' end)
         || ') · ' || c.rotulo,
       jsonb_build_object('divergencia_itens_pct', vv.divergencia_itens_pct, 'divergencia_global_pct', vv.divergencia_global_pct)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'DQ-VALOR'
  join public.vw_contrato_valores vv on vv.contrato_id = c.id
 where vv.divergencia_itens_pct > (r.p ->> 'tolerancia_pct')::numeric
    or vv.divergencia_global_pct > (r.p ->> 'tolerancia_pct')::numeric

-- DQ-CNPJ: fornecedor provisório (sem CNPJ) ------------------------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade, 'Fornecedor sem CNPJ · ' || c.rotulo, '{}'::jsonb
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'DQ-CNPJ'
 where c.fornecedor_id is not null and c.cnpj is null and c.situacao not in ('encerrado', 'rescindido')

-- DQ-REGIME: regime legal não informado ---------------------------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade, 'Regime legal (8.666 × 14.133) não informado · ' || c.rotulo, '{}'::jsonb
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'DQ-REGIME'
 where c.regime_legal = 'a_confirmar' and c.situacao in ('vigente', 'vencido', 'nao_iniciado')

-- DQ-VIG: contrato iniciado sem como saber o fim -------------------------------------------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade, 'Sem término nem prazo: vigência indefinida · ' || c.rotulo, '{}'::jsonb
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'DQ-VIG'
 where c.situacao = 'vigencia_indefinida'

-- DQ-HIST: período vigente veio de aditivo; contrato original e alterações a cadastrar -------
union all
select r.codigo, c.orgao_id, c.id, '', r.severidade,
       'Histórico incompleto (documento base: ' || coalesce(c.doc_base_origem, '?') ||
         '): cadastrar o contrato original e as alterações; limite de prorrogação não verificável · ' || c.rotulo,
       jsonb_build_object('doc_base', c.doc_base_origem)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'DQ-HIST'
 where c.historico_incompleto and c.situacao not in ('encerrado', 'rescindido')

-- DQ-IMPORT: inconsistência da importação ainda não tratada (exceto as cobertas por outra regra)
union all
select r.codigo, c.orgao_id, c.id, il.id::text, r.severidade,
       x.qtd || ' inconsistência(s) da importação (linha ' || il.linha_origem || ') · ' || c.rotulo,
       jsonb_build_object('importacao_linha_id', il.id, 'erros', x.erros)
  from c join r on r.orgao_id = c.orgao_id and r.codigo = 'DQ-IMPORT'
  join public.importacao_linhas il on il.contrato_id = c.id
 cross join lateral (
   select count(*)::int as qtd, jsonb_agg(e) as erros
     from jsonb_array_elements(il.erros) e
    where not (e ->> 'codigo' = any (select jsonb_array_elements_text(r.p -> 'ignorar_codigos')))) x
 where il.situacao = 'aprovada' and il.erros_tratados_em is null and x.qtd > 0;

comment on view public.vw_alertas_condicoes is
  'Uma linha por condição de alerta verdadeira hoje. Colunas posicionais: regra_codigo, orgao_id, contrato_id, chave, severidade, titulo, detalhe.';
