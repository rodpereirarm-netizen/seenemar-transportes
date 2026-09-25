"""Apuração reproduzível da 2ª carga (planilha de 24/09/2026) e comparação com a 1ª carga.
Uso: python3 apurar.py  -> gera apuracao.json com cada número e a lista de itens que o compõem."""
import json, re, openpyxl, unicodedata
from pathlib import Path
D = Path(__file__).parent

def norm(s):
    return unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower().strip()

def ler(arq, primeira_linha):
    ws = openpyxl.load_workbook(D / arq, data_only=True).worksheets[0]
    itens = []
    for r in ws.iter_rows(min_row=primeira_linha):
        v = {c.column_letter: c.value for c in r}
        if not v.get('D'): continue
        itens.append({k: (str(x).strip() if x is not None else None) for k, x in v.items()})
    return itens

# 1ª carga: cabeçalho em 2 linhas + linha em branco (dados a partir da linha 4), sem a coluna G de quantitativo
p1 = ler('planilha_1a_carga.xlsx', 4)
# 2ª carga: cabeçalho em 2 linhas (dados a partir da linha 3), com a coluna G (QUANTITATIVO A SER CONTRATADO)
p2 = ler('planilha_2a_carga_24-09-2026.xlsx', 3)

def titulo(objeto):
    o = re.sub(r'\s+', ' ', objeto)
    o = re.sub(r'(?i)^contrata[cç][aã]o\s+(de|para)\s+(aquisi[cç][aã]o de\s+)?', '', o)
    return re.split(r',\s*visando', o)[0].strip()

# Modalidade inferida da coluna H (ata) e I (observação da ata) — mesma regra usada na carga do sistema
def modalidade(it):
    h, i = norm(it.get('H')), norm(it.get('I'))
    if 'dispensa' in i: return 'dispensa'
    if h == 'participe': return 'participante_rp'
    if h == 'sim': return 'adesao_arp'
    return 'a_definir'

ATIV = {'adesao_arp': 32, 'participante_rp': 26, 'dispensa': 26, 'inexigibilidade': 26, 'licitacao_propria': 26, 'a_definir': 7}
LEGAIS = {'adesao_arp': 3, 'participante_rp': 3, 'dispensa': 3, 'a_definir': 0}

linhas = []
for it in p2:
    m = modalidade(it)
    linhas.append({
        'n': int(float(it['A'])), 'titulo': titulo(it['D']), 'objeto': re.sub(r'\s+', ' ', it['D']),
        'sei_antigo': it.get('B'), 'sei_novo': it.get('C'), 'dod': it.get('E'), 'dod_obs': it.get('F'),
        'quantitativo': it.get('G'), 'ata': it.get('H'), 'ata_obs': it.get('I'), 'ti': it.get('J'), 'ti_obs': it.get('K'),
        'docs': it.get('L'), 'docs_obs': it.get('M'), 'valor': float(it['N']) if it.get('N') else None,
        'ultimo_andamento': it.get('O'), 'observacao': it.get('P'),
        'modalidade': m, 'atividades': ATIV[m], 'prazos_legais': LEGAIS[m],
        'tem_sei': bool(it.get('C')) and 'nao ha' not in norm(it.get('C')),
        'sem_justificativa': norm(it.get('E')) == 'aguardando justificativa',
    })

def conta(pred): return [l['n'] for l in linhas if pred(l)]
res = {
  'total_linhas': len(linhas),
  'numeracao_sequencial': [l['n'] for l in linhas] == list(range(1, len(linhas) + 1)),
  'por_modalidade': {m: conta(lambda l, m=m: l['modalidade'] == m) for m in ATIV if conta(lambda l, m=m: l['modalidade'] == m)},
  'atividades_total': sum(l['atividades'] for l in linhas),
  'prazos_legais_total': sum(l['prazos_legais'] for l in linhas),
  'dod': {}, 'ata': {}, 'ti': {}, 'docs': {},
  'sem_justificativa': conta(lambda l: l['sem_justificativa']),
  'com_sei_novo': conta(lambda l: l['tem_sei']), 'sem_sei_novo': conta(lambda l: not l['tem_sei']),
  'com_valor': conta(lambda l: l['valor'] is not None),
  'valor_total': round(sum(l['valor'] or 0 for l in linhas), 2),
  'com_quantitativo': conta(lambda l: bool(l['quantitativo'])),
  'sei_ano_diferente_2026': [(l['n'], l['sei_novo']) for l in linhas if l['tem_sei'] and not l['sei_novo'].endswith('/2026')],
}
for campo, chave in (('dod', 'dod'), ('ata', 'ata'), ('ti', 'ti'), ('docs', 'docs')):
    for l in linhas:
        k = (l[chave] or '(vazio)').replace('\n', ' / ')
        res[campo].setdefault(k, []).append(l['n'])

# Comparação com a 1ª carga, casando pelo objeto (não pelo número, que foi renumerado)
def chave(o):
    t = norm(titulo(o))
    return re.sub(r'[^a-z0-9 ]', '', t)
c1 = {chave(it['D']): it for it in p1}
comp = []
for l in linhas:
    k = chave(l['objeto'])
    alvo = c1.get(k)
    if not alvo:  # casamento por prefixo (objeto reescrito, ex.: computadores, link, softwares)
        cand = [x for x in c1 if x.split(' ')[0] == k.split(' ')[0] and (x[:12] == k[:12])]
        alvo = c1[cand[0]] if len(cand) == 1 else None
    comp.append({'n2': l['n'], 'titulo': l['titulo'], 'n1': int(float(alvo['A'])) if alvo else None, 'titulo1': titulo(alvo['D']) if alvo else None})
usados = {c['titulo1'] for c in comp if c['titulo1']}
res['comparacao'] = comp
res['somente_1a_carga'] = [(int(float(it['A'])), titulo(it['D'])) for it in p1 if titulo(it['D']) not in usados]
res['somente_2a_carga'] = [(c['n2'], c['titulo']) for c in comp if c['n1'] is None]
res['linhas'] = linhas
(D / 'apuracao.json').write_text(json.dumps(res, ensure_ascii=False, indent=1))
print(json.dumps({k: v for k, v in res.items() if k not in ('linhas',)}, ensure_ascii=False, indent=1))
