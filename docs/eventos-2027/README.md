# Levantamento de Eventos 2027 — SEDES/RJ

Consolidação das 7 planilhas enviadas pelas unidades (pasta `origem/`).

| Entrega | Conteúdo |
|---|---|
| `Consolidado_Eventos_SEDES_2027.xlsx` | Painel, Eventos por Período (mês/trimestre/semestre), Quantitativo Buffet, Necessidade Mensal, Agenda de Buffet, Base Consolidada, Inconsistências, Eventos Externos (ref.), Notas Metodológicas |
| `Painel_Eventos_SEDES_2027.html` | Painel interativo em arquivo único (abre offline em qualquer navegador) |

Os resumos da planilha são fórmulas sobre a aba **Base Consolidada**: corrigiu a base, os totais se atualizam.

## Regerar e testar

```bash
cd docs/eventos-2027/scripts
python3 build_xlsx.py ../origem ../Consolidado_Eventos_SEDES_2027.xlsx
python3 <skill xlsx>/scripts/recalc.py ../Consolidado_Eventos_SEDES_2027.xlsx 90   # grava os valores das fórmulas
python3 build_html.py ../origem ../Painel_Eventos_SEDES_2027.html
python3 test_consolidado.py ../origem ../Consolidado_Eventos_SEDES_2027.xlsx ../Painel_Eventos_SEDES_2027.html
node dom_dump.cjs "$(realpath ../Painel_Eventos_SEDES_2027.html)" /tmp/dom.json && python3 test_html.py ../Consolidado_Eventos_SEDES_2027.xlsx /tmp/dom.json
```

Os testes cruzam três caminhos independentes: leitura crua das planilhas de origem, agregação em Python e as fórmulas recalculadas da planilha. Também conferem os números exibidos no HTML renderizado no Chromium.
