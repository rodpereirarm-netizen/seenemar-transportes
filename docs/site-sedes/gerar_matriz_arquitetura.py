"""Matriz de Arquitetura da Informação (mapa do site) do novo site da SEDES, a partir da Maquete 2."""
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.drawing.image import Image as XLImage
from openpyxl.utils import get_column_letter

OUT, BRASAO = sys.argv[1], sys.argv[2]
NAVY, BLUE, CYAN, LIGHT, YELLOW, GREY = '0A2252', '1E88E5', '5CC3F7', 'EEF5FD', 'FFF4C2', '5B6B84'
F = 'Arial'
thin = Side(style='thin', color='C9D6E8')
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
fill = lambda c: PatternFill('solid', start_color=c, end_color=c)

wb = Workbook()

def faixa(ws, titulo, subtitulo, ncols):
    """Faixa de identidade do Governo do Estado no topo de cada aba."""
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncols)
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=ncols)
    ws.merge_cells(start_row=3, start_column=1, end_row=3, end_column=ncols)
    ws['A1'] = 'GOVERNO DO ESTADO DO RIO DE JANEIRO  ·  SECRETARIA DE DESENVOLVIMENTO ECONÔMICO (SEDES)'
    ws['A1'].font = Font(name=F, size=9, bold=True, color=CYAN)
    ws['A2'] = titulo
    ws['A2'].font = Font(name=F, size=16, bold=True, color='FFFFFF')
    ws['A3'] = subtitulo
    ws['A3'].font = Font(name=F, size=10, color='DCE8F8')
    for r in (1, 2, 3):
        for c in range(1, ncols + 1):
            ws.cell(r, c).fill = fill(NAVY)
        ws.cell(r, 1).alignment = Alignment(vertical='center', indent=1)
    ws.row_dimensions[1].height = 20
    ws.row_dimensions[2].height = 30
    ws.row_dimensions[3].height = 20

def cabecalho(ws, row, nomes, larguras):
    for i, (n, w) in enumerate(zip(nomes, larguras), start=1):
        c = ws.cell(row, i, n)
        c.font = Font(name=F, size=10, bold=True, color='FFFFFF')
        c.fill = fill(BLUE)
        c.alignment = Alignment(wrap_text=True, vertical='center')
        c.border = BORDER
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[row].height = 32

def celula(ws, r, c, v, bold=False, color='1F2A3D', bg=None, indent=0, center=False, italic=False):
    cell = ws.cell(r, c, v)
    cell.font = Font(name=F, size=10, bold=bold, color=color, italic=italic)
    cell.alignment = Alignment(wrap_text=True, vertical='top', indent=indent, horizontal='center' if center else None)
    cell.border = BORDER
    if bg:
        cell.fill = fill(bg)
    return cell

