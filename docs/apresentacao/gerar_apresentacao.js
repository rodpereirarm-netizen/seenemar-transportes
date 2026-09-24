// Apresentação executiva · Status das contratações · GT PROPAG (posição 24/09/2026)
const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
pres.title = 'Status das contratações · GT PROPAG';
pres.company = 'GT PROPAG · Compras Públicas';
pres.subject = 'Apresentação executiva · posição em 24/09/2026';

const C = {
  navy: '16284D', navy2: '1E3564', navyLine: '3A5184', gold: 'C8962F', goldInk: '8A5F0D', goldLight: 'E0B45A',
  paper: 'F3F0E9', card: 'FBFAF6', line: 'E2DCCF', ink: '1B2236', muted: '5F5A4E', body: '4A4538',
  red: 'B3372B', redLight: 'F2B3AA', redSoft: 'FBE2DE', blueSoft: 'E1E8F5', goldSoft: 'F7E9C9', track: 'E6E0D4',
  light: 'FBFAF6', lightMuted: 'CFD6E6', footDark: 'AAB5CF',
};
const SERIF = 'Cambria';
const SANS = 'Calibri';
const W = 13.333, M = 0.8, CW = W - 2 * M;

function header(s, eyebrow, title, dark = false) {
  s.addText(eyebrow.toUpperCase(), { x: M, y: 0.55, w: CW, h: 0.32, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: dark ? C.goldLight : C.goldInk, margin: 0, isTextBox: true });
  s.addText(title, { x: M, y: 0.88, w: CW, h: 0.85, fontFace: SERIF, fontSize: 36, bold: true, color: dark ? C.light : C.navy, margin: 0, valign: 'top', isTextBox: true });
}
function footer(s, n, dark = false, extra = '') {
  s.addText('GT PROPAG · Posição em 24/09/2026 · Fonte: Sistema de Controle de Contratações' + extra, { x: M, y: 6.92, w: 10.5, h: 0.3, fontFace: SANS, fontSize: 10.5, color: dark ? C.footDark : '6E6758', margin: 0, isTextBox: true });
  s.addText(String(n), { x: W - M - 1, y: 6.92, w: 1, h: 0.3, fontFace: SANS, fontSize: 11, bold: true, color: dark ? C.goldLight : C.navy, align: 'right', margin: 0, isTextBox: true });
}
const sombra = () => ({ type: 'outer', color: '16284D', opacity: 0.08, blur: 6, offset: 2, angle: 90 });
function card(s, x, y, w, h, fill = C.card) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: C.line, width: 0.75 }, shadow: sombra() });
}
function circulo(s, x, y, d, fill, txt, txtColor = 'FFFFFF', size = 14) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  s.addText(txt, { x, y, w: d, h: d, fontFace: SANS, fontSize: size, bold: true, color: txtColor, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
}

// ---------------------------------------------------------------- 1 · Capa
{
  const s = pres.addSlide(); s.background = { color: C.navy };
  s.addText('GOVERNO DO ESTADO DO RIO DE JANEIRO', { x: M, y: 0.6, w: 6, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.light, margin: 0, isTextBox: true });
  s.addText('GT PROPAG · COMPRAS PÚBLICAS', { x: W - M - 6, y: 0.6, w: 6, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.goldLight, align: 'right', margin: 0, isTextBox: true });
  s.addText('APRESENTAÇÃO EXECUTIVA', { x: M, y: 2.0, w: CW, h: 0.4, fontFace: SANS, fontSize: 16, bold: true, charSpacing: 4, color: C.goldLight, margin: 0, isTextBox: true });
  s.addText('Status das contratações\nda FAETEC', { x: M, y: 2.45, w: 11.5, h: 1.85, fontFace: SERIF, fontSize: 54, bold: true, color: C.light, margin: 0, valign: 'top', isTextBox: true });
  s.addText('17 demandas de TI, um fluxo de 5 etapas e 32 atividades, e três prazos legais que não podem atrasar.', { x: M, y: 4.4, w: 10, h: 0.8, fontFace: SANS, fontSize: 20, color: C.lightMuted, margin: 0, valign: 'top', isTextBox: true });
  const etapas = [['ETAPA I', 'Planejamento'], ['ETAPA II', 'Adesão à ARP'], ['ETAPA III', 'Comunicações'], ['ETAPA IV', 'Pesquisa de preços'], ['ETAPA V', 'Formalização']];
  const ew = (CW - 4 * 0.2) / 5;
  etapas.forEach(([e, n], i) => {
    const x = M + i * (ew + 0.2);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 5.3, w: ew, h: 0.85, rectRadius: 0.06, fill: { color: C.navy2 }, line: { color: C.navyLine, width: 0.75 } });
    s.addText([{ text: e, options: { fontSize: 10, bold: true, color: C.goldLight, charSpacing: 2, breakLine: true } }, { text: n, options: { fontSize: 14, bold: true, color: C.light } }],
      { x: x + 0.15, y: 5.33, w: ew - 0.3, h: 0.79, fontFace: SANS, valign: 'middle', margin: 0, isTextBox: true });
  });
  s.addText('SEDES · SECTI · FAETEC · PRODERJ', { x: M, y: 6.55, w: 6, h: 0.4, fontFace: SANS, fontSize: 14, bold: true, charSpacing: 1, color: C.light, margin: 0, isTextBox: true });
  s.addText([{ text: 'Posição em 24/09/2026', options: { bold: true, color: C.light, breakLine: true } }, { text: 'Fonte: Sistema de Controle de Contratações', options: { color: C.lightMuted } }],
    { x: W - M - 6, y: 6.4, w: 6, h: 0.6, fontFace: SANS, fontSize: 13, align: 'right', margin: 0, isTextBox: true });
  s.addNotes('Apresentação do status da carteira de contratações do GT PROPAG, com os dados do sistema na posição de 24 de setembro de 2026. A mensagem central: a carteira inteira ainda está no planejamento, e o que trava o avanço é responsabilidade, justificativa e enquadramento — não os prazos legais, que ainda nem começaram a correr.');
}

