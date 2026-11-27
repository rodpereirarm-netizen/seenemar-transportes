"""Inventário de imagens do site desenvolvimento.paschoal.rio, com especificação das fotos definitivas."""
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule
from openpyxl.drawing.image import Image as XLImage
from openpyxl.utils import get_column_letter

OUT, BRASAO = sys.argv[1], sys.argv[2]
NAVY, BLUE, CYAN, LIGHT, YELLOW, GREY = '0A2252', '1E88E5', '5CC3F7', 'EEF5FD', 'FFF4C2', '5B6B84'
RED_BG, GREEN_BG, ORANGE_BG = 'FDE2E2', 'E2F4E8', 'FFE9D2'
F = 'Arial'
thin = Side(style='thin', color='C9D6E8')
B = Border(left=thin, right=thin, top=thin, bottom=thin)
fill = lambda c: PatternFill('solid', start_color=c, end_color=c)
BASE = 'https://desenvolvimento.paschoal.rio'

def faixa(ws, titulo, sub, n):
    for r, (t, sz, bold, col, h) in enumerate([
        ('GOVERNO DO ESTADO DO RIO DE JANEIRO  ·  SECRETARIA DE DESENVOLVIMENTO ECONÔMICO (SEDES)', 9, True, CYAN, 20),
        (titulo, 16, True, 'FFFFFF', 30), (sub, 10, False, 'DCE8F8', 20)], start=1):
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=n)
        ws.cell(r, 1, t).font = Font(name=F, size=sz, bold=bold, color=col)
        ws.cell(r, 1).alignment = Alignment(vertical='center', indent=1)
        for c in range(1, n + 1):
            ws.cell(r, c).fill = fill(NAVY)
        ws.row_dimensions[r].height = h

def head(ws, row, cols, widths):
    for i, (n, w) in enumerate(zip(cols, widths), 1):
        c = ws.cell(row, i, n)
        c.font = Font(name=F, size=10, bold=True, color='FFFFFF')
        c.fill = fill(BLUE)
        c.alignment = Alignment(wrap_text=True, vertical='center', horizontal='center')
        c.border = B
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[row].height = 36

def cel(ws, r, c, v, bold=False, color='1F2A3D', bg=None, center=False, fmt=None, italic=False):
    x = ws.cell(r, c, v)
    x.font = Font(name=F, size=10, bold=bold, color=color, italic=italic)
    x.alignment = Alignment(wrap_text=True, vertical='top', horizontal='center' if center else None)
    x.border = B
    if bg:
        x.fill = fill(bg)
    if fmt:
        x.number_format = fmt
    return x

