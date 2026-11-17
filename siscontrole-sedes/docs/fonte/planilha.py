# Gera a planilha de controle do projeto SisControle SEDES (Excel)
import sys
from datetime import date, timedelta
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import FormulaRule, CellIsRule, DataBarRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.comments import Comment
from openpyxl.utils import get_column_letter as L

OUT = sys.argv[1]
AZUL, AZUL2, OURO, CINZA = '062A57', '1858A8', 'B8932A', '5A6B85'
F = 'Arial'
fill = lambda c: PatternFill('solid', start_color=c, end_color=c)
fino = Side(style='thin', color='C7D0DD')
borda = Border(left=fino, right=fino, top=fino, bottom=fino)
ENTRADA = fill('FFF7D6')  # células para preencher
D = lambda d, m, a=2026: date(a, m, d)

wb = Workbook()
wb.remove(wb.active)

def aba(nome, cor=AZUL):
    ws = wb.create_sheet(nome)
    ws.sheet_properties.tabColor = cor
    ws.sheet_view.showGridLines = False
    return ws

def titulo(ws, txt, sub, ncols):
    ws['A1'] = txt; ws['A1'].font = Font(name=F, size=16, bold=True, color=AZUL)
    ws['A2'] = sub; ws['A2'].font = Font(name=F, size=10, italic=True, color=CINZA)
    ws.row_dimensions[1].height = 26

def cabecalho(ws, linha, cols, larguras=None):
    for i, c in enumerate(cols, 1):
        cel = ws.cell(row=linha, column=i, value=c)
        cel.font = Font(name=F, bold=True, color='FFFFFF', size=10)
        cel.fill = fill(AZUL); cel.border = borda
        cel.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[linha].height = 32
    if larguras:
        for i, w in enumerate(larguras, 1):
            ws.column_dimensions[L(i)].width = w

def celula(ws, r, c, v, fmt=None, entrada=False, negrito=False, cor=None, alin='left', wrap=True):
    cel = ws.cell(row=r, column=c, value=v)
    cel.font = Font(name=F, size=10, bold=negrito, color=cor or ('0000FF' if entrada else '000000'))
    cel.border = borda
    cel.alignment = Alignment(horizontal=alin, vertical='center', wrap_text=wrap)
    if fmt: cel.number_format = fmt
    if entrada: cel.fill = ENTRADA
    return cel

def nome(n, ref):
    wb.defined_names[n] = DefinedName(n, attr_text=ref)

def lista_dv(ws, faixa, nome_lista):
    dv = DataValidation(type='list', formula1=f'={nome_lista}', allow_blank=True, showErrorMessage=True,
                        errorTitle='Valor inválido', error='Escolha um valor da lista.')
    ws.add_data_validation(dv); dv.add(faixa)

DATA = 'dd/mm/yyyy'
PCT = '0%'

# =====================================================================
# PARÂMETROS
# =====================================================================
pa = aba('Parâmetros', CINZA)
titulo(pa, 'Parâmetros e listas', 'Data de status, início do gráfico, feriados e listas usadas nas validações.', 8)
celula(pa, 4, 2, 'Parâmetro', negrito=True)
celula(pa, 4, 3, 'Valor', negrito=True)
celula(pa, 5, 2, 'Data de status (referência do relatório)')
c = celula(pa, 5, 3, D(17, 11), DATA, entrada=True)
c.comment = Comment('Data usada para calcular atrasos, % planejado e farol. Atualize a cada relatório semanal. Para atualização automática, troque por =HOJE().', 'PMO')
celula(pa, 6, 2, 'Início do gráfico de Gantt')
celula(pa, 6, 3, D(13, 11), DATA, entrada=True)
celula(pa, 7, 2, 'Projeto')
celula(pa, 7, 3, 'SisControle SEDES — Sistema de Controle Interno e Auditoria', entrada=True)
celula(pa, 8, 2, 'Gerente do projeto / PMO')
celula(pa, 8, 3, 'Assessoria de Gestão Estratégica (AGE)', entrada=True)
nome('DataStatus', "'Parâmetros'!$C$5")
nome('InicioGantt', "'Parâmetros'!$C$6")

celula(pa, 10, 2, 'Feriados e pontos facultativos', negrito=True)
celula(pa, 10, 3, 'Descrição', negrito=True)
feriados = [(D(20, 11), 'Dia da Consciência Negra (feriado nacional)'), (D(8, 12), 'Ponto facultativo a confirmar (não usado)'), (D(24, 12), 'Véspera de Natal (ponto facultativo)'), (D(25, 12), 'Natal'), (D(31, 12), 'Véspera de Ano-Novo (ponto facultativo)'), (D(1, 1, 2027), 'Confraternização Universal'), (D(20, 1, 2027), 'São Sebastião (feriado municipal do Rio)'), (D(8, 2, 2027), 'Carnaval'), (D(9, 2, 2027), 'Carnaval'), (D(10, 2, 2027), 'Quarta-feira de Cinzas (ponto facultativo até 14h)')]
for i, (d, t) in enumerate([x for x in feriados if '(não usado)' not in x[1]]):
    celula(pa, 11 + i, 2, d, DATA, entrada=True)
    celula(pa, 11 + i, 3, t, entrada=True)
for r in range(11 + 9, 31):
    celula(pa, r, 2, None, DATA, entrada=True); celula(pa, r, 3, None, entrada=True)
nome('Feriados', "'Parâmetros'!$B$11:$B$30")
celula(pa, 31, 2, 'Fonte: calendário oficial; confirmar pontos facultativos com o decreto estadual do ano. Linhas em branco podem receber novos feriados.', cor=CINZA)

listas = {
    'ListaStatus': ('E', 'Status', ['Não iniciada', 'Em andamento', 'Concluída', 'Bloqueada', 'Cancelada']),
    'ListaTipo': ('F', 'Tipo', ['Fase', 'Tarefa', 'Marco']),
    'ListaResp': ('G', 'Responsável', ['ASCOIN', 'AGE', 'ASCOIN e AGE', 'Equipe técnica', 'CHEGAB', 'SUBEXE', 'Patrocinadores', 'Todos']),
    'ListaPrioridade': ('H', 'Prioridade (MoSCoW)', ['M — Obrigatório', 'S — Importante', 'C — Desejável', 'W — Fora agora']),
    'ListaEstrategia': ('I', 'Resposta ao risco', ['Mitigar', 'Evitar', 'Transferir', 'Aceitar', 'Escalar']),
    'ListaStatusRisco': ('J', 'Status do risco', ['Ativo', 'Em monitoramento', 'Ocorreu (vira pendência)', 'Encerrado']),
    'ListaStatusPend': ('K', 'Status da pendência', ['Aberta', 'Em andamento', 'Concluída', 'Cancelada']),
    'ListaFarol': ('L', 'Farol', ['Verde', 'Amarelo', 'Vermelho']),
    'ListaSimNao': ('M', 'Sim/Não', ['Sim', 'Não']),
    'ListaDecisaoCR': ('N', 'Decisão da mudança', ['Em análise', 'Aprovada', 'Aprovada com ressalvas', 'Rejeitada', 'Adiada']),
    'ListaEscala': ('O', 'Escala 1 a 5', [1, 2, 3, 4, 5]),
}
for n, (col, tit, vals) in listas.items():
    cc = pa[f'{col}4']; cc.value = tit; cc.font = Font(name=F, bold=True, color='FFFFFF', size=10); cc.fill = fill(AZUL); cc.border = borda
    cc.alignment = Alignment(wrap_text=True, vertical='center')
    for i, v in enumerate(vals):
        celula(pa, 5 + i, ord(col) - 64, v)
    nome(n, f"'Parâmetros'!${col}$5:${col}${4 + len(vals)}")
pa.column_dimensions['A'].width = 2; pa.column_dimensions['B'].width = 40; pa.column_dimensions['C'].width = 52
for col in 'EFGHIJKLMNO': pa.column_dimensions[col].width = 20
pa.row_dimensions[4].height = 30

# =====================================================================
# CRONOGRAMA (EAP + Gantt)
# =====================================================================
cr = aba('Cronograma', AZUL2)
titulo(cr, 'Cronograma do projeto (EAP, linha de base e Gantt)', 'Preencha as colunas em amarelo. Fases calculam sozinhas a partir das tarefas. VP = valor planejado; VA = valor agregado (em horas).', 24)
COLS = ['ID EAP', 'Atividade', 'Tipo', 'Responsável', 'Aprova', 'Início (linha de base)', 'Término (linha de base)', 'Início previsto', 'Término previsto', 'Duração (dias úteis)', 'Predecessora', 'Início real', 'Término real', '% concluído', 'Status', 'Situação (calculada)', 'Variação do término (dias úteis)', 'Esforço (h)', '% planejado na data', 'VP (h)', 'VA (h)', 'Entregável / critério de aceite', 'Observações']
NC = len(COLS)
H0 = 5  # linha do cabeçalho
cabecalho(cr, H0, COLS, [8, 46, 9, 15, 13, 12, 12, 12, 12, 10, 10, 12, 12, 10, 14, 15, 11, 9, 11, 9, 9, 40, 30])
cr.row_dimensions[H0].height = 44

C_ = {n: L(i + 1) for i, n in enumerate(['id', 'atv', 'tipo', 'resp', 'aprova', 'ib', 'tb', 'ip', 'tp', 'dur', 'pred', 'ir', 'tr', 'pct', 'st', 'sit', 'var', 'h', 'pplan', 'vp', 'va', 'ent', 'obs'])}

