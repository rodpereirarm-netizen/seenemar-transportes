# Lista de melhorias — Sistema de Projetos SEDES

Itens aprovados como ideia, **sem autorização de implementação ainda**. Nada desta lista deve ser implementado sem autorização expressa.

## 1. Exportar projeto para Excel (registrado em 28/10/2026)
Botão no sistema que gera um arquivo Excel por projeto.

- **Situação:** testado fora do sistema (opção 4) com o Projeto 22 – Programa de Capacitação Profissional e de Empregabilidade. Aprovado ("ficou ótimo"). Implementação no sistema adiada.
- **Formatos testados:**
  1. **Exportação simples**: só as abas "Identificação do Projeto" e "Importar Etapas", com os dados e sem fórmulas. Pode ser reimportada.
  2. **Modelo de Importação v35 preenchido**: inclui as listas e a verificação automática ("PRONTA PARA IMPORTAR"). Pode ser reimportado.
  3. **Layout da DIP ("Modelo Projeto")**: a EAP se ajusta ao número de linhas do projeto. Serve só para leitura e apresentação. O importador recusa esse layout sem gravar nada.
- **Testes feitos:**
  - os dados exportados conferem com o banco (assinatura md5);
  - a reimportação dos formatos 1 e 2 na v35 não alterou nenhum campo: 0 itens criados e 76 linhas atualizadas com os mesmos valores;
  - o controle negativo detectou a mudança de 1 dia numa data.
- **Pontos para decidir na implementação:**
  - quais formatos o botão vai oferecer;
  - no layout da DIP, as datas das macroetapas saem como gravadas no sistema, e não pelo MIN/MAX das etapas. Nas macroetapas 4 a 8 do P22 elas diferem;
  - campos da DIP que não existem no sistema (Prioridade, Sinalização do risco) saem em branco;
  - a DIP de origem tinha ligações externas e nomes com #REF!. Eles foram removidos.

### 1.1 Exportar a EAP para o Excel: opções A e B (prévia aprovada para a lista em 29/10/2026)
O usuário escolheu as opções **A** e **B**. A prévia foi montada numa cópia local do v35 e testada. **Não está implementada nem publicada.**

- **A: EAP de um projeto (volta para o sistema).**
  - Botão "Exportar EAP (Excel)" no painel da EAP da página do projeto.
  - Gera as abas "Identificação do Projeto" e "Importar Etapas", com os mesmos nomes de campos e colunas do Modelo v35, mais a aba "Leia-me".
  - Usa a biblioteca que o sistema já tem (SheetJS).
- **B: EAP da carteira (só para análise).**
  - Fica em dois lugares:
    - no menu "Exportar" do topo, item "EAP da carteira (Excel)", com todos os projetos que o usuário vê;
    - em Report Projetos › Consolidado, botão "Exportar EAP (Excel)", com os projetos do filtro da tela.
  - Gera três abas:
    - "EAP da carteira": uma linha por etapa e 23 colunas com filtro;
    - "Resumo por projeto";
    - "Sobre": data, usuário e filtros usados.
- **Testes feitos** com a foto do banco de 28/10/2026 (838 linhas) e o banco simulado:
  - A: exportação e reimportação dos 62 projetos com EAP. Nenhuma linha foi alterada, criada ou excluída, e não houve erros nem avisos;
  - B: as 838 linhas conferem com o banco, e o filtro "Só prioritários" trouxe os 21 projetos e as 232 linhas esperados;
  - as datas foram testadas no fuso de Brasília, sem diferença de dia.
- **Pontos para decidir na implementação:**
  - **Linhas sem Código EAP:** são 291 linhas em 32 projetos. No formato A elas saem com o código em branco, e o Leia-me avisa. A importação as ignora.
  - **Efeitos do importador atual na reimportação:** 26 campos de texto vazios em 17 projetos passam a "sem valor", o que fica registrado na auditoria. No Projeto 41, o status antigo "Em Avaliação" vira "Em Revisão".
  - **Aparência:** as planilhas saem sem cores nem negrito, porque a biblioteca atual não grava formatação.
  - **Progresso:** o formato A traz o valor gravado em cada linha; o formato B traz o valor calculado, igual ao da tela.
- **Opção C, para depois:** gerar o Modelo de Importação preenchido, com listas e verificação.
  - A prova técnica com a biblioteca ExcelJS funcionou.
  - Exige corrigir o defeito da biblioteca nas validações de data.
  - Exige refazer a aba "Listas" com os dados do momento.
  - Exige uma versão nova do Modelo de Importação, com intervalos de lista maiores.
- **Opção D (layout da DIP):** substituída pelo item 1.2, que já foi testado no navegador.

