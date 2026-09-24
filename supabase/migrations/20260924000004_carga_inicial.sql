-- =============================================================================
-- Migration 04 · Carga inicial
--   · 5 etapas, 6 modalidades, 32 atividades (GT FAETEC — Caminho Crítico)
--   · 15 integrantes do GT + 1 administrador do sistema
--   · listas suspensas do painel, áreas demandantes, feriados 2026–2027
--   · atas e as 17 demandas da planilha de andamento do GT
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Etapas
-- -----------------------------------------------------------------------------
insert into public.etapas (numero, nome, macroprocesso, macroprocesso_nome, equipe, perfil_executor, frente_executora, ponto_atencao, base_legal) values
(1, 'Planejamento da contratação', 1, 'Fase preparatória · Planejamento da contratação',
    'FAETEC/DGI · GT · FAETEC/VPA', 'Elaboração de artefatos · Frente II', 'II',
    'PCA/PEDTIC a confirmar — se ausente, exige justificativa técnica e revisão extraordinária',
    'Decreto 48.816/2023 · IN PRODERJ/PRE 05/2024'),
(2, 'Adesão à ARP', 2, 'Seleção e precificação da solução',
    'GT · FAETEC/Div. Planejamento · FAETEC/DGI', 'Elaboração de artefatos · Frente II', 'II',
    'Gate: ata válida — sem ata válida com adesão possível, o fluxo de ARP é interrompido',
    'Decreto 48.843/2023 · Enunciado 27 PGE-RJ'),
(3, 'Comunicações e análises', 2, 'Seleção e precificação da solução',
    'FAETEC', 'Ponto focal FAETEC · Frente III', 'III',
    'SEPLAG 15 dias corridos · PRODERJ 20 dias úteis (+20)',
    'Decreto 48.821/2023 (art. 2º) · IN PRODERJ/PRE 05/2024 (art. 4º)'),
(4, 'Pesquisa de preços', 2, 'Seleção e precificação da solução',
    'FAETEC (100%)', 'Ponto focal FAETEC', 'III',
    'Sem ponto focal nomeado na Relação de Participantes',
    'Decreto 48.843/2023 · Enunciado 27 PGE-RJ'),
(5, 'Formalização e publicidade', 3, 'Fase contratual · Formalização e publicidade do contrato',
    'FAETEC (100%)', 'Ponto focal FAETEC', 'III',
    'CGE 15 dias corridos · sem ponto focal nomeado na Relação de Participantes',
    'Decreto 48.821/2023 · Lei 14.133/2021 (PNCP)');

-- -----------------------------------------------------------------------------
-- Modalidades (enquadramento)
-- -----------------------------------------------------------------------------
insert into public.modalidades (codigo, nome, descricao, etapas, ordem) values
('adesao_arp',        'Adesão à ARP',        'Carona em ata de outro órgão · fluxo completo',                         '{1,2,3,4,5}', 1),
('participante_rp',   'Participante de RP',  'FAETEC participa da ata (ex.: PRODERJ) e usa o ETP do gerenciador',     '{1,3,4,5}',   2),
('dispensa',          'Dispensa',            'Art. 75 da Lei 14.133/2021 · sem Etapa II',                              '{1,3,4,5}',   3),
('inexigibilidade',   'Inexigibilidade',     'Art. 74 da Lei 14.133/2021 · sem Etapa II',                              '{1,3,4,5}',   4),
('licitacao_propria', 'Licitação própria',   'Fase externa ainda não mapeada no fluxo do GT',                          '{1,3,4,5}',   5),
('a_definir',         'A definir',           'Gera só a Etapa I até o enquadramento',                                  '{1}',         6);

-- -----------------------------------------------------------------------------
-- 32 atividades do caminho crítico
-- -----------------------------------------------------------------------------
insert into public.atividades_modelo
  (etapa, ordem, nome, tipo_prazo, prazo_dias, prorrogacao_dias, prazo_critico, ponto_atencao, gate, base_legal, reaproveitada_em) values
