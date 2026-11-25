// Rebranding do site institucional da SEDES: o que já foi feito (21/10 a 25/11/2026) e o ganho de tempo
const path = require('path');
const pptxgen = require('pptxgenjs');
const { applyTheme } = require(process.argv[3] + '/scripts/apply_theme.js');
const OUT = process.argv[2];
const IMG = (f) => path.join(__dirname, f);

const THEME = {
  name: 'SEDES RJ', headFontFace: 'Arial', bodyFontFace: 'Arial',
  colors: { dk1: '1F2A3D', lt1: 'FFFFFF', dk2: '0A2252', lt2: 'EEF5FD', accent1: '1E88E5', accent2: '159FB5', accent3: '5CC3F7', accent4: 'F07C12', accent5: '2EA44F', accent6: '7A8AA6', hlink: '1673D1', folHlink: '0A2252' },
};
const HEX = THEME.colors;
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' };
pres.title = 'Rebranding do site institucional da SEDES: o que já foi feito e o ganho de tempo';
pres.author = 'SEDES RJ';
pres.company = 'Governo do Estado do Rio de Janeiro';
const C = pres.SchemeColor;
const MUTED = '5B6B84', GRIDC = 'E2E9F3';

// ---------- layouts ----------
pres.defineSlideMaster({ title: 'CAPA', background: { color: HEX.dk2 }, objects: [
  { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.35, w: 8.6, h: 1.9, fontSize: 40, bold: true, color: C.background1, valign: 'top', align: 'left', margin: 0 }, text: '' } },
  { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 4.35, w: 8.6, h: 1.0, fontSize: 18, color: C.accent3, valign: 'top', align: 'left', margin: 0 }, text: '' } },
] });
pres.defineSlideMaster({ title: 'CONTEUDO', background: { color: HEX.lt1 }, margin: [0.5, 0.6, 0.75, 0.6], objects: [
  { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 10.4, h: 0.75, fontSize: 30, bold: true, color: C.text2, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
  { image: { path: IMG('brasao.png'), x: 11.25, y: 0.38, w: 1.5, h: 0.53, altText: 'Governo do Estado do Rio de Janeiro' } },
  { text: { text: 'Rebranding do site institucional · SEDES', options: { x: 0.6, y: 7.05, w: 8, h: 0.3, fontSize: 10, color: MUTED, margin: 0 } } },
], slideNumber: { x: 12.2, y: 7.05, w: 0.55, h: 0.3, fontSize: 10, color: MUTED, align: 'right' } });
pres.defineSlideMaster({ title: 'FINAL', background: { color: HEX.dk2 }, objects: [
  { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.45, w: 10.4, h: 0.8, fontSize: 32, bold: true, color: C.background1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
  { text: { text: 'Rebranding do site institucional · SEDES', options: { x: 0.6, y: 7.05, w: 8, h: 0.3, fontSize: 10, color: C.accent3, margin: 0 } } },
], slideNumber: { x: 12.2, y: 7.05, w: 0.55, h: 0.3, fontSize: 10, color: C.accent3, align: 'right' } });

// ---------- helpers ----------
const tb = (sl, text, o) => sl.addText(text, { isTextBox: true, margin: 0, fontSize: 14, color: C.text1, valign: 'top', ...o });
function circleNum(sl, x, y, n, fill, size = 0.5) {
  sl.addShape(pres.shapes.OVAL, { x, y, w: size, h: size, fill: { color: fill }, line: { color: fill }, objectName: 'num-' + n });
  tb(sl, String(n), { x, y, w: size, h: size, align: 'center', valign: 'middle', bold: true, color: C.background1, fontSize: size > 0.45 ? 16 : 12 });
}
const card = (sl, x, y, w, h, fill = C.background2, name = 'card') => sl.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill }, objectName: name });
const chip = (sl, x, y, w, text, fill) => { sl.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.28, rectRadius: 0.14, fill: { color: fill }, line: { color: fill } }); tb(sl, text, { x, y, w, h: 0.28, fontSize: 10, bold: true, color: C.background1, align: 'center', valign: 'middle' }); };
const fmt = (n) => n.toLocaleString('pt-BR');

// ---------- dados ----------
const D = (s) => { const [d, m, y] = s.split('/').map(Number); return Date.UTC(y, m - 1, d); };
const DAY = 86400000;
const INICIO = '21/10/2026', HOJE = '25/11/2026';
const DIAS_CORRIDOS = Math.round((D(HOJE) - D(INICIO)) / DAY) + 1; // 36
const SEMANAS = Math.round(DIAS_CORRIDOS / 7); // 5
// dias úteis (seg-sex) menos feriados nacionais no período (02/11 Finados, 20/11 Consciência Negra)
let UTEIS = 0; for (let t = D(INICIO); t <= D(HOJE); t += DAY) { const w = new Date(t).getUTCDay(); if (w > 0 && w < 6) UTEIS++; }
UTEIS -= 2;