### 1.2 Exportar DIP (Excel) no layout do modelo (prévia aprovada em 03/11/2026, "arquivo bem construído")
O gerador preenche o próprio arquivo do modelo da DIP (SUBENEMAR "Cidades Eficientes") com os dados do banco. **Não está implementado nem publicado.**

- **O que fica igual ao modelo:**
  - fontes, cores, bordas, logotipo e ícone;
  - formatação condicional da macroetapa e barras de progresso;
  - listas SIM/NÃO e BAIXA/MÉDIA/ALTA;
  - impressão em 1 página.
- **Fórmulas:**
  - progresso pela MÉDIA, datas pelo MÍNIMO/MÁXIMO, dias, dias restantes e métricas;
  - aba oculta "Planilha1" com uma linha por etapa.
- **Testes com os 69 projetos (foto do banco de 03/11/2026):**
  - 324.031 verificações independentes, 0 falhas;
  - recálculo sem erros de fórmula;
  - progresso igual ao do sistema nos 69;
  - sem erro novo de esquema;
  - controle negativo: os 5 erros plantados foram detectados;
  - o mesmo gerador no navegador produz arquivos idênticos (26 ms o maior).
- **Como implementar:**
  - botão "Exportar DIP (Excel)" na página do projeto;
  - usa a SheetJS que o sistema já tem;
  - o modelo fica embutido no `index.html` (cerca de +140 KB);
  - nenhuma mudança no banco;
  - a EAP é relida só do projeto exportado (evita o limite de 1.000 linhas).
- **Decisões pendentes (recomendação entre parênteses):**
  - impressão em 1 página (sim, como no modelo);
  - quadro PRIORIDADE em branco (sim);
  - datas das macroetapas pelo MÍNIMO/MÁXIMO das etapas (sim; diferem do gravado em 33 datas);
  - marco crítico SIM/NÃO conforme o sistema.
- **Dados a corrigir no banco, que aparecem na DIP:**
  - Projeto 06: início "20206-07-01";
  - Projeto 42: etapa 1.2 com fim "20206-05-15";
  - Projetos 25 e 26: etapas soltas na mesma posição de macroetapas.
- **Junto com o card em PowerPoint (item 1.3, em análise), as exportações do projeto passam a oferecer DIP (Excel) e card (PPTX).**

## Pendências anteriores (registradas no histórico)
- Correções de dados no banco: datas digitadas como "20206", início depois do fim, projetos marcados como manuais, projetos sem status. Exemplo: o Projeto 06 tem início 20206-07-01.
- Mover os anexos ao renumerar um projeto.
- **Aba KPIs (Visão Executiva): v36 entregue para publicação em 29/10/2026.**
  - As 6 decisões foram confirmadas: barras por Subsecretaria (opção Pilar); "Em risco" = críticos; "Dentro do prazo" = em dia ÷ total; matriz Situação × Prioridade; todos os perfis veem (gerente e sponsor só os próprios projetos); custo médio só com metade dos projetos com investimento.
  - Inclui a prevenção da foto semanal: só é gravada com a EAP carregada.
  - Fica para depois: matriz Risco × Impacto (precisa de campos novos) e o indicador "Conclusão no prazo".
- **Risco: carga da EAP limitada a 1.000 linhas (registrado em 29/10/2026).**
  - O sistema lê toda a EAP numa única consulta. Hoje são 918 linhas, e o Supabase devolve no máximo 1.000 por consulta na configuração padrão.
  - Ao passar de 1.000 linhas, as etapas excedentes sumiriam de todas as telas, sem aviso.
  - Conferir em Supabase › Project Settings › API › "Max rows".
  - Correção proposta: carregar a EAP em páginas, numa versão própria, com teste de regressão.
- **Foto semanal de 05/10/2026:** a aba KPIs desconsidera essa foto (gravada sem a EAP carregada). Correção de 03/11/2026: o Painel Executivo **não** tem gráfico semanal; ele mostra o avanço de hoje. A afirmação anterior, de que um gráfico do Painel Executivo ainda mostrava essa foto, estava errada.
- **Ajustes na aba KPIs, a fazer na v38 (verificados em 29/10/2026; aguardam autorização).** Os números conferiram com os dados de 29/10: 1.364 verificações contra a referência independente, 18 contra as outras telas e os 70 projetos na projeção individual. Os problemas são de apresentação:
  1. **Foto de 05/10:** tirar o círculo solto "desconsiderada" e marcar a data no eixo como "05/10 · foto inválida", com a explicação no ⓘ.
  2. **Variação zero:** mostrar "= sem variação", em cinza, no lugar de "▲ +0,0 p.p.".
  3. **Gráfico do projeto individual, rótulos:** em 38 dos 70 projetos, textos se sobrepõem ("projeção →", "hoje" × "100% em…", "prazo" sobre pontos e rótulos "0,0"). Corrigir a posição dos rótulos e mostrar o valor só onde a linha muda.
  4. **Gráfico do projeto individual, período:** limitar a 12 meses, com aviso quando a conclusão projetada ficar fora do gráfico (ex.: Projeto 04, mar/2029).
  5. **Tabela mensal:** no máximo 12 colunas; hoje chega a 25 e corta os números.
  6. **Ritmo necessário com menos de 30 dias até o prazo:** mostrar "faltam X p.p. em N dias" no lugar de p.p./mês. Hoje aparecem valores como 2.714 p.p./mês no Projeto 04.
  7. **Seletor e textos:** nome completo do projeto no seletor; "sem data de início" (e não "sem início e prazo") quando só falta o início, como no Projeto 05.
  8. **Testes novos (sobreposição de textos em todos os projetos) entram na bateria da v38.**
