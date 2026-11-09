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

## 2. PPA na aba KPIs e origem dos valores nos quadros de orçamento (layout aprovado em 05/11/2026)
**v46 entregue para publicação em 06/11/2026** (pacote `ENTREGA_v46`): `index.html` mais o script opcional `SCRIPT_BANCO_v46_programas_PPA.sql` (os 37 programas).
- **Testes:** 41 de 41.
- **Comparação com a v45:** 504 de 510 telas idênticas; só a aba KPIs muda.
- **Hoje:** o banco tem 0 PPA e 0 LOA, então os quadros aparecem com o aviso "ainda não disponível". As maquetes C1 a C3 e D0 a D7 usaram dados fictícios, com a faixa "SIMULAÇÃO · DADOS FICTÍCIOS".

- **Problema:** o quadro "Execução Orçamentária" usa só a LOA (`renderKpiOrcamento`). O PPA aparece só na ficha do projeto e não entra em nenhum indicador.
- **Opção escolhida: B.** Uma linha nova com 2 quadros abaixo do atual; o quadro de LOA fica como está.
  - **Alinhamento ao PPA:** cobertura (projetos vinculados), meta financeira do exercício, número de programas e de projetos com meta física, barras por programa e chips de ODS. O link "N projetos sem PPA: ver lista" abre a lista de projetos que já existe.
  - **Planejado × executado:** meta financeira do PPA × dotação da LOA × pago, no mesmo exercício, só para projetos com PPA e LOA. O ▲ vermelho marca dotação acima da meta do PPA.
  - Meta física com unidades diferentes não é somada.
  - **Celular:** cartões 2 por linha e tabela inteira dentro do quadro, sem rolagem lateral na página.
- **Clique nos cards (origem dos valores):** o clique abre a janela de lista que já existe (`kpiAbrir`/`renderKpiModal`), com uma tabela nova.
  - **Execução Orçamentária:**
    - aba "Projetos": valores por projeto, com a coluna clicada destacada e usada na ordenação;
    - aba "Linhas de LOA": fonte e GND. **Decisão: manter as duas abas.**
  - **Alinhamento ao PPA:** projeto, programa, meta financeira, meta física com a unidade e ODS. A barra de um programa ou um chip de ODS filtra a lista.
  - **Planejado × executado:** a lista inclui os projetos que ficaram fora da comparação. Clicar numa linha da tabela do quadro abre a ficha do projeto.
  - A linha **Total** de cada coluna tem de ser igual ao valor do quadro. Card e janela usam a mesma função de cálculo: mesmos filtros, mesmo exercício e mesma regra "dotação atualizada; se vazia, a inicial", marcada com *.
  - Sem dados, nada fica clicável. As listas atuais de situação, matriz, qualidade e projeção não mudam.
  - Acesso por teclado: Enter abre, Esc ou "Fechar" fecha.
- **Qualidade dos dados:** novo item "PPA vinculado", ao lado de "LOA (execução)". **Decisão: incluir.**
- **Programas do PPA:** **decisão: usar a lista oficial.**
  - O banco já tem a estrutura: a coluna `projeto_ppa.programa_id` e a tabela `ppa_loa_ref` com tipo `programa` (código, nome, lei e `pai_id` para o ciclo). Hoje há 0 programas cadastrados.
  - Hoje o programa é digitado como texto livre (`programa_txt`). O comentário da v27 diz "texto editável até existirem as listas oficiais".
  - **Passo 1, script SQL rodado pelo usuário:** cadastrar os programas do PPA 2024–2027 (código e nome) a partir da lei do PPA. O sistema não tem tela para manter essas listas.
  - **Passo 2, no sistema:** o campo "Programa" da ficha passa a ser uma lista de escolha. Um texto já digitado continua visível até alguém escolher o programa da lista.
  - Não precisa mudar a estrutura do banco.
  - **Lista recebida em 05/11/2026: 37 programas.** Fonte informada pelo usuário: lei do PPA 2024–2027, principalmente o **Anexo I – Programação Resumida** e o **Anexo II – Programação Completa do Poder Executivo**.
    - 25 finalísticos do Poder Executivo, de 442 a 512;
    - 7 de gestão do Poder Executivo, de 434 a 513;
    - 5 de Outros Poderes e órgãos autônomos: 027, 136, 137, 141 e 515.
  - **Script do passo 1 em rascunho, NÃO executado:** `docs/melhorias/ppa_programas_2024_2027_RASCUNHO.sql`.
    - Grava os programas como filhos do ciclo 2024-2027, com a lei do ciclo (Lei nº 10.276/2024), na ordem da lista.
    - Pode ser rodado de novo sem duplicar nada.
    - Conferência só de leitura no banco, em 05/11/2026: o ciclo foi encontrado e os 37 códigos são novos e distintos.
  - **Ponto a decidir na implementação:** o banco não tem campo para o grupo (finalístico, gestão ou outros Poderes). A ordem da lista mantém os grupos juntos. Se for preciso mostrar o grupo na tela, isso será uma decisão à parte.
- **Testes na implementação:**
  - soma da janela = valor do quadro em cada card, no computador e no celular;
  - as listas existentes não mudam;
  - os estados vazios continuam como hoje: 0 PPA e 0 LOA no banco em 05/11/2026.