-- Etapa I · Planejamento da contratação (7)
(1, 1, 'Identificação da demanda',           null, null, null, false, null, false, null, '{}'),
(1, 2, 'Inclusão no PCA / PEDTIC',           null, null, null, false, 'Se ausente do PEDTIC: exige justificativa técnica e revisão extraordinária', false, 'Decreto 48.816/2023', '{}'),
(1, 3, 'Elaboração do DOD',                  null, null, null, false, null, false, null, '{}'),
(1, 4, 'Elaboração do ETP',                  null, null, null, false, null, false, 'IN PRODERJ/PRE 05/2024', '{participante_rp}'),
(1, 5, 'Elaboração do TR',                   null, null, null, false, null, false, null, '{}'),
(1, 6, 'Mapa de Riscos',                     null, null, null, false, null, false, null, '{}'),
(1, 7, 'Aprovação e autorização (VPA)',      null, null, null, false, null, false, null, '{}'),
-- Etapa II · Adesão à ARP (6)
(2, 1, 'Anuência do órgão gerenciador',      null, null, null, false, null, false, 'Decreto 48.843/2023', '{}'),
(2, 2, 'Anuência do fornecedor',             null, null, null, false, null, false, 'Decreto 48.843/2023', '{}'),
(2, 3, 'Verificação de ata válida',          null, null, null, false, 'Gate: sem ata válida com adesão possível, o fluxo de ARP é interrompido', true, 'Decreto 48.843/2023', '{}'),
(2, 4, 'Inserção dos documentos da ARP',     null, null, null, false, null, false, null, '{}'),
(2, 5, 'Compatibilidade do objeto',          null, null, null, false, null, false, null, '{}'),
(2, 6, 'Justificativa de vantajosidade',     null, null, null, false, null, false, 'Enunciado 27 PGE-RJ', '{}'),
-- Etapa III · Comunicações e análises prévias (3)
(3, 1, 'Comunicação à SEPLAG',               'corridos', 15, null, true, 'Prazo: 15 dias corridos', false, 'Decreto 48.821/2023 (art. 2º)', '{}'),
(3, 2, 'Análise técnica do PRODERJ (TIC)',   'uteis',    20, 20,   true, 'Prazo: 20 dias úteis, prorrogáveis por até +20', false, 'IN PRODERJ/PRE 05/2024 (art. 4º)', '{}'),
(3, 3, 'Registro no Contratos.gov.br',       null, null, null, false, null, false, null, '{}'),
-- Etapa IV · Pesquisa de preços (7)
(4, 1, 'Pesquisa de preços no SIGA',         null, null, null, false, null, false, 'Decreto 48.843/2023', '{}'),
(4, 2, 'Relatório Analítico (RAPP)',         null, null, null, false, null, false, null, '{}'),
(4, 3, 'Ateste do setor técnico',            null, null, null, false, null, false, null, '{}'),
(4, 4, 'Checklist PGE',                      null, null, null, false, null, false, 'Enunciado 27 PGE-RJ', '{}'),
(4, 5, 'Aprovação da pesquisa (SIGA)',       null, null, null, false, null, false, null, '{}'),
(4, 6, 'Disponibilidade orçamentária',       null, null, null, false, null, false, null, '{}'),
(4, 7, 'Declaração do ordenador de despesas',null, null, null, false, null, false, null, '{}'),
-- Etapa V · Formalização e publicidade do contrato (9)
(5, 1, 'Documentos de habilitação',          null, null, null, false, null, false, null, '{}'),
(5, 2, 'Minuta do contrato',                 null, null, null, false, null, false, null, '{}'),
(5, 3, 'Análise jurídica',                   null, null, null, false, null, false, null, '{}'),
(5, 4, 'Nota de auditoria (UCI)',            null, null, null, false, null, false, null, '{}'),
(5, 5, 'Análise da CGE',                     'corridos', 15, null, true, 'Prazo: 15 dias corridos', false, 'Decreto 48.821/2023', '{}'),
(5, 6, 'Empenho',                            null, null, null, false, null, false, null, '{}'),
(5, 7, 'Assinatura do contrato',             null, null, null, false, null, false, null, '{}'),
(5, 8, 'Publicação (D.O. / PNCP)',           null, null, null, false, null, false, 'Lei 14.133/2021 (PNCP)', '{}'),
(5, 9, 'Cadastro e-TCE (SIGFIS)',            null, null, null, false, null, false, null, '{}');

