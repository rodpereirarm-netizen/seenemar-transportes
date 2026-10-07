-- =============================================================================
-- SIGC · 05 · Importação com staging (regra de não destruição)
--
-- Fluxo:  upload → importacoes + importacao_linhas.valores_originais (célula a célula)
--         → fn_importacao_validar()  : valores_normalizados + erros (código, campo, severidade)
--         → revisão humana            : ajustes (sobrepõem o normalizado; o original nunca muda)
--         → fn_importacao_aprovar()   : cria cadastros e contratos; quem aprova ≠ quem carregou
--
-- Quem lê o .xlsx (navegador/Edge Function) só converte células em JSON:
--   datas → "AAAA-MM-DD"; números → número JSON; texto → texto como está.
-- Chaves de valores_originais (colunas da planilha):
--   secretaria(A) numero(B) contratada(C) objeto(D) unidade(E) quant(G) v_unit(I) v_mensal(J)
--   v_anual(K) v_total(L) proc_mae(M) fat2023..fat2026(N..Q) inicio(R) prazo(S) termino(T)
--   doc_base(U) inicio_vig_ref(V) garantia(W) obs(X) apost_situacao(Y) portaria(Z)
--   fiscal_pres(AA) fiscal1(AB) fiscal2(AC) fiscal_sub(AD) gestor(AE) gestor_sub(AF)
--   dt_assin(AG) dt_doerj(AI) dt_pncp(AK) siafe(AM)
-- =============================================================================

create table public.importacoes (
  id              uuid primary key default gen_random_uuid(),
  arquivo_nome    text not null,
  arquivo_sha256  text not null check (arquivo_sha256 ~ '^[0-9a-f]{64}$'),
  aba             text,
  data_referencia date not null,            -- data do =TODAY() da planilha ou da carga
  situacao        text not null default 'carregada'
                  check (situacao in ('carregada', 'validada', 'aprovada', 'rejeitada')),
  carregada_por   uuid not null default auth.uid() references public.usuarios(id),
  carregada_em    timestamptz not null default now(),
  aprovada_por    uuid references public.usuarios(id),
  aprovada_em     timestamptz,
  observacao      text,
  -- Segregação de funções (seção 20): quem carrega não aprova
  check (aprovada_por is null or aprovada_por <> carregada_por)
);
-- O mesmo arquivo não entra duas vezes (salvo se a carga anterior foi rejeitada)
create unique index importacoes_arquivo_uk on public.importacoes (arquivo_sha256) where situacao <> 'rejeitada';

create table public.importacao_linhas (
  id                   bigint generated always as identity primary key,
  importacao_id        uuid not null references public.importacoes(id),
  linha_origem         int  not null,
  orgao_id             uuid references public.orgaos(id),       -- preenchido pela validação
  valores_originais    jsonb not null,                           -- IMUTÁVEL
  valores_normalizados jsonb,
  ajustes              jsonb not null default '{}',              -- correções do revisor (sobrepõem o normalizado)
  erros                jsonb not null default '[]',              -- [{codigo, campo, severidade, mensagem, original}]
  situacao             text not null default 'pendente'
                       check (situacao in ('pendente', 'aprovada', 'rejeitada', 'ignorada')),
  decisao_motivo       text,
  decidido_por         uuid references public.usuarios(id),
  decidido_em          timestamptz,
  contrato_id          uuid references public.contratos(id),
  erros_tratados_em    timestamptz,                              -- fecha o alerta DQ-IMPORT
  erros_tratados_por   uuid references public.usuarios(id),
  unique (importacao_id, linha_origem),
  check (situacao not in ('rejeitada', 'ignorada') or nullif(btrim(decisao_motivo), '') is not null)
);
create index importacao_linhas_contrato on public.importacao_linhas (contrato_id);

alter table public.contratos
  add constraint contratos_importacao_linha_fk foreign key (importacao_linha_id) references public.importacao_linhas(id);

create or replace function public.fn_importacao_original_imutavel()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.valores_originais is distinct from old.valores_originais
     or new.linha_origem is distinct from old.linha_origem
     or new.importacao_id is distinct from old.importacao_id then
    raise exception 'Regra de não destruição: o valor original importado não pode ser alterado'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger trg_importacao_original before update on public.importacao_linhas
  for each row execute function public.fn_importacao_original_imutavel();

create or replace function public.fn_importacao_sem_exclusao()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'Regra de não destruição: linhas e cargas importadas não são excluídas (use situação = rejeitada)'
    using errcode = 'check_violation';
end $$;
create trigger trg_importacao_linhas_sem_delete before delete on public.importacao_linhas
  for each row execute function public.fn_importacao_sem_exclusao();
create trigger trg_importacoes_sem_delete before delete on public.importacoes
  for each row execute function public.fn_importacao_sem_exclusao();

-- -----------------------------------------------------------------------------
-- Conversores de célula (retornam nulo quando não reconhecem; quem chama registra o erro)
-- -----------------------------------------------------------------------------

