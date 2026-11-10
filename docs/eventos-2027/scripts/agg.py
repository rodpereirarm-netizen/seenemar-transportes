"""Agregações em Python puro (caminho independente das fórmulas do Excel).

Usado pelo gerador do HTML e pelos testes, que comparam estes números com os
valores recalculados das fórmulas da planilha.
"""
from __future__ import annotations

from collections import defaultdict

import etl

HIP = "Hipótese (validar)"
COM_BUFFET = ("Firme", "Condicionada")


def mes(g):
    return g["Data início"].month


def trim(g):
    return f"T{(mes(g) - 1) // 3 + 1}"


def sem(g):
    return "1º Semestre" if mes(g) <= 6 else "2º Semestre"


def resumo(lst):
    nh = [g for g in lst if g["Status"] != HIP]
    return {
        "eventos": len(nh),
        "mes_exato": sum(g["Mês definido?"] == "Sim" for g in nh),
        "mes_estimado": sum(g["Mês definido?"] != "Sim" for g in nh),
        "previstos": sum(g["Status"] == "Previsto" for g in lst),
        "condicionados": sum(g["Status"] == "Condicionado" for g in lst),
        "publico": sum(g["Público estimado"] or 0 for g in nh if g["Público entra nos totais?"] == "Sim"),
        "eventos_buffet": sum(g["Demanda de buffet"] in COM_BUFFET for g in lst),
        "pessoas_firme": sum(g["Pessoas buffet"] for g in lst if g["Demanda de buffet"] == "Firme"),
        "pessoas_cond": sum(g["Pessoas buffet"] for g in lst if g["Demanda de buffet"] == "Condicionada"),
        "hipoteses": sum(g["Status"] == HIP for g in lst),
    }


def agrupar(regs, chave):
    grupos = defaultdict(list)
    for g in regs:
        grupos[chave(g)].append(g)
    return grupos


def calcular(regs, issues):
    out = {}
    out["kpi"] = {
        **resumo(regs),
        "hipoteses": sum(g["Status"] == HIP for g in regs),
        "inconsistencias": len(issues),
        "linhas": len(regs),
    }
    out["kpi"]["pessoas_max"] = out["kpi"]["pessoas_firme"] + out["kpi"]["pessoas_cond"]
    por_mes = agrupar(regs, mes)
    out["mes"] = {m: resumo(por_mes.get(m, [])) for m in range(1, 13)}
    por_tri = agrupar(regs, trim)
    out["trim"] = {t: resumo(por_tri.get(t, [])) for t in ("T1", "T2", "T3", "T4")}
    por_sem = agrupar(regs, sem)
    out["sem"] = {s: resumo(por_sem.get(s, [])) for s in ("1º Semestre", "2º Semestre")}
    por_tipo = agrupar(regs, lambda g: g["Tipo de período"])
    out["tipo"] = {t: resumo(por_tipo.get(t, [])) for t in
                   ("Data exata", "Intervalo de datas", "Mês", "Bimestre", "Trimestre", "Semestre")}
    por_un = agrupar(regs, lambda g: g["Unidade remetente"])
    out["unidade"] = {}
    for u in etl.ARQUIVOS.values():
        r = resumo(por_un.get(u, []))
        r["linhas"] = len(por_un.get(u, []))
        r["inconsistencias"] = sum(i["unidade"] == u for i in issues)
        out["unidade"][u] = r
    # buffet por modalidade
    out["modal"] = {}
    for m in etl.MODALIDADES:
        sel = [g for g in regs if g["Modalidade de buffet"] == m]
        f = [g for g in sel if g["Demanda de buffet"] == "Firme"]
        c = [g for g in sel if g["Demanda de buffet"] == "Condicionada"]
        h = [g for g in sel if g["Demanda de buffet"] == "Hipótese"]
        out["modal"][m] = dict(ev_firme=len(f), p_firme=sum(g["Pessoas buffet"] for g in f),
                               ev_cond=len(c), p_cond=sum(g["Pessoas buffet"] for g in c),
                               maior=max([g["Pessoas buffet"] for g in f + c] or [0]),
                               ev_hip=len(h), p_hip=sum(g["Pessoas buffet"] for g in h))
    # necessidade mensal: pessoas por mês x modalidade, por tipo de demanda
    out["mensal"] = {}
    for d in ("Firme", "Condicionada"):
        tab = {}
        for m in range(1, 13):
            sel = [g for g in regs if mes(g) == m and g["Demanda de buffet"] == d]
            tab[m] = {mod: sum(g["Pessoas buffet"] for g in sel if g["Modalidade de buffet"] == mod)
                      for mod in etl.MODALIDADES}
            tab[m]["_total"] = sum(g["Pessoas buffet"] for g in sel)
            tab[m]["_eventos"] = len(sel)
            tab[m]["_exato"] = sum(g["Pessoas buffet"] for g in sel if g["Mês definido?"] == "Sim")
        out["mensal"][d] = tab
    # setor x mês (eventos)
    out["setor_mes"] = {}
    for g in regs:
        if g["Status"] == HIP:
            continue
        k = (g["Subsecretaria"], g["Setor"])
        out["setor_mes"].setdefault(k, [0] * 12)[mes(g) - 1] += 1
    # setor x modalidade (pessoas cenário máximo)
    out["setor_modal"] = {}
    for g in regs:
        if g["Demanda de buffet"] not in COM_BUFFET:
            continue
        k = (g["Subsecretaria"], g["Setor"])
        d = out["setor_modal"].setdefault(k, {m: 0 for m in etl.MODALIDADES} | {"_eventos": 0})
        d[g["Modalidade de buffet"]] += g["Pessoas buffet"]
        d["_eventos"] += 1
    return out