# (id, atividade, tipo, resp, aprova, início, término, pred, % , status, horas, entregável, obs, início real, término real)
ok = (1, 'Concluída')
fases = [
 ('1', 'Iniciação e planejamento', [
   ('1.1', 'Levantamento de requisitos (questionário respondido pela ASCOIN)', 'Tarefa', 'AGE', 'ASCOIN', D(13,11), D(13,11), '', ok, 4, 'Questionário respondido e consolidado'),
   ('1.2', 'Análise do Regimento Interno e proposta de MVP', 'Tarefa', 'AGE', 'ASCOIN', D(13,11), D(13,11), '1.1', ok, 4, 'Documento de requisitos e MVP'),
   ('1.3', 'Modelo de dados, matriz de permissões, telas e plano de 10 dias', 'Tarefa', 'AGE', 'ASCOIN', D(13,11), D(13,11), '1.2', ok, 6, 'Proposta técnica aprovada pelo PO'),
   ('1.4', 'Documento de projeto v1.0', 'Tarefa', 'AGE', 'Patrocinadores', D(17,11), D(17,11), '2.4', ok, 8, 'Documento .docx entregue'),
   ('1.5', 'Revisão e assinatura do documento de projeto', 'Tarefa', 'Patrocinadores', 'Patrocinadores', D(18,11), D(19,11), '1.4', (0, 'Não iniciada'), 4, 'Quadro de aprovações assinado'),
   ('M1', 'Marco M1 · Documento de projeto aprovado', 'Marco', 'Patrocinadores', 'Patrocinadores', D(19,11), D(19,11), '1.5', (0, 'Não iniciada'), 0, 'Assinaturas da seção de aprovações'),
 ]),
 ('2', 'Prototipação e validação do fluxo', [
   ('2.1', 'Maquete v1 (todas as telas do MVP)', 'Tarefa', 'AGE', 'ASCOIN', D(13,11), D(13,11), '1.3', ok, 8, 'Maquete navegável publicada'),
   ('2.2', 'Maquete v2 (azul institucional, pareceres, pool, trilha)', 'Tarefa', 'AGE', 'ASCOIN', D(16,11), D(16,11), '2.1', ok, 6, 'Maquete v2 publicada'),
   ('2.3', 'Maquete v3 (temas, configurações, manutenção, agenda, widgets)', 'Tarefa', 'AGE', 'ASCOIN', D(16,11), D(16,11), '2.2', ok, 8, 'Maquete v3 e guia visual da assinatura'),
   ('2.4', 'Maquete v4 (melhorias, distribuição e atendimento)', 'Tarefa', 'AGE', 'ASCOIN', D(16,11), D(17,11), '2.3', ok, 10, 'Maquete v4 publicada'),
   ('2.5', 'Validação dos passos 1 a 3 do fluxo', 'Tarefa', 'ASCOIN e AGE', 'ASCOIN', D(16,11), D(16,11), '2.4', ok, 3, 'Decisões D13 e D14'),
   ('2.6', 'Validação do passo 4 (análise da ASCOIN)', 'Tarefa', 'ASCOIN e AGE', 'ASCOIN', D(18,11), D(18,11), '2.5', (0, 'Não iniciada'), 3, 'Regras de aceite e devolução confirmadas'),
   ('2.7', 'Validação dos passos 5 a 9 (consolidação a encerramento)', 'Tarefa', 'ASCOIN e AGE', 'ASCOIN', D(19,11), D(24,11), '2.6', (0, 'Não iniciada'), 6, 'Fluxo completo aprovado'),
   ('2.8', 'Validação do conjunto final de status', 'Tarefa', 'ASCOIN', 'ASCOIN', D(24,11), D(24,11), '2.7', (0, 'Não iniciada'), 2, 'Tabela de status aprovada'),
   ('2.9', 'Confirmação da página pública de verificação', 'Tarefa', 'ASCOIN', 'CHEGAB', D(18,11), D(19,11), '', (0, 'Não iniciada'), 1, 'Decisão registrada'),
   ('2.10', 'Documento de projeto v1.1 (fluxo completo)', 'Tarefa', 'AGE', 'ASCOIN', D(25,11), D(25,11), '2.8', (0, 'Não iniciada'), 4, 'Documento atualizado'),
 ]),
 ('3', 'Insumos e ambiente', [
   ('3.1', 'Contratar o plano Pro do Supabase', 'Tarefa', 'AGE', 'SUBEXE', D(18,11), D(23,11), 'M1', (0, 'Não iniciada'), 4, 'Plano Pro ativo, com backup diário'),
   ('3.2', 'Criar projetos de homologação e produção (Supabase e Vercel)', 'Tarefa', 'Equipe técnica', 'AGE', D(23,11), D(23,11), '3.1', (0, 'Não iniciada'), 4, 'Ambientes acessíveis'),
   ('M2', 'Marco M2 · Ambiente contratado', 'Marco', 'AGE', 'AGE', D(23,11), D(23,11), '3.2', (0, 'Não iniciada'), 0, 'Projetos criados'),
   ('3.3', 'Entregar planilha base e tabela de checklists em uso', 'Tarefa', 'ASCOIN', 'AGE', D(18,11), D(25,11), '', (0, 'Não iniciada'), 8, 'Arquivos recebidos'),
   ('M3', 'Marco M3 · Planilha base recebida', 'Marco', 'ASCOIN', 'AGE', D(25,11), D(25,11), '3.3', (0, 'Não iniciada'), 0, 'Colunas mapeadas'),
   ('3.4', 'Lista de vinculadas e siglas das coordenadorias da DGAF', 'Tarefa', 'ASCOIN', 'AGE', D(18,11), D(25,11), '', (0, 'Não iniciada'), 2, 'Seed de áreas atualizado'),
   ('3.5', 'Brasão oficial e manual de identidade visual', 'Tarefa', 'AGE', 'AGE', D(18,11), D(25,11), '', (0, 'Não iniciada'), 2, 'Arquivos recebidos'),
   ('3.6', 'Levantar volume de demandas (por ano e abertas hoje)', 'Tarefa', 'ASCOIN', 'AGE', D(18,11), D(25,11), '', (0, 'Não iniciada'), 2, 'Números informados'),
   ('3.7', 'Definir os 10 usuários iniciais e seus perfis', 'Tarefa', 'ASCOIN e AGE', 'ASCOIN', D(24,11), D(27,11), '', (0, 'Não iniciada'), 2, 'Lista de usuários aprovada'),
 ]),
 ('4', 'Construção do MVP (10 dias úteis)', [
   ('4.1', 'Dia 1 · Estrutura, PWA, identidade visual, cadastros, trilha, exclusão lógica, login', 'Tarefa', 'Equipe técnica', 'AGE', D(23,11), D(23,11), 'M2', (0, 'Não iniciada'), 8, 'Login funcionando; trilha gravando; testes de RLS dos cadastros'),
   ('4.2', 'Dia 2 · Migrations do motor, tabelas da fase 2, testes de RLS', 'Tarefa', 'Equipe técnica', 'AGE', D(24,11), D(24,11), '4.1', (0, 'Não iniciada'), 8, 'Todos os perfis com acesso correto nos testes'),
   ('4.3', 'Dia 3 · Registro, distribuição (inclusive em lote) e analista', 'Tarefa', 'Equipe técnica', 'AGE', D(25,11), D(25,11), '4.2', (0, 'Não iniciada'), 8, 'Passos 1 e 2 em homologação'),
   ('4.4', 'Dia 4 · Atendimento pela área (ciência, encaminhamento, rascunho, validação, dúvidas, prorrogação)', 'Tarefa', 'Equipe técnica', 'AGE', D(26,11), D(26,11), '4.3', (0, 'Não iniciada'), 8, 'Passo 3 completo'),
   ('4.5', 'Dia 5 · Análise a encerramento; alertas e escalonamento', 'Tarefa', 'Equipe técnica', 'AGE', D(27,11), D(27,11), '4.4; 2.7', (0, 'Não iniciada'), 8, 'Ciclo de 9 etapas ponta a ponta'),
   ('4.6', 'Dia 6 · Painel com detalhamento, relatórios PDF e Excel, busca', 'Tarefa', 'Equipe técnica', 'AGE', D(30,11), D(30,11), '4.5', (0, 'Não iniciada'), 8, 'Indicadores conferidos com dados de teste'),
   ('4.7', 'Dia 7 · Checklists (processos, abertura automática, preenchimento, amostragem)', 'Tarefa', 'Equipe técnica', 'AGE', D(1,12), D(1,12), '4.6', (0, 'Não iniciada'), 8, 'Checklist de convênios completo'),
   ('4.8', 'Dia 8 · Parecer, assinatura sequencial, verificação pública, lixeira', 'Tarefa', 'Equipe técnica', 'AGE', D(2,12), D(2,12), '4.7', (0, 'Não iniciada'), 8, 'Assinatura com hash e código verificáveis'),
   ('4.9', 'Dia 9 · Importação da planilha base, configurações, manutenção essencial, resumo SEI', 'Tarefa', 'Equipe técnica', 'AGE', D(3,12), D(3,12), '4.8; M3', (0, 'Não iniciada'), 8, 'Histórico migrado e conferido'),
   ('4.10', 'Dia 10 · Testes finais, README, deploy de produção', 'Tarefa', 'Equipe técnica', 'AGE', D(4,12), D(4,12), '4.9', (0, 'Não iniciada'), 8, 'Pronto para aceite'),
 ]),
 ('5', 'Homologação e implantação', [
   ('5.1', 'Homologação pela ASCOIN (roteiro com dados reais)', 'Tarefa', 'ASCOIN', 'ASCOIN', D(3,12), D(4,12), '4.9', (0, 'Não iniciada'), 12, 'Checklist de homologação aprovado'),
   ('M4', 'Marco M4 · Homologação aprovada', 'Marco', 'ASCOIN', 'ASCOIN', D(4,12), D(4,12), '5.1', (0, 'Não iniciada'), 0, 'Termo de aceite'),
   ('5.2', 'Treinamento presencial (ASCOIN, pontos focais, gestores)', 'Tarefa', 'AGE', 'ASCOIN', D(7,12), D(7,12), 'M4', (0, 'Não iniciada'), 8, 'Lista de presença; guia rápido por perfil'),
   ('M5', 'Marco M5 · Go-live', 'Marco', 'Patrocinadores', 'Patrocinadores', D(7,12), D(7,12), '5.2', (0, 'Não iniciada'), 0, 'Sistema em produção'),
 ]),
 ('6', 'Operação assistida e encerramento do MVP', [
   ('6.1', 'Operação assistida e ajustes', 'Tarefa', 'Equipe técnica', 'AGE', D(8,12), D(6,1,2027), 'M5', (0, 'Não iniciada'), 40, 'Chamados atendidos; ajustes publicados'),
   ('6.2', 'Lições aprendidas e relatório de encerramento do MVP', 'Tarefa', 'AGE', 'Patrocinadores', D(4,1,2027), D(7,1,2027), '6.1', (0, 'Não iniciada'), 6, 'Relatório aprovado'),
   ('M6', 'Marco M6 · Avaliação pós-implantação', 'Marco', 'Patrocinadores', 'Patrocinadores', D(7,1,2027), D(7,1,2027), '6.2', (0, 'Não iniciada'), 0, 'Indicadores do mês e lições aprendidas'),
   ('6.3', 'Planejamento da fase 1.5', 'Tarefa', 'AGE', 'Patrocinadores', D(4,1,2027), D(8,1,2027), '6.2', (0, 'Não iniciada'), 8, 'Backlog da fase 1.5 priorizado'),
 ]),
]
reais = {  # início e término reais das tarefas concluídas
 '1.1': (D(13,11), D(13,11)), '1.2': (D(13,11), D(13,11)), '1.3': (D(13,11), D(13,11)), '1.4': (D(17,11), D(17,11)),
 '2.1': (D(13,11), D(13,11)), '2.2': (D(16,11), D(16,11)), '2.3': (D(16,11), D(16,11)), '2.4': (D(16,11), D(17,11)), '2.5': (D(16,11), D(16,11)),
}
GANTT_INI = D(13, 11); NDIAS = 57
G0 = NC + 2  # primeira coluna do Gantt (deixa uma coluna de respiro)
r = H0 + 1
linhas_fase = []
for fid, fnome, tarefas in fases:
    rf = r; r += 1
    ini, fim = r, r + len(tarefas) - 1
    linhas_fase.append((fid, fnome, rf, ini, fim))
    # linha da fase
    vals = {
        'id': fid, 'atv': fnome, 'tipo': 'Fase', 'resp': '', 'aprova': '',
        'ib': f'=MIN({C_["ib"]}{ini}:{C_["ib"]}{fim})', 'tb': f'=MAX({C_["tb"]}{ini}:{C_["tb"]}{fim})',
        'ip': f'=MIN({C_["ip"]}{ini}:{C_["ip"]}{fim})', 'tp': f'=MAX({C_["tp"]}{ini}:{C_["tp"]}{fim})',
        'pct': f'=IFERROR(SUMPRODUCT({C_["h"]}{ini}:{C_["h"]}{fim},{C_["pct"]}{ini}:{C_["pct"]}{fim})/SUM({C_["h"]}{ini}:{C_["h"]}{fim}),0)',
        'st': f'=IF({C_["pct"]}{rf}>=1,"Concluída",IF({C_["pct"]}{rf}>0,"Em andamento","Não iniciada"))',
        'h': f'=SUM({C_["h"]}{ini}:{C_["h"]}{fim})', 'pplan': f'=IFERROR({C_["vp"]}{rf}/{C_["h"]}{rf},0)',
        'vp': f'=SUM({C_["vp"]}{ini}:{C_["vp"]}{fim})', 'va': f'=SUM({C_["va"]}{ini}:{C_["va"]}{fim})',
    }
    for k, col in C_.items():
        cel = cr[f'{col}{rf}']
        cel.value = vals.get(k, '')
        cel.font = Font(name=F, size=10, bold=True, color=AZUL); cel.fill = fill('DCE6F2'); cel.border = borda
        cel.alignment = Alignment(vertical='center', wrap_text=True, horizontal='left')
    for t in tarefas:
        tid, atv, tipo, resp, apr, i0, t0, pred, (pc, st), horas, ent = t
        ir, tr = reais.get(tid, (None, None))
        row = {'id': tid, 'atv': atv, 'tipo': tipo, 'resp': resp, 'aprova': apr, 'ib': i0, 'tb': t0, 'ip': i0, 'tp': t0, 'pred': pred, 'ir': ir, 'tr': tr, 'pct': pc, 'st': st, 'h': horas, 'ent': ent, 'obs': ''}
        entradas = {'resp', 'aprova', 'ip', 'tp', 'pred', 'ir', 'tr', 'pct', 'st', 'h', 'obs'}
        for k, col in C_.items():
            if k in row:
                cel = cr[f'{col}{r}']; cel.value = row[k]
                cel.font = Font(name=F, size=10, color='0000FF' if k in entradas else '000000', bold=(tipo == 'Marco' and k == 'atv'))
                cel.border = borda; cel.alignment = Alignment(vertical='center', wrap_text=True)
                if k in entradas: cel.fill = ENTRADA
        r += 1
    # fórmulas comuns (fase e tarefas)
