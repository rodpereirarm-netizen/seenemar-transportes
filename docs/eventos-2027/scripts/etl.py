"""ETL do Levantamento de Eventos 2027 - SEDES/RJ.

Lê as 7 planilhas de origem (pasta ``origem``), padroniza os campos e devolve
uma lista de registros (um por evento) e uma lista de inconsistências.

Regras de negócio (documentadas também na aba "Notas Metodológicas"):
- Ano de referência: 2027.
- Período declarado como bimestre/trimestre/semestre: o "mês de referência"
  é o PRIMEIRO mês da janela (critério conservador para contratação).
- Intervalos que cruzam dois meses: mês de referência = mês de início.
- "até 150 pessoas" -> 150 (teto); "20-30 pessoas" -> 30 (teto); "16 mil" -> 16000.
- Buffet "Não" -> modalidade "Não se aplica" e 0 pessoas.
- Buffet "A definir" sem quantidade -> pessoas = público estimado (sinalizado).
- Classificação da demanda de buffet:
    Firme        = buffet "Sim" e status "Previsto"
    Condicionada = buffet "Sim" com status "Condicionado", ou buffet "A definir"
    Hipótese     = linhas da aba "Hipóteses internas - validar" (SUPATI)
    Sem buffet   = buffet "Não"
"""
from __future__ import annotations

import calendar
import datetime as dt
import re
import unicodedata
from pathlib import Path

import openpyxl

ANO = 2027
MIN_PESSOAS = 30  # regra definida pela SEDES: todo evento é dimensionado para, no mínimo, 30 pessoas
MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
MESES_EXTENSO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
                 "agosto", "setembro", "outubro", "novembro", "dezembro"]
MODALIDADES = ["Coffee Simples", "Brunch", "Coquetel", "Buffet – Almoço/Jantar", "A definir"]
MODALIDADES_TODAS = MODALIDADES + ["Não se aplica"]

# arquivo -> rótulo da unidade remetente
ARQUIVOS = {
    "Levantamento_Eventos_SEDES_SUPCOMP_2027.xlsx": "SUPCOMP",
    "Levantamento_Eventos_SEDES_SUPDER_2027.xlsx": "SUPDER",
    "Levantamento_Eventos_SUBENEMAR_2027.xlsx": "SUBENEMAR",
    "Levantamento_Eventos_SEDES_RH_2027.xlsx": "RH (COOGP)",
    "Calendario_SEDES_SUPATI_SUBICS.xlsx": "SUPATI",
    "Levantamento_Eventos_SEDES_ASSTEC_2027.xlsx": "ASSTEC",
    "Levantamento_Eventos_SEDES_2027_SUBINOVA.xlsx": "SUBINOVA",
}

# texto original do campo "Subsecretaria / Setor" -> (Subsecretaria, Setor)
SETORES = {
    "SUPCOMP/SUBICS": ("SUBICS", "SUPCOMP"),
    "SUPDER/SUBICS": ("SUBICS", "SUPDER"),
    "SUBICS/SUPDER": ("SUBICS", "SUPDER"),
    "SUBICS": ("SUBICS", "SUBICS (Gabinete)"),
    "SUBENEMAR": ("SUBENEMAR", "SUBENEMAR"),
    "SUBEXE/COOGP": ("SUBEXE", "COOGP"),
    "SUPATI": ("SUBICS", "SUPATI"),
    "SUPATI / COOFAP": ("SUBICS", "SUPATI / COOFAP"),
    "COONOV": ("SUBICS", "COONOV"),
    "SUBAE / Assessoria Técnica de Capacitação": ("SUBAE", "Assessoria Técnica de Capacitação"),
    "SUBINOVA/ Superfam": ("SUBINOVA", "SUPERFAM"),
    "SUBINOVA / SuperInova": ("SUBINOVA", "SUPERINOVA"),
}

