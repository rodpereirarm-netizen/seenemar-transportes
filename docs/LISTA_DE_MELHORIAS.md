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
O gerador preenche o próprio arquivo do modelo da DIP (SUBENEMAR "Cidades Eficientes") com os dados do banco. **Implementado na v38 (entregue para publicação em 04/11/2026).** Botões na página do projeto (cabeçalho da EAP) e no Status Report Individual.

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
- **Decisões tomadas em 04/11/2026 (todas aprovadas):**
  - impressão em 1 página, como no modelo;
  - quadro PRIORIDADE em branco;
  - datas das macroetapas pelo MÍNIMO/MÁXIMO das etapas (diferem do gravado em 33 datas);
  - marco crítico SIM/NÃO conforme o sistema.
- **Situação:** APROVADA para implementar. A implementação aguarda as pendências da aba KPIs serem resolvidas (pedido do usuário em 04/11/2026).
- **Dados a corrigir no banco, que aparecem na DIP:**
  - Projeto 06: início "20206-07-01";
  - Projeto 42: etapa 1.2 com fim "20206-05-15";
  - Projetos 25 e 26: etapas soltas na mesma posição de macroetapas.
- **Junto com o card em PowerPoint (item 1.3), as exportações do projeto passam a oferecer DIP (Excel) e card (PPTX).**

### 1.3 Card do projeto em PowerPoint editável (prévia e decisões aprovadas em 04/11/2026)
O gerador preenche o próprio slide do modelo `pit_agro_editavel.pptx` (Book de Transição) com os dados do banco. Os números vêm da mesma função do Status Report individual. **Implementado na v38 (entregue para publicação em 04/11/2026).** Botões na página do projeto, no Status Report Individual e, em lote, no Status Report Consolidado.

- **Editável:** caixas de texto, cartões (formas) e a tabela de macroatividades (tabela nativa). Nada vira imagem.
- **Igual ao modelo:** A4 paisagem; fontes Cambria/Calibri; cores; faixas; pílula de status; ✓ na Situação atual; cabeçalho e rodapé do Book.
- **Encaixe:** a fonte só diminui na parte que não cabe (até 75%, mínimo 7 pt). Se ainda não couber, o card sai em 2 slides ("CARD 1/2" e "CARD 2/2"). Com os dados de 03/11, isso ocorreu em 4 dos 69 projetos: 14, 22, 55 e 72.
- **Testes com os 69 projetos (73 slides):**
  - 26.592 verificações independentes, 0 falhas;
  - validador oficial do formato: 70 de 70 arquivos aprovados;
  - controle negativo: 6 de 6 erros plantados detectados;
  - o mesmo gerador no navegador produz arquivos idênticos (25 ms por card; 0,4 s o deck com os 69).
- **Decisões tomadas em 04/11/2026 (todas aprovadas):**
  - data das macroetapas igual à da DIP (maior data das etapas);
  - card em 2 slides quando não couber;
  - só a sigla do setor no topo (o banco não tem o nome por extenso);
  - "Entregas programadas para 2026" vazio, como no modelo;
  - exportar nos dois lugares: um card na página do projeto e um arquivo com vários cards em Relatórios (projetos do filtro).
- **Como implementar:**
  - botão "Exportar card (PowerPoint)" ao lado de "Exportar DIP (Excel)", mais a opção em lote em Relatórios;
  - usa a SheetJS que o sistema já tem;
  - modelo e tabela de larguras das fontes embutidos no `index.html` (cerca de +60 KB);
  - nenhuma mudança no banco.
- **Situação:** implementado na v38, junto com a DIP. Testes no sistema com os dados de 04/11: DIP com 324.029 verificações e card com 26.593, 0 falhas; 72 de 72 PowerPoint aprovados pelo validador.

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
- **Numeração dos projetos: opção A APROVADA em 04/11/2026; v42 entregue para aplicação (script do banco + index.html).**
  - **Situação em 04/11:** 69 projetos de 01 a 76, com lacunas no 34 (excluído em 03/11) e no 56 a 61 (excluídos em 28/10). A regra do número novo preenchia a primeira lacuna, então o próximo projeto seria o "Projeto 34".
  - **v42:**
    - renumera 36 projetos (35–55 → 34–54; 62–76 → 55–69) e a carteira fica de 01 a 69;
    - o número novo passa a ser "maior já usado + 1", sem reaproveitar número excluído; o próximo será o 70;
    - a auditoria não é alterada: a tela v42 segue as trocas de número a partir de 04/11/2026 e identifica os projetos excluídos;
    - as trocas de 28/09 e 27/10 não têm registro confiável, então o histórico desse período continua como estava.
  - **Testes em cópia local com os dados reais:**
    - ida e volta exatas;
    - travas de segurança;
    - histórico dos 69 projetos idêntico antes e depois;
    - sem a v42, 36 projetos teriam histórico errado.
  - **Ordem de aplicação:** publicar o index.html v42, rodar o script, recarregar a página e enviar a tabela de números às áreas.