- **Numeração dos projetos: fechar a lacuna 56–61 (proposta de 03/11/2026; aguarda autorização).**
  - **Situação:** 70 projetos numerados de 01 a 76. A faixa 56–61 ficou vazia com a exclusão de 6 projetos em 28/10. O número automático preenche a primeira lacuna, então o próximo projeto novo receberia "Projeto 56", fora da ordem.
  - **Proposta:** renumerar 62→56, 63→57, 64→58, 65→59, 66→60, 67→61, 68→62, 69→63, 70→64, 71→65, 72→66, 73→67, 74→68, 75→69 e 76→70. A ordem se mantém, a carteira fica de 01 a 70 e o próximo projeto novo passa a ser o 71.
  - **Como:** script SQL "tudo ou nada" com a função oficial `fn_renumerar_projeto`, que grava uma observação com a justificativa em cada projeto. As 10 tabelas ligadas acompanham o número (ligações em cascata). Nenhum dos 15 tem anexo.
  - **Cuidado com o histórico (Registro de Alterações):**
    - remarcar os 30 registros dos excluídos como "Projeto 56 (excluído em 28/10/2026)" etc., para não aparecerem no novo Projeto 56;
    - levar para o número novo os 66 registros próprios dos 15 projetos e os 53 registros de etapas e observações dos Projetos 73 a 76.
  - **Testes:** antes de entregar, testar num banco local com a mesma estrutura, gatilhos e permissões.
  - **Fora do sistema:** cards, planilhas DIP e apresentações com os números antigos não mudam sozinhos (ex.: "Projeto 75/76" da SUBICS, "Projeto 72" dos cards). Avisar as áreas.
  - **Alternativa de menor risco:** manter a lacuna e mudar o número automático para seguir do maior (Projeto 77).
  - **Cadastros incompletos vistos na mesma análise:** Projetos 62, 63 e 64 sem status, gerente e prazo; Projeto 66 sem subsecretaria.