// linha do tempo do trabalho realizado (datas aproximadas)
const FEITO = [
  ['Concepção e proposta "Novo Site SEDES"', '21/10/2026', '05/11/2026', 'Conceito, pilares, identidade, arquitetura da página inicial e protótipo ilustrativo'],
  ['Maquete 1: página inicial navegável', '06/11/2026', '09/11/2026', 'Reprodução fiel da proposta, mapa, quiz, testes em 3 tamanhos de tela'],
  ['Levantamento técnico interno', '09/11/2026', '13/11/2026', 'Requisitos e 77 campos de conteúdo, com responsáveis e formatos (.docx)'],
  ['Análise interna e decisões da SEDES', '10/11/2026', '24/11/2026', 'Subsecretarias, Sou investidor + Desenvolve RJ, Jovens do Mar, vídeos'],
  ['Maquete 2: melhorias aplicadas', '25/11/2026', '25/11/2026', '10 ajustes, revalidados em desktop, tablet e celular'],
  ['Fundamentação e documentação técnica', '25/11/2026', '25/11/2026', 'Normas do Portal Único e as quatro frentes de documentação'],
];

// esforço equivalente das entregas (como seria produzido por uma equipe em fluxo tradicional)
const HH = [
  ['Proposta conceitual (conceito, pilares, arquitetura da página inicial, protótipo ilustrativo)', 'Estratégia digital / UX, designer, comunicação', 96],
  ['Maquete 1: página inicial navegável, 11 seções, responsiva', 'UX/UI, desenvolvedor front-end, redator', 176],
  ['Mapa interativo dos 92 municípios (malha IBGE, busca, filtro por região)', 'Desenvolvedor front-end, analista de dados', 40],
  ['Quiz educativo (10 perguntas com explicações)', 'Conteudista, desenvolvedor front-end', 24],
  ['Testes de interação e responsividade (desktop, tablet, celular)', 'Analista de qualidade (QA)', 16],
  ['Levantamento técnico interno: requisitos e inventário de 77 campos', 'Analista de requisitos, comunicação', 80],
  ['Maquete 2: 10 melhorias e revalidação', 'UX/UI, desenvolvedor front-end, QA', 56],
  ['Fundamentação legal e mapa da documentação técnica (4 frentes)', 'Gestor de projeto', 24],
];
const TOT_HH = HH.reduce((a, r) => a + r[2], 0);
const EQUIPE = 3, HSEM = 40; const SEM_EQUIPE = Math.round(TOT_HH / (EQUIPE * HSEM) * 10) / 10;

// comparação em semanas a partir de 21/10 (mesmo ponto de partida)
const TRAD = [
  ['Abertura do SEI, requisitos em conjunto e proposta técnica', 0, 2.2, 'Conjunta'],
  ['Contratação (proposta comercial, minuta e assinatura)', 2.2, 7.2, 'PRODERJ'],
  ['Kickoff e descoberta (benchmark, conceito, arquitetura)', 7.2, 10.2, 'PRODERJ'],
  ['Protótipo navegável e ciclos de revisão (v1 → v2)', 10.2, 15.2, 'PRODERJ'],
  ['Levantamento de requisitos de conteúdo (77 campos)', 13.2, 17.2, 'SEDES'],
];
const PRO = [
  ['Concepção e proposta', 0, 2.3, 'SEDES'],
  ['Maquete 1, levantamento técnico interno, decisões e Maquete 2', 2.3, 5.1, 'SEDES'],
];
const PONTO_TRAD = 17.2, PONTO_PRO = 5.1;
const GANHO = Math.round(PONTO_TRAD - PONTO_PRO);

// ---------- 1 · capa ----------
pres.addSection({ title: 'Abertura' });
let s = pres.addSlide({ masterName: 'CAPA', sectionTitle: 'Abertura' });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 0.7, w: 3.1, h: 1.1, rectRadius: 0.08, fill: { color: C.background1 }, line: { color: C.background1 }, objectName: 'fundo-brasao' });
s.addImage({ path: IMG('brasao.png'), x: 0.95, y: 0.82, w: 2.45, h: 0.86, altText: 'Governo do Estado do Rio de Janeiro' });
tb(s, 'SECRETARIA DE DESENVOLVIMENTO ECONÔMICO', { x: 0.8, y: 1.95, w: 9, h: 0.35, fontSize: 13, bold: true, color: C.accent3, charSpacing: 2 });
s.addText('Rebranding do site institucional da SEDES', { placeholder: 'title' });
s.addText('O que já construímos e o tempo que ganhamos', { placeholder: 'body' });
tb(s, `Período: ${INICIO} a ${HOJE}  ·  Base: Maquete 2`, { x: 0.8, y: 6.55, w: 9, h: 0.35, fontSize: 12, color: 'B9CDEA' });
[[`${SEMANAS} semanas`, 'de trabalho até aqui'], [`~${fmt(TOT_HH)} HH`, 'de esforço equivalente entregue'], [`~${GANHO} semanas`, 'antecipadas no caminho crítico']].forEach(([n, l], i) => {
  const y = 2.35 + i * 1.35; card(s, 9.6, y, 3.1, 1.15, '13306E', 'selo-' + i);
  tb(s, n, { x: 9.8, y: y + 0.14, w: 2.8, h: 0.55, fontSize: 26, bold: true, color: C.background1 });
  tb(s, l, { x: 9.8, y: y + 0.7, w: 2.8, h: 0.3, fontSize: 12, color: C.accent3 });
});
s.addNotes('Objetivo: mostrar o que a SEDES já produziu desde 21/10/2026 e quanto tempo isso antecipa em relação a um fluxo tradicional. O esforço da execução será definido pela proposta técnica do PRODERJ, ainda não recebida.');

