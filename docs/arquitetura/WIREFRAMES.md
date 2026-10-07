# SIGC · Wireframes de baixa fidelidade (MVP)

> Todos os números, nomes e contratos destas telas são **DADO DE EXEMPLO**. Em produção, os valores vêm das views indicadas em cada tela.

**Princípios**
- **Hierarquia por urgência.** Lê-se de cima para baixo, do que exige ação hoje até o analítico.
- **Todo número é clicável** e leva à lista que o compõe. Não há indicador sem a lista por trás.
- **Toda nota se explica.** Saúde, Risco e Qualidade abrem o detalhamento do cálculo, e o Risco mostra a cobertura ("Risco 58 · cobertura 80%").
- **Cor só com significado:** vermelho = crítico, laranja = alto, amarelo = alerta e atenção, azul = planejamento, verde = em ordem. A cor sempre acompanha texto ou ícone, nunca aparece sozinha (acessibilidade).
- **Paleta do prompt:** navy `#0B1F33` (barra e títulos), verde `#174A3A` e `#2F6B4F` (ações primárias e "em ordem"), cinza `#F4F6F8` (fundo).
- **Cabeçalho fixo:** `SIGC · <órgão ativo>`, seletor de órgão (só aparece para quem tem mais de um), sininho e usuário.
- **Responsivo.** No celular, os cards ficam em 2 colunas, as tabelas viram cartões empilhados e as abas da ficha viram um menu suspenso.

---

## 1. Painel executivo
Fontes: `vw_painel_cards`, `vw_painel_top_atencao`, `vw_painel_regua`, `vw_carga_pessoas`, `vw_qualidade_orgao`.

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▣ SIGC · SEDES ▾                      Painel  Contratos  Pendências  Pessoas  ···   🔔3  RP ▾│
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Painel executivo                                    Referência: 07/10/2026 · atualizado 07:00│
│ Filtros: [Órgão ▾] [Unidade ▾] [Categoria ▾] [Gestor ▾] [Nível de risco ▾]     [Limpar]      │
│                                                                                             │
│ ┌─────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐│
│ │ VIGENTES    │ │ ⛔ VENCIDOS SEM   │ │ VENCEM ≤30d  │ │ VALOR VIGENTE│ │ FISCALIZ.│ │PENDÊNCIAS││
│ │     8       │ │   ENCERRAMENTO    │ │      2       │ │ R$ 11,6 mi   │ │ REGULAR  │ │ CRÍTICAS ││
│ │             │ │        5          │ │  R$ 7,1 mi   │ │              │ │   25%    │ │    8     ││
│ └─────────────┘ └──────────────────┘ └──────────────┘ └──────────────┘ └──────────┘ └──────────┘│
│                                                                                             │
│ TOP 10 QUE EXIGEM ATENÇÃO (risco × materialidade)                              [Ver todos →] │
│ ┌──┬──────────────────────┬──────────────────────────────────┬────────┬────────┬───────────┐ │
│ │# │ Contrato             │ Motivo principal                 │ Risco  │ Valor  │ Responsável│ │
│ ├──┼──────────────────────┼──────────────────────────────────┼────────┼────────┼───────────┤ │
│ │1 │ 0XX/2024 · DEMO A    │ ⛔ Vence em 14 dias (21/10/2026)  │ 58 ●●● │ 5,99 mi│ Gestor DEMO│ │
│ │2 │ 0XX/2023 · DEMO B    │ ⛔ Vencido há 61 dias sem ato     │ 55 ●●● │ 3,06 mi│ Gestor DEMO│ │
│ │3 │ 0XX/2025 · DEMO C    │ ▲ Sem gestor e sem fiscal         │ 47 ●●  │ 0,54 mi│ — (DGAF)   │ │
│ │… │                      │                       [Providência ▸] em cada linha       │ │
│ └──┴──────────────────────┴──────────────────────────────────┴────────┴────────┴───────────┘ │
│                                                                                             │
│ RÉGUA DE VENCIMENTOS                          │ CARTEIRA POR CATEGORIA (valor · qtd)         │
│  ≤30  ██████████ 2   R$ 7,1 mi                │  Serviços contínuos  ████████████ 12 │ 9,8 mi│
│  ≤60  ████ 1         R$ 0,5 mi                │  Locação             █████ 4      │ 2,1 mi  │
│  ≤90  ░ 0                                     │  Fornecimento        ███ 3        │ 0,9 mi  │
│  ≤120 ███ 1          R$ 0,3 mi                │  (categoria a classificar: 21) [Classificar]│
│  ≤180 ██████ 2       R$ 0,9 mi                │                                              │
│                                                                                             │
│ FISCALIZAÇÃO                                  │ QUALIDADE DOS DADOS   47/100 Crítica ▸       │
│  Cobertura regular 25% (meta 95%)             │  1. Fornecedor sem CNPJ ............ 18      │
│  Carga por pessoa (designações em vigor):     │  2. Regime legal não informado ..... 16      │
│   Servidor DEMO 1 ███████████ 11              │  3. Término divergente .............  5      │
│   Servidor DEMO 2 ████████ 8                  │  4. Histórico incompleto ...........  9      │
│   …                          [Ver carga ▸]    │  5. Inconsistências da importação ..  7      │
│                                                                                             │
│ EXECUÇÃO FINANCEIRA: sem dados — aguardando integração SIAFE (fase 2)                         │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Interações.** Clicar num card abre a Carteira já filtrada; o card "Vencidos sem encerramento" abre a lista com a ação **Registrar encerramento** ou **Cadastrar prorrogação**. **Providência ▸** abre a tarefa do alerta.

