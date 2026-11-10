"""Bateria de testes do consolidado (planilha + HTML).

Uso: python test_consolidado.py <pasta_origem> <planilha_recalculada.xlsx> [<arquivo.html>]

Três caminhos independentes são confrontados:
  1. leitura CRUA das planilhas de origem (pandas, sem as regras do ETL);
  2. agregação em Python (agg.py) sobre a base padronizada;
  3. valores das FÓRMULAS da planilha, recalculados pelo LibreOffice;
e, se informado, os números exibidos no HTML.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl
import pandas as pd

import agg
import etl

FALHAS, OK = [], [0]


def check(cond, msg):
    if cond:
        OK[0] += 1
    else:
        FALHAS.append(msg)
        print("  FALHA:", msg)


def eq(a, b, msg):
    check(a == b, f"{msg}: esperado {b!r}, obtido {a!r}")


def achar_linha(ws, col, texto, inicio=1):
    for r in range(inicio, ws.max_row + 1):
        if ws.cell(r, col).value == texto:
            return r
    raise AssertionError(f"'{texto}' não encontrado na coluna {col} de {ws.title}")


def main(origem: Path, xlsx: Path, html: Path | None):
    regs, issues, contagem = etl.consolidar(origem)
    A = agg.calcular(regs, issues)

    print("1) Origem crua x base padronizada")
    total_cru = 0
    for arq, unidade in etl.ARQUIVOS.items():
        df = pd.read_excel(origem / arq, sheet_name="Previsão de Eventos 2027", header=3)
        n = int(df["Nome do evento"].notna().sum())
        if "SUPATI" in arq:
            dh = pd.read_excel(origem / arq, sheet_name="Hipóteses internas - validar")
            n += int(dh["Evento / reunião sugerido"].notna().sum())
        total_cru += n
        eq(contagem[arq], n, f"linhas lidas de {arq}")
        eq(sum(g["Unidade remetente"] == unidade for g in regs), n, f"linhas na base para {unidade}")
    eq(len(regs), total_cru, "total de linhas na base")
    eq(len({g['ID'] for g in regs}), len(regs), "IDs únicos")
    # valores numéricos originais preservados quando já eram números
    for g in regs:
        if isinstance(g["Pessoas buffet (original)"], (int, float)) and g["Necessita buffet?"] != "Não":
            eq(g["Pessoas buffet"], int(g["Pessoas buffet (original)"]), f"pessoas buffet preservado {g['ID']}")
        if isinstance(g["Público (original)"], (int, float)):
            eq(g["Público estimado"], int(g["Público (original)"]), f"público preservado {g['ID']}")
        check(g["Modalidade de buffet"] in etl.MODALIDADES_TODAS, f"modalidade válida {g['ID']}")
        check(g["Data início"].year == 2027 and g["Data fim"] >= g["Data início"], f"datas coerentes {g['ID']}")
        if g["Necessita buffet?"] == "Não":
            eq((g["Modalidade de buffet"], g["Pessoas buffet"]), ("Não se aplica", 0), f"sem buffet {g['ID']}")

    print("2) Conferências manuais (valores calculados à mão a partir das planilhas)")
    by = {g["ID"]: g for g in regs}
    # ASSTEC: 4 cerimônias x 330 pessoas, coquetel, mar/jun/set/dez
    asst = [g for g in regs if g["Unidade remetente"] == "ASSTEC"]
    eq(sum(g["Pessoas buffet"] for g in asst), 1320, "ASSTEC pessoas")
    eq(sorted(g["Data início"].month for g in asst), [3, 6, 9, 12], "ASSTEC meses")
    # RH: 12 aniversariantes x 200 coffee + confraternização 200 coquetel
    rh_coffee = sum(g["Pessoas buffet"] for g in regs if g["Unidade remetente"] == "RH (COOGP)"
                    and g["Modalidade de buffet"] == "Coffee Simples")
    eq(rh_coffee, 2400, "RH coffee (12 x 200)")
    # SUPDER: 8 eventos x 150 coffee, 3 no 1º sem e 5 no 2º? (conferir pela planilha: 1º sem = linhas 5,8,9,10)
    sup = [g for g in regs if g["Unidade remetente"] == "SUPDER"]
    eq(sum(g["Pessoas buffet"] for g in sup), 1200, "SUPDER pessoas (8 x 150)")
    eq(sum(agg.sem(g) == "1º Semestre" for g in sup), 4, "SUPDER eventos 1º semestre")
    # SUBENEMAR: feiras condicionadas 3 x 30 coquetel; CEDEMAR 4 x 150 coffee firme
    eq(A["unidade"]["SUBENEMAR"]["pessoas_cond"], 90, "SUBENEMAR condicionado")
    eq(A["unidade"]["SUBENEMAR"]["pessoas_firme"], 600 + 70 + 100, "SUBENEMAR firme")
    eq(A["unidade"]["SUBENEMAR"]["publico"], 600 + 70 + 100, "SUBENEMAR público sem feiras")
    # SUPCOMP (21 linhas, todas firmes): soma das pessoas
    eq(A["unidade"]["SUPCOMP"]["pessoas_firme"], 4 * 30 + 100 + 100 + 100 + 100 + 50 + 100 + 150 + 8 * 30 + 200 + 150,
       "SUPCOMP firme")
    # SUPATI: firmes = 6 x 10 coffee + 2 x 25 brunch; condicionados = 2 x 10 + 2 x 40
    eq(A["unidade"]["SUPATI"]["pessoas_firme"], 110, "SUPATI firme")
    eq(A["unidade"]["SUPATI"]["pessoas_cond"], 100, "SUPATI condicionado")
    eq(A["unidade"]["SUPATI"]["hipoteses"], 6, "SUPATI hipóteses")
    eq(A["unidade"]["SUBINOVA"]["pessoas_firme"], 340, "SUBINOVA firme")
    eq(by["EV020"]["Data início"].month, 3, "'2º bimestre' -> março")
    eq(by["EV063"]["Data início"].month, 5, "'31/05–04/06/2027' -> maio")
    eq(by["EV030"]["Data início"].isoformat(), "2027-06-22", "Energy Summit data informada")
    # invariantes
    eq(sum(v["eventos"] for v in A["mes"].values()), A["kpi"]["eventos"], "soma meses = total eventos")
    eq(sum(v["eventos"] for v in A["trim"].values()), A["kpi"]["eventos"], "soma trimestres = total")
    eq(sum(v["eventos"] for v in A["sem"].values()), A["kpi"]["eventos"], "soma semestres = total")
    eq(sum(v["eventos"] for v in A["tipo"].values()), A["kpi"]["eventos"], "soma tipos = total")
    eq(sum(v["p_firme"] for v in A["modal"].values()), A["kpi"]["pessoas_firme"], "modalidades = firme")
    eq(sum(A["mensal"]["Firme"][m]["_total"] for m in range(1, 13)), A["kpi"]["pessoas_firme"], "mensal = firme")
    eq(sum(A["mensal"]["Condicionada"][m]["_total"] for m in range(1, 13)), A["kpi"]["pessoas_cond"], "mensal = cond")
    eq(A["kpi"]["previstos"] + A["kpi"]["condicionados"], A["kpi"]["eventos"], "previstos+cond = eventos")
    eq(A["kpi"]["eventos"] + A["kpi"]["hipoteses"], len(regs), "eventos+hipóteses = linhas")

    print("3) Fórmulas da planilha (recalculadas) x agregação Python")
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    erros = [(ws.title, c.coordinate) for ws in wb.worksheets for row in ws.iter_rows() for c in row
             if isinstance(c.value, str) and c.value.startswith("#")]
    eq(erros, [], "células com erro")
    ws = wb["Painel"]
    k = A["kpi"]
    for cel, val, nome in (("A6", k["eventos"], "eventos"), ("C6", k["previstos"], "previstos"),
                           ("E6", k["condicionados"], "condicionados"), ("G6", k["hipoteses"], "hipóteses"),
                           ("I6", k["pessoas_firme"], "pessoas firme"), ("K6", k["pessoas_cond"], "pessoas cond"),
                           ("A9", k["eventos_buffet"], "eventos buffet"), ("C9", k["pessoas_max"], "pessoas máx"),
                           ("E9", k["publico"], "público"), ("G9", k["mes_exato"], "mês exato"),
                           ("I9", k["mes_estimado"], "mês estimado"), ("K9", k["inconsistencias"], "inconsist.")):
        eq(ws[cel].value, val, f"Painel {nome}")
    r0 = achar_linha(ws, 1, "SUPCOMP")
    for i, u in enumerate(etl.ARQUIVOS.values()):
        r = r0 + i
        eq(ws.cell(r, 1).value, u, "ordem unidades")
        U = A["unidade"][u]
        got = [ws.cell(r, c).value for c in range(2, 13)]
        exp = [U["linhas"], U["eventos"], U["previstos"], U["condicionados"], U["hipoteses"], U["publico"],
               U["eventos_buffet"], U["pessoas_firme"], U["pessoas_cond"], U["pessoas_firme"] + U["pessoas_cond"],
               U["inconsistencias"]]
        eq(got, exp, f"Painel unidade {u}")
    eq(ws.cell(r0 + 7, 2).value, len(regs), "Painel total linhas")

    ws = wb["Eventos por Período"]

    def lin(R):
        return [R["eventos"], R["mes_exato"], R["mes_estimado"], R["previstos"], R["condicionados"], R["publico"],
                R["eventos_buffet"], R["pessoas_firme"], R["pessoas_cond"], R["pessoas_firme"] + R["pessoas_cond"],
                R["hipoteses"]]

    for m in range(1, 13):
        r = achar_linha(ws, 2, etl.MESES_EXTENSO[m - 1].capitalize())
        eq([ws.cell(r, c).value for c in range(3, 14)], lin(A["mes"][m]), f"Período mês {m}")
    for t in ("T1", "T2", "T3", "T4"):
        r = achar_linha(ws, 1, t)
        eq([ws.cell(r, c).value for c in range(3, 14)], lin(A["trim"][t]), f"Período {t}")
    for s in ("1º Semestre", "2º Semestre"):
        r = achar_linha(ws, 1, s)
        eq([ws.cell(r, c).value for c in range(3, 14)], lin(A["sem"][s]), f"Período {s}")
    for t in A["tipo"]:
        r = achar_linha(ws, 1, t)
        eq([ws.cell(r, c).value for c in range(3, 14)], lin(A["tipo"][t]), f"Período tipo {t}")
    rs = achar_linha(ws, 2, "Setor") + 1
    for (sub, setor), meses in sorted(A["setor_mes"].items()):
        r = achar_linha(ws, 2, setor, rs)
        eq(ws.cell(r, 1).value, sub, f"subsecretaria de {setor}")
        eq([ws.cell(r, c).value for c in range(3, 15)], meses, f"setor x mês {setor}")
        eq(ws.cell(r, 15).value, sum(meses), f"setor total {setor}")

    ws = wb["Quantitativo Buffet"]
    tot = A["kpi"]["pessoas_max"]
    for i, m in enumerate(etl.MODALIDADES):
        r = 8 + i
        eq(ws.cell(r, 1).value, m, "ordem modalidades")
        M = A["modal"][m]
        got = [ws.cell(r, c).value for c in (3, 4, 5, 6, 7, 8, 11, 12, 13)]
        exp = [M["ev_firme"], M["p_firme"], M["ev_cond"], M["p_cond"], M["ev_firme"] + M["ev_cond"],
               M["p_firme"] + M["p_cond"], M["maior"], M["ev_hip"], M["p_hip"]]
        eq(got, exp, f"Buffet modalidade {m}")
        check(abs(ws.cell(r, 9).value - (M["p_firme"] + M["p_cond"]) / tot) < 1e-9, f"% {m}")
    eq(ws.cell(13, 8).value, tot, "Buffet total cenário máximo")
    eq(round(ws.cell(13, 9).value, 9), 1.0, "Buffet % soma 100%")
    # matriz setor x modalidade
    rs = achar_linha(ws, 2, "Setor") + 1
    for (sub, setor), d in sorted(A["setor_modal"].items()):
        r = achar_linha(ws, 2, setor, rs)
        eq([ws.cell(r, c).value for c in range(3, 8)], [d[m] for m in etl.MODALIDADES], f"setor x modal {setor}")
        eq(ws.cell(r, 9).value, d["_eventos"], f"setor eventos buffet {setor}")
    # semestre/trimestre (cenário máximo) – somas por coluna
    r = achar_linha(ws, 1, "3. Pessoas por modalidade e SEMESTRE — CENÁRIO MÁXIMO (firme + condicionado)")
    for i, m in enumerate(etl.MODALIDADES):
        rr = r + 3 + i
        for j, s in enumerate(("1º Semestre", "2º Semestre")):
            exp = sum(g["Pessoas buffet"] for g in regs if g["Modalidade de buffet"] == m
                      and g["Demanda de buffet"] in agg.COM_BUFFET and agg.sem(g) == s)
            eq(ws.cell(rr, 3 + j).value, exp, f"semestre máx {m} {s}")
    r = achar_linha(ws, 1, "4. Pessoas por modalidade e TRIMESTRE — CENÁRIO MÁXIMO (firme + condicionado)")
    for i, m in enumerate(etl.MODALIDADES):
        rr = r + 3 + i
        for j, t in enumerate(("T1", "T2", "T3", "T4")):
            exp = sum(g["Pessoas buffet"] for g in regs if g["Modalidade de buffet"] == m
                      and g["Demanda de buffet"] in agg.COM_BUFFET and agg.trim(g) == t)
            eq(ws.cell(rr, 3 + j).value, exp, f"trimestre máx {m} {t}")

    ws = wb["Necessidade Mensal"]
    blocos = {"Firme": achar_linha(ws, 1, "1. Demanda FIRME (buffet 'Sim' e evento 'Previsto')"),
              "Condicionada": achar_linha(ws, 1, "2. Demanda CONDICIONADA (depende de patrocínio, confirmação ou "
                                                 "buffet 'A definir')"),
              "Max": achar_linha(ws, 1, "3. CENÁRIO MÁXIMO (firme + condicionado)")}
    for d, r0 in blocos.items():
        acum = 0
        for m in range(1, 13):
            r = r0 + 2 + m
            eq(ws.cell(r, 1).value, m, "nº mês")
            if d == "Max":
                F, C = A["mensal"]["Firme"][m], A["mensal"]["Condicionada"][m]
                T = {key: F[key] + C[key] for key in F}
            else:
                T = A["mensal"][d][m]
            acum += T["_total"]
            exp = [T[mod] for mod in etl.MODALIDADES] + [T["_total"], T["_eventos"], T["_exato"],
                                                          T["_total"] - T["_exato"], acum]
            eq([ws.cell(r, c).value for c in range(3, 13)], exp, f"Mensal {d} mês {m}")
        eq(ws.cell(r0 + 17, 8).value, acum, f"Mensal {d} total anual")
        eq(ws.cell(r0 + 15, 8).value + ws.cell(r0 + 16, 8).value, acum, f"Mensal {d} semestres")

    ws = wb["Agenda de Buffet"]
    n_ag = sum(g["Demanda de buffet"] in agg.COM_BUFFET for g in regs)
    eq(ws.cell(6 + n_ag, 8).value, A["kpi"]["pessoas_max"], "Agenda total pessoas")
    datas = [by[ws.cell(r, 11).value]["Data início"] for r in range(6, 6 + n_ag)]
    eq(datas, sorted(datas), "Agenda ordenada por data")
    ws = wb["Base Consolidada"]
    for r in range(5, 5 + len(regs)):
        g = by[ws.cell(r, 1).value]
        eq(ws.cell(r, 22).value, g["Demanda de buffet"], f"fórmula Demanda {g['ID']}")
        eq(ws.cell(r, 12).value, g["Data início"].month, f"fórmula Mês {g['ID']}")
    ws = wb["Notas Metodológicas"]
    r = achar_linha(ws, 1, "TOTAL")
    eq(ws.cell(r, 4).value, "Confere com a Base Consolidada", "Notas: contagem confere")
    eq(len([1 for row in wb["Inconsistências"].iter_rows(min_row=6, values_only=True) if row[0]]), len(issues),
       "nº inconsistências")

    if html:
        print("4) HTML x agregação Python")
        txt = html.read_text(encoding="utf-8")
        m = re.search(r'<script id="dados" type="application/json">(.*?)</script>', txt, re.S)
        check(m is not None, "JSON embutido no HTML")
        D = json.loads(m.group(1))
        eq(len(D["eventos"]), len(regs), "HTML nº eventos na base")
        eq(D["kpi"]["pessoas_firme"], A["kpi"]["pessoas_firme"], "HTML KPI firme")
        eq(D["kpi"]["pessoas_cond"], A["kpi"]["pessoas_cond"], "HTML KPI cond")
        eq(D["kpi"]["eventos"], A["kpi"]["eventos"], "HTML KPI eventos")
        eq(len(D["inconsistencias"]), len(issues), "HTML inconsistências")

    print(f"\nResultado: {OK[0]} verificações OK, {len(FALHAS)} falhas")
    return len(FALHAS) == 0


if __name__ == "__main__":
    ok = main(Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]) if len(sys.argv) > 3 else None)
    sys.exit(0 if ok else 1)