// ---------- 2 · resumo ----------
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Abertura' });
s.addText('Resumo executivo', { placeholder: 'title' });
tb(s, 'Em 5 semanas, a SEDES chegou ao ponto que um fluxo tradicional só alcançaria depois da contratação e da fase de projeto.', { x: 0.6, y: 1.2, w: 12.1, h: 0.7, fontSize: 16, color: MUTED });
[
  [`${DIAS_CORRIDOS} dias`, 'De trabalho', `${UTEIS} dias úteis, de ${INICIO.slice(0, 5)} a ${HOJE.slice(0, 5)}`],
  ['2 maquetes', 'Navegáveis e testadas', 'Página inicial completa; a Maquete 2 já traz as decisões da SEDES'],
  [`~${fmt(TOT_HH)} HH`, 'Esforço equivalente', `Cerca de ${EQUIPE} profissionais em tempo integral por ~${fmt(SEM_EQUIPE)} semanas`],
  [`~${GANHO} semanas`, 'Antecipadas', 'Protótipo validado e levantamento técnico prontos antes de abrir o SEI'],
].forEach(([n, t, d], i) => {
  const x = 0.6 + i * 3.08; card(s, x, 2.1, 2.88, 2.65, C.background2, 'stat-' + i);
  tb(s, n, { x: x + 0.25, y: 2.35, w: 2.45, h: 0.75, fontSize: i === 3 ? 25 : 30, bold: true, color: i === 3 ? C.accent4 : C.text2, valign: 'middle' });
  tb(s, t, { x: x + 0.25, y: 3.15, w: 2.45, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
  tb(s, d, { x: x + 0.25, y: 3.6, w: 2.45, h: 1.05, fontSize: 13, color: MUTED });
});
tb(s, [
  { text: 'O levantamento técnico já foi feito internamente: ', options: { bold: true, color: C.text2 } },
  { text: 'ao PRODERJ cabe receber, validar e transformar em TAP e proposta técnica. O esforço da execução será conhecido quando a proposta técnica chegar.' },
], { x: 0.6, y: 5.1, w: 12.1, h: 0.9, fontSize: 15 });
tb(s, 'HH equivalentes e semanas antecipadas são estimativas referenciais da SEDES.', { x: 0.6, y: 6.3, w: 12.1, h: 0.35, fontSize: 12, italic: true, color: MUTED });
s.addNotes('Mensagem: o trabalho proativo da SEDES encurtou o caminho. O que normalmente só existiria após a contratação (protótipo navegável, decisões de navegação, inventário de conteúdo) já existe e vai anexo ao SEI.');

// ---------- 3 · linha do tempo do realizado ----------
pres.addSection({ title: 'O que fizemos' });
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'O que fizemos' });
s.addText(`Linha do tempo: ${INICIO.slice(0, 5)} a ${HOJE.slice(0, 5)}`, { placeholder: 'title' });
(() => {
  const x = 0.6, y = 1.3, labelW = 4.3, w = 12.1, rowH = 0.72, t0 = D('20/10/2026'), t1 = D('27/11/2026') + DAY;
  const gx = x + labelW, gw = w - labelW, X = (t) => gx + (t - t0) / (t1 - t0) * gw, top = y + 0.45, H = FEITO.length * rowH;
  // semanas
  for (let t = D('20/10/2026'), k = 0; t < t1; t += 7 * DAY, k++) {
    const e = Math.min(t + 7 * DAY, t1);
    s.addShape(pres.shapes.RECTANGLE, { x: X(t), y, w: X(e) - X(t), h: 0.34, fill: { color: k % 2 ? HEX.lt2 : 'DCE8F8' }, line: { color: 'FFFFFF', width: 1 } });
    const d = new Date(t);
    tb(s, 'sem. ' + String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0'), { x: X(t), y, w: X(e) - X(t), h: 0.34, fontSize: 10, bold: true, color: C.text2, align: 'center', valign: 'middle' });
    s.addShape(pres.shapes.LINE, { x: X(t), y: top, w: 0, h: H, line: { color: 'D6E1EF', width: 0.75 } });
  }
  [['02/11/2026', '02/11/2026'], ['20/11/2026', '20/11/2026']].forEach(([a, b]) => s.addShape(pres.shapes.RECTANGLE, { x: X(D(a)), y: top, w: X(D(b) + DAY) - X(D(a)), h: H, fill: { color: 'E3E8F0' }, line: { color: 'E3E8F0' }, objectName: 'feriado' }));
  FEITO.forEach(([t, a, b, d], i) => {
    const ry = top + i * rowH;
    s.addShape(pres.shapes.LINE, { x, y: ry + rowH, w, h: 0, line: { color: GRIDC, width: 0.5 } });
    tb(s, t, { x, y: ry + 0.08, w: labelW - 0.15, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
    tb(s, d, { x, y: ry + 0.37, w: labelW - 0.15, h: 0.32, fontSize: 10, color: MUTED });
    const xs = X(D(a)), xe = X(D(b) + DAY), col = i === 3 ? C.accent6 : i >= 4 ? C.accent4 : C.accent1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: xs, y: ry + 0.2, w: Math.max(0.12, xe - xs), h: 0.32, rectRadius: 0.06, fill: { color: col }, line: { color: col }, objectName: 'barra-' + i });
  });
  const hx = X(D(HOJE) + DAY);
  s.addShape(pres.shapes.LINE, { x: hx, y: y + 0.36, w: 0, h: H + 0.15, line: { color: C.accent4, width: 2, dashType: 'dash' } });
  tb(s, 'hoje', { x: hx - 0.6, y: top + H + 0.1, w: 0.55, h: 0.25, fontSize: 10, bold: true, color: C.accent4, align: 'right' });
})();
[['Produção', C.accent1], ['Análise e decisão SEDES', C.accent6], ['Entregas desta semana', C.accent4]].forEach(([t, c], i) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6 + i * 2.6, y: 6.6, w: 0.32, h: 0.16, rectRadius: 0.04, fill: { color: c }, line: { color: c } });
  tb(s, t, { x: 1.0 + i * 2.6, y: 6.54, w: 2.2, h: 0.28, fontSize: 11, color: MUTED, valign: 'middle' });
});
tb(s, 'Datas aproximadas. Faixas cinza: feriados de 02/11 e 20/11.', { x: 8.6, y: 6.54, w: 4.1, h: 0.28, fontSize: 10, italic: true, color: MUTED, align: 'right', valign: 'middle' });
s.addNotes('Linha do tempo aproximada do trabalho realizado. A concepção da proposta ocupou as duas primeiras semanas; a Maquete 1 e o levantamento técnico saíram em seguida; a Maquete 2 consolida as decisões da SEDES.');