## 3. Status geral só manual: fim da conclusão automática (decisão de 06/11/2026)
**v45 entregue para publicação em 06/11/2026** (pacote `ENTREGA_v45`, só `index.html`), junto com os itens 4 e 5.
- **Testes:** 33 de 33.
- **Comparação com a v44:** 463 de 510 telas idênticas; as 47 diferenças são as previstas.

- **Problema:** a função `verificarAutoConclusao` (`index.html`) grava "Concluído" sem confirmação quando o avanço calculado pela EAP chega a 100%.
  - Ela roda ao salvar ou excluir uma etapa e ao voltar o avanço para "automático".
  - Durante a montagem da EAP, uma única etapa com 100% já faz o projeto valer 100%.
  - Quando o avanço cai depois, o status não volta.
- **Casos confirmados na auditoria, todos corrigidos à mão depois:**
  - Projeto 21: 21/10, por 8 min;
  - Projeto 70: 04/11, por 6 min;
  - **Projeto 71: de 04/11 17:43 até 06/11 10:10, cerca de 40 horas;**
  - Projeto 72: 06/11, por 5 min;
  - Projeto 22: 06/11, por 27 min, com o avanço caindo para 56%.
- **Efeito enquanto o projeto fica concluído por engano:** sai de crítico/atenção, para de gerar alertas de prazo e aparece como concluído nos KPIs, no Report e no ticker.
- **Decisão:** o status geral passa a ser **só manual**.
  - Remover a gravação automática.
  - Nenhuma pergunta ou sugestão automática.
  - Nenhuma mudança no banco.
- **Testes na implementação:**
  - montar uma EAP do zero com a primeira etapa em 100%: o status não pode mudar;
  - excluir uma etapa, ou voltar ao avanço automático, deixando 100%: o status também não muda;
  - a escolha manual de "Concluído" continua funcionando, incluindo a data "Concluído em".
- **Conferido em 06/11:** os Projetos 02, 12 e 16 estão "Concluído" com 100% calculado pela EAP e estão corretos.
  - **Observação:** a coluna antiga `projetos.avanco_fisico` (13%, 50% e 0% nesses três) não é atualizada quando o avanço vem da EAP. Ela só é usada quando o projeto não tem EAP ou nenhuma etapa tem percentual.

## 4. Alerta "etapa termina depois da macroetapa" (layout aprovado em 06/11/2026)
**v45 entregue para publicação em 06/11/2026.** O item novo nos KPIs tem o link "ver N com datas a conferir", porque a lista também inclui as datas com ano inválido. As maquetes E1 a E5 foram feitas sobre a cópia de teste de 04/11.

- **Regra:** a etapa tem fim previsto depois do fim previsto da sua macroetapa.
  - A comparação é feita como data, não como texto.
  - Data com ano inválido também gera alerta: por exemplo, "20206-05-15" no Projeto 41.
- **Onde aparece:**
  1. **EAP do projeto:**
     - faixa laranja na macroetapa: "⚠ N etapas desta macroetapa terminam depois do fim dela (data)";
     - aviso em cada etapa, com as duas datas e a diferença em dias ou meses.
  2. **Ao salvar uma etapa:** aviso com a diferença e os botões "Salvar mesmo assim" e "Voltar e corrigir". **Não bloqueia o salvamento.**
  3. **KPIs → Qualidade dos dados:**
     - item novo "Datas da EAP", com X/N projetos sem o problema e o link "ver N com etapa fora da macroetapa ›";
     - o link abre a lista de etapas (projeto, macroetapa, fim da etapa, fim da macroetapa e diferença), com as abas Etapas e Projetos;
     - clicar na linha abre o projeto.
- **Só avisa:** não muda avanço, situação, prazos nem nenhum cálculo.
- **Situação em 06/11/2026:** 15 etapas em 7 projetos: 13, 14, 18, 22 (1.1 com fim em 20/11/2027), 27 (macroetapa 4: 8 etapas), 41 e 58 (2 etapas).
- **Testes na implementação:**
  - contagem igual na EAP, nos KPIs e na lista;
  - etapa sem data, ou macroetapa sem data, não gera alerta;
  - etapas soltas (sem macroetapa) não entram na regra;
  - computador e celular.

## 5. EAP carregada em partes (risco do limite de 1.000 linhas)
**v45 entregue para publicação em 06/11/2026.** Em 06/11 a EAP tinha 928 linhas.
- **Antes:** o sistema lia tudo numa consulta, limitada a 1.000 linhas pelo Supabase.
- **Agora:** lê em partes até terminar.
- **Testado** com limites de 1.000, 300 e 7 linhas e com uma carteira de 1.374 linhas; o avanço de todos os projetos ficou idêntico.
- **Configurações:** na mesma versão, saiu o texto "Prioritário pela Área".

## 6. Projeção mensal de avanço (modo Projeto): percentuais do planejado e ajustes (aprovado em 09/11/2026, para a v47)
Maquete aprovada em 09/11/2026 (imagens T_*).
- **Status:** **ENTREGUE na v47 (09/11/2026)**, com os itens 7 e 8. O termo "Complementares" também foi aplicado ao cartão "Avanço · Não Priorizados" do Dashboard.
- **Escopo:** só apresentação no modo "Projeto". Nenhum cálculo muda (SPI, projeção e conclusão prevista).

