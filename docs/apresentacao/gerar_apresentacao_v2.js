// Apresentação executiva · Status das contratações · GT PROPAG — v2 (posição 25/09/2026)
// Fontes: sistema em produção (1ª carga, 17 demandas) e planilha do GT de 24/09/2026 (2ª carga, 20 linhas).
// Nada aqui altera o sistema: a 2ª carga é apresentada como comparação e projeção.
const path = require('path');
const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
pres.title = 'Status das contratações · GT PROPAG';
pres.company = 'GT PROPAG · Compras Públicas';
pres.subject = 'Apresentação executiva · posição em 25/09/2026 · 1ª × 2ª carga';
const IMG = (f) => path.join(__dirname, 'img', f);

const C = {
  navy: '16284D', navy2: '1E3564', navyLine: '3A5184', gold: 'C8962F', goldInk: '8A5F0D', goldLight: 'E0B45A',
  paper: 'F3F0E9', card: 'FBFAF6', line: 'E2DCCF', ink: '1B2236', muted: '5F5A4E', body: '4A4538',
  red: 'B3372B', redLight: 'F2B3AA', redSoft: 'FBE2DE', blueSoft: 'E1E8F5', goldSoft: 'F7E9C9', track: 'E6E0D4',
  light: 'FBFAF6', lightMuted: 'CFD6E6', footDark: 'AAB5CF', green: '2F6B4F', greenSoft: 'E2EFE6',
};
const SERIF = 'Cambria';
const SANS = 'Calibri';
const W = 13.333, M = 0.8, CW = W - 2 * M;
const F_AMBAS = 'Fontes: sistema (1ª carga) e planilha do GT de 24/09 (2ª carga)';
const F_SIS = 'Fonte: Sistema de Controle de Contratações (1ª carga, 17 demandas)';
const F_PLAN = 'Fonte: planilha de andamento do GT de 24/09/2026 (2ª carga)';

function header(s, eyebrow, title, dark = false) {
  s.addText(eyebrow.toUpperCase(), { x: M, y: 0.55, w: CW, h: 0.32, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: dark ? C.goldLight : C.goldInk, margin: 0, isTextBox: true });
  s.addText(title, { x: M, y: 0.88, w: CW, h: 0.85, fontFace: SERIF, fontSize: 36, bold: true, color: dark ? C.light : C.navy, margin: 0, valign: 'top', isTextBox: true });
}
function footer(s, n, fonte = F_AMBAS, dark = false) {
  s.addText('GT PROPAG · Posição em 25/09/2026 · ' + fonte, { x: M, y: 6.92, w: 10.8, h: 0.3, fontFace: SANS, fontSize: 10.5, color: dark ? C.footDark : '6E6758', margin: 0, isTextBox: true });
  s.addText(String(n), { x: W - M - 1, y: 6.92, w: 1, h: 0.3, fontFace: SANS, fontSize: 11, bold: true, color: dark ? C.goldLight : C.navy, align: 'right', margin: 0, isTextBox: true });
}
const sombra = () => ({ type: 'outer', color: '16284D', opacity: 0.08, blur: 6, offset: 2, angle: 90 });
function card(s, x, y, w, h, fill = C.card, line = C.line) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: line, width: 0.75 }, shadow: sombra() });
}
function circulo(s, x, y, d, fill, txt, txtColor = 'FFFFFF', size = 14) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  s.addText(txt, { x, y, w: d, h: d, fontFace: SANS, fontSize: size, bold: true, color: txtColor, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
}
function tabela(s, cabec, linhas, larguras, y, fonte = 12, opts = {}) {
  const dark = !!opts.dark;
  const hdr = cabec.map((t, i) => ({ text: t, options: { bold: true, color: dark ? C.goldLight : C.light, fill: { color: dark ? '0F1D3A' : C.navy }, align: (opts.alignHdr && opts.alignHdr[i]) || (i > 0 && dark ? 'right' : 'left') } }));
  const rows = linhas.map((l, r) => l.map((cel) => {
    const base = typeof cel === 'string' ? { text: cel, options: {} } : cel;
    return { text: base.text, options: { fill: { color: dark ? (r % 2 ? C.navy : C.navy2) : (r % 2 ? C.paper : C.card) }, color: dark ? C.light : C.ink, ...base.options } };
  }));
  s.addTable([hdr, ...rows], { x: opts.x ?? M, y, w: opts.w ?? CW, colW: larguras, fontFace: SANS, fontSize: fonte, valign: 'middle', margin: opts.margin ?? [5, 8, 5, 8], border: { type: 'solid', pt: 0.5, color: dark ? C.navyLine : C.line }, rowH: opts.rowH });
}
function imagem(s, arq, x, y, w, h) {
  s.addShape(pres.shapes.RECTANGLE, { x: x - 0.03, y: y - 0.03, w: w + 0.06, h: h + 0.06, fill: { color: 'FFFFFF' }, line: { color: 'CFC7B6', width: 0.75 }, shadow: { type: 'outer', color: '16284D', opacity: 0.16, blur: 10, offset: 3, angle: 90 } });
  s.addImage({ path: IMG(arq), x, y, w, h });
}
function selo(s, x, y, w, texto, fill, cor) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.32, rectRadius: 0.05, fill: { color: fill }, line: { color: fill } });
  s.addText(texto, { x, y, w, h: 0.32, fontFace: SANS, fontSize: 10.5, bold: true, color: cor, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
}
let N = 0;
const nova = (bg = C.paper) => { const s = pres.addSlide(); s.background = { color: bg }; N += 1; return s; };

// ---------------------------------------------------------------- Capa
{
  const s = nova(C.navy);
  s.addText('GOVERNO DO ESTADO DO RIO DE JANEIRO', { x: M, y: 0.6, w: 6, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.light, margin: 0, isTextBox: true });
  s.addText('GT PROPAG · COMPRAS PÚBLICAS', { x: W - M - 6, y: 0.6, w: 6, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.goldLight, align: 'right', margin: 0, isTextBox: true });
  s.addText('APRESENTAÇÃO EXECUTIVA · ATUALIZAÇÃO', { x: M, y: 2.0, w: CW, h: 0.4, fontFace: SANS, fontSize: 16, bold: true, charSpacing: 4, color: C.goldLight, margin: 0, isTextBox: true });
  s.addText('Status das contratações\nda FAETEC', { x: M, y: 2.45, w: 11.5, h: 1.85, fontFace: SERIF, fontSize: 54, bold: true, color: C.light, margin: 0, valign: 'top', isTextBox: true });
  s.addText('A carteira passou de 17 para 20 demandas na planilha do GT. O que mudou, o que diverge e o que precisa de decisão.', { x: M, y: 4.4, w: 10.6, h: 0.8, fontFace: SANS, fontSize: 20, color: C.lightMuted, margin: 0, valign: 'top', isTextBox: true });
  const etapas = [['ETAPA I', 'Planejamento'], ['ETAPA II', 'Adesão à ARP'], ['ETAPA III', 'Comunicações'], ['ETAPA IV', 'Pesquisa de preços'], ['ETAPA V', 'Formalização']];
  const ew = (CW - 4 * 0.2) / 5;
  etapas.forEach(([e, n], i) => {
    const x = M + i * (ew + 0.2);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 5.3, w: ew, h: 0.85, rectRadius: 0.06, fill: { color: C.navy2 }, line: { color: C.navyLine, width: 0.75 } });
    s.addText([{ text: e, options: { fontSize: 10, bold: true, color: C.goldLight, charSpacing: 2, breakLine: true } }, { text: n, options: { fontSize: 14, bold: true, color: C.light } }],
      { x: x + 0.15, y: 5.33, w: ew - 0.3, h: 0.79, fontFace: SANS, valign: 'middle', margin: 0, isTextBox: true });
  });
  s.addText('SEDES · SECTI · FAETEC · PRODERJ', { x: M, y: 6.55, w: 6, h: 0.4, fontFace: SANS, fontSize: 14, bold: true, charSpacing: 1, color: C.light, margin: 0, isTextBox: true });
  s.addText([{ text: 'Posição em 25/09/2026', options: { bold: true, color: C.light, breakLine: true } }, { text: 'Sistema (1ª carga) × planilha do GT de 24/09 (2ª carga)', options: { color: C.lightMuted } }],
    { x: W - M - 6.5, y: 6.4, w: 6.5, h: 0.6, fontFace: SANS, fontSize: 13, align: 'right', margin: 0, isTextBox: true });
  s.addNotes('Atualização da apresentação executiva com a planilha de andamento do GT de 24/09/2026 (2ª carga). Importante: a 2ª carga ainda não foi lançada no sistema — por regra, nada é implementado sem autorização. Os números do sistema refletem a 1ª carga (17 demandas); os números da 2ª carga são apurados da planilha e, quando dependem do checklist, aparecem como projeção.');
}

