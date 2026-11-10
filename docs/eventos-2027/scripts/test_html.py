"""Confronta os números RENDERIZADOS no HTML (dump do Chromium) com as fórmulas recalculadas da planilha.

Uso: python test_html.py <planilha_recalculada.xlsx> <dom.json>
"""
import json
import sys

import openpyxl

import etl

falhas, ok = [], [0]


def n(s):
    s = str(s).strip().replace("%", "")
    if s in ("–", ""):
        return 0
    return float(s.replace(".", "").replace(",", "."))


def eq(a, b, msg):
    if a == b:
        ok[0] += 1
    else:
        falhas.append(msg)
        print("  FALHA:", msg, "html=", a, "xlsx=", b)


def linha(ws, col, texto, ini=1):
    for r in range(ini, ws.max_row + 1):
        if ws.cell(r, col).value == texto:
            return r
    raise AssertionError(texto)


def main(xlsx, dom):
    D = json.load(open(dom, encoding="utf-8"))
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    eq(D["erros"], [], "erros de JavaScript no console")
    eq(D["mobileOverflow"], False, "sem rolagem horizontal no celular (390px)")
    P = wb["Painel"]
    mapa = {"Eventos previstos (exceto hipóteses)": "A6", "Status Previsto": "C6", "Status Condicionado": "E6",
            "Hipóteses a validar": "G6", "Pessoas – buffet firme": "I6", "Pessoas – buffet condicionado": "K6",
            "Eventos com buffet": "A9", "Cenário máximo de pessoas": "C9", "Público estimado (exc. feiras ext.)": "E9",
            "Inconsistências apontadas": "K9"}
    for rot, val in D["kpis"]:
        eq(n(val), P[mapa[rot]].value, f"KPI {rot}")
    r0 = linha(P, 1, "SUPCOMP")
    for i, row in enumerate(D["unid"][1:]):
        eq([n(x) for x in row[1:]], [P.cell(r0 + i, c).value for c in range(2, 13)], f"unidade {row[0]}")
    M = wb["Necessidade Mensal"]
    titulos = {"Firme": "1. Demanda FIRME (buffet 'Sim' e evento 'Previsto')",
               "Condicionada": "2. Demanda CONDICIONADA (depende de patrocínio, confirmação ou buffet 'A definir')",
               "Max": "3. CENÁRIO MÁXIMO (firme + condicionado)"}
    for cen, tab in D["mensal"].items():
        b = linha(M, 1, titulos[cen])
        for i, row in enumerate(tab[1:13]):
            eq([n(x) for x in row[1:]], [M.cell(b + 3 + i, c).value for c in range(3, 13)], f"mensal {cen} {row[0]}")
        for i, row in enumerate(tab[13:16]):
            eq([n(x) for x in row[1:10]], [M.cell(b + 15 + i, c).value for c in range(3, 12)], f"mensal {cen} {row[0]}")
    # gráfico = coluna total do cenário máximo
    b = linha(M, 1, titulos["Max"])
    eq([n(v) for v in D["chart"]], [M.cell(b + 3 + i, 8).value for i in range(12)], "gráfico mensal")
    Q = wb["Quantitativo Buffet"]
    for i, row in enumerate(D["modal"][1:]):
        r = 8 + i
        x = [Q.cell(r, c).value for c in (3, 4, 5, 6, 7, 8)] + [round(Q.cell(r, 9).value * 100, 1)] + \
            [Q.cell(r, c).value for c in (12, 13)]
        eq([n(v) for v in row[1:]], x, f"modalidade {row[0]}")
    for nome, titulo, ncol in (("modSem", "3. Pessoas por modalidade e SEMESTRE — CENÁRIO MÁXIMO (firme + condicionado)", 3),
                               ("modTri", "4. Pessoas por modalidade e TRIMESTRE — CENÁRIO MÁXIMO (firme + condicionado)", 5)):
        b = linha(Q, 1, titulo)
        for i, row in enumerate(D[nome][1:]):
            eq([n(v) for v in row[1:]], [Q.cell(b + 3 + i, c).value for c in range(3, 3 + ncol)], f"{nome} {row[0]}")
    rs = linha(Q, 2, "Setor")
    for row in D["setMod"][1:-1]:
        r = linha(Q, 2, row[1], rs + 1)
        eq([n(v) for v in row[2:]], [Q.cell(r, c).value for c in range(3, 10)], f"setor x modal {row[1]}")
    E = wb["Eventos por Período"]
    for nome, col in (("mes", 2), ("tri", 1), ("sem", 1)):
        for row in D[nome][1:-1]:
            r = linha(E, col, row[0])
            eq([n(v) for v in row[1:]], [E.cell(r, c).value for c in range(3, 14)], f"período {row[0]}")
    rs = linha(E, 2, "Setor")
    for row in D["setMes"][1:-1]:
        r = linha(E, 2, row[1], rs + 1)
        eq([n(v) for v in row[2:]], [E.cell(r, c).value for c in range(3, 16)], f"setor x mês {row[1]}")
    eq(D["listaTodos"], 100, "lista: todos os eventos")
    eq(D["listaFirme"], Q.cell(13, 3).value, "lista: filtro Firme = eventos firmes da planilha")
    eq(D["listaBusca"], 4, "lista: busca 'cedemar'")
    eq(D["incons"], P["K9"].value, "lista de inconsistências")
    print(f"\nHTML: {ok[0]} verificações OK, {len(falhas)} falhas")
    return not falhas


if __name__ == "__main__":
    sys.exit(0 if main(sys.argv[1], sys.argv[2]) else 1)