-- -----------------------------------------------------------------------------
-- Listas suspensas do painel
-- -----------------------------------------------------------------------------
insert into public.opcoes_lista (lista, valor, ordem, cor) values
('situacao', 'Em instrução',        1, 'azul'),
('situacao', 'Em andamento',        2, 'ouro'),
('situacao', 'Aguardando',          3, 'cinza'),
('situacao', 'Devolvida',           4, 'vermelho'),
('situacao', 'Divergência',         5, 'vermelho'),
('situacao', 'Sem justificativa',   6, 'vermelho'),
('situacao', 'Suspensa',            7, 'cinza'),
('situacao', 'Concluída',           8, 'verde'),
('situacao', 'Cancelada',           9, 'cinza'),

('dod_status', 'Não iniciado',      1, 'cinza'),
('dod_status', 'Em Elaboração',     2, 'ouro'),
('dod_status', 'Em Análise',        3, 'ouro'),
('dod_status', 'Elaborado',         4, 'verde'),
('dod_status', 'Devolvido',         5, 'vermelho'),

('ata_status', 'SIM',               1, 'verde'),
('ata_status', 'PARTICIPE',         2, 'azul'),
('ata_status', 'NÃO',               3, 'vermelho'),
('ata_status', 'EM PESQUISA',       4, 'ouro'),
('ata_status', 'NÃO SE APLICA',     5, 'cinza'),

('ti_status', 'SIM',                1, 'verde'),
('ti_status', 'NÃO',                2, 'vermelho'),
('ti_status', 'EM ANÁLISE',         3, 'ouro'),
('ti_status', 'NÃO SE APLICA',      4, 'cinza'),

('ti_obs', 'Aguardando envio',      1, 'cinza'),
('ti_obs', 'Em análise',            2, 'ouro'),
('ti_obs', 'De acordo',             3, 'verde'),
('ti_obs', 'Com ressalvas',         4, 'ouro'),
('ti_obs', 'Devolvido',             5, 'vermelho'),

('docs_prep_status', 'Não iniciado',                                    1, 'cinza'),
('docs_prep_status', 'Elaboração do ETP',                               2, 'ouro'),
('docs_prep_status', 'Utilização do ETP do PRODERJ – FAETEC participante da Ata.', 3, 'azul'),
('docs_prep_status', 'ETP concluído',                                   4, 'verde'),
('docs_prep_status', 'Elaboração do TR',                                5, 'ouro'),
('docs_prep_status', 'Elaboração do Mapa de Riscos',                    6, 'ouro'),
('docs_prep_status', 'Fase preparatória concluída',                     7, 'verde'),

('origem_estimativa', 'Ata de registro de preços', 1, null),
('origem_estimativa', 'Pesquisa prévia de mercado', 2, null),
('origem_estimativa', 'Histórico de contratações', 3, null),
('origem_estimativa', 'Painel de preços / SIGA',   4, null),

('tipo_documento', 'Justificativa da área técnica', 1, null),
('tipo_documento', 'DOD',                           2, null),
('tipo_documento', 'ETP',                           3, null),
('tipo_documento', 'Termo de Referência',           4, null),
('tipo_documento', 'Mapa de Riscos',                5, null),
('tipo_documento', 'Especificação técnica',         6, null),
('tipo_documento', 'Ata de registro de preços',     7, null),
('tipo_documento', 'Anuência',                      8, null),
('tipo_documento', 'Pesquisa de preços / RAPP',     9, null),
('tipo_documento', 'Manifestação / Parecer',       10, null),
('tipo_documento', 'Minuta / Contrato',            11, null),
('tipo_documento', 'Publicação',                   12, null),
('tipo_documento', 'Planilha de controle',         13, null),
('tipo_documento', 'Outro',                        14, null);

-- -----------------------------------------------------------------------------
-- Áreas demandantes (editáveis em Manutenção)
-- -----------------------------------------------------------------------------
insert into public.areas_demandantes (nome, sigla) values
('Diretoria de Desenvolvimento da Educação Básica e Técnica', 'DDEBT'),
('Administração',                                             'ADM'),
('Diretoria de Gestão da Informação · Divisão de TI',         'DGI'),
('Divisão de Planejamento',                                   'DIPLAN'),
('Vice-Presidência Administrativa',                           'VPA');

