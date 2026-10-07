"""Converte a PLANILHA GERAL DE CONTRATOS em JSON de staging (uma entrada por linha).

Faz só o que o importador do navegador fará: célula → valor JSON
(data → "AAAA-MM-DD", número → número, texto → texto como está). Nenhuma regra de negócio aqui.

Uso: python3 -I planilha_para_json.py "PLANILHA GERAL DE CONTRATOS.xlsx" saida.json
A saída contém dados pessoais (nomes e matrículas): não versionar.
"""
import datetime as dt
import json
import sys

import openpyxl

COLUNAS = {
    'A': 'secretaria', 'B': 'numero', 'C': 'contratada', 'D': 'objeto', 'E': 'unidade', 'G': 'quant',
    'I': 'v_unit', 'J': 'v_mensal', 'K': 'v_anual', 'L': 'v_total', 'M': 'proc_mae',
    'N': 'fat2023', 'O': 'fat2024', 'P': 'fat2025', 'Q': 'fat2026', 'R': 'inicio', 'S': 'prazo', 'T': 'termino',
    'U': 'doc_base', 'V': 'inicio_vig_ref', 'W': 'garantia', 'X': 'obs', 'Y': 'apost_situacao', 'Z': 'portaria',
    'AA': 'fiscal_pres', 'AB': 'fiscal1', 'AC': 'fiscal2', 'AD': 'fiscal_sub', 'AE': 'gestor', 'AF': 'gestor_sub',
    'AG': 'dt_assin', 'AI': 'dt_doerj', 'AK': 'dt_pncp', 'AM': 'siafe',
}
PRIMEIRA, ULTIMA = 12, 52   # linhas de dados (cabeçalho em 9–11)


def celula(v):
    if isinstance(v, (dt.datetime, dt.date)):
        return v.strftime('%Y-%m-%d')
    return v


def main(origem, destino):
    ws = openpyxl.load_workbook(origem, data_only=True).worksheets[0]
    linhas = []
    for r in range(PRIMEIRA, ULTIMA + 1):
        valores = {nome: celula(ws[f'{col}{r}'].value) for col, nome in COLUNAS.items()}
        linhas.append({'linha': r, 'valores': valores})
    with open(destino, 'w', encoding='utf-8') as f:
        json.dump(linhas, f, ensure_ascii=False)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