for (fid, fnome, rf, ini, fim) in linhas_fase:
    for rr in [rf] + list(range(ini, fim + 1)):
        c = C_
        cr[f'{c["dur"]}{rr}'] = f'=IF({c["tipo"]}{rr}="Marco",0,NETWORKDAYS({c["ip"]}{rr},{c["tp"]}{rr},Feriados))'
        cr[f'{c["sit"]}{rr}'] = (f'=IF({c["st"]}{rr}="Cancelada","Cancelada",IF({c["pct"]}{rr}>=1,"Concluída",IF({c["tp"]}{rr}<DataStatus,"Atrasada",'
                                 f'IF({c["st"]}{rr}="Bloqueada","Bloqueada",IF(AND({c["ip"]}{rr}<=DataStatus,{c["pct"]}{rr}=0),"Em risco",IF({c["pct"]}{rr}>0,"Em andamento","A iniciar"))))))')
        cr[f'{c["var"]}{rr}'] = f'=IF({c["tp"]}{rr}>={c["tb"]}{rr},NETWORKDAYS({c["tb"]}{rr},{c["tp"]}{rr},Feriados)-1,1-NETWORKDAYS({c["tp"]}{rr},{c["tb"]}{rr},Feriados))'
        if rr != rf:
            cr[f'{c["pplan"]}{rr}'] = f'=IF(DataStatus<{c["ip"]}{rr},0,IF(DataStatus>={c["tp"]}{rr},1,IF({c["dur"]}{rr}=0,1,MIN(1,NETWORKDAYS({c["ip"]}{rr},DataStatus,Feriados)/{c["dur"]}{rr}))))'
            cr[f'{c["vp"]}{rr}'] = f'=IF({c["tipo"]}{rr}="Tarefa",{c["h"]}{rr}*{c["pplan"]}{rr},0)'
            cr[f'{c["va"]}{rr}'] = f'=IF({c["tipo"]}{rr}="Tarefa",{c["h"]}{rr}*{c["pct"]}{rr},0)'
        for k in ['dur', 'sit', 'var', 'pplan', 'vp', 'va']:
            cel = cr[f'{c[k]}{rr}']
            cel.border = borda; cel.alignment = Alignment(horizontal='center', vertical='center')
            cel.font = Font(name=F, size=10, bold=(rr == rf), color=AZUL if rr == rf else '000000')
            if rr == rf: cel.fill = fill('DCE6F2')
ULT = r - 1
# formatos
for rr in range(H0 + 1, ULT + 1):
    for k in ['ib', 'tb', 'ip', 'tp', 'ir', 'tr']: cr[f'{C_[k]}{rr}'].number_format = DATA
    for k in ['pct', 'pplan']: cr[f'{C_[k]}{rr}'].number_format = PCT
    for k in ['vp', 'va', 'h']: cr[f'{C_[k]}{rr}'].number_format = '0.0'
    for k in ['dur', 'var']: cr[f'{C_[k]}{rr}'].number_format = '0;-0;0'
    for k in ['id', 'tipo', 'ib', 'tb', 'ip', 'tp', 'ir', 'tr', 'pct', 'pred', 'st', 'h']: cr[f'{C_[k]}{rr}'].alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    cr.row_dimensions[rr].height = 30
# validações
lista_dv(cr, f'{C_["st"]}{H0+1}:{C_["st"]}{ULT}', 'ListaStatus')
lista_dv(cr, f'{C_["tipo"]}{H0+1}:{C_["tipo"]}{ULT}', 'ListaTipo')
lista_dv(cr, f'{C_["resp"]}{H0+1}:{C_["aprova"]}{ULT}', 'ListaResp')
dvp = DataValidation(type='decimal', operator='between', formula1='0', formula2='1', showErrorMessage=True, errorTitle='% inválido', error='Informe um percentual entre 0% e 100%.')
cr.add_data_validation(dvp); dvp.add(f'{C_["pct"]}{H0+1}:{C_["pct"]}{ULT}')
# situação colorida
sitc = f'{C_["sit"]}{H0+1}:{C_["sit"]}{ULT}'
for txt, cor, fc in [('Atrasada', 'F8D7DA', '9B1C1C'), ('Em risco', 'FCE8C3', '8A5A00'), ('Bloqueada', 'F8D7DA', '9B1C1C'), ('Concluída', 'D7F0E0', '1D6B3E'), ('Em andamento', 'DCE9FB', '134A8F')]:
    cr.conditional_formatting.add(sitc, FormulaRule(formula=[f'{C_["sit"]}{H0+1}="{txt}"'], fill=fill(cor), font=Font(name=F, color=fc, bold=True)))
cr.conditional_formatting.add(f'{C_["pct"]}{H0+1}:{C_["pct"]}{ULT}', DataBarRule(start_type='num', start_value=0, end_type='num', end_value=1, color='5B9BD5'))
cr.conditional_formatting.add(f'{C_["var"]}{H0+1}:{C_["var"]}{ULT}', CellIsRule(operator='greaterThan', formula=['0'], font=Font(name=F, color='C00000', bold=True)))
# Gantt
for j in range(NDIAS):
    col = L(G0 + j)
    cr.column_dimensions[col].width = 3.2
    h = cr[f'{col}{H0}']
    h.value = '=InicioGantt' if j == 0 else f'={L(G0 + j - 1)}{H0}+1'
    h.number_format = 'dd'; h.font = Font(name=F, size=8, bold=True, color='FFFFFF'); h.fill = fill(AZUL)
    h.alignment = Alignment(horizontal='center', vertical='center', text_rotation=90); h.border = borda
    m = cr[f'{col}{H0-1}']
    m.value = f'={col}{H0}' if j == 0 else f'=IF(DAY({col}{H0})=1,{col}{H0},"")'
    m.number_format = 'mmm/yy'; m.font = Font(name=F, size=9, bold=True, color=AZUL)
    for rr in range(H0 + 1, ULT + 1):
        cr[f'{col}{rr}'].border = Border(left=Side(style='hair', color='E3E8EF'), right=Side(style='hair', color='E3E8EF'), top=fino, bottom=fino)
cr.column_dimensions[L(NC + 1)].width = 1.5
gfaixa = f'{L(G0)}{H0+1}:{L(G0+NDIAS-1)}{ULT}'
g, rr0 = L(G0), H0 + 1
regras = [
    (f'AND(${C_["tipo"]}{rr0}="Marco",{g}${H0}=${C_["tp"]}{rr0})', OURO),
    (f'{g}${H0}=DataStatus', 'C8102E'),
    (f'AND(${C_["tipo"]}{rr0}="Fase",{g}${H0}>=${C_["ip"]}{rr0},{g}${H0}<=${C_["tp"]}{rr0})', AZUL),
    (f'AND(${C_["tipo"]}{rr0}="Tarefa",{g}${H0}>=${C_["ip"]}{rr0},{g}${H0}<=${C_["ip"]}{rr0}+(${C_["tp"]}{rr0}-${C_["ip"]}{rr0}+1)*${C_["pct"]}{rr0}-1)', '2E7D4F'),
    (f'AND(${C_["tipo"]}{rr0}="Tarefa",{g}${H0}>=${C_["ip"]}{rr0},{g}${H0}<=${C_["tp"]}{rr0})', '8DB4E2'),
    (f'OR(WEEKDAY({g}${H0},2)>5,COUNTIF(Feriados,{g}${H0})>0)', 'EEF1F5'),
]
for f_, cor in regras:
    cr.conditional_formatting.add(gfaixa, FormulaRule(formula=[f_], fill=fill(cor), stopIfTrue=True))
cr.freeze_panes = f'C{H0+1}'
cr.auto_filter.ref = f'A{H0}:{L(NC)}{ULT}'
# legenda do Gantt
leg = ULT + 2
cr[f'B{leg}'] = 'Legenda do Gantt:'; cr[f'B{leg}'].font = Font(name=F, bold=True, size=10)
for i, (txt, cor) in enumerate([('Fase', AZUL), ('Previsto', '8DB4E2'), ('Realizado (% concluído)', '2E7D4F'), ('Marco', OURO), ('Data de status', 'C8102E'), ('Fim de semana ou feriado', 'EEF1F5')]):
    cc = cr.cell(row=leg + 1 + i, column=2, value=txt); cc.font = Font(name=F, size=10)
    cc2 = cr.cell(row=leg + 1 + i, column=3); cc2.fill = fill(cor); cc2.border = borda