// ---------------------------------------------------------------- 2 · Resumo
{
  const s = pres.addSlide(); s.background = { color: C.paper };
  header(s, 'Resumo executivo', 'A carteira está parada no planejamento');
  const itens = [
    ['1', C.navy, C.navy, '17 de 17 na Etapa I', '6% das 276 atividades concluídas. Nenhuma demanda chegou à adesão, às análises ou à pesquisa de preços.'],
    ['2', C.red, C.red, '99% sem responsável', '256 de 259 atividades abertas sem integrante designado. Nenhuma demanda tem responsável geral.'],
    ['3', C.gold, C.goldInk, '41% sem justificativa', '7 demandas bloqueiam o DOD por falta de justificativa; 10 seguem com a modalidade “a definir”.'],
    ['4', C.navy, C.navy, '93% do valor em 1 demanda', 'Chromebooks soma R$ 64,8 mi dos R$ 69,7 mi informados; 14 demandas ainda não têm estimativa.'],
  ];
  const cw = (CW - 0.3) / 2, ch = 2.15;
  itens.forEach(([n, cor, corT, t, b], i) => {
    const x = M + (i % 2) * (cw + 0.3), y = 2.0 + Math.floor(i / 2) * (ch + 0.3);
    card(s, x, y, cw, ch);
    circulo(s, x + 0.35, y + 0.4, 0.6, cor, n, 'FFFFFF', 18);
    s.addText(t, { x: x + 1.2, y: y + 0.35, w: cw - 1.5, h: 0.6, fontFace: SANS, fontSize: 24, bold: true, color: corT, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(b, { x: x + 1.2, y: y + 1.0, w: cw - 1.5, h: 0.95, fontFace: SANS, fontSize: 15, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  });
  footer(s, 2);
  s.addNotes('Quatro mensagens para guardar. Primeiro: toda a carteira está na Etapa I, com 6% das atividades concluídas. Segundo: quase nenhuma atividade tem dono — esse é o gargalo mais fácil de resolver e o que mais destrava. Terceiro: justificativa e enquadramento travam mais da metade das demandas. Quarto: o valor informado está concentrado nos Chromebooks, e a maioria das demandas nem tem estimativa.');
}

// ---------------------------------------------------------------- 3 · Números
{
  const s = pres.addSlide(); s.background = { color: C.paper };
  header(s, 'Visão geral', 'A carteira em quatro números');
  const k = [['Demandas em carteira', '17', 'todas de TI, todas na Etapa I', C.navy], ['Valor informado (R$ mi)', '69,7', 'em apenas 3 das 17 demandas', C.navy],
    ['Atividades concluídas', '6%', '17 de 276 no checklist', C.red], ['Prazos legais iniciados', '0/21', 'SEPLAG, PRODERJ e CGE', C.navy]];
  const kw = (CW - 3 * 0.25) / 4;
  k.forEach(([r, v, n, cor], i) => {
    const x = M + i * (kw + 0.25);
    card(s, x, 1.95, kw, 2.05);
    s.addText(r, { x: x + 0.3, y: 2.12, w: kw - 0.5, h: 0.35, fontFace: SANS, fontSize: 13, bold: true, color: C.body, margin: 0, isTextBox: true });
    s.addText(v, { x: x + 0.3, y: 2.5, w: kw - 0.5, h: 0.95, fontFace: SERIF, fontSize: 54, bold: true, color: cor, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(n, { x: x + 0.3, y: 3.5, w: kw - 0.5, h: 0.35, fontFace: SANS, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  });
  s.addText('As 276 atividades do checklist', { x: M, y: 4.35, w: CW, h: 0.4, fontFace: SANS, fontSize: 16, bold: true, color: C.navy, margin: 0, isTextBox: true });
  s.addChart(pres.charts.BAR, [
    { name: 'Concluídas (17)', labels: ['Atividades'], values: [17] },
    { name: 'Em curso (9)', labels: ['Atividades'], values: [9] },
    { name: 'Pendentes (250)', labels: ['Atividades'], values: [250] },
  ], {
    x: M, y: 4.75, w: CW, h: 1.85, barDir: 'bar', barGrouping: 'percentStacked', barGapWidthPct: 20,
    chartColors: [C.navy, C.gold, C.track], showLegend: true, legendPos: 'b', legendFontSize: 12, legendColor: C.ink, legendFontFace: SANS,
    showValue: false, catAxisHidden: true, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
  });
  footer(s, 3);
  s.addNotes('O checklist completo das 17 demandas soma 276 atividades, porque a quantidade depende da modalidade: 32 na adesão, 26 nas demais, 7 enquanto a modalidade está a definir. Só 17 estão concluídas e 9 em curso. Os 21 prazos legais previstos na carteira — SEPLAG, PRODERJ e CGE — ainda não começaram, porque nenhuma demanda chegou às Etapas III e V.');
}

// ---------------------------------------------------------------- 4 · Caminho crítico
{
  const s = pres.addSlide(); s.background = { color: C.navy };
  header(s, 'Caminho crítico', 'Nenhuma demanda passou da Etapa I', true);
  const et = [['ETAPA I', 'Planejamento', '17', '7 atividades', 'ativa'], ['ETAPA II', 'Adesão à ARP', '0', 'Gate: ata válida', ''], ['ETAPA III', 'Comunicações', '0', 'SEPLAG · PRODERJ', 'critica'],
    ['ETAPA IV', 'Pesquisa de preços', '0', 'Sem ponto focal', ''], ['ETAPA V', 'Formalização', '0', 'CGE · sem ponto focal', 'critica']];
  const ew = (CW - 4 * 0.22) / 5;
  et.forEach(([e, n, q, d, tipo], i) => {
    const x = M + i * (ew + 0.22), ativa = tipo === 'ativa';
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.0, w: ew, h: 2.55, rectRadius: 0.08, fill: { color: ativa ? C.gold : C.navy2 }, line: { color: tipo === 'critica' ? 'E8867A' : (ativa ? C.gold : C.navyLine), width: tipo === 'critica' ? 1.5 : 0.75 } });
    const tc = ativa ? C.navy : C.light;
    s.addText(e, { x: x + 0.22, y: 2.15, w: ew - 0.4, h: 0.3, fontFace: SANS, fontSize: 11, bold: true, charSpacing: 2, color: ativa ? C.navy : C.goldLight, margin: 0, isTextBox: true });
    s.addText(n, { x: x + 0.22, y: 2.45, w: ew - 0.4, h: 0.4, fontFace: SANS, fontSize: 14, bold: true, color: tc, margin: 0, isTextBox: true });
    s.addText(q, { x: x + 0.22, y: 2.9, w: ew - 0.4, h: 1.0, fontFace: SERIF, fontSize: 60, bold: true, color: tc, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(d, { x: x + 0.22, y: 3.95, w: ew - 0.4, h: 0.4, fontFace: SANS, fontSize: 12, color: ativa ? C.navy : (tipo === 'critica' ? C.redLight : C.lightMuted), margin: 0, isTextBox: true });
  });
  s.addText([
    { text: 'Cada contratação ainda tem pela frente ', options: { color: C.lightMuted } },
    { text: '58 a 86 dias corridos', options: { color: C.light, bold: true } },
    { text: ' só de análises externas — SEPLAG 15 dias corridos, PRODERJ 20 dias úteis (+20) e CGE 15 dias corridos —, sem contar a elaboração dos artefatos.', options: { color: C.lightMuted } },
  ], { x: M, y: 4.95, w: 10.5, h: 1.2, fontFace: SANS, fontSize: 17, margin: 0, valign: 'top', isTextBox: true });
  footer(s, 4, true);
  s.addNotes('A carteira inteira está no planejamento. As etapas com prazo legal, destacadas em vermelho, ainda não receberam nenhuma demanda. A conta dos 58 a 86 dias: 15 dias corridos da SEPLAG, 20 dias úteis do PRODERJ (cerca de 28 corridos, ou 56 com a prorrogação de mais 20 úteis) e 15 dias corridos da CGE. É o tempo mínimo de análises de terceiros por contratação. As Etapas IV e V também não têm ponto focal nomeado na relação de participantes do GT.');
}

// ---------------------------------------------------------------- 5 · Valor
{
  const s = pres.addSlide(); s.background = { color: C.paper };
  header(s, 'Concentração de valor', '93% do valor em uma única demanda');
  s.addChart(pres.charts.BAR, [{ name: 'Valor estimado (R$ mi)', labels: ['02 · Softwares', '10 · Appliances backup', '01 · Chromebooks'], values: [1.30, 3.56, 64.82] }], {
    x: M, y: 1.95, w: 8.3, h: 3.6, barDir: 'bar', barGapWidthPct: 45, chartColors: [C.navy],
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '"R$ "0.00" mi"', dataLabelFontSize: 14, dataLabelColor: C.navy, dataLabelFontBold: true, dataLabelFontFace: SANS,
    catAxisLabelFontSize: 14, catAxisLabelColor: C.ink, catAxisLabelFontFace: SANS, catAxisLineShow: false,
    valAxisHidden: true, valAxisMaxVal: 90, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false,
  });
  card(s, 9.45, 1.95, 3.08, 3.6);
  s.addText('14', { x: 9.75, y: 2.15, w: 2.5, h: 1.1, fontFace: SERIF, fontSize: 66, bold: true, color: C.red, margin: 0, valign: 'middle', isTextBox: true });
  s.addText('de 17 demandas sem valor estimado', { x: 9.75, y: 3.3, w: 2.55, h: 0.8, fontFace: SANS, fontSize: 16, bold: true, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  s.addText('O tamanho real da carteira ainda é desconhecido.', { x: 9.75, y: 4.2, w: 2.55, h: 0.9, fontFace: SANS, fontSize: 13, color: C.muted, margin: 0, valign: 'top', isTextBox: true });
  s.addText('Com 14 de 17 demandas sem estimativa, não é possível dimensionar a carteira nem priorizar por valor. As três demandas com valor são justamente as que já têm processo SEI novo.', { x: M, y: 5.8, w: CW, h: 0.8, fontFace: SANS, fontSize: 16, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  footer(s, 5);
  s.addNotes('Valor total informado: R$ 69,68 milhões. Chromebooks responde por 93%, Appliances para backup por 5% e Softwares de edição e arquitetura por 2%. As 14 demandas sem estimativa impedem dimensionar a carteira — o valor real só será conhecido quando a pesquisa prévia ou a origem da estimativa for registrada.');
}

// ---------------------------------------------------------------- 6 · Carteira
{
  const s = pres.addSlide(); s.background = { color: C.paper };
  header(s, 'Prontidão da carteira', '10 das 17 demandas estão travadas');
  const cols = [
    { n: '4', t: 'Podem avançar', cor: C.navy, fill: C.blueSoft, sub: 'Justificativa recebida, DOD elaborado e via definida', itens: ['01 · Chromebooks', '03 · Telefonia VoIP', '07 · Licenças Microsoft', '10 · Appliances para backup'] },
    { n: '3', t: 'Em elaboração', cor: C.goldInk, fill: C.goldSoft, sub: 'Justificativa recebida, DOD em elaboração ou análise', itens: ['05 · Tela interativa', '08 · Antivírus com EDR', '09 · Computadores e monitores'] },
  ];
  const w1 = 3.55, w3 = CW - 2 * w1 - 2 * 0.3;
  cols.forEach((c, i) => {
    const x = M + i * (w1 + 0.3);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: w1, h: 4.65, rectRadius: 0.08, fill: { color: c.fill }, line: { color: c.fill } });
    s.addText(c.n, { x: x + 0.3, y: 2.1, w: 0.9, h: 0.9, fontFace: SERIF, fontSize: 48, bold: true, color: c.cor, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(c.t, { x: x + 1.2, y: 2.1, w: w1 - 1.4, h: 0.9, fontFace: SANS, fontSize: 18, bold: true, color: c.cor, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(c.sub, { x: x + 0.3, y: 3.05, w: w1 - 0.6, h: 0.6, fontFace: SANS, fontSize: 12, color: C.muted, margin: 0, valign: 'top', isTextBox: true });
    s.addText(c.itens.map((t, k) => ({ text: t, options: { breakLine: k < c.itens.length - 1 } })), { x: x + 0.3, y: 3.75, w: w1 - 0.6, h: 2.6, fontFace: SANS, fontSize: 15, color: C.ink, margin: 0, valign: 'top', paraSpaceAfter: 6, isTextBox: true });
  });
  const x3 = M + 2 * (w1 + 0.3);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x3, y: 1.95, w: w3, h: 4.65, rectRadius: 0.08, fill: { color: C.redSoft }, line: { color: C.redSoft } });
  s.addText('10', { x: x3 + 0.3, y: 2.1, w: 1.1, h: 0.9, fontFace: SERIF, fontSize: 48, bold: true, color: C.red, margin: 0, valign: 'middle', isTextBox: true });
  s.addText('Travadas', { x: x3 + 1.4, y: 2.1, w: w3 - 1.6, h: 0.9, fontFace: SANS, fontSize: 18, bold: true, color: C.red, margin: 0, valign: 'middle', isTextBox: true });
  s.addText([
    { text: 'Sem justificativa (6)', options: { bold: true, breakLine: true } },
    { text: '11 Switch ToR · 12 Firewall · 14 Rack 19U · 15 Pontos lógicos · 16 Telefonia móvel · 17 Switch core', options: { breakLine: true } },
    { text: ' ', options: { fontSize: 6, breakLine: true } },
    { text: 'Divergência (2)', options: { bold: true, breakLine: true } },
    { text: '02 Softwares · 13 Servidor hiperconvergente', options: { breakLine: true } },
    { text: ' ', options: { fontSize: 6, breakLine: true } },
    { text: 'Devolvidas (2)', options: { bold: true, breakLine: true } },
    { text: '04 Câmeras · 06 Link de internet' },
  ], { x: x3 + 0.3, y: 3.1, w: w3 - 0.6, h: 3.3, fontFace: SANS, fontSize: 14, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  footer(s, 6);
  s.addNotes('Classificação feita a partir dos dados do sistema. Podem avançar: demandas com justificativa, DOD elaborado e modalidade definida. Em elaboração: justificativa recebida e DOD em andamento. Travadas: sem justificativa da área técnica, com divergência a validar ou devolvidas à área demandante. A demanda 02 tem valor e processo SEI, mas está travada pela divergência no número da ata; a 13 cita ata e aceite que não estão registrados.');
}

// ---------------------------------------------------------------- 7 · Responsabilidade
{
  const s = pres.addSlide(); s.background = { color: C.paper };
  header(s, 'Papéis e responsabilidades', 'Quase nenhuma atividade tem dono');
  s.addText('99%', { x: M, y: 2.0, w: 4.4, h: 1.7, fontFace: SERIF, fontSize: 110, bold: true, color: C.red, margin: 0, valign: 'middle', isTextBox: true });
  s.addText([{ text: 'das atividades abertas ' }, { text: 'sem responsável', options: { bold: true } }, { text: ' — 256 de 259' }],
    { x: M, y: 3.8, w: 4.2, h: 0.9, fontFace: SANS, fontSize: 18, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  const linhas = [['0/17', 'demandas com responsável geral da coordenação'], ['0', 'responsáveis por etapa designados'], ['2', 'integrantes com atividade atribuída: Gibson (2) e Luene (1)'], ['IV · V', 'etapas sem ponto focal nomeado no GT']];
  const xr = 5.6, wr = W - M - xr, rh = 0.78;
  linhas.forEach(([n, t], i) => {
    const y = 2.0 + i * rh;
    s.addShape(pres.shapes.LINE, { x: xr, y, w: wr, h: 0, line: { color: 'D8D1C2', width: 0.75 } });
    s.addText(n, { x: xr, y: y + 0.08, w: 1.4, h: rh - 0.16, fontFace: SERIF, fontSize: 26, bold: true, color: C.navy, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(t, { x: xr + 1.5, y: y + 0.08, w: wr - 1.5, h: rh - 0.16, fontFace: SANS, fontSize: 15, color: C.ink, margin: 0, valign: 'middle', isTextBox: true });
  });
  s.addShape(pres.shapes.LINE, { x: xr, y: 2.0 + 4 * rh, w: wr, h: 0, line: { color: 'D8D1C2', width: 0.75 } });
  s.addText('Sem responsável, a atividade não aparece nas pendências de ninguém e nenhum aviso é disparado. Designar donos é a ação mais barata e a que mais destrava.', { x: M, y: 5.55, w: CW, h: 0.9, fontFace: SANS, fontSize: 16, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  footer(s, 7);
  s.addNotes('Este é o achado mais importante. O GT tem 15 integrantes em três frentes, mas no sistema só três atividades têm responsável. A coordenação pode resolver isso em uma reunião: designar o responsável geral de cada demanda e o responsável de cada etapa — o sistema propaga o nome para todas as atividades da etapa e avisa cada pessoa. As Etapas IV e V (pesquisa de preços e formalização) são 100% FAETEC e não têm ponto focal nomeado.');
}

// ---------------------------------------------------------------- 8 · Etapa I
{
  const s = pres.addSlide(); s.background = { color: C.paper };
  header(s, 'Etapa I · planejamento', 'Os artefatos técnicos mal começaram');
  const cats = ['PCA/PEDTIC confirmado (0/17)', 'TR · Mapa de riscos (0/17)', 'Manifestação do TI (1/17)', 'ETP (2/17)', 'DOD (5/17)', 'Definição da via (7/17)', 'Justificativa da área (10/17)'];
  s.addChart(pres.charts.BAR, [
    { name: 'Concluído', labels: cats, values: [0, 0, 1, 2, 5, 7, 10] },
    { name: 'Em andamento', labels: cats, values: [0, 0, 2, 3, 5, 4, 0] },
    { name: 'Não iniciado', labels: cats, values: [17, 17, 14, 12, 7, 6, 7] },
  ], {
    x: M, y: 1.9, w: CW, h: 4.3, barDir: 'bar', barGrouping: 'stacked', barGapWidthPct: 45,
    chartColors: [C.navy, C.gold, C.track], showLegend: true, legendPos: 't', legendFontSize: 12, legendColor: C.ink, legendFontFace: SANS,
    catAxisLabelFontSize: 13, catAxisLabelColor: C.ink, catAxisLabelFontFace: SANS, catAxisLineShow: false,
    valAxisHidden: true, valAxisMaxVal: 17, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
  });
  s.addText('ETP concluído inclui o reaproveitamento do ETP do PRODERJ nas demandas 03 e 07 (participante da ata).', { x: M, y: 6.3, w: CW, h: 0.35, fontFace: SANS, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  footer(s, 8);
  s.addNotes('O funil da Etapa I mostra onde o planejamento para. A justificativa chegou em 10 demandas, mas só 5 DODs estão elaborados. Manifestação do TI favorável existe em apenas uma (Telefonia VoIP), e nenhum TR ou mapa de riscos foi iniciado. O PCA/PEDTIC não está confirmado em nenhuma demanda: se algum item estiver fora do PEDTIC, será preciso justificativa técnica e revisão extraordinária — vale confirmar isso logo, antes de investir nos artefatos.');
}

// ---------------------------------------------------------------- tabelas
function tabela(s, cabec, linhas, larguras, y, fonte = 12, dark = false) {
  const hdr = cabec.map((t, i) => ({ text: t, options: { bold: true, color: dark ? C.goldLight : C.light, fill: { color: dark ? '0F1D3A' : C.navy }, align: i > 0 && dark ? 'right' : 'left' } }));
  const rows = linhas.map((l, r) => l.map((cel) => {
    const base = typeof cel === 'string' ? { text: cel, options: {} } : cel;
    return { text: base.text, options: { fill: { color: dark ? (r % 2 ? C.navy : C.navy2) : (r % 2 ? C.paper : C.card) }, color: dark ? C.light : C.ink, ...base.options } };
  }));
  s.addTable([hdr, ...rows], { x: M, y, w: CW, colW: larguras, fontFace: SANS, fontSize: fonte, valign: 'middle', margin: [5, 8, 5, 8], border: { type: 'solid', pt: 0.5, color: dark ? C.navyLine : C.line } });
}

// ---------------------------------------------------------------- 9 · Riscos
{
  const s = pres.addSlide(); s.background = { color: C.paper };
  header(s, 'Riscos e pontos de atenção', 'Cinco riscos a tratar antes de avançar');
  const b = (t, r) => ({ text: [{ text: t, options: { bold: true } }, { text: r ? ' ' + r : '' }] });
  tabela(s, ['Risco', 'Onde', 'Impacto', 'Ação'], [
    [b('Nº da ARP diverge', '(147 × 1477/2024)'), '02 · Softwares', 'Adesão na ata errada', 'Validar o nº com a CELIC/RS'],
    [b('Ata e aceite sem registro'), '13 · Servidor hiperconvergente', 'Demanda sem justificativa nem ata cadastrada', 'Localizar e registrar ata e aceite'],
    [b('Atas sem vigência', '(6 de 6)'), 'Catálogo de atas', 'Gate da Etapa II: carona em ata vencida', 'Registrar vigência e saldo'],
    [b('PCA/PEDTIC não confirmado', '(17 de 17)'), 'Toda a carteira', 'Item fora do PEDTIC exige revisão extraordinária', 'Ponto focal PCA confirma cada item'],
    [b('Devolvidas', 'à área técnica'), '04 · Câmeras e 06 · Link de internet', 'Quantitativo e itens indefinidos', 'Pactuar prazo de retorno'],
  ], [3.2, 2.6, 3.0, 2.933], 1.95, 15);
  footer(s, 9);
  s.addNotes('Os dois primeiros riscos são divergências de registro que o sistema já sinaliza. O terceiro é estrutural: nenhuma das seis atas tem vigência registrada, e sem ata válida o fluxo de adesão é interrompido no gate da Etapa II. O quarto afeta toda a carteira: o PCA/PEDTIC não foi confirmado em nenhuma demanda. O quinto são as duas demandas devolvidas à área técnica por falta de definição de quantitativo e itens.');
}

// ---------------------------------------------------------------- 10 · Prioridades
{
  const s = pres.addSlide(); s.background = { color: C.paper };
  header(s, 'Prioridades', 'Cinco demandas podem andar já');
  const d = (t, v) => ({ text: [{ text: t, options: { bold: true, breakLine: true } }, { text: v, options: { color: C.muted } }] });
  const v = (t) => ({ text: t, options: { align: 'right', bold: t !== '—' } });
  tabela(s, ['Demanda', 'Valor', 'Onde está', 'Próximo passo'], [
    [d('01 · Chromebooks', 'Adesão · ARP 032/2026'), v('R$ 64,82 mi'), 'ETP em elaboração; TI em análise', 'Concluir ETP e manifestação do TI; confirmar PCA'],
    [d('10 · Appliances backup', 'Adesão · PE-RP 016/2024'), v('R$ 3,56 mi'), 'DOD elaborado; aguardando envio ao TI', 'Enviar ao TI, confirmar PCA e iniciar ETP'],
    [d('03 · Telefonia VoIP', 'Participante · PE-RP 012/2024'), v('—'), 'ETP do PRODERJ; TI de acordo', 'Confirmar PCA; seguir para TR e aprovação da VPA'],
    [d('07 · Licenças Microsoft', 'Participante · PERP 12/25'), v('—'), 'ETP do PRODERJ; ata em assinatura', 'Acompanhar publicação da ata; manifestação do TI'],
    [d('02 · Softwares', 'Adesão · ARP CELIC/RS'), v('R$ 1,30 mi'), 'Divergência no nº da ARP', 'Resolver a divergência e seguir com o ETP'],
  ], [3.1, 1.5, 3.3, 3.833], 1.9, 14);
  s.addText([{ text: 'Juntas, somam ' }, { text: '100% do valor informado', options: { bold: true } }, { text: ' e já têm justificativa, DOD elaborado e ata identificada.' }],
    { x: M, y: 6.3, w: CW, h: 0.4, fontFace: SANS, fontSize: 14, color: C.body, margin: 0, isTextBox: true });
  footer(s, 10);
  s.addNotes('Estas cinco demandas têm justificativa, DOD elaborado e a via de contratação definida — quatro por ata de registro de preços e uma com a divergência a resolver. Concentrar a equipe nelas é o caminho mais curto para levar as primeiras contratações às etapas de comunicação à SEPLAG e análise do PRODERJ, onde começam os prazos legais. A demanda 08 (antivírus) também tem ata identificada, mas o DOD ainda está em elaboração.');
}

// ---------------------------------------------------------------- 11 · Plano
{
  const s = pres.addSlide(); s.background = { color: C.paper };
  header(s, 'Recomendações', 'Plano para os próximos 30 dias');
  const acoes = [
    ['Designar responsável geral e responsáveis por etapa nas 17 demandas', 'Coordenação · Semana 1'],
    ['Nomear ponto focal para as Etapas IV e V e liberar o acesso dos 15 integrantes', 'Coordenação e administrador · Semana 1'],
    ['Resolver as divergências das demandas 02 e 13', 'Conformidade · Semana 1'],
    ['Obter as 7 justificativas pendentes (demandas 11 a 17)', 'Coordenação e área demandante · Semanas 1–2'],
    ['Confirmar PCA/PEDTIC, valor e processo SEI das 17 demandas', 'Pontos focais (Frente III) · Semana 2'],
    ['Registrar a vigência das 6 atas e enquadrar as 10 demandas “a definir”', 'Elaboração (Frente II) · Semanas 2–3'],
  ];
  const aw = (CW - 2 * 0.3) / 3, ah = 2.1;
  acoes.forEach(([t, q], i) => {
    const x = M + (i % 3) * (aw + 0.3), y = 1.95 + Math.floor(i / 3) * (ah + 0.3);
    card(s, x, y, aw, ah);
    circulo(s, x + 0.3, y + 0.28, 0.5, C.gold, String(i + 1), C.navy, 16);
    s.addText(t, { x: x + 0.3, y: y + 0.88, w: aw - 0.6, h: 0.75, fontFace: SANS, fontSize: 14, bold: true, color: C.navy, margin: 0, valign: 'top', isTextBox: true });
    s.addText(q, { x: x + 0.3, y: y + 1.68, w: aw - 0.6, h: 0.3, fontFace: SANS, fontSize: 11, color: C.muted, margin: 0, isTextBox: true });
  });
  footer(s, 11, false, ' · prazos sugeridos');
  s.addNotes('Seis ações, com dono e semana sugerida, na ordem em que mais destravam. As três primeiras são decisões da coordenação e da conformidade e podem sair na primeira reunião. A quarta depende das áreas demandantes. A quinta e a sexta são de registro — sem elas, o sistema não consegue medir valor nem risco de ata. Os prazos são sugestões para discussão no GT.');
}

// ---------------------------------------------------------------- 12 · Indicadores
{
  const s = pres.addSlide(); s.background = { color: C.navy };
  header(s, 'Acompanhamento', 'Indicadores para o próximo report', true);
  const hoje = (t, alerta = true) => ({ text: t, options: { align: 'right', color: alerta ? C.redLight : C.light } });
  const meta = (t) => ({ text: t, options: { align: 'right', bold: true } });
  tabela(s, ['Indicador', 'Hoje', 'Meta em 30 dias'], [
    ['Demandas com responsável geral', hoje('0 de 17'), meta('17 de 17')],
    ['Atividades abertas com responsável', hoje('1%'), meta('100%')],
    ['Justificativas da área recebidas', hoje('10 de 17', false), meta('17 de 17')],
    ['PCA/PEDTIC confirmado', hoje('0 de 17'), meta('17 de 17')],
    ['Atas com vigência registrada', hoje('0 de 6'), meta('6 de 6')],
    ['Demandas além da Etapa I', hoje('0 de 17'), meta('ao menos 3')],
  ], [6.8, 2.4, 2.533], 1.95, 15, true);
  s.addText('Todos os indicadores saem do sistema: Painel, Relatórios › Report semanal e Minhas pendências.', { x: M, y: 6.25, w: CW, h: 0.4, fontFace: SANS, fontSize: 14, color: C.lightMuted, margin: 0, isTextBox: true });
  footer(s, 12, true, ' · metas sugeridas');
  s.addNotes('Proposta de seis indicadores para o próximo report, todos medidos pelo sistema. As metas são sugestões para validação da coordenação. A meta de ao menos três demandas além da Etapa I considera as cinco demandas prioritárias do slide anterior.');
}

pres.writeFile({ fileName: 'Status_Contratacoes_GT_PROPAG.pptx' }).then((f) => console.log('ok', f));