- **Perfil "Orçamento": APROVADO em 04/11/2026; v43 entregue para aplicação (script do banco + index.html).**
  - **Pedido:** um perfil para o dono das informações do PPA e da LOA (primeiro chamado "Controller", renomeado para "Orçamento"). Ele acessa qualquer projeto, em qualquer situação, e edita somente o PPA e a LOA.
  - **Decisões:** sem Auditoria, sem Conversas, sem manter a lista de referência do PPA/LOA e sem delegação.
  - **Banco:**
    - o valor `orcamento` passa a ser aceito no cadastro de usuários;
    - entra nas 9 regras de leitura em que o perfil `leitura` já aparece;
    - entra na função `fn_salvar_ppa_loa`, para qualquer projeto;
    - nenhuma regra de alteração inclui o perfil, então tudo o mais é barrado pelo próprio banco.
  - **Tela:** botão "Editar PPA/LOA", que abre só o formulário do PPA/LOA, com "Salvar PPA/LOA" e "Cancelar". Fora isso, a tela é igual à do perfil leitura.
  - **Testes:**
    - banco: 44 de 44, com as regras de acesso conferidas por md5 contra o Supabase; desfazer volta exatamente ao original;
    - tela: 23 de 23; os demais perfis ficam idênticos à v42 em 69 fichas e 6 telas.
  - **Ordem de aplicação:**
    1. rodar o `SCRIPT_BANCO_v43.sql`;
    2. publicar o `index.html` v43;
    3. o admin atribui o perfil em Configurações → Usuários e perfis.
- **(histórico) Numeração dos projetos: fechar a lacuna 56–61 (proposta de 03/11/2026; substituída pela opção A de 04/11/2026).**
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
- **Pendências da aba KPIs: decisões de 04/11/2026.**
  - **Bloco A, APROVADO (só apresentação):**
    - os 7 ajustes da v38 listados acima, menos o item 8 (testes), que acompanha a implementação;
    - título do gráfico de evolução com o recorte em uso;
    - aviso de "amostra pequena" quando a base tiver menos de 10 projetos;
    - texto "foto da semana, gravada no primeiro acesso" no lugar de "foto de toda segunda-feira".
  - **Bloco C, APROVADO:**
    - uma só definição de avanço, com os projetos sem medição à parte (propostas 2 e 3);
    - arredondamento "meio para cima" no sistema todo (proposta 7);
    - nomes das listas "Maior risco" (KPIs) × "Mais atrasados" (Painel Executivo) (proposta 4).
  - **Bloco B (regra da projeção): estudo concluído e solução APROVADA em 04/11/2026.** Foram comparadas 8 regras com backtest nas fotos semanais, coerência com a situação gerencial, estabilidade e casos reais.
    - **Solução recomendada:**
      - previsão de conclusão e linha de projeção pelo **Earned Schedule com a linha de base da EAP** (SPI(t) e IEAC(t), prática de mercado);
      - sinal de curto prazo "último avanço registrado em dd/mm (há N semanas)", com alerta a partir de 4 semanas;
      - projetos sem linha de base (hoje 17) com "projeção indisponível";
      - a regra dos 25% e o item 1a (janela) deixam de ser necessários.
    - **Efeito em jan/27:** carteira 58,0% → 49,1%; não priorizados 45,6% → 32,8%; priorizados 79,6% → 77,6%. O Projeto 09 passa de "jan/27, no prazo" para "jul/27, depois do prazo".
    - **Limitação:** o sistema não guarda a linha de base original. Melhoria futura: congelar as datas previstas na aprovação da EAP.
  - Itens 5 (Radar) e 6 (Dashboard 58% · 48%): aguardam autorização (fora da v38).
  - **v38 entregue para publicação em 04/11/2026: blocos A, B e C, mais as exportações DIP (1.2) e card (1.3).** Detalhes e testes no `LEIA-ME_v38.md` do pacote.
    - **Números com os dados de 04/11:**
      - carteira 30% → 35% (59 com medição, 10 sem medição);
      - não priorizados 17% → 22%;
      - priorizados 58%, sem mudança.
    - **Projeção em jan/27:**
      - priorizados 78,7%; não priorizados 42,7%; carteira 55,5%;
      - difere do estudo porque usa a base do bloco C, parte do avanço de hoje e usa os dados de 04/11.
    - **Efeito do arredondamento na origem:**
      - 4 macroetapas dos Projetos 14 e 19, com todas as etapas em 100%, davam 99,99999…% na v37 e geravam alertas falsos de atraso;
      - na v38: sino 300 → 296;
      - o Projeto 19 passa de Em Atenção a Em Dia (Painel Executivo 7 · 1 → 6 · 2; Recuperação 16 → 15).
    - **Tabela mensal da projeção:** ajustada para caber em telas de 901 a 1440 px (0 textos cortados nos 69 projetos, em 8 larguras).
  - **v39 entregue para publicação em 04/11/2026: quadro "Evolução" da aba KPIs por série encadeada (aprovado em 04/11).**
    - **Problema:** a Evolução mostrava a carteira em 40,0% e o Dashboard em 35%, e os priorizados em 57,4% × 58%. A linha usava só os 45 projetos com foto em todas as semanas; os 14 cadastrados depois de 28/09 ficavam fora.
    - **Solução:**
      - o último ponto é a média real da foto mais recente, com todos os projetos com medição;
      - os anteriores são reconstruídos pela variação semanal dos projetos presentes nas duas fotos;
      - legenda, rodapé e tooltip explicam que os pontos antigos não são a média registrada naquela semana;
      - "hoje" aparece ao lado (o mesmo valor do Dashboard).
    - **Números:** carteira 34,5% na foto de 02/11 e 34,7% hoje; priorizados 58,0% e 58,4%.
    - **Testes:** 882 verificações contra referência independente, 0 falhas; regressão de 75 de 78 telas idênticas (só a aba KPIs muda).
    - **Observado, não alterado:** com o filtro Status Concluído, o eixo do gráfico vai a 125% (mesmo comportamento da v38). Pode ser limitado a 100% se autorizado.