**1. Linha "Planejado" com percentuais**
- Ponto no fim de cada mês, com o valor e com dica ao passar o mouse.
- Mês a mês aparecem os dois números (projeção e planejado), mesmo quando as linhas estão próximas.
- Onde ficam os números:
  - projeto atrasado: planejado acima da linha e projeção abaixo;
  - projeto adiantado: invertido.
- Cada número tenta várias posições e nunca fica sobre outro texto, outro ponto ou uma linha.

**2. Fim do plano e 100%**
- O "100%" do planejado fica na data em que o plano chega a 100% (ex.: 15/04 no Projeto 09).
- Se o plano terminou antes de hoje, não aparece ponto de 100% no futuro.
- Depois de 100% não há bolinhas vazias; as linhas continuam.

**3. Desvio de hoje**
- Ponto do planejado de hoje, ligado ao ponto do realizado por um colchete.
- No topo: "hoje 09/11 · planejado 58,9% · −7,2 p.p.", em vermelho quando atrasado e em verde quando adiantado.

**4. Faixa do desvio**
- Área colorida entre a projeção e o planejado, seguindo as duas linhas por inteiro (inclusive datas fora do fim do mês).
- Vermelha onde a projeção está abaixo do plano, verde onde está acima. Troca de cor no cruzamento.
- Entra na legenda como "Desvio".

**5. Tabela mensal**
- Nova linha "Diferença" (projeção − planejado, em p.p.), calculada sobre os valores exibidos com uma casa, para a conta sempre fechar.
- Depois do fim do plano, o planejado aparece como "100%" esmaecido.
- Nota acima da tabela: "Valores no último dia de cada mês".

**6. Confiabilidade**
- Com 4 semanas ou mais sem avanço registrado, cai para "média", com o motivo "nenhum avanço registrado há N semanas: o desempenho usado na projeção pode estar desatualizado".

**7. Texto contraditório corrigido**
- Projeto sem linha de base (confiabilidade "baixa" sem motivo listado) não mostra mais "O projeto tem linha de base na EAP e já passou do início".

**8. Termo "Complementares"**
- "Não priorizados" e "não prioritários" passam a "Complementares" em todas as telas: 12 textos visíveis, mais 1 comentário no código.

  | Onde | Hoje | Passa a |
  |---|---|---|
  | Filtro de prioridade nos KPIs | "Não priorizados" | "Complementares" |
  | Abas da projeção nos KPIs | "Não priorizados" | "Complementares" |
  | Resumo do filtro nos KPIs | "Não priorizados" | "Complementares" |
  | Frase da projeção do grupo | "não priorizados" | "complementares" |
  | Filtros de prioridade (Report e Relatórios) | "Só não prioritários" | "Só complementares" |
  | Rótulos do filtro escolhido | "Só não prioritários" | "Só complementares" |
  | Indicador do relatório | "Não priorizados" | "Complementares" |
  | Rodapé do relatório | "Não priorizados: N" | "Complementares: N" |

  - Os códigos internos não mudam (`nao`, `nprio`): nada muda no banco nem nos filtros salvos.
  - Documentos já entregues (Guia de Métricas em PDF, notas) continuam com o termo antigo até nova revisão.

**9. Verificação da maquete**
- 69 projetos, 3 larguras (1440, 1024 e 390 px): 0 falhas e 0 erros de JavaScript.
- Projeção com número: 331 de 335 pontos. Planejado: 314 de 315.
- Os 5 pontos sem número estão colados no marcador de 100%; aparecem ao passar o mouse e na tabela.

## 7. Aba KPIs, quadro "Saúde da Carteira": bloco "Atualização do avanço" e correções de layout (layout aprovado em 09/11/2026)
**ENTREGUE na v47 (09/11/2026).** No reteste apareceu uma segunda causa da rolagem lateral entre 920 e 1000 px: o quadro vazio de orçamento (sem LOA). Foi corrigida junto. Maquete: imagens A0 a A7, feitas sobre a v46 com os dados de teste de 04/11.

**1. Bloco novo "Atualização do avanço"** (logo abaixo do donut, separado por uma linha fina)
- **Pergunta que responde:** "posso confiar nesta foto da carteira?". A situação do donut depende do avanço registrado; projeto sem atualização há semanas pode estar com a situação errada.
- **Barra única** com o tempo desde o último avanço registrado nas fotos semanais:
  - verde: até 1 semana;
  - amarelo: 2 a 3 semanas;
  - vermelho: 4 semanas ou mais;
  - cinza: sem foto semanal (só aparece quando houver projeto nessa situação).
- **Legenda** no mesmo formato da legenda do donut: bolinha, nome, quantidade e %.
- **Alerta clicável:** "⚠ N críticos ou em atenção sem avanço há 4 semanas ou mais ›", que abre a lista de projetos.
- **Clique em qualquer faixa ou linha:** abre a lista de projetos que já existe na aba, com a data do último avanço.
- **Base da conta:** só os projetos em execução. Concluídos, suspensos e cancelados ficam de fora.
- **Regra das "4 semanas":** a mesma do alerta "Último avanço registrado" da projeção e da confiabilidade aprovada no item 6. É a função que já existe (`kpiUltimoAvanco`); nenhum cálculo novo de situação.
- **Dados de teste de 04/11 (65 em execução):** 17 até 1 semana, 27 de 2 a 3 semanas, 21 com 4 ou mais, e 14 críticos ou em atenção com 4 ou mais.

