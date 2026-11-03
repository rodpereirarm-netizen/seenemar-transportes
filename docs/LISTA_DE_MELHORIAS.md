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
- **Opção D (layout da DIP):** não recomendada no navegador.

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
- Migração institucional (Windows Server + PostgreSQL): EM ESPERA. O plano está em `docs/migracao-institucional/PLANO_MIGRACAO_INSTITUCIONAL.md`.
- GND: trocar "2. Outras Despesas" por "3. Outras Despesas Correntes" (classificação oficial)? Depois disso, retirar a aceitação do código '3' no banco? Aguarda decisão.
