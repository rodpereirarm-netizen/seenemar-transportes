// Gera o Documento de Projeto do SisControle SEDES (docx editável)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  HeadingLevel, LevelFormat, Header, Footer, PageNumber, TableOfContents, ImageRun, PageBreak, BorderStyle,
  VerticalAlign, TabStopType,
} = require('docx');

const DIR = __dirname;
const OUT = process.argv[2];
const AZUL = '062A57', AZUL2 = '1858A8', CINZA = '5A6B85', LINHA = 'C7D0DD', CLARO = 'EEF3F9', OURO = 'B8932A';
const W = 9638; // largura útil em DXA (A4 com margens de 2 cm)
const F = 'Arial';

/* ---------- utilitários ---------- */
const run = (t, o = {}) => new TextRun({ text: t, font: F, ...o });
function rich(txt, o = {}) { // **negrito** simples
  const partes = String(txt).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return partes.map((x) => (x.startsWith('**') ? run(x.slice(2, -2), { bold: true, ...o }) : run(x, o)));
}
const P = (t, o = {}) => new Paragraph({ children: rich(t, o.run || {}), spacing: { after: 120, line: 288 }, alignment: o.align, ...o.p });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(t)], pageBreakBefore: true });
const H1c = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [run(t)] });
const B = (t, nivel = 0) => new Paragraph({ numbering: { reference: 'bul', level: nivel }, children: rich(t), spacing: { after: 60, line: 276 } });
const N = (t, ref = 'num') => new Paragraph({ numbering: { reference: ref, level: 0 }, children: rich(t), spacing: { after: 60, line: 276 } });
const esp = (n = 120) => new Paragraph({ children: [], spacing: { after: n } });
const nota = (t) => new Paragraph({ children: rich(t, { italics: true, color: CINZA, size: 18 }), spacing: { after: 160 } });
const destaque = (t) => new Paragraph({ children: rich(t, { color: AZUL }), spacing: { before: 60, after: 160, line: 288 }, shading: { type: ShadingType.CLEAR, fill: CLARO }, border: { left: { style: BorderStyle.SINGLE, size: 24, color: AZUL2, space: 8 } }, indent: { left: 200, right: 120 } });

const bordas = { top: { style: BorderStyle.SINGLE, size: 4, color: LINHA }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINHA }, left: { style: BorderStyle.SINGLE, size: 4, color: LINHA }, right: { style: BorderStyle.SINGLE, size: 4, color: LINHA } };
function T(cab, linhas, fr, o = {}) {
  const ws = fr.map((x) => Math.round(W * x)); ws[ws.length - 1] = W - ws.slice(0, -1).reduce((a, b) => a + b, 0);
  const cel = (txt, i, head, zebra) => new TableCell({
    width: { size: ws[i], type: WidthType.DXA }, borders: bordas, verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: head ? { type: ShadingType.CLEAR, fill: AZUL } : zebra ? { type: ShadingType.CLEAR, fill: 'F6F8FB' } : undefined,
    children: String(txt).split('\n').map((l) => new Paragraph({ children: rich(l, { size: o.size || 18, color: head ? 'FFFFFF' : '1D2A3A', bold: head || undefined }), spacing: { after: 20 } })),
  });
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: ws,
    rows: [new TableRow({ tableHeader: true, children: cab.map((c, i) => cel(c, i, true)) }), ...linhas.map((l, k) => new TableRow({ cantSplit: true, children: l.map((c, i) => cel(c, i, false, k % 2 === 1)) }))],
  });
}
const tab = (...a) => [T(...a), esp(160)];
function img(arq, larguraPx, legenda) {
  const buf = fs.readFileSync(path.join(DIR, arq));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  return [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: buf, transformation: { width: larguraPx, height: Math.round((h / w) * larguraPx) }, altText: { title: legenda, description: legenda, name: arq } })], spacing: { before: 120, after: 60 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run(legenda, { italics: true, size: 18, color: CINZA })], spacing: { after: 200 } })];
}

function gantt() {
  const meses = ['Nov/26', 'Dez/26', 'Jan/27', 'Fev/27', 'Mar/27', 'Abr/27', 'Mai/27', 'Jun/27', '2º sem/27'];
  const linhas = [
    ['Validação do fluxo e aprovação do projeto', AZUL, 0, 0, [0]],
    ['Construção do MVP (10 dias úteis)', AZUL, 0, 1, []],
    ['Homologação, treinamento e go-live', AZUL, 1, 1, [1]],
    ['Operação assistida e ajustes', AZUL, 1, 2, [2]],
    ['Fase 1.5: agenda, widgets, temas, e-mail, faixa de notícias', '2F7BE5', 2, 3, [3]],
    ['Fase 2a: auditoria interna', '1D7F46', 4, 6, [6]],
    ['Fase 2b: riscos e controles', '1D7F46', 6, 7, [7]],
    ['Avaliação de resultados (6 meses)', OURO, 7, 7, [7]],
    ['Evolução: gov.br/ICP, integração SEI, BI, migração PRODERJ', OURO, 8, 8, []],
  ];
  const wNome = 3300; const wMes = Math.floor((W - wNome) / meses.length); const ws = [wNome, ...meses.map(() => wMes)]; ws[ws.length - 1] = W - wNome - wMes * (meses.length - 1);
  const cel = (w, txt, fill, cor, bold, alin) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: bordas, verticalAlign: VerticalAlign.CENTER, margins: { top: 50, bottom: 50, left: 60, right: 60 }, shading: fill ? { type: ShadingType.CLEAR, fill } : undefined, children: [new Paragraph({ alignment: alin || AlignmentType.LEFT, children: txt ? [run(txt, { size: 16, color: cor || '1D2A3A', bold })] : [], spacing: { after: 0 } })] });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ws, rows: [
    new TableRow({ tableHeader: true, children: [cel(wNome, 'Entrega', AZUL, 'FFFFFF', true), ...meses.map((m, i) => cel(ws[i + 1], m, AZUL, 'FFFFFF', true, AlignmentType.CENTER))] }),
    ...linhas.map(([n, cor, a, b, marcos]) => new TableRow({ cantSplit: true, children: [cel(wNome, n), ...meses.map((_, i) => (i >= a && i <= b ? cel(ws[i + 1], marcos.includes(i) ? '◆' : '', cor, 'FFFFFF', true, AlignmentType.CENTER) : cel(ws[i + 1], '', undefined)))] })),
  ] });
}

/* ---------- conteúdo ---------- */
const C = [];
// CAPA
C.push(
  new Paragraph({ children: [run('GOVERNO DO ESTADO DO RIO DE JANEIRO', { bold: true, color: AZUL, size: 22 })], spacing: { before: 600, after: 40 } }),
  new Paragraph({ children: [run('Secretaria de Estado de Desenvolvimento Econômico — SEDES', { color: AZUL, size: 20 })], spacing: { after: 20 } }),
  new Paragraph({ children: [run('Assessoria de Gestão Estratégica (AGE) · Assessoria de Controle Interno (ASCOIN)', { color: CINZA, size: 20 })], spacing: { after: 1400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: OURO, space: 12 } } }),
  new Paragraph({ children: [run('SisControle SEDES', { bold: true, size: 64, color: AZUL })], spacing: { after: 120 } }),
  new Paragraph({ children: [run('Sistema de Controle Interno e Auditoria', { size: 36, color: AZUL2 })], spacing: { after: 480 } }),
  new Paragraph({ children: [run('Documento de Projeto', { bold: true, size: 30, color: '1D2A3A' })], spacing: { after: 80 } }),
  new Paragraph({ children: [run('Visão, requisitos, histórias de usuário, fluxos, situação atual, roteiro e plano de entregas', { size: 22, color: CINZA })], spacing: { after: 1600 } }),
);
C.push(...tab(['Item', 'Informação'], [
  ['Versão', '1.0 (versão inicial para aprovação)'],
  ['Data', '17/11/2026'],
  ['Situação', 'Em aprovação'],
  ['Classificação', 'Uso interno'],
  ['Elaboração', 'PMO / Assessoria de Gestão Estratégica (Product Owner do projeto)'],
  ['Área demandante', 'Assessoria de Controle Interno (ASCOIN)'],
  ['Patrocínio', 'Chefia de Gabinete (CHEGAB) e Subsecretaria Executiva (SUBEXE)'],
], [0.28, 0.72]));