-- -----------------------------------------------------------------------------
-- Feriados (nacionais, estaduais RJ e municipais Rio) · editáveis em Manutenção
-- -----------------------------------------------------------------------------
insert into public.feriados (data, descricao) values
('2026-01-01', 'Confraternização Universal'),
('2026-01-20', 'São Sebastião (Município do Rio)'),
('2026-02-16', 'Carnaval (ponto facultativo)'),
('2026-02-17', 'Carnaval'),
('2026-04-03', 'Paixão de Cristo'),
('2026-04-21', 'Tiradentes'),
('2026-04-23', 'São Jorge (RJ)'),
('2026-05-01', 'Dia do Trabalho'),
('2026-06-04', 'Corpus Christi (ponto facultativo)'),
('2026-09-07', 'Independência do Brasil'),
('2026-10-12', 'Nossa Senhora Aparecida'),
('2026-10-28', 'Dia do Servidor Público (ponto facultativo)'),
('2026-11-02', 'Finados'),
('2026-11-15', 'Proclamação da República'),
('2026-11-20', 'Dia Nacional de Zumbi e da Consciência Negra'),
('2026-12-25', 'Natal'),
('2027-01-01', 'Confraternização Universal'),
('2027-01-20', 'São Sebastião (Município do Rio)'),
('2027-02-08', 'Carnaval (ponto facultativo)'),
('2027-02-09', 'Carnaval'),
('2027-03-26', 'Paixão de Cristo'),
('2027-04-21', 'Tiradentes'),
('2027-04-23', 'São Jorge (RJ)'),
('2027-05-01', 'Dia do Trabalho'),
('2027-05-27', 'Corpus Christi (ponto facultativo)'),
('2027-09-07', 'Independência do Brasil'),
('2027-10-12', 'Nossa Senhora Aparecida'),
('2027-10-28', 'Dia do Servidor Público (ponto facultativo)'),
('2027-11-02', 'Finados'),
('2027-11-15', 'Proclamação da República'),
('2027-11-20', 'Dia Nacional de Zumbi e da Consciência Negra'),
('2027-12-25', 'Natal');

-- -----------------------------------------------------------------------------
-- Equipe do GT (Relação de Participantes · 15 integrantes · 4 órgãos)
-- E-mails ficam em branco: o administrador informa em Manutenção › Integrantes
-- e cada pessoa faz o 1º acesso com o e-mail cadastrado.
-- -----------------------------------------------------------------------------
insert into public.integrantes (nome, orgao, frente, funcao, papel, modelo_trabalho, membro_gt, email) values
('Administrador do sistema',              'FAETEC',  null,  'Administração do sistema',                              'admin',        'Presencial', false, 'admin@gtpropag.local'),
-- Frente I · Coordenação, aprovação e conformidade
('Karina Ferrarez',                       'SEDES',   'I',   'Coordenação Equipe SEDES',                              'coordenacao',  'Híbrido',    true,  null),
('Vinicius Murat',                        'FAETEC',  'I',   'Coordenação Equipe FAETEC',                             'coordenacao',  'Presencial', true,  null),
('Cristiane Vaz dos Santos Aguiar',       'SECTI',   'I',   'Coordenação e aprovação dos artefatos',                 'coordenacao',  'Presencial', true,  null),
('Elias Conceição Magalhães',             'SEDES',   'I',   'Conformidade dos artefatos',                            'conformidade', 'Híbrido',    true,  null),
-- Frente II · Pesquisa e elaboração de artefatos
('Andressa Borges Santos',                'SEDES',   'II',  'Pesquisa e elaboração de artefatos',                    'elaboracao',   'Presencial', true,  null),
('Allana Verediano dos Santos',           'SEDES',   'II',  'Pesquisa e elaboração de artefatos',                    'elaboracao',   'Presencial', true,  null),
('Taina',                                 'SEDES',   'II',  'Pesquisa e elaboração de artefatos',                    'elaboracao',   'Presencial', true,  null),
('Thamyres de Fátima Macedo Fernandes',   'SECTI',   'II',  'Pesquisa e elaboração de artefatos',                    'elaboracao',   'Presencial', true,  null),
('Pascoal',                               'SECTI',   'II',  'Pesquisa atas TI',                                      'elaboracao',   'Híbrido',    true,  null),
('Mara',                                  'PRODERJ', 'II',  'Pesquisa e elaboração de artefatos',                    'elaboracao',   'Presencial', true,  null),
('Thailane Gama',                         'PRODERJ', 'II',  'Pesquisa e elaboração de artefatos',                    'elaboracao',   'Presencial', true,  null),
('Marco Andrade',                         'PRODERJ', 'II',  'Pesquisa e elaboração de artefatos',                    'elaboracao',   'Presencial', true,  null),
-- Frente III · Pontos focais e lançamento nos sistemas
('Jhonatan Silva Santos',                 'FAETEC',  'III', 'Ponto Focal PCA | Lançamento dados Sistemas',           'ponto_focal',  'Presencial', true,  null),
('Gibson Cruz da Silva',                  'FAETEC',  'III', 'Chefe de Divisão de TI | Lançamento dados Sistemas',    'ponto_focal',  'Presencial', true,  null),
('Luene Fernandes Curvello d''Ávila',     'FAETEC',  'III', 'Ponto Focal Documentos | Lançamento dados Sistemas',    'ponto_focal',  'Presencial', true,  null);