# correções de grafia no nome do evento (original -> padronizado)
NOMES = {
    "ANIVERSARIANTES DO MÊS": "Aniversariantes do Mês",
    "ANIVERSARIANTES DO MÊS/ FESTA JUNINA": "Aniversariantes do Mês / Festa Junina",
    "ANIVERSARIANTES DO MÊS/ DIA DO SERVIDOR": "Aniversariantes do Mês / Dia do Servidor",
    "DIA DA MULHER": "Dia da Mulher",
    "HOMENAGEM ÀS MÃES": "Homenagem às Mães",
    "HOMENAGEM AOS PAIS": "Homenagem aos Pais",
    "SETEMBRO AMARELO": "Setembro Amarelo",
    "OUTUBRO ROSA": "Outubro Rosa",
    "NOVEMBRO AZUL": "Novembro Azul",
    "CONFRATERNIZAÇÃO SEDES": "Confraternização SEDES",
}
TYPOS = [("Flumiense", "Fluminense"), ("Desevolvimento", "Desenvolvimento"),
         ("Forum ", "Fórum "), ("relacionado as rodadas", "relacionado às rodadas")]


def _sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def _fim_mes(m: int) -> dt.date:
    return dt.date(ANO, m, calendar.monthrange(ANO, m)[1])


def parse_periodo(v) -> dict:
    """Converte o campo 'Data ou período previsto' em datas/mês de referência."""
    if isinstance(v, (dt.datetime, dt.date)):
        d = v.date() if isinstance(v, dt.datetime) else v
        return dict(tipo="Data exata", ini=d, fim=d, mes_definido=True)
    s = str(v).strip()
    n = _sem_acento(s)
    m = re.fullmatch(r"(\d)º (bimestre|trimestre|semestre)(?:[ /]?2027)?", n)
    if m:
        k, tipo = int(m.group(1)), m.group(2)
        tam = {"bimestre": 2, "trimestre": 3, "semestre": 6}[tipo]
        mi = (k - 1) * tam + 1
        mf = mi + tam - 1
        assert 1 <= mi <= mf <= 12, s
        return dict(tipo=tipo.capitalize(), ini=dt.date(ANO, mi, 1), fim=_fim_mes(mf), mes_definido=False)
    m = re.fullmatch(r"(\d{2})[–-](\d{2})/(\d{2})/(\d{4})", s)
    if m:
        a, b, mes, ano = map(int, m.groups())
        return dict(tipo="Intervalo de datas", ini=dt.date(ano, mes, a), fim=dt.date(ano, mes, b), mes_definido=True)
    m = re.fullmatch(r"(\d{2})/(\d{2})[–-](\d{2})/(\d{2})/(\d{4})", s)
    if m:
        a, ma, b, mb, ano = map(int, m.groups())
        return dict(tipo="Intervalo de datas", ini=dt.date(ano, ma, a), fim=dt.date(ano, mb, b), mes_definido=True)
    m = re.fullmatch(r"(\d{1,2}) a (\d{1,2}) de ([a-zç]+)/(\d{4})", n)
    if m:
        a, b, nome, ano = m.groups()
        mes = [_sem_acento(x) for x in MESES_EXTENSO].index(nome) + 1
        return dict(tipo="Intervalo de datas", ini=dt.date(int(ano), mes, int(a)),
                    fim=dt.date(int(ano), mes, int(b)), mes_definido=True)
    if n in [_sem_acento(x) for x in MESES_EXTENSO]:
        mes = [_sem_acento(x) for x in MESES_EXTENSO].index(n) + 1
        return dict(tipo="Mês", ini=dt.date(ANO, mes, 1), fim=_fim_mes(mes), mes_definido=True)
    raise ValueError(f"Período não reconhecido: {v!r}")


def parse_qtd(v):
    """Retorna (número, regra aplicada ou None)."""
    if v is None or v == "":
        return None, None
    if isinstance(v, (int, float)):
        return int(v), None
    s = str(v).strip().lower()
    m = re.fullmatch(r"(\d+) mil", s)
    if m:
        return int(m.group(1)) * 1000, f"'{v}' convertido para {int(m.group(1)) * 1000}"
    m = re.fullmatch(r"até (\d+) pessoas", s)
    if m:
        return int(m.group(1)), f"'{v}' convertido para {m.group(1)} (teto)"
    m = re.fullmatch(r"(\d+)\s*-\s*(\d+) pessoas", s)
    if m:
        return int(m.group(2)), f"'{v}' convertido para {m.group(2)} (teto da faixa)"
    m = re.fullmatch(r"(\d+) pessoas", s)
    if m:
        return int(m.group(1)), f"'{v}' convertido para {m.group(1)}"
    raise ValueError(f"Quantidade não reconhecida: {v!r}")