// CONTROLE DO DOCUMENTO
C.push(H1('Controle do documento'));
C.push(H3('Histórico de versões'));
C.push(...tab(['Versão', 'Data', 'Autor', 'Descrição'], [
  ['0.1', '13/11/2026', 'AGE (PO)', 'Levantamento de requisitos e proposta de MVP (questionário respondido pela ASCOIN)'],
  ['0.2', '13/11/2026', 'AGE (PO)', 'Modelo de dados, matriz de permissões, telas e plano de 10 dias; decisões iniciais do PO'],
  ['1.0', '17/11/2026', 'PMO / AGE', 'Consolidação técnica: requisitos, histórias, fluxos, protótipo v1 a v4, situação atual, roteiro e próximas etapas'],
], [0.1, 0.14, 0.16, 0.6]));
C.push(H3('Aprovações'));
C.push(...tab(['Papel', 'Nome / unidade', 'Assinatura', 'Data'], [
  ['Patrocinador', 'Chefia de Gabinete (CHEGAB)', '', ''],
  ['Patrocinador', 'Subsecretaria Executiva (SUBEXE)', '', ''],
  ['Ponto focal e homologação', 'Assessora de Controle Interno (ASCOIN)', '', ''],
  ['Product Owner', 'Assessoria de Gestão Estratégica (AGE)', '', ''],
], [0.24, 0.4, 0.22, 0.14]));
C.push(H3('Distribuição'));
C.push(P('CHEGAB, SUBEXE, ASCOIN, Assessoria de Auditoria Interna (AUDIN), Assessoria de Gestão Estratégica (AGE) e equipe técnica do projeto.'));
C.push(H3('Sumário'));
C.push(new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-2' }));
C.push(nota('Para atualizar o sumário no Word: clique com o botão direito sobre ele e escolha “Atualizar campo”.'));

// 1 SUMÁRIO EXECUTIVO
C.push(H1('1. Sumário executivo'));
C.push(P('O **SisControle SEDES** é o sistema que vai centralizar o controle das demandas dos órgãos de controle (TCE-RJ, CGE-RJ e outros), dos checklists de conformidade e, numa segunda fase, da auditoria interna e da gestão de riscos da Secretaria. A necessidade nasce de um apontamento do TCE-RJ e da cobrança do Gabinete: hoje o controle é feito em planilhas e no SEI, com informações que chegam separadas por setor e precisam ser consolidadas manualmente pela ASCOIN.'));
C.push(P('O projeto adota uma abordagem **híbrida**: planejamento e governança preditivos, com escopo, marcos e riscos controlados, e construção iterativa guiada por **protótipo evolutivo**. Entre 13 e 16/11/2026 foram produzidas quatro versões de maquete navegável, validadas com o Product Owner, que já cobrem o ciclo completo da demanda externa, os checklists com parecer e assinatura eletrônica, o painel executivo e as funções de governança (trilha de auditoria, lixeira, configurações e manutenção).'));
C.push(H3('Situação em 17/11/2026'));
C.push(...tab(['Dimensão', 'Situação', 'Farol'], [
  ['Escopo', 'Requisitos levantados; fluxo validado até o passo 3 (atendimento pela área). Passos 4 a 9 desenhados, a validar.', 'Amarelo'],
  ['Protótipo', 'Maquete v4 publicada, com todos os módulos do MVP navegáveis e testados em computador e celular.', 'Verde'],
  ['Prazo', 'Construção do MVP (10 dias úteis) ainda não iniciada; depende da aprovação deste documento e da planilha base.', 'Amarelo'],
  ['Riscos', 'Escopo do protótipo cresceu além do MVP; planilha base da ASCOIN ainda não recebida.', 'Amarelo'],
  ['Custos', 'Sem custo de licença; necessário plano pago do Supabase (Pro) para disponibilidade 24x7.', 'Verde'],
], [0.16, 0.66, 0.18]));
C.push(destaque('**Recomendação do PMO:** aprovar este documento, congelar o escopo do MVP conforme a seção 4, validar os passos 4 a 9 do fluxo na próxima reunião semanal e iniciar a construção assim que a planilha base da ASCOIN for entregue.'));

// 2 CONTEXTO
C.push(H1('2. Contexto e justificativa'));
C.push(H2('2.1 Problema'));
C.push(B('Demandas do TCE-RJ e da CGE-RJ chegam pelo SEI, por e-mail e, às vezes, pelo sistema do TCE, e são controladas em planilhas.'));
C.push(B('Cada setor responde separadamente; a ASCOIN precisa consolidar as respostas e acompanhar prazos manualmente.'));
C.push(B('Não há visão única para o Gabinete, nem histórico confiável de prazos, devoluções, reincidências e recomendações atendidas.'));
C.push(B('Houve apontamento do TCE-RJ sobre o controle, e o Gabinete cobra uma solução centralizadora.'));
C.push(H2('2.2 Base normativa'));
C.push(...tab(['Norma', 'Ponto que afeta o sistema'], [
  ['Regimento Interno da SEDES (DOERJ 27/10/2026), Art. 10, VII', 'A ASCOIN centraliza o recebimento e a distribuição das demandas do TCE e da CGE, consolida as respostas e acompanha recomendações com controle de prazos e planos de ação.'],
  ['Regimento, Art. 11 e §1º', 'A Auditoria Interna (3ª linha) elabora o Plano Anual de Auditoria e atua com independência técnica: trabalhos em andamento ficam restritos à equipe de auditoria.'],
  ['Regimento, Art. 13, VI', 'A CHEGAB controla os prazos das demandas do TCE, MP, Judiciário e Legislativo: registra ciência no fluxo.'],
  ['Regimento, Art. 3º, XIII', 'Toda unidade trata os riscos de seus processos em articulação com a ASCOIN e a Auditoria.'],
  ['Regimento, Art. 2º', 'Organograma que serve de base ao cadastro de áreas e à visão hierárquica.'],
  ['Lei nº 14.063/2020', 'Assinatura eletrônica simples para pareceres e relatórios.'],
  ['Lei nº 13.709/2018 (LGPD)', 'Não há dados pessoais sensíveis previstos; mesmo assim há marcação de itens restritos e controle de acesso.'],
], [0.34, 0.66]));
C.push(H2('2.3 Benefícios esperados'));
C.push(B('Controle único e auditável de todas as pendências com órgãos de controle.'));
C.push(B('Cumprimento de prazos, com alertas, lembretes de ciência e escalonamento automático.'));
C.push(B('Redução de devoluções e de reincidências, medidas por área e por tema.'));
C.push(B('Evidência formal de conformidade (checklists com parecer assinado e verificável).'));
C.push(B('Informação gerencial em tempo real para o Gabinete.'));

// 3 OBJETIVOS
C.push(H1('3. Objetivos e critérios de sucesso'));
C.push(H2('3.1 Objetivo geral'));
C.push(P('Dotar a SEDES de um sistema centralizador para o controle interno, cobrindo o ciclo de vida das demandas dos órgãos de controle, os checklists de conformidade e, em fase posterior, a auditoria interna e a gestão de riscos, com rastreabilidade completa.'));
C.push(H2('3.2 Objetivos específicos e indicadores'));
C.push(...tab(['#', 'Objetivo', 'Indicador', 'Meta'], [
  ['OE1', 'Centralizar 100% das demandas do TCE-RJ e da CGE-RJ', 'Demandas registradas no sistema / demandas recebidas', '100% a partir do go-live'],
  ['OE2', 'Reduzir itens vencidos', 'Itens vencidos / itens abertos', 'Queda de 50% em 6 meses'],
  ['OE3', 'Dar visão gerencial ao Gabinete', 'Painel atualizado e consultado pela CHEGAB', 'Uso semanal pela CHEGAB'],
  ['OE4', 'Reduzir devoluções para complementação', 'Devoluções / respostas', 'Queda de 30% em 6 meses'],
  ['OE5', 'Formalizar a conformidade de convênios', 'Checklists da DGAF com parecer assinado', '100% dos processos sorteados'],
  ['OE6', 'Migrar o histórico', 'Registros da planilha base migrados e conferidos', '100% antes do go-live'],
], [0.07, 0.36, 0.33, 0.24]));
C.push(H2('3.3 Critério de sucesso declarado pela área'));
C.push(destaque('“Ter um controle geral e centralizador em 6 meses.” (ASCOIN, questionário de levantamento, item 1.4)'));

// 4 ESCOPO
C.push(H1('4. Escopo'));
C.push(H2('4.1 Escopo por fase'));
C.push(...tab(['Fase', 'Conteúdo', 'Prazo de referência'], [
  ['MVP (fase 1)', 'Demandas externas e motor de acompanhamento; alertas no sistema e resumo diário para o SEI; painel executivo e relatórios gerenciais (PDF e Excel); checklists de conformidade (convênios da DGAF) com parecer e assinatura sequencial; trilha de auditoria; lixeira; usuários e perfis padrão; importação da planilha base; backups e rotinas.', '10 dias úteis após aprovação'],
  ['Fase 1.5', 'Agenda/calendário; catálogo de widgets e painel personalizável; perfis personalizados; temas claro e escuro; faixa de notícias; manutenção completa (logs, janelas, versões).', 'A planejar após o go-live'],
  ['Fase 2', 'Auditoria interna (plano anual, trabalhos, papéis de trabalho, achados, manifestação, relatórios); riscos e controles (probabilidade × impacto, mapa de calor, testes de controle). As tabelas já nascem no MVP.', 'A planejar'],
], [0.15, 0.62, 0.23]));
C.push(H2('4.2 Fora do escopo nesta etapa'));
C.push(B('Integrações com SEI, SIAFE-Rio e sistemas do TCE-RJ e da CGE-RJ (o número SEI é texto de referência).'));
C.push(B('Assinatura com gov.br ou certificado ICP-Brasil.'));
C.push(B('Envio de e-mail (fica preparado; decisão atual: alertas só no sistema e resumo diário para o SEI).'));
C.push(B('Acesso de usuários externos (TCE, CGE e demais órgãos nunca acessam o sistema).'));
C.push(B('Resposta parcial e itens conjuntos entre áreas (um item por área).'));
C.push(H2('4.3 Premissas'));
C.push(B('A ASCOIN entrega a planilha base e a tabela de checklists em uso antes do dia 6 da construção.'));
C.push(B('O projeto Supabase será contratado no plano Pro, com backup diário.'));
C.push(B('Cerca de 10 usuários iniciais, criados pelo administrador.'));
C.push(B('A Assessora de Controle Interno participa da reunião semanal e da homologação.'));
C.push(H2('4.4 Restrições'));
C.push(B('Prazo de 10 dias úteis para o MVP.'));
C.push(B('Stack definida: HTML, CSS e JavaScript puros; Supabase (Postgres, Auth, Storage, Edge Functions, pg_cron); Vercel; PWA.'));
C.push(B('Portabilidade para o PRODERJ: regra de negócio em SQL padrão do Postgres, com migrations versionadas.'));
C.push(B('Equipe da ASCOIN reduzida (Assessora e 4 servidores) para validação e homologação.'));

// 5 PARTES INTERESSADAS
C.push(H1('5. Partes interessadas e governança'));
C.push(H2('5.1 Partes interessadas'));
C.push(...tab(['Parte interessada', 'Papel no projeto', 'Interesse', 'Influência', 'Estratégia'], [
  ['CHEGAB', 'Patrocinador; ciência das respostas', 'Alto', 'Alta', 'Gerenciar de perto'],
  ['SUBEXE', 'Patrocinador', 'Alto', 'Alta', 'Gerenciar de perto'],
  ['Assessora de Controle Interno', 'Ponto focal, validação e homologação', 'Alto', 'Alta', 'Gerenciar de perto'],
  ['Analistas da ASCOIN', 'Usuários-chave', 'Alto', 'Média', 'Manter informados e envolvidos'],
  ['AGE / ASSGEST', 'Product Owner, suporte e administração', 'Alto', 'Alta', 'Gerenciar de perto'],
  ['Pontos focais das áreas', 'Usuários (resposta às demandas)', 'Médio', 'Média', 'Manter informados; treinar'],
  ['Subsecretários e Secretário', 'Gestores (leitura, validação opcional)', 'Médio', 'Alta', 'Manter satisfeitos'],
  ['AUDIN', 'Usuária (fase 2) e independência técnica', 'Médio', 'Média', 'Manter informada'],
  ['PRODERJ', 'Destino futuro da hospedagem', 'Baixo', 'Média', 'Monitorar'],
], [0.24, 0.27, 0.12, 0.12, 0.25]));
C.push(H2('5.2 Matriz RACI'));
C.push(nota('R = responsável · A = aprova · C = consultado · I = informado'));
C.push(...tab(['Atividade', 'CHEGAB/SUBEXE', 'ASCOIN', 'AGE (PO)', 'Equipe técnica', 'Áreas'], [
  ['Aprovar escopo e documento de projeto', 'A', 'C', 'R', 'C', 'I'],
  ['Validar fluxos e regras', 'I', 'A', 'R', 'C', 'C'],
  ['Construir e testar', 'I', 'C', 'A', 'R', 'I'],
  ['Fornecer planilha base e checklists', 'I', 'R', 'A', 'C', 'I'],
  ['Migrar dados', 'I', 'A', 'C', 'R', 'I'],
  ['Homologar', 'I', 'R', 'A', 'C', 'C'],
  ['Treinar usuários', 'I', 'C', 'A', 'R', 'I'],
  ['Autorizar go-live', 'A', 'C', 'R', 'C', 'I'],
  ['Operar e dar suporte', 'I', 'C', 'A', 'R', 'I'],
], [0.31, 0.14, 0.12, 0.13, 0.16, 0.14]));
C.push(H2('5.3 Ritos de governança'));
C.push(...tab(['Rito', 'Frequência', 'Participantes', 'Saída'], [
  ['Reunião de acompanhamento', 'Semanal', 'ASCOIN, AGE, equipe técnica', 'Decisões registradas, status report, riscos atualizados'],
  ['Validação de fluxo (passo a passo)', 'Sob demanda, até concluir os passos 4 a 9', 'ASCOIN, AGE', 'Regras confirmadas e aplicadas na maquete'],
  ['Revisão de entrega (demo)', 'A cada etapa da construção', 'ASCOIN, AGE', 'Aceite parcial ou ajustes'],
  ['Comitê de patrocínio', 'Nos marcos (aprovação, go-live)', 'CHEGAB, SUBEXE, ASCOIN, AGE', 'Aprovações formais'],
], [0.27, 0.22, 0.25, 0.26]));

// 6 ABORDAGEM E PROTÓTIPO
C.push(H1('6. Abordagem e evolução do protótipo'));
C.push(P('O sistema está nascendo por **prototipação evolutiva**: cada versão da maquete navegável materializa decisões do Product Owner e serve de especificação viva para a construção. A maquete usa dados fictícios, simula todos os perfis por um seletor de “Visão” e não grava nada, mas segue as mesmas regras de acesso previstas para o banco.'));
C.push(H2('6.1 Linha do tempo'));
C.push(...tab(['Data', 'Versão', 'Entrega', 'Decisões incorporadas'], [
  ['13/11', 'Levantamento', 'Questionário respondido, análise do Regimento, proposta de MVP, modelo de dados, matriz de permissões, plano de 10 dias', 'Repositório em subpasta; ciência da CHEGAB por demanda; itens restritos; independência da Auditoria; alertas só no sistema; prorrogação de até 50%; um papel por usuário'],
  ['13/11', 'Maquete v1', 'Todas as telas do MVP, fluxo completo da demanda, checklists com assinatura, painel', 'Visual escuro em widgets; arquivo HTML único'],
  ['16/11', 'Maquete v2', 'Azul institucional; parecer com vários responsáveis; pool de checklists; trilha de auditoria legível', 'Várias assinaturas por documento; trilha em linguagem simples'],
  ['16/11', 'Maquete v3', 'Três temas; Configurações e Manutenção; faixa de notícias; guia visual da assinatura; abertura automática de checklist; agenda; detalhamento ao clicar nos gráficos; usuários e perfis; resumo do usuário', 'Pendências nascem na geração do parecer; checklist abre ao cadastrar o processo'],
  ['16 e 17/11', 'Maquete v4', 'Aplicação da análise de melhorias; distribuição (passo 2) e atendimento (passo 3) detalhados', 'Analista por demanda; encaminhamento para subárea; responsável na área; lembrete de ciência; colaborador da área; rascunho; validação da chefia por botão; evidência obrigatória; dúvida à ASCOIN'],
], [0.1, 0.13, 0.4, 0.37]));
C.push(H2('6.2 Como o protótipo é usado'));
C.push(B('**Especificação viva:** cada tela e regra da maquete vira requisito e critério de aceite.'));
C.push(B('**Validação com a área:** a ASCOIN navega com os perfis reais (Assessora, analista, ponto focal, colaborador, CHEGAB, subsecretária, auditor, administrador).'));
C.push(B('**Testes automatizados de navegação:** cada versão foi testada em navegador, em computador e celular, antes da publicação.'));
C.push(B('**Rastreabilidade:** decisões registradas no README do repositório e neste documento.'));
C.push(...img('painel.png', 600, 'Figura 1 — Painel executivo da maquete v4 (tema institucional)'));

// 7 ARQUITETURA
C.push(H1('7. Visão da solução e arquitetura'));
C.push(H2('7.1 Camadas'));
C.push(...tab(['Camada', 'Tecnologia', 'Responsabilidade'], [
  ['Apresentação', 'HTML, CSS e JavaScript puros (módulos ES, sem framework); PWA instalável', 'Telas responsivas, acessíveis e com identidade do Governo do RJ'],
  ['Hospedagem', 'Vercel (site estático)', 'Entrega do front-end; tarefas agendadas auxiliares'],
  ['Autenticação', 'Supabase Auth', 'E-mail institucional e senha; troca obrigatória no primeiro acesso; bloqueio por tentativas'],
  ['Dados e regras', 'PostgreSQL (Supabase) com RLS', 'Tabelas, views, funções e triggers em SQL padrão; regras de acesso por perfil e área'],
  ['Arquivos', 'Supabase Storage (bucket privado)', 'Evidências e PDFs, com URL assinada e hash SHA-256'],
  ['Funções de servidor', 'Supabase Edge Functions', 'Assinatura eletrônica (confere senha, registra IP), geração do PDF final, fila de e-mail'],
  ['Rotinas', 'pg_cron', 'Alertas de prazo, escalonamento, lembretes de ciência, limpeza da lixeira, conferência da trilha'],
  ['Tempo real', 'Supabase Realtime', 'Notificações no sino'],
], [0.17, 0.33, 0.5]));
C.push(H2('7.2 Princípios técnicos'));
C.push(B('**Segurança no banco:** RLS em todas as tabelas; a chave de serviço nunca vai para o navegador.'));
C.push(B('**Trilha imutável:** trigger genérico grava inclusões, alterações e exclusões; UPDATE e DELETE revogados na tabela de trilha.'));
C.push(B('**Exclusão lógica:** nada é apagado pela interface; justificativa obrigatória; restauração em 30 dias.'));
C.push(B('**Portabilidade PRODERJ:** lógica em SQL padrão e migrations numeradas; dependências exclusivas do Supabase evitadas quando há alternativa.'));
C.push(B('**Disponibilidade 24x7:** plano Pro do Supabase (não pausa por inatividade) com backup diário e recuperação a qualquer momento.'));
C.push(H2('7.3 Modelo de dados (entidades principais)'));
C.push(...tab(['Grupo', 'Tabelas'], [
  ['Cadastros', 'areas (organograma com parent_id), perfis, orgaos, temas, parametros, status_acompanhamento, transicoes_status, regras_prorrogacao'],
  ['Motor de acompanhamento', 'demandas (com analista e tema), itens_acompanhamento (origem: demanda, checklist, auditoria, risco), interacoes, evidencias, prorrogacoes, notificacoes'],
  ['Checklists', 'checklist_modelos (versionados), checklist_modelo_itens (com condição), processos, regras_abertura, checklist_lotes, checklist_aplicacoes, checklist_respostas (com anexos)'],
  ['Documentos', 'documentos, pareceres (versões e substituição), assinaturas (signatário, papel, ordem, recusa, IP)'],
  ['Governança', 'audit_log, lixeira (exclusão lógica nas próprias tabelas), fila_emails, janelas_manutencao'],
  ['Fase 2', 'planos_auditoria, trabalhos_auditoria, trabalho_equipe, papeis_trabalho, achados, manifestacoes, recomendacoes, processos_riscos, riscos, controles, testes_controle'],
], [0.22, 0.78]));

// 8 PERFIS
C.push(H1('8. Perfis de acesso'));
C.push(...tab(['Perfil', 'Enxerga', 'Pode fazer'], [
  ['Administrador (ASSGEST)', 'Tudo, exceto trabalhos de auditoria restritos', 'Usuários e perfis, configurações, manutenção, backups'],
  ['Controle Interno (ASCOIN)', 'Tudo, exceto auditoria restrita; a fila de cada analista mostra as suas demandas, e a Assessora vê toda a ASCOIN', 'Registrar e distribuir demandas, analisar, devolver, consolidar, encerrar, decidir prorrogações, gerar pareceres, responder dúvidas'],
  ['Auditoria Interna', 'Itens não restritos e os próprios trabalhos', 'Fase 2: plano anual, trabalhos, achados'],
  ['Ponto focal', 'A própria área e as subáreas', 'Confirmar recebimento e indicar responsável, encaminhar para subárea, responder com evidências, pedir prorrogação, enviar dúvida, assinar quando indicado'],
  ['Colaborador da área', 'Somente os itens em que foi designado', 'Responder e enviar dúvida nos itens designados'],
  ['Gestor', 'A própria hierarquia (CHEGAB e Secretário: tudo)', 'Ler o painel; ciência da CHEGAB; validar respostas quando a área exigir; assinar quando indicado'],
], [0.22, 0.34, 0.44]));
C.push(nota('Órgãos externos (TCE, CGE e demais) nunca acessam o sistema. Itens restritos são vistos apenas por ASCOIN, administrador, responsáveis designados e gestores autorizados. O administrador não vê trabalhos de auditoria restritos (Regimento, Art. 11, §1º).'));

// 9 REQUISITOS FUNCIONAIS
C.push(H1('9. Requisitos funcionais'));
C.push(nota('Prioridade MoSCoW: M = obrigatório (must), S = importante (should), C = desejável (could). Situação refere-se ao protótipo v4.'));
const RF = [
  ['RF01', 'Registrar demanda externa (órgão, tipo, documento, SEI, prazo, tema, analista, gravidade, restrição)', 'M', 'MVP', 'Prototipado'],
  ['RF02', 'Calcular reincidência pelo tema nos últimos 24 meses', 'S', 'MVP', 'Prototipado'],
  ['RF03', 'Distribuir itens às áreas, um a um ou em lote, com prazo sugerido (prazo do órgão menos 5 dias)', 'M', 'MVP', 'Validado'],
  ['RF04', 'Atribuir e trocar o analista da ASCOIN por demanda', 'M', 'MVP', 'Validado'],
  ['RF05', 'Confirmar recebimento (ciência) indicando o responsável na área', 'M', 'MVP', 'Validado'],
  ['RF06', 'Encaminhar item para subárea sem alterar prazo', 'S', 'MVP', 'Validado'],
  ['RF07', 'Responder com rascunho automático e evidência obrigatória (ou justificativa)', 'M', 'MVP', 'Validado'],
  ['RF08', 'Validação da chefia, habilitada por área', 'S', 'MVP', 'Validado'],
  ['RF09', 'Enviar dúvida à ASCOIN no item, sem parar o prazo', 'S', 'MVP', 'Validado'],
  ['RF10', 'Pedir e decidir prorrogação conforme regra parametrizável', 'M', 'MVP', 'Prototipado'],
  ['RF11', 'Analisar, aceitar ou devolver resposta para complementação', 'M', 'MVP', 'Prototipado (a validar)'],
  ['RF12', 'Consolidar resposta, registrar ciência da CHEGAB e envio ao órgão', 'M', 'MVP', 'Prototipado (a validar)'],
  ['RF13', 'Monitorar implementação e encerrar com resultado', 'M', 'MVP', 'Prototipado (a validar)'],
  ['RF14', 'Alertas D-5, D-2, vencimento e atraso; escalonamento à chefia e à CHEGAB', 'M', 'MVP', 'Prototipado'],
  ['RF15', 'Lembrete de ciência (2 dias) e aviso à chefia (3 dias), ajustáveis', 'M', 'MVP', 'Validado'],
  ['RF16', 'Resumo diário por área para despacho no SEI', 'S', 'MVP', 'Prototipado'],
  ['RF17', 'Painel executivo com indicadores, gráficos e detalhamento ao clicar', 'M', 'MVP', 'Prototipado'],
  ['RF18', 'Relatórios gerenciais com filtros e exportação PDF e Excel', 'M', 'MVP', 'Prototipado'],
  ['RF19', 'Busca global (demandas, itens, checklists, pareceres, códigos, SEI)', 'S', 'MVP', 'Prototipado'],
  ['RF20', 'Cadastrar processo com abertura automática do checklist por regra', 'M', 'MVP', 'Prototipado'],
  ['RF21', 'Preencher checklist versionado com itens condicionais, anexos e salvamento automático', 'M', 'MVP', 'Prototipado'],
  ['RF22', 'Amostragem com sorteio reproduzível (semente registrada)', 'S', 'MVP', 'Prototipado'],
  ['RF23', 'Gerar parecer com vários responsáveis; pendências nascem na geração', 'M', 'MVP', 'Validado'],
  ['RF24', 'Assinatura sequencial com prazo, recusa com motivo, substituição e parecer substituto', 'M', 'MVP', 'Prototipado'],
  ['RF25', 'Página pública de verificação (autenticidade, data e signatários)', 'M', 'MVP', 'Prototipado (a confirmar)'],
  ['RF26', 'Trilha de auditoria em linguagem simples, com filtros', 'M', 'MVP', 'Validado'],
  ['RF27', 'Lixeira com restauração em 30 dias', 'M', 'MVP', 'Prototipado'],
  ['RF28', 'Usuários com senha provisória e troca obrigatória; perfis', 'M', 'MVP', 'Prototipado'],
  ['RF29', 'Importação da planilha base com pré-visualização e validação', 'M', 'MVP', 'Pendente (sem planilha)'],
  ['RF30', 'Configurações (prazos, validação, abertura de checklists, assinatura, notificações, segurança)', 'M', 'MVP', 'Prototipado'],
  ['RF31', 'Manutenção (saúde, rotinas, backups, armazenamento, registros, versões, modo manutenção)', 'S', 'MVP/1.5', 'Prototipado'],
  ['RF32', 'Agenda com filtros e caixa de eventos do dia', 'C', '1.5', 'Prototipado'],
  ['RF33', 'Catálogo de widgets e painel personalizável', 'C', '1.5', 'Prototipado'],
  ['RF34', 'Temas institucional, claro e escuro', 'C', '1.5', 'Prototipado'],
  ['RF35', 'Faixa de notícias com destaques coletivos', 'C', '1.5', 'Prototipado'],
  ['RF36', 'Auditoria interna e riscos', 'M', 'Fase 2', 'Tabelas previstas'],
];
C.push(...tab(['ID', 'Requisito', 'Prior.', 'Fase', 'Situação'], RF, [0.07, 0.56, 0.07, 0.1, 0.2], { size: 17 }));

// 10 RNF
C.push(H1('10. Requisitos não funcionais'));
C.push(...tab(['ID', 'Categoria', 'Requisito'], [
  ['RNF01', 'Segurança', 'RLS em todas as tabelas; chave de serviço fora do navegador; testes de RLS por perfil.'],
  ['RNF02', 'Segurança', 'Senha mínima de 10 caracteres com letras e números; troca no 1º acesso; bloqueio após 5 tentativas; sessão encerrada após 30 min de inatividade.'],
  ['RNF03', 'Auditabilidade', 'Trilha de auditoria imutável, guardada por tempo indeterminado.'],
  ['RNF04', 'Integridade', 'Exclusão lógica com justificativa; pareceres assinados não podem ser excluídos.'],
  ['RNF05', 'Validade jurídica', 'Assinatura eletrônica simples (Lei 14.063/2020): senha no ato, data, hora, IP, hash SHA-256 e código de verificação.'],
  ['RNF06', 'Disponibilidade', '24x7, plano Pro do Supabase, backup diário com 7 dias de retenção e recuperação a qualquer momento.'],
  ['RNF07', 'Portabilidade', 'SQL padrão do Postgres e migrations versionadas para migração ao PRODERJ.'],
  ['RNF08', 'Usabilidade', 'Responsivo (computador e celular), PWA instalável, status simplificado para as áreas.'],
  ['RNF09', 'Acessibilidade', 'Fonte mínima de 12 px, navegação por teclado, contraste adequado, nomes do menu visíveis sob demanda.'],
  ['RNF10', 'Identidade visual', 'Padrão do Governo do RJ (azul institucional e dourado do brasão); brasão oficial a receber.'],
  ['RNF11', 'Desempenho', 'Telas principais em até 2 segundos com até 5 mil itens.'],
  ['RNF12', 'Privacidade', 'Sem dados pessoais sensíveis; marcação de restritos; mínimo necessário na página pública.'],
], [0.1, 0.18, 0.72]));

// 11 REGRAS DE NEGÓCIO
C.push(H1('11. Regras de negócio'));
C.push(...tab(['ID', 'Regra', 'Parametrizável'], [
  ['RN01', 'Prazos em dias corridos.', 'Sim'],
  ['RN02', 'Só a ASCOIN registra e distribui demandas (Regimento, Art. 10, VII).', 'Não'],
  ['RN03', 'Prazo sugerido da área = prazo do órgão menos 5 dias.', 'Sim'],
  ['RN04', 'Um item por área; resposta conjunta vira um item para cada área.', 'Não (MVP)'],
  ['RN05', 'Lembrete ao ponto focal após 2 dias sem ciência; aviso à chefia após 3 dias.', 'Sim'],
  ['RN06', 'Encaminhamento para subárea não altera o prazo; a área de origem continua responsável.', 'Não'],
  ['RN07', 'Resposta exige evidência ou justificativa “sem documento”.', 'Não'],
  ['RN08', 'Validação da chefia é opcional por área, herdada pelas subáreas; o prazo continua correndo.', 'Sim (por área)'],
  ['RN09', 'Prorrogação de até 50% do prazo original, um pedido por item, decidida pela ASCOIN.', 'Sim'],
  ['RN10', 'Alertas em D-5, D-2, no vencimento e em atraso; escalonamento ao superior e à CHEGAB.', 'Sim'],
  ['RN11', 'Ciência da CHEGAB por demanda: avança todos os itens consolidados.', 'Não'],
  ['RN12', 'Reincidência = mesmo tema nos últimos 24 meses.', 'Sim'],
  ['RN13', 'Checklist abre automaticamente ao cadastrar o processo, com a versão publicada mais recente do modelo.', 'Sim (por tipo)'],
  ['RN14', 'Itens não conformes viram pendências quando o parecer é gerado.', 'Não'],
  ['RN15', 'Assinatura sequencial (Elaborou → Revisou → Aprovou), prazo de 3 dias, recusa com motivo.', 'Sim'],
  ['RN16', 'Parecer assinado não muda nem é excluído; correção gera parecer substituto.', 'Não'],
  ['RN17', 'Lixeira restaurável por 30 dias; depois, só os arquivos são removidos.', 'Sim'],
  ['RN18', 'Um papel por usuário; perfis personalizados herdam as ações do perfil-base.', 'Não'],
], [0.08, 0.74, 0.18]));

// 12 FLUXOS
C.push(H1('12. Fluxos de processo'));
C.push(H2('12.1 Ciclo da demanda externa'));
C.push(P('O ciclo tem nove etapas. As etapas 1 a 3 estão validadas; as etapas 4 a 9 estão prototipadas e serão validadas nas próximas reuniões.'));
C.push(...tab(['#', 'Etapa', 'Quem executa', 'O que acontece', 'Status do item', 'Situação'], [
  ['1', 'Recebimento', 'ASCOIN (analista)', 'Registra a demanda, define tema e analista; o sistema aponta reincidência.', 'Recebida', 'Validado'],
  ['2', 'Distribuição', 'ASCOIN', 'Cria itens por área (um a um ou em lote), com prazo, gravidade, restrição e responsável opcional. Ponto focal avisado.', 'Distribuída', 'Validado'],
  ['3', 'Atendimento', 'Ponto focal ou colaborador designado; chefia quando exigido', 'Confirma recebimento e indica responsável; pode encaminhar para subárea, enviar dúvida e pedir prorrogação; responde com rascunho e evidência; validação da chefia quando habilitada.', 'Em atendimento → Respondida pela área', 'Validado'],
  ['4', 'Análise', 'Analista da ASCOIN', 'Analisa a resposta; aceita ou devolve para complementação com motivo.', 'Em análise → Consolidada ou Devolvida', 'A validar'],
  ['5', 'Consolidação', 'ASCOIN', 'Com todos os itens aceitos, consolida a resposta e pode assinar a resposta consolidada.', 'Consolidada', 'A validar'],
  ['6', 'Ciência da CHEGAB', 'Gestor da CHEGAB', 'Registra ciência por demanda.', 'Ciência CHEGAB', 'A validar'],
  ['7', 'Envio ao órgão', 'ASCOIN', 'Registra o ofício de resposta e a data de envio.', 'Enviada ao órgão', 'A validar'],
  ['8', 'Monitoramento', 'Ponto focal informa andamento; ASCOIN acompanha', 'Acompanha planos de ação e determinações até o prazo de implementação.', 'Em monitoramento', 'A validar'],
  ['9', 'Encerramento', 'ASCOIN', 'Encerra com resultado: atendida, parcialmente atendida, não atendida ou cancelada.', 'Final', 'A validar'],
], [0.04, 0.13, 0.17, 0.4, 0.15, 0.11], { size: 16 }));
C.push(...img('demanda.png', 560, 'Figura 2 — Demanda com itens distribuídos e indicador das etapas'));
C.push(H2('12.2 Atendimento pela área (passo 3 em detalhe)'));
C.push(N('O ponto focal recebe o aviso e abre o item na Minha fila.', 'n1'));
C.push(N('Confirma o recebimento e indica quem vai cuidar (ele ou um colega). Sem confirmação em 2 dias, lembrete; em 3 dias, aviso à chefia.', 'n1'));
C.push(N('Se o assunto for de uma subárea, encaminha o item; o prazo não muda e a ASCOIN é avisada.', 'n1'));
C.push(N('O responsável escreve a resposta; o rascunho é salvo automaticamente. Dúvidas vão ao analista pelo próprio item.', 'n1'));
C.push(N('Anexa evidências (ou justifica a ausência) e envia.', 'n1'));
C.push(N('Se a área exige validação, a chefia aprova (segue para a ASCOIN) ou devolve à equipe com motivo.', 'n1'));
C.push(N('A resposta chega ao analista da ASCOIN, que inicia o passo 4.', 'n1'));
C.push(...img('item.png', 560, 'Figura 3 — Item visto pela colaboradora designada, com rascunho da resposta'));
C.push(H2('12.3 Checklist de conformidade e parecer'));
C.push(...tab(['#', 'Etapa', 'Quem', 'Detalhe'], [
  ['1', 'Cadastro do processo', 'ASCOIN', 'Tipo, SEI, objeto, área. A regra do tipo decide se o checklist abre (todos ou amostra com sorteio).'],
  ['2', 'Abertura automática', 'Sistema', 'Cria a aplicação com a versão publicada do modelo, responsável e prazo de análise; avisa o responsável.'],
  ['3', 'Preenchimento', 'Analista da ASCOIN', 'Conforme, não conforme, com ressalva ou não se aplica; justificativa e referência SEI; anexos por item; itens condicionais; salvamento automático.'],
  ['4', 'Geração do parecer', 'Analista', 'Conclusão editável e lista de responsáveis com papéis. Não conformidades viram pendências para a área.'],
  ['5', 'Assinaturas', 'Responsáveis, em sequência', 'Cada um assina com a própria senha dentro do prazo; pode recusar com motivo; substituição em ausências.'],
  ['6', 'Conclusão', 'Sistema', 'Última assinatura gera o PDF final, o hash SHA-256, o código e o QR code de verificação.'],
  ['7', 'Correção', 'ASCOIN', 'Parecer substituto: o anterior fica guardado e marcado como substituído.'],
], [0.05, 0.2, 0.2, 0.55]));
C.push(H2('12.4 Assinatura eletrônica'));
C.push(...img('fluxo-assinatura.png', 560, 'Figura 4 — Passo a passo da assinatura (maquete v3)'));
C.push(H2('12.5 Fluxos de apoio'));
C.push(...tab(['Fluxo', 'Resumo'], [
  ['Prorrogação', 'Área pede com justificativa → ASCOIN aprova (novo prazo) ou nega com motivo → área é avisada → trilha registra.'],
  ['Alertas e escalonamento', 'Rotina diária às 07:00 gera D-5, D-2, vencimento e atraso; às 07:05 escalona atrasos à chefia e à CHEGAB; lembretes de ciência conforme regra.'],
  ['Resumo diário para o SEI', 'Texto por área com itens em aberto e vencidos, pronto para despacho pela ASCOIN.'],
  ['Exclusão e restauração', 'Excluir exige justificativa → registro vai à lixeira → restauração em até 30 dias → depois, rotina remove só os arquivos.'],
  ['Usuários', 'Administrador cria o usuário com senha provisória → usuário troca a senha no 1º acesso.'],
], [0.24, 0.76]));

// 13 HISTÓRIAS
C.push(H1('13. Histórias de usuário'));
C.push(nota('Formato: Como <perfil>, quero <ação>, para <benefício>. Critérios de aceite no padrão Dado / Quando / Então. Estimativa em pontos (escala de Fibonacci), para referência do planejamento.'));
const HIST = [
  ['E1 · Demandas externas', [
    ['US01', 'Como analista da ASCOIN, quero registrar uma demanda com tema e analista, para centralizar o controle desde a entrada.', 'Dado um ofício recebido, quando registro órgão, documento, SEI, prazo e tema, então a demanda aparece em Demandas com o aviso de reincidência, se houver.', 3, 'M'],
    ['US02', 'Como analista, quero distribuir itens às áreas (um a um ou em lote), para que cada área saiba o que entregar.', 'Dado uma demanda recebida, quando distribuo um item sem escolher área, então o sistema impede; quando escolho a área, então o ponto focal recebe aviso e o prazo começa a contar.', 5, 'M'],
    ['US03', 'Como Assessora, quero trocar o analista de uma demanda, para equilibrar a carga da equipe.', 'Dado uma demanda, quando troco o analista, então ela passa para a fila do novo analista e a troca vai para a trilha.', 2, 'M'],
    ['US04', 'Como ponto focal, quero confirmar o recebimento indicando quem vai cuidar, para registrar a ciência e a responsabilidade.', 'Dado um item distribuído, quando confirmo e escolho o responsável, então o item fica Em atendimento e o responsável aparece no item.', 2, 'M'],
    ['US05', 'Como ponto focal, quero encaminhar o item para uma subárea, para que quem tem a informação responda.', 'Dado um item da minha área, quando encaminho para uma subárea, então o prazo não muda, a ASCOIN é avisada e a área de origem continua responsável.', 3, 'S'],
    ['US06', 'Como responsável na área, quero escrever a resposta com rascunho salvo e anexar evidências, para não perder trabalho e comprovar o atendimento.', 'Dado um item em atendimento, quando envio sem evidência e sem justificativa, então o envio é barrado; quando anexo e envio, então a ASCOIN recebe a resposta.', 5, 'M'],
    ['US07', 'Como chefia de uma área que exige validação, quero aprovar ou devolver a resposta, para garantir a qualidade antes da ASCOIN.', 'Dado a validação habilitada para a área, quando a equipe envia, então o item aguarda minha validação; quando aprovo, então segue para a ASCOIN.', 3, 'S'],
    ['US08', 'Como responsável na área, quero enviar uma dúvida à ASCOIN no próprio item, para esclarecer sem sair do sistema.', 'Dado um item em atendimento, quando envio a dúvida, então o analista é avisado e a resposta fica no histórico; o prazo não para.', 2, 'S'],
    ['US09', 'Como ponto focal, quero pedir prorrogação, para ganhar prazo quando necessário.', 'Dado a regra de 50% e um pedido por item, quando peço acima do limite, então o sistema avisa; quando a ASCOIN aprova, então o prazo muda.', 3, 'M'],
    ['US10', 'Como analista, quero aceitar ou devolver a resposta, para garantir que atende ao órgão.', 'Dado uma resposta recebida, quando devolvo com motivo, então a área recebe o item de volta e a devolução é contada.', 3, 'M'],
    ['US11', 'Como Chefe de Gabinete, quero registrar ciência da resposta consolidada, para cumprir o controle de prazos do Gabinete.', 'Dado todos os itens consolidados, quando registro ciência, então a demanda segue para envio ao órgão.', 2, 'M'],
    ['US12', 'Como analista, quero registrar o envio, monitorar e encerrar, para fechar o ciclo com resultado.', 'Dado o envio registrado, quando o prazo de implementação chega, então o item aparece no monitoramento até o encerramento.', 3, 'M'],
  ]],
  ['E2 · Alertas e comunicação', [
    ['US13', 'Como ponto focal, quero receber alertas antes e depois do vencimento, para não perder prazos.', 'Dado um item com prazo, quando faltam 5 e 2 dias, vence ou atrasa, então recebo aviso; em atraso, a chefia e a CHEGAB são avisadas.', 3, 'M'],
    ['US14', 'Como analista, quero que o sistema cobre a ciência das áreas, para evitar itens parados.', 'Dado um item sem ciência há 2 dias, então o ponto focal recebe lembrete; há 3 dias, a chefia é avisada.', 2, 'M'],
    ['US15', 'Como ASCOIN, quero um resumo diário por área para o SEI, para alcançar quem não entra no sistema.', 'Quando abro o resumo do dia, então vejo o texto por área pronto para copiar.', 2, 'S'],
  ]],
  ['E3 · Gestão e informação', [
    ['US16', 'Como gestor, quero um painel com indicadores e detalhamento ao clicar, para decidir com dados.', 'Dado o painel, quando clico em uma barra ou fatia, então vejo os itens daquele recorte.', 5, 'M'],
    ['US17', 'Como ASCOIN, quero relatórios com filtros e exportação, para prestar contas.', 'Quando escolho o relatório e os filtros, então posso exportar em PDF e Excel.', 3, 'M'],
    ['US18', 'Como usuário, quero buscar por qualquer número, SEI ou código, para achar o registro rapidamente.', 'Quando busco um código de verificação, então o parecer correspondente aparece.', 2, 'S'],
  ]],
  ['E4 · Checklists e pareceres', [
    ['US19', 'Como analista, quero que o checklist abra ao cadastrar o processo, para não esquecer nenhuma análise.', 'Dado um tipo com regra ativa, quando cadastro o processo, então o checklist abre com o modelo vigente e o responsável é avisado.', 3, 'M'],
    ['US20', 'Como analista, quero preencher com anexos e itens condicionais, para registrar a análise completa.', 'Dado um item condicional que não se aplica ao momento, então ele é marcado automaticamente como não se aplica.', 5, 'M'],
    ['US21', 'Como analista, quero gerar o parecer e escolher os responsáveis, para formalizar a conclusão.', 'Quando gero o parecer, então as não conformidades viram pendências e os responsáveis são avisados na ordem.', 5, 'M'],
    ['US22', 'Como responsável, quero assinar na minha vez ou recusar com motivo, para garantir a revisão.', 'Dado a ordem sequencial, quando não é minha vez, então não posso assinar; quando recuso, então o parecer volta para ajuste.', 5, 'M'],
    ['US23', 'Como destinatário externo, quero conferir a autenticidade do parecer, para confiar no documento.', 'Quando informo o código ou leio o QR code, então vejo autenticidade, data e signatários, sem o conteúdo.', 2, 'M'],
  ]],
  ['E5 · Governança e administração', [
    ['US24', 'Como Assessora, quero uma trilha de auditoria legível, para saber quem fez o quê.', 'Quando filtro por pessoa ou ação, então vejo a descrição e o de/para em linguagem simples.', 3, 'M'],
    ['US25', 'Como ASCOIN, quero restaurar exclusões em 30 dias, para corrigir enganos.', 'Quando restauro um item da lixeira, então ele volta e a restauração vai para a trilha.', 2, 'M'],
    ['US26', 'Como administrador, quero criar usuários com senha provisória, para dar acesso com segurança.', 'Quando crio o usuário, então ele é obrigado a trocar a senha no 1º acesso.', 2, 'M'],
    ['US27', 'Como administrador, quero acompanhar rotinas e backups, para garantir a operação 24x7.', 'Quando uma rotina falha, então ela aparece com atenção na manutenção.', 3, 'S'],
  ]],
];
HIST.forEach(([ep, hs]) => { C.push(H2(ep)); C.push(...tab(['ID', 'História', 'Critério de aceite', 'Pts', 'Prior.'], hs, [0.07, 0.38, 0.43, 0.05, 0.07], { size: 16 })); });
const pts = HIST.flatMap((x) => x[1]).reduce((a, h) => a + h[3], 0);
C.push(P(`Total do backlog do MVP: **${HIST.flatMap((x) => x[1]).length} histórias, ${pts} pontos**.`));

// 14 PROTÓTIPO
C.push(H1('14. Protótipo: inventário e acesso'));
C.push(H2('14.1 Telas'));
C.push(...tab(['Módulo', 'Telas'], [
  ['Visão geral', 'Painel executivo (12 widgets, filtros, detalhamento); Minha fila por perfil; Agenda; Busca'],
  ['Acompanhamento', 'Demandas; detalhe da demanda; item com resposta, histórico, evidências e prorrogações; Pendências (abas: abertas, vencidas, a vencer, com a ASCOIN, devolvidas, sem ciência, encerradas); Prorrogações'],
  ['Conformidade', 'Checklists (registros e pareceres, processos, modelos, amostragem); aplicação; parecer com assinaturas; como funciona a assinatura'],
  ['Gestão', 'Relatórios gerenciais; Notificações; Lixeira; Trilha de auditoria'],
  ['Sistema', 'Configurações (10 seções) e Manutenção (8 seções), com subitens no menu lateral'],
  ['Públicas', 'Login; troca de senha no 1º acesso; verificação de documento'],
  ['Fase 2', 'Prévias de Auditoria interna e Riscos e controles'],
], [0.2, 0.8]));
C.push(H2('14.2 Onde encontrar'));
C.push(...tab(['Artefato', 'Local'], [
  ['Repositório', 'rodpereirarm-netizen/seenemar-transportes, pasta siscontrole-sedes/, branch claude/intelligent-hopper-xqz6pw'],
  ['Maquete v4 (atual)', 'siscontrole-sedes/SisControle_SEDES_maquete_v4.html e link privado no claude.ai'],
  ['Versões anteriores', 'SisControle_SEDES_maquete.html (v1), _v2.html, _v3.html'],
  ['Guia visual da assinatura', 'siscontrole-sedes/docs/assinatura/ (8 telas e visão completa)'],
  ['Decisões', 'siscontrole-sedes/README.md'],
], [0.24, 0.76]));
C.push(H2('14.3 Perfis disponíveis no seletor “Visão”'));
C.push(P('Juliana Prado (Assessora, ASCOIN), Renata Duarte (analista, ASCOIN), Fernanda Lopes (ponto focal, DGAF), Aline Torres (colaboradora, COCON), André Siqueira (ponto focal, ATI), Paulo Henrique Costa (Chefe de Gabinete), Luciana Barros (Subsecretária Executiva), Roberto Alves (Auditoria) e Marcelo Teixeira (Administrador). Todos os nomes e dados são fictícios.'));

// 15 SITUAÇÃO ATUAL
C.push(H1('15. Situação atual'));
C.push(H2('15.1 Maturidade por módulo'));
C.push(...tab(['Módulo', 'Requisitos', 'Protótipo', 'Validação PO', 'Construção'], [
  ['Demandas: recebimento e distribuição', 'Completo', 'Completo', 'Validado', 'Não iniciada'],
  ['Demandas: atendimento pela área', 'Completo', 'Completo', 'Validado', 'Não iniciada'],
  ['Demandas: análise a encerramento', 'Completo', 'Completo', 'A validar', 'Não iniciada'],
  ['Alertas e comunicação', 'Completo', 'Completo', 'Parcial', 'Não iniciada'],
  ['Painel e relatórios', 'Completo', 'Completo', 'Validado', 'Não iniciada'],
  ['Checklists e pareceres', 'Completo', 'Completo', 'Validado', 'Não iniciada'],
  ['Governança (trilha, lixeira, usuários)', 'Completo', 'Completo', 'Validado', 'Não iniciada'],
  ['Importação da planilha base', 'Parcial', 'Tela pronta', 'Aguarda planilha', 'Não iniciada'],
  ['Auditoria e riscos (fase 2)', 'Inicial', 'Prévia', 'Não iniciada', 'Tabelas previstas'],
], [0.34, 0.15, 0.15, 0.18, 0.18]));
C.push(H2('15.2 Registro de decisões'));
C.push(...tab(['#', 'Data', 'Decisão'], [
  ['D01', '13/11', 'Projeto em subpasta do repositório existente, sem custo adicional.'],
  ['D02', '13/11', 'Ciência da CHEGAB por demanda (pode ser revista).'],
  ['D03', '13/11', 'Itens restritos: ASCOIN, administrador, responsável designado e gestores autorizados.'],
  ['D04', '13/11', 'Administrador não vê trabalhos de auditoria restritos.'],
  ['D05', '13/11', 'Alertas apenas no sistema por enquanto; usuários criados direto no banco.'],
  ['D06', '13/11', 'Prorrogação de até 50% do prazo, um pedido por item; tudo ajustável.'],
  ['D07', '13/11', 'Um papel por usuário; CHEGAB e Secretário veem tudo.'],
  ['D08', '16/11', 'Azul institucional; pareceres com vários responsáveis; pool de checklists; trilha legível.'],
  ['D09', '16/11', 'Pendências das não conformidades nascem na geração do parecer.'],
  ['D10', '16/11', 'Abertura automática do checklist ao cadastrar o processo.'],
  ['D11', '16/11', 'Menu com Configurações e Manutenção e seus subitens; temas claro, escuro e institucional.'],
  ['D12', '16/11', 'Aplicação da análise de melhorias (maquete v4).'],
  ['D13', '16/11', 'Distribuição: analista por demanda; só a ASCOIN distribui; encaminhamento para subárea; responsável na área; lembrete de ciência; um item por área.'],
  ['D14', '16/11', 'Atendimento: colaborador da área; rascunho; validação da chefia por botão e só quando necessária; evidência obrigatória; dúvida à ASCOIN; resposta parcial fora do MVP.'],
], [0.07, 0.1, 0.83]));
C.push(H2('15.3 Pendências em aberto'));
C.push(...tab(['#', 'Pendência', 'Responsável', 'Prazo sugerido'], [
  ['P01', 'Enviar a planilha base e a tabela de checklists em uso', 'ASCOIN', '25/11/2026'],
  ['P02', 'Validar os passos 4 a 9 do fluxo', 'ASCOIN e AGE', '24/11/2026'],
  ['P03', 'Validar o conjunto final de status', 'ASCOIN', '24/11/2026'],
  ['P04', 'Enviar a lista completa de vinculadas e as siglas das coordenadorias da DGAF', 'ASCOIN', '25/11/2026'],
  ['P05', 'Confirmar a página pública de verificação', 'ASCOIN e CHEGAB', '20/11/2026'],
  ['P06', 'Fornecer brasão oficial e manual de identidade visual', 'AGE', '25/11/2026'],
  ['P07', 'Levantar volume de demandas por ano e abertas hoje', 'ASCOIN', '25/11/2026'],
  ['P08', 'Contratar o plano Pro do Supabase e criar os projetos (produção e homologação)', 'AGE', '23/11/2026'],
  ['P09', 'Definir os 10 usuários iniciais e seus perfis', 'ASCOIN e AGE', '27/11/2026'],
  ['P10', 'Decidir sobre SMTP institucional para e-mail', 'AGE', 'Até o go-live'],
], [0.07, 0.55, 0.2, 0.18]));

// 16 ROADMAP
C.push(H1('16. Roadmap do produto'));
C.push(P('O roadmap mostra onde o sistema está e até onde pode chegar. As datas do MVP seguem o plano da seção 17; as demais são indicativas e dependem da priorização dos patrocinadores após o go-live.'));
C.push(H2('16.1 Linha do tempo'));
C.push(gantt());
C.push(esp(80));
C.push(new Paragraph({ children: [run('■ ', { color: AZUL }), run('MVP   ', { size: 18 }), run('■ ', { color: '2F7BE5' }), run('Fase 1.5   ', { size: 18 }), run('■ ', { color: '1D7F46' }), run('Fase 2   ', { size: 18 }), run('■ ', { color: OURO }), run('Evolução   ', { size: 18 }), run('◆ ', { color: '1D2A3A' }), run('Marco (sobre a barra)', { size: 18 })], spacing: { after: 200 } }));
C.push(H2('16.2 Marcos do roadmap'));
C.push(...tab(['Marco', 'Quando', 'Resultado esperado'], [
  ['Protótipo validado (passos 1 a 9)', 'Nov/2026', 'Fluxo completo aprovado pela ASCOIN'],
  ['Go-live do MVP', 'Dez/2026', 'Demandas, checklists, painel e trilha em produção'],
  ['Fim da operação assistida', 'Jan/2027', 'Áreas usando sem apoio diário; histórico conferido'],
  ['Entrega da fase 1.5', 'Fev/2027', 'Agenda, painel personalizável, e-mail institucional'],
  ['Auditoria interna em produção', 'Mai/2027', 'Plano anual, trabalhos e achados no sistema'],
  ['Avaliação de 6 meses', 'Jun/2027', 'Medição dos objetivos OE2 e OE4 (vencidos e devoluções)'],
  ['Riscos e controles em produção', 'Jun/2027', 'Mapa de riscos e planos de tratamento no motor'],
  ['Evoluções e migração ao PRODERJ', '2º semestre/2027', 'Assinatura qualificada, integração SEI, BI'],
], [0.38, 0.17, 0.45]));
C.push(H2('16.3 Horizontes'));
C.push(...tab(['Horizonte', 'Entrega', 'Valor'], [
  ['Curto prazo (MVP)', 'Controle centralizado das demandas, checklists de convênios com parecer assinado, painel e trilha', 'Resposta ao apontamento do TCE e à cobrança do Gabinete'],
  ['Médio prazo (1.5)', 'Agenda, painel personalizável, temas, faixa de notícias, manutenção completa, e-mail institucional', 'Adoção pelas áreas e menos esforço de acompanhamento'],
  ['Fase 2', 'Auditoria interna e gestão de riscos integradas ao motor de acompanhamento', 'Cobertura das três linhas de defesa e do Art. 3º, XIII'],
  ['Evolução', 'Assinatura gov.br/ICP-Brasil; integração com SEI (consulta de processos); classificação assistida de temas; painéis de BI; migração ao PRODERJ', 'Maior validade jurídica, automação e escala para outras secretarias'],
], [0.2, 0.48, 0.32]));
C.push(destaque('A arquitetura em SQL padrão e o motor único de acompanhamento permitem reutilizar o sistema em outras secretarias com mudança apenas de cadastros (organograma, órgãos, modelos de checklist).'));

// 17 CRONOGRAMA
C.push(H1c('17. Plano de entregas do MVP'));
C.push(P('Início sugerido em 23/11/2026, condicionado à aprovação deste documento e ao ambiente contratado. Duração de 10 dias úteis.'));
C.push(...tab(['Dia', 'Data', 'Entrega', 'Critério de pronto'], [
  ['1', '23/11', 'Estrutura, PWA, identidade visual; migrations de cadastros, perfis, áreas, trilha e exclusão lógica; login e troca de senha', 'Login funcionando; trilha gravando; testes de RLS dos cadastros'],
  ['2', '24/11', 'Migrations do motor (demandas, itens, interações, evidências, prorrogações, status); tabelas da fase 2; testes de RLS', 'Todos os perfis com acesso correto nos testes'],
  ['3', '25/11', 'Demandas: registro, distribuição (inclusive em lote), analista', 'Fluxo dos passos 1 e 2 em homologação'],
  ['4', '26/11', 'Atendimento: ciência, encaminhamento, rascunho, evidências, validação da chefia, dúvidas, prorrogação', 'Passo 3 completo'],
  ['5', '27/11', 'Análise, consolidação, ciência da CHEGAB, envio, monitoramento, encerramento; alertas e escalonamento (pg_cron)', 'Ciclo de 9 etapas ponta a ponta'],
  ['6', '30/11', 'Painel com detalhamento; relatórios PDF e Excel; busca', 'Indicadores conferidos com dados de teste'],
  ['7', '01/12', 'Checklists: processos, abertura automática, preenchimento, amostragem, pendências', 'Checklist de convênios completo'],
  ['8', '02/12', 'Parecer, assinatura sequencial (Edge Function), verificação pública, lixeira', 'Assinatura com hash e código verificáveis'],
  ['9', '03/12', 'Importação da planilha base; configurações e manutenção essenciais; resumo diário para o SEI', 'Histórico migrado e conferido'],
  ['10', '04/12', 'Testes finais, checklist de homologação, README, deploy de produção', 'Aceite da ASCOIN'],
], [0.06, 0.09, 0.53, 0.32]));
C.push(H2('Marcos'));
C.push(...tab(['Marco', 'Data prevista', 'Critério'], [
  ['M1 · Aprovação do documento de projeto', '20/11/2026', 'Assinaturas da seção de aprovações'],
  ['M2 · Ambiente contratado (Supabase Pro e Vercel)', '23/11/2026', 'Projetos de homologação e produção criados'],
  ['M3 · Planilha base recebida', '25/11/2026', 'Arquivo entregue e colunas mapeadas'],
  ['M4 · Homologação', '03 a 04/12/2026', 'Checklist de homologação aprovado pela ASCOIN'],
  ['M5 · Treinamento presencial e go-live', '07/12/2026', 'Usuários treinados; sistema em produção'],
  ['M6 · Avaliação pós-implantação', '07/01/2027', 'Indicadores do mês e lições aprendidas'],
], [0.46, 0.2, 0.34]));

// 18 RISCOS
C.push(H1('18. Gestão de riscos'));
C.push(nota('Probabilidade e impacto: A = alto, M = médio, B = baixo.'));
C.push(...tab(['#', 'Risco', 'P', 'I', 'Resposta', 'Dono'], [
  ['R01', 'Escopo do protótipo maior que o prazo de 10 dias', 'A', 'A', 'Congelar o MVP (seção 4.1); itens 1.5 e fase 2 só após o go-live', 'PO'],
  ['R02', 'Planilha base atrasar ou exigir saneamento', 'A', 'A', 'Cobrar até 25/11; prever dia de saneamento; migração em duas cargas', 'ASCOIN'],
  ['R03', 'Baixa adesão das áreas sem e-mail', 'M', 'A', 'Resumo diário pelo SEI; treinamento; lembretes de ciência', 'ASCOIN'],
  ['R04', 'Falha de regra de acesso (RLS)', 'B', 'A', 'Testes de RLS por perfil em cada entrega; revisão de segurança', 'Equipe técnica'],
  ['R05', 'Indisponibilidade por uso de plano gratuito', 'M', 'A', 'Contratar o plano Pro antes do go-live', 'AGE'],
  ['R06', 'Mudanças frequentes de escopo', 'A', 'M', 'Controle de mudanças (seção 19.3)', 'PO'],
  ['R07', 'Indisponibilidade da equipe da ASCOIN para homologar', 'M', 'M', 'Agendar homologação com antecedência; roteiro curto', 'ASCOIN'],
  ['R08', 'Dependência do Supabase na migração ao PRODERJ', 'M', 'M', 'SQL padrão, migrations versionadas, exportação de dump', 'Equipe técnica'],
  ['R09', 'Status e passos 4 a 9 alterados após a construção', 'M', 'M', 'Validar antes do dia 5; status em tabela configurável', 'ASCOIN'],
  ['R10', 'Identidade visual oficial não recebida', 'M', 'B', 'Usar espaço reservado; trocar sem impacto no código', 'AGE'],
], [0.06, 0.32, 0.05, 0.05, 0.38, 0.14], { size: 17 }));

// 19 MONITORAMENTO
C.push(H1('19. Monitoramento e controle'));
C.push(H2('19.1 Indicadores do projeto'));
C.push(...tab(['Indicador', 'Fórmula', 'Meta', 'Frequência'], [
  ['Avanço do escopo', 'Pontos concluídos / pontos do MVP', '100% no dia 10', 'Diária na construção'],
  ['Aderência ao cronograma', 'Marcos cumpridos na data / marcos previstos', '≥ 90%', 'Semanal'],
  ['Qualidade', 'Defeitos abertos por gravidade', 'Zero críticos no go-live', 'Diária'],
  ['Segurança', 'Testes de RLS aprovados / testes de RLS', '100%', 'A cada entrega'],
  ['Decisões pendentes', 'Pendências abertas vencidas', 'Zero', 'Semanal'],
  ['Riscos', 'Riscos altos sem resposta em execução', 'Zero', 'Semanal'],
  ['Adoção (pós go-live)', 'Itens com ciência no prazo / itens distribuídos', '≥ 90%', 'Mensal'],
], [0.22, 0.38, 0.2, 0.2]));
C.push(H2('19.2 Relatório semanal de situação (modelo)'));
C.push(...tab(['Campo', 'Conteúdo'], [
  ['Período', 'Semana de dd/mm a dd/mm'],
  ['Farol geral', 'Verde / Amarelo / Vermelho, com justificativa'],
  ['Entregue na semana', 'Histórias e marcos concluídos'],
  ['Próxima semana', 'Histórias e marcos previstos'],
  ['Decisões tomadas', 'Número e resumo (registro de decisões)'],
  ['Pendências e bloqueios', 'Responsável e prazo'],
  ['Riscos', 'Novos, alterados, encerrados'],
  ['Indicadores', 'Avanço, defeitos, testes de RLS'],
], [0.28, 0.72]));
C.push(H2('19.3 Controle de mudanças'));
C.push(N('Quem pede registra o pedido de mudança (o quê, por quê, urgência).', 'n2'));
C.push(N('O PO avalia o impacto em escopo, prazo, risco e custo.', 'n2'));
C.push(N('Mudança dentro do MVP e sem impacto no prazo: PO aprova. Com impacto no prazo ou no escopo do MVP: patrocinadores aprovam.', 'n2'));
C.push(N('A decisão entra no registro de decisões e no backlog; a maquete é atualizada quando a mudança afeta telas ou fluxos.', 'n2'));

// 20 QUALIDADE
C.push(H1('20. Qualidade e homologação'));
C.push(H2('20.1 Estratégia de testes'));
C.push(...tab(['Tipo', 'Escopo', 'Ferramenta / forma'], [
  ['Testes de RLS', 'Cada perfil, em cada tabela: o que lê, o que grava, o que é negado', 'Scripts SQL que simulam o papel (set local role e claims)'],
  ['Testes de fluxo', 'Ciclo de 9 etapas, checklist e assinatura', 'Navegação automatizada (Playwright) em computador e celular'],
  ['Testes de regra', 'Prazos, prorrogação, reincidência, sorteio, ordem de assinatura', 'Funções SQL com casos de teste'],
  ['Acessibilidade', 'Teclado, contraste, tamanho de fonte, leitor de tela', 'Verificação manual e automatizada'],
  ['Homologação', 'Roteiro da ASCOIN com dados reais migrados', 'Checklist de homologação (20.2)'],
], [0.18, 0.46, 0.36]));
C.push(H2('20.2 Checklist de homologação (resumo)'));
['Registrar demanda e ver aviso de reincidência', 'Distribuir itens um a um e em lote', 'Confirmar recebimento, encaminhar e responder com evidência', 'Validar resposta pela chefia (área habilitada)', 'Analisar, devolver e aceitar resposta', 'Consolidar, registrar ciência da CHEGAB e envio', 'Receber alertas, lembretes e escalonamento', 'Cadastrar processo, preencher checklist e gerar parecer', 'Assinar em sequência, recusar e emitir parecer substituto', 'Conferir parecer na página pública', 'Conferir painel, relatórios e exportações', 'Excluir e restaurar pela lixeira', 'Conferir a trilha de auditoria', 'Conferir histórico migrado da planilha base'].forEach((x) => C.push(B(`☐ ${x}`)));
C.push(H2('20.3 Definição de pronto'));
C.push(B('Critérios de aceite da história atendidos e demonstrados.'));
C.push(B('Migrations versionadas, com RLS e comentários; testes de RLS aprovados.'));
C.push(B('Tela responsiva e acessível; sem erros no navegador.'));
C.push(B('Trilha de auditoria registrando as ações da história.'));
C.push(B('Documentação atualizada (README e, se for o caso, este documento).'));

// 21 IMPLANTAÇÃO
C.push(H1('21. Implantação, operação e suporte'));
C.push(...tab(['Tema', 'Plano'], [
  ['Ambientes', 'Homologação e produção separados no Supabase (plano Pro) e na Vercel'],
  ['Migração de dados', 'Importação da planilha base com pré-visualização, validação linha a linha e conferência pela ASCOIN'],
  ['Treinamento', 'Presencial: ASCOIN (completo), pontos focais (atendimento), gestores (painel e validação); guia rápido por perfil'],
  ['Suporte', 'Assessoria de Gestão Estratégica (ASSGEST): administrador do sistema e primeiro nível'],
  ['Backup', 'Diário automático, 7 dias de retenção, recuperação a qualquer momento; exportação do banco para o PRODERJ'],
  ['Operação', 'Rotinas no banco (alertas 07:00, escalonamento 07:05, lixeira 03:00, conferência da trilha 02:00); modo manutenção com aviso aos usuários'],
  ['Migração ao PRODERJ', 'Exportar o banco (dump), aplicar as migrations no novo Postgres, ajustar autenticação e armazenamento, republicar o front-end'],
], [0.2, 0.8]));

// 22 PRÓXIMAS ETAPAS
C.push(H1('22. Próximas etapas'));
C.push(...tab(['#', 'Ação', 'Responsável', 'Prazo'], [
  ['1', 'Aprovar este documento de projeto (marco M1)', 'Patrocinadores, ASCOIN, AGE', '20/11/2026'],
  ['2', 'Validar o passo 4 (análise da ASCOIN) e, em seguida, os passos 5 a 9', 'ASCOIN e AGE', '24/11/2026'],
  ['3', 'Confirmar a página pública de verificação e o conjunto de status', 'ASCOIN', '20/11/2026'],
  ['4', 'Entregar planilha base, tabela de checklists e lista de vinculadas', 'ASCOIN', '25/11/2026'],
  ['5', 'Contratar o Supabase Pro e criar os ambientes', 'AGE', '23/11/2026'],
  ['6', 'Iniciar a construção do MVP (dia 1)', 'Equipe técnica', '23/11/2026'],
  ['7', 'Agendar homologação e treinamento presencial', 'ASCOIN e AGE', '27/11/2026'],
], [0.05, 0.55, 0.25, 0.15]));

// ANEXOS
C.push(H1('Anexo A · Glossário'));
C.push(...tab(['Termo', 'Significado'], [
  ['ASCOIN', 'Assessoria de Controle Interno'], ['AUDIN', 'Assessoria de Auditoria Interna'], ['CHEGAB', 'Chefia de Gabinete'], ['SUBEXE', 'Subsecretaria Executiva'], ['AGE / ASSGEST', 'Assessoria de Gestão Estratégica'],
  ['Demanda', 'Pedido de um órgão de controle (ofício, diligência, relatório, requisição)'], ['Item', 'Parte de uma demanda atribuída a uma área, com prazo próprio'],
  ['Ponto focal', 'Representante da área que recebe e responde os itens'], ['Colaborador da área', 'Pessoa designada para cuidar de itens específicos'],
  ['Ciência', 'Confirmação de recebimento (pela área) ou de conhecimento (pela CHEGAB)'], ['Parecer', 'Documento conclusivo de um checklist, assinado eletronicamente'],
  ['RLS', 'Row Level Security: regras de acesso aplicadas pelo banco de dados'], ['MVP', 'Produto mínimo viável: primeira versão em produção'],
  ['PWA', 'Aplicação web instalável no computador e no celular'], ['Hash SHA-256', 'Impressão digital do arquivo, que prova que ele não foi alterado'],
], [0.24, 0.76]));
C.push(H1c('Anexo B · Referências'));
C.push(B('Regimento Interno da SEDES, publicado no DOERJ de 27/10/2026.'));
C.push(B('Lei nº 14.063/2020 (assinaturas eletrônicas) e Lei nº 13.709/2018 (LGPD).'));
C.push(B('Questionário de levantamento de requisitos respondido pela ASCOIN (13/11/2026).'));
C.push(B('Manual de Auditoria da CGE-RJ (estrutura de achados: critério, condição, causa, efeito, evidência).'));
C.push(B('COSO e ABNT NBR ISO 31000 (gestão de riscos, fase 2).'));
C.push(B('PMBOK (guia de gerenciamento de projetos) e práticas ágeis (histórias de usuário, definição de pronto).'));

/* ---------- documento ---------- */
const doc = new Document({
  features: { updateFields: true },
  creator: 'PMO / AGE · SEDES', title: 'SisControle SEDES — Documento de Projeto', description: 'Visão, requisitos, histórias, fluxos e plano do projeto',
  styles: {
    default: { document: { run: { font: F, size: 21, color: '1D2A3A' } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: F, size: 32, bold: true, color: AZUL }, paragraph: { spacing: { before: 120, after: 200 }, keepNext: true, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: OURO, space: 4 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: F, size: 26, bold: true, color: AZUL2 }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: F, size: 22, bold: true, color: AZUL }, paragraph: { spacing: { before: 200, after: 100 }, keepNext: true, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }, { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 900, hanging: 270 } } } }] },
    ...['num', 'n1', 'n2'].map((r) => ({ reference: r, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] })),
  ] },
  sections: [{
    properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } }, titlePage: true },
    headers: { default: new Header({ children: [new Paragraph({ children: [run('SisControle SEDES · Documento de Projeto · v1.0', { size: 16, color: CINZA })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINHA, space: 4 } }, tabStops: [{ type: TabStopType.RIGHT, position: W }] })] }), first: new Header({ children: [new Paragraph({ children: [] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run('Governo do Estado do Rio de Janeiro · SEDES · Uso interno       Página ', { size: 16, color: CINZA }), new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: CINZA }), run(' de ', { size: 16, color: CINZA }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: F, size: 16, color: CINZA })] })] }), first: new Footer({ children: [new Paragraph({ children: [] })] }) },
    children: C,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('ok', OUT, b.length); });