-- -----------------------------------------------------------------------------
-- Atas de registro de preços citadas na planilha
-- -----------------------------------------------------------------------------
insert into public.atas (numero, orgao_gerenciador, objeto, forma_uso, observacao) values
('ARP 032/2026',       'SEAD/MA (Governo do Maranhão)', 'Equipamentos de informática – Chromebooks',     'Adesão',       null),
('ARP 147/2024',       'CELIC/RS',                      'Licenciamento de softwares de edição e arquitetura', 'Adesão',  'Divergência: DOD cita ARP 147/2024 e a planilha cita ARP 1477/2024. Validar o número.'),
('PE-RP 012/2024',     'PRODERJ',                       'Telefonia VoIP',                                 'Participante', null),
('PERP 12/25',         'PRODERJ',                       'Licenciamento de softwares Microsoft',           'Participante', 'ARP PRODERJ em fase de assinatura e publicação.'),
('ARP 02/2026',        'TJMA',                          'Licenças de antivírus com tecnologia EDR',       'Adesão',       null),
('PE-RP 016/2024',     'PRODERJ',                       'Appliances para backup',                         'Adesão',       null);

-- -----------------------------------------------------------------------------
-- 17 demandas de TI (PLANILHA ANDAMENTO GT)
-- -----------------------------------------------------------------------------
insert into public.contratacoes
  (numero, titulo, objeto, categoria, solucao_tic, processo_sei_origem, processo_sei, justificativa_recebida,
   valor_estimado, modalidade, ata_id, via_descricao, nenhuma_ata_compativel, situacao, prioridade,
   dod_status, dod_obs, ata_status, ata_obs, ti_status, ti_obs, docs_prep_status, docs_prep_obs,
   divergencia_obs, ultimo_andamento, observacao, area_demandante_id)
select v.numero, v.titulo, v.objeto, v.categoria, true, v.sei_origem, v.sei, v.justificativa,
       v.valor, v.modalidade, (select id from public.atas a where a.numero = v.ata), v.via, v.sem_ata, v.situacao, v.prioridade,
       v.dod_status, v.dod_obs, v.ata_status, v.ata_obs, v.ti_status, v.ti_obs, v.docs_status, v.docs_obs,
       v.divergencia, v.ultimo, v.obs,
       case when v.justificativa then (select id from public.areas_demandantes where sigla = 'DDEBT') end
