"""Apuração da planilha de andamento do GT de 25/09/2026 — fonte única da apresentação.
Nenhum dado de outra fonte é usado. Gera dados.json, lido pelo gerador da apresentação."""
import json, re, unicodedata, openpyxl
from pathlib import Path
D = Path(__file__).parent
ws = openpyxl.load_workbook(D / 'planilha_25-09-2026.xlsx', data_only=True).worksheets[0]

def txt(v):
    return re.sub(r'\s+', ' ', str(v)).strip() if v is not None else ''
def norm(s):
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()

# Colunas da planilha (linhas 1–2 = cabeçalho; dados a partir da linha 3)
COL = dict(n='A', sei_antigo='B', sei_novo='C', objeto='D', dod='E', dod_obs='F', ata='G', ata_obs='H', ti='I', ti_obs='J', docs='K', docs_obs='L', valor='M', andamento='N', observacao='O')
assert txt(ws['D1'].value) == 'OBJETO' and txt(ws['M1'].value) == 'VALOR ESTIMADO' and txt(ws['O1'].value) == 'OBSERVAÇÃO'

# Nome curto do objeto: a designação do próprio campo OBJETO, sem “Contratação de … visando atender às necessidades da FAETEC”
CURTO = {1: 'Chromebooks', 2: 'Softwares de edição e arquitetura', 3: 'Telefonia VoIP', 4: 'Câmeras de segurança (instalação e fornecimento)',
         5: 'Link de internet (Links SDWAN)', 6: 'Licenciamento de softwares Microsoft', 7: 'Antivírus com tecnologia EDR',
         8: 'Computadores básicos, notebooks e monitores', 9: 'Computadores avançados', 10: 'Appliances para backup', 11: 'Switch top of rack',
         12: 'Servidor hiperconvergente', 13: 'Rack 19U', 14: 'Access Point', 15: 'Pontos lógicos', 16: 'Telefonia móvel (celular)',
         17: 'Switch core', 18: 'Switch de acesso', 19: 'Firewall Fortinet', 20: 'Computador quântico'}

itens = []
for r in range(3, ws.max_row + 1):
    v = {k: ws[f'{c}{r}'].value for k, c in COL.items()}
    if v['objeto'] is None: continue
    it = {k: (v[k] if k in ('n', 'valor') else txt(v[k])) for k in COL}
    it['n'] = int(it['n'])
    it['curto'] = CURTO[it['n']]
    assert norm(CURTO[it['n']].split()[0])[:5] in norm(it['objeto']) or it['n'] in (4, 14, 3), (it['n'], it['objeto'])
    itens.append(it)
assert [i['n'] for i in itens] == list(range(1, 21))

def lista(pred): return [i['n'] for i in itens if pred(i)]
N = lambda s: norm(s)
res = {
 'total': len(itens),
 'dod': {'Elaborado': lista(lambda i: N(i['dod']) == 'elaborado'), 'Em elaboração': lista(lambda i: N(i['dod']) == 'em elaboracao'), 'Em análise': lista(lambda i: N(i['dod']) == 'em analise')},
 'ata': {'SIM': lista(lambda i: i['ata'] == 'SIM'), 'PARTICIPE': lista(lambda i: i['ata'] == 'PARTICIPE'), 'NÃO': lista(lambda i: i['ata'] == 'NÃO'), 'Não preenchido': lista(lambda i: i['ata'] == '')},
 'ti': {'SIM': lista(lambda i: i['ti'] == 'SIM'), 'NÃO': lista(lambda i: i['ti'] == 'NÃO')},
 'docs_registrado': lista(lambda i: i['docs'] != ''), 'docs_sem_registro': lista(lambda i: i['docs'] == ''),
 'com_valor': lista(lambda i: i['valor'] is not None), 'valor_total': round(sum(i['valor'] or 0 for i in itens), 2),
 'sei_informado': lista(lambda i: i['sei_novo'].startswith('SEI-')), 'sei_nao_informado': lista(lambda i: not i['sei_novo'].startswith('SEI-')),
 'sei_ano_diferente': [(i['n'], i['sei_novo']) for i in itens if i['sei_novo'].startswith('SEI-') and not i['sei_novo'].endswith('/2026')],
 'sem_justificativa_drive': lista(lambda i: 'sem justificativa no drive' in N(i['observacao'])),
 'enviado_luene': lista(lambda i: 'enviado para analise - luene' in N(i['observacao'])),
 'recebido_18_10': lista(lambda i: 'recebido 18/10' in N(i['observacao'])),
 'recebido_23_09': lista(lambda i: 'recebido 23/09' in N(i['observacao'])),
 'devolvido_area_tecnica': lista(lambda i: 'devolvido a area tecnica' in N(i['andamento'])),
 'nova_pesquisa_atas': lista(lambda i: 'sera realizada nova pesquisa de atas' in N(i['dod_obs'])),
 'itens': itens,
}
# Conferências
assert sum(len(v) for v in res['dod'].values()) == 20 and sum(len(v) for v in res['ata'].values()) == 20 and sum(len(v) for v in res['ti'].values()) == 20
assert res['dod'] == {'Elaborado': [1, 2, 3, 5, 6, 7, 10, 12, 18], 'Em elaboração': [4, 13, 14, 19], 'Em análise': [8, 9, 11, 15, 16, 17, 20]}
assert res['ata'] == {'SIM': [2, 7, 10, 12, 13, 14, 18, 19], 'PARTICIPE': [3, 6], 'NÃO': [4, 5, 8], 'Não preenchido': [1, 9, 11, 15, 16, 17, 20]}
assert res['ti']['SIM'] == [1, 2, 3, 6, 10]
assert res['com_valor'] == [1, 2, 10] and res['valor_total'] == 69681145.11
assert res['sei_nao_informado'] == [14, 18, 20] and [n for n, _ in res['sei_ano_diferente']] == [15, 16, 17]
assert res['sem_justificativa_drive'] == [11, 12, 13, 14, 15, 16, 17, 18, 19]
assert res['enviado_luene'] == [1, 3, 6] and res['recebido_18_10'] == [7, 8, 10] and res['recebido_23_09'] == [20]
assert res['devolvido_area_tecnica'] == [4, 5] and res['nova_pesquisa_atas'] == [4, 8, 9, 11, 15, 16, 17, 20]
assert res['docs_registrado'] == [1, 2, 3, 5, 6, 7, 10, 12]
(D / 'dados.json').write_text(json.dumps(res, ensure_ascii=False, indent=1))
print(json.dumps({k: v for k, v in res.items() if k != 'itens'}, ensure_ascii=False))