// ---------------------------------------------------------------- Resumo
{
  const s = nova();
  header(s, 'Resumo executivo', 'A carteira cresceu, mas continua no planejamento');
  const itens = [
    ['1', C.navy, C.navy, '17 → 20 demandas', 'Saldo de +3 na planilha: 5 objetos novos e 2 que saíram (Tela interativa e Firewall). Com a Tela mantida ativa, a carteira consolidada tem 21.'],
    ['2', C.green, C.green, 'O planejamento andou', 'DOD elaborado 5 → 7, manifestação favorável do TI 1 → 5, processo SEI novo 3 → 17. Nenhuma demanda passou da Etapa I.'],
    ['3', C.red, C.red, '99% sem responsável', 'No sistema, 256 de 259 atividades abertas não têm integrante designado. Nenhuma demanda tem responsável geral.'],
    ['4', C.gold, C.goldInk, '9 divergências na planilha', 'Firewall × Firewall Fortinet, possível dupla contagem de computadores, 4 processos SEI com ano incoerente, entre outras.'],
  ];
  const cw = (CW - 0.3) / 2, ch = 2.15;
  itens.forEach(([n, cor, corT, t, b], i) => {
    const x = M + (i % 2) * (cw + 0.3), y = 2.0 + Math.floor(i / 2) * (ch + 0.3);
    card(s, x, y, cw, ch);
    circulo(s, x + 0.35, y + 0.4, 0.6, cor, n, 'FFFFFF', 18);
    s.addText(t, { x: x + 1.2, y: y + 0.35, w: cw - 1.5, h: 0.6, fontFace: SANS, fontSize: 24, bold: true, color: corT, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(b, { x: x + 1.2, y: y + 1.0, w: cw - 1.5, h: 0.95, fontFace: SANS, fontSize: 15, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  });
  footer(s, N);
  s.addNotes('Quatro mensagens. Primeiro: a planilha tem 20 linhas, mas não são simplesmente 3 linhas a mais — entraram 5 objetos e saíram 2. Segundo: houve avanço real no planejamento entre as duas cargas. Terceiro: o gargalo de responsabilidade continua — é dado do sistema. Quarto: a planilha nova traz divergências que precisam ser resolvidas antes de qualquer carga no sistema.');
}

// ---------------------------------------------------------------- Dashboard em alta definição
{
  const s = nova(C.navy);
  s.addText('O SISTEMA EM PRODUÇÃO', { x: M, y: 0.32, w: 6, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.goldLight, margin: 0, isTextBox: true });
  s.addText('Painel de contratações', { x: M, y: 0.58, w: 7, h: 0.55, fontFace: SERIF, fontSize: 28, bold: true, color: C.light, margin: 0, isTextBox: true });
  s.addText('Imagem 3840 × 2160 (4K) · dados idênticos à produção em 25/09 · 1ª carga, 17 demandas', { x: W - M - 6.2, y: 0.62, w: 6.2, h: 0.45, fontFace: SANS, fontSize: 12, color: C.lightMuted, align: 'right', valign: 'bottom', margin: 0, isTextBox: true });
  const iw = 10.4, ih = iw * 9 / 16; // 5.85
  imagem(s, 'dashboard_4k.png', (W - iw) / 2, 1.28, iw, ih);
  s.addNotes('Painel do sistema capturado em alta definição (3840 × 2160 pixels). A imagem foi gerada a partir de uma réplica local construída com as mesmas migrations e a mesma carga da produção — os indicadores foram conferidos contra o banco de produção: 17 demandas, 276 atividades, 256 atividades abertas sem responsável e R$ 69.681.145,11. A 2ª carga (planilha de 24/09) ainda não está no sistema e só será lançada com autorização.');
}

// ---------------------------------------------------------------- Números
{
  const s = nova();
  header(s, 'Visão geral · 2ª carga', 'A carteira em quatro números');
  const k = [['Demandas na planilha', '20', '+3 sobre a 1ª carga · 21 com a Tela', C.navy], ['Valor informado (R$ mi)', '69,7', 'inalterado · só 3 de 20 com valor', C.navy],
    ['Sem justificativa', '6', 'eram 7 na 1ª carga', C.red], ['Atividades previstas', '354', 'eram 276 · projeção, fora do sistema', C.goldInk]];
  const kw = (CW - 3 * 0.25) / 4;
  k.forEach(([r, v, n, cor], i) => {
    const x = M + i * (kw + 0.25);
    card(s, x, 1.95, kw, 1.9);
    s.addText(r, { x: x + 0.3, y: 2.1, w: kw - 0.5, h: 0.35, fontFace: SANS, fontSize: 13, bold: true, color: C.body, margin: 0, isTextBox: true });
    s.addText(v, { x: x + 0.3, y: 2.45, w: kw - 0.5, h: 0.9, fontFace: SERIF, fontSize: 52, bold: true, color: cor, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(n, { x: x + 0.3, y: 3.4, w: kw - 0.4, h: 0.35, fontFace: SANS, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  });
  s.addText('Marcos do planejamento · 1ª carga (17) × 2ª carga (20)', { x: M, y: 4.1, w: CW, h: 0.35, fontFace: SANS, fontSize: 16, bold: true, color: C.navy, margin: 0, isTextBox: true });
  const cats = ['Justificativa recebida', 'Via definida (ata/dispensa)', 'DOD elaborado', 'Manifestação do TI favorável', 'Processo SEI novo'];
  s.addChart(pres.charts.BAR, [
    { name: '1ª carga (de 17)', labels: cats, values: [10, 7, 5, 1, 3] },
    { name: '2ª carga (de 20)', labels: cats, values: [14, 9, 7, 5, 17] },
  ], {
    x: M, y: 4.45, w: CW, h: 2.35, barDir: 'col', barGrouping: 'clustered', barGapWidthPct: 70,
    chartColors: [C.track, C.navy], showLegend: true, legendPos: 'r', legendFontSize: 12, legendColor: C.ink, legendFontFace: SANS,
    showValue: true, dataLabelFontSize: 12, dataLabelFontBold: true, dataLabelColor: C.ink, dataLabelFontFace: SANS, dataLabelPosition: 'outEnd',
    catAxisLabelFontSize: 12, catAxisLabelColor: C.ink, catAxisLabelFontFace: SANS, valAxisHidden: true, valAxisMaxVal: 20, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
  });
  footer(s, N);
  s.addNotes('Quatro números da 2ª carga. O valor informado não mudou: R$ 69,68 milhões em três demandas. Justificativas pendentes caíram de 7 para 6, mesmo com mais demandas. As 354 atividades são uma projeção: é o checklist que o sistema geraria se a 2ª carga fosse lançada, mantendo a Tela interativa. No gráfico, os marcos da Etapa I nas duas cargas — atenção aos denominadores diferentes (17 e 20).');
}

// ---------------------------------------------------------------- Comparativo: composição
{
  const s = nova();
  header(s, 'Comparativo · 1ª × 2ª carga', '“Mais 3 linhas” são 5 entradas e 2 saídas');
  const col = [
    { n: '15', t: 'Continuam', fill: C.blueSoft, cor: C.navy, sub: 'mesmo objeto; 8 renumeradas', itens: ['Chromebooks · Softwares · VoIP · Câmeras', 'Link (06→05) · Microsoft (07→06)', 'Antivírus (08→07) · Computadores (09→08)', 'Appliances · Switch ToR', 'Servidor (13→12) · Rack (14→13)', 'Pontos lógicos · Telefonia móvel · Switch core'] },
    { n: '5', t: 'Entraram', fill: C.greenSoft, cor: C.green, sub: 'sem correspondente no sistema', itens: ['09 · Computadores avançados (desmembrado)', '14 · Access Point', '18 · Switch de acesso', '19 · Firewall Fortinet', '20 · Computador quântico'] },
    { n: '2', t: 'Saíram da planilha', fill: C.redSoft, cor: C.red, sub: 'seguem ativas no sistema', itens: ['05 · Tela interativa — mantida ativa por decisão do GT', '12 · Firewall — ponto de atenção: pode ter sido substituído pelo Firewall Fortinet'] },
  ];
  const cw = (CW - 2 * 0.3) / 3;
  col.forEach((c, i) => {
    const x = M + i * (cw + 0.3);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: cw, h: 3.75, rectRadius: 0.08, fill: { color: c.fill }, line: { color: c.fill } });
    s.addText(c.n, { x: x + 0.3, y: 2.08, w: 1.0, h: 0.85, fontFace: SERIF, fontSize: 48, bold: true, color: c.cor, margin: 0, valign: 'middle', isTextBox: true });
    s.addText([{ text: c.t, options: { bold: true, fontSize: 18, color: c.cor, breakLine: true } }, { text: c.sub, options: { fontSize: 12, color: C.muted } }], { x: x + 1.3, y: 2.08, w: cw - 1.5, h: 0.85, fontFace: SANS, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(c.itens.map((t, k) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: k < c.itens.length - 1 } })), { x: x + 0.3, y: 3.1, w: cw - 0.5, h: 2.5, fontFace: SANS, fontSize: 13, color: C.ink, margin: 0, valign: 'top', paraSpaceAfter: 5, isTextBox: true });
  });
  card(s, M, 5.9, CW, 0.82, C.card);
  s.addText([
    { text: 'Conta: ', options: { bold: true, color: C.navy } },
    { text: '17 − 2 + 5 = 20 linhas na planilha.  Carteira consolidada: ' },
    { text: '20 + Tela interativa = 21', options: { bold: true, color: C.navy } },
    { text: ' (22 se o Firewall do sistema for uma demanda distinta do Firewall Fortinet).' },
  ], { x: M + 0.3, y: 5.9, w: CW - 0.6, h: 0.82, fontFace: SANS, fontSize: 15, color: C.body, margin: 0, valign: 'middle', isTextBox: true });
  footer(s, N);
  s.addNotes('O casamento entre as cargas foi feito pelo objeto, não pelo número, porque a planilha foi renumerada. 15 objetos continuam — 8 deles com número novo. A demanda de computadores foi desmembrada: básicos, notebooks e monitores ficaram no item 08 e os computadores avançados viraram o item 09. Saíram da planilha a Tela interativa, que o GT decidiu manter ativa, e o Firewall genérico, tratado como ponto de atenção no próximo slide.');
}

// ---------------------------------------------------------------- Comparativo: renumeração
{
  const s = nova();
  header(s, 'Comparativo · de-para da numeração', 'Número na planilha × número no sistema');
  const st = (t, tipo) => ({ text: t, options: { color: tipo === 'novo' ? C.green : tipo === 'alerta' ? C.red : tipo === 'ren' ? C.goldInk : C.ink, bold: tipo !== undefined && tipo !== 'ok' } });
  const b = (t) => ({ text: t, options: { bold: true } });
  const esq = [
    [b('01'), 'Chromebooks', '01', st('TI de acordo; ETP elaborado', 'ok')],
    [b('02'), 'Softwares edição/arquitetura/eng.', '02', st('Retornou ao GT com observações', 'ok')],
    [b('03'), 'Telefonia VoIP', '03', st('SEI novo informado', 'ok')],
    [b('04'), 'Câmeras de segurança', '04', st('Aguarda revisão da justificativa', 'ok')],
    [b('05'), 'Link de internet (SD-WAN)', '06', st('Renumerada · DOD elaborado', 'ren')],
    [b('06'), 'Licenças Microsoft', '07', st('Renumerada · TI SIM', 'ren')],
    [b('07'), 'Antivírus com EDR', '08', st('Renumerada · DOD elaborado', 'ren')],
    [b('08'), 'Computadores básicos, notebooks, monitores', '09', st('Renumerada · desmembrada', 'ren')],
    [b('09'), 'Computadores avançados', '—', st('Nova (saiu do item 09 do sistema)', 'novo')],
    [b('10'), 'Appliances para backup', '10', st('TI de acordo; ETP elaborado', 'ok')],
    [b('11'), 'Switch top of rack', '11', st('SEI novo; sem justificativa', 'ok')],
  ];
  const dir = [
    [b('12'), 'Servidor hiperconvergente', '13', st('Renumerada', 'ren')],
    [b('13'), 'Rack 19U', '14', st('Renumerada · ata ARP 167/2025', 'ren')],
    [b('14'), 'Access Point', '—', st('Nova', 'novo')],
    [b('15'), 'Pontos lógicos', '15', st('SEI com ano 2028', 'alerta')],
    [b('16'), 'Telefonia móvel', '16', st('SEI com ano 2029', 'alerta')],
    [b('17'), 'Switch core', '17', st('SEI com ano 2025; sem quantitativo', 'alerta')],
    [b('18'), 'Switch de acesso', '—', st('Nova', 'novo')],
    [b('19'), 'Firewall Fortinet', '12?', st('Nova ou substitui o Firewall', 'alerta')],
    [b('20'), 'Computador quântico', '—', st('Nova', 'novo')],
    [b('—'), 'Tela interativa', '05', st('Fora da planilha · mantida ativa', 'alerta')],
    [b('—'), 'Firewall', '12', st('Fora da planilha · ponto de atenção', 'alerta')],
  ];
  const tw = (CW - 0.3) / 2, cols = [0.55, 2.35, 0.6, tw - 3.5];
  const opt = { w: tw, margin: [3, 6, 3, 6], alignHdr: ['left', 'left', 'left', 'left'] };
  tabela(s, ['Plan.', 'Objeto', 'Sist.', 'Mudança'], esq, cols, 1.85, 11, { ...opt, x: M });
  tabela(s, ['Plan.', 'Objeto', 'Sist.', 'Mudança'], dir, cols, 1.85, 11, { ...opt, x: M + tw + 0.3 });
  footer(s, N);
  s.addNotes('De-para completo entre a numeração da planilha de 24/09 (coluna Plan.) e a numeração que está no sistema (coluna Sist.). Em dourado, as renumeradas; em verde, as novas; em vermelho, os pontos que exigem verificação. Se a 2ª carga for autorizada, é preciso decidir se o sistema adota a numeração da planilha ou mantém a sua — o número no sistema é único e aparece na auditoria.');
}

// ---------------------------------------------------------------- Firewall
{
  const s = nova();
  header(s, 'Ponto de atenção', 'Firewall (sistema) × Firewall Fortinet (planilha)');
  const lin = [
    ['Número', '12 no sistema e na 1ª carga', '19 na planilha de 24/09 (o 12 agora é o Servidor)'],
    ['Objeto', 'Firewall — genérico', 'Firewall Fortinet — indica marca'],
    ['Processo SEI', 'não informado', 'SEI-260005/008714/2026'],
    ['Justificativa / DOD', 'sem justificativa no drive', 'recebida em 24/09 · DOD em análise'],
    ['Quantitativo', 'não informado', '2 NGFW, 2 conjuntos de licenças, 3 tipos de console (2 de cada), treinamento (3)'],
    ['Ata · TI', 'sem ata · sem manifestação', 'sem ata · TI: NÃO'],
    ['No sistema', 'ativo · a definir · 7 atividades', 'não existe'],
  ];
  const b = (t) => ({ text: t, options: { bold: true } });
  tabela(s, ['Campo', '1ª carga · Firewall', '2ª carga · Firewall Fortinet'], lin.map(([a, x, y]) => [b(a), x, y]), [2.4, 4.3, 5.033], 1.85, 13);
  const bw = (CW - 0.3) / 2;
  card(s, M, 5.0, bw, 1.72, C.goldSoft, C.goldSoft);
  s.addText([{ text: 'Decisão do GT', options: { bold: true, color: C.goldInk, breakLine: true } },
    { text: 'É a mesma demanda, agora detalhada? Então o 12 do sistema é atualizado e a carteira fica com 21. Se for outra, o Firewall genérico continua e a carteira vai a 22.' }],
    { x: M + 0.25, y: 5.08, w: bw - 0.5, h: 1.56, fontFace: SANS, fontSize: 13.5, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  card(s, M + bw + 0.3, 5.0, bw, 1.72, C.redSoft, C.redSoft);
  s.addText([{ text: 'Indicação de marca', options: { bold: true, color: C.red, breakLine: true } },
    { text: 'Citar “Fortinet” no objeto exige justificativa formal (padronização ou compatibilidade), conforme o art. 41, I, da Lei 14.133/2021. Sem ela, o DOD e o TR ficam expostos a questionamento.' }],
    { x: M + bw + 0.55, y: 5.08, w: bw - 0.5, h: 1.56, fontFace: SANS, fontSize: 13.5, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  footer(s, N);
  s.addNotes('O Firewall genérico sumiu da planilha e surgiu um Firewall Fortinet, em outra posição, já com processo SEI, justificativa e quantitativo. Tudo indica que é a mesma necessidade, agora detalhada — mas isso precisa ser confirmado pelo GT, porque muda o total da carteira (21 ou 22). Segundo ponto: a indicação de marca no objeto só é admitida com justificativa, nas hipóteses do art. 41, I, da Lei 14.133/2021. Vale ajustar o objeto para a especificação técnica ou juntar a justificativa de padronização.');
}

// ---------------------------------------------------------------- Divergências
{
  const s = nova();
  header(s, 'Qualidade dos dados · 2ª carga', 'Nove divergências a resolver antes da carga');
  const b = (t) => ({ text: t, options: { bold: true } });
  tabela(s, ['#', 'Divergência', 'Onde (nº planilha)', 'O que fazer'], [
    ['1', b('Firewall × Firewall Fortinet'), '19 · sistema 12', 'Confirmar se é a mesma demanda'],
    ['2', b('Possível dupla contagem de computadores'), '08 × 09', 'Quantitativo do 08 inclui 2.140 de alto desempenho; o 09 é “avançados”'],
    ['3', b('Objeto × quantitativo não batem'), '08', 'Objeto: 2.260 notebooks e 7.640 + 600 monitores; quantitativo: 600 monitores'],
    ['4', b('Processo SEI com ano ≠ 2026'), '13 · 15 · 16 · 17', 'Anos 2027, 2028, 2029 e 2025 — conferir no SEI'],
    ['5', b('Nº da ARP diverge'), '02', 'DOD cita ARP 147/2024; ata cita 1477/2024 (CELIC/RS)'],
    ['6', b('Tela interativa fora da planilha'), 'sistema 05', 'Mantida ativa; confirmar com a área demandante'],
    ['7', b('Sem processo SEI'), '14 · 18 · 20', 'Abrir ou informar o processo'],
    ['8', b('Informação regrediu'), '12 · Servidor', '1ª carga: “já tem ata e aceite”; 2ª: “sem justificativa”'],
    ['9', b('Objeto atípico, sem quantitativo'), '20 · Comp. quântico', 'Validar a necessidade e a aderência ao PEDTIC'],
  ], [0.4, 3.7, 2.2, 5.433], 1.85, 12, { margin: [4, 7, 4, 7] });
  footer(s, N, F_PLAN);
  s.addNotes('Divergências encontradas na conferência linha a linha da planilha de 24/09 contra a 1ª carga. Nenhuma foi corrigida no sistema — por regra, qualquer lançamento depende de autorização. A de maior impacto é a possível dupla contagem de computadores: o item 08 lista 2.140 computadores de alto desempenho no quantitativo, enquanto o item 09 trata justamente de computadores avançados. Na 1ª carga também havia um erro de numeração: o Link de internet estava com número 0 na planilha — foi corrigido.');
}

// ---------------------------------------------------------------- Verificação das atividades
{
  const s = nova();
  header(s, 'Verificação · número de atividades', '32 atividades por fluxo: confirmado');
  const ok = (t) => ({ text: t, options: { bold: true, color: C.green } });
  const pj = (t) => ({ text: t, options: { bold: true, color: C.goldInk } });
  const b = (t) => ({ text: t, options: { bold: true } });
  tabela(s, ['Número', 'Valor', 'Conferência', 'Status'], [
    [b('Atividades do fluxo'), '32', '7 + 6 + 3 + 7 + 9 (Etapas I a V) · documento = sistema', ok('Confirmado')],
    [b('Por macroprocesso'), '7 · 16 · 9', 'Etapa I · Etapas II a IV (6 + 3 + 7) · Etapa V', ok('Confirmado')],
    [b('Checklist no sistema (1ª carga)'), '276', '4 adesões × 32 + 3 × 26 + 10 a definir × 7 · consulta à produção', ok('Confirmado')],
    [b('Situação das 276'), '17 · 9 · 250', 'concluídas · em curso (5 + 2 + 2) · pendentes', ok('Confirmado')],
    [b('Checklist da 2ª carga (20)'), '347', '6 × 32 + 3 × 26 + 11 × 7, pela mesma regra da 1ª carga', pj('Projeção')],
    [b('Consolidado com a Tela (21)'), '354', '347 + 7 (Tela interativa, a definir)', pj('Projeção')],
    [b('Prazos legais previstos'), '21 → 27', '7 → 9 demandas com via definida × 3 prazos', pj('Projeção')],
  ], [3.0, 1.35, 5.9, 1.483], 1.85, 12.5, { margin: [4, 7, 4, 7] });
  s.addText('Ponte 276 → 354:  +60 das 5 novas (Access Point 32 + 4 × 7)  ·  +25 Rack 19U (a definir → adesão)  ·  −7 Firewall do sistema fora da planilha', { x: M, y: 5.0, w: CW, h: 0.4, fontFace: SANS, fontSize: 14, bold: true, color: C.navy, margin: 0, isTextBox: true });
  s.addText('A regra que enquadra a modalidade pela coluna “Ata” da planilha, aplicada à 1ª carga, reproduz exatamente as 276 atividades da produção — por isso a projeção é confiável. Detalhe completo no relatório de verificação.', { x: M, y: 5.45, w: CW, h: 0.6, fontFace: SANS, fontSize: 13.5, color: C.muted, margin: 0, valign: 'top', isTextBox: true });
  footer(s, N);
  s.addNotes('O número de 32 atividades confere entre o documento de macroprocessos e o catálogo do sistema: 7 na Etapa I, 6 na II, 3 na III, 7 na IV e 9 na V. O checklist de cada demanda depende da modalidade: 32 na adesão, 26 nas demais (sem a Etapa II) e 7 enquanto está a definir. As 276 da produção foram conferidas por consulta direta ao banco. As 347 e 354 são projeções da 2ª carga: o checklist que o sistema geraria se a planilha fosse lançada.');
}

// ---------------------------------------------------------------- Caminho crítico
{
  const s = nova(C.navy);
  header(s, 'Caminho crítico', 'Nenhuma demanda passou da Etapa I', true);
  const et = [['ETAPA I', 'Planejamento', '20', '7 atividades', 'ativa'], ['ETAPA II', 'Adesão à ARP', '0', 'Gate: ata válida', ''], ['ETAPA III', 'Comunicações', '0', 'SEPLAG · PRODERJ', 'critica'],
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
    { text: 'As 20 demandas da planilha (17 no sistema) estão no planejamento. Cada uma ainda tem pela frente ', options: { color: C.lightMuted } },
    { text: '58 a 86 dias corridos', options: { color: C.light, bold: true } },
    { text: ' só de análises externas — SEPLAG 15 corridos, PRODERJ 20 úteis (+20) e CGE 15 corridos.', options: { color: C.lightMuted } },
  ], { x: M, y: 4.95, w: 11.2, h: 1.2, fontFace: SANS, fontSize: 17, margin: 0, valign: 'top', isTextBox: true });
  footer(s, N, F_AMBAS, true);
  s.addNotes('Nenhuma linha da planilha indica avanço além da Etapa I: os marcos registrados são justificativa, DOD, ata, manifestação do TI e ETP/TR. A conta dos 58 a 86 dias: 15 dias corridos da SEPLAG, 20 dias úteis do PRODERJ (cerca de 28 corridos, ou 56 com a prorrogação) e 15 dias corridos da CGE.');
}

// ---------------------------------------------------------------- Valor
{
  const s = nova();
  header(s, 'Concentração de valor', '93% do valor em uma única demanda');
  s.addChart(pres.charts.BAR, [{ name: 'Valor estimado (R$ mi)', labels: ['02 · Softwares', '10 · Appliances backup', '01 · Chromebooks'], values: [1.30, 3.56, 64.82] }], {
    x: M, y: 1.95, w: 8.3, h: 3.6, barDir: 'bar', barGapWidthPct: 45, chartColors: [C.navy],
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '"R$ "0.00" mi"', dataLabelFontSize: 14, dataLabelColor: C.navy, dataLabelFontBold: true, dataLabelFontFace: SANS,
    catAxisLabelFontSize: 14, catAxisLabelColor: C.ink, catAxisLabelFontFace: SANS, catAxisLineShow: false,
    valAxisHidden: true, valAxisMaxVal: 90, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false,
  });
  card(s, 9.45, 1.95, 3.08, 3.6);
  s.addText('17', { x: 9.75, y: 2.15, w: 2.5, h: 1.1, fontFace: SERIF, fontSize: 66, bold: true, color: C.red, margin: 0, valign: 'middle', isTextBox: true });
  s.addText('de 20 demandas sem valor estimado', { x: 9.75, y: 3.3, w: 2.55, h: 0.8, fontFace: SANS, fontSize: 16, bold: true, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  s.addText('Eram 14 de 17. O tamanho real da carteira segue desconhecido.', { x: 9.75, y: 4.2, w: 2.55, h: 0.9, fontFace: SANS, fontSize: 13, color: C.muted, margin: 0, valign: 'top', isTextBox: true });
  s.addText('A 2ª carga não trouxe nenhum valor novo: são os mesmos R$ 69,68 mi da 1ª carga. Agora, porém, 10 demandas têm quantitativo informado — base para a estimativa.', { x: M, y: 5.8, w: CW, h: 0.8, fontFace: SANS, fontSize: 16, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  footer(s, N, F_PLAN);
  s.addNotes('Valores idênticos nas duas cargas: Chromebooks R$ 64.818.000,00; Appliances R$ 3.559.045,11; Softwares R$ 1.304.100,00; total R$ 69.681.145,11. A novidade da 2ª carga é a coluna de quantitativo: 13 linhas preenchidas, das quais 10 com quantidade efetiva (01, 02, 03, 05, 06, 07, 08, 10, 13 e 19) e 3 registrando que a quantidade não foi informada (04, 17 e 20).');
}

// ---------------------------------------------------------------- Prontidão
{
  const s = nova();
  header(s, 'Prontidão da carteira · 2ª carga', '5 podem avançar; 8 esperam justificativa ou revisão');
  const cols = [
    { n: '5', t: 'Podem avançar', cor: C.navy, fill: C.blueSoft, sub: 'DOD elaborado e via definida', itens: ['01 · Chromebooks', '03 · Telefonia VoIP', '06 · Licenças Microsoft', '07 · Antivírus com EDR', '10 · Appliances para backup'] },
    { n: '8', t: 'Em análise ou ajuste', cor: C.goldInk, fill: C.goldSoft, sub: 'Justificativa recebida, DOD em análise', itens: ['02 · Softwares (retornou com obs.)', '08 · Computadores', '13 · Rack 19U', '16 · Telefonia móvel', '17 · Switch core', '19 · Firewall Fortinet', '20 · Computador quântico', 'Tela interativa (sist. 05)'] },
  ];
  const w1 = 3.55, w3 = CW - 2 * w1 - 2 * 0.3;
  cols.forEach((c, i) => {
    const x = M + i * (w1 + 0.3);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: w1, h: 4.75, rectRadius: 0.08, fill: { color: c.fill }, line: { color: c.fill } });
    s.addText(c.n, { x: x + 0.3, y: 2.05, w: 0.9, h: 0.9, fontFace: SERIF, fontSize: 48, bold: true, color: c.cor, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(c.t, { x: x + 1.2, y: 2.05, w: w1 - 1.4, h: 0.9, fontFace: SANS, fontSize: 18, bold: true, color: c.cor, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(c.sub, { x: x + 0.3, y: 2.95, w: w1 - 0.6, h: 0.4, fontFace: SANS, fontSize: 12, color: C.muted, margin: 0, valign: 'top', isTextBox: true });
    s.addText(c.itens.map((t, k) => ({ text: t, options: { breakLine: k < c.itens.length - 1 } })), { x: x + 0.3, y: 3.4, w: w1 - 0.6, h: 3.2, fontFace: SANS, fontSize: 14, color: C.ink, margin: 0, valign: 'top', paraSpaceAfter: 4, isTextBox: true });
  });
  const x3 = M + 2 * (w1 + 0.3);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x3, y: 1.95, w: w3, h: 4.75, rectRadius: 0.08, fill: { color: C.redSoft }, line: { color: C.redSoft } });
  s.addText('8', { x: x3 + 0.3, y: 2.05, w: 0.9, h: 0.9, fontFace: SERIF, fontSize: 48, bold: true, color: C.red, margin: 0, valign: 'middle', isTextBox: true });
  s.addText('Travadas', { x: x3 + 1.2, y: 2.05, w: w3 - 1.4, h: 0.9, fontFace: SANS, fontSize: 18, bold: true, color: C.red, margin: 0, valign: 'middle', isTextBox: true });
  s.addText([
    { text: 'Sem justificativa (6)', options: { bold: true, breakLine: true } },
    { text: '09 Computadores avançados · 11 Switch ToR · 12 Servidor hiperconvergente · 14 Access Point · 15 Pontos lógicos · 18 Switch de acesso', options: { breakLine: true } },
    { text: ' ', options: { fontSize: 6, breakLine: true } },
    { text: 'Devolvidas à área técnica (2)', options: { bold: true, breakLine: true } },
    { text: '04 Câmeras (desde 24/09) · 05 Link de internet (desde 23/09)', options: { breakLine: true } },
    { text: ' ', options: { fontSize: 6, breakLine: true } },
    { text: 'Na 1ª carga eram 10 travadas de 17.', options: { color: C.muted, italic: true } },
  ], { x: x3 + 0.3, y: 3.05, w: w3 - 0.6, h: 3.5, fontFace: SANS, fontSize: 14, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  footer(s, N, F_PLAN + ' · Tela: sistema');
  s.addNotes('Classificação pela planilha de 24/09, com a numeração da planilha, mais a Tela interativa, que está no sistema. Podem avançar: DOD elaborado e via definida por ata (ou participação). Em análise ou ajuste: justificativa recebida e DOD em análise, ou retorno com observações. Travadas: sem justificativa no drive, ou devolvidas à área técnica para rever quantitativo e itens. Total: 5 + 8 + 8 = 21.');
}

// ---------------------------------------------------------------- Responsabilidade
{
  const s = nova();
  header(s, 'Papéis e responsabilidades', 'Quase nenhuma atividade tem dono');
  s.addText('99%', { x: M, y: 1.95, w: 4.2, h: 1.5, fontFace: SERIF, fontSize: 100, bold: true, color: C.red, margin: 0, valign: 'middle', isTextBox: true });
  s.addText([{ text: 'das atividades abertas ' }, { text: 'sem responsável', options: { bold: true } }, { text: ' no sistema — 256 de 259' }],
    { x: M, y: 3.5, w: 4.2, h: 0.9, fontFace: SANS, fontSize: 18, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  const linhas = [['0/17', 'demandas com responsável geral'], ['0', 'responsáveis por etapa designados'], ['2', 'integrantes com atividade: Gibson (2) e Luene (1)']];
  linhas.forEach(([n, t], i) => {
    const y = 4.45 + i * 0.62;
    s.addShape(pres.shapes.LINE, { x: M, y, w: 4.3, h: 0, line: { color: 'D8D1C2', width: 0.75 } });
    s.addText(n, { x: M, y: y + 0.06, w: 0.9, h: 0.5, fontFace: SERIF, fontSize: 20, bold: true, color: C.navy, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(t, { x: M + 0.95, y: y + 0.06, w: 3.4, h: 0.5, fontFace: SANS, fontSize: 13, color: C.ink, margin: 0, valign: 'middle', isTextBox: true });
  });
  const iw = 7.1, ih = iw * 9 / 16;
  imagem(s, 'detalhe.png', W - M - iw, 1.95, iw, ih);
  s.addText('Checklist da demanda 01 no sistema: atividades “Sem responsável” e responsável geral “não definido”.', { x: W - M - iw, y: 1.95 + ih + 0.1, w: iw, h: 0.35, fontFace: SANS, fontSize: 11.5, color: C.muted, margin: 0, isTextBox: true });
  footer(s, N, F_SIS);
  s.addNotes('Dado do sistema. O GT tem 15 integrantes em três frentes, mas só três atividades têm responsável. A coordenação pode resolver em uma reunião: designar o responsável geral de cada demanda e o responsável de cada etapa — o sistema propaga o nome para todas as atividades da etapa e avisa cada pessoa. A imagem mostra a tela de checklist da demanda 01 (Chromebooks).');
}

// ---------------------------------------------------------------- Telas do sistema
{
  const s = nova();
  header(s, 'O sistema por dentro', 'Tudo o que está nesta apresentação sai do sistema');
  const iw = (CW - 0.4) / 2, ih = iw * 9 / 16;
  [['contratacoes.png', 'Contratações · lista com filtros rápidos, etapa, responsável e situação'], ['relatorios.png', 'Relatórios · posição da carteira, com filtros e exportação para Excel e PDF']].forEach(([arq, leg], i) => {
    const x = M + i * (iw + 0.4);
    imagem(s, arq, x, 2.0, iw, ih);
    s.addText(leg, { x, y: 2.0 + ih + 0.15, w: iw, h: 0.35, fontFace: SANS, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  });
  s.addText('Depois de autorizada a 2ª carga, as mesmas telas passam a mostrar as 21 demandas — com o de-para da numeração registrado na auditoria.', { x: M, y: 5.95, w: CW, h: 0.6, fontFace: SANS, fontSize: 15, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  footer(s, N, F_SIS);
  s.addNotes('Telas do sistema com os dados de produção (1ª carga): a lista de contratações com os filtros rápidos e o relatório de posição da carteira. Depois de autorizada a 2ª carga, estas mesmas telas passam a mostrar as 21 demandas.');
}

// ---------------------------------------------------------------- Riscos
{
  const s = nova();
  header(s, 'Riscos e pontos de atenção', 'Seis riscos a tratar antes de avançar');
  const b = (t, r) => ({ text: [{ text: t, options: { bold: true } }, { text: r ? ' ' + r : '' }] });
  tabela(s, ['Risco', 'Onde (nº planilha)', 'Impacto', 'Ação'], [
    [b('Carteira desatualizada no sistema'), 'Toda a carteira', 'Painel mostra 17; planilha tem 20', 'Decidir e autorizar a 2ª carga'],
    [b('Firewall duplicado ou substituído'), '19 · sistema 12', 'Total 21 ou 22; marca sem justificativa', 'GT confirma e ajusta o objeto'],
    [b('Dupla contagem de computadores'), '08 × 09', 'Superdimensionar a compra', 'Conciliar quantitativos'],
    [b('Nº da ARP diverge', '(147 × 1477/2024)'), '02 · Softwares', 'Adesão na ata errada', 'Validar o nº com a CELIC/RS'],
    [b('Atas sem vigência', '(6 de 6 no sistema)'), 'Catálogo de atas', 'Gate da Etapa II: carona em ata vencida', 'Registrar vigência e saldo'],
    [b('PCA/PEDTIC não confirmado'), 'Toda a carteira', 'Item fora do PEDTIC exige revisão extraordinária', 'Ponto focal PCA confirma cada item'],
  ], [3.3, 2.3, 3.2, 2.933], 1.85, 14);
  footer(s, N);
  s.addNotes('Dois riscos novos nesta atualização: a carteira do sistema está defasada em relação à planilha, e a composição da 2ª carga tem pontos a confirmar (Firewall e computadores). Os demais seguem da apresentação anterior: divergência no número da ARP dos Softwares, atas sem vigência registrada e PCA/PEDTIC não confirmado.');
}

// ---------------------------------------------------------------- Prioridades
{
  const s = nova();
  header(s, 'Prioridades', 'Cinco demandas podem andar já');
  const d = (t, v) => ({ text: [{ text: t, options: { bold: true, breakLine: true } }, { text: v, options: { color: C.muted } }] });
  const v = (t) => ({ text: t, options: { align: 'right', bold: t !== '—' } });
  tabela(s, ['Demanda (nº planilha · sist.)', 'Valor', 'Onde está (24/09)', 'Próximo passo'], [
    [d('01 · Chromebooks', 'sist. 01 · Adesão · ARP 032/2026 SEAD/MA'), v('R$ 64,82 mi'), 'Entregue pelo GT; em análise no Planejamento FAETEC desde 18/09', 'Cobrar retorno; confirmar PCA'],
    [d('10 · Appliances backup', 'sist. 10 · Adesão · PE-RP 016/2024'), v('R$ 3,56 mi'), 'ETP elaborado; TR em elaboração; TI de acordo', 'Concluir TR e mapa de riscos'],
    [d('03 · Telefonia VoIP', 'sist. 03 · Participante · PE-RP 012/2024'), v('—'), 'Entregue; em análise no Planejamento desde 18/09', 'Cobrar retorno; confirmar PCA'],
    [d('06 · Licenças Microsoft', 'sist. 07 · Participante · PERP 12/25'), v('—'), 'Aguarda publicação da ata; PRODERJ remaneja quantitativo', 'Acompanhar a ata'],
    [d('07 · Antivírus com EDR', 'sist. 08 · Adesão · ARP 02/2026 TJMA'), v('—'), 'DOD elaborado; documentos em elaboração; TI pendente', 'Manifestação do TI (Gibson)'],
  ], [3.35, 1.4, 4.0, 2.983], 1.85, 13);
  s.addText([{ text: 'Mudança: ' , options: { bold: true } }, { text: 'o Antivírus entrou na lista (DOD elaborado) e os Softwares saíram — o processo retornou ao GT com observações. Juntas, as cinco somam 98% do valor informado.' }],
    { x: M, y: 6.3, w: CW, h: 0.45, fontFace: SANS, fontSize: 13.5, color: C.body, margin: 0, isTextBox: true });
  footer(s, N, F_PLAN);
  s.addNotes('Cinco demandas com DOD elaborado e via definida. Duas delas (Chromebooks e VoIP) estão paradas no Setor de Planejamento da FAETEC desde 18/09, sem resposta — o próximo passo é cobrar o retorno. O Antivírus entrou na lista e os Softwares saíram, porque o processo voltou ao GT com observações da Luene. Os 98% são Chromebooks (93%) mais Appliances (5%).');
}

// ---------------------------------------------------------------- Plano
{
  const s = nova();
  header(s, 'Recomendações', 'Plano para os próximos 30 dias');
  const acoes = [
    ['Validar as 9 divergências da planilha e decidir o caso Firewall', 'Coordenação e conformidade · Semana 1'],
    ['Autorizar a carga da 2ª planilha no sistema, com o de-para da numeração', 'Coordenação e administrador · após validação'],
    ['Designar responsável geral e responsáveis por etapa nas 21 demandas', 'Coordenação · Semana 1'],
    ['Cobrar o retorno do Planejamento FAETEC (01 e 03, desde 18/09) e das devolvidas (04 e 05)', 'Pontos focais (Frente III) · Semana 1'],
    ['Obter as 6 justificativas pendentes (09, 11, 12, 14, 15, 18)', 'Coordenação e área demandante · Semanas 1–2'],
    ['Confirmar PCA/PEDTIC e vigência das atas; estimar valor das 17 sem valor', 'Frentes II e III · Semanas 2–3'],
  ];
  const aw = (CW - 2 * 0.3) / 3, ah = 2.1;
  acoes.forEach(([t, q], i) => {
    const x = M + (i % 3) * (aw + 0.3), y = 1.95 + Math.floor(i / 3) * (ah + 0.3);
    card(s, x, y, aw, ah);
    circulo(s, x + 0.3, y + 0.28, 0.5, C.gold, String(i + 1), C.navy, 16);
    s.addText(t, { x: x + 0.3, y: y + 0.88, w: aw - 0.6, h: 0.78, fontFace: SANS, fontSize: 14, bold: true, color: C.navy, margin: 0, valign: 'top', isTextBox: true });
    s.addText(q, { x: x + 0.3, y: y + 1.7, w: aw - 0.6, h: 0.3, fontFace: SANS, fontSize: 11, color: C.muted, margin: 0, isTextBox: true });
  });
  footer(s, N, F_AMBAS + ' · prazos sugeridos');
  s.addNotes('Seis ações. A segunda é a decisão que depende de autorização: lançar a 2ª carga no sistema só depois de validadas as divergências e definido o de-para da numeração. Enquanto isso, o sistema segue com a 1ª carga e a Tela interativa ativa. Os prazos são sugestões para discussão no GT.');
}

// ---------------------------------------------------------------- Indicadores
{
  const s = nova(C.navy);
  header(s, 'Acompanhamento', 'Indicadores para o próximo report', true);
  const hoje = (t, alerta = true) => ({ text: t, options: { align: 'right', color: alerta ? C.redLight : C.light } });
  const meta = (t) => ({ text: t, options: { align: 'right', bold: true } });
  tabela(s, ['Indicador', 'Hoje', 'Meta em 30 dias'], [
    ['Carteira do sistema igual à planilha do GT', hoje('17 de 21'), meta('21 de 21')],
    ['Demandas com responsável geral', hoje('0 de 17'), meta('21 de 21')],
    ['Atividades abertas com responsável', hoje('1%'), meta('100%')],
    ['Justificativas da área recebidas', hoje('14 de 20', false), meta('20 de 20')],
    ['Divergências da planilha resolvidas', hoje('0 de 9'), meta('9 de 9')],
    ['Demandas além da Etapa I', hoje('0'), meta('ao menos 3')],
  ], [6.8, 2.4, 2.533], 1.95, 15, { dark: true });
  s.addText('Depois da carga autorizada, todos os indicadores saem do sistema: Painel, Relatórios e Minhas pendências.', { x: M, y: 6.25, w: CW, h: 0.4, fontFace: SANS, fontSize: 14, color: C.lightMuted, margin: 0, isTextBox: true });
  footer(s, N, F_AMBAS + ' · metas sugeridas', true);
  s.addNotes('Seis indicadores para o próximo report. O primeiro é novo: aderência entre a carteira do sistema e a planilha do GT (hoje 17 de 21, contando a Tela). As metas são sugestões para validação da coordenação.');
}

pres.writeFile({ fileName: path.join(__dirname, 'Status_Contratacoes_GT_PROPAG_v2.pptx') }).then((f) => console.log('ok', f, N, 'slides'));
