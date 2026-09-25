"""Gera relatorio_verificacao.html (depois convertido em PDF) a partir de apuracao.json.
Os números do sistema foram obtidos por consulta somente leitura ao banco de produção em 25/09/2026."""
import json, html
from pathlib import Path
D = Path(__file__).parent
R = json.loads((D / 'apuracao.json').read_text())
e = html.escape

OK = '<span class="st ok">Confirmado</span>'
RS = '<span class="st rs">Confirmado com ressalva</span>'
DV = '<span class="st dv">Divergência</span>'
PJ = '<span class="st pj">Projeção</span>'

def tab(cab, linhas, cls=''):
    h = ''.join(f'<th>{c}</th>' for c in cab)
    b = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in l) + '</tr>' for l in linhas)
    return f'<table class="{cls}"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>'

MOD = {'adesao_arp': 'Adesão à ARP', 'participante_rp': 'Participante de RP', 'dispensa': 'Dispensa', 'a_definir': 'A definir'}
ETAPAS = {'adesao_arp': 'I a V', 'participante_rp': 'I, III, IV, V', 'dispensa': 'I, III, IV, V', 'a_definir': 'I'}
SIST = {1: '01', 2: '02', 3: '03', 4: '04', 5: '06', 6: '07', 7: '08', 8: '09', 9: '—', 10: '10', 11: '11', 12: '13', 13: '14', 14: '—', 15: '15', 16: '16', 17: '17', 18: '—', 19: '— (12?)', 20: '—'}
MOD1 = {1: 'adesao_arp', 2: 'adesao_arp', 3: 'participante_rp', 4: 'a_definir', 5: 'dispensa', 6: 'participante_rp', 7: 'adesao_arp', 8: 'a_definir', 10: 'adesao_arp', 11: 'a_definir', 12: 'a_definir', 13: 'a_definir', 15: 'a_definir', 16: 'a_definir', 17: 'a_definir'}

proj = []
for l in R['linhas']:
    m1 = MOD1.get(l['n'])
    mud = '' if m1 is None or m1 == l['modalidade'] else f' <b class="alerta">(era {MOD[m1]})</b>'
    proj.append([f"<b>{l['n']:02d}</b>", e(l['titulo'][:70]), SIST[l['n']], MOD[l['modalidade']] + mud, ETAPAS[l['modalidade']], f"<b>{l['atividades']}</b>", str(l['prazos_legais'])])
proj.append(['<b>—</b>', 'Tela interativa (mantida ativa, fora da planilha)', '05', 'A definir', 'I', '<b>7</b>', '0'])
tot = sum(l['atividades'] for l in R['linhas'])
assert tot == 347 and tot + 7 == 354 and R['prazos_legais_total'] == 27

