-- =============================================================================
-- Apoio aos testes. Todos os dados criados aqui são DEMO (nome começa com "DEMO").
-- =============================================================================
create schema if not exists teste;
grant usage on schema teste to authenticated, anon;

create or replace function teste.ok(p_cond boolean, p_nome text)
returns void language plpgsql as $$
begin
  if p_cond is distinct from true then
    raise exception 'FALHOU: %', p_nome;
  end if;
  raise notice 'ok - %', p_nome;
end $$;

-- Executa p_sql e exige erro cuja mensagem contenha p_trecho
create or replace function teste.erro(p_sql text, p_trecho text, p_nome text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(lower(p_trecho) in lower(sqlerrm)) > 0 then
      raise notice 'ok - % (erro esperado: %)', p_nome, sqlerrm;
      return;
    end if;
    raise exception 'FALHOU: % (erro diferente: %)', p_nome, sqlerrm;
  end;
  raise exception 'FALHOU: % (esperava erro com "%")', p_nome, p_trecho;
end $$;

-- CNPJ válido a partir de um número (dígitos verificadores calculados)
create or replace function teste.cnpj(p_n int)
returns text language plpgsql immutable as $$
declare b text := lpad(p_n::text, 8, '0') || '0001'; s int; r int; i int;
  p1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2]; p2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
begin
  s := 0; for i in 1..12 loop s := s + substr(b, i, 1)::int * p1[i]; end loop;
  r := s % 11; b := b || case when r < 2 then 0 else 11 - r end;
  s := 0; for i in 1..13 loop s := s + substr(b, i, 1)::int * p2[i]; end loop;
  r := s % 11; return b || case when r < 2 then 0 else 11 - r end;
end $$;

create or replace function teste.orgao(p_sigla text)
returns uuid language sql stable as $$ select id from public.orgaos where sigla = p_sigla $$;

create or replace function teste.usuario(p_nome text, p_perfil public.perfil_usuario, p_orgao text)
returns uuid language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (v, lower(replace(p_nome, ' ', '.')) || '@demo.invalid');
  insert into public.usuarios (id, nome, email) values (v, p_nome, lower(replace(p_nome, ' ', '.')) || '@demo.invalid');
  insert into public.usuario_perfis (usuario_id, orgao_id, perfil) values (v, case when p_orgao is null then null else teste.orgao(p_orgao) end, p_perfil);
  return v;
end $$;

create or replace function teste.pessoa(p_nome text, p_usuario uuid default null)
returns uuid language sql as $$
  insert into public.pessoas (nome, usuario_id) values (p_nome, p_usuario) returning id;
$$;

create or replace function teste.contrato(
  p_orgao text, p_numero text, p_inicio date, p_prazo int,
  p_fim date default null, p_valor numeric default 120000, p_mensal numeric default null,
  p_assinatura date default null, p_regime public.regime_legal default 'lei_14133',
  p_forma public.forma_contratacao default 'licitacao', p_com_cnpj boolean default true)
returns uuid language plpgsql as $$
declare v_f uuid; v_c uuid;
begin
  insert into public.fornecedores (cnpj, razao_social)
  values (case when p_com_cnpj then teste.cnpj(abs(hashtext(p_orgao || p_numero)) % 99999999) end,
          'DEMO FORNECEDOR ' || p_numero)
  returning id into v_f;
  insert into public.contratos (orgao_id, numero, ano, fornecedor_id, objeto, data_assinatura, inicio_vigencia,
                                prazo_meses_original, data_fim_original, valor_global_original, valor_mensal_original,
                                regime_legal, forma_contratacao, natureza, garantia_exigida)
  values (teste.orgao(p_orgao), split_part(p_numero, '/', 1), split_part(p_numero, '/', 2)::int, v_f,
          'DEMO objeto ' || p_numero, coalesce(p_assinatura, p_inicio), p_inicio, p_prazo, p_fim, p_valor, coalesce(p_mensal, round(p_valor / p_prazo, 2)),
          p_regime, p_forma, 'continuo', false)
  returning id into v_c;
  return v_c;
end $$;

-- Designação com portaria (publicada ou não)
create or replace function teste.designar(p_contrato uuid, p_pessoa uuid, p_papel public.papel_designacao,
                                          p_publicada boolean default true, p_inicio date default null)
returns uuid language plpgsql as $$
declare v_p uuid; v_d uuid; v_org uuid := (select orgao_id from public.contratos where id = p_contrato);
begin
  insert into public.portarias (orgao_id, orgao_emissor_texto, numero, ano, data_publicacao)
  values (v_org, 'DEMO', (floor(random() * 1e9))::bigint::text, 2026, case when p_publicada then date '2026-01-10' end)
  returning id into v_p;
  insert into public.designacoes (contrato_id, pessoa_id, papel, portaria_id, inicio)
  values (p_contrato, p_pessoa, p_papel, v_p, p_inicio) returning id into v_d;
  return v_d;
end $$;

-- Equipe completa e regular (gestor, fiscal, substituto, portarias publicadas)
create or replace function teste.equipe_completa(p_contrato uuid)
returns void language plpgsql as $$
begin
  perform teste.designar(p_contrato, teste.pessoa('DEMO Gestor ' || left(p_contrato::text, 4)), 'gestor');
  perform teste.designar(p_contrato, teste.pessoa('DEMO Fiscal ' || left(p_contrato::text, 4)), 'fiscal');
  perform teste.designar(p_contrato, teste.pessoa('DEMO Substituto ' || left(p_contrato::text, 4)), 'fiscal_substituto');
end $$;

create or replace function teste.alertas(p_contrato uuid)
returns text[] language sql stable as $$
  select coalesce(array_agg(regra_codigo order by regra_codigo), '{}') from public.alertas
   where contrato_id = p_contrato and resolvido_em is null;
$$;

create or replace function teste.entrar(p_usuario uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_usuario::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function teste.sair()
returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

grant execute on all functions in schema teste to authenticated, anon;