**2. Correção: a legenda do donut vaza (problema que já existe na v46)**
- Com a tela entre 920 e 1220 px de largura, os números da legenda (15, 31, 22%…) saem do quadro e aparecem sobre o gráfico "Evolução".
- Até 1360 px, os nomes da legenda quebram linha. Isso afeta notebooks de 1280 e 1366 px.
- **Correção:** de 901 a 1379 px, o donut fica em cima (116 px) e a legenda embaixo, ocupando a largura toda.
- De 901 a 1000 px, as linhas do bloco novo mostram só a quantidade, sem o %, para não quebrar linha.

**3. Correção: rolagem lateral da página (problema que já existe na v46)**
- Entre 920 e 1000 px, a página ganha rolagem lateral.
- **Causa:** as caixas de ajuda ⓘ fechadas (cartão "Concluídos" e quadro "Evolução") ficam posicionadas fora da tela mesmo sem aparecer.
- **Correção:** a caixa fechada não ocupa espaço.

**4. Testes da maquete**
- Varredura de 900 a 1600 px, de 20 em 20, mais tema claro e celular.
- A altura dos quadros "Saúde" e "Evolução" não muda em nenhuma largura de computador (o bloco usa só o espaço vazio).
- Nenhum texto sai do quadro e nenhuma linha da legenda quebra.
- No celular e no tablet os quadros ficam empilhados, sem rolagem lateral.
- Zero erros de JavaScript.

**5. Na implementação:** repetir a varredura de larguras, comparar todas as telas com a versão anterior e conferir as contagens contra uma referência calculada à parte.

## 8. Relatório Gerencial Executivo no modelo novo (layout e regras aprovados em 09/11/2026)
Modelo de referência: `Modelo_Relatorio_Gerencial_Executivo_SEDES_RJ` (PDF de 09/11/2026, 9 páginas, dados fictícios). Maquete aprovada em 09/11/2026, gerada com os dados de teste de 04/11 (outubro/2026):
- PDF da carteira completa (12 páginas) e PDF só dos prioritários (9 páginas);
- painel de configuração e prévia na tela;
- seção 5 com orçamento fictício.

- **Status:** **ENTREGUE na v47 (09/11/2026)**, fases 1 e 2. Pacote `ENTREGA_v47` com `index.html`, `SCRIPT_BANCO_v47.sql` (rodar antes), script de desfazer e LEIA-ME.
  - **Testes:**
    - banco 56 de 56;
    - item 8: 40 de 40 no funcionamento, 28 de 28 contra referência independente e 9 de 9 na fase 2;
    - telas: 27 de 27;
    - regressão contra a v46: 477 de 510 telas idênticas; as 33 diferentes são só as previstas.
- **Substitui** o Relatório Gerencial atual. Corrige três problemas que já existem:
  - o período não filtrava os números;
  - o rótulo "15 projetos" era fixo;
  - o avanço médio incluía projetos sem medição.

**Decisões de 09/11/2026**
- **D1. Abrangência:** escolha na tela entre "Carteira completa" e "Somente prioritários". Só prioritários: a seção 2.3 (prioridade) sai.
- **D2. Situação (opção B), calculada pelo sistema:**
  - Concluídos;
  - Em execução (em dia);
  - Em atenção (crítico + atenção, com o número de críticos indicado);
  - Sem dados (sem prazo final);
  - Suspensos/cancelados (só aparece se houver).
- **D3. Período:** livre, com duas caixas de calendário (De / Até).
  - Atalhos: mês anterior, mês atual, trimestre anterior, ano até hoje.
  - Começa no mês anterior. A data final não pode passar de hoje (data de corte).
- **D4. Avaliação geral da gestão por regras objetivas.**
  - Mesmo critério em todas as dimensões: Adequado ≥ 90%, Atenção de 70% a 89,9%, Crítico < 70%, "Sem dados" quando não há o que medir.
  - Execução física: etapas previstas para o período que foram concluídas.
  - Cumprimento de prazos: projetos ativos com prazo que estão em dia.
  - Gestão de riscos: riscos Alto/Crítico com resposta registrada.
  - Governança: projetos ativos com gerente, patrocinador e subsecretaria. Cai um nível se houver decisão pendente vencida.
  - Monitoramento: projetos ativos com avanço atualizado há menos de 4 semanas.
  - Qualidade dos dados (6ª dimensão, aprovada): média dos 9 itens de qualidade da aba KPIs.
- **D5. Riscos:** registrar impacto e probabilidade (fase 2). O nível passa a sair da matriz da seção 4.2.
- **D6. Metas e entregas:** por pilar estratégico. Meta = etapas com término previsto no período; realizado = concluídas na data de corte.
- **D7. Fases:** as duas.
- **D8. Arquivo:** .docx de verdade, com os gráficos dentro. A prévia na tela usa os mesmos blocos e imprime em PDF.
- **Limites de tamanho:** riscos até 15 linhas e projetos que demandam intervenção até 20 linhas, sempre com o total informado.