cr.sheet_view.zoomScale = 90
cr.page_setup.orientation = 'landscape'; cr.page_setup.fitToWidth = 1; cr.page_setup.fitToHeight = 0
cr.sheet_properties.pageSetUpPr.fitToPage = True
cr.print_title_rows = f'{H0}:{H0}'
CRF = f"'Cronograma'!"
rng = lambda k: f"{CRF}${C_[k]}${H0+1}:${C_[k]}${ULT}"

# =====================================================================
# MARCOS
# =====================================================================
ma = aba('Marcos', OURO)
titulo(ma, 'Marcos do projeto', 'Datas previstas vêm do Cronograma. Preencha a data real quando o marco for atingido.', 9)
cabecalho(ma, 4, ['Marco', 'Descrição', 'Data (linha de base)', 'Data prevista', 'Data real', 'Variação (dias úteis)', 'Situação', 'Responsável', 'Critério de atingimento'], [8, 40, 14, 14, 14, 12, 16, 16, 44])
marcos = [('M1', 'Documento de projeto aprovado', 'Patrocinadores', 'Assinaturas da seção de aprovações do documento de projeto'),
          ('M2', 'Ambiente contratado (Supabase Pro e Vercel)', 'AGE', 'Projetos de homologação e produção criados'),
          ('M3', 'Planilha base recebida', 'ASCOIN', 'Arquivo entregue e colunas mapeadas'),
          ('M4', 'Homologação aprovada', 'ASCOIN', 'Checklist de homologação aprovado e termo de aceite'),
          ('M5', 'Treinamento presencial e go-live', 'Patrocinadores', 'Usuários treinados e sistema em produção'),
          ('M6', 'Avaliação pós-implantação', 'Patrocinadores', 'Indicadores do mês e lições aprendidas')]
for i, (mid, desc, resp, crit) in enumerate(marcos):
    rr = 5 + i
    celula(ma, rr, 1, mid, negrito=True, alin='center'); celula(ma, rr, 2, desc)
    celula(ma, rr, 3, f'=INDEX({rng("tb")},MATCH(A{rr},{rng("id")},0))', DATA, cor='008000', alin='center')
    celula(ma, rr, 4, f'=INDEX({rng("tp")},MATCH(A{rr},{rng("id")},0))', DATA, cor='008000', alin='center')
    celula(ma, rr, 5, None, DATA, entrada=True, alin='center')
    celula(ma, rr, 6, f'=IF(E{rr}="",IF(D{rr}>=C{rr},NETWORKDAYS(C{rr},D{rr},Feriados)-1,1-NETWORKDAYS(D{rr},C{rr},Feriados)),IF(E{rr}>=C{rr},NETWORKDAYS(C{rr},E{rr},Feriados)-1,1-NETWORKDAYS(E{rr},C{rr},Feriados)))', '0;-0;0', alin='center')
    celula(ma, rr, 7, f'=IF(E{rr}<>"","Atingido",IF(D{rr}<DataStatus,"Atrasado",IF(D{rr}-DataStatus<=5,"Próximo","Previsto")))', alin='center')
    celula(ma, rr, 8, resp, entrada=True); celula(ma, rr, 9, crit)
    ma.row_dimensions[rr].height = 30
for txt, cor, fc in [('Atrasado', 'F8D7DA', '9B1C1C'), ('Próximo', 'FCE8C3', '8A5A00'), ('Atingido', 'D7F0E0', '1D6B3E')]:
    ma.conditional_formatting.add('G5:G10', FormulaRule(formula=[f'G5="{txt}"'], fill=fill(cor), font=Font(name=F, color=fc, bold=True)))
ma.freeze_panes = 'A5'

# =====================================================================
# ENTREGAS (dias da construção do MVP)
# =====================================================================
en = aba('Entregas', AZUL2)
titulo(en, 'Entregas do MVP e aceite', 'Uma linha por dia de construção. Data, % e situação vêm do Cronograma; aceite é preenchido pela ASCOIN.', 11)
cabecalho(en, 4, ['Dia', 'ID EAP', 'Data prevista', 'Entrega', 'Histórias', 'Critério de pronto', '% concluído', 'Situação', 'Aceite (Sim/Não)', 'Data do aceite', 'Aceito por'], [6, 8, 13, 46, 16, 36, 11, 15, 11, 13, 18])
hist_dia = {1: 'US24, US26', 2: '—', 3: 'US01 a US03', 4: 'US04 a US09', 5: 'US10 a US14', 6: 'US16 a US18', 7: 'US19, US20', 8: 'US21 a US23, US25', 9: 'US15, US27', 10: '—'}
for d in range(1, 11):
    rr = 4 + d; tid = f'4.{d}'
    celula(en, rr, 1, d, alin='center'); celula(en, rr, 2, tid, alin='center')
    celula(en, rr, 3, f'=INDEX({rng("tp")},MATCH(B{rr},{rng("id")},0))', DATA, cor='008000', alin='center')
    celula(en, rr, 4, f'=INDEX({rng("atv")},MATCH(B{rr},{rng("id")},0))', cor='008000')
    celula(en, rr, 5, hist_dia[d], alin='center')
    celula(en, rr, 6, f'=INDEX({rng("ent")},MATCH(B{rr},{rng("id")},0))', cor='008000')
    celula(en, rr, 7, f'=INDEX({rng("pct")},MATCH(B{rr},{rng("id")},0))', PCT, cor='008000', alin='center')
    celula(en, rr, 8, f'=INDEX({rng("sit")},MATCH(B{rr},{rng("id")},0))', cor='008000', alin='center')
    celula(en, rr, 9, None, entrada=True, alin='center'); celula(en, rr, 10, None, DATA, entrada=True, alin='center'); celula(en, rr, 11, None, entrada=True)
    en.row_dimensions[rr].height = 36
lista_dv(en, 'I5:I14', 'ListaSimNao')
en.conditional_formatting.add('I5:I14', FormulaRule(formula=['I5="Sim"'], fill=fill('D7F0E0'), font=Font(name=F, color='1D6B3E', bold=True)))
en.conditional_formatting.add('I5:I14', FormulaRule(formula=['I5="Não"'], fill=fill('F8D7DA'), font=Font(name=F, color='9B1C1C', bold=True)))
celula(en, 16, 4, 'Entregas aceitas', negrito=True); celula(en, 16, 7, '=COUNTIF(I5:I14,"Sim")', alin='center', negrito=True)
celula(en, 17, 4, '% de entregas aceitas', negrito=True); celula(en, 17, 7, '=COUNTIF(I5:I14,"Sim")/COUNTA(B5:B14)', PCT, alin='center', negrito=True)
en.freeze_panes = 'A5'

# =====================================================================
# BACKLOG
# =====================================================================
bk = aba('Backlog', '2E7D4F')
titulo(bk, 'Backlog do produto (histórias de usuário do MVP)', 'Pontos na escala de Fibonacci. Preencha o status e a data de conclusão de cada história; o Burndown usa a data de conclusão.', 9)
cabecalho(bk, 4, ['ID', 'Épico', 'História (resumo)', 'Pontos', 'Prioridade', 'Dia previsto', 'Status', 'Data de conclusão', 'Observações'], [7, 24, 60, 8, 16, 10, 14, 14, 30])
H = [('US01', 'E1 · Demandas externas', 'Registrar demanda com tema, analista e aviso de reincidência', 3, 3),
     ('US02', 'E1 · Demandas externas', 'Distribuir itens às áreas (um a um ou em lote)', 5, 3),
     ('US03', 'E1 · Demandas externas', 'Trocar o analista da demanda (Assessora)', 2, 3),
     ('US04', 'E1 · Demandas externas', 'Confirmar recebimento indicando o responsável na área', 2, 4),
     ('US05', 'E1 · Demandas externas', 'Encaminhar item para subárea sem mudar o prazo', 3, 4),
     ('US06', 'E1 · Demandas externas', 'Responder com rascunho automático e evidência obrigatória', 5, 4),
     ('US07', 'E1 · Demandas externas', 'Validação da chefia, habilitada por área', 3, 4),
     ('US08', 'E1 · Demandas externas', 'Enviar dúvida à ASCOIN no item', 2, 4),
     ('US09', 'E1 · Demandas externas', 'Pedir e decidir prorrogação', 3, 4),
     ('US10', 'E1 · Demandas externas', 'Aceitar ou devolver a resposta', 3, 5),
     ('US11', 'E1 · Demandas externas', 'Ciência da CHEGAB na resposta consolidada', 2, 5),
     ('US12', 'E1 · Demandas externas', 'Registrar envio, monitorar e encerrar', 3, 5),
     ('US13', 'E2 · Alertas e comunicação', 'Alertas D-5, D-2, vencimento e atraso; escalonamento', 3, 5),
     ('US14', 'E2 · Alertas e comunicação', 'Lembrete de ciência e aviso à chefia', 2, 5),
     ('US15', 'E2 · Alertas e comunicação', 'Resumo diário por área para o SEI', 2, 9),
     ('US16', 'E3 · Gestão e informação', 'Painel com indicadores e detalhamento ao clicar', 5, 6),
     ('US17', 'E3 · Gestão e informação', 'Relatórios com filtros e exportação PDF e Excel', 3, 6),
     ('US18', 'E3 · Gestão e informação', 'Busca global por número, SEI ou código', 2, 6),
     ('US19', 'E4 · Checklists e pareceres', 'Checklist abre ao cadastrar o processo', 3, 7),
     ('US20', 'E4 · Checklists e pareceres', 'Preencher com anexos e itens condicionais', 5, 7),
     ('US21', 'E4 · Checklists e pareceres', 'Gerar parecer e escolher os responsáveis', 5, 8),
     ('US22', 'E4 · Checklists e pareceres', 'Assinar na vez ou recusar com motivo', 5, 8),
     ('US23', 'E4 · Checklists e pareceres', 'Conferir autenticidade na página pública', 2, 8),
     ('US24', 'E5 · Governança e administração', 'Trilha de auditoria legível com filtros', 3, 1),
     ('US25', 'E5 · Governança e administração', 'Restaurar exclusões em até 30 dias', 2, 8),
     ('US26', 'E5 · Governança e administração', 'Criar usuários com senha provisória', 2, 1),
     ('US27', 'E5 · Governança e administração', 'Acompanhar rotinas e backups', 3, 9)]
prio = {'US05': 'S — Importante', 'US07': 'S — Importante', 'US08': 'S — Importante', 'US15': 'S — Importante', 'US18': 'S — Importante', 'US27': 'S — Importante'}
for i, (uid, ep, hs, pt, dia) in enumerate(H):
    rr = 5 + i
    celula(bk, rr, 1, uid, alin='center'); celula(bk, rr, 2, ep); celula(bk, rr, 3, hs)
    celula(bk, rr, 4, pt, entrada=True, alin='center'); celula(bk, rr, 5, prio.get(uid, 'M — Obrigatório'), entrada=True)
    celula(bk, rr, 6, dia, entrada=True, alin='center'); celula(bk, rr, 7, 'Não iniciada', entrada=True, alin='center')
    celula(bk, rr, 8, None, DATA, entrada=True, alin='center'); celula(bk, rr, 9, None, entrada=True)