from (values
 (1, 'Chromebooks',
     'Contratação para aquisição de equipamentos de informática – Chromebooks, visando atender às necessidades da FAETEC',
     'Bem', 'SEI-260005/007702/2026', 'SEI-260005/008719/2026', true, 64818000.00::numeric,
     'adesao_arp', 'ARP 032/2026', 'ARP 032/2026 · SEAD/MA', false, 'Em andamento', 'Alta',
     'Elaborado', 'Pretende-se atender à demanda por meio de adesão à ARP nº 032/2026 – SEAD/MA (Governo do Maranhão).',
     'SIM', 'Ata de Registro de Preços do Governo do Maranhão - SEAD /032/2026',
     'EM ANÁLISE', 'Em análise - Gibson', 'Elaboração do ETP', 'Não consta ID SIGA cadastrado para esta especificação',
     null::text, null::text,
     'Foi verificado junto à empresa que há a viabilidade de adesão, porém, necessita da análise pela área demandante das questões técnicas e operacionais como entrega, etc.'),
 (2, 'Softwares de edição e arquitetura',
     'Contratação de licenciamento de softwares de edição e arquitetura, visando atender às necessidades da FAETEC',
     'Serviço', 'SEI-260005/007249/2026', 'SEI-260005/008711/2026', true, 1304100.00,
     'adesao_arp', 'ARP 147/2024', 'ARP CELIC/RS · nº a confirmar', false, 'Divergência', 'Média',
     'Elaborado', 'Pretende-se utilizar a ARP nº 147/2024 – CELIC/RS.',
     'SIM', 'ATA DE REGISTRO DE PREÇOS - CELIC - RS - ARP 1477/2024',
     'EM ANÁLISE', 'Em análise - Gibson', 'Elaboração do ETP', 'Não consta ID SIGA cadastrado para esta especificação',
     'Nº da ARP diverge entre DOD (147/2024) e registro da ata (1477/2024).', null,
     'Foi verificado junto à empresa que há a viabilidade de adesão, porém, necessita da análise pela área demandante das questões técnicas e operacionais como entrega, etc.'),
 (3, 'Telefonia VoIP',
     'Contratação de telefonia VoIP, visando atender às necessidades da FAETEC',
     'Serviço', null, null, true, null,
     'participante_rp', 'PE-RP 012/2024', 'PE-RP 012/2024 · PRODERJ', false, 'Em andamento', 'Média',
     'Elaborado', 'Pretende-se participar da futura contratação vinculada ao Registro de Preços PE-RP nº 012/2024.',
     'PARTICIPE', 'REGISTRO DE PREÇOS – PE-RP Nº 012/2024',
     'SIM', 'De acordo', 'Utilização do ETP do PRODERJ – FAETEC participante da Ata.', null,
     null, 'Justificativa organizada pela FAETEC via Administração + Diretoria de Desenvolvimento da Educação Básica e Técnica',
     'Enviado para análise - Luene'),
 (4, 'Câmeras de segurança',
     'Contratação de serviço de instalação e fornecimento de câmera de segurança, visando atender às necessidades da FAETEC',
     'Ambos', null, null, true, null,
     'a_definir', null, 'Sem ata compatível', true, 'Devolvida', 'Média',
     'Em Elaboração', 'Não foi identificada, até o momento, Ata de Registro de Preços compatível com o objeto. Será realizada nova pesquisa de Atas.',
     'NÃO', 'Necessária pesquisa de Ata de Registro de Preços vigente e compatível com o objeto.',
     'NÃO', 'Aguardando envio', null, null,
     null, 'Devolvido à área técnica para análise do quantitativo e dos itens a serem contratados',
     'Justificativa carece de elementos da pretensa contratação'),
 (5, 'Tela interativa',
     'Contratação de tela interativa, visando atender às necessidades da FAETEC',
     'Bem', null, null, true, null,
     'a_definir', null, 'Nenhuma ata com o quantitativo', true, 'Aguardando', 'Média',
     'Em Elaboração', 'Não foi identificada, até o momento, Ata de Registro de Preços compatível com o objeto. Será realizada nova pesquisa de Atas.',
     'NÃO', 'Necessária pesquisa de Ata de Registro de Preços vigente e compatível com o objeto.',
     'NÃO', 'Aguardando envio', null, null,
     null, 'Justificativa organizada pela FAETEC via Administração + Diretoria de Desenvolvimento da Educação Básica e Técnica',
     'Nenhuma ATA com o quantitativo solicitado'),
 (6, 'Link de internet',
     'Contratação de link de internet, visando atender às necessidades da FAETEC',
     'Serviço', null, null, true, null,
     'dispensa', null, 'Art. 75 · Lei 14.133/2021', false, 'Devolvida', 'Média',
     'Em Elaboração', 'Não foi identificada, até o momento, Ata de Registro de Preços compatível com o objeto. Será realizada nova pesquisa de Atas.',
     'NÃO', 'DISPENSA ART. 75 DA 14.133',
     'NÃO', 'Aguardando envio', 'Elaboração do ETP', null,
     null, 'Devolvido à área técnica para análise do quantitativo e dos itens a serem contratados',
     'Justificativa carece de elementos da pretensa contratação'),
 (7, 'Licenças Microsoft',
     'Contratação de licenciamento de softwares da Microsoft, visando atender às necessidades da FAETEC',
     'Serviço', null, null, true, null,
     'participante_rp', 'PERP 12/25', 'PERP 12/25 · PRODERJ', false, 'Aguardando', 'Média',
     'Elaborado', 'Pretende-se atender à demanda mediante participação no PERP 12/25 – Microsoft.',
     'PARTICIPE', 'PERP12/25 - MICROSOFT',
     'NÃO', 'Aguardando envio', 'Utilização do ETP do PRODERJ – FAETEC participante da Ata.', null,
     null, 'DOD elaborado com base na justificativa enviada pela área técnica',
     'ARP PRODERJ em fase de assinatura e publicação'),
 (8, 'Antivírus com EDR',
     'Contratação de licenças de software antivírus com tecnologia EDR, visando atender às necessidades da FAETEC',
     'Serviço', null, null, true, null,
     'adesao_arp', 'ARP 02/2026', 'ARP 02/2026 · TJMA', false, 'Em andamento', 'Média',
     'Em Elaboração', 'Pretende-se atender à demanda por adesão - ARP 02/2026 TJMA',
     'SIM', 'ADESÃO - ARP 02/2026 TJMA',
     'NÃO', 'Aguardando envio', null, null,
     null, 'Justificativa organizada pela FAETEC via Administração + Diretoria de Desenvolvimento da Educação Básica e Técnica',
     'Recebido 18/10'),
 (9, 'Computadores e monitores',
     'Contratação de computadores básicos, avançados e monitor, visando atender às necessidades da FAETEC',
     'Bem', null, null, true, null,
     'a_definir', null, 'Sem ata compatível', true, 'Em andamento', 'Média',
     'Em Análise', 'Não foi identificada, até o momento, Ata de Registro de Preços compatível com o objeto. Será realizada nova pesquisa de Atas.',
     'NÃO', 'Necessária pesquisa de Ata de Registro de Preços vigente e compatível com o objeto.',
     'NÃO', 'Aguardando envio', null, null,
     null, 'Justificativa organizada pela FAETEC via Administração + Diretoria de Desenvolvimento da Educação Básica e Técnica',
     'Recebido 18/10'),
 (10, 'Appliances para backup',
     'Contratação de appliances para backup, visando atender às necessidades da FAETEC',
     'Bem', 'SEI-260005/008219/2026', 'SEI-260005/008712/2026', true, 3559045.11,
     'adesao_arp', 'PE-RP 016/2024', 'PE-RP 016/2024 · PRODERJ', false, 'Aguardando', 'Média',
     'Elaborado', 'Pretende-se atender à demanda por adesão - PE-RP Nº 016/2024 PRODERJ',
     'SIM', 'ADESÃO - PE-RP Nº 016/2024 PRODERJ',
     'NÃO', 'Aguardando envio', null, null,
     null, 'Justificativa organizada pela FAETEC via Administração + Diretoria de Desenvolvimento da Educação Básica e Técnica',
     'Recebido 18/10'),
 (11, 'Switch top of rack', 'Contratação de Switch top of rack, visando atender às necessidades da FAETEC',
     'Bem', null, null, false, null, 'a_definir', null, null, false, 'Sem justificativa', 'Média',
     null, null, null, null, null, null, null, null, null, null, 'SEM JUSTIFICATIVA NO DRIVE'),
 (12, 'Firewall', 'Contratação de Firewall, visando atender às necessidades da FAETEC',
     'Bem', null, null, false, null, 'a_definir', null, null, false, 'Sem justificativa', 'Média',
     null, null, null, null, null, null, null, null, null, null, 'SEM JUSTIFICATIVA NO DRIVE'),
 (13, 'Servidor hiperconvergente', 'Contratação de Servidor Hiperconvergente, visando atender às necessidades da FAETEC',
     'Bem', null, null, false, null, 'a_definir', null, 'Consta ata e aceite (sem registro)', false, 'Divergência', 'Média',
     null, null, null, null, null, null, null, null,
     'Planilha informa que já há ata e aceite das partes, mas não há registro da ata nem da justificativa. Validar informação.',
     null, 'JÁ TEM ATA E ACEITE DAS PARTES'),
 (14, 'Rack 19U', 'Contratação de Rack 19U, visando atender às necessidades da FAETEC',
     'Bem', null, null, false, null, 'a_definir', null, null, false, 'Sem justificativa', 'Média',
     null, null, null, null, null, null, null, null, null, null, 'SEM JUSTIFICATIVA NO DRIVE'),
 (15, 'Pontos lógicos', 'Contratação de Pontos Lógicos, visando atender às necessidades da FAETEC',
     'Serviço', null, null, false, null, 'a_definir', null, null, false, 'Sem justificativa', 'Média',
     null, null, null, null, null, null, null, null, null, null, 'SEM JUSTIFICATIVA NO DRIVE'),
 (16, 'Telefonia móvel', 'Contratação de Telefonia móvel (celular), visando atender às necessidades da FAETEC',
     'Serviço', null, null, false, null, 'a_definir', null, null, false, 'Sem justificativa', 'Média',
     null, null, null, null, null, null, null, null, null, null, 'SEM JUSTIFICATIVA NO DRIVE'),
 (17, 'Switch core', 'Contratação de Switch Core, visando atender às necessidades da FAETEC',
     'Bem', null, null, false, null, 'a_definir', null, null, false, 'Sem justificativa', 'Média',
     null, null, null, null, null, null, null, null, null, null, 'SEM JUSTIFICATIVA NO DRIVE')
) as v(numero, titulo, objeto, categoria, sei_origem, sei, justificativa, valor,
       modalidade, ata, via, sem_ata, situacao, prioridade,
       dod_status, dod_obs, ata_status, ata_obs, ti_status, ti_obs, docs_status, docs_obs,
       divergencia, ultimo, obs);