# (ID, seção, elemento, arquivo, caminho, real w, real h, exib w, exib h, alt atual, conteúdo da foto, alt sugerido)
IMGS = [
    ('IMG-01', 'Cabeçalho', 'Assinatura do Governo do Estado (logo)', 'gov-rj-logo-vVt_eL4j.png', '/assets/gov-rj-logo-vVt_eL4j.png', 820, 242, 163, 48, 'Governo do Estado do Rio de Janeiro', 'Brasão e assinatura do Governo do Estado', 'Governo do Estado do Rio de Janeiro'),
    ('IMG-02', 'Hero ("Desenvolvimento que transforma")', 'Imagem de fundo do topo', 'hero-rio-hd.jpg', '/__l5e/assets-v1/2a8ec94a-67af-4508-b9a4-902fec797e9b/hero-rio-hd.jpg', 1854, 882, 1350, 484, '', 'Pão de Açúcar e Baía de Guanabara ao entardecer', 'Vista do Pão de Açúcar e da Baía de Guanabara ao entardecer'),
    ('IMG-03', 'Subsecretarias (três eixos)', 'Card Energia e Economia do Mar', 'eixo-energia-v2.jpg', '/__l5e/assets-v1/7fc2849d-7040-40c6-a11f-24d31115dc86/eixo-energia-v2.jpg', 716, 172, 401, 160, '', 'Navio-plataforma em alto-mar', 'Navio-plataforma de petróleo em alto-mar'),
    ('IMG-04', 'Subsecretarias (três eixos)', 'Card Inovação', 'eixo-inovacao-v2.jpg', '/__l5e/assets-v1/d1e2ca9b-902b-4c0a-9ee5-b491f8ee13f1/eixo-inovacao-v2.jpg', 643, 172, 401, 160, '', 'Pesquisadora diante de telas com dados', 'Pesquisadora utilizando tecnologia diante de telas com dados'),
    ('IMG-05', 'Subsecretarias (três eixos)', 'Card Indústria, Comércio e Serviços', 'eixo-industria-v2.jpg', '/__l5e/assets-v1/6328245c-7931-469f-a335-1e4e5d74824a/eixo-industria-v2.jpg', 752, 172, 401, 160, '', 'Técnico em linha de produção industrial', 'Técnico trabalhando em uma linha de produção industrial'),
    ('IMG-06', 'Estude o Rio', 'Foto da faixa para estudantes', 'estudantes.jpg', '/__l5e/assets-v1/0203ead4-3816-42ab-b1aa-24b2c0e424e8/estudantes.jpg', 1267, 828, 640, 418, 'Estudantes usando um notebook', 'Dois estudantes com notebook', 'Dois estudantes sorrindo enquanto estudam com um notebook'),
    ('IMG-07', 'O Rio em dados', 'Card Destaque', 'hero-rio-hd.jpg (reaproveita IMG-02)', '/__l5e/assets-v1/2a8ec94a-67af-4508-b9a4-902fec797e9b/hero-rio-hd.jpg', 1854, 882, 387, 566, '', 'Hoje: mesma foto do hero, cortada na vertical. Ideal: foto própria do tema em destaque (ex.: Porto do Rio)', 'Descrever a foto do tema em destaque'),
    ('IMG-08', 'Notícias e histórias', 'Notícia: Economia do Mar', 'noticia-mar-v2.jpg', '/__l5e/assets-v1/138f94b4-0144-4a45-8039-b7d7809629dc/noticia-mar-v2.jpg', 546, 170, 216, 128, '', 'Navio de carga no mar', 'Descrever a foto da matéria (definir com a notícia real)'),
    ('IMG-09', 'Notícias e histórias', 'Notícia: Indústria', 'noticia-industria-v2.jpg', '/__l5e/assets-v1/a333af65-4207-4a6d-87ee-0e1c065e0208/noticia-industria-v2.jpg', 558, 170, 216, 128, '', 'Trabalhador na indústria', 'Descrever a foto da matéria (definir com a notícia real)'),
    ('IMG-10', 'Notícias e histórias', 'Notícia: Sociedade', 'noticia-sociedade-v2.jpg', '/__l5e/assets-v1/6e246f56-0c08-4839-8c36-eadbc8598762/noticia-sociedade-v2.jpg', 407, 212, 216, 128, '', 'Pessoas em capacitação', 'Descrever a foto da matéria (definir com a notícia real)'),
    ('IMG-11', 'Notícias e histórias', 'Notícia: Inovação', 'noticia-inovacao-v2.jpg', '/__l5e/assets-v1/e77387ed-86a4-4653-ab3b-8107059eb8c8/noticia-inovacao-v2.jpg', 546, 170, 216, 128, '', 'Pessoa usando notebook', 'Descrever a foto da matéria (definir com a notícia real)'),
    ('IMG-12', 'Banner final', 'Faixa "Conheça a SEDES"', 'rio-mirante-v2.jpg', '/__l5e/assets-v1/881bf9be-2ebe-4d58-88e7-e1fd4dd3ba75/rio-mirante-v2.jpg', 1470, 452, 960, 156, '', 'Família em mirante com vista para a Baía de Guanabara', 'Família observando a Baía de Guanabara de um mirante'),
]
# especificação por espaço (ID, espaço, largura, altura, formato, observação)
SPEC = {
    'IMG-01': (None, None, 'SVG (vetor) ou PNG transparente', 'Arquivo oficial da Comunicação Social; respeitar área de proteção do manual de marca'),
    'IMG-02': (2700, 970, 'JPG ou WebP', 'Área à esquerda limpa para o texto; elemento principal à direita'),
    'IMG-03': (800, 320, 'JPG ou WebP', 'Canto inferior esquerdo livre (fica atrás do ícone do eixo); os 3 cards no mesmo tamanho'),
    'IMG-04': (800, 320, 'JPG ou WebP', 'Canto inferior esquerdo livre; os 3 cards no mesmo tamanho'),
    'IMG-05': (800, 320, 'JPG ou WebP', 'Canto inferior esquerdo livre; os 3 cards no mesmo tamanho'),
    'IMG-06': (1280, 840, 'JPG ou WebP', 'Pessoas identificáveis: termo de autorização de imagem (menores: assinatura dos responsáveis)'),
    'IMG-07': (800, 1170, 'JPG ou WebP', 'Foto vertical própria; não reaproveitar o hero'),
    'IMG-08': (800, 475, 'JPG ou WebP', 'Foto da matéria, com crédito do fotógrafo'),
    'IMG-09': (800, 475, 'JPG ou WebP', 'Foto da matéria, com crédito do fotógrafo'),
    'IMG-10': (800, 475, 'JPG ou WebP', 'Foto da matéria, com crédito do fotógrafo'),
    'IMG-11': (800, 475, 'JPG ou WebP', 'Foto da matéria, com crédito do fotógrafo'),
    'IMG-12': (1920, 320, 'JPG ou WebP', 'Panorâmica; texto à esquerda e botão à direita; autorização de imagem das pessoas'),
}