**Fase 1 (só o index.html, sem mudar o banco)**
- **Capa:** número do relatório (opcional, digitado), período, emissão, data e hora de corte, abrangência e unidade responsável.
- **Textos de abertura:** apresentação, público-alvo e sumário.
- **1. Sumário executivo:**
  - diagnóstico (texto livre de quem gera);
  - destaques apurados pelo sistema;
  - indicadores consolidados;
  - gráfico de pizza da situação;
  - avaliação da gestão (D4).
- **2. Desempenho da carteira:**
  - distribuição por situação;
  - evolução no período: fotos semanais do início e do fim, projetos que avançaram, sem avanço e concluídos no período (pelo histórico de status);
  - prioritários × complementares, com tabela e gráfico de barras.
- **3. Por subsecretaria:** situação, mais etapas do período, marcos vencidos, sem atualização ≥ 4 semanas e riscos altos.
- **4. Riscos:**
  - riscos registrados nas etapas abertas;
  - projetos que demandam intervenção, com motivo apurado;
  - critérios de classificação.
- **5. Orçamento da LOA:**
  - exercício = ano do fim do período; mesma conta da aba KPIs;
  - tabela, gráfico e físico × financeiro por projeto;
  - aviso quando não houver LOA.
- **6. Metas e entregas por pilar.**
- **7. Plano de ação gerencial.**
- **8. Decisões pendentes e deliberações do período.**
- **9. Conclusão:** texto livre.
- **10. Governança dos dados.**
- **Anexos (opcionais):**
  - I: checklist de fechamento apurado automaticamente (✔/✘ com contagem);
  - II: fichas técnicas dos indicadores.
- **Na maquete:**
  - .docx aprovado na validação do padrão do Word;
  - 0 erros de JavaScript;
  - sem rolagem lateral em 1440 e 390 px.

**Fase 2 (scripts no banco que o usuário roda, depois a tela)**
- Foto mensal da situação, para a evolução mês a mês por situação.
- Risco nas etapas: impacto, probabilidade e resposta.
- Plano de ação gerencial: produto esperado.
- Decisões: contexto/problema, decisão solicitada, prioridade, texto da deliberação e evidência de cumprimento.
- Numeração automática do relatório. Opcional: guardar os textos do diagnóstico e da conclusão.

**Decisões da fase 2 (aprovadas em 09/11/2026)**
- **P1. Riscos nas etapas:**
  - entram Impacto (Baixo/Médio/Alto), Probabilidade (Baixa/Média/Alta), Resposta ao risco e Prazo da resposta;
  - o nível é calculado pela matriz 4.2 (Alto×Alta = Crítico; Alto×Média ou Médio×Alta = Alto; Médio×Média, Alto×Baixa ou Baixo×Alta = Moderado; demais = Baixo);
  - a "Situação do risco" antiga continua visível e vale até a etapa ser reclassificada. O script não converte os valores antigos.
- **P2. Situação mês a mês:**
  - a situação passa a ser gravada junto com a foto semanal que já existe; o mês usa a última foto dele;
  - o histórico começa na v47; a primeira comparação completa será novembro × dezembro.
- **P3. Emissão:**
  - "Baixar rascunho" sai sem número;
  - "Emitir relatório" reserva o próximo número do ano (001/2026…), guarda o arquivo e registra período, abrangência, textos, quem emitiu e quando;
  - lista "Relatórios emitidos" para baixar de novo;
  - emitem admin, PMO e executivo;
  - o campo de número digitado sai da tela.
- **P4. Plano de ação gerencial:**
  - bloco novo na tela do relatório para incluir, editar e concluir ações;
  - campos: ação, projeto, decisão de origem, responsável, prazo, produto esperado e status (A iniciar / Em andamento / Concluída / Cancelada).
- **P5. Decisões:**
  - o formulário ganha Contexto/problema, Decisão solicitada e Prioridade;
  - o projeto pode ser qualquer um da carteira (prioritários primeiro);
  - "Resolver" abre a janela "Registrar deliberação": deliberação obrigatória, evidência e data.
- **Maquetes F1 a F6** (incluindo tema claro e celular): sem rolagem lateral e sem erros de JavaScript.
- **Ordem de trabalho:**
  1. script do banco (só acrescenta; testado em cópia local; com script de desfazer);
  2. tela v47, que funciona mesmo se o script ainda não tiver sido rodado (esconde a fase 2);
  3. testes e pacote.
- **Ordem de aplicação:** rodar o script, conferir, publicar o index.html e recarregar.

**Na implementação:**
- testes contra uma referência calculada à parte;
- validação do .docx;
- abrir no Word/LibreOffice;
- regressão das demais telas contra a v46.

## 9. Relatórios & KPIs (Governança): projetos do filtro, caderno, filtros claros e quadro "Por subsecretaria" (aprovado em 09/11/2026)
**ENTREGUE na v48 (09/11/2026)**: só o `index.html`, sem script no banco. Maquete: imagens R1 a R5, com os dados de teste de 04/11.
- **Testes:**
  - 42 de 42;
  - .docx do Relatório Gerencial idêntico ao da v47;
  - regressão contra a v47: 504 de 510 telas idênticas, só a tela Relatórios & KPIs mudou.
- **Conferido no banco real:** os Projetos 34 e 37 estão com a subsecretaria correta. A diferença era só dos dados de teste.