// ---------- 4 · o que foi produzido ----------
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'O que fizemos' });
s.addText('O que já está pronto', { placeholder: 'title' });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.3, w: 5.95, h: 4.75, rectRadius: 0.06, fill: { color: C.background2 }, line: { color: 'D6E1EF', width: 1 }, objectName: 'moldura-maquete' });
s.addImage({ path: IMG('maquete2.jpg'), x: 0.75, y: 1.45, w: 5.65, h: 4.38, altText: 'Captura de tela da Maquete 2: menu Subsecretarias, hero, régua com cinco perfis e cards das subsecretarias com botão de vídeo' });
tb(s, 'Maquete 2 · página inicial (desktop)', { x: 0.75, y: 6.15, w: 5.65, h: 0.3, fontSize: 11, italic: true, color: MUTED });
[
  ['2', 'maquetes navegáveis', 'Página inicial completa, arquivo único que abre em qualquer navegador'],
  ['11', 'seções na página inicial', 'Hero, perfis, subsecretarias, quiz, dados, notícias, agenda, redes sociais'],
  ['92', 'municípios no mapa', 'Malha do IBGE, busca por município e filtro por região'],
  ['77', 'campos levantados', 'Requisitos de conteúdo com responsável, prioridade e formato'],
  ['3', 'tamanhos de tela testados', 'Desktop, tablet e celular, com testes automatizados de cada interação'],
].forEach(([n, t, d], i) => {
  const y = 1.3 + i * 0.97;
  tb(s, n, { x: 6.9, y, w: 1.1, h: 0.6, fontSize: 32, bold: true, color: C.accent1, valign: 'middle' });
  tb(s, t, { x: 8.1, y: y + 0.02, w: 4.6, h: 0.34, fontSize: 16, bold: true, color: C.text2 });
  tb(s, d, { x: 8.1, y: y + 0.38, w: 4.6, h: 0.5, fontSize: 12 });
});
s.addNotes('Números das entregas. A Maquete 2 é a versão de referência; a Maquete 1 fica como histórico da proposta original.');