---

## 2. Carteira de contratos
Fonte: `vw_contratos_carteira`.

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Contratos (40)                               [+ Novo contrato]  [Exportar Excel] [CSV]       │
│ 🔍 Buscar número, fornecedor, objeto, processo SEI…                                          │
│ Situação: (Todos) (Vigentes 24) (A vencer ≤90d 5) (Vencidos 10) (Em formalização 6)           │
│ [Órgão ▾] [Fornecedor ▾] [Gestor ▾] [Fiscal ▾] [Categoria ▾] [Risco ▾] [Só com alerta ☐]    │
├───────────┬──────────────┬────────────────────┬──────────────────────┬────────┬───────┬──────┤
│ Número    │ Fornecedor   │ Objeto             │ Situação             │ Fim    │ Valor │Saúde/│
│           │              │                    │                      │        │ atual │Risco │
├───────────┼──────────────┼────────────────────┼──────────────────────┼────────┼───────┼──────┤
│ 0XX/2024  │ DEMO A ⚠CNPJ │ DEMO estágio       │ 🔴 A vencer ≤30 dias │21/10/26│5,99 mi│ 62/58│
│ 0XX/2023  │ DEMO B ⚠CNPJ │ DEMO limpeza       │ ⛔ Vencido – vigência │07/08/26│3,06 mi│ 40/55│
│           │              │                    │    a confirmar        │        │       │      │
│ Sem número│ DEMO C       │ [DADO AUSENTE]     │ ◌ Em formalização    │   —    │   —   │  —   │
│ …         │              │                    │                      │        │       │      │
└───────────┴──────────────┴────────────────────┴──────────────────────┴────────┴───────┴──────┘
  ⚠CNPJ = fornecedor provisório · ícone ⓘ ao lado do fim quando a data é "calculada" (não veio do termo)
```

---

## 3. Ficha do contrato
Fontes: `vw_contratos_carteira`, `vw_contrato_saude`, `vw_contrato_risco`, `alertas`, `auditoria`.

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Contratos   SEDES · Contrato 0XX/2024 · DEMO FORNECEDOR A (provisório: sem CNPJ) [Editar] │
│ DEMO objeto do contrato                                                                      │
│ ┌──────────────────────────┐ ┌──────────────────────┐ ┌────────────────────┐ ┌─────────────┐ │
│ │ 🔴 A VENCER EM 14 DIAS   │ │ SAÚDE  62/100 ▸      │ │ RISCO 58 · médio ▸ │ │ QUALIDADE   │ │
│ │ Fim: 21/10/2026 (termo)  │ │ 8 de 13 itens        │ │ cobertura 80%      │ │ 64/100 ▸    │ │
│ │ Início 22/10/2024 · 24 m │ │                      │ │ prioridade 81      │ │             │ │
│ └──────────────────────────┘ └──────────────────────┘ └────────────────────┘ └─────────────┘ │
│ ALERTAS ABERTOS                                                                              │
│  ⛔ VIG-030 Vence em 14 dias (21/10/2026)          Tarefa: Gestor DEMO · prazo 09/10 [Abrir] │
│  ▲ FIS-SUB  Sem fiscal substituto                  Tarefa: DGAF · prazo 21/10        [Abrir] │
│  ◦ DQ-HIST  Histórico incompleto (DOC. BASE: 1º Aditivo)                    [Cadastrar ▸]   │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Resumo │ Linha do tempo │ Itens e valores │ Alterações │ Responsáveis │ Publicações │ Garantia│
│ Processos SEI │ Pendências │ Histórico                       (Documentos · Execução: fase 2)  │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Resumo]                                                                                     │
│  Regime legal: a confirmar ⚠        Forma: licitação         Natureza: contínuo              │
│  Valor original: R$ 5.996.095,20    Atualizado: R$ 5.996.095,20   Mensal: R$ 249.837,30      │
│  Processo principal: 220001/000207/2024 ↗ SEI       Garantia: exigida · não apresentada ⚠    │
│  Origem: importação de 25/09/2026, linha 28 [ver valores originais]                          │
│                                                                                             │
│ [Saúde ▸ detalhamento]                                                                       │
│  ✔ Gestor designado            ✔ Fiscal designado        ✘ Fiscal substituto designado       │
│  ✔ Portarias publicadas        ✔ PNCP do contrato        ✔ DOERJ do contrato                 │
│  ✘ Fornecedor com CNPJ         ✘ Garantia apresentada    ✘ Regime legal informado            │
│  ✔ Término coerente            ✘ Histórico cadastrado    ✔ Processo SEI vinculado            │
│  ✔ Sem alteração parada                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Aba Linha do tempo** (assinatura, publicações, designações, alterações, alertas e mudanças auditadas, em ordem):

```
 2024-10-11 ● Assinatura do contrato
 2024-10-18 ● Publicação DOERJ
 2024-10-22 ● Início da vigência · Publicação PNCP (dentro do prazo: 7 dias úteis)
 2026-08-25 ● Portaria SEDECSCTI nº 108 — designação de gestor e fiscais
 2026-09-25 ● Importado da planilha (linha 28) · 3 avisos ▸
 2026-10-07 ● ⛔ Alerta VIG-030 aberto · tarefa para o gestor
 2026-10-21 ○ Fim da vigência