- **Percentuais do Dashboard Carteira × Painel Executivo × KPIs (análise de 03/11/2026; aguarda autorização).**
  - **Situação verificada:** todas as contagens fecham entre as três telas (situações, concluídos, matriz, setores, qualidade dos dados). Os números conferem com o banco e com as regras do sistema; a conferência foi feita com as funções da v37 e com uma referência separada em Python. O risco está nas médias e na projeção, que usam bases diferentes com o mesmo nome.
  - **1. Projeção sem as semanas de cadastro de EAP.**
    - O ritmo de cada projeto deixa de contar o intervalo entre duas fotos em que o projeto teve etapas cadastradas. Sinal usado: a data de criação das etapas; o reteste pela auditoria dá o mesmo resultado.
    - **Simulação com os dados de 03/11:**

      | Grupo | Ritmo hoje | Ritmo proposto | Jan/27 hoje | Jan/27 proposto |
      |---|---|---|---|---|
      | Não priorizados | 13,0 p.p./mês | 1,1 | 45,6% | 21,8% |
      | Priorizados | 22,6 | 6,7 | 79,6% | 67,3% |
      | Carteira | 16,5 | 3,1 | 58,0% | 38,3% |

    - Nos não priorizados, "concluem até o prazo" passa de 12 para 0 e "sem avanço" de 14 para 32.
    - **Regra dos 25%, EM SUSPENSO para estudo:** contar como carga só quando entram pelo menos 25% das etapas do projeto. Com ela, os priorizados ficam em 8,5 p.p./mês e os não priorizados não mudam.
    - **Limitação:** progresso digitado em lote em etapas que já existiam não é detectado.
  - **1a. Janela do ritmo (estudar junto com a regra dos 25%).**
    - A tela diz "últimas 4 semanas", mas, como a foto de 05/10 é desconsiderada, a conta usa 28/09→02/11, que são 5 semanas.
    - Exemplo, Projeto 09 (EVTEA):
      - o avanço foi de 27% para 51,7% numa única atualização da EAP, em 30/09, e não mudou desde então;
      - com 5 semanas, a tela mostra +21,5 p.p./mês e "conclusão em jan/2027";
      - com as últimas 3 semanas válidas, o ritmo é 0 ("sem avanço").
    - **Opções:** corrigir só o rótulo, ou usar a janela real de 4 semanas.
  - **2 e 3. Uma só definição de avanço, com os projetos sem medição à parte.**
    - Os 10 projetos sem nenhuma medição (32, 33, 35, 36, 41, 45, 62, 63, 64 e 66, todos não priorizados) saem das médias e aparecem como "X sem medição".
    - **Efeito:**
      - carteira de 30% para 35%;
      - não priorizados de 17% (Dashboard) e 18,6% (KPIs) para 22%;
      - SUBICS de 29% para 36%, passando a AGERIO;
      - SUBENEMAR de 25% para 28%;
      - priorizados sem mudança (58%).
    - Exige uma nota de mudança de metodologia.
  - **4. Listas de urgência com nomes claros.**
    - Painel Executivo, "maior atraso": 14, 06, 08, 04, 17.
    - KPIs, Top 5 "maior risco": 06, 08, 04, 13, 05.
    - O Projeto 14 (75 dias de atraso, "em atenção") não aparece no Top 5.
    - **Recomendado:** manter as duas regras e nomear "Mais atrasados" × "Maior risco".
  - **5. "Requerem atenção" em projetos e correção do Radar.**
    - Hoje são 199 itens do Radar em 31 projetos; a proposta é mostrar 47 projetos críticos ou em atenção.
    - **Falha encontrada:** o Radar ignora macroetapas sem etapas filhas, que pela regra do sistema contam como etapa.
      - Hoje, 6 críticos ficam sem nenhum item: Projetos 03, 06, 07, 08, 10 e 28. O 06 é o 1º do Top 5.
      - Com a correção, o Radar passa a 228 itens em 38 projetos, e só o Projeto 28 fica sem item.
      - Afeta o Dashboard, o Alerta Gestão e o Meu Painel.
  - **6. Dashboard:** mostrar "58% · em andamento 48%" nos priorizados. Nenhum número muda.
  - **7. Arredondamento "meio para cima" no sistema todo.**
    - Hoje o mesmo ",5" sai para cima nos Projetos 29 e 53 e para baixo nos 14 e 50 (ruído de ponto flutuante).
    - Mudam 4 valores na tela: Projeto 14 (87% → 88%), Projeto 50 (37% → 38%), macroetapa 1 do Projeto 50 (37% → 38%) e a média do CGREE (87% → 88%).
  - **Observados nos prints de 03/11 (KPIs):**
    - **Título do gráfico:** diz "Evolução da Carteira" mesmo com filtro. Por exemplo, Pilar Integridade: 5 projetos, base de 4, porque o Projeto 21 não tem todas as fotos. O título deveria dizer qual recorte está sendo mostrado.
    - **Base pequena:** com 4 projetos, cada um pesa 25% da média. Mostrar um aviso de "amostra pequena".
    - **"Foto de toda segunda-feira":** a foto é gravada no primeiro acesso da semana. Já houve fotos gravadas na terça, quarta e quinta (a de 02/11 foi gravada em 03/11). Ajustar o texto.
    - **Já listados nos ajustes da v38:** "▲ +0,0 p.p." em verde para variação zero e "sem início e prazo" quando falta só o início (Projeto 09 tem prazo em 15/04/2027).
  - **Como implementar:**
    - versão própria, junto com os ajustes da v38;
    - só o `index.html`, sem mudança no banco;
    - ordem sugerida: 5, 1, 2 e 3, 7, 4 e 6;
    - publicar com uma nota de mudança de metodologia.
- **Configurações: retirar o texto "Prioritário pela Área" (opção 1 escolhida em 03/11/2026; implementar depois).**
  - **Situação:** a tela de Configurações descreve um "Prioritário pela Área — ranking interno, apenas indicativo", mas isso nunca foi construído. Não há onde marcar nem onde exibir.
  - **No banco:** a coluna `prioridade_area` (sim/não) está desmarcada nos 69 projetos e nunca foi alterada (nenhum registro no histórico).
  - **O que fazer:** tirar esse parágrafo da tela de Configurações. Manter o texto do "Prioritário pelo Executivo", que é a única prioridade em uso.
  - **O que não muda:** a coluna fica no banco, sem efeito. Nenhum dado é alterado.
- Migração institucional (Windows Server + PostgreSQL): EM ESPERA. O plano está em `docs/migracao-institucional/PLANO_MIGRACAO_INSTITUCIONAL.md`.
- GND: trocar "2. Outras Despesas" por "3. Outras Despesas Correntes" (classificação oficial)? Depois disso, retirar a aceitação do código '3' no banco? Aguarda decisão.