# ------------------------------------------------------------------
# Dados do mapa do site
# (id, página, modelo, acesso, slug, obrigatória, conteúdo/componentes, responsável, campos, situação, prioridade)
S_IMP, S_SIM, S_NAO, S_EXT = 'Implementada', 'Simulada', 'Não existe', 'Link externo'
MAPA = [
    ('0', 'Página inicial', 'Página inicial', 'Domínio (raiz)', '/', 'Sim', 'Hero com vídeo institucional, régua de 5 perfis, cards das 3 subsecretarias com vídeo, Estude o Rio (quiz), O Rio em dados (mapa e indicadores), destaque, notícias, agenda, banner, redes sociais', 'ASCOM', 'HER, PER, EIX, QUI, DAD, NOT, AGE, BAN', S_IMP, 'Alta'),
    ('G', 'Componentes globais (todas as páginas)', 'Componente global', 'Todas as páginas', '—', 'Sim', 'Cabeçalho unificado do Portal Único RJ Digital, barra de acessibilidade, marca SEDES RJ, menu, busca, rodapé institucional', 'TI / ASCOM', 'CAB, ROD, TRA-02', S_SIM, 'Alta'),
    ('G.1', 'Barra de acessibilidade', 'Componente global', 'Topo de todas as páginas', '—', 'Sim', 'Atalhos de teclado, alto contraste, tamanho de texto, VLibras', 'TI', 'TRA', S_NAO, 'Alta'),
    ('G.2', 'Busca do site', 'Listagem com filtros', 'Cabeçalho (lupa)', '/busca', 'Não', 'Resultados de páginas, notícias, editais e municípios', 'TI / ASCOM', 'CAB-06', S_SIM, 'Média'),
    ('1', 'A SEDES', 'Agrupador de menu', 'Menu principal', '/a-sedes', 'Não', 'Item de menu com submenu', 'GAB', 'CAB-03', S_IMP, 'Alta'),
    ('1.1', 'Quem somos', 'Institucional (texto)', 'Menu › A SEDES', '/a-sedes/quem-somos', 'Sim', 'Missão, visão, competências, histórico, estrutura organizacional (organograma)', 'GAB', 'PAG-01', S_SIM, 'Alta'),
    ('1.2', 'Legislação', 'Listagem com filtros', 'Menu › A SEDES', '/a-sedes/legislacao', 'Sim', 'Atos normativos (Decretos nº 50.447/2026 e nº 50.472/2026, Resolução SEDES nº 217/2026) com ementa e PDF', 'JUR', 'PAG-03', S_SIM, 'Alta'),
    ('2', 'Subsecretarias', 'Agrupador de menu', 'Menu principal', '/subsecretarias', 'Não', 'Item de menu com submenu (substitui "Áreas de atuação")', 'GAB', 'CAB-03, CAB-04', S_IMP, 'Alta'),
    ('2.1', 'Todas as subsecretarias', 'Listagem com filtros', 'Menu › Subsecretarias', '/subsecretarias', 'Não', 'Estrutura, titulares e contatos das 3 subsecretarias', 'GAB', 'PAG-02', S_SIM, 'Alta'),
    ('2.2', 'Energia e Economia do Mar', 'Página de subsecretaria', 'Menu › Subsecretarias; card da página inicial', '/subsecretarias/energia-e-economia-do-mar', 'Não', 'Apresentação, vídeo de até 1:30, temas, projetos e oportunidades', 'SUBEM', 'EIX-03 a EIX-05', S_SIM, 'Alta'),
    ('2.2.1', 'Petróleo e Gás', 'Página de tema', 'Subsecretaria › Saiba mais', '/subsecretarias/energia-e-economia-do-mar/petroleo-e-gas', 'Não', 'Cadeia produtiva, investimentos e oportunidades do setor', 'SUBEM', 'EIX-05', S_SIM, 'Média'),
    ('2.2.2', 'Energia Renovável', 'Página de tema', 'Subsecretaria › Saiba mais', '/subsecretarias/energia-e-economia-do-mar/energia-renovavel', 'Não', 'Projetos de transição energética no estado', 'SUBEM', 'EIX-05', S_SIM, 'Média'),
    ('2.2.3', 'Economia Azul', 'Página de tema', 'Subsecretaria › Saiba mais', '/subsecretarias/energia-e-economia-do-mar/economia-azul', 'Não', 'Portos, pesca, turismo costeiro e indústria naval', 'SUBEM', 'EIX-05', S_SIM, 'Média'),
    ('2.3', 'Inovação', 'Página de subsecretaria', 'Menu › Subsecretarias; card da página inicial', '/subsecretarias/inovacao', 'Não', 'Apresentação, vídeo de até 1:30, temas, programas e parcerias', 'SUBINOV', 'EIX-06 a EIX-08', S_SIM, 'Alta'),
    ('2.3.1', 'Startups', 'Página de tema', 'Subsecretaria › Saiba mais', '/subsecretarias/inovacao/startups', 'Não', 'Programas e apoio a empresas inovadoras', 'SUBINOV', 'EIX-08', S_SIM, 'Média'),
    ('2.3.2', 'Ecossistemas de Inovação', 'Página de tema', 'Subsecretaria › Saiba mais', '/subsecretarias/inovacao/ecossistemas-de-inovacao', 'Não', 'Parques tecnológicos, hubs e parcerias', 'SUBINOV', 'EIX-08', S_SIM, 'Média'),
    ('2.3.3', 'Fomento', 'Página de tema', 'Subsecretaria › Saiba mais', '/subsecretarias/inovacao/fomento', 'Não', 'Editais e linhas de apoio à inovação', 'SUBINOV', 'EIX-08', S_SIM, 'Média'),
    ('2.4', 'Indústria, Comércio e Serviços', 'Página de subsecretaria', 'Menu › Subsecretarias; card da página inicial', '/subsecretarias/industria-comercio-e-servicos', 'Não', 'Apresentação, vídeo de até 1:30, temas, incentivos e investimentos', 'SUBICS', 'EIX-09 a EIX-11', S_SIM, 'Alta'),
    ('2.4.1', 'Investimentos', 'Página de tema', 'Subsecretaria › Saiba mais', '/subsecretarias/industria-comercio-e-servicos/investimentos', 'Não', 'Atração e acompanhamento de investimentos', 'SUBICS', 'EIX-11', S_SIM, 'Média'),
    ('2.4.2', 'Ambiente de Negócios', 'Página de tema', 'Subsecretaria › Saiba mais', '/subsecretarias/industria-comercio-e-servicos/ambiente-de-negocios', 'Não', 'Simplificação, incentivos e competitividade', 'SUBICS', 'EIX-11', S_SIM, 'Média'),
    ('2.4.3', 'Desenvolvimento Regional', 'Página de tema', 'Subsecretaria › Saiba mais', '/subsecretarias/industria-comercio-e-servicos/desenvolvimento-regional', 'Não', 'Cadeias produtivas em todas as regiões do estado', 'SUBICS', 'EIX-11', S_SIM, 'Média'),
    ('3', 'O Rio em dados', 'Agrupador de menu', 'Menu principal', '/rio-em-dados', 'Não', 'Item de menu com submenu', 'DADOS', 'DAD-01', S_IMP, 'Alta'),
    ('3.1', 'Mapa de oportunidades do RJ', 'Painel de dados', 'Menu › O Rio em dados; seção da página inicial', '/rio-em-dados/mapa', 'Não', 'Mapa dos 92 municípios (malha IBGE), busca por município, filtro por região, legenda por setor', 'DADOS', 'DAD-06 a DAD-08', S_IMP, 'Alta'),
    ('3.1.1', 'Página do município (92 páginas dinâmicas)', 'Detalhe (gerado por dados)', 'Clique no mapa ou busca', '/rio-em-dados/municipios/{nome-do-municipio}', 'Não', 'Região, vocações, setor de destaque, oportunidades e indicadores do município', 'DADOS', 'DAD-06', S_SIM, 'Média'),
    ('3.2', 'Observatório do Desenvolvimento', 'Painel de dados', 'Menu › O Rio em dados; botão "Acessar painel de dados"', '/rio-em-dados/observatorio', 'Não', 'Indicadores oficiais com filtros por setor, período e região; download dos dados', 'DADOS / TI', 'DAD-02 a DAD-05, DAD-09', S_SIM, 'Alta'),
    ('3.3', 'Dados abertos', 'Listagem com filtros', 'O Rio em dados (proposta)', '/rio-em-dados/dados-abertos', 'Não', 'Conjuntos de dados (CSV/API), licença e dicionário de dados', 'DADOS / TI', 'DAD-10', S_NAO, 'Baixa'),
    ('4', 'Notícias e agenda', 'Agrupador de menu', 'Menu principal', '/noticias', 'Não', 'Item de menu', 'ASCOM', 'NOT-01', S_IMP, 'Alta'),
    ('4.1', 'Notícias', 'Listagem com filtros', 'Menu; "Ver todas as notícias"', '/noticias', 'Não', 'Listagem por editoria e tipo (notícia, vídeo, história que transforma)', 'ASCOM', 'NOT-03, NOT-04, PAG-06', S_SIM, 'Alta'),
    ('4.1.1', 'Notícia (detalhe)', 'Detalhe (notícia/evento/edital)', 'Cards de notícia; destaque', '/noticias/{titulo-da-noticia}', 'Não', 'Título, data, editoria, foto com crédito, texto, compartilhamento', 'ASCOM', 'NOT-02, DAD-11', S_SIM, 'Alta'),
    ('4.2', 'Agenda', 'Listagem com filtros', '"Ver agenda completa"', '/agenda', 'Não', 'Eventos, chamadas públicas e missões, filtráveis por tipo', 'ASCOM', 'AGE-01, AGE-05, PAG-06', S_SIM, 'Alta'),
    ('4.2.1', 'Evento / edital / missão (detalhe)', 'Detalhe (notícia/evento/edital)', 'Cards da agenda', '/agenda/{titulo}', 'Não', 'Data, local, prazo de inscrição, edital em PDF, link de inscrição, adicionar ao calendário', 'Subsecretarias / ASCOM', 'AGE-02 a AGE-04', S_SIM, 'Alta'),
    ('5', 'LGPD', 'Página legal', 'Menu principal; rodapé', '/lgpd', 'Sim', 'Encarregado de dados, direitos do titular, canal de atendimento', 'LGPD / JUR', 'ROD-05', S_SIM, 'Alta'),
    ('5.1', 'Aviso de privacidade', 'Página legal', 'LGPD; rodapé', '/lgpd/aviso-de-privacidade', 'Sim', 'Tratamento de dados pessoais no portal', 'LGPD / JUR', 'ROD-05', S_NAO, 'Alta'),
    ('5.2', 'Termos de uso', 'Página legal', 'LGPD; rodapé', '/lgpd/termos-de-uso', 'Sim', 'Condições de uso do portal', 'LGPD / JUR', 'ROD-05', S_NAO, 'Alta'),
    ('5.3', 'Política de cookies', 'Página legal', 'LGPD; aviso de cookies', '/lgpd/politica-de-cookies', 'Sim', 'Cookies usados e opção de consentimento', 'LGPD / TI', 'ROD-05', S_NAO, 'Alta'),
    ('6', 'Transparência', 'Institucional (texto)', 'Menu principal; rodapé', '/transparencia', 'Sim', 'Receitas, despesas, contratos, convênios, licitações; links para o Portal da Transparência', 'GAB / OUV', 'ROD-04', S_SIM, 'Alta'),
    ('7', 'Fale conosco', 'Formulário', 'Menu principal; rodapé', '/fale-conosco', 'Sim', 'Formulário por assunto, endereço, telefone, e-mail, horário de atendimento', 'GAB / TI', 'ROD-01, PAG-05', S_SIM, 'Alta'),
    ('8', 'Sou cidadão', 'Jornada por perfil', 'Régua de perfis (página inicial)', '/sou-cidadao', 'Não', 'Programas, qualificação e oportunidades de trabalho (sem busca por município)', 'ASCOM / Subsecretarias', 'PER-01', S_SIM, 'Alta'),
    ('8.1', 'Jovens do Mar', 'Página de programa', 'Sou cidadão', '/sou-cidadao/jovens-do-mar', 'Não', 'Descrição, público, como participar, link oficial (a definir)', 'SUBEM', 'PER-01', S_SIM, 'Alta'),
    ('8.2', 'Empregos Azuis', 'Página de programa', 'Sou cidadão', '/sou-cidadao/empregos-azuis', 'Não', 'Descrição, público, como participar, link oficial (a definir)', 'SUBEM', 'PER-01', S_SIM, 'Alta'),
    ('8.3', 'Qualificação profissional', 'Página de programa', 'Sou cidadão', '/sou-cidadao/qualificacao-profissional', 'Não', 'Cursos e capacitação gratuitos', 'Subsecretarias', 'PER-01', S_SIM, 'Média'),
    ('8.4', 'Programas de emprego e renda', 'Página de programa', 'Sou cidadão', '/sou-cidadao/emprego-e-renda', 'Não', 'Oportunidades de trabalho no estado', 'Subsecretarias', 'PER-01', S_SIM, 'Média'),
    ('9', 'Sou empreendedor', 'Jornada por perfil', 'Régua de perfis (página inicial)', '/sou-empreendedor', 'Não', 'Abertura e formalização de empresa, crédito e fomento, capacitação', 'SUBICS', 'PER-02', S_SIM, 'Alta'),
    ('10', 'Sou investidor', 'Jornada por perfil', 'Régua de perfis (página inicial)', '/sou-investidor', 'Não', 'Setores estratégicos, incentivos, atendimento ao investidor e Desenvolve RJ (substitui "Quero investir no RJ")', 'SUBICS / GAB', 'PER-03', S_SIM, 'Alta'),
    ('10.1', 'Desenvolve RJ', 'Portal incorporado (seção)', 'Sou investidor; 5º espaço da régua de perfis', '/sou-investidor/desenvolve-rj', 'Não', 'Área que absorve o portal Desenvolve RJ; conteúdos a migrar', 'SUBICS / TI', 'PER-03', S_SIM, 'Alta'),
    ('10.1.1', 'Oportunidades de investimento', 'Página de tema', 'Desenvolve RJ', '/sou-investidor/desenvolve-rj/oportunidades', 'Não', 'Conteúdo a migrar do portal Desenvolve RJ', 'SUBICS', 'PER-03', S_SIM, 'Média'),
    ('10.1.2', 'Programas e incentivos', 'Página de tema', 'Desenvolve RJ', '/sou-investidor/desenvolve-rj/programas-e-incentivos', 'Não', 'Conteúdo a migrar do portal Desenvolve RJ', 'SUBICS', 'PER-03', S_SIM, 'Média'),
    ('10.1.3', 'Dados e estudos setoriais', 'Página de tema', 'Desenvolve RJ', '/sou-investidor/desenvolve-rj/estudos', 'Não', 'Conteúdo a migrar do portal Desenvolve RJ', 'SUBICS / DADOS', 'PER-03', S_SIM, 'Média'),
    ('10.1.4', 'Atendimento e contato', 'Página de tema', 'Desenvolve RJ', '/sou-investidor/desenvolve-rj/atendimento', 'Não', 'Conteúdo a migrar do portal Desenvolve RJ', 'SUBICS', 'PER-03', S_SIM, 'Média'),
    ('10.2', 'Setores estratégicos', 'Página de tema', 'Sou investidor', '/sou-investidor/setores-estrategicos', 'Não', 'Onde investir no Rio de Janeiro', 'SUBICS', 'PER-03', S_SIM, 'Média'),
    ('10.3', 'Incentivos', 'Página de tema', 'Sou investidor', '/sou-investidor/incentivos', 'Não', 'Regimes e benefícios disponíveis', 'SUBICS / JUR', 'PER-03', S_SIM, 'Média'),
    ('10.4', 'Atendimento ao investidor', 'Formulário', 'Sou investidor', '/sou-investidor/atendimento', 'Não', 'Canal de apoio para novos projetos', 'SUBICS', 'PER-03', S_SIM, 'Média'),
    ('11', 'Quero inovar', 'Jornada por perfil', 'Régua de perfis (página inicial)', '/quero-inovar', 'Não', 'Programas para startups, parques tecnológicos, editais de inovação', 'SUBINOV', 'PER-04', S_SIM, 'Alta'),
    ('12', 'Estude o Rio', 'Quiz', 'Seção da página inicial', '/estude-o-rio', 'Não', 'Quiz por etapa de ensino (educação básica e ensino superior), explicações e materiais de aprofundamento', 'Subsecretarias / GAB', 'QUI-01 a QUI-06', S_IMP, 'Média'),
    ('13', 'Central de oportunidades', 'Listagem com filtros', 'Painel do município ("Ver oportunidades"); perfis', '/oportunidades', 'Não', 'Editais, programas, fomento, eventos e serviços; filtros por perfil, tema e situação. Fora do menu (decisão da Maquete 2)', 'Subsecretarias', 'PAG-04', S_SIM, 'Alta'),
    ('14', 'Todas as iniciativas', 'Listagem com filtros', '"Conheça todas as iniciativas" (página inicial)', '/iniciativas', 'Não', 'Programas e projetos da SEDES por subsecretaria, região e público', 'Subsecretarias', 'EIX-02', S_SIM, 'Média'),
    ('15', 'Vídeo institucional', 'Mídia (vídeo)', 'Hero da página inicial', '—', 'Não', 'Vídeo com legendas, janela de Libras e transcrição', 'ASCOM', 'HER-07', S_SIM, 'Média'),
    ('R', 'Rodapé institucional', 'Componente global', 'Todas as páginas', '—', 'Sim', 'Links legais e de atendimento, endereço, redes sociais', 'ASCOM / GAB', 'ROD', S_IMP, 'Alta'),
    ('R.1', 'Ouvidoria (OuvERJ)', 'Link externo', 'Rodapé', '[URL oficial da OuvERJ]', 'Sim', 'Elogios, sugestões, reclamações e denúncias', 'OUV', 'ROD-03', S_SIM, 'Alta'),
    ('R.2', 'Acesso à Informação (e-SIC)', 'Institucional (texto)', 'Rodapé; barra do Governo', '/acesso-a-informacao', 'Sim', 'Seção exigida pela Lei nº 12.527/2011 (LAI), com link para o e-SIC', 'GAB / OUV', 'ROD-04', S_NAO, 'Alta'),
    ('R.3', 'Carta de Serviços', 'Institucional (texto)', 'Rodapé; Sou cidadão', '/carta-de-servicos', 'Sim', 'Serviços prestados, requisitos, prazos e canais (Lei nº 13.460/2017)', 'GAB / Subsecretarias', '—', S_NAO, 'Alta'),
    ('R.4', 'Acessibilidade', 'Página legal', 'Rodapé; barra de acessibilidade', '/acessibilidade', 'Sim', 'Recursos de acessibilidade, canal para relatar barreiras, data da última avaliação (e-MAG)', 'TI / ASCOM', 'ROD-06', S_SIM, 'Alta'),
    ('R.5', 'Mapa do site', 'Institucional (texto)', 'Rodapé', '/mapa-do-site', 'Não', 'Lista navegável de todas as páginas (gerada a partir desta matriz)', 'TI', '—', S_NAO, 'Baixa'),
    ('R.6', 'Redes sociais (Instagram, Facebook, LinkedIn, YouTube, X, TikTok)', 'Link externo', 'Faixa "Acompanhe a SEDES" no fim da página', '[URLs oficiais]', 'Não', 'Perfis oficiais da SEDES', 'ASCOM', 'ROD-02', S_SIM, 'Média'),
]