```

**Aba Alterações.** Lista as alterações com tipo, nº, situação e etapa (`Rascunho → Análise jurídica → Aguardando assinatura → Assinado → Publicado`), efeito no prazo e no valor, e mostra o acumulado de acréscimos frente ao limite (`8,0% de 25%`). O botão **+ Nova alteração** abre um assistente: tipo, efeito, processo e justificativa. Ao **assinar**, o sistema valida RN-V05 e RN-$03 e mostra a mensagem do bloqueio.

**Aba Responsáveis.** Cada designação mostra papel, pessoa, portaria (nº, data, publicação), início e fim. **Substituir** encerra a designação atual com motivo e abre a nova. Aparecem avisos de FIS-SEG e de afastamento.

**Toda edição de campo sensível** abre um modal: *"Informe o motivo da alteração (fica na trilha de auditoria)"*, com o campo obrigatório (RN-A01).

---

## 4. Pendências
Fonte: `vw_minhas_tarefas`.

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Pendências        (Minhas 4) (Equipe 23) (Campanhas)                    [+ Nova pendência]   │
├──────────┬───────────────────────────────────────────────┬────────────┬──────────┬──────────┤
│Prioridade│ Pendência                                     │ Contrato   │ Prazo    │ Status   │
├──────────┼───────────────────────────────────────────────┼────────────┼──────────┼──────────┤
│ CRÍTICA  │ Vence em 14 dias (21/10/2026)                 │ 0XX/2024   │ 09/10 ⏰ │ Aberta ▾ │
│ CRÍTICA  │ Vencido há 61 dias sem ato de encerramento    │ 0XX/2023   │ 08/10    │ Aberta ▾ │
│ ALTA     │ Responsável afastado: Servidor DEMO (fiscal)  │ 0XX/2025   │ 14/10    │ Andamento│
│ MÉDIA    │ Apostilamento de troca do órgão contratante   │ 0XX/2025   │ —        │ Aberta ▾ │
└──────────┴───────────────────────────────────────────────┴────────────┴──────────┴──────────┘
 Ao concluir: campo "Resultado / providência tomada" (obrigatório). Se a condição do alerta
 persistir, o motor reabre a pendência na próxima execução e mostra o aviso "condição ainda presente".
```

**Campanhas** (`vw_campanhas_progresso`): mostra uma barra de progresso, por exemplo *Apostilamento de troca do órgão: 5 de 20 concluídas · 3 canceladas · 12 pendentes*, e a lista por contrato.

---

## 5. Importação (assistente em 4 passos)
Fontes: `importacoes`, `importacao_linhas`, `fn_importacao_validar`, `fn_importacao_aprovar`.

