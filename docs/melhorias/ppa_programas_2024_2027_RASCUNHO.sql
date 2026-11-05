-- RASCUNHO — NÃO EXECUTAR SEM AUTORIZAÇÃO DO USUÁRIO
-- Programas do PPA 2024–2027 (lista enviada pelo usuário em 05/11/2026): 37 programas
--   ordem 1–25  Poder Executivo – programas finalísticos
--   ordem 26–32 Poder Executivo – programas de gestão
--   ordem 33–37 Outros Poderes e órgãos autônomos
-- Grava em ppa_loa_ref (tipo 'programa'), filho do ciclo 2024-2027 (pai_id), com a lei do ciclo.
-- Pode ser rodado mais de uma vez: só insere o código que ainda não existe no ciclo.
-- Não altera nenhum projeto nem a estrutura do banco.
begin;

with ciclo as (
  select id, lei from public.ppa_loa_ref where tipo = 'ppa_ciclo' and codigo = '2024-2027'
), novos(codigo, nome, ordem) as (values
  ('442', 'Ensino Superior', 1),
  ('443', 'Educação Básica', 2),
  ('450', 'Gestão do SUAS, Proteção Social e Redução da Pobreza', 3),
  ('452', 'Desenvolvimento do Turismo', 4),
  ('455', 'Desenvolvimento Agropecuário, Pesqueiro e Aquícola Sustentável', 5),
  ('466', 'Prevenção ao Uso de Drogas', 6),
  ('467', 'Segurança Alimentar e Nutricional', 7),
  ('474', 'Delegação e Regulação de Serviços Públicos', 8),
  ('478', 'Prevenção à Violência e Combate à Criminalidade', 9),
  ('479', 'Segurança no Trânsito', 10),
  ('480', 'Direitos do Consumidor', 11),
  ('494', 'Meio Ambiente e Sustentabilidade', 12),
  ('495', 'Ciência, Tecnologia e Inovação', 13),
  ('496', 'Resiliência, Redução de Risco, Resposta e Recuperação em Desastres e Emergências', 14),
  ('497', 'Emprego, Renda e Formação para o Mercado de Trabalho', 15),
  ('498', 'Direitos Humanos e Cidadania', 16),
  ('499', 'Investimentos e Desenvolvimento Econômico', 17),
  ('501', 'Esporte e Lazer', 18),
  ('502', 'Política Habitacional e Regularização Fundiária', 19),
  ('506', 'Sistema Prisional e Ressocialização dos Custodiados', 20),
  ('507', 'Fortalecimento das Políticas Públicas para Mulheres', 21),
  ('508', 'Estratégia e Gestão da Saúde', 22),
  ('509', 'Oferta de Bens Culturais e Fomento à Cultura', 23),
  ('510', 'Mobilidade Sustentável', 24),
  ('512', 'Desenvolvimento Territorial', 25),
  ('434', 'Gestão do Patrimônio Imóvel', 26),
  ('470', 'Fortalecimento da Gestão Pública', 27),
  ('472', 'Gestão Previdenciária', 28),
  ('473', 'Gestão Tributária', 29),
  ('475', 'Transparência, Controle Interno e Integridade na Gestão Pública', 30),
  ('493', 'Gestão de Tecnologia da Informação e Governo Digital', 31),
  ('513', 'Defesa dos Interesses do Estado', 32),
  ('027', 'Defesa da Ordem Jurídica', 33),
  ('136', 'Gestão Legislativa', 34),
  ('137', 'Controle Externo', 35),
  ('141', 'Efetividade da Prestação Jurisdicional', 36),
  ('515', 'Promoção do Acesso à Justiça e à Cidadania', 37)
)
insert into public.ppa_loa_ref (tipo, pai_id, codigo, nome, lei, ordem, ativo)
select 'programa', c.id, n.codigo, n.nome, c.lei, n.ordem, true
from novos n cross join ciclo c
where not exists (
  select 1 from public.ppa_loa_ref r
  where r.tipo = 'programa' and r.pai_id = c.id and r.codigo = n.codigo
);

-- Conferência: deve mostrar 37
select count(*) as programas_do_ciclo
from public.ppa_loa_ref r join public.ppa_loa_ref c on c.id = r.pai_id
where r.tipo = 'programa' and c.tipo = 'ppa_ciclo' and c.codigo = '2024-2027';

commit;