BU = 4 + len(H)
lista_dv(bk, f'G5:G{BU}', 'ListaStatus'); lista_dv(bk, f'E5:E{BU}', 'ListaPrioridade')
bk.conditional_formatting.add(f'G5:G{BU}', FormulaRule(formula=['G5="Concluída"'], fill=fill('D7F0E0'), font=Font(name=F, color='1D6B3E', bold=True)))
bk.conditional_formatting.add(f'G5:G{BU}', FormulaRule(formula=['G5="Em andamento"'], fill=fill('DCE9FB'), font=Font(name=F, color='134A8F', bold=True)))
bk.conditional_formatting.add(f'H5:H{BU}', FormulaRule(formula=['AND(G5="Concluída",H5="")'], fill=fill('FCE8C3')))
celula(bk, BU + 2, 3, 'Total de pontos do MVP', negrito=True); celula(bk, BU + 2, 4, f'=SUM(D5:D{BU})', negrito=True, alin='center')
celula(bk, BU + 3, 3, 'Pontos concluídos', negrito=True); celula(bk, BU + 3, 4, f'=SUMIFS(D5:D{BU},G5:G{BU},"Concluída")', negrito=True, alin='center')
celula(bk, BU + 4, 3, '% do backlog concluído', negrito=True); celula(bk, BU + 4, 4, f'=IFERROR(D{BU+3}/D{BU+2},0)', PCT, negrito=True, alin='center')
celula(bk, BU + 5, 3, 'Atenção: história concluída sem data de conclusão aparece em laranja; o Burndown precisa da data.', cor=CINZA)
bk.freeze_panes = 'A5'; bk.auto_filter.ref = f'A4:I{BU}'
TOTPTS = f"'Backlog'!$D${BU+2}"

# =====================================================================
# BURNDOWN
# =====================================================================
bd = aba('Burndown', '2E7D4F')
titulo(bd, 'Burndown da construção do MVP', 'Pontos restantes por dia. Ideal e planejado são calculados; o real calculado usa as datas de conclusão do Backlog.', 6)
cabecalho(bd, 4, ['Dia', 'Data', 'Ideal (linear)', 'Planejado (pelo dia previsto)', 'Real (pelo Backlog)', 'Real informado (opcional)'], [8, 13, 14, 18, 16, 18])
for dd in range(0, 11):
    rr = 5 + dd
    celula(bd, rr, 1, dd, alin='center')
    if dd == 0:
        celula(bd, rr, 2, f'=INDEX({rng("ip")},MATCH("4.1",{rng("id")},0))-1', DATA, cor='008000', alin='center')
    else:
        celula(bd, rr, 2, f'=INDEX({rng("tp")},MATCH("4.{dd}",{rng("id")},0))', DATA, cor='008000', alin='center')
    celula(bd, rr, 3, f'={TOTPTS}*(1-A{rr}/10)', '0.0', alin='center')
    celula(bd, rr, 4, f"={TOTPTS}-SUMIFS('Backlog'!$D$5:$D${BU},'Backlog'!$F$5:$F${BU},\"<=\"&A{rr})", '0', alin='center')
    celula(bd, rr, 5, f"=IF(B{rr}>DataStatus,\"\",{TOTPTS}-SUMIFS('Backlog'!$D$5:$D${BU},'Backlog'!$H$5:$H${BU},\"<=\"&B{rr}))", '0', alin='center')
    celula(bd, rr, 6, None, '0', entrada=True, alin='center')
celula(bd, 17, 1, 'O real só aparece para dias até a data de status. A coluna F aceita o valor medido na reunião diária, se preferirem informar à mão; é ela que aparece no gráfico como “Real”.', cor=CINZA, wrap=False)
ch = LineChart(); ch.title = 'Burndown do MVP (pontos restantes)'; ch.height = 9; ch.width = 20
ch.y_axis.title = 'Pontos'; ch.x_axis.title = 'Dia de construção'
data = Reference(bd, min_col=3, max_col=4, min_row=4, max_row=15); ch.add_data(data, titles_from_data=True)
data2 = Reference(bd, min_col=6, max_col=6, min_row=4, max_row=15); ch.add_data(data2, titles_from_data=True)
ch.set_categories(Reference(bd, min_col=1, min_row=5, max_row=15))
ch.series[0].graphicalProperties.line.dashStyle = 'dash'; ch.series[0].graphicalProperties.line.solidFill = '8A96A8'
ch.series[1].graphicalProperties.line.solidFill = '1858A8'; ch.series[2].graphicalProperties.line.solidFill = 'C8102E'
ch.roundedCorners = False; ch.legend.position = 'b'; ch.legend.overlay = False
ch.title.overlay = False; ch.x_axis.title.overlay = False; ch.y_axis.title.overlay = False
ch.x_axis.delete = False; ch.y_axis.delete = False
bd.add_chart(ch, 'H4')

# =====================================================================
# RISCOS
# =====================================================================
ri = aba('Riscos', 'C8102E')
titulo(ri, 'Registro de riscos', 'Probabilidade e impacto de 1 a 5. Exposição = P × I. Nível: Alto ≥ 15, Médio ≥ 8, Baixo < 8. Revise toda semana.', 13)
cabecalho(ri, 4, ['ID', 'Risco', 'Categoria', 'Probabilidade (1-5)', 'Impacto (1-5)', 'Exposição', 'Nível', 'Estratégia', 'Plano de resposta', 'Gatilho', 'Dono', 'Status', 'Última revisão'], [6, 38, 14, 12, 11, 10, 10, 12, 44, 30, 14, 16, 13])
R = [('R01', 'Escopo do protótipo maior que o prazo de 10 dias', 'Escopo', 4, 4, 'Mitigar', 'Congelar o MVP (documento, seção 4.1); itens da fase 1.5 e da fase 2 só após o go-live', 'Pedido de nova funcionalidade antes do go-live', 'AGE'),
     ('R02', 'Planilha base atrasar ou exigir saneamento', 'Dados', 4, 4, 'Mitigar', 'Cobrar até 25/11; prever dia de saneamento; migração em duas cargas', 'Planilha não entregue até 25/11', 'ASCOIN'),
     ('R03', 'Baixa adesão das áreas sem e-mail', 'Adoção', 3, 4, 'Mitigar', 'Resumo diário pelo SEI; treinamento; lembretes de ciência', 'Itens sem ciência acima de 20%', 'ASCOIN'),
     ('R04', 'Falha de regra de acesso (RLS)', 'Segurança', 2, 5, 'Mitigar', 'Testes de RLS por perfil a cada entrega; revisão de segurança', 'Teste de RLS reprovado', 'Equipe técnica'),
     ('R05', 'Indisponibilidade por uso do plano gratuito', 'Infraestrutura', 3, 4, 'Evitar', 'Contratar o plano Pro antes do go-live', 'Plano Pro não contratado até 23/11', 'AGE'),
     ('R06', 'Mudanças frequentes de escopo', 'Escopo', 4, 3, 'Mitigar', 'Controle de mudanças (aba Mudanças)', 'Mais de 2 mudanças por semana', 'AGE'),
     ('R07', 'Equipe da ASCOIN indisponível para homologar', 'Pessoas', 3, 3, 'Mitigar', 'Agendar homologação com antecedência; roteiro curto', 'Agenda não confirmada até 27/11', 'ASCOIN'),
     ('R08', 'Dependência do Supabase na migração ao PRODERJ', 'Tecnologia', 3, 3, 'Mitigar', 'SQL padrão, migrations versionadas, exportação de dump', 'Definição de prazo de migração pelo PRODERJ', 'Equipe técnica'),
     ('R09', 'Status e passos 4 a 9 alterados após a construção', 'Escopo', 3, 3, 'Mitigar', 'Validar antes do dia 5; status em tabela configurável', 'Validação não concluída até 24/11', 'ASCOIN'),
     ('R10', 'Identidade visual oficial não recebida', 'Comunicação', 3, 2, 'Aceitar', 'Usar espaço reservado; trocar sem impacto no código', 'Brasão não recebido até o go-live', 'AGE')]
for i, (rid, txt, cat, p, im, est, plano, gat, dono) in enumerate(R):
    rr = 5 + i
    celula(ri, rr, 1, rid, alin='center'); celula(ri, rr, 2, txt); celula(ri, rr, 3, cat, entrada=True)
    celula(ri, rr, 4, p, entrada=True, alin='center'); celula(ri, rr, 5, im, entrada=True, alin='center')
    celula(ri, rr, 6, f'=D{rr}*E{rr}', alin='center'); celula(ri, rr, 7, f'=IF(F{rr}>=15,"Alto",IF(F{rr}>=8,"Médio","Baixo"))', alin='center')
    celula(ri, rr, 8, est, entrada=True, alin='center'); celula(ri, rr, 9, plano, entrada=True); celula(ri, rr, 10, gat, entrada=True)
    celula(ri, rr, 11, dono, entrada=True); celula(ri, rr, 12, 'Ativo', entrada=True, alin='center'); celula(ri, rr, 13, D(17, 11), DATA, entrada=True, alin='center')
    ri.row_dimensions[rr].height = 34
RU = 4 + len(R) + 5  # linhas extras para novos riscos
for rr in range(5 + len(R), RU + 1):
    celula(ri, rr, 1, None, alin='center')
    for cc in [2, 3, 4, 5, 8, 9, 10, 11, 12, 13]: celula(ri, rr, cc, None, DATA if cc == 13 else None, entrada=True)
    celula(ri, rr, 6, f'=IF(OR(D{rr}="",E{rr}=""),"",D{rr}*E{rr})', alin='center')
    celula(ri, rr, 7, f'=IF(F{rr}="","",IF(F{rr}>=15,"Alto",IF(F{rr}>=8,"Médio","Baixo")))', alin='center')
lista_dv(ri, f'D5:E{RU}', 'ListaEscala'); lista_dv(ri, f'H5:H{RU}', 'ListaEstrategia'); lista_dv(ri, f'L5:L{RU}', 'ListaStatusRisco')
for txt, cor, fc in [('Alto', 'F8D7DA', '9B1C1C'), ('Médio', 'FCE8C3', '8A5A00'), ('Baixo', 'D7F0E0', '1D6B3E')]:
    ri.conditional_formatting.add(f'G5:G{RU}', FormulaRule(formula=[f'G5="{txt}"'], fill=fill(cor), font=Font(name=F, color=fc, bold=True)))
# matriz de calor
celula(ri, RU + 2, 2, 'Matriz de calor (quantidade de riscos ativos por probabilidade × impacto)', negrito=True, wrap=False)
mr = RU + 3
celula(ri, mr, 3, 'P \\ I', negrito=True, alin='center')
for i in range(1, 6): celula(ri, mr, 3 + i, i, negrito=True, alin='center')
for pp in range(5, 0, -1):
    rr = mr + (6 - pp)
    celula(ri, rr, 3, pp, negrito=True, alin='center')
    for i in range(1, 6):
        celula(ri, rr, 3 + i, f'=COUNTIFS($D$5:$D${RU},{pp},$E$5:$E${RU},{i},$L$5:$L${RU},"<>Encerrado")', '0;-0;""', alin='center')
        cor = 'F4B6B6' if pp * i >= 15 else 'FBE3B5' if pp * i >= 8 else 'CDEBD7'
        ri.cell(row=rr, column=3 + i).fill = fill(cor)