# ------------------------------------------------------------------
# Aba 1 · Leia-me
ws = wb.active
ws.title = 'Leia-me'
faixa(ws, 'Matriz de Arquitetura da Informação · Novo site da SEDES', 'Mapa do site, páginas obrigatórias e plano de redirecionamentos 301 · Base: Maquete 2 · Versão 1.0 · 25/11/2026', 6)
ws.column_dimensions['A'].width = 4
ws.column_dimensions['B'].width = 30
for col in 'CDEF':
    ws.column_dimensions[col].width = 26
img = XLImage(BRASAO)
img.width, img.height = 190, 67
ws.add_image(img, 'B5')
ws.row_dimensions[5].height = 26
ws.row_dimensions[6].height = 26
linhas = [
    ('Objetivo', 'Documentar a estrutura de navegação do novo site institucional da SEDES (menus, páginas e hierarquia), as páginas obrigatórias de um portal público e o plano de redirecionamentos das URLs atuais. É um dos documentos técnicos exigidos para o rebranding junto ao PRODERJ (padrão Portal Único RJ Digital, Decreto nº 48.671/2023).'),
    ('Base', 'Maquete 2 da página inicial (docs/site-sedes/maquete2.html) e o Levantamento de Conteúdos (77 campos). A coluna "Campos do levantamento" liga cada página aos IDs daquele documento.'),
    ('Abas', '1. Mapa do site: todas as páginas, com hierarquia, modelo, acesso, URL proposta, responsável e situação.\n2. Páginas obrigatórias: checklist legal e normativo.\n3. Redirecionamentos 301: URLs atuais (site atual e portal Desenvolve RJ) para as novas.\n4. Modelos de página: os modelos usados e quantas páginas usam cada um.\n5. Resumo: contagens automáticas para acompanhamento.'),
    ('Como preencher', 'Preencha somente as células em AMARELO. Use as listas suspensas de Status e Situação. Ao alterar o mapa do site (incluir ou excluir páginas), o Resumo e a aba Modelos de página se atualizam sozinhos.'),
    ('URLs propostas', 'A coluna "Caminho proposto" traz só o caminho (ex.: /a-sedes/quem-somos). O domínio final no rj.gov.br será definido com o PRODERJ. Trechos entre chaves, como {nome-do-municipio}, indicam páginas geradas dinamicamente.'),
    ('Situação na Maquete 2', 'Implementada: funciona na maquete. Simulada: o link existe e abre uma página de demonstração; falta a página real. Não existe: precisa ser criada (em geral, exigência legal ou do padrão Portal Único). Link externo: aponta para outro site oficial.'),
    ('Status', 'Pendente, Em elaboração, Em validação, Validado, Não se aplica (mesma legenda do Levantamento de Conteúdos).'),
    ('Siglas', 'ASCOM (Comunicação), GAB (Gabinete), SUBEM (Energia e Economia do Mar), SUBINOV (Inovação), SUBICS (Indústria, Comércio e Serviços), DADOS (Inteligência econômica), TI, JUR (Jurídico), LGPD (Encarregado de dados), OUV (Ouvidoria). Sugestões: ajustar à estrutura oficial.'),
]
r = 8
for k, v in linhas:
    ws.cell(r, 2, k).font = Font(name=F, size=11, bold=True, color=NAVY)
    ws.cell(r, 2).alignment = Alignment(vertical='top')
    ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=6)
    c = ws.cell(r, 3, v)
    c.font = Font(name=F, size=10, color='1F2A3D')
    c.alignment = Alignment(wrap_text=True, vertical='top')
    ws.row_dimensions[r].height = max(30, 15 * (len(v) // 95 + 1 + v.count('\n')))
    r += 1
ws.cell(r + 1, 2, 'Legenda de cores').font = Font(name=F, size=11, bold=True, color=NAVY)
for i, (txt, bg) in enumerate([('Célula para preencher', YELLOW), ('Página obrigatória', 'E2F4E8'), ('Não existe na Maquete 2', 'FDE2E2')]):
    c = ws.cell(r + 2 + i, 2, txt)
    c.fill = fill(bg)
    c.font = Font(name=F, size=10)
    c.border = BORDER
ws.sheet_view.showGridLines = False

# ------------------------------------------------------------------
# Aba 2 · Mapa do site
ws = wb.create_sheet('Mapa do site')
cols = ['ID', 'Nível', 'Página', 'Modelo de página', 'Acesso a partir de', 'Caminho de navegação', 'Caminho proposto (URL)', 'Obrigatória', 'Conteúdo e componentes', 'Responsável', 'Campos do levantamento', 'Situação na Maquete 2', 'Prioridade', 'Status', 'Observações']
larg = [8, 7, 38, 24, 30, 40, 44, 11, 52, 18, 18, 16, 11, 14, 32]
faixa(ws, 'Mapa do site · Matriz de Arquitetura da Informação', 'Hierarquia de páginas do novo site da SEDES (base: Maquete 2). Preencha as colunas em amarelo.', len(cols))
H = 5
cabecalho(ws, H, cols, larg)
nomes = {m[0]: m[1] for m in MAPA}
def trilha(i):
    if i in ('0',):
        return 'Página inicial'
    partes = i.split('.')
    cam = ['Página inicial'] + [nomes['.'.join(partes[:k])] for k in range(1, len(partes) + 1) if '.'.join(partes[:k]) in nomes]
    return ' › '.join(cam)
for n, m in enumerate(MAPA):
    r = H + 1 + n
    id_, pag, mod, ac, slug, obr, cont, resp, campos, sit, prio = m
    nivel_ind = 0 if id_ in ('0',) else id_.count('.')
    is_top = '.' not in id_ and id_ not in ('0',)
    bg = 'F6F9FD' if is_top else None
    celula(ws, r, 1, id_, bold=is_top or id_ == '0', color=BLUE, bg=bg)
    ws.cell(r, 1).number_format = '@'
    # Nível calculado pelo ID (pontos + 1); 0 para a página inicial
    celula(ws, r, 2, f'=IF(A{r}="0",0,LEN(A{r})-LEN(SUBSTITUTE(A{r},".",""))+1)', center=True, bg=bg)
    celula(ws, r, 3, pag, bold=is_top or id_ == '0', color='0A2252' if is_top or id_ == '0' else '1F2A3D', bg=bg, indent=nivel_ind * 2)
    celula(ws, r, 4, mod, bg=bg)
    celula(ws, r, 5, ac, bg=bg)
    celula(ws, r, 6, trilha(id_), color=GREY, bg=bg)
    celula(ws, r, 7, slug, color='1673D1', bg=bg)
    celula(ws, r, 8, obr, center=True, bg='E2F4E8' if obr == 'Sim' else bg, bold=obr == 'Sim')
    celula(ws, r, 9, cont, bg=bg)
    celula(ws, r, 10, resp, bg=bg)
    celula(ws, r, 11, campos, color=GREY, bg=bg)
    celula(ws, r, 12, sit, center=True, bg='FDE2E2' if sit == S_NAO else bg, bold=sit == S_NAO)
    celula(ws, r, 13, prio, center=True, bg=bg)
    celula(ws, r, 14, 'Pendente', center=True, bg=YELLOW)
    celula(ws, r, 15, None, bg=YELLOW)
LAST = H + len(MAPA)
ws.freeze_panes = ws.cell(H + 1, 4)
ws.auto_filter.ref = f'A{H}:{get_column_letter(len(cols))}{LAST + 30}'
ws.sheet_view.zoomScale = 90
# linhas vazias para novas páginas (amarelas)
for r in range(LAST + 1, LAST + 31):
    for c in range(1, len(cols) + 1):
        if c == 2:
            celula(ws, r, 2, f'=IF(A{r}="","",IF(A{r}="0",0,LEN(A{r})-LEN(SUBSTITUTE(A{r},".",""))+1))', center=True)
        else:
            celula(ws, r, c, None, bg=YELLOW if c in (1, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15) else None)
            if c == 1:
                ws.cell(r, 1).number_format = '@'
ws.cell(LAST + 1, 15, 'Linhas livres para incluir novas páginas (use um ID que indique a posição na hierarquia, ex.: 1.3).').font = Font(name=F, size=9, italic=True, color=GREY)
MAPA_END = LAST + 30
status = DataValidation(type='list', formula1='"Pendente,Em elaboração,Em validação,Validado,Não se aplica"', allow_blank=True)
situ = DataValidation(type='list', formula1='"Implementada,Simulada,Não existe,Link externo"', allow_blank=True)
simnao = DataValidation(type='list', formula1='"Sim,Não"', allow_blank=True)
prio = DataValidation(type='list', formula1='"Alta,Média,Baixa"', allow_blank=True)
for dv, col in ((status, 'N'), (situ, 'L'), (simnao, 'H'), (prio, 'M')):
    ws.add_data_validation(dv)
    dv.add(f'{col}{H + 1}:{col}{MAPA_END}')
ws.conditional_formatting.add(f'N{H + 1}:N{MAPA_END}', CellIsRule(operator='equal', formula=['"Validado"'], fill=fill('E2F4E8')))
ws.conditional_formatting.add(f'N{H + 1}:N{MAPA_END}', CellIsRule(operator='equal', formula=['"Em validação"'], fill=fill(LIGHT)))

# ------------------------------------------------------------------
# Aba 3 · Páginas obrigatórias
ws = wb.create_sheet('Páginas obrigatórias')
cols3 = ['Item', 'Base legal / normativa', 'Onde aparece no site', 'ID no mapa do site', 'Situação na Maquete 2', 'Responsável', 'Status', 'Observações']
larg3 = [34, 46, 34, 14, 18, 16, 14, 36]
faixa(ws, 'Páginas e elementos obrigatórios', 'Checklist para portais do Poder Executivo estadual. Confirme a base normativa com a Comunicação Social, a SETD e o PRODERJ.', len(cols3))
cabecalho(ws, 5, cols3, larg3)
OBRIG = [
    ('Cabeçalho unificado do Portal Único', 'Decreto Estadual nº 48.671/2023 (Portal Único RJ Digital), conforme informado pela SEDES', 'Topo de todas as páginas', 'G'),
    ('Barra de acessibilidade e recursos de Libras', 'Lei nº 13.146/2015 (LBI), art. 63; Decreto Estadual nº 48.012/2022 (informado pela SEDES); e-MAG', 'Topo de todas as páginas', 'G.1'),
    ('Rodapé institucional padronizado', 'Decreto Estadual nº 48.671/2023 (padrão do Portal Único)', 'Todas as páginas', 'R'),
    ('Acesso à Informação (e-SIC)', 'Lei nº 12.527/2011 (Lei de Acesso à Informação)', 'Rodapé; barra do Governo', 'R.2'),
    ('Transparência', 'Lei nº 12.527/2011, art. 8º (transparência ativa)', 'Menu principal; rodapé', '6'),
    ('Carta de Serviços ao Usuário', 'Lei nº 13.460/2017, art. 7º', 'Rodapé; Sou cidadão', 'R.3'),
    ('Ouvidoria (OuvERJ)', 'Lei nº 13.460/2017 (manifestações dos usuários)', 'Rodapé', 'R.1'),
    ('LGPD: encarregado e direitos do titular', 'Lei nº 13.709/2018 (LGPD), art. 41', 'Menu principal; rodapé', '5'),
    ('Aviso de privacidade', 'Lei nº 13.709/2018 (LGPD), art. 9º', 'LGPD; rodapé', '5.1'),
    ('Termos de uso', 'Diretrizes de LGPD do PRODERJ (informado pela SEDES)', 'LGPD; rodapé', '5.2'),
    ('Política e aviso de cookies', 'Lei nº 13.709/2018 (LGPD); diretrizes do PRODERJ', 'LGPD; aviso na primeira visita', '5.3'),
    ('Declaração de acessibilidade', 'e-MAG; Lei nº 13.146/2015', 'Rodapé', 'R.4'),
    ('Legislação do órgão', 'Decretos nº 50.447/2026 e nº 50.472/2026; Resolução SEDES nº 217/2026', 'Menu › A SEDES', '1.2'),
    ('Fale conosco', 'Lei nº 13.460/2017 (canais de atendimento)', 'Menu principal; rodapé', '7'),
]
idx = {m[0]: m[9] for m in MAPA}
for n, (it, base, onde, id_) in enumerate(OBRIG):
    r = 6 + n
    celula(ws, r, 1, it, bold=True, color=NAVY)
    celula(ws, r, 2, base)
    celula(ws, r, 3, onde)
    celula(ws, r, 4, id_, center=True, color=BLUE, bold=True)
    # situação buscada no mapa do site pelo ID
    celula(ws, r, 5, f"=IFERROR(INDEX('Mapa do site'!$L$6:$L${MAPA_END},MATCH(D{r},'Mapa do site'!$A$6:$A${MAPA_END},0)),\"ID não encontrado\")", center=True)
    celula(ws, r, 6, f"=IFERROR(INDEX('Mapa do site'!$J$6:$J${MAPA_END},MATCH(D{r},'Mapa do site'!$A$6:$A${MAPA_END},0)),\"\")", center=True)
    celula(ws, r, 7, 'Pendente', center=True, bg=YELLOW)
    celula(ws, r, 8, None, bg=YELLOW)
OB_END = 5 + len(OBRIG)
ws.conditional_formatting.add(f'E6:E{OB_END}', CellIsRule(operator='equal', formula=['"Não existe"'], fill=fill('FDE2E2'), font=Font(name=F, bold=True, color='B42318')))
dv = DataValidation(type='list', formula1='"Pendente,Em elaboração,Em validação,Validado,Não se aplica"', allow_blank=True)
ws.add_data_validation(dv)
dv.add(f'G6:G{OB_END}')
ws.cell(OB_END + 2, 1, 'As colunas "Situação na Maquete 2" e "Responsável" são lidas automaticamente da aba Mapa do site pelo ID.').font = Font(name=F, size=9, italic=True, color=GREY)
ws.cell(OB_END + 3, 1, 'Normativos estaduais marcados como "informado pela SEDES" devem ser confirmados pela área jurídica.').font = Font(name=F, size=9, italic=True, color=GREY)
ws.freeze_panes = 'B6'

# ------------------------------------------------------------------
# Aba 4 · Redirecionamentos 301
ws = wb.create_sheet('Redirecionamentos 301')
cols4 = ['Nº', 'Origem', 'URL atual (preencher)', 'Página de destino (ID)', 'Página de destino', 'Caminho de destino', 'Tipo', 'Responsável', 'Status', 'Observações']
larg4 = [6, 22, 46, 14, 34, 46, 12, 14, 14, 30]
faixa(ws, 'Plano de redirecionamentos 301', 'Liste as URLs do site atual e do portal Desenvolve RJ e aponte o destino no novo site, para não quebrar links nem perder posição em buscadores.', len(cols4))
cabecalho(ws, 5, cols4, larg4)
# linha de exemplo
ex = ['Ex.', 'Site atual da SEDES', 'https://[endereço-do-site-atual]/institucional/quem-somos', '1.1', None, None, '301', 'TI', 'Pendente', 'Linha de exemplo: apague ou substitua.']
REDIR = [('Site atual da SEDES', i) for i in ['0', '1.1', '1.2', '2.1', '2.2', '2.3', '2.4', '3.2', '4.1', '4.2', '5', '6', '7']] + \
        [('Portal Desenvolve RJ', i) for i in ['10.1', '10.1.1', '10.1.2', '10.1.3', '10.1.4']]
def linha_redir(r, vals, exemplo=False):
    for c, v in enumerate(vals, start=1):
        if c == 5:
            v = f"=IFERROR(INDEX('Mapa do site'!$C$6:$C${MAPA_END},MATCH(D{r},'Mapa do site'!$A$6:$A${MAPA_END},0)),\"\")"
        if c == 6:
            v = f"=IFERROR(INDEX('Mapa do site'!$G$6:$G${MAPA_END},MATCH(D{r},'Mapa do site'!$A$6:$A${MAPA_END},0)),\"\")"
        bg = YELLOW if c in (2, 3, 4, 8, 9, 10) else None
        celula(ws, r, c, v, bg=bg, italic=exemplo, color=GREY if exemplo else ('1673D1' if c == 6 else '1F2A3D'), center=c in (1, 4, 7, 9))
        if c == 4:
            ws.cell(r, 4).number_format = '@'
linha_redir(6, ex, exemplo=True)
for n, (orig, id_) in enumerate(REDIR):
    linha_redir(7 + n, [n + 1, orig, None, id_, None, None, '301', 'TI', 'Pendente', None])
R_END = 6 + len(REDIR)
for r in range(R_END + 1, R_END + 41):
    linha_redir(r, [r - 6, None, None, None, None, None, '301', None, None, None])
R_END += 40
for dv, rng in ((DataValidation(type='list', formula1='"Site atual da SEDES,Portal Desenvolve RJ,Outro"', allow_blank=True), f'B7:B{R_END}'),
                (DataValidation(type='list', formula1='"Pendente,Em elaboração,Em validação,Validado,Não se aplica"', allow_blank=True), f'I7:I{R_END}'),
                (DataValidation(type='list', formula1='"301,302"', allow_blank=True), f'G7:G{R_END}')):
    ws.add_data_validation(dv)
    dv.add(rng)
ws.freeze_panes = 'C7'
ws.auto_filter.ref = f'A5:J{R_END}'

# ------------------------------------------------------------------
# Aba 5 · Modelos de página
ws = wb.create_sheet('Modelos de página')
cols5 = ['Modelo de página', 'Uso', 'Componentes principais', 'Páginas no mapa']
larg5 = [30, 40, 60, 14]
faixa(ws, 'Modelos de página (templates)', 'Cada página do mapa usa um modelo. Menos modelos = desenvolvimento e manutenção mais simples.', len(cols5))
cabecalho(ws, 5, cols5, larg5)
MODELOS = [
    ('Página inicial', 'Entrada do portal', 'Hero com vídeo, régua de perfis, cards com vídeo, quiz, mapa, notícias, agenda, banner, redes sociais'),
    ('Componente global', 'Elementos presentes em todas as páginas', 'Cabeçalho do Portal Único, barra de acessibilidade, rodapé'),
    ('Agrupador de menu', 'Item de menu que abre submenu', 'Rótulo e lista de subpáginas'),
    ('Institucional (texto)', 'Páginas de conteúdo estático', 'Título, trilha de navegação, texto, anexos, data de atualização'),
    ('Página de subsecretaria', 'Uma por subsecretaria', 'Vídeo de até 1:30, apresentação, temas, projetos, contatos'),
    ('Página de tema', 'Temas das subsecretarias e do Desenvolve RJ', 'Texto, destaques, links para oportunidades e notícias relacionadas'),
    ('Jornada por perfil', 'Sou cidadão, Sou empreendedor, Sou investidor, Quero inovar', 'Cards de programas e serviços, chamadas para ação'),
    ('Página de programa', 'Programas como Jovens do Mar e Empregos Azuis', 'Descrição, público, como participar, prazos, contato'),
    ('Portal incorporado (seção)', 'Desenvolve RJ dentro do site', 'Página de entrada da seção, navegação própria, conteúdos migrados'),
    ('Listagem com filtros', 'Notícias, agenda, oportunidades, legislação, iniciativas', 'Busca, filtros, paginação, cards'),
    ('Detalhe (notícia/evento/edital)', 'Conteúdo individual', 'Título, data, imagem com crédito, texto, anexos, compartilhamento'),
    ('Detalhe (gerado por dados)', 'Páginas dos 92 municípios', 'Dados do município lidos de planilha ou API'),
    ('Painel de dados', 'Mapa e Observatório', 'Mapa interativo, indicadores com fonte e data, filtros, download'),
    ('Formulário', 'Fale conosco, atendimento ao investidor', 'Campos, consentimento LGPD, confirmação de envio'),
    ('Quiz', 'Estude o Rio', 'Seleção de etapa, perguntas, explicações, resultado'),
    ('Página legal', 'LGPD, privacidade, termos, cookies, acessibilidade', 'Texto com versão e data de vigência'),
    ('Mídia (vídeo)', 'Vídeo institucional', 'Player com legendas, Libras e transcrição'),
    ('Link externo', 'OuvERJ, redes sociais', 'Link para site oficial externo'),
]
for n, (m, u, c) in enumerate(MODELOS):
    r = 6 + n
    celula(ws, r, 1, m, bold=True, color=NAVY)
    celula(ws, r, 2, u)
    celula(ws, r, 3, c)
    celula(ws, r, 4, f"=COUNTIF('Mapa do site'!$D$6:$D${MAPA_END},A{r})", center=True, bold=True)
M_END = 5 + len(MODELOS)
celula(ws, M_END + 1, 3, 'Total de linhas no mapa', bold=True, bg=LIGHT)
celula(ws, M_END + 1, 4, f'=SUM(D6:D{M_END})', center=True, bold=True, bg=LIGHT)
ws.freeze_panes = 'B6'

# ------------------------------------------------------------------
# Aba 6 · Resumo
ws = wb.create_sheet('Resumo')
faixa(ws, 'Resumo da matriz', 'Contagens automáticas a partir da aba Mapa do site.', 4)
ws.column_dimensions['A'].width = 4
ws.column_dimensions['B'].width = 40
ws.column_dimensions['C'].width = 14
ws.column_dimensions['D'].width = 50
RNG = lambda col: f"'Mapa do site'!${col}$6:${col}${MAPA_END}"
blocos = [
    ('Visão geral', [
        ('Total de itens no mapa do site', f"=COUNTA({RNG('A')})", ''),
        ('Itens de primeiro nível (menu e atalhos)', f"=COUNTIF({RNG('B')},1)", 'Inclui menu, régua de perfis e componentes globais'),
        ('Itens de segundo nível', f"=COUNTIF({RNG('B')},2)", ''),
        ('Itens de terceiro nível', f"=COUNTIF({RNG('B')},3)", ''),
        ('Páginas obrigatórias', f"=COUNTIF({RNG('H')},\"Sim\")", 'Exigências legais e do padrão Portal Único'),
    ]),
    ('Situação na Maquete 2', [
        ('Implementadas', f"=COUNTIF({RNG('L')},\"Implementada\")", 'Já funcionam na Maquete 2'),
        ('Simuladas', f"=COUNTIF({RNG('L')},\"Simulada\")", 'Link existe; falta a página real'),
        ('Não existem', f"=COUNTIF({RNG('L')},\"Não existe\")", 'Precisam ser criadas'),
        ('Links externos', f"=COUNTIF({RNG('L')},\"Link externo\")", ''),
    ]),
    ('Status do preenchimento', [
        ('Pendente', f"=COUNTIF({RNG('N')},\"Pendente\")", ''),
        ('Em elaboração', f"=COUNTIF({RNG('N')},\"Em elaboração\")", ''),
        ('Em validação', f"=COUNTIF({RNG('N')},\"Em validação\")", ''),
        ('Validado', f"=COUNTIF({RNG('N')},\"Validado\")", ''),
        ('Percentual validado', f"=IFERROR(COUNTIF({RNG('N')},\"Validado\")/COUNTA({RNG('A')}),0)", 'Validados ÷ total de itens'),
    ]),
    ('Itens por responsável (contém a sigla)', [(sig, f"=COUNTIF({RNG('J')},\"*{sig}*\")", '') for sig in ['ASCOM', 'GAB', 'SUBEM', 'SUBINOV', 'SUBICS', 'DADOS', 'TI', 'JUR', 'LGPD', 'OUV']] + [('Subsecretarias (genérico)', f"=COUNTIF({RNG('J')},\"*Subsecretarias*\")", '')]),
]
r = 5
for titulo, itens in blocos:
    c = ws.cell(r, 2, titulo)
    c.font = Font(name=F, size=12, bold=True, color='FFFFFF')
    for col in (2, 3, 4):
        ws.cell(r, col).fill = fill(BLUE)
    r += 1
    for nome, f_, obs in itens:
        celula(ws, r, 2, nome)
        cc = celula(ws, r, 3, f_, center=True, bold=True, color=NAVY)
        if 'Percentual' in nome:
            cc.number_format = '0.0%'
        celula(ws, r, 4, obs, color=GREY)
        r += 1
    r += 1
ws.cell(r, 2, 'Uma página com mais de um responsável (ex.: "GAB / OUV") conta para cada sigla.').font = Font(name=F, size=9, italic=True, color=GREY)
ws.sheet_view.showGridLines = False

for sh in wb.worksheets:
    sh.sheet_properties.tabColor = NAVY if sh.title in ('Leia-me', 'Resumo') else BLUE
    sh.page_setup.orientation = 'landscape'
    sh.page_setup.fitToWidth = 1
    sh.page_setup.fitToHeight = 0
    sh.sheet_properties.pageSetUpPr.fitToPage = True
    sh.oddFooter.left.text = 'SEDES RJ · Matriz de Arquitetura da Informação · v1.0'
    sh.oddFooter.right.text = 'Página &P de &N'
wb.save(OUT)
print('ok', len(MAPA), 'itens')
