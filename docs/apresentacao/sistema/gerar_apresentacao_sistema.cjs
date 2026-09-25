// Apresentação do Sistema de Controle de Contratações · GT PROPAG — visão geral e atuação por perfil.
// Telas capturadas de uma réplica local idêntica à produção (mesmos dados e mesma auditoria, posição de 25/09/2026).
// Nenhuma alteração foi feita no sistema: as capturas bloqueiam qualquer gravação.
const path = require('path');
const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'Sistema de Controle de Contratações · GT PROPAG';
pres.company = 'GT PROPAG · Compras Públicas';
pres.subject = 'Visão geral do sistema e atuação por perfil';
const IMG = (f) => path.join(__dirname, 'img', f);

const C = {
  navy: '16284D', navy2: '1E3564', navyLine: '3A5184', gold: 'C8962F', goldInk: '8A5F0D', goldLight: 'E0B45A',
  paper: 'F5F2EB', card: 'FFFFFF', line: 'E2DCCF', ink: '1B2236', muted: '5F5A4E', body: '3E3A30', red: 'B3372B',
  light: 'FBFAF6', lightMuted: 'CBD3E4', footDark: 'A9B4CD', blueSoft: 'E3E9F4', goldSoft: 'F6EACD', greenSoft: 'E1EEE5', green: '2F6B4F',
};
const SERIF = 'Cambria', SANS = 'Calibri';
const W = 13.333, M = 0.7, CW = W - 2 * M;
const PERFIL = {
  todos: ['TODOS OS PERFIS', C.navy, 'FFFFFF'], coord: ['COORDENAÇÃO', C.navy, 'FFFFFF'], elab: ['ELABORAÇÃO DE ARTEFATOS', '2F5E8E', 'FFFFFF'],
  conf: ['CONFORMIDADE', C.green, 'FFFFFF'], pf: ['PONTO FOCAL FAETEC', C.goldInk, 'FFFFFF'], admin: ['ADMINISTRADOR', C.red, 'FFFFFF'],
};
let N = 0;
function slide(bg = C.paper) { const s = pres.addSlide(); s.background = { color: bg }; N += 1; return s; }
function cabecalho(s, secao, titulo, dark = false) {
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: C.gold }, line: { color: C.gold } });
  s.addText(secao.toUpperCase(), { x: M, y: 0.45, w: CW, h: 0.3, fontFace: SANS, fontSize: 11.5, bold: true, charSpacing: 3, color: dark ? C.goldLight : C.goldInk, margin: 0, isTextBox: true });
  s.addText(titulo, { x: M, y: 0.76, w: CW, h: 0.66, fontFace: SERIF, fontSize: 30, bold: true, color: dark ? C.light : C.navy, margin: 0, valign: 'top', isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: M, y: 1.48, w: 1.1, h: 0, line: { color: C.gold, width: 2 } });
}
function rodape(s, dark = false) {
  s.addShape(pres.shapes.LINE, { x: M, y: 6.98, w: CW, h: 0, line: { color: dark ? C.navyLine : 'D9D2C3', width: 0.5 } });
  s.addText('Sistema de Controle de Contratações · GT PROPAG · telas com os dados do sistema em 25/09/2026', { x: M, y: 7.05, w: 10.5, h: 0.28, fontFace: SANS, fontSize: 10, color: dark ? C.footDark : '6E6758', margin: 0, isTextBox: true });
  s.addText(String(N), { x: W - M - 1, y: 7.05, w: 1, h: 0.28, fontFace: SANS, fontSize: 10.5, bold: true, color: dark ? C.goldLight : C.navy, align: 'right', margin: 0, isTextBox: true });
}
function imagem(s, arq, x, y, w, h) {
  s.addShape(pres.shapes.RECTANGLE, { x: x - 0.04, y: y - 0.04, w: w + 0.08, h: h + 0.08, fill: { color: 'FFFFFF' }, line: { color: 'CFC7B6', width: 0.75 }, shadow: { type: 'outer', color: '16284D', opacity: 0.18, blur: 12, offset: 3, angle: 90 } });
  s.addImage({ path: IMG(arq), x, y, w, h });
}
function selo(s, perfil, x, y) {
  const [t, fill, cor] = PERFIL[perfil];
  const w = 0.2 + t.length * 0.095;
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.34, fill: { color: fill }, line: { color: fill } });
  s.addText(t, { x, y, w, h: 0.34, fontFace: SANS, fontSize: 10.5, bold: true, charSpacing: 1.5, color: cor, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
}
// Tela de atuação: coluna à esquerda com perfil, quem atua e os itens numerados; tela à direita
function tela(perfil, quem, secao, titulo, arq, itens, nota) {
  const s = slide();
  cabecalho(s, secao, titulo);
  const lx = M, lw = 3.55, iw = CW - lw - 0.35, ih = iw * 9 / 16, ix = W - M - iw, iy = 1.72;
  selo(s, perfil, lx, iy);
  s.addText(quem, { x: lx, y: iy + 0.45, w: lw, h: 0.55, fontFace: SANS, fontSize: 12, italic: true, color: C.muted, margin: 0, valign: 'top', isTextBox: true });
  let y = iy + 1.1;
  itens.forEach(([t, d], k) => {
    s.addShape(pres.shapes.OVAL, { x: lx, y: y + 0.02, w: 0.36, h: 0.36, fill: { color: C.red }, line: { color: 'FFFFFF', width: 1.5 } });
    s.addText(String(k + 1), { x: lx, y: y + 0.02, w: 0.36, h: 0.36, fontFace: SANS, fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText([{ text: t, options: { bold: true, color: C.navy, breakLine: true } }, { text: d, options: { color: C.body, fontSize: 11.5 } }],
      { x: lx + 0.5, y, w: lw - 0.5, h: 1.0, fontFace: SANS, fontSize: 13, margin: 0, valign: 'top', isTextBox: true });
    y += itens.length > 3 ? 1.02 : 1.2;
  });
  imagem(s, arq, ix, iy, iw, ih);
  rodape(s);
  s.addNotes(nota);
  return s;
}

// ================================================================== 1 · Capa
{
  const s = slide(C.navy);
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.42, h: 7.5, fill: { color: C.gold }, line: { color: C.gold } });
  s.addText('GOVERNO DO ESTADO DO RIO DE JANEIRO', { x: 1.0, y: 0.65, w: 6, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.light, margin: 0, isTextBox: true });
  s.addText('GT PROPAG · COMPRAS PÚBLICAS', { x: 1.0, y: 0.95, w: 6, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.goldLight, margin: 0, isTextBox: true });
  s.addText('APRESENTAÇÃO DO SISTEMA', { x: 1.0, y: 2.05, w: 6, h: 0.35, fontFace: SANS, fontSize: 14, bold: true, charSpacing: 4, color: C.goldLight, margin: 0, isTextBox: true });
  s.addText('Sistema de Controle\nde Contratações', { x: 1.0, y: 2.45, w: 6.2, h: 1.9, fontFace: SERIF, fontSize: 46, bold: true, color: C.light, margin: 0, valign: 'top', isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 1.0, y: 4.5, w: 1.5, h: 0, line: { color: C.gold, width: 2.5 } });
  s.addText('Visão geral e atuação de cada perfil no fluxo de contratação da FAETEC.', { x: 1.0, y: 4.7, w: 5.6, h: 0.8, fontFace: SANS, fontSize: 17, color: C.lightMuted, margin: 0, valign: 'top', isTextBox: true });
  s.addText([{ text: 'Acesso', options: { bold: true, color: C.light, breakLine: true } }, { text: 'gt-propag-faetec.netlify.app', options: { color: C.goldLight } }],
    { x: 1.0, y: 6.2, w: 5.5, h: 0.65, fontFace: SANS, fontSize: 14, margin: 0, valign: 'bottom', isTextBox: true });
  const iw = 5.75, ih = iw * 9 / 16;
  s.addShape(pres.shapes.RECTANGLE, { x: 7.05, y: 2.2, w: iw + 0.1, h: ih + 0.1, fill: { color: C.navy2 }, line: { color: C.navyLine, width: 1 }, shadow: { type: 'outer', color: '000000', opacity: 0.35, blur: 18, offset: 6, angle: 90 } });
  s.addImage({ path: IMG('00-painel-4k.png'), x: 7.1, y: 2.25, w: iw, h: ih });
  s.addText('Painel de contratações', { x: 7.1, y: 2.25 + ih + 0.2, w: iw, h: 0.3, fontFace: SANS, fontSize: 11, color: C.footDark, margin: 0, isTextBox: true });
  s.addNotes('Apresentação do Sistema de Controle de Contratações do GT PROPAG. As telas apresentadas refletem os dados do sistema em 25/09/2026 e mostram como cada perfil visualiza e opera o fluxo de contratação.');
}

// ================================================================== 2 · O sistema em uma página
{
  const s = slide();
  cabecalho(s, 'Visão geral', 'O que o sistema oferece');
  const itens = [
    ['Carteira de contratações', 'Todas as demandas do GT, com etapa, atividade atual, responsável, valor e situação, com filtros e exportação para Excel.'],
    ['Checklist do fluxo', 'Cada contratação recebe as atividades das 5 etapas conforme a modalidade: 32 na adesão à ata, 26 nas demais e 7 enquanto a modalidade está a definir.'],
    ['Prazos legais', 'Contagem automática a partir da data de envio: SEPLAG 15 dias corridos, PRODERJ 20 dias úteis (+20) e CGE 15 dias corridos.'],
    ['Responsabilidades', 'Responsável geral por contratação e responsável por etapa, com propagação às atividades abertas e aviso ao integrante designado.'],
    ['Pendências e relatórios', 'Painel pessoal e da equipe, reports semanal, mensal e por período, posição da carteira, prazos e pendências.'],
    ['Auditoria', 'Registro de quem alterou, quando e o quê, com os valores anteriores e posteriores de cada campo.'],
  ];
  const cw = (CW - 2 * 0.3) / 3, ch = 2.35;
  itens.forEach(([t, d], i) => {
    const x = M + (i % 3) * (cw + 0.3), y = 1.8 + Math.floor(i / 3) * (ch + 0.3);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: ch, fill: { color: C.card }, line: { color: C.line, width: 0.75 }, shadow: { type: 'outer', color: '16284D', opacity: 0.07, blur: 8, offset: 2, angle: 90 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 0.07, fill: { color: C.gold }, line: { color: C.gold } });
    s.addText(String(i + 1).padStart(2, '0'), { x: x + 0.3, y: y + 0.28, w: 0.8, h: 0.5, fontFace: SERIF, fontSize: 24, bold: true, color: C.gold, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(t, { x: x + 1.0, y: y + 0.28, w: cw - 1.2, h: 0.5, fontFace: SANS, fontSize: 16, bold: true, color: C.navy, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(d, { x: x + 0.3, y: y + 0.95, w: cw - 0.6, h: 1.25, fontFace: SANS, fontSize: 13, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  });
  rodape(s);
  s.addNotes('Seis funcionalidades centrais. O sistema organiza a carteira, gera o checklist do fluxo conforme a modalidade, controla os prazos legais, distribui responsabilidades, consolida pendências e relatórios e registra todas as alterações em auditoria.');
}

// ================================================================== 3 · Perfis
{
  const s = slide();
  cabecalho(s, 'Perfis de acesso', 'Seis perfis, cada um com o seu papel no fluxo');
  const b = (t, perfil) => ({ text: t, options: { bold: true, color: PERFIL[perfil] ? PERFIL[perfil][1] : C.ink } });
  const rows = [
    [b('Coordenação', 'coord'), 'Karina Ferrarez · Vinicius Murat · Cristiane Vaz dos Santos Aguiar', 'Cadastra contratações, designa responsáveis, acompanha a equipe e edita todas as etapas'],
    [b('Conformidade', 'conf'), 'Elias Conceição Magalhães', 'Confere os artefatos, consulta a auditoria e as pendências da equipe; edita todas as etapas'],
    [b('Elaboração de artefatos', 'elab'), 'Andressa · Allana · Taina · Thamyres · Pascoal · Mara · Thailane · Marco', 'Executa as Etapas I e II (DOD, ETP, TR, mapa de riscos, adesão à ata) e cadastra atas'],
    [b('Ponto focal FAETEC', 'pf'), 'Jhonatan Silva Santos · Gibson Cruz da Silva · Luene Fernandes Curvello d’Ávila', 'Executa as Etapas III a V, registra envios com prazo legal, anexa documentos e andamentos'],
    [b('Administrador', 'admin'), 'Rodrigo Maul', 'Controle total: integrantes e perfis, listas, feriados, atividades, prazos e modalidades'],
    [b('Consulta', 'x'), 'Perfil disponível para quem precisa apenas acompanhar', 'Visualiza painel, contratações e relatórios, sem editar'],
  ];
  const hdr = ['Perfil', 'Integrantes', 'Atuação no sistema'].map((t) => ({ text: t, options: { bold: true, color: C.light, fill: { color: C.navy } } }));
  s.addTable([hdr, ...rows.map((r, i) => r.map((c) => { const o = typeof c === 'string' ? { text: c, options: {} } : c; return { text: o.text, options: { fill: { color: i % 2 ? 'FAF8F3' : C.card }, color: C.ink, ...o.options } }; }))],
    { x: M, y: 1.8, w: CW, colW: [2.6, 4.6, 4.733], fontFace: SANS, fontSize: 13, valign: 'middle', margin: [6, 9, 6, 9], border: { type: 'solid', pt: 0.5, color: C.line }, rowH: 0.62 });
  s.addText('Toda ação de qualquer perfil é registrada na auditoria. O que cada perfil pode editar é controlado no banco de dados, não apenas na tela.', { x: M, y: 6.35, w: CW, h: 0.45, fontFace: SANS, fontSize: 13, color: C.muted, margin: 0, isTextBox: true });
  rodape(s);
  s.addNotes('Relação dos perfis cadastrados no sistema e dos integrantes associados a cada um. As permissões são aplicadas pelas regras de segurança do banco de dados: a elaboração edita as Etapas I e II, o ponto focal as Etapas III a V, e coordenação, conformidade e administrador editam todas. Qualquer integrante edita as atividades pelas quais é responsável.');
}

// ================================================================== 4 · Quem atua em cada etapa
{
  const s = slide(C.navy);
  cabecalho(s, 'Fluxo de contratação', 'Quem atua em cada etapa', true);
  const et = [
    ['ETAPA I', 'Planejamento da contratação', '7 atividades', 'elab', 'DOD · ETP · TR · mapa de riscos · aprovação (VPA)'],
    ['ETAPA II', 'Adesão à ARP', '6 atividades', 'elab', 'Anuências · verificação de ata válida · vantajosidade'],
    ['ETAPA III', 'Comunicações e análises', '3 atividades', 'pf', 'SEPLAG 15 dias corridos · PRODERJ 20 dias úteis (+20)'],
    ['ETAPA IV', 'Pesquisa de preços', '7 atividades', 'pf', 'SIGA · RAPP · checklist PGE · disponibilidade orçamentária'],
    ['ETAPA V', 'Formalização e publicidade', '9 atividades', 'pf', 'Análise jurídica · CGE 15 dias corridos · empenho · PNCP'],
  ];
  const ew = (CW - 4 * 0.2) / 5;
  et.forEach(([e, n, q, perfil, d], i) => {
    const x = M + i * (ew + 0.2);
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.85, w: ew, h: 3.55, fill: { color: C.navy2 }, line: { color: C.navyLine, width: 0.75 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.85, w: ew, h: 0.07, fill: { color: C.gold }, line: { color: C.gold } });
    s.addText(e, { x: x + 0.2, y: 2.05, w: ew - 0.4, h: 0.3, fontFace: SANS, fontSize: 11, bold: true, charSpacing: 2, color: C.goldLight, margin: 0, isTextBox: true });
    s.addText(n, { x: x + 0.2, y: 2.35, w: ew - 0.4, h: 0.65, fontFace: SANS, fontSize: 15, bold: true, color: C.light, margin: 0, valign: 'top', isTextBox: true });
    s.addText(q, { x: x + 0.2, y: 3.0, w: ew - 0.4, h: 0.3, fontFace: SANS, fontSize: 12, color: C.lightMuted, margin: 0, isTextBox: true });
    s.addText(d, { x: x + 0.2, y: 3.4, w: ew - 0.4, h: 1.0, fontFace: SANS, fontSize: 11.5, color: C.lightMuted, margin: 0, valign: 'top', isTextBox: true });
    const [t, fill] = PERFIL[perfil];
    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.2, y: 4.6, w: ew - 0.4, h: 0.5, fill: { color: fill }, line: { color: perfil === 'elab' ? '5B86B5' : C.goldLight, width: 0.75 } });
    s.addText(t, { x: x + 0.2, y: 4.6, w: ew - 0.4, h: 0.5, fontFace: SANS, fontSize: 10.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  });
  s.addText([
    { text: 'Em todas as etapas: ', options: { bold: true, color: C.light } },
    { text: 'a coordenação designa responsáveis e acompanha; a conformidade confere os artefatos e a auditoria; o administrador mantém cadastros e regras.', options: { color: C.lightMuted } },
  ], { x: M, y: 5.65, w: CW, h: 0.8, fontFace: SANS, fontSize: 15, margin: 0, valign: 'top', isTextBox: true });
  rodape(s, true);
  s.addNotes('Divisão de responsabilidades por etapa, conforme cadastrada no sistema: as Etapas I e II são executadas pela elaboração de artefatos (Frente II) e as Etapas III a V pelo ponto focal FAETEC (Frente III). Coordenação, conformidade e administrador atuam de forma transversal.');
}

// ================================================================== 5 · Acesso
tela('todos', 'Todos os integrantes cadastrados', 'Acesso ao sistema', 'Entrada com e-mail institucional', '01-login.png', [
  ['E-mail institucional', 'Apenas e-mails cadastrados pelo administrador conseguem criar conta.'],
  ['Senha', 'Definida pelo próprio integrante no primeiro acesso; pode ser alterada depois no menu.'],
  ['Entrar', 'Abre o sistema já no perfil do integrante.'],
  ['Primeiro acesso', 'Cria a senha e vincula a conta automaticamente ao cadastro do integrante.'],
], 'Tela de entrada. O integrante acessa com o e-mail institucional cadastrado pelo administrador. No primeiro acesso, define a senha e a conta é vinculada automaticamente ao seu perfil.');

// ================================================================== 6 · Painel 4K
{
  const s = slide(C.navy);
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: C.gold }, line: { color: C.gold } });
  s.addText('TODOS OS PERFIS · PAINEL', { x: M, y: 0.3, w: 6, h: 0.3, fontFace: SANS, fontSize: 11.5, bold: true, charSpacing: 3, color: C.goldLight, margin: 0, isTextBox: true });
  s.addText('Visão consolidada da carteira', { x: M, y: 0.58, w: 7.5, h: 0.55, fontFace: SERIF, fontSize: 26, bold: true, color: C.light, margin: 0, isTextBox: true });
  s.addText('Indicadores, caminho crítico, andamento da Etapa I, modalidades e prazos legais', { x: W - M - 5.5, y: 0.66, w: 5.5, h: 0.45, fontFace: SANS, fontSize: 12, color: C.lightMuted, align: 'right', valign: 'bottom', margin: 0, isTextBox: true });
  const iw = 10.5, ih = iw * 9 / 16;
  s.addShape(pres.shapes.RECTANGLE, { x: (W - iw) / 2 - 0.04, y: 1.28 - 0.04, w: iw + 0.08, h: ih + 0.08, fill: { color: 'FFFFFF' }, line: { color: C.navyLine, width: 0.75 }, shadow: { type: 'outer', color: '000000', opacity: 0.35, blur: 16, offset: 5, angle: 90 } });
  s.addImage({ path: IMG('00-painel-4k.png'), x: (W - iw) / 2, y: 1.28, w: iw, h: ih });
  s.addNotes('Painel de contratações, disponível para todos os perfis. Reúne os indicadores da carteira, a distribuição das demandas pelas cinco etapas do caminho crítico, o andamento das atividades da Etapa I, a distribuição por modalidade e o acompanhamento dos prazos legais. Imagem em alta definição (3840 × 2160).');
}

// ================================================================== Coordenação
tela('coord', 'Karina Ferrarez · Vinicius Murat · Cristiane Vaz dos Santos Aguiar', 'Coordenação · carteira', 'Acompanhamento da carteira de contratações', '02-coord-carteira.png', [
  ['Filtros rápidos', 'Situação da carteira em um clique: em andamento, devolvidas, sem justificativa, sem responsável, prazo vencido.'],
  ['Filtro por responsável', 'Carteira de cada integrante, combinável com modalidade, etapa e situação.'],
  ['Nova contratação', 'Cadastro de demanda, disponível para coordenação e administrador.'],
  ['Exportar Excel', 'Carteira filtrada exportada em planilha.'],
], 'Tela de contratações, com a visão da coordenação. Os filtros rápidos mostram a quantidade de demandas em cada situação; a lista traz etapa, atividade atual, responsável, valor e situação de cada contratação.');
tela('coord', 'Karina Ferrarez · Vinicius Murat · Cristiane Vaz dos Santos Aguiar', 'Coordenação · cadastro', 'Cadastro de nova contratação', '03-coord-nova.png', [
  ['Cinco passos', 'Identificação, planejamento e PCA, enquadramento, responsáveis e documentos.'],
  ['Objeto padronizado', 'Descrição no padrão “Contratação de [objeto], visando atender às necessidades da FAETEC”.'],
  ['Prévia do checklist', 'O sistema mostra quantas atividades serão geradas e quais prazos legais serão monitorados.'],
], 'Tela de cadastro. Ao criar a contratação, o sistema gera automaticamente o checklist conforme a modalidade e passa a monitorar os prazos legais. A tela foi capturada sem preenchimento e nada foi salvo.');
tela('coord', 'Karina Ferrarez · Vinicius Murat · Cristiane Vaz dos Santos Aguiar', 'Coordenação · responsabilidades', 'Designação do responsável por etapa', '04-coord-responsaveis.png', [
  ['Responsável da etapa', 'Ao designar, o nome é aplicado a todas as atividades abertas da etapa e o integrante recebe um aviso no sistema.'],
  ['Checklist por etapa', 'Status, responsável e prazo de cada atividade, com o progresso da etapa ao lado.'],
], 'Checklist da contratação 01 (Chromebooks). A coordenação designa o responsável de cada etapa; a regra do banco aplica o nome às atividades abertas sem responsável e notifica o integrante. O responsável geral da contratação é definido na aba “Dados e painel”.');

// ================================================================== Elaboração
tela('elab', 'Andressa · Allana · Taina · Thamyres · Pascoal · Mara · Thailane · Marco', 'Elaboração · Etapas I e II', 'Execução das atividades de planejamento', '05-elab-checklist.png', [
  ['Status da atividade', 'Pendente, em andamento, aguardando, devolvida, concluída ou não se aplica.'],
  ['Prazo-meta', 'Data interna combinada para a entrega do artefato.'],
  ['Detalhar', 'Observação, responsável e datas da atividade.'],
  ['Progresso da etapa', 'Atividades concluídas sobre o total da etapa.'],
], 'Checklist da Etapa I visto pela elaboração de artefatos. O perfil edita as atividades das Etapas I e II; as etapas seguintes aparecem para consulta. Cada alteração gera andamento automático e registro na auditoria.');
tela('elab', 'Pascoal (pesquisa de atas de TI) e demais integrantes da Frente II', 'Elaboração · atas', 'Catálogo de atas de registro de preços', '06-elab-atas.png', [
  ['Cadastrar ata', 'Número, órgão gerenciador, objeto, fornecedor, forma de uso e vigência.'],
  ['Busca', 'Por número, órgão gerenciador, objeto ou fornecedor.'],
  ['Ata e contratações', 'Uso (adesão ou participante), vigência e as contratações vinculadas a cada ata.'],
], 'Catálogo de atas. A verificação de ata válida é o ponto de controle da Etapa II: sem ata válida, o fluxo de adesão é interrompido. Por isso, o registro da vigência é essencial.');

// ================================================================== Conformidade
tela('conf', 'Elias Conceição Magalhães', 'Conformidade · auditoria', 'Trilha de auditoria das alterações', '07-conf-auditoria.png', [
  ['Filtros', 'Período, usuário, registro e operação.'],
  ['Antes e depois', 'Valor anterior e novo de cada campo alterado.'],
  ['Exportar Excel', 'Histórico filtrado exportado em planilha.'],
], 'Tela de auditoria, disponível para conformidade, coordenação e administrador. Registra quem alterou, quando e o quê, sem possibilidade de edição. No exemplo, a alteração do nome do administrador em 24/09/2026.');
tela('conf', 'Elias Conceição Magalhães · também disponível para a coordenação', 'Conformidade · pendências', 'Pendências da equipe', '08-conf-pendencias-equipe.png', [
  ['Indicadores da equipe', 'Atividades abertas atribuídas, prazos vencidos, vencimentos em até 5 dias e atividades sem responsável.'],
  ['Carga por integrante', 'Atividades abertas, em curso, vencidas, a vencer e concluídas de cada integrante.'],
], 'Painel de pendências da equipe. Mostra a carga de cada integrante e destaca as atividades abertas sem responsável, que devem ser designadas na contratação ou por etapa.');

// ================================================================== Ponto focal
tela('pf', 'Jhonatan Silva Santos · Gibson Cruz da Silva · Luene Fernandes Curvello d’Ávila', 'Ponto focal · pendências', 'Minhas pendências', '09-pf-minhas-pendencias.png', [
  ['Indicadores pessoais', 'Atividades abertas, prazos vencidos, a vencer em 5 dias, aguardando terceiros e contratações coordenadas.'],
  ['Atividades atribuídas', 'Status editável na própria lista e acesso direto à contratação.'],
], 'Tela de pendências pessoais, no exemplo do integrante Gibson Cruz da Silva, com as duas atividades hoje atribuídas a ele. Cada integrante vê aqui o que está sob sua responsabilidade.');
tela('pf', 'Jhonatan Silva Santos · Gibson Cruz da Silva · Luene Fernandes Curvello d’Ávila', 'Ponto focal · Etapas III a V', 'Registro de envio e contagem de prazo legal', '10-pf-prazos-legais.png', [
  ['Status da atividade', 'Atualização do andamento das comunicações e análises.'],
  ['Data de envio', 'Ao registrar o envio, o sistema calcula o prazo legal: SEPLAG 15 dias corridos, PRODERJ 20 dias úteis (+20), CGE 15 dias corridos.'],
], 'Etapa III do checklist, executada pelo ponto focal FAETEC. A contagem do prazo legal começa na data de envio registrada, considerando dias corridos ou úteis e os feriados cadastrados.');
tela('pf', 'Luene Fernandes Curvello d’Ávila (ponto focal de documentos) e demais pontos focais', 'Ponto focal · documentos', 'Documentos e andamentos da contratação', '11-pf-documentos.png', [
  ['Anexar documentos', 'PDF, DOCX ou XLSX, até 50 MB por arquivo, com tipo e atividade vinculada.'],
  ['Andamentos', 'Registro cronológico das movimentações da contratação.'],
], 'Aba de documentos da contratação 01. Os arquivos ficam armazenados de forma privada e vinculados à contratação e, opcionalmente, à atividade.');

// ================================================================== Administrador
tela('admin', 'Rodrigo Maul', 'Administrador · manutenção', 'Integrantes, perfis e regras do fluxo', '12-admin-integrantes.png', [
  ['Cadastros', 'Integrantes e perfis, listas suspensas, áreas demandantes, feriados, atividades e prazos, modalidades.'],
  ['Novo integrante', 'Cadastro com órgão, frente, função, perfil e e-mail institucional.'],
  ['Situação de acesso', 'Indica quem já possui conta ativa e quem ainda não tem e-mail cadastrado.'],
], 'Tela de manutenção, exclusiva do administrador. Permite cadastrar integrantes e perfis e ajustar as regras do fluxo. A coluna de acesso mostra que, em 25/09/2026, apenas o administrador e a coordenadora Karina Ferrarez possuem conta ativa; os demais integrantes ainda precisam ter o e-mail cadastrado.');

// ================================================================== Todos · relatórios e equipe
tela('todos', 'Disponível para todos os perfis', 'Relatórios', 'Reports e posição da carteira', '14-relatorios.png', [
  ['Tipos de report', 'Report do período, carteira, prazos e pendências por integrante.'],
  ['Filtros', 'Modalidade, etapa, situação, responsável e órgão do responsável.'],
  ['Exportar Excel', 'Planilha com os dados filtrados.'],
  ['Imprimir / PDF', 'Versão pronta para envio.'],
], 'Tela de relatórios, na aba de posição da carteira. Os reports semanal, mensal e por período podem ser filtrados e exportados em Excel ou PDF.');
{
  const s = slide();
  cabecalho(s, 'Equipe do GT', 'Composição da equipe e carga de trabalho');
  selo(s, 'todos', M, 1.72);
  s.addText('A tela reúne os 15 integrantes nas três frentes, com órgão, função, modelo de trabalho e atividades abertas de cada um.', { x: M, y: 2.2, w: 3.55, h: 1.6, fontFace: SANS, fontSize: 13.5, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  const fr = [['Frente I', 'Coordenação, aprovação e conformidade'], ['Frente II', 'Pesquisa e elaboração de artefatos'], ['Frente III', 'Pontos focais e lançamento nos sistemas']];
  fr.forEach(([f, d], i) => {
    const y = 3.85 + i * 0.85;
    s.addShape(pres.shapes.RECTANGLE, { x: M, y, w: 0.07, h: 0.65, fill: { color: C.gold }, line: { color: C.gold } });
    s.addText([{ text: f, options: { bold: true, color: C.navy, breakLine: true } }, { text: d, options: { color: C.body, fontSize: 12 } }], { x: M + 0.2, y, w: 3.3, h: 0.65, fontFace: SANS, fontSize: 13.5, margin: 0, valign: 'middle', isTextBox: true });
  });
  const iw = CW - 3.9, ih = iw * 9 / 16;
  imagem(s, '13-equipe.png', W - M - iw, 1.72, iw, ih);
  rodape(s);
  s.addNotes('Tela da equipe do GT, disponível para todos os perfis: composição por frente e órgão, modelo de trabalho e atividades abertas atribuídas a cada integrante.');
}

// ================================================================== Encerramento
{
  const s = slide(C.navy);
  cabecalho(s, 'Próximos passos', 'Para colocar a equipe em operação', true);
  const pts = [
    ['Cadastro de e-mails', 'O administrador registra o e-mail institucional dos integrantes que ainda não o possuem.'],
    ['Primeiro acesso', 'Cada integrante entra em gt-propag-faetec.netlify.app, escolhe “Primeiro acesso” e define a senha.'],
    ['Designação de responsáveis', 'A coordenação define o responsável geral de cada contratação e os responsáveis por etapa.'],
    ['Rotina de atualização', 'Cada perfil atualiza as suas atividades; painel, pendências e relatórios passam a refletir a situação em tempo real.'],
  ];
  pts.forEach(([t, d], i) => {
    const y = 1.9 + i * 1.12;
    s.addText(String(i + 1).padStart(2, '0'), { x: M, y, w: 0.9, h: 0.9, fontFace: SERIF, fontSize: 30, bold: true, color: C.goldLight, margin: 0, valign: 'top', isTextBox: true });
    s.addText([{ text: t, options: { bold: true, color: C.light, fontSize: 17, breakLine: true } }, { text: d, options: { color: C.lightMuted, fontSize: 14.5 } }],
      { x: M + 1.0, y, w: CW - 1.0, h: 1.0, fontFace: SANS, margin: 0, valign: 'top', isTextBox: true });
  });
  rodape(s, true);
  s.addNotes('Passos para a operação plena do sistema. Em 25/09/2026, apenas o administrador e a coordenadora Karina Ferrarez possuem conta ativa; o cadastro dos e-mails dos demais integrantes é o primeiro passo.');
}

pres.writeFile({ fileName: path.join(__dirname, 'Apresentacao_Sistema_GT_PROPAG.pptx') }).then((f) => console.log('ok', f, N, 'slides'));