**Origem do pedido:**
- O usuário pediu uma aba "Status Report Subsecretarias" ou um botão de busca.
- Na análise, os filtros já funcionam na hora, e o Consolidado com filtro de setor já é o relatório da subsecretaria.
- O problema é a aba Individual: ela fica vazia depois de filtrar.
- Decisão: nenhuma aba nova, nenhum botão de busca. Os filtros que já existem passam a ser aproveitados.

**1. Aba Individual mostra os projetos do filtro**
- Sem projeto escolhido, aparece uma tabela com nº, projeto, gerente, status, avanço, prazo final e situação de prazo, mais "Abrir ›".
- Clicar abre o Status Report do projeto. Anterior e Próximo percorrem a mesma lista.
- No celular, a tabela vira cartões.

**2. Caderno dos relatórios individuais**
- Botão "Gerar os N relatórios individuais", em **Word (.docx) e PDF pela impressão**.
- Um único arquivo com capa (ex.: "Status Report · SUBICS · 25 projetos"), índice e um Status Report por página, na ordem da lista.

**3. Filtros mais claros**
- Rótulos visíveis: Órgão, Subsecretaria / setor, Status, Prioridade, Situação de prazo.
- Quantidade de projetos em cada opção (ex.: "SUBICS (25)").
- Setores sem projeto deixam de aparecer na lista.
- Faixa "Filtro: Subsecretaria SUBICS · 25 projetos de 69" logo abaixo dos filtros.

**4. Título do Consolidado conforme o filtro**
- "Status Report Consolidado — Carteira completa" sem filtro.
- "— SUBICS", "— SUBICS · Só prioritários" etc. com filtro.
- Nenhuma regra de cálculo muda.

**5. Quadro "Por subsecretaria" no Consolidado**
- Aparece quando não há filtro de setor, logo abaixo dos indicadores.
- Uma linha por setor:
  - projetos e prioritários;
  - em dia, vence em até 15 dias, fora do prazo, sem prazo e concluídos;
  - suspensos, só quando houver;
  - avanço médio só com os projetos com medição, indicando quantos ficam fora.
- Ordem das linhas: do setor com mais projetos para o com menos, com "Sem subsecretaria" por último.
- Linha Total no fim, igual aos indicadores de cima.
- Clicar numa linha aplica o filtro daquele setor.
- No celular, cada setor vira um cartão.

**6. Regra da subsecretaria igual à da aba KPIs (D4)**
- **Problema:** a tela de Relatórios usa só o nome que vem junto com o projeto. Nos dados de teste de 04/11, os Projetos 34 e 37 têm subsecretaria cadastrada, mas esse nome veio vazio. Por isso aparecem como "Sem setor" e ficam fora do filtro.
- **Como fica:** a tela inteira (filtro, quadro e tabela) passa a usar a mesma regra da aba KPIs, que procura a subsecretaria pelo cadastro. Assim os números batem (SUBENEMAR 30, SUBICS 25, Sem subsecretaria 2).
- **Na implementação:** conferir primeiro no banco real se o mesmo acontece no sistema publicado.

**Na implementação:**
- só o `index.html`, sem mudança no banco;
- testes contra uma referência calculada à parte;
- comparar as demais telas com a versão anterior;
- conferir celular e tema claro.

## 10. Análise geral do sistema: pontos de atenção e melhorias (análise de 09/11/2026)
**Situação:** só registro. **Nenhum item autorizado.** Cada item precisa de aprovação antes de ser implementado.

**Fontes da análise:**
- avisos de segurança e desempenho do Supabase;
- consultas de leitura no banco real em 09/11;
- código do `index.html` v48.

O site publicado no Netlify não foi conferido, porque a rede deste ambiente bloqueou o acesso.

### 10.1 Pontos de atenção — prioridade alta
1. **O código do sistema não está guardado em lugar seguro.**
   - O `index.html` em uso (v46 a v48, mais a v49 em andamento), os scripts do banco e as baterias de teste existem só em duas cópias:
     - na pasta temporária da sessão de trabalho, que é apagada quando a sessão encerra;
     - nos .zip baixados.
   - Este repositório não guarda esse sistema. Ele tem outro projeto (GT PROPAG, em React) e um `index.html` antigo, de 24/09. O `netlify.toml` também é desse outro projeto.
   - **Proposta:** guardar no GitHub, numa pasta própria, cada versão publicada, os scripts SQL e os testes.
2. **Banco e site em contas pessoais.**
   - A organização do Supabase e a conta do Netlify são pessoais.
   - Se o titular perder o acesso, o sistema fica sem dono.
   - A migração institucional está em espera.
3. **Sem recuperação de senha.**
   - Não existe "Esqueci minha senha"; há só a troca de senha por quem já entrou.
   - Quem esquece a senha depende de um admin.
   - O estudo de senhas aguarda 5 decisões.
4. **Cópia de segurança do banco.**
   - A proteção contra senhas vazadas está desligada e só existe no plano pago, o que indica plano gratuito. Confirmar no painel do Supabase.
   - No plano gratuito não há restauração do banco pelo painel.
   - **Proposta:** exportação periódica própria.
