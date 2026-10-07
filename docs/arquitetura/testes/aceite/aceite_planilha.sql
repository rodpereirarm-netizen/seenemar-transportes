-- Teste de aceite do MVP (seção 27): importa a planilha real e confere com o diagnóstico.
-- Pré-requisito: schema aplicado (testes/rodar.sh) e :'arquivo' apontando para o JSON de planilha_para_json.py.
-- Imprime SOMENTE totais (nenhum nome de pessoa).
\set ON_ERROR_STOP 1
begin;
set local sigc.data_referencia = '2026-10-07';
select teste.usuario('DEMO Carga', 'admin', null) as u_carga \gset
select teste.usuario('DEMO Aprovacao', 'admin', null) as u_aprov \gset

create temp table _json (doc jsonb);
\set conteudo `cat :arquivo`
insert into _json values (:'conteudo'::jsonb);

select set_config('request.jwt.claim.sub', :'u_carga', true);
insert into public.importacoes (arquivo_nome, arquivo_sha256, aba, data_referencia, carregada_por)
values ('PLANILHA GERAL DE CONTRATOS.xlsx', md5(:'conteudo') || md5(:'conteudo'), 'CONTRATOS SEDEICS e SEENEMAR', '2026-09-25', :'u_carga')
returning id as imp \gset
insert into public.importacao_linhas (importacao_id, linha_origem, valores_originais)
select :'imp', (x ->> 'linha')::int, x -> 'valores' from _json, jsonb_array_elements(doc) x;

\echo '== Validação'
select * from public.fn_importacao_validar(:'imp');
\echo '== Erros e avisos por código'
select e ->> 'codigo' as codigo, e ->> 'severidade' as severidade, count(*) as linhas
  from public.importacao_linhas il, jsonb_array_elements(il.erros) e
 where il.importacao_id = :'imp' group by 1, 2 order by 2, 3 desc;

\echo '== Revisão simulada: linhas com erro bloqueante (a correção real é decisão da área)'
select linha_origem, valores_normalizados ->> 'numero' as numero, valores_normalizados ->> 'ano' as ano,
       (select string_agg(e ->> 'codigo', ', ') from jsonb_array_elements(erros) e where e ->> 'severidade' = 'erro') as erros
  from public.importacao_linhas where importacao_id = :'imp'
   and exists (select 1 from jsonb_array_elements(erros) e where e ->> 'severidade' = 'erro') order by 1;
-- L38 (LIGHT) traz o número "016/2026 (BRASVIP)", copiado da linha do contrato da BRASVIP (L46).
-- O revisor tira o número da L38 até a área informar o correto. O original fica preservado.
update public.importacao_linhas
   set ajustes = '{"numero": null, "ano": null, "numero_complemento": null}'
 where importacao_id = :'imp' and linha_origem = 38;
select * from public.fn_importacao_validar(:'imp');

select set_config('request.jwt.claim.sub', :'u_aprov', true);
\echo '== Aprovação'
select * from public.fn_importacao_aprovar(:'imp');
select set_config('request.jwt.claim.sub', '', true);

\echo '== Linhas por órgão (diagnóstico: SEDES 17 + Descentralização 1, SEENEMAR 22)'
select coalesce(o.sigla, '(sem órgão)') as orgao, il.situacao, count(*)
  from public.importacao_linhas il left join public.orgaos o on o.id = il.orgao_id
 where il.importacao_id = :'imp' group by 1, 2 order by 1, 2;

\echo '== Situação na referência 07/10/2026 (diagnóstico: 34 com início, 11 vencidos)'
select situacao, count(*), to_char(sum(vv.valor_global_original), 'FM999G999G999D00') as valor
  from public.vw_contrato_vigencia v join public.vw_contrato_valores vv using (contrato_id)
 group by 1 order by 1;
select count(*) filter (where inicio_vigencia is not null) as instrumentos_com_inicio,
       to_char(sum(valor_global_original), 'FM999G999G999D00') as valor_total
  from public.contratos;
select o.sigla, to_char(sum(c.valor_global_original), 'FM999G999G999D00') as valor
  from public.contratos c join public.orgaos o on o.id = c.orgao_id group by 1 order by 1;

\echo '== Motor de alertas'
select * from public.fn_motor_alertas();
select regra_codigo, severidade, count(*) from public.alertas where resolvido_em is null group by 1, 2 order by 2 desc, 1;

\echo '== Painel'
select orgao, vigentes, vencidos_sem_encerramento, vencem_30_dias, to_char(valor_vigente, 'FM999G999G999D00') as valor_vigente,
       fiscalizacao_regular_pct, pendencias_criticas, em_formalizacao
  from public.vw_painel_cards order by orgao;
select o.sigla, r.faixa, r.quantidade from public.vw_painel_regua r join public.orgaos o on o.id = r.orgao_id order by 1, 2;
\echo '== Pessoas: nomes distintos após normalização e pares com grafia parecida (revisão manual)'
select (select count(*) from public.pessoas) as pessoas,
       (select count(*) from public.vw_pessoas_possiveis_duplicadas) as pares_parecidos,
       (select count(*) from public.designacoes) as designacoes;
\echo '== Qualidade dos dados por órgão'
select o.sigla, q.score, q.completude, q.inconsistencias from public.vw_qualidade_orgao q join public.orgaos o on o.id = q.orgao_id;
rollback;
