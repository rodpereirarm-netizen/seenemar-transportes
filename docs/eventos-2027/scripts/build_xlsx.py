"""Gera a planilha consolidada do Levantamento de Eventos 2027 - SEDES/RJ.

Uso: python build_xlsx.py <pasta_origem> <arquivo_saida.xlsx>
Os resumos são calculados por fórmulas sobre uma Base técnica completa,
recalculados pelo LibreOffice e gravados como valores; a Base entregue é a
versão enxuta (sem as colunas retiradas a pedido da SEDES).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.comments import Comment
from openpyxl.formatting.rule import CellIsRule, ColorScaleRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableStyleInfo

import etl

# ---------------- identidade visual (Governo do Estado do RJ) ----------------
AZUL_ESC = "002F6C"   # azul institucional
AZUL = "0060A8"       # azul médio
AZUL_CLARO = "DCE8F5"
AZUL_SUAVE = "F2F6FB"
DOURADO = "C9A227"    # acento (brasão)
CINZA_TXT = "4B5563"
BRANCO = "FFFFFF"
FONTE = "Arial"

f_titulo = Font(name=FONTE, size=15, bold=True, color=BRANCO)
f_sub = Font(name=FONTE, size=10, color=BRANCO)
f_secao = Font(name=FONTE, size=12, bold=True, color=AZUL_ESC)
f_head = Font(name=FONTE, size=10, bold=True, color=BRANCO)
f_txt = Font(name=FONTE, size=10, color="1F2937")
f_bold = Font(name=FONTE, size=10, bold=True, color="1F2937")
f_nota = Font(name=FONTE, size=9, italic=True, color=CINZA_TXT)
f_kpi = Font(name=FONTE, size=20, bold=True, color=AZUL_ESC)
f_kpi_lbl = Font(name=FONTE, size=9, color=CINZA_TXT)
fill = lambda c: PatternFill("solid", fgColor=c)
fino = Side(style="thin", color="C7D3E3")
borda = Border(left=fino, right=fino, top=fino, bottom=fino)
borda_total = Border(top=Side(style="medium", color=AZUL_ESC), bottom=Side(style="medium", color=AZUL_ESC),
                     left=fino, right=fino)
centro = Alignment(horizontal="center", vertical="center", wrap_text=True)
esq = Alignment(horizontal="left", vertical="center", wrap_text=True)
NUM = '#,##0;-#,##0;"–"'
PCT = '0.0%;-0.0%;"–"'

ULT = 1000  # última linha coberta pelos nomes definidos (permite acrescentar eventos)


def cabecalho(ws, titulo, subtitulo, ncols):
    """Faixa institucional azul + filete dourado, no padrão visual do Governo do RJ."""
    last = get_column_letter(ncols)
    ws.merge_cells(f"A1:{last}1")
    ws.merge_cells(f"A2:{last}2")
    ws["A1"] = "GOVERNO DO ESTADO DO RIO DE JANEIRO  ·  SEDES — " + titulo
    ws["A2"] = subtitulo
    for r, f, h in ((1, f_titulo, 30), (2, f_sub, 20)):
        ws.row_dimensions[r].height = h
        for c in range(1, ncols + 1):
            ws.cell(r, c).fill = fill(AZUL_ESC)
        ws.cell(r, 1).font = f
        ws.cell(r, 1).alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.row_dimensions[3].height = 4
    for c in range(1, ncols + 1):
        ws.cell(3, c).fill = fill(DOURADO)
    ws.sheet_view.showGridLines = False


def secao(ws, row, col, texto, nota=None):
    ws.cell(row, col, texto).font = f_secao
    if nota:
        ws.cell(row + 1, col, nota).font = f_nota


def head(ws, row, col, textos, altura=32):
    for i, t in enumerate(textos):
        c = ws.cell(row, col + i, t)
        c.font, c.fill, c.alignment, c.border = f_head, fill(AZUL_ESC), centro, borda
    ws.row_dimensions[row].height = altura


def body(c, fmt=None, bold=False, zebra=False, align=None):
    c.font = f_bold if bold else f_txt
    c.border = borda
    c.alignment = align or (centro if fmt else esq)
    if fmt:
        c.number_format = fmt
    if zebra:
        c.fill = fill(AZUL_SUAVE)


def linha_total(ws, row, c1, c2):
    for c in range(c1, c2 + 1):
        cell = ws.cell(row, c)
        cell.font, cell.fill, cell.border = f_bold, fill(AZUL_CLARO), borda_total


def larguras(ws, mapa):
    for col, w in mapa.items():
        ws.column_dimensions[col].width = w


# ---------------------------------------------------------------------------
BASE_COLS = [
    # (cabeçalho, chave do registro ou fórmula, largura, formato, nome definido)
    ("ID", "ID", 8, None, "bID"),
    ("Unidade remetente", "Unidade remetente", 13, None, "bUnidade"),
    ("Subsecretaria", "Subsecretaria", 13, None, "bSub"),
    ("Setor", "Setor", 20, None, "bSetor"),
    ("Nome do evento", "Nome do evento", 52, None, None),
    ("Categoria", "Categoria", 22, None, "bCategoria"),
    ("Data/período (original)", "Data/período (original)", 18, None, None),
    ("Tipo de período", "Tipo de período", 15, None, "bTipo"),
    ("Data início", "Data início", 11, "DD/MM/YYYY", None),
    ("Data fim", "Data fim", 11, "DD/MM/YYYY", None),
    ("Mês definido?", "Mês definido?", 12, None, "bMesDef"),
    ("Mês ref. (nº)", "=IF(I{r}=\"\",\"\",MONTH(I{r}))", 8, "0", "bMes"),
    ("Mês ref.", "=IF(L{r}=\"\",\"\",INDEX(Listas!$A$2:$A$13,L{r}))", 8, None, None),
    ("Trimestre", "=IF(L{r}=\"\",\"\",\"T\"&ROUNDUP(L{r}/3,0))", 9, None, "bTrim"),
    ("Semestre", "=IF(L{r}=\"\",\"\",IF(L{r}<=6,\"1º Semestre\",\"2º Semestre\"))", 12, None, "bSem"),
    ("Público estimado", "Público estimado", 10, NUM, "bPublico"),
    ("Público entra nos totais?", "Público entra nos totais?", 11, None, "bPubTot"),
    ("Necessita buffet?", "Necessita buffet?", 10, None, "bBuffet"),
    ("Modalidade de buffet", "Modalidade de buffet", 20, None, "bModal"),
    ("Pessoas buffet", "Pessoas buffet", 10, NUM, "bPessoas"),
    ("Status", "Status", 16, None, "bStatus"),
    ("Demanda de buffet",
     "=IF(R{r}=\"\",\"\",IF(R{r}=\"Não\",\"Sem buffet\",IF(U{r}=\"Hipótese (validar)\",\"Hipótese\","
     "IF(AND(R{r}=\"Sim\",U{r}=\"Previsto\"),\"Firme\",\"Condicionada\"))))", 13, None, "bDemanda"),
    ("Formato", "Formato", 14, None, None),
    ("Observações", "Observações", 60, None, None),
    ("Subsecretaria / Setor (original)", "Subsecretaria / Setor (original)", 22, None, None),
    ("Público (original)", "Público (original)", 12, None, None),
    ("Pessoas buffet (original)", "Pessoas buffet (original)", 12, None, None),
    ("Arquivo de origem", "Arquivo de origem", 40, None, None),
    ("Aba / linha de origem", "Aba / linha de origem", 30, None, None),
]
BASE = "'Base Consolidada'"
HIP = "Hipótese (validar)"
MOD_CURTO = {"Coffee Simples": "Coffee Simples", "Brunch": "Brunch", "Coquetel": "Coquetel",
             "Buffet – Almoço/Jantar": "Almoço/Jantar", "A definir": "A definir (modalidade)"}


def build_base(wb, regs):
    ws = wb.create_sheet("Base Consolidada")
    n = len(BASE_COLS)
    cabecalho(ws, "BASE CONSOLIDADA DE EVENTOS 2027",
              f"{len(regs)} linhas · 1 linha por evento/ocorrência · colunas L–O e V são fórmulas · "
              "edite aqui e todos os resumos se atualizam", n)
    hr = 4
    for i, (h, *_rest) in enumerate(BASE_COLS, start=1):
        c = ws.cell(hr, i, h)
        c.font, c.fill, c.alignment = f_head, fill(AZUL_ESC), centro
        ws.column_dimensions[get_column_letter(i)].width = BASE_COLS[i - 1][2]
    ws.row_dimensions[hr].height = 34
    for k, reg in enumerate(regs):
        r = hr + 1 + k
        for i, (h, src, w, fmt, nome) in enumerate(BASE_COLS, start=1):
            v = src.format(r=r) if src.startswith("=") else reg[src]
            c = ws.cell(r, i, v)
            c.font = f_txt
            c.alignment = Alignment(vertical="top", wrap_text=i in (5, 24))
            if fmt:
                c.number_format = fmt
    last = hr + len(regs)
    tab = Table(displayName="tbBase", ref=f"A{hr}:{get_column_letter(n)}{last}")
    tab.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=True)
    ws.add_table(tab)
    ws.freeze_panes = "F5"
    # nomes definidos usados pelos resumos
    for i, (h, src, w, fmt, nome) in enumerate(BASE_COLS, start=1):
        if nome:
            col = get_column_letter(i)
            wb.defined_names[nome] = DefinedName(nome, attr_text=f"{BASE}!${col}${hr + 1}:${col}${ULT}")
    # listas suspensas para manutenção
    for col, lista in (("R", '"Sim,Não,A definir"'),
                       ("S", "=Listas!$C$2:$C$7"),
                       ("U", '"Previsto,Condicionado,Hipótese (validar)"'),
                       ("K", '"Sim,Não (estimado)"'),
                       ("Q", '"Sim,Não"')):
        dv = DataValidation(type="list", formula1=lista, allow_blank=True)
        dv.add(f"{col}{hr + 1}:{col}{ULT}")
        ws.add_data_validation(dv)
    # destaques condicionais
    rng = f"A{hr + 1}:{get_column_letter(n)}{last}"
    ws.conditional_formatting.add(rng, FormulaRule(formula=[f'$U{hr + 1}="{HIP}"'],
                                                   font=Font(name=FONTE, italic=True, color="8A6D00")))
    ws.conditional_formatting.add(f"V{hr + 1}:V{last}", CellIsRule(operator="equal", formula=['"Firme"'],
                                  fill=fill("D9F0DF"), font=Font(name=FONTE, bold=True, color="1E5631")))
    ws.conditional_formatting.add(f"V{hr + 1}:V{last}", CellIsRule(operator="equal", formula=['"Condicionada"'],
                                  fill=fill("FFF1C7"), font=Font(name=FONTE, bold=True, color="7A5A00")))
    ws.conditional_formatting.add(f"V{hr + 1}:V{last}", CellIsRule(operator="equal", formula=['"Hipótese"'],
                                  fill=fill("EDE7F6"), font=Font(name=FONTE, color="4A3A75")))
    ws.cell(hr, 22).comment = Comment(
        "Firme = buffet Sim e status Previsto. Condicionada = buffet Sim com status Condicionado, "
        "ou buffet A definir. Hipótese = aba 'Hipóteses internas' da SUPATI. Sem buffet = Não.", "Consolidação")
    ws.cell(hr, 12).comment = Comment(
        "Mês de referência = mês da Data início. Para bimestre/trimestre/semestre é o 1º mês da janela "
        "(critério conservador para planejamento da contratação).", "Consolidação")
    return ws


def build_listas(wb):
    ws = wb.create_sheet("Listas")
    ws["A1"], ws["B1"], ws["C1"], ws["D1"] = "Mês", "Nº", "Modalidade", "Descrição / composição (aba Orientações)"
    for i, m in enumerate(etl.MESES, start=1):
        ws.cell(i + 1, 1, m)
        ws.cell(i + 1, 2, i)
    desc = {
        "Coffee Simples": "Indicado para cafés da manhã, intervalos de reuniões e eventos (coffee breaks) e cafés de "
                          "encerramento. Inclui bebidas quentes e frias, acompanhadas de itens leves, doces e salgados.",
        "Brunch": "Serviço entre café da manhã e almoço, com cardápio reforçado: bebidas quentes e frias, pães, "
                  "salgados, pratos leves e sobremesas.",
        "Coquetel": "Serviço para recepções e solenidades, com entradas, canapés, salgados, mini porções individuais "
                    "(finger foods) e sobremesas.",
        "Buffet – Almoço/Jantar": "Refeição completa, com entradas frias, salgados variados, pelo menos duas opções de "
                                  "pratos quentes, acompanhamentos e sobremesas.",
        "A definir": "Unidade indicou necessidade (ou possível necessidade) de buffet sem escolher a modalidade.",
        "Não se aplica": "Para eventos sem necessidade de contratação de buffet.",
    }
    for i, m in enumerate(etl.MODALIDADES_TODAS, start=2):
        ws.cell(i, 3, m)
        ws.cell(i, 4, desc[m])
    for c in "ABCD":
        ws[f"{c}1"].font, ws[f"{c}1"].fill = f_head, fill(AZUL_ESC)
    larguras(ws, {"A": 8, "B": 5, "C": 24, "D": 100})
    ws.sheet_state = "hidden"
    return desc


# ---------------------------------------------------------------------------
def build_painel(wb, regs, contagem):
    ws = wb.create_sheet("Painel", 0)
    cabecalho(ws, "LEVANTAMENTO DE EVENTOS 2027",
              "Painel consolidado das 7 planilhas recebidas · mínimo de 30 pessoas por evento · valores calculados na consolidação", 12)
    larguras(ws, {c: 14 for c in "ABCDEFGHIJKL"})
    ws.column_dimensions["A"].width = 24
    kpis = [
        ("Eventos previstos\n(exceto hipóteses)", f'=COUNTIFS(bStatus,"<>{HIP}",bID,"<>")'),
        ("Status Previsto", '=COUNTIFS(bStatus,"Previsto")'),
        ("Status Condicionado", '=COUNTIFS(bStatus,"Condicionado")'),
        ("Hipóteses a validar", f'=COUNTIFS(bStatus,"{HIP}")'),
        ("Pessoas – buffet\nFIRME", '=SUMIFS(bPessoas,bDemanda,"Firme")'),
        ("Pessoas – buffet\nCONDICIONADO", '=SUMIFS(bPessoas,bDemanda,"Condicionada")'),
    ]
    secao(ws, 5, 1, "Indicadores-chave")
    for i, (lbl, f) in enumerate(kpis):
        col = 1 + i * 2
        ws.merge_cells(start_row=6, start_column=col, end_row=6, end_column=col + 1)
        ws.merge_cells(start_row=7, start_column=col, end_row=7, end_column=col + 1)
        c = ws.cell(6, col, f)
        c.font, c.alignment, c.number_format = f_kpi, centro, NUM
        l = ws.cell(7, col, lbl)
        l.font, l.alignment = f_kpi_lbl, centro
        for r in (6, 7):
            for cc in (col, col + 1):
                ws.cell(r, cc).fill = fill(AZUL_SUAVE)
                ws.cell(r, cc).border = Border(top=Side(style="thick", color=AZUL) if r == 6 else None)
    ws.row_dimensions[6].height = 38
    ws.row_dimensions[7].height = 30
    kpis2 = [
        ("Eventos com buffet\n(firme + condicionado)", '=COUNTIFS(bDemanda,"Firme")+COUNTIFS(bDemanda,"Condicionada")'),
        ("Cenário máximo de\npessoas no buffet", '=E6*0+SUMIFS(bPessoas,bDemanda,"Firme")+SUMIFS(bPessoas,bDemanda,"Condicionada")'),
        ("Público estimado\n(exceto feiras externas)", f'=SUMIFS(bPublico,bPubTot,"Sim",bStatus,"<>{HIP}")'),
        ("Eventos com mês\nexato definido", f'=COUNTIFS(bMesDef,"Sim",bStatus,"<>{HIP}")'),
        ("Eventos com mês\nestimado (janela)", f'=COUNTIFS(bMesDef,"Não (estimado)",bStatus,"<>{HIP}")'),
        ("Inconsistências\napontadas", "=COUNTA(Inconsistências!$A$6:$A$500)"),
    ]
    for i, (lbl, f) in enumerate(kpis2):
        col = 1 + i * 2
        ws.merge_cells(start_row=9, start_column=col, end_row=9, end_column=col + 1)
        ws.merge_cells(start_row=10, start_column=col, end_row=10, end_column=col + 1)
        c = ws.cell(9, col, f.replace("=E6*0+", "="))
        c.font, c.alignment, c.number_format = f_kpi, centro, NUM
        l = ws.cell(10, col, lbl)
        l.font, l.alignment = f_kpi_lbl, centro
        for r in (9, 10):
            for cc in (col, col + 1):
                ws.cell(r, cc).fill = fill(AZUL_SUAVE)
                ws.cell(r, cc).border = Border(top=Side(style="thick", color=DOURADO) if r == 9 else None)
    ws.row_dimensions[9].height = 38
    ws.row_dimensions[10].height = 30

    # por unidade remetente
    r0 = 12
    secao(ws, r0, 1, "Resumo por planilha recebida (unidade remetente)")
    cols = ["Unidade remetente", "Linhas recebidas", "Eventos (exc. hipóteses)", "Previstos", "Condicionados",
            "Hipóteses", "Público (exc. feiras ext.)", "Eventos c/ buffet", "Pessoas buffet firme",
            "Pessoas buffet condic.", "Cenário máximo pessoas", "Inconsis-\ntências"]
    head(ws, r0 + 1, 1, cols, 34)
    unidades = list(etl.ARQUIVOS.values())
    for k, u in enumerate(unidades):
        r = r0 + 2 + k
        z = k % 2 == 1
        ws.cell(r, 1, u)
        fs = [
            f'=COUNTIFS(bUnidade,$A{r})',
            f'=COUNTIFS(bUnidade,$A{r},bStatus,"<>{HIP}")',
            f'=COUNTIFS(bUnidade,$A{r},bStatus,"Previsto")',
            f'=COUNTIFS(bUnidade,$A{r},bStatus,"Condicionado")',
            f'=COUNTIFS(bUnidade,$A{r},bStatus,"{HIP}")',
            f'=SUMIFS(bPublico,bUnidade,$A{r},bPubTot,"Sim",bStatus,"<>{HIP}")',
            f'=COUNTIFS(bUnidade,$A{r},bDemanda,"Firme")+COUNTIFS(bUnidade,$A{r},bDemanda,"Condicionada")',
            f'=SUMIFS(bPessoas,bUnidade,$A{r},bDemanda,"Firme")',
            f'=SUMIFS(bPessoas,bUnidade,$A{r},bDemanda,"Condicionada")',
            f'=I{r}+J{r}',
            f'=COUNTIFS(Inconsistências!$B$6:$B$500,$A{r})',
        ]
        body(ws.cell(r, 1), zebra=z, bold=True)
        for j, f in enumerate(fs, start=2):
            ws.cell(r, j, f)
            body(ws.cell(r, j), NUM, zebra=z)
    rt = r0 + 2 + len(unidades)
    ws.cell(rt, 1, "TOTAL")
    for j in range(2, 13):
        L = get_column_letter(j)
        ws.cell(rt, j, f"=SUM({L}{r0 + 2}:{L}{rt - 1})").number_format = NUM
        ws.cell(rt, j).alignment = centro
    linha_total(ws, rt, 1, 12)

    rn = rt + 2
    notas = [
        "Como ler: 'Firme' = buffet Sim e status Previsto · 'Condicionado' = depende de patrocínio, de contatos efetivos, "
        "de anúncio de investimento ou de confirmação da unidade (inclui buffet 'A definir') · 'Hipótese' = sugestões "
        "internas da SUPATI ainda não validadas pela chefia (fora dos totais).",
        "Público das feiras externas da SUBENEMAR (Energy Summit, Rio Pipeline, OTC: 46 mil pessoas) refere-se ao público "
        "total da feira e por isso não entra no total de público; o buffet dessas feiras (30 pessoas cada) entra como condicionado.",
        "Detalhes: abas 'Eventos por Período', 'Quantitativo Buffet', 'Necessidade Mensal', 'Agenda de Buffet', "
        "'Inconsistências' e 'Notas Metodológicas'.",
    ]
    for i, t in enumerate(notas):
        ws.merge_cells(start_row=rn + i, start_column=1, end_row=rn + i, end_column=12)
        c = ws.cell(rn + i, 1, t)
        c.font, c.alignment = f_nota, esq
        ws.row_dimensions[rn + i].height = 28
    ws.freeze_panes = "A4"
    return ws


# ---------------------------------------------------------------------------
PER_COLS = ["Eventos\n(exc. hipóteses)", "Mês exato", "Mês estimado\n(janela)", "Previstos", "Condicionados",
            "Público\n(exc. feiras ext.)", "Eventos c/\nbuffet", "Pessoas buffet\nfirme", "Pessoas buffet\ncondicionado",
            "Cenário máximo\npessoas", "Hipóteses\n(fora dos totais)"]


def _per_formulas(crit):
    """crit = string de critérios extra, ex.: 'bMes,$A7'."""
    c = f",{crit}" if crit else ""
    return [
        f'=COUNTIFS(bStatus,"<>{HIP}",bID,"<>"{c})',
        f'=COUNTIFS(bStatus,"<>{HIP}",bMesDef,"Sim"{c})',
        f'=COUNTIFS(bStatus,"<>{HIP}",bMesDef,"Não (estimado)"{c})',
        f'=COUNTIFS(bStatus,"Previsto"{c})',
        f'=COUNTIFS(bStatus,"Condicionado"{c})',
        f'=SUMIFS(bPublico,bStatus,"<>{HIP}",bPubTot,"Sim"{c})',
        f'=COUNTIFS(bDemanda,"Firme"{c})+COUNTIFS(bDemanda,"Condicionada"{c})',
        f'=SUMIFS(bPessoas,bDemanda,"Firme"{c})',
        f'=SUMIFS(bPessoas,bDemanda,"Condicionada"{c})',
        None,  # cenário máximo = soma das duas anteriores
        f'=COUNTIFS(bStatus,"{HIP}"{c})',
    ]


def _bloco_periodo(ws, r0, titulo, nota, rotulos, campo):
    """rotulos: lista de (chave, rótulo). campo: nome definido usado como critério (ou None)."""
    secao(ws, r0, 1, titulo, nota)
    head(ws, r0 + 2, 1, ["Chave", "Período"] + PER_COLS, 40)
    first = r0 + 3
    for k, (chave, rot) in enumerate(rotulos):
        r = first + k
        z = k % 2 == 1
        ws.cell(r, 1, chave)
        ws.cell(r, 2, rot)
        body(ws.cell(r, 1), "0" if isinstance(chave, int) else "@", zebra=z)
        body(ws.cell(r, 2), zebra=z, bold=True)
        for j, f in enumerate(_per_formulas(f"{campo},$A{r}"), start=3):
            if f is None:
                f = f"=J{r}+K{r}"
            ws.cell(r, j, f)
            body(ws.cell(r, j), NUM, zebra=z)
    rt = first + len(rotulos)
    ws.cell(rt, 2, "TOTAL")
    for j in range(3, 14):
        L = get_column_letter(j)
        ws.cell(rt, j, f"=SUM({L}{first}:{L}{rt - 1})").number_format = NUM
        ws.cell(rt, j).alignment = centro
    linha_total(ws, rt, 1, 13)
    return first, rt


def build_periodo(wb, regs):
    ws = wb.create_sheet("Eventos por Período")
    cabecalho(ws, "EVENTOS POR MÊS · TRIMESTRE · SEMESTRE",
              "Consolidação de todas as unidades · mês de referência = mês de início (janelas de bimestre/trimestre/"
              "semestre entram no 1º mês da janela)", 14)
    larguras(ws, {"A": 13, "B": 22, **{get_column_letter(c): 13 for c in range(3, 15)}})
    r = 5
    mf, mt = _bloco_periodo(ws, r, "1. Consolidado por MÊS", "Coluna 'Mês estimado' = eventos informados só por "
                            "bimestre/trimestre/semestre, alocados no 1º mês da janela.",
                            [(i, m) for i, m in enumerate(etl.MESES_EXTENSO, 1)], "bMes")
    for rr in range(mf, mt):
        ws.cell(rr, 2).value = ws.cell(rr, 2).value.capitalize()
    r = mt + 3
    tf, tt = _bloco_periodo(ws, r, "2. Consolidado por TRIMESTRE", None,
                            [("T1", "1º Trimestre (Jan–Mar)"), ("T2", "2º Trimestre (Abr–Jun)"),
                             ("T3", "3º Trimestre (Jul–Set)"), ("T4", "4º Trimestre (Out–Dez)")], "bTrim")
    r = tt + 3
    sf, st = _bloco_periodo(ws, r, "3. Consolidado por SEMESTRE", None,
                            [("1º Semestre", "1º Semestre (Jan–Jun)"), ("2º Semestre", "2º Semestre (Jul–Dez)")],
                            "bSem")
    r = st + 3
    pf, pt = _bloco_periodo(ws, r, "4. Por TIPO DE PERÍODO informado pelas unidades",
                            "Mostra o grau de precisão das datas informadas.",
                            [(t, t) for t in ("Data exata", "Intervalo de datas", "Mês", "Bimestre", "Trimestre",
                                              "Semestre")], "bTipo")
    # 5. matriz setor x mês
    r = pt + 3
    secao(ws, r, 1, "5. Nº de eventos por SETOR e MÊS (exceto hipóteses)",
          "Leitura rápida do calendário: quantos eventos cada setor prevê em cada mês de referência.")
    head(ws, r + 2, 1, ["Subsec.", "Setor"] + etl.MESES + ["Total"], 24)
    setores = sorted({(g["Subsecretaria"], g["Setor"]) for g in regs if g["Status"] != HIP})
    first = r + 3
    for k, (sub, setor) in enumerate(setores):
        rr = first + k
        z = k % 2 == 1
        ws.cell(rr, 1, sub)
        ws.cell(rr, 2, setor)
        body(ws.cell(rr, 1), zebra=z)
        body(ws.cell(rr, 2), zebra=z, bold=True)
        for m in range(1, 13):
            ws.cell(rr, 2 + m, f'=COUNTIFS(bSub,$A{rr},bSetor,$B{rr},bMes,{m},bStatus,"<>{HIP}")')
            body(ws.cell(rr, 2 + m), NUM, zebra=z)
        ws.cell(rr, 15, f"=SUM(C{rr}:N{rr})")
        body(ws.cell(rr, 15), NUM, bold=True, zebra=z)
    rt = first + len(setores)
    ws.cell(rt, 2, "TOTAL")
    for j in range(3, 16):
        L = get_column_letter(j)
        ws.cell(rt, j, f"=SUM({L}{first}:{L}{rt - 1})").number_format = NUM
        ws.cell(rt, j).alignment = centro
    linha_total(ws, rt, 1, 15)
    ws.conditional_formatting.add(f"C{first}:N{rt - 1}",
                                  ColorScaleRule(start_type="num", start_value=0, start_color="FFFFFF",
                                                 end_type="max", end_color="5B8FC9"))
    ws.column_dimensions["O"].width = 9
    ws.freeze_panes = "C4"
    # gráfico: eventos por mês
    ch = BarChart()
    ch.type, ch.style = "col", 10
    ch.title = "Eventos por mês de referência (exceto hipóteses)"
    ch.y_axis.title = "Eventos"
    ch.add_data(Reference(ws, min_col=3, min_row=mf - 1, max_row=mt - 1), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=2, min_row=mf, max_row=mt - 1))
    ch.series[0].graphicalProperties.solidFill = AZUL
    ch.series[0].graphicalProperties.line.solidFill = AZUL
    ch.legend = None
    ch.dataLabels = DataLabelList()
    ch.dataLabels.showVal = True
    ch.dataLabels.showSerName = ch.dataLabels.showCatName = ch.dataLabels.showLegendKey = ch.dataLabels.showPercent = False
    ch.height, ch.width = 8, 20
    ws.add_chart(ch, f"P{mf - 2}")
    return dict(mes=(mf, mt), trim=(tf, tt), sem=(sf, st), tipo=(pf, pt), setor=(first, rt))


# ---------------------------------------------------------------------------
def build_buffet(wb, regs, desc):
    ws = wb.create_sheet("Quantitativo Buffet")
    cabecalho(ws, "QUANTITATIVO DE BUFFET POR TIPO DE SERVIÇO",
              "Nº de eventos e de pessoas atendidas por modalidade · demanda firme, condicionada e cenário máximo", 13)
    larguras(ws, {"A": 26, "B": 50, **{get_column_letter(c): 13 for c in range(3, 14)}})
    secao(ws, 5, 1, "1. Quantitativo por MODALIDADE (tipo de serviço)",
          "Cenário máximo = firme + condicionado. Hipóteses da SUPATI aparecem à parte e não entram nos totais.")
    head(ws, 7, 1, ["Modalidade", "Descrição do serviço", "Eventos\nfirmes", "Pessoas\nfirmes", "Eventos\ncondicionados",
                    "Pessoas\ncondicionadas", "Eventos\n(cenário máx.)", "Pessoas\n(cenário máx.)",
                    "% das pessoas\n(cenário máx.)", "Média pessoas\npor evento", "Maior evento\n(pessoas)",
                    "Hipóteses\neventos", "Hipóteses\npessoas"], 42)
    first = 8
    for k, m in enumerate(etl.MODALIDADES):
        r = first + k
        z = k % 2 == 1
        ws.cell(r, 1, m)
        ws.cell(r, 2, desc[m])
        body(ws.cell(r, 1), zebra=z, bold=True)
        body(ws.cell(r, 2), zebra=z)
        ws.cell(r, 2).font = Font(name=FONTE, size=9, color=CINZA_TXT)
        fs = [f'=COUNTIFS(bModal,$A{r},bDemanda,"Firme")', f'=SUMIFS(bPessoas,bModal,$A{r},bDemanda,"Firme")',
              f'=COUNTIFS(bModal,$A{r},bDemanda,"Condicionada")',
              f'=SUMIFS(bPessoas,bModal,$A{r},bDemanda,"Condicionada")',
              f"=C{r}+E{r}", f"=D{r}+F{r}", f"=IF($H${first + len(etl.MODALIDADES)}=0,0,H{r}/$H${first + len(etl.MODALIDADES)})",
              f"=IF(G{r}=0,0,H{r}/G{r})",
              f'=MAX(_xlfn.MAXIFS(bPessoas,bModal,$A{r},bDemanda,"Firme"),'
              f'_xlfn.MAXIFS(bPessoas,bModal,$A{r},bDemanda,"Condicionada"))',
              f'=COUNTIFS(bModal,$A{r},bDemanda,"Hipótese")', f'=SUMIFS(bPessoas,bModal,$A{r},bDemanda,"Hipótese")']
        fmts = [NUM] * 6 + [PCT, "0.0", NUM, NUM, NUM]
        for j, (f, fm) in enumerate(zip(fs, fmts), start=3):
            ws.cell(r, j, f)
            body(ws.cell(r, j), fm, zebra=z)
        ws.row_dimensions[r].height = 36
    rt = first + len(etl.MODALIDADES)
    ws.cell(rt, 1, "TOTAL")
    for j in range(3, 14):
        L = get_column_letter(j)
        if j == 9:
            f = f"=SUM(I{first}:I{rt - 1})"
        elif j == 10:
            f = f"=IF(G{rt}=0,0,H{rt}/G{rt})"
        elif j == 11:
            f = f"=MAX(K{first}:K{rt - 1})"
        else:
            f = f"=SUM({L}{first}:{L}{rt - 1})"
        ws.cell(rt, j, f).number_format = {9: PCT, 10: "0.0"}.get(j, NUM)
        ws.cell(rt, j).alignment = centro
    linha_total(ws, rt, 1, 13)
    blocos = {"modal": (first, rt)}

    def matriz(r0, titulo, nota, colunas, campo, demanda_list):
        secao(ws, r0, 1, titulo, nota)
        head(ws, r0 + 2, 1, ["Modalidade", ""] + [c[1] for c in colunas] + ["Total"], 30)
        f0 = r0 + 3
        for k, m in enumerate(etl.MODALIDADES):
            r = f0 + k
            z = k % 2 == 1
            ws.cell(r, 1, m)
            body(ws.cell(r, 1), zebra=z, bold=True)
            body(ws.cell(r, 2), zebra=z)
            for j, (chave, _) in enumerate(colunas, start=3):
                partes = [f'SUMIFS(bPessoas,bModal,$A{r},{campo},"{chave}",bDemanda,"{d}")' for d in demanda_list]
                ws.cell(r, j, "=" + "+".join(partes))
                body(ws.cell(r, j), NUM, zebra=z)
            Lz = get_column_letter(2 + len(colunas))
            ws.cell(r, 3 + len(colunas), f"=SUM(C{r}:{Lz}{r})")
            body(ws.cell(r, 3 + len(colunas)), NUM, bold=True, zebra=z)
        t = f0 + len(etl.MODALIDADES)
        ws.cell(t, 1, "TOTAL")
        for j in range(3, 4 + len(colunas)):
            L = get_column_letter(j)
            ws.cell(t, j, f"=SUM({L}{f0}:{L}{t - 1})").number_format = NUM
            ws.cell(t, j).alignment = centro
        linha_total(ws, t, 1, 3 + len(colunas))
        ws.conditional_formatting.add(f"C{f0}:{get_column_letter(2 + len(colunas))}{t - 1}",
                                      ColorScaleRule(start_type="num", start_value=0, start_color="FFFFFF",
                                                     end_type="max", end_color="5B8FC9"))
        return f0, t

    sem = [("1º Semestre", "1º Semestre"), ("2º Semestre", "2º Semestre")]
    tri = [("T1", "T1 (Jan–Mar)"), ("T2", "T2 (Abr–Jun)"), ("T3", "T3 (Jul–Set)"), ("T4", "T4 (Out–Dez)")]
    r = rt + 3
    blocos["sem_firme"] = matriz(r, "2. Pessoas por modalidade e SEMESTRE — demanda FIRME", None, sem, "bSem", ["Firme"])
    r = blocos["sem_firme"][1] + 3
    blocos["sem_max"] = matriz(r, "3. Pessoas por modalidade e SEMESTRE — CENÁRIO MÁXIMO (firme + condicionado)",
                               None, sem, "bSem", ["Firme", "Condicionada"])
    r = blocos["sem_max"][1] + 3
    blocos["tri_max"] = matriz(r, "4. Pessoas por modalidade e TRIMESTRE — CENÁRIO MÁXIMO (firme + condicionado)",
                               None, tri, "bTrim", ["Firme", "Condicionada"])

    # 5. setor x modalidade
    r = blocos["tri_max"][1] + 3
    secao(ws, r, 1, "5. Pessoas por SETOR e MODALIDADE — cenário máximo (firme + condicionado)")
    head(ws, r + 2, 1, ["Subsecretaria", "Setor"] + [MOD_CURTO[m] for m in etl.MODALIDADES] +
         ["Total pessoas", "Eventos c/ buffet"], 34)
    setores = sorted({(g["Subsecretaria"], g["Setor"]) for g in regs if g["Demanda de buffet"] in ("Firme", "Condicionada")})
    f0 = r + 3
    for k, (sub, setor) in enumerate(setores):
        rr = f0 + k
        z = k % 2 == 1
        ws.cell(rr, 1, sub)
        ws.cell(rr, 2, setor)
        body(ws.cell(rr, 1), zebra=z)
        body(ws.cell(rr, 2), zebra=z, bold=True)
        for j, m in enumerate(etl.MODALIDADES, start=3):
            ws.cell(rr, j, f'=SUMIFS(bPessoas,bSub,$A{rr},bSetor,$B{rr},bModal,"{m}",bDemanda,"Firme")'
                           f'+SUMIFS(bPessoas,bSub,$A{rr},bSetor,$B{rr},bModal,"{m}",bDemanda,"Condicionada")')
            body(ws.cell(rr, j), NUM, zebra=z)
        ws.cell(rr, 8, f"=SUM(C{rr}:G{rr})")
        body(ws.cell(rr, 8), NUM, bold=True, zebra=z)
        ws.cell(rr, 9, f'=COUNTIFS(bSub,$A{rr},bSetor,$B{rr},bDemanda,"Firme")'
                       f'+COUNTIFS(bSub,$A{rr},bSetor,$B{rr},bDemanda,"Condicionada")')
        body(ws.cell(rr, 9), NUM, zebra=z)
    t = f0 + len(setores)
    ws.cell(t, 2, "TOTAL")
    for j in range(3, 10):
        L = get_column_letter(j)
        ws.cell(t, j, f"=SUM({L}{f0}:{L}{t - 1})").number_format = NUM
        ws.cell(t, j).alignment = centro
    linha_total(ws, t, 1, 9)
    blocos["setor"] = (f0, t)
    ws.freeze_panes = "A4"
    # gráfico por modalidade
    ch = BarChart()
    ch.type, ch.style = "bar", 10
    ch.title = "Pessoas por modalidade — cenário máximo"
    ch.add_data(Reference(ws, min_col=8, min_row=7, max_row=rt - 1), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=1, min_row=first, max_row=rt - 1))
    ch.series[0].graphicalProperties.solidFill = AZUL
    ch.legend = None
    ch.dataLabels = DataLabelList()
    ch.dataLabels.showVal = True
    ch.dataLabels.showSerName = ch.dataLabels.showCatName = ch.dataLabels.showLegendKey = ch.dataLabels.showPercent = False
    ch.height, ch.width = 7, 16
    ws.add_chart(ch, f"O5")
    return blocos


# ---------------------------------------------------------------------------
def build_mensal(wb):
    ws = wb.create_sheet("Necessidade Mensal")
    cabecalho(ws, "ESQUEMA DE NECESSIDADE MENSAL DE BUFFET",
              "Pessoas a atender por mês e por tipo de serviço · mês de referência = início do evento/janela", 13)
    larguras(ws, {"A": 6, "B": 14, **{get_column_letter(c): 13 for c in range(3, 14)}})
    mods = etl.MODALIDADES
    blocos = {}

    def bloco(r0, titulo, nota, demandas, chave):
        secao(ws, r0, 1, titulo, nota)
        cols = ["Nº", "Mês"] + [MOD_CURTO[m] for m in mods] + ["TOTAL\npessoas", "Nº eventos\nc/ buffet",
                                                               "Pessoas c/\nmês exato", "Pessoas c/ mês\nestimado",
                                                               "Acumulado\nno ano"]
        head(ws, r0 + 2, 1, cols, 40)
        f0 = r0 + 3
        for m in range(1, 13):
            r = f0 + m - 1
            z = m % 2 == 0
            ws.cell(r, 1, m)
            ws.cell(r, 2, etl.MESES_EXTENSO[m - 1].capitalize())
            body(ws.cell(r, 1), "0", zebra=z)
            body(ws.cell(r, 2), zebra=z, bold=True)
            for j, mod in enumerate(mods, start=3):
                ws.cell(r, j, "=" + "+".join(f'SUMIFS(bPessoas,bMes,$A{r},bModal,"{mod}",bDemanda,"{d}")'
                                             for d in demandas))
                body(ws.cell(r, j), NUM, zebra=z)
            ws.cell(r, 8, f"=SUM(C{r}:G{r})")
            body(ws.cell(r, 8), NUM, bold=True, zebra=z)
            ws.cell(r, 9, "=" + "+".join(f'COUNTIFS(bMes,$A{r},bDemanda,"{d}")' for d in demandas))
            body(ws.cell(r, 9), NUM, zebra=z)
            ws.cell(r, 10, "=" + "+".join(f'SUMIFS(bPessoas,bMes,$A{r},bMesDef,"Sim",bDemanda,"{d}")'
                                          for d in demandas))
            body(ws.cell(r, 10), NUM, zebra=z)
            ws.cell(r, 11, f"=H{r}-J{r}")
            body(ws.cell(r, 11), NUM, zebra=z)
            ws.cell(r, 12, f"=SUM($H${f0}:H{r})")
            body(ws.cell(r, 12), NUM, zebra=z)
        last = f0 + 11
        # subtotais semestrais e total
        for i, (rot, a, b) in enumerate((("1º Semestre", f0, f0 + 5), ("2º Semestre", f0 + 6, last),
                                         ("TOTAL 2027", f0, last))):
            r = last + 1 + i
            ws.cell(r, 2, rot)
            for j in range(3, 12):
                L = get_column_letter(j)
                ws.cell(r, j, f"=SUM({L}{a}:{L}{b})").number_format = NUM
                ws.cell(r, j).alignment = centro
            linha_total(ws, r, 1, 12)
        ws.conditional_formatting.add(f"C{f0}:G{last}", ColorScaleRule(
            start_type="num", start_value=0, start_color="FFFFFF", end_type="max", end_color="5B8FC9"))
        blocos[chave] = (f0, last + 3)
        return last + 3

    r = bloco(5, "1. Demanda FIRME (buffet 'Sim' e evento 'Previsto')",
              "Base para dimensionar a contratação mínima.", ["Firme"], "firme")
    r = bloco(r + 2, "2. Demanda CONDICIONADA (depende de patrocínio, confirmação ou buffet 'A definir')",
              "Reserva a prever no contrato, sem garantia de execução.", ["Condicionada"], "cond")
    r = bloco(r + 2, "3. CENÁRIO MÁXIMO (firme + condicionado)",
              "Teto de referência para o termo de referência/ata.", ["Firme", "Condicionada"], "max")
    ws.freeze_panes = "C4"
    # gráfico mensal (cenário firme)
    f0 = blocos["firme"][0]
    ch = BarChart()
    ch.type, ch.style = "col", 10
    ch.title = "Pessoas atendidas por mês — demanda firme"
    ch.add_data(Reference(ws, min_col=8, min_row=f0 - 1, max_row=f0 + 11), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=2, min_row=f0, max_row=f0 + 11))
    ch.series[0].graphicalProperties.solidFill = AZUL_ESC
    ch.legend = None
    ch.dataLabels = DataLabelList()
    ch.dataLabels.showVal = True
    ch.dataLabels.showSerName = ch.dataLabels.showCatName = ch.dataLabels.showLegendKey = ch.dataLabels.showPercent = False
    ch.height, ch.width = 8, 20
    ws.add_chart(ch, f"N{f0 - 2}")
    return blocos


# ---------------------------------------------------------------------------
def build_agenda(wb, regs):
    ws = wb.create_sheet("Agenda de Buffet")
    cabecalho(ws, "AGENDA MENSAL DE BUFFET (FIRME + CONDICIONADO)",
              "Lista ordenada por data de início · gerada da Base Consolidada no momento da consolidação "
              "(se a base for alterada, refazer a ordenação/filtro)", 11)
    cols = ["Mês ref.", "Data/período informado", "Tipo de período", "Subsecretaria", "Setor", "Evento",
            "Modalidade", "Pessoas", "Demanda", "Status", "Ref. origem"]
    head(ws, 5, 1, cols, 30)
    larguras(ws, {"A": 11, "B": 22, "C": 15, "D": 12, "E": 20, "F": 58, "G": 20, "H": 9, "I": 13, "J": 13, "K": 22})
    lst = sorted([g for g in regs if g["Demanda de buffet"] in ("Firme", "Condicionada")],
                 key=lambda g: (g["Data início"], g["ID"]))
    mes_ant = None
    for k, g in enumerate(lst):
        r = 6 + k
        mes = g["Data início"].month
        vals = [etl.MESES_EXTENSO[mes - 1].capitalize(), g["Data/período (original)"], g["Tipo de período"],
                g["Subsecretaria"], g["Setor"], g["Nome do evento"], g["Modalidade de buffet"], g["Pessoas buffet"],
                g["Demanda de buffet"], g["Status"], g["Ref. origem"]]
        z = mes % 2 == 0
        for j, v in enumerate(vals, start=1):
            ws.cell(r, j, v)
            body(ws.cell(r, j), NUM if j == 8 else None, zebra=z)
        if mes != mes_ant:
            for j in range(1, 12):
                ws.cell(r, j).border = Border(top=Side(style="medium", color=AZUL), left=fino, right=fino, bottom=fino)
            ws.cell(r, 1).font = f_bold
        mes_ant = mes
    last = 5 + len(lst)
    ws.auto_filter.ref = f"A5:K{last}"
    ws.conditional_formatting.add(f"I6:I{last}", CellIsRule(operator="equal", formula=['"Condicionada"'],
                                  fill=fill("FFF1C7"), font=Font(name=FONTE, bold=True, color="7A5A00")))
    ws.cell(last + 1, 7, "TOTAL")
    ws.cell(last + 1, 8, f"=SUBTOTAL(9,H6:H{last})").number_format = NUM
    linha_total(ws, last + 1, 1, 11)
    ws.freeze_panes = "A6"
    return len(lst)


def build_inconsistencias(wb, issues):
    ws = wb.create_sheet("Inconsistências")
    cabecalho(ws, "INCONSISTÊNCIAS E TRATAMENTOS APLICADOS",
              f"{len(issues)} apontamentos · nada foi descartado: o valor original está preservado na Base Consolidada",
              8)
    cols = ["Ref. origem", "Unidade remetente", "Evento", "Data/período", "Campo", "Problema encontrado",
            "Tratamento aplicado na consolidação", "Ação sugerida"]
    head(ws, 5, 1, cols, 30)
    larguras(ws, {"A": 22, "B": 13, "C": 45, "D": 18, "E": 18, "F": 50, "G": 42, "H": 38})
    for k, i in enumerate(sorted(issues, key=lambda x: (x["id"], x["campo"]))):
        r = 6 + k
        for j, key in enumerate(["ref", "unidade", "evento", "periodo", "campo", "problema", "tratamento", "acao"], 1):
            ws.cell(r, j, i[key])
            body(ws.cell(r, j), zebra=k % 2 == 1)
    ws.auto_filter.ref = f"A5:H{5 + len(issues)}"
    ws.freeze_panes = "A6"


def build_externos(wb, externos, regs):
    ws = wb.create_sheet("Eventos Externos (ref.)")
    cabecalho(ws, "EVENTOS EXTERNOS DE REFERÊNCIA (PESQUISA SUPATI)",
              "Feiras e congressos de terceiros que originam reuniões pós-evento · não são eventos da SEDES e "
              "não entram nos totais", 9)
    cols = list(externos[0].keys()) + ["Vínculo na Base (ref. origem)"]
    head(ws, 5, 1, cols, 30)
    larguras(ws, {"A": 26, "B": 14, "C": 22, "D": 34, "E": 12, "F": 22, "G": 40, "H": 60, "I": 26})
    import unicodedata as u
    norm = lambda s: "".join(c for c in u.normalize("NFD", s) if u.category(c) != "Mn").lower()
    for k, e in enumerate(externos):
        r = 6 + k
        nome = norm(e["Evento externo"])
        ids = [g["Ref. origem"] for g in regs if nome in norm(g["Nome do evento"])]
        for j, v in enumerate(list(e.values()) + [", ".join(ids)], 1):
            ws.cell(r, j, v)
            body(ws.cell(r, j), zebra=k % 2 == 1)
        ws.row_dimensions[r].height = 60
    ws.freeze_panes = "B6"


def build_notas(wb, contagem, regs, issues):
    ws = wb.create_sheet("Notas Metodológicas")
    cabecalho(ws, "NOTAS METODOLÓGICAS E RASTREABILIDADE", "Fontes, regras de padronização e critérios de cálculo", 4)
    larguras(ws, {"A": 46, "B": 18, "C": 18, "D": 90})
    secao(ws, 5, 1, "1. Fontes consolidadas")
    head(ws, 6, 1, ["Arquivo recebido", "Unidade", "Linhas lidas", "Abas lidas"], 24)
    for k, (arq, n) in enumerate(contagem.items()):
        r = 7 + k
        abas = "Previsão de Eventos 2027" + (" + Hipóteses internas - validar (6) + Pesquisa externa 2027 (ref.)"
                                             if "SUPATI" in arq else "")
        for j, v in enumerate([arq, etl.ARQUIVOS[arq], n, abas], 1):
            ws.cell(r, j, v)
            body(ws.cell(r, j), NUM if j == 3 else None, zebra=k % 2 == 1)
    rt = 7 + len(contagem)
    ws.cell(rt, 1, "TOTAL")
    ws.cell(rt, 3, f"=SUM(C7:C{rt - 1})").number_format = NUM
    ws.cell(rt, 3).alignment = centro
    ws.cell(rt, 4, "Confere com a Base Consolidada" if sum(contagem.values()) == len(regs) else "ATENÇÃO: diverge da Base")
    linha_total(ws, rt, 1, 4)
    regras = [
        ("Ano de referência", "Todos os períodos foram interpretados como 2027."),
        ("Mês de referência", "Mês da data de início. Bimestre/trimestre/semestre → 1º mês da janela (ex.: '2º bimestre' "
                              "→ março; '2º semestre' → julho). Intervalos que cruzam meses → mês de início. "
                              "A coluna 'Mês definido?' separa datas exatas de janelas estimadas."),
        ("Quantidades em texto", "'até 150 pessoas' → 150 (teto); '20-30 pessoas' → 30 (teto); '16 mil' → 16.000; "
                                 "'100 pessoas' → 100. Original preservado nas colunas '(original)'."),
        ("Buffet = Não", "Modalidade 'Não se aplica' e 0 pessoas."),
        ("Mínimo de 30 pessoas", "Todo evento é dimensionado para, no mínimo, 30 pessoas: público estimado abaixo de 30 → 30; "
                                 "pessoas do buffet abaixo de 30 → 30 (eventos sem buffet continuam com 0). Cada ajuste "
                                 "está listado na aba Inconsistências. Valores originais preservados nas colunas '(original)' da Base."),
        ("Colunas retiradas da Base", "A pedido da SEDES, a Base Consolidada não traz: ID, Unidade remetente, Categoria, "
                                      "Data início, Data fim, Semestre, Público estimado, Público entra nos totais?, "
                                      "Modalidade de buffet, Pessoas buffet, Status, Demanda de buffet e Formato. "
                                      "Esses campos foram usados no cálculo dos resumos, que por isso são valores fixos."),
        ("Buffet sem quantidade", "Quando a unidade não informou as pessoas do buffet, assumiu-se o público estimado "
                                  "(apenas EV041 – Dia da Mulher)."),
        ("Grafia da modalidade", "'Coffee simples' padronizado para 'Coffee Simples' (lista oficial da aba Orientações)."),
        ("Status 'Condicionado'", "Reuniões pós-evento da SUPATI (condicionadas a contatos efetivos e validação da "
                                  "chefia, conforme nota da própria planilha); feiras da SUBENEMAR (só em caso de "
                                  "patrocínio com estande); 'Anúncio de investimento' (caso haja anúncio)."),
        ("Status 'Hipótese (validar)'", "6 linhas da aba 'Hipóteses internas - validar' da SUPATI. Ficam na base, "
                                        "mas fora de todos os totais."),
        ("Demanda de buffet", "Firme = buffet Sim + status Previsto · Condicionada = buffet Sim + status Condicionado, "
                              "ou buffet 'A definir' · Hipótese · Sem buffet."),
        ("Público", "Público das 3 feiras da SUBENEMAR (público total da feira) fica fora do total de público "
                    "(coluna 'Público entra nos totais?' = Não)."),
        ("Linhas repetidas", "Linhas idênticas da SUPDER (mesmo nome e período) foram mantidas como ocorrências "
                             "distintas e sinalizadas na aba Inconsistências para confirmação."),
        ("Nomes", "Correções de grafia (Forum→Fórum, Flumiense→Fluminense, Desevolvimento→Desenvolvimento, "
                  "as→às) e nomes do RH convertidos de CAIXA ALTA. Nada foi excluído."),
        ("Atualização", "Os resumos (Painel, Eventos por Período, Quantitativo Buffet, Necessidade Mensal) são valores "
                        "calculados na consolidação; somas e subtotais internos continuam como fórmulas. Para incluir "
                        "ou alterar eventos, corrija a planilha de origem e rode novamente os scripts (pasta scripts)."),
    ]
    r0 = rt + 3
    secao(ws, r0, 1, "2. Regras de padronização e cálculo")
    head(ws, r0 + 1, 1, ["Regra", "", "", "Descrição"], 22)
    for k, (a, d) in enumerate(regras):
        r = r0 + 2 + k
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=3)
        ws.cell(r, 1, a)
        ws.cell(r, 4, d)
        body(ws.cell(r, 1), bold=True, zebra=k % 2 == 1)
        body(ws.cell(r, 4), zebra=k % 2 == 1)
        ws.row_dimensions[r].height = 42
    r = r0 + 3 + len(regras)
    secao(ws, r, 1, "3. Identidade visual")
    ws.cell(r + 1, 1, "Paleta inspirada na identidade do Governo do Estado do Rio de Janeiro (azul institucional "
                      "#002F6C, azul #0060A8, acento dourado #C9A227). Confirme com a ASCOM se houver manual "
                      "de marca específico a aplicar.").font = f_nota


BASE_FINAL = [  # (cabeçalho, chave/função, largura, formato)
    ("Subsecretaria", "Subsecretaria", 13, None),
    ("Setor", "Setor", 22, None),
    ("Nome do evento", "Nome do evento", 58, None),
    ("Data/período (original)", "Data/período (original)", 20, None),
    ("Tipo de período", "Tipo de período", 16, None),
    ("Mês definido?", "Mês definido?", 13, None),
    ("Mês ref. (nº)", lambda g: g["Data início"].month, 9, "0"),
    ("Mês ref.", lambda g: etl.MESES[g["Data início"].month - 1], 9, None),
    ("Trimestre", lambda g: f"T{(g['Data início'].month - 1) // 3 + 1}", 10, None),
    ("Necessita buffet?", "Necessita buffet?", 11, None),
    ("Observações", "Observações", 60, None),
    ("Subsecretaria / Setor (original)", "Subsecretaria / Setor (original)", 24, None),
    ("Público (original)", "Público (original)", 13, None),
    ("Pessoas buffet (original)", "Pessoas buffet (original)", 13, None),
    ("Arquivo de origem", "Arquivo de origem", 42, None),
    ("Aba / linha de origem", "Aba / linha de origem", 32, None),
]
COLUNAS_RETIRADAS = ["ID", "Unidade remetente", "Categoria", "Data início", "Data fim", "Semestre", "Público estimado",
                     "Público entra nos totais?", "Modalidade de buffet", "Pessoas buffet", "Status",
                     "Demanda de buffet", "Formato"]


def build_base_final(wb, regs, idx):
    ws = wb.create_sheet("Base Consolidada", idx)
    n = len(BASE_FINAL)
    cabecalho(ws, "BASE CONSOLIDADA DE EVENTOS 2027",
              f"{len(regs)} linhas · 1 linha por evento/ocorrência · valores como informados pelas unidades "
              "(mínimo de 30 pessoas aplicado nos resumos)", n)
    hr = 4
    for i, (h, src, w, fmt) in enumerate(BASE_FINAL, start=1):
        c = ws.cell(hr, i, h)
        c.font, c.fill, c.alignment = f_head, fill(AZUL_ESC), centro
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[hr].height = 34
    for k, g in enumerate(regs):
        r = hr + 1 + k
        for i, (h, src, w, fmt) in enumerate(BASE_FINAL, start=1):
            c = ws.cell(r, i, src(g) if callable(src) else g[src])
            c.font = f_txt
            c.alignment = Alignment(vertical="top", wrap_text=h in ("Nome do evento", "Observações"))
            if fmt:
                c.number_format = fmt
    tab = Table(displayName="tbBase", ref=f"A{hr}:{get_column_letter(n)}{hr + len(regs)}")
    tab.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=True)
    ws.add_table(tab)
    ws.freeze_panes = "D5"
    return ws


_REF_BASE = re.compile(r"\bb[A-Z][A-Za-z]*\b|Base Consolidada|Listas!")


def congelar(wb, valores):
    """Troca por valor toda fórmula que depende da Base técnica; mantém somas internas como fórmula."""
    n = 0
    for ws in wb.worksheets:
        if ws.title in ("Base Consolidada", "Listas"):
            continue
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value, str) and c.value.startswith("=") and _REF_BASE.search(c.value):
                    v = valores[ws.title][c.coordinate].value
                    if v is None or (isinstance(v, str) and v.startswith("#")):
                        raise RuntimeError(f"valor ausente/erro em {ws.title}!{c.coordinate}: {c.value}")
                    c.value = v
                    n += 1
    return n


def recalcular(path: Path):
    script = sorted(Path("/root/.claude/skills/synced").glob("*/xlsx/scripts/recalc.py"))[0]
    out = subprocess.run([sys.executable, str(script), str(path), "120"], capture_output=True, text=True)
    res = json.loads(out.stdout)
    if res.get("status") != "success":
        raise RuntimeError(f"recalc falhou: {out.stdout}")
    return res


def main(origem: Path, saida: Path):
    regs, issues, contagem = etl.consolidar(origem)
    externos = etl.ler_externos(origem / "Calendario_SEDES_SUPATI_SUBICS.xlsx")
    wb = Workbook()
    wb.remove(wb.active)
    desc = build_listas(wb)
    build_base(wb, regs)
    build_painel(wb, regs, contagem)
    pos = build_periodo(wb, regs)
    build_buffet(wb, regs, desc)
    build_mensal(wb)
    build_agenda(wb, regs)
    build_inconsistencias(wb, issues)
    build_externos(wb, externos, regs)
    build_notas(wb, contagem, regs, issues)
    ordem = ["Painel", "Eventos por Período", "Quantitativo Buffet", "Necessidade Mensal", "Agenda de Buffet",
             "Base Consolidada", "Inconsistências", "Eventos Externos (ref.)", "Notas Metodológicas", "Listas"]
    wb._sheets = [wb[n] for n in ordem]
    wb.active = 0
    for ws in wb.worksheets:
        ws.sheet_properties.tabColor = DOURADO if ws.title == "Painel" else AZUL_ESC
        ws.page_setup.orientation = "landscape"
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.print_options.horizontalCentered = True
        ws.oddFooter.center.text = "SEDES · Levantamento de Eventos 2027 · &P/&N"
    # 1) recalcula a versão técnica (com a Base completa) para obter os valores das fórmulas
    with tempfile.TemporaryDirectory() as tmp:
        tecnico = Path(tmp) / "tecnico.xlsx"
        wb.save(tecnico)
        recalcular(tecnico)
        valores = load_workbook(tecnico, data_only=True)
    # 2) congela os resumos, troca a Base pela versão enxuta e remove a infraestrutura técnica
    congelar(wb, valores)
    idx = wb.sheetnames.index("Base Consolidada")
    wb.remove(wb["Base Consolidada"])
    wb.remove(wb["Listas"])
    for nome in list(wb.defined_names.keys()):
        del wb.defined_names[nome]
    base = build_base_final(wb, regs, idx)
    base.sheet_properties.tabColor = AZUL_ESC
    base.page_setup.orientation = "landscape"
    base.page_setup.fitToWidth, base.page_setup.fitToHeight = 1, 0
    base.sheet_properties.pageSetUpPr.fitToPage = True
    base.oddFooter.center.text = "SEDES · Levantamento de Eventos 2027 · &P/&N"
    wb.active = 0
    wb.save(saida)
    # 3) recalcula as fórmulas restantes (somas internas) para gravar os valores no arquivo final
    recalcular(saida)
    return regs, issues, contagem


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
