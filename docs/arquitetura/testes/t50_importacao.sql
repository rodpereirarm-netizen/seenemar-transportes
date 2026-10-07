-- Testes do importador (staging, normalização, segregação, não destruição).
-- As linhas imitam os FORMATOS da planilha real, com valores DEMO.
begin;
set local sigc.data_referencia = '2026-10-07';

do $$
declare
  u_carga uuid; u_aprov uuid; v_imp uuid; r record; n jsonb; e jsonb; c uuid;
begin
  u_carga := teste.usuario('DEMO Quem Carrega', 'gestao_contratos', 'SEDES');
  insert into public.usuario_perfis (usuario_id, orgao_id, perfil) values (u_carga, teste.orgao('SEENEMAR'), 'gestao_contratos');
  u_aprov := teste.usuario('DEMO Quem Aprova', 'gestao_contratos', 'SEDES');
  insert into public.usuario_perfis (usuario_id, orgao_id, perfil) values (u_aprov, teste.orgao('SEENEMAR'), 'gestao_contratos');

  -- T-IMP-01: conversores de célula
  perform teste.ok(public.fn_processo_canonico('480001/ 000228/ 2023') = '480001/000228/2023', 'T-IMP-01 processo com espaços');
  perform teste.ok(public.fn_processo_canonico('SEI-220001/000451/2026') = '220001/000451/2026', 'T-IMP-01 processo com prefixo SEI-');
  perform teste.ok(public.fn_processo_canonico('Diversos. (Ver proc pagam..)') is null, 'T-IMP-01 texto livre não vira processo');
  select * into r from public.fn_imp_numero_contrato('016/2026 (BRASVIP)');
  perform teste.ok(r.numero = '016' and r.ano = 2026 and r.complemento = '(BRASVIP)' and r.tipo = 'contrato', 'T-IMP-01 número com complemento');
  select * into r from public.fn_imp_numero_contrato(E'\n002/2023');
  perform teste.ok(r.numero = '002' and r.ano = 2023, 'T-IMP-01 número com quebra de linha');
  select * into r from public.fn_imp_numero_contrato('Empenho 2024NE00376');
  perform teste.ok(r.tipo = 'nota_empenho' and r.numero = '376' and r.ano = 2024, 'T-IMP-01 nota de empenho');
  select * into r from public.fn_imp_numero_contrato('Resolução nº 53/2025');
  perform teste.ok(r.tipo = 'resolucao' and r.numero = '053', 'T-IMP-01 resolução');
  select * into r from public.fn_imp_pessoa('DEMO Fulana de Tal - ID 5156890-0;');
  perform teste.ok(r.nome = 'DEMO Fulana de Tal' and r.matricula = '51568900', 'T-IMP-01 pessoa com "- ID"');
  select * into r from public.fn_imp_portaria('SEDECSCTI N° 109(21/08/26)');
  perform teste.ok(r.emissor = 'SEDECSCTI' and r.numero = '109' and r.data_publicacao = '2026-08-21', 'T-IMP-01 portaria com emissor e data curta');
  select * into r from public.fn_imp_portaria(E'Nº  99 (08/06/2026)');
  perform teste.ok(r.emissor is null and r.numero = '99' and r.data_publicacao = '2026-06-08', 'T-IMP-01 portaria sem emissor');
  perform teste.ok(public.fn_imp_numero('"R$ 1.928,10"') = 1928.10 and public.fn_imp_numero('"R$ 1.000,00 / R$ 1.000,00"') is null,
                   'T-IMP-01 valor em reais; lista de valores não é convertida');
  perform teste.ok(public.fn_marcador_lacuna('N/C') = 'nao_se_aplica' and public.fn_marcador_lacuna('****') = 'nao_informado',
                   'T-IMP-01 marcadores de lacuna');
  perform teste.ok(public.fn_imp_doc_base('3º Apostim e 2ºAditivo') = '{"aditivos": 2, "apostilamentos": 3}', 'T-IMP-01 DOC. BASE');
  perform teste.ok(public.fn_orgao_por_sigla('SEDEICS') = teste.orgao('SEDES'), 'T-IMP-01 SEDEICS → SEDES');

  -- Carga DEMO
  perform teste.entrar(u_carga);
  insert into public.importacoes (arquivo_nome, arquivo_sha256, aba, data_referencia)
  values ('DEMO planilha.xlsx', repeat('a', 64), 'CONTRATOS', '2026-09-25') returning id into v_imp;
  insert into public.importacao_linhas (importacao_id, linha_origem, valores_originais) values
  -- L1: contrato SEDEICS completo, EDATE − 1, portaria SEDECSCTI, pessoa com ID
  (v_imp, 17, '{"secretaria": "SEDEICS", "numero": "901/2024", "contratada": "DEMO EMPRESA A", "objeto": "DEMO serviço contínuo",
                "unidade": "SERVIÇO", "quant": 2, "v_unit": 5000, "v_mensal": 10000, "v_total": 240000,
                "proc_mae": "220001/ 000207/ 2024", "fat2026": "220001/000999/2026", "inicio": "2024-10-22", "prazo": 24,
                "termino": "2026-10-21", "doc_base": "1º Aditivo", "garantia": "SIM", "apost_situacao": "Pendente",
                "portaria": "SEDECSCTI N° 108(25/08/26)", "fiscal1": "DEMO Fiscal Um - ID 111",
                "fiscal_sub": "N/C", "gestor": "DEMO Gestor Um", "dt_assin": "2024-10-11", "dt_doerj": "2024-10-18", "dt_pncp": "2024-10-22"}'),
  -- L2: SEENEMAR, término +1 dia, início antes da assinatura, garantia ****, mesma pessoa em dois papéis
  (v_imp, 41, '{"secretaria": "SEENEMAR", "numero": "016/2026 (BRASVIP)", "contratada": "DEMO EMPRESA B", "objeto": "DEMO vigilância",
                "unidade": "SERVIÇO (POSTOS)", "quant": "02 (VIG. DIURNO) + 04 (NOTURNO)", "v_unit": "R$16.720,18 (DIURNO)",
                "v_mensal": 50000, "v_total": 600000, "proc_mae": "150001/ 000282/ 2026", "inicio": "2026-03-01", "prazo": 12,
                "termino": "2027-03-01", "doc_base": "Contrato", "garantia": "****",
                "portaria": "Nº  (aguardando publicação)", "fiscal_pres": "DEMO Pessoa Dupla", "gestor": "DEMO Pessoa Dupla",
                "dt_assin": "2026-03-23", "dt_doerj": "2026-03-24", "dt_pncp": "2026-03-24"}'),
  -- L3: término anterior ao início (caso LIGHT)
  (v_imp, 44, '{"secretaria": "SEENEMAR", "numero": "004/2026", "contratada": "DEMO EMPRESA C", "objeto": "DEMO energia",
                "inicio": "2025-12-11", "prazo": 12, "termino": "2025-03-24", "dt_assin": "2025-12-10", "gestor": "DEMO Gestor Tres"}'),
  -- L4: demanda sem formalização (órgão e objeto apenas)
  (v_imp, 12, '{"secretaria": "SEDES", "objeto": "DEMO demanda em planejamento"}'),
  -- L5: órgão desconhecido → erro bloqueante
  (v_imp, 50, '{"secretaria": "ORGAO DEMO X", "numero": "001/2026", "objeto": "DEMO"}'),
  -- L6: duplicada da L1 no mesmo órgão → erro bloqueante (nas duas)
  (v_imp, 18, '{"secretaria": "SEDES", "numero": "901/2024", "objeto": "DEMO duplicada"}'),
  -- L7: linha vazia (mesclada)
  (v_imp, 21, '{"secretaria": null, "numero": "  "}');

  -- T-IMP-02: validação
  select * into r from public.fn_importacao_validar(v_imp);
  perform teste.ok(r.linhas = 7 and r.vazias = 1 and r.com_erro = 3, 'T-IMP-02 7 linhas: 1 vazia, 3 com erro bloqueante');
  select valores_normalizados, erros into n, e from public.importacao_linhas where importacao_id = v_imp and linha_origem = 17;
  perform teste.ok((n ->> 'orgao_id')::uuid = teste.orgao('SEDES') and n ->> 'orgao_sigla_original' = 'SEDEICS',
                   'T-IMP-02 SEDEICS normalizado para SEDES, original preservado');
  perform teste.ok(n ->> 'processo_principal' = '220001/000207/2024' and n -> 'processos_pagamento' @> '[{"exercicio": 2026}]',
                   'T-IMP-02 processos principal e de pagamento');
  perform teste.ok((n ->> 'historico_incompleto')::boolean and (n ->> 'garantia_exigida')::boolean, 'T-IMP-02 DOC. BASE "1º Aditivo" e garantia SIM');
  select valores_normalizados, erros into n, e from public.importacao_linhas where importacao_id = v_imp and linha_origem = 41;
  perform teste.ok(e @> '[{"codigo": "IMP-TERM-DIV"}]' and e @> '[{"codigo": "IMP-PESSOA-DUP"}]' and e @> '[{"codigo": "IMP-ITENS"}]'
                   and e @> '[{"codigo": "IMP-NUM-COMPL"}]' and e @> '[{"codigo": "IMP-PORTARIA"}]',
                   'T-IMP-02 avisos da linha SEENEMAR (término, pessoa dupla, itens em texto, número, portaria)');
  perform teste.ok(n -> 'garantia_exigida' = 'null'::jsonb, 'T-IMP-02 garantia "****" = não informado');
  select valores_normalizados, erros into n, e from public.importacao_linhas where importacao_id = v_imp and linha_origem = 44;
  perform teste.ok(e @> '[{"codigo": "IMP-TERM-INICIO"}]' and n -> 'termino' = 'null'::jsonb and n ->> 'termino_calculado' = '2026-12-10',
                   'T-IMP-02 término anterior ao início é descartado; vale início + prazo');
  perform teste.ok((select erros @> '[{"codigo": "IMP-DUP"}]' from public.importacao_linhas where importacao_id = v_imp and linha_origem = 18),
                   'T-IMP-02 duplicidade na mesma carga');

  -- T-IMP-03: regra de não destruição
  perform teste.erro(format($q$update public.importacao_linhas set valores_originais = '{}' where importacao_id = %L and linha_origem = 17$q$, v_imp),
                     'permission denied', 'T-IMP-03 usuário não altera o original (sem grant)');
  perform teste.sair();
  perform teste.erro(format($q$update public.importacao_linhas set valores_originais = '{}' where importacao_id = %L and linha_origem = 17$q$, v_imp),
                     'não destruição', 'T-IMP-03 nem o superusuário altera o original');
  perform teste.erro(format('delete from public.importacao_linhas where importacao_id = %L', v_imp), 'não destruição', 'T-IMP-03 linhas não são excluídas');

  -- T-IMP-04: segregação de funções
  perform teste.entrar(u_carga);
  perform teste.erro(format('select * from public.fn_importacao_aprovar(%L)', v_imp), 'Segregação', 'T-IMP-04 quem carregou não aprova');
  perform teste.sair();

  -- Linha 50 sem órgão reconhecido: só quem carregou (ou o admin) a vê e a corrige por ajuste.
  -- A linha 18, duplicada, é rejeitada com motivo.
  perform teste.entrar(u_aprov);
  perform teste.ok((select count(*) from public.importacao_linhas where importacao_id = v_imp and linha_origem = 50) = 0,
                   'T-IMP-04 linha sem órgão fica restrita a quem carregou');
  perform teste.sair();
  perform teste.entrar(u_carga);
  update public.importacao_linhas set ajustes = jsonb_build_object('orgao_id', teste.orgao('SEENEMAR'))
   where importacao_id = v_imp and linha_origem = 50;
  update public.importacao_linhas set situacao = 'rejeitada', decisao_motivo = 'DEMO duplicada da linha 17'
   where importacao_id = v_imp and linha_origem = 18;
  perform public.fn_importacao_validar(v_imp);
  perform teste.sair();
  perform teste.ok((select orgao_id = teste.orgao('SEENEMAR') and not erros @> '[{"codigo": "IMP-ORGAO"}]'
                      from public.importacao_linhas where importacao_id = v_imp and linha_origem = 50),
                   'T-IMP-04 ajuste resolve o erro de órgão sem tocar no original');
  perform teste.ok((select valores_originais ->> 'secretaria' from public.importacao_linhas where importacao_id = v_imp and linha_origem = 50) = 'ORGAO DEMO X',
                   'T-IMP-04 original intacto');

  -- T-IMP-05: aprovação por outra pessoa
  perform teste.entrar(u_aprov);
  select * into r from public.fn_importacao_aprovar(v_imp);
  perform teste.sair();
  perform teste.ok(r.contratos_criados = 5 and r.linhas_bloqueadas = 0, 'T-IMP-05 cinco linhas viram contratos (L17, L41, L44, L12, L50)');
  select contrato_id into c from public.importacao_linhas where importacao_id = v_imp and linha_origem = 17;
  perform teste.ok((select numero = '901' and historico_incompleto and doc_base_origem = '1º Aditivo' and orgao_id = teste.orgao('SEDES')
                      from public.contratos where id = c), 'T-IMP-05 contrato criado na SEDES com histórico incompleto');
  perform teste.ok((select count(*) from public.designacoes where contrato_id = c) = 2, 'T-IMP-05 fiscal e gestor (N/C ignorado)');
  perform teste.ok((select p.matricula from public.designacoes d join public.pessoas p on p.id = d.pessoa_id
                     where d.contrato_id = c and d.papel = 'fiscal') = '111', 'T-IMP-05 matrícula extraída');
  perform teste.ok((select pt.orgao_emissor_texto from public.designacoes d join public.portarias pt on pt.id = d.portaria_id
                     where d.contrato_id = c limit 1) = 'SEDECSCTI', 'T-IMP-05 emissor da portaria preservado como no ato');
  perform teste.ok((select count(*) from public.publicacoes where contrato_id = c) = 2, 'T-IMP-05 publicações DOERJ e PNCP');
  perform teste.ok((select provisorio from public.fornecedores f join public.contratos k on k.fornecedor_id = f.id where k.id = c),
                   'T-IMP-05 fornecedor provisório (sem CNPJ)');
  perform teste.ok((select count(*) from public.tarefas t join public.campanhas cp on cp.id = t.campanha_id
                     where t.contrato_id = c and t.status = 'aberta') = 1, 'T-IMP-05 coluna Y "Pendente" vira tarefa de campanha');
  select contrato_id into c from public.importacao_linhas where importacao_id = v_imp and linha_origem = 41;
  perform teste.ok((select justificativa_inicio_antes_assinatura like 'Importado da planilha%' from public.contratos where id = c),
                   'T-IMP-05 início antes da assinatura entra com justificativa automática');
  perform teste.ok((select count(*) from public.designacoes where contrato_id = c) = 2, 'T-IMP-05 pessoa dupla: duas designações (gestor e presidente)');
  select contrato_id into c from public.importacao_linhas where importacao_id = v_imp and linha_origem = 44;
  perform teste.ok((select data_fim_efetiva = '2026-12-10' and fonte_fim = 'calculada' from public.vw_contrato_vigencia where contrato_id = c),
                   'T-IMP-05 caso LIGHT: vigência calculada por início + prazo');

  -- T-IMP-06: inconsistências viram alertas
  perform public.fn_motor_alertas();
  select contrato_id into c from public.importacao_linhas where importacao_id = v_imp and linha_origem = 41;
  perform teste.ok(teste.alertas(c) @> array['DQ-TERM', 'DQ-IMPORT', 'FIS-SEG', 'DQ-CNPJ'], 'T-IMP-06 linha SEENEMAR gera DQ-TERM, DQ-IMPORT, FIS-SEG e DQ-CNPJ');
  select contrato_id into c from public.importacao_linhas where importacao_id = v_imp and linha_origem = 17;
  perform teste.ok(teste.alertas(c) @> array['DQ-HIST', 'VIG-030'], 'T-IMP-06 linha SEDES gera DQ-HIST e VIG-030');
  update public.importacao_linhas set erros_tratados_em = now() where contrato_id = c;
  perform public.fn_motor_alertas();
  perform teste.ok(not ('DQ-IMPORT' = any (teste.alertas(c))), 'T-IMP-06 marcar como tratado fecha o DQ-IMPORT');

  -- T-IMP-08: fusão de cadastros com grafia diferente
  declare pa uuid := teste.pessoa('DEMO Marcelo Souza Junior'); pb uuid := teste.pessoa('DEMO Marcelo Souza Jr'); cx uuid;
  begin
    cx := teste.contrato('SEDES', '930/2026', '2026-01-02', 12);
    perform teste.designar(cx, pa, 'gestor'); perform teste.designar(cx, pb, 'fiscal');
    perform teste.ok(exists (select 1 from public.vw_pessoas_possiveis_duplicadas where pessoa_a in (pa, pb) and pessoa_b in (pa, pb)),
                     'T-IMP-08 grafias parecidas aparecem para revisão');
    perform teste.entrar(u_aprov);
    perform public.fn_fundir_pessoas(pa, pb, 'DEMO mesma pessoa, grafia abreviada');
    perform teste.sair();
    perform teste.ok((select count(distinct pessoa_id) from public.designacoes where contrato_id = cx) = 1
                     and (select deleted_at is not null from public.pessoas where id = pb), 'T-IMP-08 designações passam para um cadastro; o outro é inativado');
  end;

  -- T-IMP-07: o mesmo arquivo não entra duas vezes
  perform teste.entrar(u_carga);
  perform teste.erro($q$insert into public.importacoes (arquivo_nome, arquivo_sha256, data_referencia) values ('DEMO de novo.xlsx', repeat('a', 64), '2026-09-25')$q$,
                     'importacoes_arquivo_uk', 'T-IMP-07 arquivo repetido é recusado');
  perform teste.sair();
end $$;

rollback;