5. **Funções do banco que podem ser chamadas sem login.**
   - O Supabase aponta 11 funções internas executáveis por quem não está logado:
     - `fn_criar_perfil_padrao`, `fn_meu_ator_id`, `fn_meu_nome`, `fn_meu_perfil`;
     - `fn_numero_automatico_projeto`, `fn_proximo_numero_projeto`;
     - `fn_protege_prioridade_executivo`, `fn_trava_campos_projeto`, `fn_trava_data_inicio_previsto`;
     - `fn_valida_setor_gerente`, `fn_valida_setor_responsavel`.
   - Várias são funções de gatilho que não precisam ficar expostas. Elas não dão acesso a dados.
   - 2 funções (`fn_rotulo_data` e `fn_valida_datas`) não fixam em qual parte do banco procuram as tabelas (`search_path`).
   - A tabela `projeto_numero_controle` tem regras de acesso ligadas, mas nenhuma regra definida. Hoje isso bloqueia tudo, o que está correto; o Supabase só avisa.
6. **Leitura de planilhas com biblioteca antiga.**
   - A importação usa a SheetJS 0.18.5, que tem uma falha conhecida ao abrir arquivos .xlsx feitos para explorá-la (CVE-2023-30533).
   - O risco é baixo, porque só usuários logados importam.
   - **Proposta:** atualizar a biblioteca.
7. **Versão da biblioteca do Supabase não fixada.**
   - A tela carrega o `supabase-js@2` sem número exato.
   - Uma atualização do fornecedor pode mudar o comportamento sem aviso.

### 10.2 Pontos de atenção — dados (banco real, 09/11/2026)
| Ponto | Situação |
|---|---|
| Projeto 06 | Data com ano inválido ("20206") e prazo anterior ao início |
| Sem status geral | Projetos 56 e 57 |
| Sem prazo final | Projetos 35, 40, 44, 48, 55, 56 e 57 |
| Sem EAP | Projetos 35, 40, 44, 55, 56 e 57 |
| Sem gerente | 10 projetos (34, 35, 40, 41, 44, 55, 56, 57, 59 e 64) |
| Sem subsecretaria | Projetos 55, 59 e 71 |
| Sem pilar | 13 projetos (01, 29, 32, 34, 35, 40, 44, 49, 50, 55, 56, 57 e 59) |
| Sem data de início | 18 projetos |
| Sem sponsor | 10 projetos |
| Prazo vencido e ainda "Em Andamento" | Projetos 03, 04, 06, 07, 08, 10, 18 e 21 (o 21 venceu em 06/11) |
| Etapas com fim real no futuro | 8 etapas, nos Projetos 05, 07, 18, 33 e 70 |
| Etapas com início depois do fim | 2 etapas, nos Projetos 13 e 15 |
| Etapas com fim real e abaixo de 100% | 18 |
| Etapas sem início previsto | 18, em 8 projetos; deixam o planejado e a projeção "em degrau" (ex.: Projeto 21) |
| Etapas sem fim previsto | 12 |
| Etapas soltas, fora de macroetapa | 24, nos Projetos 02, 09, 38 e 59 (mantidas por decisão de 04/11) |
| Etapas vencidas e não concluídas | 106 |
| Coluna antiga `avanco_fisico` | Preenchida em 39 projetos e desatualizada; o sistema não a usa, mas uma consulta externa leria número errado |

### 10.3 Pontos de atenção — funcionamento
1. **Rótulos do gráfico de projeção que somem** (Projetos 14, 19 e 21): a correção v49 está pronta e testada, e aguarda aprovação das imagens.
2. **Ferramentas novas sem uso:**
   - plano de ação gerencial: 0 ações;
   - decisões: 1 registrada;
   - relatórios emitidos: 0;
   - anexos de evidência: 1 arquivo.

   Enquanto isso, o checklist e a avaliação da gestão do Relatório Gerencial mostram "0 de N".
3. **Situação nas fotos semanais:** nenhuma foto tem a situação gravada ainda, porque a foto de 09/11 é anterior à v47.
   - A primeira deve sair na semana de 16/11. Conferir.
   - Se não sair, confirmar se a v47 está publicada no Netlify.
4. **Sininho com 297 alertas:** com esse volume, os avisos deixam de ser lidos.
5. **Uso:**
   - 10 usuários: 5 sem entrar há mais de 30 dias e 1 que nunca entrou;
   - só 1 usuário com perfil gerente, embora a carteira tenha vários gerentes;
   - nenhuma delegação.
6. **Cadastro livre de usuários:** não foi possível ler essa configuração. Confirmar no painel do Supabase que está desligado e que só o admin cria contas.

### 10.4 Pontos de atenção — desempenho (prioridade baixa)
- 48 ligações entre tabelas sem índice.
- 10 regras de acesso que recalculam o usuário logado linha a linha.
- 35 avisos de regras duplicadas (escrita + leitura na mesma tabela).
- Com 73 projetos isso não pesa. Corrigir antes de a carteira crescer.
- Banco com 19 MB. A auditoria é a maior tabela: 10.465 registros, cerca de 7 mil por mês.

### 10.5 Melhorias propostas
1. **Código versionado e testes automáticos:**
   - cada versão publicada, os scripts e as baterias de teste no GitHub;
   - número da versão no rodapé do sistema;
   - regressão antes de cada publicação.