create or replace function public.fn_imp_texto(p jsonb)
returns text language sql immutable set search_path = public as $$
  select nullif(btrim(regexp_replace(p #>> '{}', '[\s ]+', ' ', 'g')), '');
$$;

create or replace function public.fn_imp_data(p jsonb)
returns date language plpgsql immutable set search_path = public as $$
declare t text := public.fn_imp_texto(p);
begin
  if t is null then return null; end if;
  if t ~ '^\d{4}-\d{2}-\d{2}' then return substr(t, 1, 10)::date; end if;
  if t ~ '^\d{1,2}/\d{1,2}/\d{4}$' then return to_date(t, 'DD/MM/YYYY'); end if;
  if t ~ '^\d{1,2}/\d{1,2}/\d{2}$' then return to_date(t, 'DD/MM/YY'); end if;
  return null;
exception when others then
  return null;   -- ex.: 31/02/2026
end $$;

-- Número JSON, ou texto no formato brasileiro de UM valor ("R$ 1.928,10"). Listas → nulo.
create or replace function public.fn_imp_numero(p jsonb)
returns numeric language plpgsql immutable set search_path = public as $$
declare t text;
begin
  if p is null or jsonb_typeof(p) = 'null' then return null; end if;
  if jsonb_typeof(p) = 'number' then return (p #>> '{}')::numeric; end if;
  t := public.fn_imp_texto(p);
  if t ~ '^(R\$)?\s*\d{1,3}(\.\d{3})*(,\d+)?$' or t ~ '^(R\$)?\s*\d+(,\d+)?$' then
    return replace(replace(regexp_replace(t, '^R\$\s*', ''), '.', ''), ',', '.')::numeric;
  end if;
  return null;
end $$;

-- "Fulano de Tal - ID 1234567-8;" → (FULANO…, 12345678)
create or replace function public.fn_imp_pessoa(p text, out nome text, out matricula text)
language plpgsql immutable set search_path = public as $$
declare m text[];
begin
  p := btrim(regexp_replace(coalesce(p, ''), '[;\s]+$', ''));
  m := regexp_match(p, '^(.*?)\s*[-–]\s*ID\.?\s*([\d.\-/]+)\s*$', 'i');
  if m is not null then
    nome := btrim(m[1]); matricula := public.fn_somente_digitos(m[2]);
  else
    nome := nullif(p, '');
  end if;
end $$;

-- "SEDECSCTI N° 109(21/08/26)" · "Nº  99 (08/06/2026)" · "Nº  118" · "Nº  (aguardando publicação)"
create or replace function public.fn_imp_portaria(p text, out emissor text, out numero text, out data_publicacao date)
language plpgsql immutable set search_path = public as $$
declare m text[];
begin
  p := regexp_replace(coalesce(p, ''), '[\s\u00a0]+', ' ', 'g');
  m := regexp_match(p, '^\s*([A-Za-z]+)?\s*N\s*[º°o]?\.?\s*(\d+)?\s*(?:\(\s*(\d{1,2}/\d{1,2}/\d{2,4})\s*\))?', 'i');
  if m is null then return; end if;
  emissor := upper(m[1]);
  numero := m[2];
  data_publicacao := public.fn_imp_data(to_jsonb(m[3]));
end $$;

-- "016/2026 (BRASVIP)" · "\n002/2023" · "Empenho 2024NE00376" · "Termo Nº928-2024" · "Resolução nº 53/2025"
create or replace function public.fn_imp_numero_contrato(
  p text, out tipo public.tipo_instrumento, out numero text, out ano int, out complemento text)
language plpgsql immutable set search_path = public as $$
declare t text := btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g')); m text[];
begin
  if t = '' then return; end if;
  m := regexp_match(t, '(\d{4})\s*NE\s*0*(\d{1,6})', 'i');
  if m is not null then
    tipo := 'nota_empenho'; ano := m[1]::int; numero := lpad(m[2], 3, '0'); return;
  end if;
  m := regexp_match(t, '(\d{1,6})\s*[/\-]\s*(\d{4})(.*)$');
  if m is null then return; end if;
  numero := lpad(ltrim(m[1], '0'), 3, '0'); ano := m[2]::int;
  complemento := nullif(btrim(m[3]), '');
  tipo := case
    when t ~* '^resolu' then 'resolucao'
    when t ~* '^termo'  then 'outro'               -- tipo de termo [REQUISITO A VALIDAR]
    else 'contrato' end;
end $$;

-- "3º Apostim e 2ºAditivo" → {aditivos: 2, apostilamentos: 3}
create or replace function public.fn_imp_doc_base(p text)
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object(
    'aditivos',       coalesce((regexp_match(p, '(\d+)\s*[º°o]?\.?\s*aditivo', 'i'))[1]::int, 0),
    'apostilamentos', coalesce((regexp_match(p, '(\d+)\s*[º°o]?\.?\s*apost', 'i'))[1]::int, 0));
$$;

-- -----------------------------------------------------------------------------
-- Normalização de UMA linha → {normalizados, erros}
-- -----------------------------------------------------------------------------
create or replace function public.fn_importacao_normalizar(p jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  n        jsonb := '{}';
  e        jsonb := '[]';
  v_orgao  uuid;
  v_txt    text;
  v_num    record;
  v_ini    date; v_fim date; v_calc date; v_assin date; v_d date;
  v_prazo  numeric; v_mensal numeric; v_total numeric; v_q numeric; v_u numeric;
  v_port   record;
  v_pes    record;
  v_desig  jsonb := '[]';
  v_vistos jsonb := '{}';
  k        text;
  papel    text;
  c        record;
begin
  -- Linha vazia (ex.: linha mesclada) → nada a importar
  if not exists (select 1 from jsonb_each(p) x where public.fn_imp_texto(x.value) is not null) then
    return jsonb_build_object('vazia', true, 'normalizados', '{}'::jsonb, 'erros', '[]'::jsonb);
  end if;

  -- Órgão (SEDEICS → SEDES via siglas_anteriores)
  v_txt := public.fn_imp_texto(p -> 'secretaria');
  v_orgao := public.fn_orgao_por_sigla(v_txt);
  if v_orgao is null then
    -- Sem órgão reconhecível: tenta o prefixo do processo SEI (ex.: 220001 → SEDES); exige confirmação
    select o.id into v_orgao from public.orgaos o
     where left(public.fn_processo_canonico(public.fn_imp_texto(p -> 'proc_mae')), 6) = any (o.prefixos_sei);
    if v_orgao is not null then
      e := e || jsonb_build_object('codigo', 'IMP-ORGAO-PREFIXO', 'campo', 'secretaria', 'severidade', 'aviso',
                                   'mensagem', 'Órgão inferido pelo prefixo do processo SEI; confirme na revisão', 'original', v_txt);
    else
      e := e || jsonb_build_object('codigo', 'IMP-ORGAO', 'campo', 'secretaria', 'severidade', 'erro',
                                   'mensagem', 'Órgão não reconhecido; informe o órgão no ajuste', 'original', v_txt);
    end if;
  end if;
  n := n || jsonb_build_object('orgao_id', v_orgao, 'orgao_sigla_original', v_txt);

  -- Número / tipo de instrumento
  v_txt := public.fn_imp_texto(p -> 'numero');
  select * into v_num from public.fn_imp_numero_contrato(v_txt);
  n := n || jsonb_build_object('tipo_instrumento',
                               case when public.fn_normalizar_texto(p ->> 'secretaria') like 'DESCENTRALIZ%' then 'termo_descentralizacao'
                                    else coalesce(v_num.tipo, 'contrato') end,
                               'numero', v_num.numero,
                               'ano', v_num.ano, 'numero_complemento', v_num.complemento);
  if v_txt is not null and v_num.numero is null then
    e := e || jsonb_build_object('codigo', 'IMP-NUM', 'campo', 'numero', 'severidade', 'aviso',
                                 'mensagem', 'Número fora do padrão NNN/AAAA', 'original', v_txt);
  elsif v_num.complemento is not null or v_num.tipo = 'outro' then
    e := e || jsonb_build_object('codigo', 'IMP-NUM-COMPL', 'campo', 'numero', 'severidade', 'aviso',
                                 'mensagem', 'Número com complemento ou tipo de instrumento a confirmar', 'original', v_txt);
  end if;

  -- Fornecedor e objeto
  n := n || jsonb_build_object('fornecedor_nome', public.fn_imp_texto(p -> 'contratada'),
                               'objeto', public.fn_imp_texto(p -> 'objeto'));
  if public.fn_imp_texto(p -> 'contratada') is not null then
    e := e || jsonb_build_object('codigo', 'IMP-CNPJ', 'campo', 'contratada', 'severidade', 'aviso',
                                 'mensagem', 'Fornecedor sem CNPJ: entra como provisório', 'original', public.fn_imp_texto(p -> 'contratada'));
  end if;
  -- Objeto é obrigatório para instrumento formalizado; numa demanda (sem número e sem início) entra como [DADO AUSENTE]
  if public.fn_imp_texto(p -> 'objeto') is null then
    e := e || jsonb_build_object('codigo', 'IMP-OBJETO', 'campo', 'objeto',
                                 'severidade', case when public.fn_imp_texto(p -> 'numero') is null and public.fn_imp_data(p -> 'inicio') is null
                                                    then 'aviso' else 'erro' end,
                                 'mensagem', 'Objeto não informado', 'original', null);
  end if;

  -- Datas
  foreach k in array array['inicio', 'termino', 'dt_assin', 'dt_doerj', 'dt_pncp'] loop
    v_txt := public.fn_imp_texto(p -> k);
    v_d := public.fn_imp_data(p -> k);
    if v_txt is not null and v_d is null and public.fn_marcador_lacuna(v_txt) is null then
      e := e || jsonb_build_object('codigo', 'IMP-DATA', 'campo', k, 'severidade', 'erro',
                                   'mensagem', 'Data não reconhecida', 'original', v_txt);
    end if;
    n := n || jsonb_build_object(k, v_d);
  end loop;
  v_ini := (n ->> 'inicio')::date; v_fim := (n ->> 'termino')::date; v_assin := (n ->> 'dt_assin')::date;

  v_prazo := public.fn_imp_numero(p -> 'prazo');
  n := n || jsonb_build_object('prazo_meses', v_prazo::int);

  if v_ini is null then
    e := e || jsonb_build_object('codigo', 'IMP-SEM-INICIO', 'campo', 'inicio', 'severidade', 'aviso',
                                 'mensagem', 'Sem início de vigência: entra como "Em formalização"', 'original', null);
  end if;

  -- Término × início + prazo (RN-V02)
  if v_ini is not null and v_prazo is not null then
    v_calc := public.fn_fim_por_prazo(v_ini, v_prazo::int,
                coalesce(public.fn_parametro('vigencia.convencao_termino', v_orgao) #>> '{}', 'edate_menos_1'));
    n := n || jsonb_build_object('termino_calculado', v_calc);
  end if;
  if v_fim is not null and v_ini is not null and v_fim < v_ini then
    e := e || jsonb_build_object('codigo', 'IMP-TERM-INICIO', 'campo', 'termino', 'severidade', 'aviso',
                                 'mensagem', 'Término anterior ao início: término descartado, vale início + prazo', 'original', v_fim);
    n := n || jsonb_build_object('termino', null);
  elsif v_fim is not null and v_calc is not null and v_fim <> v_calc then
    e := e || jsonb_build_object('codigo', 'IMP-TERM-DIV', 'campo', 'termino', 'severidade', 'aviso',
                                 'mensagem', format('Término informado difere de início + prazo em %s dia(s)', v_fim - v_calc),
                                 'original', v_fim);
  end if;
  if v_ini is not null and v_assin is not null and v_ini < v_assin then
    e := e || jsonb_build_object('codigo', 'IMP-INICIO-ASSIN', 'campo', 'inicio', 'severidade', 'aviso',
                                 'mensagem', 'Início da vigência anterior à assinatura', 'original', v_ini);
  end if;
  foreach k in array array['dt_doerj', 'dt_pncp'] loop
    v_d := (n ->> k)::date;
    if v_d is not null and v_assin is not null and v_d < v_assin then
      e := e || jsonb_build_object('codigo', 'IMP-PUB-ASSIN', 'campo', k, 'severidade', 'aviso',
                                   'mensagem', 'Publicação anterior à assinatura', 'original', v_d);
    end if;
  end loop;

  -- Valores
  v_mensal := public.fn_imp_numero(p -> 'v_mensal');
  v_total  := public.fn_imp_numero(p -> 'v_total');
  v_q      := public.fn_imp_numero(p -> 'quant');
  v_u      := public.fn_imp_numero(p -> 'v_unit');
  n := n || jsonb_build_object('valor_mensal', v_mensal, 'valor_global', v_total, 'quantidade', v_q, 'valor_unitario', v_u,
                               'unidade_medida', public.fn_imp_texto(p -> 'unidade'),
                               'quantidade_texto', public.fn_imp_texto(p -> 'quant'),
                               'valor_unitario_texto', public.fn_imp_texto(p -> 'v_unit'));
  if (public.fn_imp_texto(p -> 'quant') is not null and v_q is null)
     or (public.fn_imp_texto(p -> 'v_unit') is not null and v_u is null) then
    e := e || jsonb_build_object('codigo', 'IMP-ITENS', 'campo', 'quant/v_unit', 'severidade', 'aviso',
                                 'mensagem', 'Quantidade ou preço em texto livre: separar itens na revisão',
                                 'original', concat_ws(' | ', public.fn_imp_texto(p -> 'quant'), public.fn_imp_texto(p -> 'v_unit')));
  end if;
  if v_q is not null and v_u is not null and v_mensal > 0 and abs(v_q * v_u - v_mensal) / v_mensal > 0.005 then
    e := e || jsonb_build_object('codigo', 'IMP-QXU', 'campo', 'v_mensal', 'severidade', 'aviso',
                                 'mensagem', format('Quantidade × unitário (%s) difere do mensal (%s)', round(v_q * v_u, 2), v_mensal),
                                 'original', v_mensal);
  end if;
  if v_mensal > 0 and v_prazo > 0 and v_total > 0 and abs(v_mensal * v_prazo - v_total) / v_total > 0.005 then
    e := e || jsonb_build_object('codigo', 'IMP-VALOR-GLOBAL', 'campo', 'v_total', 'severidade', 'aviso',
                                 'mensagem', format('Mensal × prazo (%s) difere do global (%s)', round(v_mensal * v_prazo, 2), v_total),
                                 'original', v_total);
  end if;

  -- Processos SEI
  v_txt := public.fn_imp_texto(p -> 'proc_mae');
  n := n || jsonb_build_object('processo_principal', public.fn_processo_canonico(v_txt));
  if v_txt is not null and public.fn_processo_canonico(v_txt) is null then
    e := e || jsonb_build_object('codigo', 'IMP-PROC', 'campo', 'proc_mae', 'severidade', 'aviso',
                                 'mensagem', 'Processo fora do padrão NNNNNN/NNNNNN/AAAA', 'original', v_txt);
  end if;
  n := n || jsonb_build_object('processos_pagamento', coalesce((
    select jsonb_agg(jsonb_build_object('exercicio', ex, 'numero', public.fn_processo_canonico(public.fn_imp_texto(p -> ('fat' || ex)))))
      from generate_series(2023, 2026) ex
     where public.fn_processo_canonico(public.fn_imp_texto(p -> ('fat' || ex))) is not null), '[]'::jsonb));

  -- Documento base (período vigente pode ser de aditivo)
  v_txt := public.fn_imp_texto(p -> 'doc_base');
  n := n || jsonb_build_object('doc_base', v_txt, 'doc_base_contagem', public.fn_imp_doc_base(v_txt),
                               'historico_incompleto', coalesce((public.fn_imp_doc_base(v_txt) ->> 'aditivos')::int, 0) > 0);

  -- Garantia (coluna W). N/C = não se aplica → não exigida [REGRA A CONFIRMAR, pergunta 29.2 nº 2]
  v_txt := public.fn_imp_texto(p -> 'garantia');
  n := n || jsonb_build_object('garantia_exigida', case
    when upper(v_txt) = 'SIM' then true
    when upper(public.fn_normalizar_texto(v_txt)) in ('NAO', 'NÃO') then false
    when public.fn_marcador_lacuna(v_txt) = 'nao_se_aplica' then false
    else null end);

  n := n || jsonb_build_object('observacoes', public.fn_imp_texto(p -> 'obs'),
                               'campanha_situacao', public.fn_imp_texto(p -> 'apost_situacao'),
                               'siafe_conferido', upper(public.fn_normalizar_texto(public.fn_imp_texto(p -> 'siafe'))) = 'SIM');

  -- Portaria
  v_txt := public.fn_imp_texto(p -> 'portaria');
  if v_txt is not null and public.fn_marcador_lacuna(v_txt) is null then
    select * into v_port from public.fn_imp_portaria(v_txt);
    if v_port.numero is null then
      e := e || jsonb_build_object('codigo', 'IMP-PORTARIA', 'campo', 'portaria', 'severidade', 'aviso',
                                   'mensagem', 'Portaria sem número reconhecível', 'original', v_txt);
    else
      n := n || jsonb_build_object('portaria', jsonb_build_object(
             'emissor', v_port.emissor, 'numero', v_port.numero,
             'ano', extract(year from v_port.data_publicacao)::int, 'data_publicacao', v_port.data_publicacao));
      if v_port.data_publicacao is null then
        e := e || jsonb_build_object('codigo', 'IMP-PORTARIA-DATA', 'campo', 'portaria', 'severidade', 'aviso',
                                     'mensagem', 'Portaria sem data de publicação', 'original', v_txt);
      end if;
    end if;
  end if;

  -- Designações
  for c in select * from (values ('fiscal_pres', 'fiscal_presidente'), ('fiscal1', 'fiscal'), ('fiscal2', 'fiscal'),
                                 ('fiscal_sub', 'fiscal_substituto'), ('gestor', 'gestor'), ('gestor_sub', 'gestor_substituto')) x(campo, papel)
  loop
    v_txt := public.fn_imp_texto(p -> c.campo);
    continue when v_txt is null or public.fn_marcador_lacuna(v_txt) is not null;
    select * into v_pes from public.fn_imp_pessoa(v_txt);
    continue when v_pes.nome is null;
    if v_vistos ? public.fn_normalizar_texto(v_pes.nome) then
      e := e || jsonb_build_object('codigo', 'IMP-PESSOA-DUP', 'campo', c.campo, 'severidade', 'aviso',
                                   'mensagem', format('A mesma pessoa aparece como %s e %s. Recomenda-se designar atores distintos (aviso: não bloqueia a importação)',
                                                      v_vistos ->> public.fn_normalizar_texto(v_pes.nome), c.papel),
                                   'original', v_txt);
    end if;
    v_vistos := v_vistos || jsonb_build_object(public.fn_normalizar_texto(v_pes.nome), c.papel);
    v_desig := v_desig || jsonb_build_object('papel', c.papel, 'nome', v_pes.nome, 'matricula', v_pes.matricula, 'campo', c.campo);
  end loop;
  n := n || jsonb_build_object('designacoes', v_desig);

  return jsonb_build_object('vazia', false, 'normalizados', n, 'erros', e);
end $$;

-- -----------------------------------------------------------------------------
-- Validação da carga inteira (idempotente; pode rodar de novo após ajustes)
-- -----------------------------------------------------------------------------
create or replace function public.fn_importacao_validar(p_importacao uuid)
returns table (linhas int, com_erro int, com_aviso int, vazias int)
language plpgsql security definer set search_path = public as $$
declare l record; r jsonb; v_norm jsonb; v_err jsonb;
begin
  if not exists (select 1 from public.importacoes i where i.id = p_importacao and i.situacao in ('carregada', 'validada')) then
    raise exception 'Importação inexistente ou já decidida';
  end if;
  if not public.fn_pode_importar() then
    raise exception 'Sem permissão para importar' using errcode = 'insufficient_privilege';
  end if;

  for l in select * from public.importacao_linhas where importacao_id = p_importacao and situacao = 'pendente' loop
    r := public.fn_importacao_normalizar(l.valores_originais);
    v_norm := (r -> 'normalizados') || l.ajustes;
    v_err  := r -> 'erros';
    -- Erro corrigido por ajuste deixa de valer (ex.: órgão informado manualmente)
    if l.ajustes ? 'orgao_id' then
      v_err := coalesce((select jsonb_agg(x) from jsonb_array_elements(v_err) x where x ->> 'codigo' <> 'IMP-ORGAO'), '[]');
    end if;
    update public.importacao_linhas
       set valores_normalizados = v_norm,
           erros = v_err,
           orgao_id = (v_norm ->> 'orgao_id')::uuid,
           situacao = case when (r ->> 'vazia')::boolean then 'ignorada' else situacao end,
           decisao_motivo = case when (r ->> 'vazia')::boolean then 'Linha vazia' else decisao_motivo end
     where id = l.id;
  end loop;

  -- Chave duplicada dentro da carga (ex.: "008/2023" em dois órgãos é permitido; no mesmo órgão, não)
  update public.importacao_linhas il
     set erros = il.erros || jsonb_build_array(jsonb_build_object(
           'codigo', 'IMP-DUP', 'campo', 'numero', 'severidade', 'erro',
           'mensagem', 'Mesmo órgão, tipo, número e ano em outra linha desta carga', 'original', il.valores_normalizados ->> 'numero'))
   where il.importacao_id = p_importacao and il.situacao = 'pendente'
     and il.valores_normalizados ->> 'numero' is not null
     and exists (select 1 from public.importacao_linhas o
                  where o.importacao_id = il.importacao_id and o.id <> il.id and o.situacao = 'pendente'
                    and o.orgao_id = il.orgao_id
                    and o.valores_normalizados ->> 'tipo_instrumento' = il.valores_normalizados ->> 'tipo_instrumento'
                    and o.valores_normalizados ->> 'numero' = il.valores_normalizados ->> 'numero'
                    and o.valores_normalizados ->> 'ano' = il.valores_normalizados ->> 'ano');

  -- Já cadastrado no sistema → a aprovação apenas vincula
  update public.importacao_linhas il
     set erros = il.erros || jsonb_build_array(jsonb_build_object(
           'codigo', 'IMP-JA-CADASTRADO', 'campo', 'numero', 'severidade', 'aviso',
           'mensagem', 'Contrato já existe no sistema: será apenas vinculado, sem sobrescrever', 'original', null))
   where il.importacao_id = p_importacao and il.situacao = 'pendente'
     and exists (select 1 from public.contratos c
                  where c.deleted_at is null and c.orgao_id = il.orgao_id
                    and c.tipo_instrumento::text = il.valores_normalizados ->> 'tipo_instrumento'
                    and c.numero = il.valores_normalizados ->> 'numero'
                    and c.ano = (il.valores_normalizados ->> 'ano')::int);

  update public.importacoes set situacao = 'validada' where id = p_importacao;

  return query
    select count(*)::int,
           count(*) filter (where exists (select 1 from jsonb_array_elements(il.erros) x where x ->> 'severidade' = 'erro'))::int,
           count(*) filter (where exists (select 1 from jsonb_array_elements(il.erros) x where x ->> 'severidade' = 'aviso'))::int,
           count(*) filter (where il.situacao = 'ignorada')::int
      from public.importacao_linhas il where il.importacao_id = p_importacao;
end $$;

-- -----------------------------------------------------------------------------
-- Aprovação: promove as linhas sem ERRO para os cadastros (avisos viram DQ-IMPORT)
-- -----------------------------------------------------------------------------
create or replace function public.fn_importacao_aprovar(p_importacao uuid)
returns table (contratos_criados int, contratos_vinculados int, linhas_bloqueadas int)
language plpgsql security definer set search_path = public as $$
declare
  imp record; l record; n jsonb; d jsonb;
  v_forn uuid; v_contrato uuid; v_proc uuid; v_port uuid; v_pessoa uuid; v_campanha uuid;
  v_criados int := 0; v_vinculados int := 0; v_bloq int := 0;
  v_just text;
begin
  select * into imp from public.importacoes where id = p_importacao for update;
  if imp.situacao <> 'validada' then raise exception 'A importação precisa estar validada'; end if;
  if imp.carregada_por = auth.uid() then
    raise exception 'Segregação de funções: quem carregou o arquivo não pode aprovar a mesma importação'
      using errcode = 'insufficient_privilege';
  end if;
  if not public.fn_pode_importar() then
    raise exception 'Sem permissão para aprovar importações' using errcode = 'insufficient_privilege';
  end if;

  for l in select * from public.importacao_linhas where importacao_id = p_importacao and situacao = 'pendente' order by linha_origem loop
    n := l.valores_normalizados;
    if exists (select 1 from jsonb_array_elements(l.erros) x where x ->> 'severidade' = 'erro')
       or not public.fn_tem_perfil(l.orgao_id, array['admin', 'gestao_contratos']::public.perfil_usuario[]) then
      v_bloq := v_bloq + 1;
      continue;
    end if;

    v_just := 'Importado da planilha (linha ' || l.linha_origem || '); inconsistência preservada em importacao_linhas';

    -- Contrato já existente → só vincula
    select c.id into v_contrato from public.contratos c
     where c.deleted_at is null and c.orgao_id = l.orgao_id and n ->> 'numero' is not null
       and c.tipo_instrumento::text = n ->> 'tipo_instrumento' and c.numero = n ->> 'numero' and c.ano = (n ->> 'ano')::int;
    if v_contrato is not null then
      update public.importacao_linhas set situacao = 'aprovada', contrato_id = v_contrato,
             decidido_por = auth.uid(), decidido_em = now() where id = l.id;
      v_vinculados := v_vinculados + 1;
      continue;
    end if;

    -- Fornecedor provisório (sem CNPJ): reaproveita pelo nome normalizado
    v_forn := null;
    if n ->> 'fornecedor_nome' is not null then
      select f.id into v_forn from public.fornecedores f
       where f.deleted_at is null and f.nome_normalizado = public.fn_normalizar_texto(n ->> 'fornecedor_nome')
       order by f.provisorio limit 1;
      if v_forn is null then
        insert into public.fornecedores (razao_social) values (n ->> 'fornecedor_nome') returning id into v_forn;
      end if;
    end if;

    insert into public.contratos (
      orgao_id, tipo_instrumento, numero, ano, numero_complemento, fornecedor_id, objeto,
      data_assinatura, inicio_vigencia, prazo_meses_original, data_fim_original,
      valor_global_original, valor_mensal_original, garantia_exigida,
      justificativa_inicio_antes_assinatura, siafe_conferido_em, observacoes,
      historico_incompleto, doc_base_origem, importacao_linha_id)
    values (
      l.orgao_id, (n ->> 'tipo_instrumento')::public.tipo_instrumento, n ->> 'numero', (n ->> 'ano')::int,
      n ->> 'numero_complemento', v_forn, coalesce(n ->> 'objeto', '[DADO AUSENTE]'),
      (n ->> 'dt_assin')::date, (n ->> 'inicio')::date, (n ->> 'prazo_meses')::int, (n ->> 'termino')::date,
      (n ->> 'valor_global')::numeric, (n ->> 'valor_mensal')::numeric, (n ->> 'garantia_exigida')::boolean,
      case when (n ->> 'inicio')::date < (n ->> 'dt_assin')::date then v_just end,
      case when (n ->> 'siafe_conferido')::boolean then imp.data_referencia end,
      n ->> 'observacoes', coalesce((n ->> 'historico_incompleto')::boolean, false), n ->> 'doc_base', l.id)
    returning id into v_contrato;

    -- Item (texto livre preservado em regra_preco quando não há preço unitário numérico)
    if n ->> 'unidade_medida' is not null or n ->> 'quantidade_texto' is not null then
      insert into public.contrato_itens (contrato_id, orgao_id, descricao, unidade_medida, quantidade, tipo_preco, valor_unitario, regra_preco)
      values (v_contrato, l.orgao_id, coalesce(n ->> 'unidade_medida', 'Item único'), n ->> 'unidade_medida',
              (n ->> 'quantidade')::numeric,
              case when (n ->> 'quantidade') is not null and (n ->> 'valor_unitario') is not null then 'unitario'
                   when upper(coalesce(n ->> 'quantidade_texto', '')) like '%DEMANDA%' then 'por_demanda'
                   else 'por_produto' end,
              (n ->> 'valor_unitario')::numeric,
              case when (n ->> 'quantidade') is null or (n ->> 'valor_unitario') is null
                   then concat_ws(' | ', n ->> 'quantidade_texto', n ->> 'valor_unitario_texto') end);
    end if;

    -- Processos (principal e pagamentos por exercício)
    if n ->> 'processo_principal' is not null then
      insert into public.processos (orgao_id, numero) values (l.orgao_id, n ->> 'processo_principal')
        on conflict (numero) do update set numero = excluded.numero returning id into v_proc;
      insert into public.contrato_processos (contrato_id, orgao_id, processo_id, papel)
        values (v_contrato, l.orgao_id, v_proc, 'principal') on conflict do nothing;
    end if;
    for d in select * from jsonb_array_elements(n -> 'processos_pagamento') loop
      insert into public.processos (orgao_id, numero) values (l.orgao_id, d ->> 'numero')
        on conflict (numero) do update set numero = excluded.numero returning id into v_proc;
      insert into public.contrato_processos (contrato_id, orgao_id, processo_id, papel, exercicio)
        values (v_contrato, l.orgao_id, v_proc, 'pagamento', (d ->> 'exercicio')::int) on conflict do nothing;
    end loop;

    -- Portaria (emissor ausente = sigla do órgão da linha)
    v_port := null;
    if n -> 'portaria' is not null and n -> 'portaria' ->> 'ano' is not null then
      insert into public.portarias (orgao_id, orgao_emissor_texto, numero, ano, data_publicacao)
      values (l.orgao_id,
              coalesce(n -> 'portaria' ->> 'emissor', (select sigla from public.orgaos where id = l.orgao_id)),
              n -> 'portaria' ->> 'numero', (n -> 'portaria' ->> 'ano')::int, (n -> 'portaria' ->> 'data_publicacao')::date)
      on conflict (orgao_emissor_texto, numero, ano) do update set numero = excluded.numero
      returning id into v_port;
    end if;

    -- Pessoas e designações (matrícula > nome normalizado; variações de grafia NÃO são fundidas automaticamente)
    for d in select * from jsonb_array_elements(n -> 'designacoes') loop
      v_pessoa := null;
      if d ->> 'matricula' is not null then
        select id into v_pessoa from public.pessoas where matricula = d ->> 'matricula' and deleted_at is null;
      end if;
      if v_pessoa is null then
        select id into v_pessoa from public.pessoas
         where nome_normalizado = public.fn_normalizar_texto(d ->> 'nome') and deleted_at is null
         order by (matricula is not null) desc limit 1;
      end if;
      if v_pessoa is null then
        insert into public.pessoas (orgao_id, nome, matricula) values (l.orgao_id, d ->> 'nome', d ->> 'matricula')
        returning id into v_pessoa;
      elsif d ->> 'matricula' is not null then
        update public.pessoas set matricula = d ->> 'matricula' where id = v_pessoa and matricula is null;
      end if;
      begin
        insert into public.designacoes (contrato_id, orgao_id, pessoa_id, papel, portaria_id)
        values (v_contrato, l.orgao_id, v_pessoa, (d ->> 'papel')::public.papel_designacao, v_port);
      exception when exclusion_violation then
        null;   -- mesma pessoa no mesmo papel duas vezes na linha (aviso IMP-PESSOA-DUP já registrado)
      end;
    end loop;

    -- Publicações do contrato
    if n ->> 'dt_doerj' is not null then
      insert into public.publicacoes (contrato_id, orgao_id, veiculo, data_publicacao, justificativa_inconsistencia)
      values (v_contrato, l.orgao_id, 'doerj', (n ->> 'dt_doerj')::date,
              case when (n ->> 'dt_doerj')::date < (n ->> 'dt_assin')::date then v_just end);
    end if;
    if n ->> 'dt_pncp' is not null then
      insert into public.publicacoes (contrato_id, orgao_id, veiculo, data_publicacao, justificativa_inconsistencia)
      values (v_contrato, l.orgao_id, 'pncp', (n ->> 'dt_pncp')::date,
              case when (n ->> 'dt_pncp')::date < (n ->> 'dt_assin')::date then v_just end);
    end if;

    -- Coluna Y → tarefa da campanha do órgão (uma campanha por órgão e importação)
    if n ->> 'campanha_situacao' is not null then
      select id into v_campanha from public.campanhas
       where orgao_id = l.orgao_id and nome = (public.fn_parametro('importacao.campanha_coluna_y') ->> 'nome');
      if v_campanha is null then
        insert into public.campanhas (orgao_id, nome, objetivo)
        values (l.orgao_id, public.fn_parametro('importacao.campanha_coluna_y') ->> 'nome',
                public.fn_parametro('importacao.campanha_coluna_y') ->> 'objetivo')
        returning id into v_campanha;
      end if;
      insert into public.tarefas (orgao_id, contrato_id, campanha_id, titulo, origem, status, prioridade,
                                  resultado, concluida_em)
      values (l.orgao_id, v_contrato, v_campanha,
              'Apostilamento de troca do órgão contratante', 'campanha',
              case public.fn_normalizar_texto(n ->> 'campanha_situacao')
                when 'ASSINADO E PUBLICADO' then 'concluida'::public.status_tarefa
                when 'NAO SERA EXECUTADO'   then 'cancelada'::public.status_tarefa
                else 'aberta'::public.status_tarefa end,
              'media',
              'Situação na planilha: ' || (n ->> 'campanha_situacao'),
              case when public.fn_normalizar_texto(n ->> 'campanha_situacao') in ('ASSINADO E PUBLICADO', 'NAO SERA EXECUTADO')
                   then now() end);
    end if;

    update public.importacao_linhas set situacao = 'aprovada', contrato_id = v_contrato,
           decidido_por = auth.uid(), decidido_em = now() where id = l.id;
    v_criados := v_criados + 1;
  end loop;

  update public.importacoes set situacao = 'aprovada', aprovada_por = auth.uid(), aprovada_em = now()
   where id = p_importacao;

  return query select v_criados, v_vinculados, v_bloq;
end $$;

-- -----------------------------------------------------------------------------
-- Saneamento: fundir dois cadastros da mesma pessoa (variação de grafia).
-- As designações passam para quem fica; o outro cadastro recebe soft delete. Tudo auditado.
-- -----------------------------------------------------------------------------
create or replace function public.fn_fundir_pessoas(p_manter uuid, p_remover uuid, p_motivo text)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.fn_gere_algum_orgao() then
    raise exception 'Sem permissão para fundir cadastros' using errcode = 'insufficient_privilege';
  end if;
  if p_manter = p_remover then raise exception 'Escolha dois cadastros diferentes'; end if;
  if nullif(btrim(p_motivo), '') is null then raise exception 'RN-A01: informe o motivo da fusão'; end if;
  if exists (select 1 from public.pessoas where id = p_remover and matricula is not null)
     and exists (select 1 from public.pessoas where id = p_manter and matricula is not null)
     and (select matricula from public.pessoas where id = p_remover) <> (select matricula from public.pessoas where id = p_manter) then
    raise exception 'Matrículas diferentes: não são a mesma pessoa';
  end if;
  update public.designacoes set pessoa_id = p_manter, motivo_alteracao = p_motivo where pessoa_id = p_remover;
  get diagnostics n = row_count;
  update public.pessoas p set matricula = coalesce(p.matricula, r.matricula)
    from public.pessoas r where p.id = p_manter and r.id = p_remover;
  update public.pessoas set deleted_at = now(), matricula = null where id = p_remover;
  return n;
exception when exclusion_violation then
  raise exception 'As duas pessoas ocupam o mesmo papel no mesmo contrato: encerre uma das designações antes de fundir';
end $$;
revoke execute on function public.fn_fundir_pessoas(uuid, uuid, text) from public, anon;
grant execute on function public.fn_fundir_pessoas(uuid, uuid, text) to authenticated;