-- -----------------------------------------------------------------------------
-- Estado das atividades da Etapa I conforme a planilha
-- (checklist foi gerado pelo trigger; aqui só refletimos o andamento já existente)
-- -----------------------------------------------------------------------------
alter table public.atividades disable trigger trg_atividade_depois_gravar;

-- Identificação da demanda: concluída quando há justificativa da área
update public.atividades a set status = 'concluida', data_conclusao = null
  from public.contratacoes c
 where c.id = a.contratacao_id and a.nome = 'Identificação da demanda' and c.justificativa_recebida;

-- DOD
update public.atividades a
   set status = case c.dod_status
                  when 'Elaborado' then 'concluida'
                  when 'Em Análise' then 'aguardando'
                  else case when c.situacao = 'Devolvida' then 'devolvida' else 'em_andamento' end
                end
  from public.contratacoes c
 where c.id = a.contratacao_id and a.nome = 'Elaboração do DOD' and c.dod_status is not null;

-- ETP em elaboração
update public.atividades a set status = 'em_andamento'
  from public.contratacoes c
 where c.id = a.contratacao_id and a.nome = 'Elaboração do ETP' and c.docs_prep_status = 'Elaboração do ETP'
   and a.status = 'pendente';

-- Responsáveis já identificados na planilha
update public.atividades a set responsavel_id = (select id from public.integrantes where nome = 'Gibson Cruz da Silva')
  from public.contratacoes c
 where c.id = a.contratacao_id and c.numero in (1, 2) and a.nome = 'Elaboração do ETP';

update public.atividades a
   set responsavel_id = (select id from public.integrantes where nome like 'Luene%'),
       status = 'aguardando',
       observacao = 'Justificativa enviada para análise'
  from public.contratacoes c
 where c.id = a.contratacao_id and c.numero = 3 and a.nome = 'Inclusão no PCA / PEDTIC';

alter table public.atividades enable trigger trg_atividade_depois_gravar;

-- Registro histórico da carga
insert into public.andamentos (contratacao_id, tipo, texto)
select id, 'sistema', 'Demanda importada da PLANILHA ANDAMENTO GT (carga inicial).' from public.contratacoes;
