# Melhorias da carteira de contratações

Levantamento feito na análise do sistema em 25/09/2026. Itens registrados para implementação futura.

## Já implementado

- **Leitura paginada da carteira** — a API do Supabase devolve no máximo 1.000 linhas por consulta e ignora
  `.limit()` maior sem avisar. Painel, Evolução, Agenda, Relatórios e exportação da Auditoria passaram a ler em
  páginas de 1.000 com ordenação estável (`lerTodas` em `src/lib/supabase.ts`). Sem isso, a partir de ~31
  demandas os números da carteira ficariam incompletos.

## Pendentes

Os itens 1, 3, 4 e 6 são os sugeridos para a próxima rodada (maior impacto, pouca dependência do banco).

### Ajustes

| # | Melhoria | Situação atual | Proposta |
|---|---|---|---|
| 1 | **Alerta de "atenção" coerente com dias úteis** | `vw_atividades` liga o alerta com 3 dias **corridos**, mas "dias restantes" conta dias **úteis** nos prazos do PRODERJ. Numa sexta, pode mostrar "3 dias úteis" sem alerta. | Usar `dias_restantes` (já em dias úteis quando é o caso) para definir `atencao`. |
| 2 | **Resumo da carteira calculado no banco** | O Painel baixa todas as atividades e faz as contas no navegador. | Criar view/função de resumo no banco: mais rápido e sempre coerente entre telas. |

### Gestão de carteira

| # | Melhoria | Situação atual | Proposta |
|---|---|---|---|
| 3 | **Contratações paradas** | O Painel só conta as que não têm nenhuma data de andamento. | Mostrar dias sem andamento de cada contratação, com alerta acima de um limite (ex.: 15 dias). |
| 4 | **Data-meta em risco** | O campo `data_meta` é cadastrado, mas só aparece na Agenda. | Projetar a conclusão pelas atividades restantes e sinalizar "em risco" quando passar da meta. |
| 5 | **Prioridade calculada** | Alta/Média/Baixa digitada à mão. | Nota automática combinando valor, prazo legal, meta, vencimento da ata e tempo parado, para ordenar a lista. |
| 6 | **Atas vencendo** | Vencimento da ata aparece só na Agenda. | Alertar quando a ata vinculada a uma contratação em andamento vence em menos de 60 dias (sem ata válida, a adesão para). |
| 7 | **Valor por etapa e modalidade** | Só o valor total estimado. | Mostrar quanto da carteira, em reais, está em cada etapa e modalidade. |
| 8 | **Retrato semanal da carteira** | A série da aba Evolução usa só as datas de conclusão. | Gravar uma foto semanal no banco para mostrar tendência real (entradas, saídas, estoque por etapa). |