// ---------- 5 · evolução v1 → v2 ----------
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'O que fizemos' });
s.addText('Da Maquete 1 à Maquete 2: decisões já tomadas', { placeholder: 'title' });
[['maquete1.jpg', 'Maquete 1 · reprodução da proposta'], ['maquete2.jpg', 'Maquete 2 · com as decisões da SEDES']].forEach(([f, t], i) => {
  const x = 0.6 + i * 3.2;
  s.addImage({ path: IMG(f), x, y: 1.35, w: 3.0, h: 2.33, altText: t });
  tb(s, t, { x, y: 3.75, w: 3.0, h: 0.3, fontSize: 11, bold: true, color: C.text2 });
});
const mudancas = ['"Áreas de atuação" virou "Subsecretarias"', '"Oportunidades" saiu do menu', '"Explore oportunidades" saiu do hero', '"Quero investir" virou "Sou investidor"', 'Desenvolve RJ incorporado ao site', '5º espaço na régua de perfis', 'Jovens do Mar e Empregos Azuis em "Sou cidadão"', 'Busca por município retirada de "Sou cidadão"', 'Temas dos eixos dentro de "Saiba mais"', 'Vídeos de até 1:30 nos cards; redes sociais no fim'];
card(s, 7.15, 1.35, 5.55, 5.25, C.background2, 'lista-mudancas');
tb(s, '10 ajustes aplicados e revalidados', { x: 7.4, y: 1.5, w: 5.1, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
mudancas.forEach((m, i) => {
  const y = 2.0 + i * 0.45;
  circleNum(s, 7.4, y + 0.02, i + 1, C.accent1, 0.32);
  tb(s, m, { x: 7.85, y, w: 4.75, h: 0.38, fontSize: 13, valign: 'middle' });
});
tb(s, 'Em um fluxo tradicional, cada ciclo de revisão do protótipo acontece depois da contratação, com reuniões e devolutivas entre SEDES e equipe técnica.', { x: 0.6, y: 4.3, w: 6.2, h: 1.2, fontSize: 14, color: MUTED });
s.addNotes('A Maquete 2 mostra que as decisões de navegação e de conteúdo da SEDES já foram tomadas e aplicadas. Isso tira da execução um ciclo de revisão inteiro.');

// ---------- 6 · esforço equivalente ----------
pres.addSection({ title: 'Ganho' });
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Ganho' });
s.addText('Esforço equivalente do que já foi entregue', { placeholder: 'title' });
const H = { bold: true, color: 'FFFFFF', fill: { color: HEX.dk2 }, fontSize: 12, valign: 'middle' };
const cel = (t, o = {}) => ({ text: t, options: { fontSize: 12, color: HEX.dk1, valign: 'middle', ...o } });
const rows = [[{ text: 'Entrega', options: H }, { text: 'Perfis que a produziriam no fluxo tradicional', options: H }, { text: 'HH', options: { ...H, align: 'right' } }]];
HH.forEach(([e, p, h], i) => rows.push([cel(e, { fill: { color: i % 2 ? 'FFFFFF' : 'F6F9FD' } }), cel(p, { color: MUTED, fill: { color: i % 2 ? 'FFFFFF' : 'F6F9FD' } }), cel(fmt(h), { align: 'right', bold: true, fill: { color: i % 2 ? 'FFFFFF' : 'F6F9FD' } })]));
const T = { bold: true, color: 'FFFFFF', fill: { color: HEX.accent4 }, fontSize: 13, valign: 'middle' };
rows.push([{ text: 'Total equivalente', options: { ...T, colspan: 2 } }, { text: '~' + fmt(TOT_HH), options: { ...T, align: 'right' } }]);
s.addTable(rows, { x: 0.6, y: 1.3, w: 12.1, colW: [6.4, 4.6, 1.1], rowH: 0.42, border: { type: 'solid', pt: 0.5, color: 'D6E1EF' }, fontFace: 'Arial', margin: [0.04, 0.1, 0.04, 0.1] });
tb(s, [
  { text: `~${fmt(TOT_HH)} HH ≈ ${EQUIPE} profissionais em tempo integral por ~${fmt(SEM_EQUIPE)} semanas, `, options: { bold: true, color: C.text2 } },
  { text: 'só de produção, sem contar a contratação e os ciclos de aprovação.' },
], { x: 0.6, y: 5.75, w: 12.1, h: 0.45, fontSize: 14 });
tb(s, 'HH = homem-hora. Estimativa referencial do esforço que essas entregas exigiriam de uma equipe técnica; não substitui a proposta técnica do PRODERJ.', { x: 0.6, y: 6.3, w: 12.1, h: 0.4, fontSize: 11, italic: true, color: MUTED });
s.addNotes('Esforço equivalente: quanto uma equipe técnica gastaria para produzir as mesmas entregas. Não é a previsão da execução, que depende da proposta técnica do PRODERJ.');

// ---------- 7 · comparação de cenários ----------
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Ganho' });
s.addText('Mesmo ponto de partida, caminhos diferentes', { placeholder: 'title' });
tb(s, `Semanas a partir de ${INICIO}, até ter o protótipo navegável validado e o levantamento técnico concluído.`, { x: 0.6, y: 1.15, w: 12.1, h: 0.4, fontSize: 14, color: MUTED });
(() => {
  const x = 0.6, labelW = 4.6, w = 12.1, gx = x + labelW, gw = w - labelW, W0 = 0, W1 = 18, X = (k) => gx + (k - W0) / (W1 - W0) * gw;
  const y = 1.65, rowH = 0.38;
  for (let k = 0; k <= 18; k += 2) {
    tb(s, 'S' + k, { x: X(k) - 0.3, y, w: 0.6, h: 0.28, fontSize: 10, bold: true, color: C.text2, align: 'center' });
  }
  const COL = { SEDES: C.accent1, PRODERJ: C.accent2, Conjunta: C.text2 };
  let yy = y + 0.35;
  const lane = (titulo, itens, fim, corFim, rot) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: yy, w, h: 0.36, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 } });
    tb(s, titulo, { x: x + 0.1, y: yy, w: 11, h: 0.36, fontSize: 13, bold: true, color: C.text2, valign: 'middle' });
    yy += 0.4;
    itens.forEach(([t, a, b, r]) => {
      tb(s, t, { x: x + 0.1, y: yy, w: labelW - 0.2, h: rowH, fontSize: 11, valign: 'middle' });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X(a), y: yy + 0.1, w: X(b) - X(a), h: rowH - 0.2, rectRadius: 0.05, fill: { color: COL[r] }, line: { color: COL[r] } });
      s.addShape(pres.shapes.LINE, { x, y: yy + rowH, w, h: 0, line: { color: GRIDC, width: 0.5 } });
      yy += rowH;
    });
    s.addShape(pres.shapes.DIAMOND, { x: X(fim) - 0.13, y: yy + 0.04, w: 0.26, h: 0.26, fill: { color: corFim }, line: { color: 'FFFFFF', width: 1 } });
    tb(s, rot, { x: X(fim) - 3.4, y: yy + 0.02, w: 3.2, h: 0.3, fontSize: 11, bold: true, color: corFim, align: 'right', valign: 'middle' });
    const dy = yy;
    yy += 0.45;
    return dy;
  };
  lane('Fluxo tradicional, sem atuação proativa da SEDES', TRAD, PONTO_TRAD, C.accent6, `ponto atingido em ~S${Math.round(PONTO_TRAD)}`);
  const dyPro = lane('Fluxo realizado, com atuação proativa da SEDES', PRO, PONTO_PRO, C.accent4, `ponto atingido em S${Math.round(PONTO_PRO)} (hoje)`);
  // chave do ganho
  const by = dyPro + 0.17;
  s.addShape(pres.shapes.LINE, { x: X(PONTO_PRO) + 0.18, y: by, w: X(PONTO_TRAD) - X(PONTO_PRO) - 0.18, h: 0, line: { color: C.accent4, width: 2, endArrowType: 'arrow' } });
  tb(s, `~${GANHO} semanas antecipadas`, { x: X(PONTO_PRO) + 0.2, y: by - 0.4, w: X(PONTO_TRAD) - X(PONTO_PRO) - 0.2, h: 0.34, fontSize: 15, bold: true, color: C.accent4, align: 'center' });
  s.addShape(pres.shapes.LINE, { x: X(PONTO_TRAD), y: by - 0.25, w: 0, h: 0.5, line: { color: C.accent4, width: 1.5, dashType: 'dash' } });
})();
[['SEDES', C.accent1], ['PRODERJ', C.accent2], ['Conjunta', C.text2]].forEach(([t, c], i) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6 + i * 1.5, y: 6.62, w: 0.32, h: 0.16, rectRadius: 0.04, fill: { color: c }, line: { color: c } });
  tb(s, t, { x: 1.0 + i * 1.5, y: 6.56, w: 1.0, h: 0.28, fontSize: 11, color: MUTED, valign: 'middle' });
});
tb(s, 'Cenário tradicional estimado: contratação de ~5 semanas; descoberta e protótipo após o contrato.', { x: 5.3, y: 6.56, w: 7.4, h: 0.28, fontSize: 10, italic: true, color: MUTED, align: 'right', valign: 'middle' });
s.addNotes('Comparação com o mesmo ponto de partida (21/10). No fluxo tradicional, o protótipo e o levantamento só existiriam depois da contratação e da fase de projeto. No fluxo realizado, já existem e entram no SEI.');