def norm_buffet(v) -> str:
    s = _sem_acento(str(v or "")).strip()
    return {"sim": "Sim", "nao": "Não", "a definir": "A definir"}[s]


def norm_modalidade(v, buffet: str) -> str:
    if v is None or str(v).strip() == "":
        return "Não se aplica" if buffet == "Não" else "A definir"
    s = _sem_acento(str(v)).strip()
    mapa = {"coffee simples": "Coffee Simples", "brunch": "Brunch", "coquetel": "Coquetel",
            "buffet – almoco/jantar": "Buffet – Almoço/Jantar", "almoco/jantar": "Buffet – Almoço/Jantar",
            "nao se aplica": "Não se aplica", "a definir": "A definir"}
    return mapa[s]


def categoria(nome: str, obs: str, unidade: str) -> str:
    n = _sem_acento(nome)
    if unidade == "RH (COOGP)":
        return "Endomarketing / RH"
    if "hipotese de patrocinio" in _sem_acento(obs) or "patrocinio com estande" in _sem_acento(obs):
        return "Participação em evento externo"
    if n.startswith(("reuniao", "oficina", "cedemar", "encontro tecnico", "balanco", "avaliacao")):
        return "Reunião / colegiado / oficina"
    if n.startswith("recepcao"):
        return "Reunião / colegiado / oficina"
    return "Evento institucional"


def formato(obs: str) -> str:
    o = _sem_acento(obs)
    if o.startswith("virtual"):
        return "Virtual"
    if o.startswith("presencial"):
        return "Presencial (condicional)"
    if "a ocorrer no" in o:
        return "Presencial"
    return "Não informado"


def status(nome: str, obs: str, aba_hipotese: bool) -> str:
    if aba_hipotese:
        return "Hipótese (validar)"
    n, o = _sem_acento(nome), _sem_acento(obs)
    if n.startswith(("reuniao pos-", "reuniao tecnica pos-")):
        return "Condicionado"  # nota da planilha SUPATI: condicionada a contatos efetivos e validação da chefia
    if "hipotese de patrocinio" in o or o.startswith("caso haja"):
        return "Condicionado"
    return "Previsto"


def classe_demanda(buffet: str, st: str) -> str:
    if buffet == "Não":
        return "Sem buffet"
    if st == "Hipótese (validar)":
        return "Hipótese"
    if buffet == "Sim" and st == "Previsto":
        return "Firme"
    return "Condicionada"


def ler_linhas(path: Path):
    """Gera (aba, linha_excel, valores[8]) das linhas de evento preenchidas."""
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Previsão de Eventos 2027"]
    cab = [c.value for c in ws[4]][:8]
    assert cab[1] == "Nome do evento", (path.name, cab)
    for r in range(5, ws.max_row + 1):
        vals = [ws.cell(r, c).value for c in range(1, 9)]
        if vals[1] not in (None, ""):
            yield "Previsão de Eventos 2027", r, vals
    if "Hipóteses internas - validar" in wb.sheetnames:
        wh = wb["Hipóteses internas - validar"]
        for r in range(2, wh.max_row + 1):
            vals = [wh.cell(r, c).value for c in range(1, 9)]
            if vals[1] not in (None, ""):
                yield "Hipóteses internas - validar", r, vals


