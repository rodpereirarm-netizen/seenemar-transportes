# Auditoria da PLANILHA GERAL DE CONTRATOS

Scripts que geram os números do diagnóstico (`../DIAGNOSTICO_PLANILHA_GERAL_CONTRATOS.md`).
A planilha **não** está versionada aqui, porque contém nomes e matrículas de servidores. Passe o caminho do arquivo como argumento.

```bash
pip install openpyxl python-dateutil
python3 -I auditar_datas_valores.py "PLANILHA GERAL DE CONTRATOS.xlsx" auditoria.json   # datas (início + prazo × término) e valores
python3 -I auditar_completude_pessoas.py auditoria.json                                  # completude, publicações, fiscais/gestores, duplicidades
```

- A data de referência é **07/10/2026**, definida em `REF` nos dois scripts. Na planilha, a data equivalente vem de `=TODAY()`, nas células R8 e AD8.
- As linhas lidas vão de 12 a 52. A linha 21 fica de fora porque está vazia e mesclada com a 20.