```
 ① Arquivo ── ② Validação ── ③ Revisão ── ④ Aprovação (outra pessoa)

 ② VALIDAÇÃO · PLANILHA GERAL DE CONTRATOS.xlsx · referência 25/09/2026 · 41 linhas
 ┌──────────────┬──────────────┬──────────────┬──────────────┐
 │ Prontas  38  │ Com erro  2  │ Com aviso 38 │ Ignoradas 1  │
 └──────────────┴──────────────┴──────────────┴──────────────┘
 Erros que bloqueiam
  L38  IMP-DUP  "016/2026 (BRASVIP)" repete o número da L46      [Ajustar número] [Rejeitar linha]
  L46  IMP-DUP  "016/2026" repete o número da L38                 [Ajustar número] [Rejeitar linha]
 Avisos (não bloqueiam; viram pendência DQ-IMPORT)
  IMP-TERM-DIV 16 · IMP-ITENS 25 · IMP-VALOR-GLOBAL 11 · IMP-ORGAO-PREFIXO 2 · …    [Ver por linha]

 ③ REVISÃO DA LINHA 38
 ┌─────────────────┬────────────────────────────┬────────────────────────────┬──────────────────┐
 │ Campo           │ Original (imutável)        │ Normalizado                │ Ajuste do revisor│
 ├─────────────────┼────────────────────────────┼────────────────────────────┼──────────────────┤
 │ Nº contrato     │ 016/2026 (BRASVIP)         │ 016 / 2026 / (BRASVIP)     │ [ vazio       ]  │
 │ Término         │ 24/03/2025                 │ — (anterior ao início)     │                  │
 │ Fim calculado   │                            │ 10/12/2026 (início+prazo)  │                  │
 └─────────────────┴────────────────────────────┴────────────────────────────┴──────────────────┘
                                                        [Salvar ajuste e revalidar]

 ④ APROVAÇÃO — disponível só para quem não carregou o arquivo
   "Serão criados 40 registros (34 instrumentos com início + 6 em formalização)." [Aprovar]
```

---

## 6. Qualidade dos dados
Fontes: `vw_qualidade_orgao`, `vw_contrato_qualidade`, `alertas` (DQ-*), `vw_pessoas_possiveis_duplicadas`.

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Qualidade dos dados                SEDES 47/100 (Crítica) · SEENEMAR 47/100 (Crítica)          │
│ O que mais sobe a nota: (calculado pela tela a partir dos itens abaixo, maior ganho primeiro) │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Problema                              │ Qtd │ Ação em lote                                   │
│ Fornecedor sem CNPJ (DQ-CNPJ)         │  40 │ [Informar CNPJs]  (valida dígito verificador)   │
│ Regime legal não informado            │  34 │ [Classificar 8.666 / 14.133]                    │
│ Término divergente (DQ-TERM)          │  16 │ [Revisar] mostra informado × calculado          │
│ Histórico incompleto (DQ-HIST)        │  15 │ [Cadastrar contrato original e aditivos]        │
│ Valores inconsistentes (DQ-VALOR)     │  11 │ [Revisar itens]                                 │
│ Grafias parecidas de servidores       │   4 │ [Comparar e fundir] (fn_fundir_pessoas)         │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Administração
Fontes: `parametros`, `regras_alerta`, `regras_alerta_orgao`, `usuario_perfis`, `feriados`, `listas`.

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Administração   Órgãos │ Usuários e perfis │ Regras de alerta │ Parâmetros │ Feriados │ Listas│
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ ⚠ 14 parâmetros aguardam confirmação da área                              [Ver só pendentes] │
│ Parâmetro                         │ Valor            │ Situação                               │
│ Convenção de término              │ EDATE − 1  ▾     │ ⚠ REGRA A CONFIRMAR (29.2 nº 1)        │
│ Prazo DOERJ (dias corridos)       │ 20               │ ⚠ VALIDAR REGULAMENTAÇÃO ESTADUAL/RJ   │
│ Marcadores "não se aplica"        │ N/C              │ ⚠ REGRA A CONFIRMAR (29.2 nº 2)        │
│ …                                                                                            │
│ Regras de alerta: código · nome · severidade · parâmetros · ativa (global | por órgão) · tarefa│
│ Alterações aqui também exigem motivo e ficam na auditoria.                                   │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Telas sem wireframe próprio no MVP

| Tela | Conteúdo |
|---|---|
| Novo contrato | Assistente em 4 passos: identificação → partes e objeto → vigência e valores → responsáveis. Valida RN-D01, RN-V06 e CNPJ |
| Fornecedores / Pessoas | Lista com busca, ficha com contratos e designações, carga por pessoa e afastamentos |
| Auditoria | Filtros por tabela, contrato, usuário e período. Mostra antes × depois, campos alterados e motivo |
| Relatórios | Vigências, pendências e executivo, exportados em Excel ou PDF (Edge Function) |