- **v40 entregue para publicação em 04/11/2026 (decisões de 04/11): numeração automática da EAP + "Limpar filtros" da aba KPIs (opção A).**
  - **Problema (Projeto 27):**
    - a etapa "2.1 Análise de conjuntura…", criada em 04/11, entrou no fim da macroetapa 2 (5ª posição) com o número 2.1 digitado no nome, repetindo a 2.1;
    - o número era só texto do nome, e toda etapa nova ia para o fim, sem como escolher a posição.
  - **Solução:**
    - o número vem da posição, em todas as telas e exportações;
    - o número digitado é escondido na tela, sem reescrever os nomes no banco (decisão 2);
    - campo "Posição" no cadastro e na edição, e setas ↑ ↓ para admin, PMO e executivo;
    - funções do banco `eap_posicionar` e `eap_renumerar` (script `SCRIPT_BANCO_v40.sql`, a rodar antes de publicar) renumeram as irmãs e o "Código na EAP" de uma vez (decisão 4);
    - as 41 etapas sem macroetapa ficam como estão (decisão 3).
  - **Correção junto:** na importação de planilha, linha nova entrava com ordem 0 (no começo); agora entra no fim, e a EAP é renumerada.
  - **KPIs:** o "Limpar filtros" também volta o período da Evolução para 6 semanas.
  - **Testes:**
    - script testado num PostgreSQL local com os 918 registros reais, auditoria, índice único e regras de acesso: 13 de 13 casos, 0 códigos duplicados;
    - tela: 41 de 41 verificações;
    - DIP e card com 0 falhas;
    - regressão de 90 telas sem erro de JavaScript.
- **v41 entregue para publicação em 04/11/2026 (decisões 1 a 4 "OK"):**
  - **Etapas e marcos vencidos:** a janela ganha as abas "Etapas (N) / Projetos (N)" e "Marcos / Projetos", com as etapas listadas pelo maior atraso.
  - **Listas da aba KPIs:** páginas de 12 linhas.
  - **"Qualidade dos dados":** cada item incompleto vira link para os projetos sem a informação.
  - **Ficha do projeto:** "Possui investimento? Sim / Não", gravado ao clicar com confirmação.
    - É uma coluna nova no banco, com a mesma trava de gerente e sponsor.
    - "Não" conta como preenchido na qualidade e sai da base do custo médio.
    - A DIP mostra "Sem investimento".
  - **Script `SCRIPT_BANCO_v41.sql`:** o passo 3, opcional, marca os 6 projetos com o texto "Sem custo" (31, 44, 46, 47, 55 e 65).
  - **Testes:**
    - tela: 24 de 24;
    - DIP e card com 0 falhas;
    - regressão de 93 telas sem erro de JavaScript;
    - script testado em PostgreSQL local.
- **Percentuais do Dashboard Carteira × Painel Executivo × KPIs (análise de 03/11/2026).**
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
