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
  - Exige um modelo v36 com intervalos de lista maiores.
- **Opção D (layout da DIP):** não recomendada no navegador.

## Pendências anteriores (registradas no histórico)
- Correções de dados no banco: datas digitadas como "20206", início depois do fim, projetos marcados como manuais, projetos sem status. Exemplo: o Projeto 06 tem início 20206-07-01.
- Mover os anexos ao renumerar um projeto.
- Viabilidade da aba KPIs (Visão Executiva): faltam decisões.
- Migração institucional (Windows Server + PostgreSQL): EM ESPERA. O plano está em `docs/migracao-institucional/PLANO_MIGRACAO_INSTITUCIONAL.md`.
- GND: trocar "2. Outras Despesas" por "3. Outras Despesas Correntes" (classificação oficial)? Depois disso, retirar a aceitação do código '3' no banco? Aguarda decisão.