ri.freeze_panes = 'C5'; ri.auto_filter.ref = f'A4:M{RU}'

# =====================================================================
# PENDÊNCIAS
# =====================================================================
pe = aba('Pendências', 'D97706')
titulo(pe, 'Pendências e ações', 'Itens que dependem de alguém para o projeto andar. Dias de atraso e situação são calculados pela data de status.', 9)
cabecalho(pe, 4, ['ID', 'Pendência', 'Responsável', 'Aberta em', 'Prazo', 'Status', 'Dias de atraso', 'Situação', 'Observações'], [6, 52, 16, 12, 12, 14, 10, 13, 34])
PD = [('P01', 'Enviar a planilha base e a tabela de checklists em uso', 'ASCOIN', D(13,11), D(25,11)),
      ('P02', 'Validar os passos 4 a 9 do fluxo', 'ASCOIN e AGE', D(17,11), D(24,11)),
      ('P03', 'Validar o conjunto final de status', 'ASCOIN', D(13,11), D(24,11)),
      ('P04', 'Enviar a lista completa de vinculadas e as siglas das coordenadorias da DGAF', 'ASCOIN', D(13,11), D(25,11)),
      ('P05', 'Confirmar a página pública de verificação', 'ASCOIN', D(17,11), D(19,11)),
      ('P06', 'Fornecer brasão oficial e manual de identidade visual', 'AGE', D(13,11), D(25,11)),
      ('P07', 'Levantar volume de demandas por ano e abertas hoje', 'ASCOIN', D(13,11), D(25,11)),
      ('P08', 'Contratar o plano Pro do Supabase e criar os projetos', 'AGE', D(17,11), D(23,11)),
      ('P09', 'Definir os 10 usuários iniciais e seus perfis', 'ASCOIN e AGE', D(17,11), D(27,11)),
      ('P10', 'Decidir sobre SMTP institucional para e-mail', 'AGE', D(13,11), D(7,12))]
for i, (pid, txt, resp, ab, pz) in enumerate(PD):
    rr = 5 + i
    celula(pe, rr, 1, pid, alin='center'); celula(pe, rr, 2, txt); celula(pe, rr, 3, resp, entrada=True)
    celula(pe, rr, 4, ab, DATA, entrada=True, alin='center'); celula(pe, rr, 5, pz, DATA, entrada=True, alin='center')
    celula(pe, rr, 6, 'Aberta', entrada=True, alin='center')
    celula(pe, rr, 7, f'=IF(OR(F{rr}="Concluída",F{rr}="Cancelada"),0,MAX(0,DataStatus-E{rr}))', '0', alin='center')
    celula(pe, rr, 8, f'=IF(F{rr}="Concluída","Concluída",IF(F{rr}="Cancelada","Cancelada",IF(E{rr}<DataStatus,"Vencida",IF(E{rr}-DataStatus<=3,"Vence em breve","No prazo"))))', alin='center')
    celula(pe, rr, 9, None, entrada=True)
PU = 4 + len(PD) + 5
for rr in range(5 + len(PD), PU + 1):
    celula(pe, rr, 1, None)
    for cc in [2, 3, 4, 5, 6, 9]: celula(pe, rr, cc, None, DATA if cc in (4, 5) else None, entrada=True)
    celula(pe, rr, 7, f'=IF(E{rr}="","",IF(OR(F{rr}="Concluída",F{rr}="Cancelada"),0,MAX(0,DataStatus-E{rr})))', '0', alin='center')
    celula(pe, rr, 8, f'=IF(E{rr}="","",IF(F{rr}="Concluída","Concluída",IF(F{rr}="Cancelada","Cancelada",IF(E{rr}<DataStatus,"Vencida",IF(E{rr}-DataStatus<=3,"Vence em breve","No prazo")))))', alin='center')
lista_dv(pe, f'F5:F{PU}', 'ListaStatusPend'); lista_dv(pe, f'C5:C{PU}', 'ListaResp')
for txt, cor, fc in [('Vencida', 'F8D7DA', '9B1C1C'), ('Vence em breve', 'FCE8C3', '8A5A00'), ('Concluída', 'D7F0E0', '1D6B3E')]:
    pe.conditional_formatting.add(f'H5:H{PU}', FormulaRule(formula=[f'H5="{txt}"'], fill=fill(cor), font=Font(name=F, color=fc, bold=True)))
pe.freeze_panes = 'A5'; pe.auto_filter.ref = f'A4:I{PU}'

# =====================================================================
# DECISÕES
# =====================================================================
de = aba('Decisões', '5843B8')
titulo(de, 'Registro de decisões', 'Toda decisão que muda escopo, regra ou prioridade entra aqui, com quem decidiu e onde está documentada.', 7)
cabecalho(de, 4, ['ID', 'Data', 'Decisão', 'Decidido por', 'Impacto', 'Referência', 'Situação'], [6, 12, 70, 18, 18, 26, 12])
DC = [('D01', D(13,11), 'Projeto em subpasta do repositório existente, sem custo adicional.', 'PO', 'Infraestrutura', 'README'),
      ('D02', D(13,11), 'Ciência da CHEGAB por demanda (pode ser revista).', 'PO', 'Fluxo', 'Doc. projeto, RN11'),
      ('D03', D(13,11), 'Itens restritos: ASCOIN, administrador, responsável designado e gestores autorizados.', 'PO', 'Segurança', 'Doc. projeto, seção 8'),
      ('D04', D(13,11), 'Administrador não vê trabalhos de auditoria restritos.', 'PO', 'Segurança', 'Regimento, Art. 11, §1º'),
      ('D05', D(13,11), 'Alertas apenas no sistema por enquanto; usuários criados direto no banco.', 'PO', 'Comunicação', 'Doc. projeto, seção 4.2'),
      ('D06', D(13,11), 'Prorrogação de até 50% do prazo, um pedido por item; tudo ajustável.', 'PO', 'Regra', 'RN09'),
      ('D07', D(13,11), 'Um papel por usuário; CHEGAB e Secretário veem tudo.', 'PO', 'Segurança', 'RN18'),
      ('D08', D(16,11), 'Azul institucional; pareceres com vários responsáveis; pool de checklists; trilha legível.', 'PO', 'Produto', 'Maquete v2'),
      ('D09', D(16,11), 'Pendências das não conformidades nascem na geração do parecer.', 'PO', 'Regra', 'RN14'),
      ('D10', D(16,11), 'Abertura automática do checklist ao cadastrar o processo.', 'PO', 'Regra', 'RN13'),
      ('D11', D(16,11), 'Menu com Configurações e Manutenção e seus subitens; temas claro, escuro e institucional.', 'PO', 'Produto', 'Maquete v3/v4'),
      ('D12', D(16,11), 'Aplicação da análise de melhorias (maquete v4).', 'PO', 'Produto', 'Maquete v4'),
      ('D13', D(16,11), 'Distribuição: analista por demanda; só a ASCOIN distribui; encaminhamento para subárea; responsável na área; lembrete de ciência; um item por área.', 'PO e ASCOIN', 'Fluxo', 'README, passo 2'),
      ('D14', D(16,11), 'Atendimento: colaborador da área; rascunho; validação da chefia por botão, só quando necessária; evidência obrigatória; dúvida à ASCOIN; resposta parcial fora do MVP.', 'PO e ASCOIN', 'Fluxo', 'README, passo 3'),
      ('D15', D(17,11), 'Documento de projeto v1.0 e planilha de controle adotados como linha de base de planejamento.', 'PO', 'Gestão', 'Doc. projeto v1.0')]
for i, (did, dt, txt, por, imp, ref) in enumerate(DC):
    rr = 5 + i
    celula(de, rr, 1, did, alin='center'); celula(de, rr, 2, dt, DATA, alin='center'); celula(de, rr, 3, txt)
    celula(de, rr, 4, por); celula(de, rr, 5, imp); celula(de, rr, 6, ref); celula(de, rr, 7, 'Vigente', entrada=True, alin='center')
    de.row_dimensions[rr].height = 30
DEU = 4 + len(DC) + 5
for rr in range(5 + len(DC), DEU + 1):
    for cc in range(1, 8): celula(de, rr, cc, None, DATA if cc == 2 else None, entrada=True)
de.freeze_panes = 'A5'; de.auto_filter.ref = f'A4:G{DEU}'

# =====================================================================
# MUDANÇAS
# =====================================================================
mu = aba('Mudanças', '5843B8')
titulo(mu, 'Controle de mudanças', 'Pedido → análise de impacto pelo PO → aprovação (PO se não afeta prazo do MVP; patrocinadores se afeta) → registro em Decisões.', 11)
cabecalho(mu, 4, ['ID', 'Data', 'Solicitante', 'Descrição da mudança', 'Impacto no escopo', 'Impacto no prazo (dias úteis)', 'Impacto no custo', 'Decisão', 'Aprovado por', 'Data da decisão', 'Decisão relacionada'], [7, 12, 14, 44, 30, 12, 14, 16, 16, 12, 12])
CRs = [('CR-01', D(16,11), 'ASCOIN', 'Incluir no protótipo agenda, widgets, temas, faixa de notícias e manutenção', 'Itens classificados como fase 1.5; não entram no MVP', 0, 'Nenhum', 'Aprovada com ressalvas', 'PO', D(16,11), 'D11'),
       ('CR-02', D(16,11), 'ASCOIN', 'Detalhar distribuição e atendimento (analista, encaminhamento, validação da chefia, colaborador)', 'Incluído no MVP (dias 3 e 4)', 0, 'Nenhum', 'Aprovada', 'PO e ASCOIN', D(16,11), 'D13, D14')]
for i, row in enumerate(CRs):
    rr = 5 + i
    for j, v in enumerate(row):
        celula(mu, rr, j + 1, v, DATA if j in (1, 9) else ('0' if j == 5 else None), entrada=j in (4, 5, 6, 7, 8, 9), alin='center' if j in (0, 1, 5, 7, 9, 10) else 'left')
    mu.row_dimensions[rr].height = 34
MU = 4 + len(CRs) + 6
for rr in range(5 + len(CRs), MU + 1):
    for cc in range(1, 12): celula(mu, rr, cc, None, DATA if cc in (2, 10) else ('0' if cc == 6 else None), entrada=True)
lista_dv(mu, f'H5:H{MU}', 'ListaDecisaoCR')
mu.conditional_formatting.add(f'H5:H{MU}', FormulaRule(formula=['H5="Em análise"'], fill=fill('FCE8C3'), font=Font(name=F, color='8A5A00', bold=True)))
mu.freeze_panes = 'A5'