2. **Painel "Qualidade dos dados" para o PMO:** as listas da tabela 10.2, clicáveis, com "corrigir" levando direto à ficha.
3. **Travas de cadastro, na tela e no banco:**
   - fim real não pode ser futuro;
   - início não pode ser depois do fim;
   - fim real leva a etapa a 100%;
   - aviso ao concluir uma etapa sem anexo de evidência.
4. **Prazo vencido:** ao abrir um projeto com prazo vencido e ainda em andamento, pedir repactuação ou mudança de status.
5. **Recuperação de senha e convites:** pelo estudo já feito, fase 1 sem e-mail e fase 2 com e-mail institucional.
6. **Cópia de segurança semanal** do banco (exportação), com manual de restauração.
7. **Alertas:** resumo semanal por gerente, no lugar do sininho acumulado.
8. **Script de segurança e desempenho do banco,** testado na cópia local antes de entregar:
   - fechar as funções expostas sem login;
   - fixar o `search_path` das 2 funções;
   - criar os índices;
   - unificar as regras de acesso duplicadas.
9. **Coluna antiga `avanco_fisico`:** limpar, ou passar a gravar nela o valor calculado.
10. **Bibliotecas:** fixar a versão do `supabase-js` e atualizar a SheetJS, com regressão da importação de planilhas.
11. **Pendências antigas ainda em aberto** (detalhes em "Pendências anteriores"):
    - importação dos 10 projetos de Energia e do Jovens do Mar;
    - 4 pontos do Guia de Métricas;
    - troca do GND;
    - migração institucional.

## Pendências anteriores (registradas no histórico)
- Correções de dados no banco: datas digitadas como "20206", início depois do fim, projetos marcados como manuais, projetos sem status. Exemplo: o Projeto 06 tem início 20206-07-01.
- Mover os anexos ao renumerar um projeto.
- **Aba KPIs (Visão Executiva): v36 entregue para publicação em 29/10/2026.**
  - As 6 decisões foram confirmadas: barras por Subsecretaria (opção Pilar); "Em risco" = críticos; "Dentro do prazo" = em dia ÷ total; matriz Situação × Prioridade; todos os perfis veem (gerente e sponsor só os próprios projetos); custo médio só com metade dos projetos com investimento.
  - Inclui a prevenção da foto semanal: só é gravada com a EAP carregada.
  - Fica para depois: matriz Risco × Impacto (precisa de campos novos) e o indicador "Conclusão no prazo".
- **Risco: carga da EAP limitada a 1.000 linhas (registrado em 29/10/2026). Resolvido na v45 (item 5).**
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
- **Card do projeto (PowerPoint) sem as frases do Book de Transição: APROVADO em 05/11/2026; v44 entregue (só index.html).**
  - **O que sai do card:** as três frases fixas herdadas do modelo de outra apresentação:
    - "SEDES · BOOK DE TRANSIÇÃO" (cabeçalho);
    - "4 · DIRETRIZES, PROGRAMAS E PROJETOS" (cabeçalho);
    - "BOOK DE TRANSIÇÃO GOVERNAMENTAL · SEDES" (rodapé).
  - **O que fica igual:** todo o resto do card.
  - **Testes:**
    - o card do Projeto 71 ficou idêntico, pixel a pixel, ao exemplo aprovado;
    - em 70 de 70 projetos, o card novo é igual ao antigo sem as três frases (149 slides, incluindo 4 cards em 2 partes);
    - os botões e o lote funcionaram, sem erros.
- **Pontos observados na elaboração do Guia de Métricas (05/11/2026), para decidir depois:**
  1. **Relatório Gerencial:**
     - o período (mensal, trimestral etc.) é só um rótulo e não filtra os números;
     - as caixas "Indicadores e evolução" e "Histórico comparativo" não alteram o conteúdo;
     - o rótulo "Detalhamento dos 15 projetos" é fixo (hoje são 21 priorizados).
  2. **Painel Executivo:** o seletor de período ("mês corrente"/"desde a data inicial") não altera os números.
  3. **Perfil Sponsor:** o texto de Configurações diz "sem editar", mas o sponsor atualiza os projetos vinculados (como o gerente) e ainda altera escopo e produto.
  4. **Avanço médio no Painel de Recuperação e no Relatório Gerencial:** inclui projetos sem medição (contados como 0%). As demais telas os excluem.
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
- **Configurações: retirar o texto "Prioritário pela Área" (opção 1 escolhida em 03/11/2026). Feito na v45.**
  - **Situação:** a tela de Configurações descreve um "Prioritário pela Área — ranking interno, apenas indicativo", mas isso nunca foi construído. Não há onde marcar nem onde exibir.
  - **No banco:** a coluna `prioridade_area` (sim/não) está desmarcada nos 69 projetos e nunca foi alterada (nenhum registro no histórico).
  - **O que fazer:** tirar esse parágrafo da tela de Configurações. Manter o texto do "Prioritário pelo Executivo", que é a única prioridade em uso.
  - **O que não muda:** a coluna fica no banco, sem efeito. Nenhum dado é alterado.
- Migração institucional (Windows Server + PostgreSQL): EM ESPERA. O plano está em `docs/migracao-institucional/PLANO_MIGRACAO_INSTITUCIONAL.md`.
- GND: trocar "2. Outras Despesas" por "3. Outras Despesas Correntes" (classificação oficial)? Depois disso, retirar a aceitação do código '3' no banco? Aguarda decisão.