wb = Workbook()

# ---------------- Leia-me ----------------
ws = wb.active
ws.title = 'Leia-me'
faixa(ws, 'Inventário de imagens · Site desenvolvimento.paschoal.rio', 'Dimensões medidas em 27/11/2026 no navegador, com a área do site em 1350 px de largura (desktop)', 5)
ws.column_dimensions['A'].width = 4
ws.column_dimensions['B'].width = 28
for c in 'CDE':
    ws.column_dimensions[c].width = 34
im = XLImage(BRASAO)
im.width, im.height = 190, 67
ws.add_image(im, 'B5')
ws.row_dimensions[5].height = 26
ws.row_dimensions[6].height = 26
txt = [
    ('Objetivo', 'Identificar cada imagem usada no site, com dimensões reais e exibidas, e especificar as fotos definitivas para a ASCOM e o PRODERJ.'),
    ('Origem dos dados', f'Medição feita no navegador (script no Console do Chrome) em {BASE}/. Foram encontradas 12 imagens, todas em tags <img>; nenhuma imagem de fundo CSS.'),
    ('Dimensão real', 'Tamanho do arquivo de imagem em pixels (largura × altura). Não depende da tela.'),
    ('Dimensão exibida', 'Tamanho em que a imagem aparece na tela com a área do site em 1350 px de largura. Muda em telas menores e no celular.'),
    ('Densidade necessária', 'Para telas comuns, o arquivo precisa ser pelo menos do tamanho exibido (1×). Para telas de alta densidade (notebooks e celulares modernos), o dobro (2×). A aba Especificação usa 2×.'),
    ('Abas', '1. Inventário atual: as 12 imagens, com avaliação automática.\n2. Especificação: tamanho, formato e texto alternativo das fotos definitivas, com espaço para o responsável preencher.\n3. Resumo: contagens automáticas.'),
    ('Como preencher', 'Preencha só as células em AMARELO da aba Especificação: arquivo definitivo, crédito, autorização de uso, responsável e status.'),
]
r = 8
for k, v in txt:
    ws.cell(r, 2, k).font = Font(name=F, size=11, bold=True, color=NAVY)
    ws.cell(r, 2).alignment = Alignment(vertical='top')
    ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=5)
    c = ws.cell(r, 3, v)
    c.font = Font(name=F, size=10)
    c.alignment = Alignment(wrap_text=True, vertical='top')
    ws.row_dimensions[r].height = max(30, 15 * (len(v) // 85 + 1 + v.count('\n')))
    r += 1
ws.cell(r + 1, 2, 'Legenda').font = Font(name=F, size=11, bold=True, color=NAVY)
for i, (t, bg) in enumerate([('Adequada', GREEN_BG), ('Atenção', ORANGE_BG), ('Insuficiente / ausente', RED_BG), ('Célula para preencher', YELLOW)]):
    c = ws.cell(r + 2 + i, 2, t)
    c.fill = fill(bg)
    c.font = Font(name=F, size=10)
    c.border = B
ws.sheet_view.showGridLines = False

# ---------------- Inventário atual ----------------
ws = wb.create_sheet('Inventário atual')
cols = ['ID', 'Seção do site', 'Elemento', 'Arquivo', 'URL completa', 'Largura real (px)', 'Altura real (px)', 'Proporção real', 'Largura exibida (px)', 'Altura exibida (px)', 'Proporção exibida', 'Resolução 1× (tela comum)', 'Resolução 2× (alta densidade)', 'Corte (diferença de proporção)', 'Texto alternativo atual', 'Situação do texto alternativo', 'Conteúdo da imagem', 'Observações']
w = [9, 26, 30, 30, 60, 11, 11, 11, 11, 11, 11, 15, 15, 15, 30, 15, 36, 40]
faixa(ws, 'Inventário atual das imagens', f'{BASE}/ · medição em desktop (1350 px) · colunas cinza calculadas automaticamente', len(cols))
head(ws, 5, cols, w)
OBS = {
    'IMG-02': 'Suficiente em tela comum; para alta densidade precisaria de ~2700 px de largura.',
    'IMG-03': 'Altura do arquivo (172) quase igual à exibida (160): baixa resolução.',
    'IMG-04': 'Idem; largura diferente dos outros cards.',
    'IMG-05': 'Idem; largura diferente dos outros cards.',
    'IMG-07': 'Mesmo arquivo do hero, horizontal, exibido em vertical: a maior parte da foto é cortada.',
    'IMG-08': 'Formato muito largo para o espaço: corta as laterais.',
    'IMG-09': 'Formato muito largo para o espaço: corta as laterais.',
    'IMG-10': 'Arquivo menor que o necessário em alta densidade.',
    'IMG-11': 'Formato muito largo para o espaço: corta as laterais.',
}
for n, d in enumerate(IMGS):
    r = 6 + n
    id_, sec, el, arq, cam, rw, rh, ew, eh, alt, cont, _ = d
    cel(ws, r, 1, id_, bold=True, color=BLUE)
    cel(ws, r, 2, sec)
    cel(ws, r, 3, el, bold=True, color=NAVY)
    cel(ws, r, 4, arq)
    u = cel(ws, r, 5, BASE + cam, color='1673D1')
    u.hyperlink = BASE + cam
    for c, v in ((6, rw), (7, rh), (9, ew), (10, eh)):
        cel(ws, r, c, v, center=True, fmt='#,##0')
    cel(ws, r, 8, f'=F{r}/G{r}', center=True, fmt='0.00":1"', bg='F4F6F9')
    cel(ws, r, 11, f'=I{r}/J{r}', center=True, fmt='0.00":1"', bg='F4F6F9')
    # 1×: arquivo cobre o espaço exibido? (considera o corte: precisa cobrir largura e altura)
    cel(ws, r, 12, f'=IF(AND(F{r}>=I{r},G{r}>=J{r}),"Adequada","Insuficiente")', center=True, bg='F4F6F9')
    cel(ws, r, 13, f'=IF(AND(F{r}>=2*I{r},G{r}>=2*J{r}),"Adequada",IF(AND(F{r}>=I{r},G{r}>=J{r}),"Atenção","Insuficiente"))', center=True, bg='F4F6F9')
    cel(ws, r, 14, f'=ABS(H{r}-K{r})/MAX(H{r},K{r})', center=True, fmt='0%', bg='F4F6F9')
    cel(ws, r, 15, alt if alt else '(vazio)', italic=not alt, color='1F2A3D' if alt else GREY)
    cel(ws, r, 16, f'=IF(OR(O{r}="",O{r}="(vazio)"),"Ausente","Presente")', center=True, bg='F4F6F9')
    cel(ws, r, 17, cont)
    cel(ws, r, 18, OBS.get(id_, ''), color=GREY)
END = 5 + len(IMGS)
for col in ('L', 'M', 'P'):
    rng = f'{col}6:{col}{END}'
    ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"Adequada"'], fill=fill(GREEN_BG)))
    ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"Presente"'], fill=fill(GREEN_BG)))
    ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"Atenção"'], fill=fill(ORANGE_BG)))
    ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"Insuficiente"'], fill=fill(RED_BG), font=Font(name=F, bold=True, color='B42318')))
    ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"Ausente"'], fill=fill(RED_BG), font=Font(name=F, bold=True, color='B42318')))
ws.conditional_formatting.add(f'N6:N{END}', CellIsRule(operator='greaterThan', formula=['0.3'], fill=fill(ORANGE_BG)))
ws.cell(END + 2, 1, 'Corte acima de 30% (laranja) indica que boa parte da foto fica fora do espaço exibido. As colunas de resolução comparam largura e altura do arquivo com o espaço exibido.').font = Font(name=F, size=9, italic=True, color=GREY)
ws.freeze_panes = 'D6'
ws.auto_filter.ref = f'A5:R{END}'
ws.sheet_view.zoomScale = 90

# ---------------- Especificação ----------------
ws = wb.create_sheet('Especificação')
cols = ['ID', 'Elemento', 'Tamanho atual (px)', 'Largura recomendada (px)', 'Altura recomendada (px)', 'Proporção recomendada', 'Formato', 'Peso máximo', 'Cuidados', 'Texto alternativo sugerido', 'Arquivo definitivo', 'Crédito / autor', 'Autorização de uso', 'Responsável', 'Status']
w = [9, 30, 14, 13, 13, 12, 18, 11, 46, 44, 26, 20, 16, 14, 14]
faixa(ws, 'Especificação das imagens definitivas', 'Tamanhos para telas de alta densidade (2×), na proporção de cada espaço. Preencha as colunas em amarelo.', len(cols))
head(ws, 5, cols, w)
for n, d in enumerate(IMGS):
    r = 6 + n
    id_, el, rw, rh, altsug = d[0], d[2], d[5], d[6], d[11]
    lw, lh, fmt_, cui = SPEC[id_]
    cel(ws, r, 1, id_, bold=True, color=BLUE)
    cel(ws, r, 2, el, bold=True, color=NAVY)
    cel(ws, r, 3, f"='Inventário atual'!F{r}&\" × \"&'Inventário atual'!G{r}", center=True, color='008000')
    cel(ws, r, 4, lw if lw else 'Vetor', center=True, fmt='#,##0', color='0000FF')
    cel(ws, r, 5, lh if lh else 'Vetor', center=True, fmt='#,##0', color='0000FF')
    cel(ws, r, 6, f'=IF(ISNUMBER(D{r}),D{r}/E{r},"—")', center=True, fmt='0.00":1"')
    cel(ws, r, 7, fmt_, center=True)
    cel(ws, r, 8, '50 KB' if id_ == 'IMG-01' else ('500 KB' if id_ in ('IMG-02', 'IMG-12') else '300 KB'), center=True, color='0000FF')
    cel(ws, r, 9, cui)
    cel(ws, r, 10, altsug)
    for c in (11, 12, 13, 14):
        cel(ws, r, c, None, bg=YELLOW)
    cel(ws, r, 15, 'Pendente', center=True, bg=YELLOW)
SEND = 5 + len(IMGS)
for col, lst in (('M', '"Sim,Não,Em andamento,Não se aplica"'), ('O', '"Pendente,Em produção,Em validação,Validado"')):
    dv = DataValidation(type='list', formula1=lst, allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f'{col}6:{col}{SEND}')
ws.conditional_formatting.add(f'O6:O{SEND}', CellIsRule(operator='equal', formula=['"Validado"'], fill=fill(GREEN_BG)))
notas = [
    'Premissas (definidas por esta especificação, ajustáveis): tamanhos em 2× o espaço exibido em desktop, arredondados; pesos máximos são metas de desempenho.',
    'Texto azul = valor de entrada editável; texto verde = lido da aba Inventário atual.',
    'IMG-08 a IMG-11 mudam com cada notícia publicada: a especificação vale como padrão para todas as fotos de notícia.',
]
for i, t in enumerate(notas):
    ws.cell(SEND + 2 + i, 1, t).font = Font(name=F, size=9, italic=True, color=GREY)
ws.freeze_panes = 'C6'

# ---------------- Resumo ----------------
ws = wb.create_sheet('Resumo')
faixa(ws, 'Resumo', 'Contagens automáticas a partir das outras abas.', 4)
ws.column_dimensions['A'].width = 4
ws.column_dimensions['B'].width = 46
ws.column_dimensions['C'].width = 12
ws.column_dimensions['D'].width = 50
I = "'Inventário atual'"
itens = [
    ('Imagens no site', f'=COUNTA({I}!A6:A{END})', 'Todas em tags <img>; nenhuma imagem de fundo CSS'),
    ('Arquivos distintos', f'=SUMPRODUCT(1/COUNTIF({I}!E6:E{END},{I}!E6:E{END}))', 'O hero (IMG-02) é reaproveitado no Destaque (IMG-07)'),
    ('Resolução insuficiente em tela comum (1×)', f'=COUNTIF({I}!L6:L{END},"Insuficiente")', ''),
    ('Abaixo do ideal em alta densidade (2×)', f'=COUNTIF({I}!M6:M{END},"<>Adequada")', 'Atenção + Insuficiente'),
    ('Imagens com corte acima de 30%', f'=COUNTIF({I}!N6:N{END},">0.3")', 'Proporção do arquivo muito diferente do espaço'),
    ('Imagens sem texto alternativo', f'=COUNTIF({I}!P6:P{END},"Ausente")', 'Exigência do e-MAG e da Lei nº 13.146/2015 (LBI)'),
    ('Imagens validadas na especificação', f"=COUNTIF('Especificação'!O6:O{SEND},\"Validado\")", ''),
]
for i, (n, f_, o) in enumerate(itens):
    r = 5 + i
    cel(ws, r, 2, n)
    cel(ws, r, 3, f_, center=True, bold=True, color=NAVY, fmt='0')
    cel(ws, r, 4, o, color=GREY)
ws.sheet_view.showGridLines = False

for sh in wb.worksheets:
    sh.sheet_properties.tabColor = NAVY if sh.title in ('Leia-me', 'Resumo') else BLUE
    sh.page_setup.orientation = 'landscape'
    sh.page_setup.fitToWidth = 1
    sh.page_setup.fitToHeight = 0
    sh.sheet_properties.pageSetUpPr.fitToPage = True
    sh.oddFooter.left.text = 'SEDES RJ · Inventário de imagens do site'
    sh.oddFooter.right.text = 'Página &P de &N'
wb.save(OUT)
print('ok')