# =====================================================================
# STATUS SEMANAL
# =====================================================================
ss = aba('Status semanal', AZUL2)
titulo(ss, 'Relatório semanal de situação', 'Uma linha por semana, preenchida na reunião de acompanhamento. Os números da semana podem ser copiados do Painel.', 12)
cabecalho(ss, 4, ['Semana', 'Período', 'Farol geral', 'Escopo', 'Prazo', 'Riscos', '% concluído', 'SPI', 'Entregue na semana', 'Previsto para a próxima semana', 'Pontos de atenção e decisões necessárias', 'Responsável'], [8, 20, 11, 11, 11, 11, 11, 8, 40, 40, 44, 14])
ss_row = [1, '13 a 17/11/2026', 'Amarelo', 'Amarelo', 'Amarelo', 'Amarelo', None, None,
          'Levantamento de requisitos; maquetes v1 a v4; validação dos passos 1 a 3; documento de projeto v1.0; planilha de controle.',
          'Aprovar o documento de projeto (M1); validar passos 4 a 9; contratar o Supabase Pro; cobrar planilha base.',
          'Escopo do protótipo maior que o MVP (congelar); planilha base ainda não recebida; 20/11 é feriado (prazos ajustados para 19/11).', 'AGE']
for j, v in enumerate(ss_row):
    celula(ss, 5, j + 1, v, PCT if j == 6 else ('0.00' if j == 7 else None), entrada=True, alin='center' if j < 8 else 'left')
ss['G5'] = "='Painel'!C8"; ss['G5'].font = Font(name=F, size=10, color='008000'); ss['G5'].number_format = PCT
ss['H5'] = "='Painel'!C10"; ss['H5'].font = Font(name=F, size=10, color='008000'); ss['H5'].number_format = '0.00'
ss.row_dimensions[5].height = 70
for rr in range(6, 30):
    for cc in range(1, 13): celula(ss, rr, cc, None, PCT if cc == 7 else ('0.00' if cc == 8 else None), entrada=True)
lista_dv(ss, 'C5:F29', 'ListaFarol')
for txt, cor, fc in [('Verde', 'D7F0E0', '1D6B3E'), ('Amarelo', 'FCE8C3', '8A5A00'), ('Vermelho', 'F8D7DA', '9B1C1C')]:
    ss.conditional_formatting.add('C5:F29', FormulaRule(formula=[f'C5="{txt}"'], fill=fill(cor), font=Font(name=F, color=fc, bold=True)))
celula(ss, 31, 1, 'Na semana 1 os campos % concluído e SPI estão ligados ao Painel (verde). Nas semanas seguintes, digite o valor do dia para guardar o histórico.', cor=CINZA, wrap=False)
ss.freeze_panes = 'C5'

# =====================================================================
# RACI
# =====================================================================
ra = aba('RACI', CINZA)
titulo(ra, 'Matriz RACI', 'R = responsável pela execução · A = aprova (um por atividade) · C = consultado · I = informado.', 7)
cabecalho(ra, 4, ['Atividade', 'CHEGAB / SUBEXE', 'ASCOIN', 'AGE (PO)', 'Equipe técnica', 'Áreas', 'Verificação (1 “A” por linha)'], [44, 16, 12, 12, 15, 10, 18])
RC = [('Aprovar escopo e documento de projeto', 'A', 'C', 'R', 'C', 'I'), ('Validar fluxos e regras', 'I', 'A', 'R', 'C', 'C'), ('Construir e testar', 'I', 'C', 'A', 'R', 'I'),
      ('Fornecer planilha base e checklists', 'I', 'R', 'A', 'C', 'I'), ('Migrar dados', 'I', 'A', 'C', 'R', 'I'), ('Homologar', 'I', 'R', 'A', 'C', 'C'),
      ('Treinar usuários', 'I', 'C', 'A', 'R', 'I'), ('Autorizar go-live', 'A', 'C', 'R', 'C', 'I'), ('Operar e dar suporte', 'I', 'C', 'A', 'R', 'I')]
for i, row in enumerate(RC):
    rr = 5 + i
    for j, v in enumerate(row): celula(ra, rr, j + 1, v, entrada=j > 0, alin='center' if j else 'left')
    celula(ra, rr, 7, f'=IF(COUNTIF(B{rr}:F{rr},"A")=1,"OK","Revisar")', alin='center')
ra.conditional_formatting.add('G5:G13', FormulaRule(formula=['G5="Revisar"'], fill=fill('F8D7DA'), font=Font(name=F, color='9B1C1C', bold=True)))
for txt, cor in [('A', 'DCE6F2'), ('R', 'D7F0E0')]:
    ra.conditional_formatting.add('B5:F13', FormulaRule(formula=[f'B5="{txt}"'], fill=fill(cor), font=Font(name=F, bold=True)))

# =====================================================================
# PAINEL
# =====================================================================
pn = wb.create_sheet('Painel', 0); pn.sheet_properties.tabColor = AZUL; pn.sheet_view.showGridLines = False
pn['A1'] = '=\'Parâmetros\'!C7'; pn['A1'].font = Font(name=F, size=16, bold=True, color=AZUL)
pn['A2'] = 'Painel de controle do projeto · todos os números são calculados a partir das outras abas'; pn['A2'].font = Font(name=F, size=10, italic=True, color=CINZA)
for col, w in zip('ABCDEFGHIJ', [3, 42, 16, 4, 30, 34, 4, 18, 14, 14]): pn.column_dimensions[col].width = w
def kpi(r_, c_, rotulo, formula, fmt=None, nota=None):
    a = pn.cell(row=r_, column=c_, value=rotulo); a.font = Font(name=F, size=10, color=CINZA); a.border = borda; a.alignment = Alignment(vertical='center', wrap_text=True)
    b = pn.cell(row=r_, column=c_ + 1, value=formula); b.font = Font(name=F, size=13, bold=True, color=AZUL); b.border = borda
    b.alignment = Alignment(horizontal='center', vertical='center')
    if fmt: b.number_format = fmt
    if nota: b.comment = Comment(nota, 'PMO')
    pn.row_dimensions[r_].height = 24
def secao(r_, c_, t):
    s = pn.cell(row=r_, column=c_, value=t); s.font = Font(name=F, size=11, bold=True, color='FFFFFF'); s.fill = fill(AZUL)
    pn.cell(row=r_, column=c_ + 1).fill = fill(AZUL)
TAREFA = f'{rng("tipo")},"Tarefa"'
secao(4, 2, 'Prazo e avanço')
kpi(5, 2, 'Data de status', '=DataStatus', DATA)
kpi(6, 2, 'Farol geral', f'=IF(OR(C10<0.85,C13>2),"Vermelho",IF(OR(C10<0.95,C13>0,C14>0,F7>0),"Amarelo","Verde"))', nota='Vermelho: SPI < 0,85 ou mais de 2 tarefas atrasadas. Amarelo: SPI < 0,95, alguma tarefa atrasada ou em risco, ou risco alto ativo. Verde: demais casos.')
kpi(7, 2, 'Esforço total das tarefas (h)', f'=SUMIFS({rng("h")},{TAREFA})', '0')
kpi(8, 2, '% concluído (valor agregado)', f'=IFERROR(SUMIFS({rng("va")},{TAREFA})/C7,0)', PCT, 'VA / esforço total: soma de horas × % concluído de cada tarefa.')
kpi(9, 2, '% planejado até a data de status', f'=IFERROR(SUMIFS({rng("vp")},{TAREFA})/C7,0)', PCT, 'VP / esforço total: o que deveria estar pronto na data de status pela linha prevista.')
kpi(10, 2, 'SPI (índice de desempenho de prazo)', f'=IFERROR(SUMIFS({rng("va")},{TAREFA})/SUMIFS({rng("vp")},{TAREFA}),1)', '0.00', 'SPI = VA / VP. Acima de 1: adiantado. Abaixo de 1: atrasado. Sem nada planejado ainda, mostra 1.')
kpi(11, 2, 'Tarefas concluídas', f'=COUNTIFS({TAREFA},{rng("sit")},"Concluída")&" de "&COUNTIFS({TAREFA})')
kpi(12, 2, 'Tarefas em andamento', f'=COUNTIFS({TAREFA},{rng("sit")},"Em andamento")', '0')
kpi(13, 2, 'Tarefas atrasadas', f'=COUNTIFS({TAREFA},{rng("sit")},"Atrasada")', '0')
kpi(14, 2, 'Tarefas em risco ou bloqueadas', f'=COUNTIFS({TAREFA},{rng("sit")},"Em risco")+COUNTIFS({TAREFA},{rng("sit")},"Bloqueada")', '0', 'Em risco: já deveria ter começado e está com 0%.')
secao(4, 5, 'Marcos, riscos e pendências')
kpi(5, 5, 'Próximo marco', "=IFERROR(INDEX('Marcos'!$A$5:$A$10,MATCH(F6,'Marcos'!$D$5:$D$10,0))&\" · \"&INDEX('Marcos'!$B$5:$B$10,MATCH(F6,'Marcos'!$D$5:$D$10,0)),\"Todos atingidos\")")
kpi(6, 5, 'Data do próximo marco', "=IFERROR(1/(1/_xlfn.MINIFS('Marcos'!$D$5:$D$10,'Marcos'!$E$5:$E$10,\"\",'Marcos'!$D$5:$D$10,\">=\"&DataStatus)),\"—\")", DATA)
kpi(7, 5, 'Riscos altos ativos', "=COUNTIFS('Riscos'!$G$5:$G$" + str(RU) + ",\"Alto\",'Riscos'!$L$5:$L$" + str(RU) + ",\"<>Encerrado\")", '0')
kpi(8, 5, 'Riscos ativos (total)', "=COUNTIFS('Riscos'!$B$5:$B$" + str(RU) + ",\"<>\",'Riscos'!$L$5:$L$" + str(RU) + ",\"<>Encerrado\")", '0')
kpi(9, 5, 'Pendências abertas', "=COUNTIFS('Pendências'!$B$5:$B$" + str(PU) + ",\"<>\",'Pendências'!$F$5:$F$" + str(PU) + ",\"<>Concluída\",'Pendências'!$F$5:$F$" + str(PU) + ",\"<>Cancelada\")", '0')
kpi(10, 5, 'Pendências vencidas', "=COUNTIF('Pendências'!$H$5:$H$" + str(PU) + ",\"Vencida\")", '0')
kpi(11, 5, 'Mudanças em análise', "=COUNTIF('Mudanças'!$H$5:$H$" + str(MU) + ",\"Em análise\")", '0')
kpi(12, 5, 'Backlog concluído (pontos)', f"='Backlog'!D{BU+3}&\" de \"&'Backlog'!D{BU+2}")
kpi(13, 5, 'Entregas aceitas', "='Entregas'!G16&\" de 10\"")
kpi(14, 5, 'Decisões registradas', "=COUNTA('Decisões'!$C$5:$C$" + str(DEU) + ")", '0')
for txt, cor, fc in [('Verde', 'D7F0E0', '1D6B3E'), ('Amarelo', 'FCE8C3', '8A5A00'), ('Vermelho', 'F8D7DA', '9B1C1C')]:
    pn.conditional_formatting.add('C6', FormulaRule(formula=[f'C6="{txt}"'], fill=fill(cor), font=Font(name=F, color=fc, bold=True, size=13)))