doc = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de verificação · GT PROPAG</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet">
<style>
@page {{ size: A4; margin: 16mm 15mm 18mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Inter, sans-serif; color: #1b2236; font-size: 9.2pt; line-height: 1.5; margin: 0; }}
h1 {{ font-family: 'Source Serif 4', Georgia, serif; color: #16284d; font-size: 24pt; line-height: 1.1; margin: 0 0 3mm; }}
h2 {{ font-family: 'Source Serif 4', Georgia, serif; color: #16284d; font-size: 14.5pt; margin: 8mm 0 2.5mm; padding-top: 2mm; border-top: 1.2px solid #c8962f; break-after: avoid; }}
h3 {{ color: #16284d; font-size: 10.5pt; margin: 5mm 0 2mm; break-after: avoid; }}
.eyebrow {{ color: #8a5f0d; font-size: 8pt; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }}
.capa {{ background: #16284d; color: #d7deee; margin: -16mm -15mm 6mm; padding: 16mm 15mm 10mm; border-left: 9mm solid #c8962f; }}
.capa h1 {{ color: #fff; margin-top: 3mm; }} .capa .eyebrow {{ color: #e0b45a; }}
.capa p {{ margin: 1mm 0; color: #cfd6e6; font-size: 10pt; }}
.regra {{ background: #fbe2de; border-left: 4px solid #b3372b; padding: 3mm 4mm; margin: 4mm 0; font-weight: 500; }}
.box {{ background: #fbfaf6; border: 1px solid #e2dccf; border-radius: 2mm; padding: 3mm 4mm; margin: 3mm 0; }}
table {{ width: 100%; border-collapse: collapse; margin: 2mm 0 3mm; font-size: 8.4pt; break-inside: auto; }}
thead {{ display: table-header-group; }}
tr {{ break-inside: avoid; }}
th {{ background: #16284d; color: #fbfaf6; text-align: left; padding: 1.6mm 2mm; font-weight: 600; }}
td {{ padding: 1.4mm 2mm; border-bottom: 1px solid #e2dccf; vertical-align: top; }}
tbody tr:nth-child(even) td {{ background: #f7f5ef; }}
.st {{ display: inline-block; font-weight: 700; font-size: 7.6pt; padding: .3mm 1.8mm; border-radius: 1mm; white-space: nowrap; }}
.ok {{ background: #e2efe6; color: #2f6b4f; }} .rs {{ background: #e1e8f5; color: #16284d; }}
.dv {{ background: #fbe2de; color: #b3372b; }} .pj {{ background: #f7e9c9; color: #8a5f0d; }}
.alerta {{ color: #b3372b; }}
.num {{ font-family: 'Source Serif 4', Georgia, serif; font-weight: 700; color: #16284d; }}
.kpis {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: 3mm 0; }}
.kpis div {{ background: #fbfaf6; border: 1px solid #e2dccf; border-radius: 2mm; padding: 3mm; }}
.kpis b {{ display: block; font-family: 'Source Serif 4', Georgia, serif; font-size: 20pt; color: #16284d; line-height: 1.1; }}
.kpis span {{ font-size: 8pt; color: #5f5a4e; }}
code {{ font-size: 8pt; background: #f3f0e9; padding: 0 1mm; border-radius: 1mm; }}
.small {{ font-size: 8pt; color: #5f5a4e; }}
</style></head><body>

<div class="capa">
  <div class="eyebrow">GT PROPAG · Compras Públicas · FAETEC</div>
  <h1>Relatório de verificação dos números</h1>
  <p>Conferência de cada número da apresentação executiva e comparativo entre a 1ª carga (sistema) e a 2ª carga (planilha do GT de 24/09/2026).</p>
  <p><b style="color:#fff">Posição em 25/09/2026</b> · Anexo da apresentação “Status das contratações da FAETEC” (v2)</p>
</div>

<div class="regra">Regra observada: nada foi implementado ou alterado no sistema. O banco de produção foi apenas consultado, somente leitura. A 2ª carga não foi lançada e só será lançada com autorização expressa. As imagens do sistema foram geradas em uma réplica local com a mesma carga da produção.</div>

<h2>1. Resultado</h2>
<div class="kpis">
  <div><b>32</b><span>atividades por fluxo: <b style="display:inline;font:inherit;color:#2f6b4f">confirmado</b> (documento = sistema)</span></div>
  <div><b>276</b><span>atividades no sistema (1ª carga): <b style="display:inline;font:inherit;color:#2f6b4f">confirmado</b> por cálculo e consulta</span></div>
  <div><b>+3</b><span>linhas na planilha: confirmado como saldo, mas são 5 entradas e 2 saídas</span></div>
  <div><b>354</b><span>atividades previstas para a carteira de 21 demandas: projeção</span></div>
</div>
<div class="box"><b>Legenda.</b> {OK} o número confere com a fonte primária e com um cálculo independente. {RS} o número confere, com uma observação sobre como interpretá-lo. {DV} as fontes não batem, é preciso uma decisão ou correção. {PJ} o número foi calculado pela regra do sistema, mas ainda não existe no sistema.</div>

<h2>2. Fontes e método</h2>
{tab(['Fonte', 'O que fornece', 'Como foi usada'], [
 ['<b>F1</b> · Documento “GT FAETEC — Macroprocesso e Equipe” (PDF, 5 páginas)', 'Macroprocessos, etapas, 32 atividades, prazos legais, pontos de atenção, equipe', 'Leitura do texto das páginas 2 a 4 e recontagem item a item'],
 ['<b>F2</b> · Banco de produção do sistema (Supabase)', 'Catálogo de atividades, 17 demandas, 276 atividades e respectivas situações', 'Consultas SQL somente leitura em 25/09/2026, sem nenhuma escrita'],
 ['<b>F3</b> · Planilha do GT, 1ª carga (17 linhas)', 'Base da carga inicial do sistema', 'Leitura por script (<code>apurar.py</code>)'],
 ['<b>F4</b> · Planilha do GT de 24/09/2026, 2ª carga (20 linhas)', 'Situação atualizada, com a nova coluna de quantitativo', 'Leitura por script; casamento com a 1ª carga pelo objeto, não pelo número'],
])}
<p>Para projetar a 2ª carga, a modalidade foi enquadrada pela coluna “Ata” da planilha: SIM → adesão; PARTICIPE → participante; “Dispensa” na observação → dispensa; demais casos → a definir. É a mesma regra da carga inicial. <b>Aplicada à 1ª carga, ela reproduz exatamente as 276 atividades da produção</b> (4 × 32 + 3 × 26 + 10 × 7), o que valida a projeção.</p>

<h2>3. Números do fluxo e da equipe (F1 × F2)</h2>
{tab(['Número', 'Valor', 'Conferência', 'Status'], [
 ['Macroprocessos', '<span class="num">3</span>', 'F1 p.2: Fase preparatória · Seleção e precificação · Fase contratual. F2: 3 macroprocessos na tabela de etapas', OK],
 ['Etapas', '<span class="num">5</span>', 'F1 p.3: Etapas I a V. F2: tabela <code>etapas</code> com 5 linhas', OK],
 ['<b>Atividades do fluxo</b>', '<span class="num">32</span>', 'F1 p.3, recontagem: I = 7, II = 6, III = 3, IV = 7, V = 9 → 7 + 6 + 3 + 7 + 9 = 32. F2: <code>atividades_modelo</code> = 32 (7/6/3/7/9), com os mesmos nomes e na mesma ordem', OK],
 ['Atividades por macroprocesso', '<span class="num">7 · 16 · 9</span>', 'F1 p.2: 7 (Etapa I) · 16 (Etapas II a IV: 6 + 3 + 7) · 9 (Etapa V). Soma 32', OK],
 ['Prazos legais críticos', '<span class="num">3</span>', 'SEPLAG 15 dias corridos (Dec. 48.821/2023) · PRODERJ 20 dias úteis, prorrogáveis por +20 (IN PRODERJ/PRE 05/2024) · CGE 15 dias corridos. F1 p.2: 0 + 2 + 1. F2: 3 atividades com <code>prazo_critico</code>', OK],
 ['Pontos de atenção', '<span class="num">4</span>', 'F1 p.2: 1 + 2 + 1 (PCA/PEDTIC · gate de ata válida · sem ponto focal na IV · sem ponto focal na V). F2: 2 no nível da atividade e 2 no nível da etapa', RS + '<br><span class="small">Os dois “sem ponto focal” estão registrados na etapa, não em uma atividade.</span>'],
 ['Exposição legal por demanda', '<span class="num">58 a 86 dias</span>', '15 + 28 + 15 = 58 e 15 + 56 + 15 = 86, com 20 dias úteis ≈ 28 dias corridos (4 semanas) e 40 dias úteis ≈ 56. Não considera feriados', RS + '<br><span class="small">Aproximação: com feriados, o prazo do PRODERJ fica maior.</span>'],
 ['Integrantes do GT', '<span class="num">15</span>', 'F1 p.4: Frente I = 4, Frente II = 8, Frente III = 3. F2: 15 integrantes com <code>membro_gt</code> + 1 administrador do sistema (16 registros)', OK],
 ['Integrantes por órgão', '<span class="num">5 · 3 · 4 · 3</span>', 'SEDES: Karina, Elias, Andressa, Allana, Taina. SECTI: Cristiane, Thamyres, Pascoal. FAETEC: Vinicius, Jhonatan, Gibson, Luene. PRODERJ: Mara, Thailane, Marco', OK],
 ['Modelo de trabalho', '<span class="num">3 híbrido · 12 presencial</span>', 'Híbrido: Karina, Elias, Pascoal. Presencial: os outros 12', OK],
])}

<h2>4. Números do sistema em produção (F2 · 1ª carga)</h2>
{tab(['Número', 'Valor', 'Conferência', 'Status'], [
 ['Demandas em carteira', '<span class="num">17</span>', 'Consulta: 17 contratações, números 1 a 17, sem lacunas', OK],
 ['<b>Atividades no checklist</b>', '<span class="num">276</span>', 'Adesão 01, 02, 08, 10: 4 × 32 = 128 · Participante 03, 07: 2 × 26 = 52 · Dispensa 06: 1 × 26 = 26 · A definir 04, 05, 09, 11 a 17: 10 × 7 = 70 → 128 + 52 + 26 + 70 = 276. A consulta por demanda confere cada parcela', OK],
 ['Concluídas', '<span class="num">17 (6%)</span>', '17 ÷ 276 = 6,2%. São 10 identificações da demanda (01 a 10), 5 DODs (01, 02, 03, 07, 10) e 2 ETPs reaproveitados do PRODERJ (03, 07). Todas registradas na carga de 24/09', OK],
 ['Em curso', '<span class="num">9</span>', 'Em andamento 5 + aguardando 2 + devolvida 2 = 9', OK],
 ['Pendentes', '<span class="num">250</span>', '17 + 9 + 250 = 276', OK],
 ['Abertas sem responsável', '<span class="num">256 de 259 (99%)</span>', 'Abertas = 276 − 17 concluídas = 259. Sem responsável: 256 (98,8%). Com responsável: 3 (Gibson 2, Luene 1)', OK],
 ['Demandas com responsável geral', '<span class="num">0 de 17</span>', 'Consulta: <code>responsavel_geral_id</code> vazio nas 17', OK],
 ['Prazos legais previstos', '<span class="num">21</span>', '7 demandas com via definida (4 adesões + 2 participantes + 1 dispensa) × 3 prazos = 21 atividades com prazo crítico', OK],
 ['Prazos legais em contagem', '<span class="num">0</span>', 'Nenhuma atividade com data de envio. O prazo só começa com o envio', OK],
 ['Valor informado', '<span class="num">R$ 69.681.145,11</span>', '64.818.000,00 + 3.559.045,11 + 1.304.100,00. Só as demandas 01, 10 e 02 têm valor', OK],
 ['Concentração de valor', '<span class="num">93% · 5% · 2%</span>', 'Chromebooks 93,0% · Appliances 5,1% · Softwares 1,9%. As 5 prioridades da v2 somam 98,1% (Chromebooks + Appliances)', OK],
 ['Atas cadastradas', '<span class="num">6, nenhuma com vigência</span>', 'Consulta: 6 atas, nenhuma com data de fim de vigência preenchida', OK],
 ['Alterações de usuários em contratações', '<span class="num">0</span>', 'Auditoria: nenhuma edição de contratação depois da carga. O sistema está igual à 1ª carga', OK],
])}

<h2>5. Números da planilha de 24/09 (F4 · 2ª carga)</h2>
{tab(['Número', 'Valor', 'Itens (nº da planilha)', 'Status'], [
 ['Linhas', '<span class="num">20</span>', 'Numeração sequencial de 1 a 20, sem lacunas nem repetições', OK],
 ['DOD elaborado', '<span class="num">7</span>', '01, 02, 03, 05, 06, 07, 10', OK],
 ['DOD em análise / em elaboração', '<span class="num">6 · 1</span>', 'Em análise: 08, 13, 16, 17, 19, 20 · Em elaboração: 04', OK],
 ['Aguardando justificativa', '<span class="num">6</span>', '09, 11, 12, 14, 15, 18. Justificativa recebida: 20 − 6 = 14', OK],
 ['Via definida', '<span class="num">9</span>', 'Ata SIM: 01, 02, 07, 10, 13, 14 · PARTICIPE: 03, 06 · Dispensa: 05', OK],
 ['Manifestação do TI = SIM', '<span class="num">5</span>', '01, 02, 03, 06, 10. Na 06, a observação diz “aguardando análise e remanejamento do quantitativo pelo PRODERJ”', RS],
 ['Processo SEI novo', '<span class="num">17 de 20</span>', 'Sem processo: 14, 18, 20', OK],
 ['SEI com ano diferente de 2026', '<span class="num">4</span>', '13: …/2027 · 15: …/2028 · 16: …/2029 · 17: …/2025', DV],
 ['Com valor', '<span class="num">3</span>', '01, 02, 10, com os mesmos valores da 1ª carga', OK],
 ['Com quantitativo', '<span class="num">13 preenchidos · 10 efetivos</span>', 'Com quantidade: 01, 02, 03, 05, 06, 07, 08, 10, 13, 19 · só registram a falta: 04, 17, 20', RS],
])}

<h2>6. Comparativo entre a 1ª e a 2ª carga</h2>
<h3>6.1 A afirmação “entraram mais 3 linhas, passando para 20”</h3>
<p>{RS} O saldo de +3 está certo (17 → 20), mas a composição não é “3 linhas novas”: <b>15 objetos continuam</b> (8 renumerados), <b>5 entraram</b> e <b>2 saíram</b> da planilha. 17 − 2 + 5 = 20. Com a Tela interativa mantida ativa por decisão do GT, a carteira consolidada tem <b>21</b> demandas, ou 22 se o Firewall do sistema for uma demanda diferente do Firewall Fortinet.</p>
<h3>6.2 De-para da numeração</h3>
{tab(['Plan.', 'Objeto na planilha de 24/09', 'Sist.', 'Situação da correspondência'], [[f"<b>{c['n2']:02d}</b>", e(c['titulo'][:80]), SIST[c['n2']], x] for c, x in zip(R['comparacao'], [
 'Mesmo objeto e número', 'Mesmo objeto; nome ampliado com “/engenharia”', 'Mesmo objeto e número', 'Mesmo objeto e número', 'Renumerado (06 → 05); objeto detalhado “Links SDWAN”',
 'Renumerado (07 → 06)', 'Renumerado (08 → 07)', 'Renumerado (09 → 08); desmembrado', '<b>Novo</b>: parte desmembrada do item 09 do sistema', 'Mesmo objeto e número',
 'Mesmo objeto e número', 'Renumerado (13 → 12)', 'Renumerado (14 → 13)', '<b>Novo</b>', 'Mesmo objeto e número', 'Mesmo objeto e número', 'Mesmo objeto e número',
 '<b>Novo</b>', '<b class="alerta">Novo ou substituto do Firewall (sist. 12)</b>', '<b>Novo</b>'])]
 + [['—', 'Tela interativa', '05', '<b class="alerta">Fora da planilha; mantida ativa</b>'], ['—', 'Firewall', '12', '<b class="alerta">Fora da planilha; ponto de atenção</b>']])}

<h3>6.3 Evolução dos marcos da Etapa I</h3>
{tab(['Indicador', '1ª carga (17)', '2ª carga (20)', 'Leitura'], [
 ['Justificativa recebida', '10', '14', '+4; pendentes caíram de 7 para 6'],
 ['Via definida (ata, participação ou dispensa)', '7', '9', '+2: Rack 19U e Access Point (ARP 167/2025 SEPLAG/MG)'],
 ['DOD elaborado', '5', '7', '+2: Link de internet e Antivírus'],
 ['Manifestação do TI favorável', '1', '5', '+4: Chromebooks, Softwares, Microsoft, Appliances'],
 ['Processo SEI novo', '3', '17', '+14, com 4 anos a conferir'],
 ['Demandas com valor', '3', '3', 'Sem mudança'],
])}

<h3>6.4 Firewall × Firewall Fortinet (ponto de atenção)</h3>
{tab(['Campo', '1ª carga · Firewall (sist. 12)', '2ª carga · Firewall Fortinet (plan. 19)'], [
 ['Objeto', 'Firewall, sem especificação', 'Firewall Fortinet, com indicação de marca'],
 ['Processo SEI', 'não informado', 'SEI-260005/008714/2026'],
 ['Justificativa / DOD', 'sem justificativa no drive', 'recebida em 24/09 · DOD em análise'],
 ['Quantitativo', 'não informado', '2 NGFW · 2 conjuntos de licenças · 2 consoles de gerenciamento · 2 de logs · 2 de relatórios · treinamento (3)'],
 ['Ata · TI', 'sem ata · sem manifestação', 'sem ata · TI: NÃO'],
 ['Efeito na contagem', '7 atividades (a definir)', 'se substituir: 21 demandas / 354 atividades · se for distinto: 22 / 361'],
])}
<p>{DV} Precisa de decisão do GT. Além disso, citar a marca no objeto exige justificativa formal (padronização ou compatibilidade), conforme o art. 41, I, da Lei 14.133/2021.</p>

<h2>7. Projeção de atividades da 2ª carga</h2>
{tab(['Plan.', 'Objeto', 'Sist.', 'Modalidade (regra da carga)', 'Etapas', 'Ativ.', 'Prazos'], proj, 'proj')}
{tab(['Número', 'Valor', 'Conferência', 'Status'], [
 ['Atividades · 20 linhas da planilha', '<span class="num">347</span>', 'Adesão 01, 02, 07, 10, 13, 14: 6 × 32 = 192 · Participante 03, 06: 2 × 26 = 52 · Dispensa 05: 26 · A definir (11): 11 × 7 = 77 → 192 + 52 + 26 + 77 = 347', PJ],
 ['Atividades · carteira de 21 (com a Tela)', '<span class="num">354</span>', '347 + 7', PJ],
 ['Ponte 276 → 354', '<span class="num">+78</span>', '+60 das 5 novas (Access Point 32 + 4 × 7) · +25 do Rack 19U (a definir → adesão: 32 − 7) · −7 do Firewall do sistema, fora da planilha → 276 + 60 + 25 − 7 = 354', PJ],
 ['Cenário com os dois firewalls', '<span class="num">361</span>', '354 + 7', PJ],
 ['Prazos legais previstos', '<span class="num">27</span>', '9 demandas com via definida × 3 = 27 (eram 21)', PJ],
])}

<h2>8. Divergências encontradas</h2>
{tab(['#', 'Divergência', 'Onde', 'Evidência', 'Status'], [
 ['1', 'Firewall × Firewall Fortinet', 'plan. 19 · sist. 12', 'Ver 6.4', DV],
 ['2', 'Possível dupla contagem de computadores', 'plan. 08 × 09', 'O quantitativo do 08 inclui “computadores de alto desempenho (2.140)”; o 09 é “Computadores avançados”', DV],
 ['3', 'Objeto e quantitativo do 08 não batem', 'plan. 08', 'Objeto: básicos 5.500, notebook 2.260, monitor 22" 7.640, monitor 24" 600. Quantitativo: básicos 5.500, alto desempenho 2.140, monitor 22" 600', DV],
 ['4', 'Processo SEI com ano diferente de 2026', 'plan. 13, 15, 16, 17', '…/2027, …/2028, …/2029, …/2025. Três deles têm número sequencial (009052, 009053, 009054) e anos diferentes, o que sugere erro de digitação no ano', DV],
 ['5', 'Número da ARP diverge', 'plan. 02', 'Observação do DOD: ARP 147/2024. Observação da ata: ARP 1477/2024 (CELIC/RS). Divergência já presente na 1ª carga', DV],
 ['6', 'Tela interativa fora da planilha', 'sist. 05', 'Não consta na 2ª carga. Mantida ativa por decisão do GT', RS],
 ['7', 'Sem processo SEI', 'plan. 14, 18, 20', '“Não há processo informado”', DV],
 ['8', 'Informação regrediu', 'plan. 12 (sist. 13)', '1ª carga: “já tem ata e aceite das partes”. 2ª: “sem justificativa no drive”', DV],
 ['9', 'Objeto atípico, sem quantitativo', 'plan. 20', 'Computador quântico: justificativa de 23/09 sem quantidade clara e sem ata', DV],
 ['—', 'Corrigido na 2ª carga', '1ª carga', 'O Link de internet estava numerado como “0”; “Recebido 18/10” virou “18/09”', OK],
])}

<h2>9. O que não foi feito</h2>
<p>Nenhum dado foi incluído, alterado ou excluído no sistema. Não houve deploy nem publicação de código. As 5 demandas novas, a renumeração, as atualizações de situação, o caso Firewall e a correção dos anos dos processos SEI <b>dependem de autorização</b>. Quando ela vier, a carga deve partir do de-para da seção 6.2 e das decisões sobre as divergências da seção 8.</p>
<p class="small">Reprodução: <code>python3 apurar.py</code> recalcula a partir das duas planilhas todos os números das seções 5 a 8 e grava <code>apuracao.json</code>. <code>python3 gerar_relatorio.py</code> gera este relatório. Os números das seções 3 e 4 vêm das consultas somente leitura ao banco de produção feitas em 25/09/2026.</p>
</body></html>"""
(D / 'relatorio_verificacao.html').write_text(doc)
print('ok')