// ---------- 8 · o que o ganho significa ----------
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Ganho' });
s.addText('O que esse ganho significa', { placeholder: 'title' });
card(s, 0.6, 1.3, 4.1, 5.3, HEX.dk2, 'ganho');
tb(s, `~${GANHO}`, { x: 0.9, y: 1.7, w: 3.5, h: 1.3, fontSize: 72, bold: true, color: C.background1 });
tb(s, 'semanas antecipadas', { x: 0.9, y: 3.0, w: 3.5, h: 0.5, fontSize: 20, bold: true, color: C.accent3 });
tb(s, `no caminho crítico, com ${SEMANAS} semanas de trabalho proativo da SEDES.`, { x: 0.9, y: 3.6, w: 3.5, h: 1.0, fontSize: 14, color: 'C7D6EE' });
[
  ['SEI mais completo', 'O processo abre com protótipo navegável, levantamento técnico e fundamentação legal, e não só com a demanda.'],
  ['Requisitos só comunicados', 'O levantamento técnico já foi feito internamente: o PRODERJ recebe e valida, sem precisar de uma fase de descoberta.'],
  ['Proposta técnica mais precisa', 'Com escopo visível e testado, o PRODERJ estima o esforço com menos incerteza e menos risco de aditivos.'],
  ['Menos ciclos de revisão', 'As decisões de navegação e conteúdo já estão na Maquete 2: menos idas e vindas depois do contrato.'],
].forEach(([t, d], i) => {
  const y = 1.3 + i * 1.33;
  circleNum(s, 5.1, y + 0.05, i + 1, C.accent1);
  tb(s, t, { x: 5.8, y, w: 6.9, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
  tb(s, d, { x: 5.8, y: y + 0.42, w: 6.9, h: 0.8, fontSize: 14 });
});
s.addNotes('O ganho não é apenas de calendário: o SEI e a proposta técnica partem de um escopo concreto, o que reduz incerteza e retrabalho.');

// ---------- 9 · fundamentação ----------
pres.addSection({ title: 'Encaminhamento' });
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Encaminhamento' });
s.addText('Por que o projeto segue com o PRODERJ', { placeholder: 'title' });
tb(s, 'Os canais digitais do Poder Executivo estadual são unificados no domínio rj.gov.br, sob gestão tecnológica do PRODERJ.', { x: 0.6, y: 1.2, w: 12.1, h: 0.5, fontSize: 16, color: MUTED });
[
  ['Decreto nº 48.671/2023', 'Portal Único RJ Digital', 'Unifica os canais digitais no rj.gov.br sob gestão do PRODERJ; os órgãos migram, integram e padronizam seus portais em conjunto com o PRODERJ.'],
  ['Decreto nº 48.672/2023', 'Transformação Digital', 'Regulamenta a Lei nº 9.128/2020: serviços e sistemas digitalizados se integram às ferramentas do PRODERJ no Portal Único.'],
  ['Portaria PRODERJ/PRE nº 174/2006', 'Hospedagem e segurança', 'Regras de acesso ao servidor web, gerenciamento técnico e segurança para sites no domínio rj.gov.br.'],
  ['Lei nº 4.480/2004', 'PRODERJ como órgão central', 'Reestrutura o PRODERJ como órgão central e executor da política de TIC da Administração Pública Estadual.'],
].forEach(([lei, tema, desc], i) => {
  const x = 0.6 + (i % 2) * 6.15, y = 1.95 + Math.floor(i / 2) * 2.35;
  card(s, x, y, 5.95, 2.15, C.background2, 'norma-' + i);
  circleNum(s, x + 0.25, y + 0.25, i + 1, C.text2);
  tb(s, lei, { x: x + 0.95, y: y + 0.22, w: 4.8, h: 0.35, fontSize: 16, bold: true, color: C.text2 });
  tb(s, tema, { x: x + 0.95, y: y + 0.55, w: 4.8, h: 0.3, fontSize: 13, bold: true, color: C.accent1 });
  tb(s, desc, { x: x + 0.95, y: y + 0.92, w: 4.8, h: 1.15, fontSize: 13 });
});
tb(s, 'Normativos conforme informados pela SEDES.', { x: 0.6, y: 6.6, w: 12.1, h: 0.3, fontSize: 11, italic: true, color: MUTED });
s.addNotes('Fundamentação para o SEI: a execução é obrigatoriamente conjunta com o PRODERJ.');

// ---------- 10 · documentação: o que já cobrimos ----------
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Encaminhamento' });
s.addText('Documentação técnica: o que já cobrimos', { placeholder: 'title' });
const ST = { ok: ['Pronto', C.accent5], parc: ['Parcial', C.accent4], nao: ['A produzir', C.accent6], cond: ['Se aplicável', C.accent6] };
const frentes = [
  ['Identidade e design', [['Protótipo navegável (desktop e mobile)', 'ok', 'Maquete 2'], ['Manual de Identidade Visual do Governo', 'nao', 'Solicitar à Comunicação Social'], ['Design System Portal Único RJ Digital', 'nao', 'Solicitar ao PRODERJ/SETD']]],
  ['Arquitetura, conteúdo e acessibilidade', [['Levantamento técnico e inventário de conteúdo', 'ok', '77 campos (.docx)'], ['Mapa do site e plano de redirecionamentos 301', 'parc', 'Menu definido na Maquete 2'], ['Checklist e-MAG / WCAG', 'nao', 'Na fase de testes']]],
  ['Infraestrutura, domínio e segurança', [['Normas de hospedagem no servidor PRODERJ', 'nao', 'Fornecidas pelo PRODERJ'], ['Formulário de domínio *.rj.gov.br', 'cond', 'Se mudar o endereço'], ['Migração homologação → produção', 'nao', 'Na publicação'], ['LGPD: privacidade, termos e cookies', 'nao', 'Com o encarregado de dados'], ['Abertura de portas no firewall', 'cond', 'APIs do mapa, vídeos e redes']]],
  ['Contratação e governança', [['Fundamentação legal', 'ok', 'Normas do Portal Único'], ['Processo administrativo no SEI-RJ', 'nao', 'Abertura com os anexos'], ['ETP e TR (Lei nº 14.133/2021)', 'cond', 'Somente se houver terceiros']]],
];
const FW = [2.85, 2.85, 3.85, 2.25], FX = FW.map((w, i) => 0.6 + FW.slice(0, i).reduce((a, b) => a + b, 0) + i * 0.1);
frentes.forEach(([nome, itens], i) => {
  const x = FX[i], y = 1.3, cw = FW[i];
  card(s, x, y, cw, 5.45, C.background2, 'frente-' + i);
  circleNum(s, x + 0.22, y + 0.22, i + 1, C.text2, 0.42);
  tb(s, nome, { x: x + 0.75, y: y + 0.18, w: cw - 0.9, h: 0.55, fontSize: 14, bold: true, color: C.text2, valign: 'middle' });
  let yy = y + 0.95;
  itens.forEach(([t, st, obs]) => {
    const [lab, col] = ST[st]; chip(s, x + 0.22, yy, 1.15, lab, col);
    tb(s, t, { x: x + 0.22, y: yy + 0.33, w: cw - 0.4, h: 0.45, fontSize: 11, bold: true });
    tb(s, obs, { x: x + 0.22, y: yy + (itens.length > 3 ? 0.62 : 0.76), w: cw - 0.4, h: 0.25, fontSize: 10, color: MUTED });
    yy += itens.length > 3 ? 0.88 : 1.15;
  });
});
s.addNotes('Verde: já produzido pela SEDES. Laranja: parcial. Cinza: a produzir ou condicional. A frente de identidade e design e a de conteúdo já têm a base pronta.');

// ---------- 11 · próximos passos ----------
s = pres.addSlide({ masterName: 'FINAL', sectionTitle: 'Encaminhamento' });
s.addText('Próximos passos com o PRODERJ', { placeholder: 'title' });
[
  ['Abrir o SEI', 'Solicitação de melhoria com fundamentação técnica e os anexos: Maquete 2, levantamento técnico e documentação.'],
  ['Comunicar o levantamento técnico', 'Apresentar ao PRODERJ o levantamento já feito internamente, para validação, e não para descoberta.'],
  ['Receber o TAP e a proposta técnica', 'Em até 15 dias corridos. O esforço e o cronograma da execução vêm dessa proposta.'],
  ['Contratos PRODERJ', 'Proposta comercial e minuta para análise e assinatura da SEDES.'],
].forEach(([t, d], i) => {
  const y = 1.55 + i * 1.3;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 12.1, h: 1.1, rectRadius: 0.08, fill: { color: '13306E' }, line: { color: '13306E' }, objectName: 'passo-' + i });
  circleNum(s, 0.85, y + 0.28, i + 1, C.accent3);
  tb(s, t, { x: 1.6, y: y + 0.15, w: 10.9, h: 0.42, fontSize: 18, bold: true, color: C.background1 });
  tb(s, d, { x: 1.6, y: y + 0.57, w: 10.9, h: 0.4, fontSize: 14, color: 'C7D6EE' });
});
s.addNotes('Encaminhamento: o fluxo obrigatório continua o mesmo, mas a SEDES entra nele com o trabalho de descoberta, protótipo e levantamento técnico já feito.');

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('ok', OUT, { TOT_HH, DIAS_CORRIDOS, UTEIS, SEMANAS, GANHO, SEM_EQUIPE });
})();