pn.conditional_formatting.add('F7', CellIsRule(operator='greaterThan', formula=['0'], font=Font(name=F, color='C00000', bold=True, size=13)))
pn.conditional_formatting.add('F10', CellIsRule(operator='greaterThan', formula=['0'], font=Font(name=F, color='C00000', bold=True, size=13)))
pn.conditional_formatting.add('C13', CellIsRule(operator='greaterThan', formula=['0'], font=Font(name=F, color='C00000', bold=True, size=13)))
# situação por fase
secao(17, 2, 'Situação por fase')
pn.row_dimensions[18].height = 22
for j, t in enumerate(['Fase', '% concluído', 'Início previsto', 'Término previsto', 'Situação']):
    cc = pn.cell(row=18, column=[2, 3, 5, 6, 8][j], value=t)
    cc.font = Font(name=F, bold=True, size=10, color=AZUL); cc.border = borda; cc.fill = fill('DCE6F2'); cc.alignment = Alignment(horizontal='center')
for i, (fid, fnome, rf, ini, fim) in enumerate(linhas_fase):
    rr = 19 + i
    for colx, k, fmt in [(2, 'atv', None), (3, 'pct', PCT), (5, 'ip', DATA), (6, 'tp', DATA), (8, 'sit', None)]:
        cc = pn.cell(row=rr, column=colx, value=f"={CRF}{C_[k]}{rf}")
        cc.font = Font(name=F, size=10, color='008000'); cc.border = borda; cc.alignment = Alignment(horizontal='left' if colx == 2 else 'center', vertical='center')
        if fmt: cc.number_format = fmt
    pn.row_dimensions[rr].height = 20
fr0, fr1 = 19, 18 + len(linhas_fase)
pn.conditional_formatting.add(f'C{fr0}:C{fr1}', DataBarRule(start_type='num', start_value=0, end_type='num', end_value=1, color='5B9BD5'))
for txt, cor, fc in [('Atrasada', 'F8D7DA', '9B1C1C'), ('Em risco', 'FCE8C3', '8A5A00'), ('Concluída', 'D7F0E0', '1D6B3E'), ('Em andamento', 'DCE9FB', '134A8F')]:
    pn.conditional_formatting.add(f'H{fr0}:H{fr1}', FormulaRule(formula=[f'H{fr0}="{txt}"'], fill=fill(cor), font=Font(name=F, color=fc, bold=True)))
# contagem por situação (base do gráfico)
sr = fr1 + 3
secao(sr, 2, 'Tarefas por situação')
sits = ['Concluída', 'Em andamento', 'A iniciar', 'Em risco', 'Atrasada', 'Bloqueada', 'Cancelada']
for i, s_ in enumerate(sits):
    a = pn.cell(row=sr + 1 + i, column=2, value=s_); a.font = Font(name=F, size=10); a.border = borda
    b = pn.cell(row=sr + 1 + i, column=3, value=f'=COUNTIFS({TAREFA},{rng("sit")},B{sr+1+i})'); b.font = Font(name=F, size=10); b.border = borda; b.alignment = Alignment(horizontal='center'); b.number_format = '0'
bc = BarChart(); bc.type = 'bar'; bc.title = 'Tarefas por situação'; bc.height = 7.5; bc.width = 15
bc.add_data(Reference(pn, min_col=3, min_row=sr + 1, max_row=sr + len(sits)), titles_from_data=False)
bc.set_categories(Reference(pn, min_col=2, min_row=sr + 1, max_row=sr + len(sits)))
bc.series[0].graphicalProperties.solidFill = '1858A8'; bc.legend = None; bc.roundedCorners = False
bc.title.overlay = False; bc.x_axis.delete = False; bc.y_axis.delete = False; bc.y_axis.majorGridlines = None
pn.add_chart(bc, f'E{sr}')
pc = BarChart(); pc.type = 'bar'; pc.title = '% concluído por fase'; pc.height = 7.5; pc.width = 15
pc.add_data(Reference(pn, min_col=3, min_row=fr0, max_row=fr1), titles_from_data=False)
pc.set_categories(Reference(pn, min_col=2, min_row=fr0, max_row=fr1))
pc.series[0].graphicalProperties.solidFill = '2E7D4F'; pc.legend = None; pc.roundedCorners = False
pc.title.overlay = False; pc.x_axis.delete = False; pc.y_axis.delete = False; pc.y_axis.scaling.min = 0; pc.y_axis.scaling.max = 1; pc.y_axis.number_format = '0%'
pn.add_chart(pc, f'E{fr1 + 3 + 16}')
pn.freeze_panes = 'A4'

# =====================================================================
# INSTRUÇÕES
# =====================================================================
ins = wb.create_sheet('Instruções', 0); ins.sheet_properties.tabColor = OURO; ins.sheet_view.showGridLines = False
ins.column_dimensions['A'].width = 3; ins.column_dimensions['B'].width = 26; ins.column_dimensions['C'].width = 100
ins['B1'] = 'SisControle SEDES · Planilha de controle do projeto'; ins['B1'].font = Font(name=F, size=16, bold=True, color=AZUL)
ins['B2'] = 'Governo do Estado do Rio de Janeiro · SEDES · AGE (PMO) · versão 1.0 · 17/11/2026 · uso interno'; ins['B2'].font = Font(name=F, size=10, italic=True, color=CINZA)
blocos = [
 ('Para que serve', [('', 'Controlar etapas, cronograma, entregas, backlog, riscos, pendências, decisões e mudanças do projeto, com indicadores calculados automaticamente. Complementa o Documento de Projeto v1.0.')]),
 ('Rotina semanal (PMO)', [('1', 'Em Parâmetros, atualize a data de status (C5).'), ('2', 'No Cronograma, atualize % concluído, status e datas reais das tarefas (colunas em amarelo).'), ('3', 'No Backlog, marque as histórias concluídas e a data de conclusão.'), ('4', 'Revise Riscos, Pendências e Mudanças; registre decisões novas.'), ('5', 'Confira o Painel e registre a linha da semana em Status semanal.')]),
 ('Legenda de cores', [('Fundo amarelo, texto azul', 'Campo para preencher.'), ('Texto preto', 'Fórmula: não digite por cima.'), ('Texto verde', 'Valor trazido de outra aba.'), ('Faixa azul-clara', 'Linha de fase: calculada a partir das tarefas.')]),
 ('Situação das tarefas (calculada)', [('Concluída', '% concluído = 100%.'), ('Atrasada', 'Término previsto anterior à data de status e não concluída.'), ('Em risco', 'Início previsto já passou e está com 0%.'), ('Em andamento', 'Com algum avanço e dentro do prazo.'), ('A iniciar', 'Início previsto ainda no futuro.'), ('Bloqueada / Cancelada', 'Definidas pelo campo Status.')]),
 ('Indicadores', [('Valor planejado (VP)', 'Horas que deveriam estar prontas na data de status, pela linha prevista (dias úteis, sem feriados).'), ('Valor agregado (VA)', 'Horas × % concluído.'), ('SPI', 'VA / VP. 1,00 = no prazo; abaixo de 0,95 acende amarelo; abaixo de 0,85, vermelho.'), ('Variação do término', 'Dias úteis entre o término previsto e a linha de base (positivo = atraso).'), ('Exposição ao risco', 'Probabilidade × impacto (1 a 5). Alto ≥ 15, médio ≥ 8.')]),
 ('Linha de base', [('Regra', 'As colunas “linha de base” guardam o plano aprovado (marco M1). Não altere depois da aprovação; mude só as datas previstas. Nova linha de base só com mudança aprovada (aba Mudanças).')]),
 ('Abas', [('Painel', 'Farol, avanço, SPI, marcos, riscos, pendências, situação por fase e gráficos.'), ('Cronograma', 'EAP com fases, tarefas, marcos, linha de base, valor agregado e Gantt diário.'), ('Marcos', 'M1 a M6 com variação e situação.'), ('Entregas', 'Os 10 dias de construção do MVP e o aceite da ASCOIN.'), ('Backlog / Burndown', 'Histórias com pontos e o gráfico de pontos restantes.'), ('Riscos', 'Registro com matriz de calor.'), ('Pendências / Decisões / Mudanças', 'Ações, registro de decisões e controle de mudanças.'), ('Status semanal', 'Histórico dos relatórios semanais.'), ('RACI', 'Responsabilidades, com verificação de um único aprovador.'), ('Parâmetros', 'Data de status, feriados e listas.')]),
 ('Observações', [('Feriado', '20/11/2026 é feriado nacional (Dia da Consciência Negra). Os prazos de 20/11 do documento de projeto foram ajustados para 19/11.'), ('Datas futuras', 'As datas após a aprovação são previsões e dependem do marco M1, do ambiente (M2) e da planilha base (M3).')]),
]
rr = 4
for t, itens in blocos:
    s = ins.cell(row=rr, column=2, value=t); s.font = Font(name=F, size=11, bold=True, color='FFFFFF'); s.fill = fill(AZUL); ins.cell(row=rr, column=3).fill = fill(AZUL)
    rr += 1
    for a_, b_ in itens:
        x = ins.cell(row=rr, column=2, value=a_); x.font = Font(name=F, size=10, bold=True); x.alignment = Alignment(vertical='top', wrap_text=True)
        y = ins.cell(row=rr, column=3, value=b_); y.font = Font(name=F, size=10); y.alignment = Alignment(vertical='top', wrap_text=True)
        if a_ == 'Fundo amarelo, texto azul': x.fill = ENTRADA; x.font = Font(name=F, size=10, bold=True, color='0000FF')
        if a_ == 'Texto verde': x.font = Font(name=F, size=10, bold=True, color='008000')
        if a_ == 'Faixa azul-clara': x.fill = fill('DCE6F2')
        ins.row_dimensions[rr].height = 30 if (len(b_) > 95 or len(a_) > 24) else 18
        rr += 1
    rr += 1

# impressão: paisagem, ajustada à largura, título repetido
for ws in wb.worksheets:
    ws.page_setup.orientation = 'landscape'; ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_margins.left = ws.page_margins.right = 0.4; ws.page_margins.top = ws.page_margins.bottom = 0.5
    ws.oddFooter.center.text = '&A · Página &P de &N'; ws.oddFooter.center.size = 8
    ws.oddHeader.right.text = 'SisControle SEDES · Controle do projeto'; ws.oddHeader.right.size = 8
pn['F5'].alignment = Alignment(horizontal='center', vertical='center', wrap_text=True); pn['F5'].font = Font(name=F, size=11, bold=True, color=AZUL); pn.row_dimensions[5].height = 32
wb.move_sheet('Painel', offset=-(wb.sheetnames.index('Painel') - 1))
wb.move_sheet('Parâmetros', offset=len(wb.sheetnames) - 1 - wb.sheetnames.index('Parâmetros'))
wb.active = 1
wb.save(OUT)
print('salvo', OUT)
