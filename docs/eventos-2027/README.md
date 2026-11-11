# Levantamento de Eventos 2027 — SEDES/RJ

Consolidação das 7 planilhas enviadas pelas unidades (pasta `origem/`).

| Entrega | Conteúdo |
|---|---|
| `Consolidado_Eventos_SEDES_2027.xlsx` | Painel, Eventos por Período (mês/trimestre/semestre), Quantitativo Buffet, Necessidade Mensal, Agenda de Buffet, Base Consolidada, Inconsistências, Eventos Externos (ref.), Notas Metodológicas |
| `Painel_Eventos_SEDES_2027.html` | Painel interativo em arquivo único (abre offline em qualquer navegador) |

Regras desta versão:
- **Mínimo de 30 pessoas por evento.** Público estimado e pessoas do buffet abaixo de 30 sobem para 30. Eventos sem buffet continuam com 0 no buffet. Cada ajuste aparece na aba Inconsistências.
- **Base Consolidada enxuta (16 colunas).** Foram retiradas: ID, Unidade remetente, Categoria, Data início, Data fim, Semestre, Público estimado, Público entra nos totais?, Modalidade de buffet, Pessoas buffet, Status, Demanda de buffet e Formato.
- **Resumos como valores.** Como a Base não traz mais esses campos, os resumos são calculados na consolidação e gravados como valores. Somas e subtotais internos continuam como fórmula. Para atualizar, corrija a planilha de origem e rode os scripts de novo.

## Regerar e testar

```bash
cd docs/eventos-2027/scripts
python3 build_xlsx.py ../origem ../Consolidado_Eventos_SEDES_2027.xlsx
python3 build_html.py ../origem ../Painel_Eventos_SEDES_2027.html
python3 test_consolidado.py ../origem ../Consolidado_Eventos_SEDES_2027.xlsx ../Painel_Eventos_SEDES_2027.html
node dom_dump.cjs "$(realpath ../Painel_Eventos_SEDES_2027.html)" /tmp/dom.json && python3 test_html.py ../Consolidado_Eventos_SEDES_2027.xlsx /tmp/dom.json
```

Os testes cruzam três caminhos independentes: leitura crua das planilhas de origem, agregação em Python e as fórmulas recalculadas da planilha. Também conferem os números exibidos no HTML renderizado no Chromium.