def ler_externos(path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Pesquisa externa 2027"]
    cab = [c.value for c in ws[1]]
    out = []
    for r in range(2, ws.max_row + 1):
        vals = [ws.cell(r, c).value for c in range(1, len(cab) + 1)]
        if vals[0]:
            out.append(dict(zip(cab, vals)))
    return out


def consolidar(origem: Path):
    registros, issues = [], []
    contagem_origem = {}

    def issue(reg, campo, problema, tratamento, acao):
        issues.append(dict(id=reg["ID"], ref=reg["Ref. origem"], unidade=reg["Unidade remetente"], evento=reg["Nome do evento"],
                           periodo=reg["Data/período (original)"], campo=campo, problema=problema,
                           tratamento=tratamento, acao=acao))

    for arq, unidade in ARQUIVOS.items():
        path = origem / arq
        n = 0
        for aba, linha, v in ler_linhas(path):
            n += 1
            setor_orig, nome_orig, per, pub, buf, mod, pes, obs = v
            obs_txt = "" if obs in (None, "-", "xxx") else str(obs).strip()
            sub, setor = SETORES[str(setor_orig).strip()]
            nome = NOMES.get(nome_orig.strip(), nome_orig.strip())
            for a, b in TYPOS:
                nome = nome.replace(a, b)
            p = parse_periodo(per)
            pub_n, pub_regra = parse_qtd(pub)
            buffet = norm_buffet(buf)
            modal = norm_modalidade(mod, buffet)
            pes_n, pes_regra = parse_qtd(pes)
            hip = aba != "Previsão de Eventos 2027"
            st = status(nome, obs_txt, hip)
            reg = {
                "ID": f"EV{len(registros) + 1:03d}",
                "Unidade remetente": unidade,
                "Arquivo de origem": arq,
                "Aba / linha de origem": f"{aba} / L{linha}",
                "Ref. origem": f"{unidade} · {'Hipóteses' if aba != 'Previsão de Eventos 2027' else 'Previsão'} L{linha}",
                "Subsecretaria / Setor (original)": setor_orig,
                "Subsecretaria": sub,
                "Setor": setor,
                "Nome do evento": nome,
                "Categoria": categoria(nome, obs_txt, unidade),
                "Data/período (original)": per.strftime("%d/%m/%Y") if isinstance(per, dt.datetime) else str(per),
                "Tipo de período": p["tipo"],
                "Data início": p["ini"],
                "Data fim": p["fim"],
                "Mês definido?": "Sim" if p["mes_definido"] else "Não (estimado)",
                "Público (original)": pub,
                "Público estimado": pub_n,
                "Necessita buffet?": buffet,
                "Modalidade de buffet": modal,
                "Público entra nos totais?": "Sim",
                "Pessoas buffet (original)": pes,
                "Pessoas buffet": None,
                "Status": st,
                "Demanda de buffet": classe_demanda(buffet, st),
                "Formato": formato(obs_txt),
                "Observações": obs_txt,
            }
            registros.append(reg)

            # ---------- regras de quantidade e qualidade ----------
            if pub_regra:
                issue(reg, "Público estimado", "Quantidade informada como texto", pub_regra, "Informar apenas o número")
            if pes_regra:
                issue(reg, "Pessoas buffet", "Quantidade informada como texto", pes_regra, "Informar apenas o número")
            if buffet == "Não":
                pes_n = 0
            elif pes_n is None:
                pes_n = pub_n
                issue(reg, "Pessoas buffet", "Quantidade de pessoas do buffet não informada",
                      f"Assumido igual ao público estimado ({pub_n})", "Unidade deve informar a quantidade")
            # mínimo de 30 pessoas por evento (público e, havendo buffet, pessoas do buffet)
            if pub_n is not None and pub_n < MIN_PESSOAS:
                issue(reg, "Público estimado", f"Público informado ({pub_n}) abaixo do mínimo de {MIN_PESSOAS}",
                      f"Ajustado para {MIN_PESSOAS}", "Nenhuma — regra de dimensionamento mínimo")
                pub_n = MIN_PESSOAS
                reg["Público estimado"] = pub_n
            if buffet != "Não" and pes_n < MIN_PESSOAS:
                issue(reg, "Pessoas buffet", f"Pessoas no buffet ({pes_n}) abaixo do mínimo de {MIN_PESSOAS}",
                      f"Ajustado para {MIN_PESSOAS}", "Nenhuma — regra de dimensionamento mínimo")
                pes_n = MIN_PESSOAS
            reg["Pessoas buffet"] = pes_n
            if buffet != "Não" and modal == "A definir":
                issue(reg, "Modalidade de buffet", "Modalidade não definida", "Mantido como 'A definir'",
                      "Unidade deve escolher a modalidade")
            if buffet == "A definir":
                issue(reg, "Necessita buffet?", "Necessidade de buffet 'A definir'",
                      "Classificado como demanda Condicionada" if not hip else "Classificado como Hipótese",
                      "Confirmar com a unidade")
            if mod is not None and str(mod).strip() != modal and modal not in ("A definir", "Não se aplica"):
                issue(reg, "Modalidade de buffet", f"Grafia fora do padrão: '{mod}'", f"Padronizado para '{modal}'",
                      "Usar a lista suspensa do modelo")
            if pub_n is not None and pes_n is not None and pes_n > pub_n:
                issue(reg, "Pessoas buffet", f"Pessoas no buffet ({pes_n}) maior que o público ({pub_n})",
                      "Mantido o valor informado", "Confirmar se inclui equipe/convidados extras")
            if obs == "xxx":
                issue(reg, "Observações", "Campo preenchido com 'xxx'", "Campo limpo", "Preencher ou deixar em branco")
            if isinstance(per, dt.datetime) and per.day == 1 and unidade != "RH (COOGP)":
                issue(reg, "Data", "Data no dia 01 — possível indicação apenas do mês",
                      "Mantida a data informada", "Confirmar o dia exato")
            if p["tipo"] in ("Bimestre", "Trimestre", "Semestre"):
                pass  # tratado de forma agregada na aba de notas (muitas linhas)
            if nome != nome_orig.strip() and nome_orig.strip() not in NOMES:
                issue(reg, "Nome do evento", f"Erro de grafia: '{nome_orig.strip()}'", f"Corrigido para '{nome}'",
                      "Revisar")
            if "2028" in nome:
                issue(reg, "Nome do evento", "Nome cita 2028 em levantamento de 2027", "Mantido",
                      "Confirmar edição/ano do evento")
            if reg["Categoria"] == "Participação em evento externo" and pub_n and pub_n >= 1000:
                issue(reg, "Público estimado", "Público refere-se à feira inteira, não ao público da SEDES",
                      "Excluído do total de público nos resumos", "Nenhuma — apenas atenção na leitura")
                reg["Público entra nos totais?"] = "Não"
            if setor_orig.strip() in ("SUPDER/SUBICS", "SUBICS") and unidade == "SUPCOMP":
                issue(reg, "Subsecretaria / Setor", f"Evento de '{setor_orig}' enviado na planilha da SUPCOMP",
                      "Atribuído ao setor informado na linha", "Confirmar responsável (sem duplicidade na planilha SUPDER)")
            if setor_orig.strip() == "COONOV":
                issue(reg, "Subsecretaria / Setor", "Setor COONOV sem subsecretaria informada",
                      "Atribuído à SUBICS (arquivo SUPATI/SUBICS)", "Confirmar vinculação")
        contagem_origem[arq] = n

    # duplicidades exatas (mesma unidade, nome e período)
    vistos = {}
    for reg in registros:
        k = (reg["Unidade remetente"], reg["Nome do evento"], reg["Data/período (original)"])
        vistos.setdefault(k, []).append(reg["ID"])
    for k, ids in vistos.items():
        if len(ids) > 1:
            for i in ids:
                reg = next(r for r in registros if r["ID"] == i)
                issue(reg, "Linha", f"Linhas idênticas ({', '.join(ids)})",
                      "Mantidas como ocorrências distintas", "Confirmar se são eventos diferentes ou duplicidade")

    # datas divergentes entre a unidade e a pesquisa externa da SUPATI
    externos = ler_externos(origem / "Calendario_SEDES_SUPATI_SUBICS.xlsx")
    for d in divergencias_externas(registros, externos):
        if not d["confere"]:
            reg = next(r for r in registros if r["ID"] == d["id"])
            issue(reg, "Data", f"Data informada ({d['data_unidade']}) diverge da pesquisa externa SUPATI ({d['data_pesquisa']})",
                  "Mantida a data informada pela unidade", "Confirmar data oficial com o organizador")
    return registros, issues, contagem_origem


def divergencias_externas(registros, externos):
    """Compara datas de eventos externos citados pela SUBENEMAR com a pesquisa da SUPATI."""
    out = []
    for ext in externos:
        nome_ext = _sem_acento(ext["Evento externo"])
        for reg in registros:
            if reg["Unidade remetente"] == "SUBENEMAR" and nome_ext in _sem_acento(reg["Nome do evento"]):
                p_ext = ext["Data prevista"]
                m = re.fullmatch(r"(\d{2})[–-](\d{2})/(\d{2})/(\d{4})", p_ext)
                ini = dt.date(int(m.group(4)), int(m.group(3)), int(m.group(1)))
                fim = dt.date(int(m.group(4)), int(m.group(3)), int(m.group(2)))
                out.append(dict(id=reg["ID"], evento=reg["Nome do evento"], data_unidade=reg["Data/período (original)"],
                                data_pesquisa=p_ext, confere=(ini == reg["Data início"] and fim == reg["Data fim"])))
    return out
