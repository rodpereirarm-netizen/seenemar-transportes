// Apresentação executiva · Situação das contratações de TI da FAETEC · posição de 25/09/2026
// Fonte única: planilha de andamento do GT de 25/09/2026 (dados.json, gerado por apurar.py). Nenhum outro dado é utilizado.
const path = require('path');
const assert = require('assert');
const pptxgen = require('pptxgenjs');
const D = require('./dados.json');
const IT = Object.fromEntries(D.itens.map((i) => [i.n, i]));

// ------------------------------------------------------------------ conferências contra a planilha
assert.strictEqual(D.total, 20);
assert.deepStrictEqual(D.dod['Elaborado'].length, 9);
assert.deepStrictEqual(D.ti.SIM, [1, 2, 3, 6, 10]);
assert.deepStrictEqual(D.sem_justificativa_drive, [11, 12, 13, 14, 15, 16, 17, 18, 19]);
assert.strictEqual(D.valor_total, 69681145.11);

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13,333 × 7,5 pol.
pres.title = 'Situação das contratações de TI da FAETEC';
pres.company = 'GT PROPAG · Compras Públicas';
pres.subject = 'Apresentação executiva · posição de 25/09/2026';

const C = {
  navy: '16284D', navy2: '1E3564', navyLine: '3A5184', gold: 'C8962F', goldInk: '8A5F0D', goldLight: 'E0B45A',
  paper: 'F5F2EB', card: 'FFFFFF', line: 'E2DCCF', ink: '1B2236', muted: '5F5A4E', body: '3E3A30',
  red: 'A8322A', redSoft: 'F8E1DD', blueSoft: 'E3E9F4', goldSoft: 'F6EACD', track: 'E7E2D7', greenSoft: 'E1EEE5', green: '2F6B4F',
  light: 'FBFAF6', lightMuted: 'CBD3E4', footDark: 'A9B4CD',
};
const SERIF = 'Cambria', SANS = 'Calibri';
const W = 13.333, M = 0.75, CW = W - 2 * M;
const FONTE = 'Fonte: Planilha de andamento do GT PROPAG · posição de 25/09/2026';
const brl = (v) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mi = (v) => 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' mi';
const nn = (n) => String(n).padStart(2, '0');
const lst = (a) => { const s = a.map(nn); return s.length > 1 ? s.slice(0, -1).join(', ') + ' e ' + s[s.length - 1] : s[0]; };

let N = 0;
function slide(bg = C.paper) { const s = pres.addSlide(); s.background = { color: bg }; N += 1; return s; }
function cabecalho(s, secao, titulo, dark = false) {
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: C.gold }, line: { color: C.gold } });
  s.addText(secao.toUpperCase(), { x: M, y: 0.5, w: CW, h: 0.3, fontFace: SANS, fontSize: 11.5, bold: true, charSpacing: 3, color: dark ? C.goldLight : C.goldInk, margin: 0, isTextBox: true });
  s.addText(titulo, { x: M, y: 0.82, w: CW, h: 0.72, fontFace: SERIF, fontSize: 32, bold: true, color: dark ? C.light : C.navy, margin: 0, valign: 'top', isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: M, y: 1.62, w: 1.1, h: 0, line: { color: C.gold, width: 2 } });
}
function rodape(s, dark = false) {
  s.addShape(pres.shapes.LINE, { x: M, y: 6.95, w: CW, h: 0, line: { color: dark ? C.navyLine : 'D9D2C3', width: 0.5 } });
  s.addText('GT PROPAG · Compras Públicas · ' + FONTE, { x: M, y: 7.02, w: 10.5, h: 0.28, fontFace: SANS, fontSize: 10, color: dark ? C.footDark : '6E6758', margin: 0, isTextBox: true });
  s.addText(String(N), { x: W - M - 1, y: 7.02, w: 1, h: 0.28, fontFace: SANS, fontSize: 10.5, bold: true, color: dark ? C.goldLight : C.navy, align: 'right', margin: 0, isTextBox: true });
}
const sombra = () => ({ type: 'outer', color: '16284D', opacity: 0.07, blur: 8, offset: 2, angle: 90 });
function cartao(s, x, y, w, h, fill = C.card, borda = C.line) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: borda, width: 0.75 }, shadow: sombra() });
}
function tabela(s, cab, linhas, larg, y, fs = 11, opt = {}) {
  const h = cab.map((t, i) => ({ text: t, options: { bold: true, color: C.light, fill: { color: C.navy }, align: (opt.alinh && opt.alinh[i]) || 'left', fontSize: fs - 0.5 } }));
  const rows = linhas.map((l, r) => l.map((c, i) => {
    const b = typeof c === 'string' ? { text: c, options: {} } : c;
    return { text: b.text, options: { fill: { color: r % 2 ? 'FAF8F3' : C.card }, color: C.ink, align: (opt.alinh && opt.alinh[i]) || 'left', ...b.options } };
  }));
  s.addTable([h, ...rows], { x: opt.x ?? M, y, w: opt.w ?? CW, colW: larg, fontFace: SANS, fontSize: fs, valign: 'middle', margin: opt.margem ?? [4, 7, 4, 7], border: { type: 'solid', pt: 0.5, color: C.line }, rowH: opt.rowH, autoPage: false });
}
// Célula de status com cor
const TOM = { pos: [C.greenSoft, C.green], and: [C.goldSoft, C.goldInk], neg: [C.redSoft, C.red], neu: [C.blueSoft, C.navy], vaz: [null, '8A8474'] };
const st = (t, tom) => ({ text: t, options: { bold: tom !== 'vaz', color: TOM[tom][1], ...(TOM[tom][0] ? { fill: { color: TOM[tom][0] } } : {}), align: 'center' } });

// ================================================================== 1 · Capa
{
  const s = slide(C.navy);
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.42, h: 7.5, fill: { color: C.gold }, line: { color: C.gold } });
  s.addText('GOVERNO DO ESTADO DO RIO DE JANEIRO', { x: 1.1, y: 0.7, w: 6.5, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.light, margin: 0, isTextBox: true });
  s.addText('GT PROPAG · COMPRAS PÚBLICAS', { x: W - 0.75 - 5.5, y: 0.7, w: 5.5, h: 0.3, fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.goldLight, align: 'right', margin: 0, isTextBox: true });
  s.addText('APRESENTAÇÃO EXECUTIVA', { x: 1.1, y: 2.05, w: 10, h: 0.35, fontFace: SANS, fontSize: 15, bold: true, charSpacing: 4, color: C.goldLight, margin: 0, isTextBox: true });
  s.addText('Situação das contratações\nde TI da FAETEC', { x: 1.1, y: 2.5, w: 11, h: 1.9, fontFace: SERIF, fontSize: 52, bold: true, color: C.light, margin: 0, valign: 'top', isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 1.1, y: 4.62, w: 1.6, h: 0, line: { color: C.gold, width: 2.5 } });
  s.addText('Carteira de 20 demandas acompanhadas pelo GT PROPAG: estágio da fase preparatória, atas de registro de preços indicadas, pendências e encaminhamentos.', { x: 1.1, y: 4.85, w: 10.2, h: 0.85, fontFace: SANS, fontSize: 18, color: C.lightMuted, margin: 0, valign: 'top', isTextBox: true });
  s.addText([{ text: 'Apresentação ao Subsecretário Executivo', options: { bold: true, color: C.light, breakLine: true } }, { text: 'Posição de 25/09/2026', options: { color: C.lightMuted } }],
    { x: 1.1, y: 6.25, w: 6.5, h: 0.65, fontFace: SANS, fontSize: 14, margin: 0, valign: 'bottom', isTextBox: true });
  s.addText([{ text: 'Fonte', options: { bold: true, color: C.light, breakLine: true } }, { text: 'Planilha de andamento do GT PROPAG, 25/09/2026', options: { color: C.lightMuted } }],
    { x: W - 0.75 - 5.5, y: 6.25, w: 5.5, h: 0.65, fontFace: SANS, fontSize: 13, align: 'right', margin: 0, valign: 'bottom', isTextBox: true });
  s.addNotes('Apresentação da situação das 20 demandas de contratação de tecnologia da informação da FAETEC acompanhadas pelo GT PROPAG. Todos os dados foram extraídos exclusivamente da planilha de andamento do GT com posição de 25/09/2026.');
}

// ================================================================== 2 · Sumário executivo
{
  const s = slide();
  cabecalho(s, 'Sumário executivo', 'As 20 demandas encontram-se na fase preparatória');
  const pct = Math.round(64818000 / D.valor_total * 100);
  const itens = [
    ['9 de 20', 'DODs elaborados', `Outros 4 estão em elaboração e 7 em análise. A manifestação favorável da área de TI consta em 5 demandas (itens ${lst(D.ti.SIM)}).`],
    ['10 de 20', 'com ata de registro de preços indicada', `8 com status “SIM” e 2 com status “PARTICIPE”. O item 05 registra dispensa (art. 75 da Lei 14.133) e 8 demandas aguardam nova pesquisa de atas.`],
    ['9 de 20', 'sem justificativa no drive', `Itens 11 a 19. Outras 2 demandas (itens 04 e 05) foram devolvidas à área técnica para análise do quantitativo e dos itens.`],
    ['3 de 20', 'com valor estimado', `Total de ${mi(D.valor_total)}, dos quais ${pct}% correspondem à aquisição de Chromebooks (item 01). As demais 17 demandas não possuem valor registrado.`],
  ];
  const cw = (CW - 0.35) / 2, ch = 2.2;
  itens.forEach(([num, rot, txt], i) => {
    const x = M + (i % 2) * (cw + 0.35), y = 1.95 + Math.floor(i / 2) * (ch + 0.3);
    cartao(s, x, y, cw, ch);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.07, h: ch, fill: { color: i === 2 ? C.red : C.gold }, line: { color: i === 2 ? C.red : C.gold } });
    s.addText(num, { x: x + 0.35, y: y + 0.22, w: 2.4, h: 0.75, fontFace: SERIF, fontSize: 36, bold: true, color: i === 2 ? C.red : C.navy, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(rot, { x: x + 2.75, y: y + 0.22, w: cw - 3.0, h: 0.75, fontFace: SANS, fontSize: 17, bold: true, color: C.ink, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(txt, { x: x + 0.35, y: y + 1.07, w: cw - 0.65, h: 0.98, fontFace: SANS, fontSize: 14, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  });
  rodape(s);
  s.addNotes('Síntese da carteira. Todas as demandas estão na fase preparatória. Nove possuem DOD elaborado e dez têm ata de registro de preços indicada, por adesão ou participação. Nove demandas não possuem justificativa no drive, o que condiciona a continuidade da instrução. O valor estimado está registrado em apenas três demandas, que somam R$ 69,68 milhões.');
}

// ================================================================== 3 · Panorama
{
  const s = slide();
  cabecalho(s, 'Panorama da carteira', 'Situação das 20 demandas por marco da fase preparatória');
  const linhas = [
    ['DOD', [['Elaborado', 9, C.navy, 'FFFFFF'], ['Em elaboração', 4, C.gold, C.navy], ['Em análise', 7, C.goldSoft, C.goldInk]]],
    ['Ata de registro de preços', [['SIM', 8, C.navy, 'FFFFFF'], ['PARTICIPE', 2, C.navyLine, 'FFFFFF'], ['NÃO', 3, C.redSoft, C.red], ['Não preenchido', 7, C.track, C.muted]]],
    ['Manifestação do TI', [['SIM', 5, C.navy, 'FFFFFF'], ['NÃO', 15, C.redSoft, C.red]]],
    ['Documentos da fase preparatória', [['Com registro', 8, C.navy, 'FFFFFF'], ['Sem registro', 12, C.track, C.muted]]],
    ['Processo SEI novo', [['Informado', 17, C.navy, 'FFFFFF'], ['Não informado', 3, C.redSoft, C.red]]],
    ['Valor estimado', [['Informado', 3, C.navy, 'FFFFFF'], ['Não informado', 17, C.track, C.muted]]],
  ];
  // conferência: cada linha soma 20 e corresponde à apuração
  linhas.forEach(([, seg]) => assert.strictEqual(seg.reduce((a, b) => a + b[1], 0), 20));
  assert.strictEqual(D.ata['Não preenchido'].length, 7); assert.strictEqual(D.docs_registrado.length, 8); assert.strictEqual(D.sei_nao_informado.length, 3);
  const xl = M, wl = 3.1, xb = M + 3.25, wb = CW - 3.25, rh = 0.56, gap = 0.2;
  linhas.forEach(([rot, seg], i) => {
    const y = 2.0 + i * (rh + gap);
    s.addText(rot, { x: xl, y, w: wl, h: rh, fontFace: SANS, fontSize: 14, bold: true, color: C.ink, margin: 0, valign: 'middle', isTextBox: true });
    let x = xb;
    seg.forEach(([nome, v, fill, cor]) => {
      const w = wb * v / 20;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: w - 0.03, h: rh, fill: { color: fill }, line: { color: fill } });
      s.addText(w > 1.25 ? `${nome} · ${v}` : String(v), { x, y, w: w - 0.03, h: rh, fontFace: SANS, fontSize: 12, bold: true, color: cor, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
      x += w;
    });
  });
  s.addText('Legenda da linha “Ata”: PARTICIPE = FAETEC participante do registro de preços. Segmentos estreitos: “Ata · NÃO” (3) e “PARTICIPE” (2).', { x: M, y: 6.55, w: CW, h: 0.3, fontFace: SANS, fontSize: 11, color: C.muted, margin: 0, isTextBox: true });
  rodape(s);
  s.addNotes('Distribuição das 20 demandas por marco registrado na planilha. Cada barra soma 20. No campo de ata, “Não preenchido” indica que o status não foi informado; no item 01, apesar do status em branco, a observação cita a ARP 032/2026 da SEAD/MA.');
}

// ================================================================== 4–5 · Quadro de situação
const ATA = {
  1: ['Não preenchido', 'vaz', 'obs.: ARP 032/2026 SEAD/MA'], 2: ['SIM', 'pos', 'ARP 1477/2024 CELIC/RS'], 3: ['PARTICIPE', 'neu', 'PE-RP 012/2024'], 4: ['NÃO', 'neg', ''],
  5: ['NÃO', 'neg', 'Dispensa art. 75'], 6: ['PARTICIPE', 'neu', 'PERP 12/25 Microsoft'], 7: ['SIM', 'pos', 'ARP 02/2026 TJMA'], 8: ['NÃO', 'neg', ''],
  9: ['Não preenchido', 'vaz', ''], 10: ['SIM', 'pos', 'PE-RP 016/2024 PRODERJ'], 11: ['Não preenchido', 'vaz', ''], 12: ['SIM', 'pos', 'ARP 103/2025 TR/RN'],
  13: ['SIM', 'pos', 'ARP 167/2025 SEPLAG/MG'], 14: ['SIM', 'pos', 'ARP 167/2025 SEPLAG/MG'], 15: ['Não preenchido', 'vaz', ''], 16: ['Não preenchido', 'vaz', ''],
  17: ['Não preenchido', 'vaz', ''], 18: ['SIM', 'pos', 'ARP 40/2026 SPLAG/MG'], 19: ['SIM', 'pos', 'ARP 008/2024 PRODERJ'], 20: ['Não preenchido', 'vaz', ''],
};
for (const [n, [status]] of Object.entries(ATA)) assert.strictEqual(status === 'Não preenchido' ? '' : status, IT[n].ata, `ata ${n}`);
const DODT = { 'Elaborado': 'pos', 'Em Elaboração': 'and', 'EM ANÁLISE': 'and' };
const DODR = { 'Elaborado': 'Elaborado', 'Em Elaboração': 'Em elaboração', 'EM ANÁLISE': 'Em análise' };
function quadro(de, ate, titulo) {
  const s = slide();
  cabecalho(s, 'Quadro de situação', titulo);
  const linhas = [];
  for (let n = de; n <= ate; n++) {
    const i = IT[n], a = ATA[n];
    linhas.push([
      { text: nn(n), options: { bold: true, color: C.goldInk, align: 'center' } },
      { text: i.curto, options: { bold: true } },
      { text: i.sei_novo.startsWith('SEI-') ? i.sei_novo : 'Não informado', options: { color: i.sei_novo.startsWith('SEI-') ? C.ink : C.red, fontSize: 10.5 } },
      st(DODR[i.dod], DODT[i.dod]),
      { text: [{ text: a[0], options: { bold: a[1] !== 'vaz', color: TOM[a[1]][1] } }, ...(a[2] ? [{ text: '  ' + a[2], options: { color: C.muted, fontSize: 10 } }] : [])] },
      st(i.ti, i.ti === 'SIM' ? 'pos' : 'neg'),
      { text: i.valor ? mi(i.valor) : '—', options: { align: 'right', bold: !!i.valor, color: i.valor ? C.navy : '8A8474' } },
    ]);
  }
  tabela(s, ['Nº', 'Objeto', 'Processo SEI', 'DOD', 'Ata de registro de preços', 'TI', 'Valor'], linhas, [0.5, 2.95, 2.3, 1.3, 2.95, 0.65, 1.083], 1.9, 11.5,
    { alinh: ['center', 'left', 'left', 'center', 'left', 'center', 'right'], rowH: 0.43 });
  rodape(s);
  return s;
}
quadro(1, 10, 'Demandas 01 a 10').addNotes('Situação registrada na planilha para as demandas 01 a 10. Na coluna TI, “SIM” corresponde à manifestação favorável (“De Acordo”) registrada na planilha. No item 06, a observação do TI registra “aguardando análise e remanejamento do quantitativo pelo PRODERJ”.');
quadro(11, 20, 'Demandas 11 a 20').addNotes('Situação registrada na planilha para as demandas 11 a 20. Nenhuma delas possui valor estimado nem manifestação do TI. Os itens 14, 18 e 20 não têm processo SEI informado.');

// ================================================================== 6 · Atas
{
  const s = slide();
  cabecalho(s, 'Atas de registro de preços', '10 demandas com ata indicada; 8 aguardam nova pesquisa');
  const b = (t) => ({ text: t, options: { bold: true } });
  const ref = (n) => ({ text: nn(n), options: { bold: true, color: C.goldInk, align: 'center' } });
  tabela(s, ['Nº', 'Objeto', 'Status', 'Ata indicada (campo “observação” da ata)', 'Registro no DOD'], [
    [ref(2), b(IT[2].curto), st('SIM', 'pos'), 'Ata de Registro de Preços – CELIC/RS – ARP 1477/2024', 'ARP nº 147/2024 – CELIC/RS'],
    [ref(7), b(IT[7].curto), st('SIM', 'pos'), 'Adesão – ARP 02/2026 TJMA', 'Adesão – ARP 02/2026 TJMA'],
    [ref(10), b(IT[10].curto), st('SIM', 'pos'), 'Adesão – PE-RP nº 016/2024 PRODERJ', 'Adesão – PE-RP nº 016/2024 PRODERJ'],
    [ref(12), b(IT[12].curto), st('SIM', 'pos'), 'Adesão – ARP nº 103/2025 – TR/RN', 'Adesão – ARP 103/2025 TR-RN'],
    [ref(13), b(IT[13].curto), st('SIM', 'pos'), 'ARP nº 167/2025 – SEPLAG/MG', 'Adesão – ARP 167/2025 SEPLAG-MG'],
    [ref(14), b(IT[14].curto), st('SIM', 'pos'), 'ARP nº 167/2025 – SEPLAG/MG', 'Adesão – ARP 167/2025 SEPLAG-MG'],
    [ref(18), b(IT[18].curto), st('SIM', 'pos'), 'ARP nº 40/2026 – I – SPLAG/MG', 'ARP nº 40/2026 – SEPLAG/RS'],
    [ref(19), b(IT[19].curto), st('SIM', 'pos'), 'Adesão – ARP nº 008/2024 PRODERJ', 'Adesão – ARP nº 008/2024 PRODERJ'],
    [ref(3), b(IT[3].curto), st('PARTICIPE', 'neu'), 'Registro de Preços – PE-RP nº 012/2024', 'Participação – PE-RP nº 012/2024'],
    [ref(6), b(IT[6].curto), st('PARTICIPE', 'neu'), 'PERP 12/25 – Microsoft', 'Participação no PERP 12/25 – Microsoft'],
  ], [0.5, 3.0, 1.2, 3.75, 3.283], 1.85, 11, { alinh: ['center', 'left', 'center', 'left', 'left'], rowH: 0.36 });
  s.addText([
    { text: 'Demais registros: ', options: { bold: true, color: C.navy } },
    { text: `item 01 com status em branco e observação que cita a ARP 032/2026 SEAD/MA; item 05 com dispensa (art. 75 da Lei 14.133); itens ${lst(D.nova_pesquisa_atas)} com a anotação “Será realizada nova pesquisa de Atas”.` },
  ], { x: M, y: 6.1, w: CW, h: 0.65, fontFace: SANS, fontSize: 12.5, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  rodape(s);
  s.addNotes('Relação das atas indicadas na planilha, com a transcrição do campo de observação da ata e do registro no DOD. Os itens 13 e 14 indicam a mesma ata (ARP 167/2025 – SEPLAG/MG). Nos itens 02 e 18, os registros do DOD e da ata diferem, conforme detalhado nos pontos de atenção.');
}

// ================================================================== 7 · Valor estimado
{
  const s = slide();
  cabecalho(s, 'Valor estimado', 'Valor registrado em 3 das 20 demandas');
  const v = [[1, 64818000], [10, 3559045.11], [2, 1304100]];
  v.forEach(([n, val]) => assert.strictEqual(IT[n].valor, val));
  // barras desenhadas (rótulos no padrão brasileiro, independentes da configuração regional)
  const bx = M + 3.7, bw = 3.2, vmax = 64818000;
  v.forEach(([n, val], k) => {
    const y = 2.2 + k * 1.1, w = Math.max(0.04, bw * val / vmax);
    s.addText(`${nn(n)} · ${IT[n].curto}`, { x: M, y, w: 3.55, h: 0.6, fontFace: SANS, fontSize: 13.5, bold: true, color: C.ink, align: 'right', valign: 'middle', margin: 0, isTextBox: true });
    s.addShape(pres.shapes.RECTANGLE, { x: bx, y: y + 0.05, w, h: 0.5, fill: { color: C.navy }, line: { color: C.navy } });
    s.addText(mi(val), { x: bx + w + 0.12, y, w: 1.6, h: 0.6, fontFace: SANS, fontSize: 13.5, bold: true, color: C.navy, valign: 'middle', margin: 0, isTextBox: true });
  });
  s.addShape(pres.shapes.LINE, { x: bx, y: 2.1, w: 0, h: 3.2, line: { color: 'CFC7B6', width: 0.75 } });
  cartao(s, 9.0, 1.95, CW - 8.25, 3.5);
  s.addText('Valor total registrado', { x: 9.3, y: 2.15, w: 3.2, h: 0.35, fontFace: SANS, fontSize: 13, bold: true, color: C.muted, margin: 0, isTextBox: true });
  s.addText(mi(D.valor_total), { x: 9.3, y: 2.5, w: 3.3, h: 0.8, fontFace: SERIF, fontSize: 34, bold: true, color: C.navy, margin: 0, valign: 'middle', isTextBox: true });
  s.addText(brl(D.valor_total), { x: 9.3, y: 3.3, w: 3.3, h: 0.3, fontFace: SANS, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 9.3, y: 3.8, w: 3.0, h: 0, line: { color: C.line, width: 0.75 } });
  s.addText([{ text: '17', options: { fontFace: SERIF, fontSize: 30, bold: true, color: C.red } }, { text: '  demandas sem valor estimado', options: { fontSize: 13, bold: true, color: C.ink } }],
    { x: 9.3, y: 3.95, w: 3.3, h: 0.6, fontFace: SANS, margin: 0, valign: 'middle', isTextBox: true });
  s.addText('Itens 03 a 09 e 11 a 20.', { x: 9.3, y: 4.6, w: 3.3, h: 0.4, fontFace: SANS, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  const p = (x) => Math.round(x / D.valor_total * 1000) / 10;
  s.addText(`Participação no valor registrado: Chromebooks ${p(64818000).toLocaleString('pt-BR')}% · Appliances para backup ${p(3559045.11).toLocaleString('pt-BR')}% · Softwares de edição e arquitetura ${p(1304100).toLocaleString('pt-BR')}%. Sem a estimativa das demais demandas, não é possível dimensionar o valor total da carteira.`,
    { x: M, y: 5.75, w: CW, h: 0.85, fontFace: SANS, fontSize: 14, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  rodape(s);
  s.addNotes('Valores globais registrados na planilha: Chromebooks R$ 64.818.000,00; Appliances para backup R$ 3.559.045,11; Softwares de edição e arquitetura R$ 1.304.100,00. Total de R$ 69.681.145,11. As demais 17 demandas não possuem valor estimado registrado.');
}

// ================================================================== 8 · Justificativas e andamento
{
  const s = slide();
  cabecalho(s, 'Justificativas e andamento', 'Situação das justificativas das áreas demandantes');
  const grupos = [
    ['Encaminhadas para análise', D.enviado_luene, C.navy, 'Observação: “Enviado para análise – Luene”.'],
    ['Registradas como recebidas', [...D.recebido_18_10, ...D.recebido_23_09], C.navyLine, 'Itens 07, 08 e 10: “Recebido 18/10”. Item 20: “Recebido 23/09”.'],
    ['Em revisão', [2], C.gold, 'Retornou ao GT com observações; necessária atualização da justificativa por divergência de quantidade.'],
    ['Devolvidas à área técnica', D.devolvido_area_tecnica, 'D08A3E', 'Análise do quantitativo e dos itens; “justificativa carece de elementos da pretensa contratação”.'],
    ['Sem justificativa no drive', D.sem_justificativa_drive, C.red, 'Registro na coluna de observação.'],
    ['Sem registro', [9], 'B9B2A3', 'Nenhuma anotação de andamento ou observação.'],
  ];
  assert.strictEqual(grupos.reduce((a, g) => a + g[1].length, 0), 20);
  const y0 = 1.95, rh = 0.74;
  grupos.forEach(([t, itens, cor, obs], i) => {
    const y = y0 + i * rh;
    s.addShape(pres.shapes.RECTANGLE, { x: M, y: y + 0.08, w: 0.9, h: rh - 0.16, fill: { color: cor }, line: { color: cor } });
    s.addText(String(itens.length), { x: M, y: y + 0.08, w: 0.9, h: rh - 0.16, fontFace: SERIF, fontSize: 24, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText(t, { x: M + 1.1, y, w: 3.4, h: rh, fontFace: SANS, fontSize: 15, bold: true, color: C.ink, margin: 0, valign: 'middle', isTextBox: true });
    s.addText('Itens ' + lst(itens), { x: M + 4.5, y, w: 2.6, h: rh, fontFace: SANS, fontSize: 13, bold: true, color: C.navy, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(obs, { x: M + 7.1, y, w: CW - 7.1, h: rh, fontFace: SANS, fontSize: 12, color: C.body, margin: 0, valign: 'middle', isTextBox: true });
    if (i < grupos.length - 1) s.addShape(pres.shapes.LINE, { x: M, y: y + rh, w: CW, h: 0, line: { color: 'E4DED1', width: 0.5 } });
  });
  rodape(s);
  s.addNotes('Agrupamento das 20 demandas conforme as colunas “Último andamento” e “Observação” da planilha. Cada demanda aparece em um único grupo. O grupo mais numeroso é o das nove demandas sem justificativa no drive, itens 11 a 19.');
}

// ================================================================== 9 · Maior maturidade
{
  const s = slide();
  cabecalho(s, 'Demandas em estágio mais avançado', 'DOD elaborado e manifestação favorável do TI');
  const b = (t, sub) => ({ text: [{ text: t, options: { bold: true, breakLine: true } }, { text: sub, options: { color: C.muted, fontSize: 10.5 } }] });
  const v = (n) => ({ text: IT[n].valor ? mi(IT[n].valor) : '—', options: { align: 'right', bold: !!IT[n].valor, color: IT[n].valor ? C.navy : '8A8474' } });
  const lin = [
    [b('01 · Chromebooks', 'Ata: ARP 032/2026 SEAD/MA (observação)'), v(1), 'Documentos da fase preparatória elaborados', 'Enviado para análise – Luene'],
    [b('02 · Softwares de edição e arquitetura', 'Ata: ARP CELIC/RS'), v(2), 'Documentos da fase preparatória elaborados', 'Retornou ao GT com observações; atualização da justificativa por divergência de quantidade'],
    [b('03 · Telefonia VoIP', 'Partícipe: PE-RP nº 012/2024'), v(3), 'Utilização do ETP do PRODERJ', 'Enviado para análise – Luene'],
    [b('06 · Licenciamento Microsoft', 'Partícipe: PERP 12/25'), v(6), 'Utilização do ETP do PRODERJ', 'TI: aguardando análise e remanejamento do quantitativo pelo PRODERJ; enviado para análise – Luene'],
    [b('10 · Appliances para backup', 'Ata: PE-RP nº 016/2024 PRODERJ'), v(10), 'ETP elaborado; TR em elaboração', 'DOD elaborado com base na justificativa da área técnica'],
  ];
  D.ti.SIM.forEach((n) => assert.strictEqual(IT[n].dod, 'Elaborado'));
  tabela(s, ['Demanda', 'Valor', 'Documentos da fase preparatória', 'Último registro'], lin, [3.6, 1.45, 2.9, 3.783], 1.9, 11.5, { alinh: ['left', 'right', 'left', 'left'], rowH: 0.7 });
  s.addText([{ text: 'Critério: ', options: { bold: true, color: C.navy } }, { text: 'DOD com status “Elaborado” e manifestação do TI com status “SIM”. As cinco demandas incluem as três com valor estimado (itens 01, 02 e 10).' }],
    { x: M, y: 6.42, w: CW, h: 0.4, fontFace: SANS, fontSize: 13, color: C.body, margin: 0, isTextBox: true });
  assert.ok(D.com_valor.every((n) => D.ti.SIM.includes(n)));
  rodape(s);
  s.addNotes('Demandas que reúnem DOD elaborado e manifestação favorável da área de TI, segundo a planilha. Três delas (01, 03 e 06) aguardam a análise encaminhada; o item 02 retornou ao GT para atualização da justificativa; o item 10 está com o TR em elaboração.');
}

// ================================================================== 10 · Pontos de atenção
{
  const s = slide();
  cabecalho(s, 'Pontos de atenção', 'Registros da planilha que requerem conferência');
  const b = (t) => ({ text: t, options: { bold: true } });
  const ref = (t) => ({ text: t, options: { bold: true, color: C.goldInk } });
  tabela(s, ['Ponto', 'Itens', 'Registro na planilha'], [
    [b('Número da ata divergente'), ref('02'), 'DOD: “ARP nº 147/2024 – CELIC/RS”. Campo da ata: “ARP 1477/2024”.'],
    [b('Órgão gerenciador divergente'), ref('18'), 'DOD: “ARP nº 40/2026 – SEPLAG/RS”. Campo da ata: “Nº 40/2026 – I – SPLAG/MG”.'],
    [b('Status da ata não preenchido'), ref('01'), 'Status em branco; a observação cita a ARP 032/2026 SEAD/MA.'],
    [b('DOD elaborado sem justificativa no drive'), ref('12 e 18'), 'Status do DOD “Elaborado” e observação “Sem justificativa no drive”.'],
    [b('Processo SEI com ano diferente de 2026'), ref('15, 16 e 17'), 'SEI-260005/009053/2028 · SEI-260005/009054/2029 · SEI-260005/008717/2025.'],
    [b('Processo SEI não informado'), ref('14, 18 e 20'), '“Não há processo informado”.'],
    [b('Data de recebimento posterior à posição'), ref('07, 08 e 10'), 'Registro “Recebido 18/10” em planilha com posição de 25/09/2026.'],
  ], [3.6, 1.35, 6.783], 1.9, 12.5, { rowH: 0.5 });
  D.sei_ano_diferente.forEach(([n, sei]) => assert.ok(['SEI-260005/009053/2028', 'SEI-260005/009054/2029', 'SEI-260005/008717/2025'].includes(sei), n));
  assert.ok(IT[2].dod_obs.includes('147/2024') && IT[2].ata_obs.includes('1477/2024'));
  assert.ok(IT[18].dod_obs.includes('SEPLAG/RS') && IT[18].ata_obs.includes('SPLAG/MG'));
  rodape(s);
  s.addNotes('Registros que apresentam divergência interna ou informação incompleta na própria planilha. Recomenda-se a conferência com os processos correspondentes antes da consolidação dos dados.');
}

// ================================================================== 11 · Encaminhamentos
{
  const s = slide();
  cabecalho(s, 'Encaminhamentos propostos', 'Providências para o avanço da carteira');
  const acoes = [
    ['Justificativas', `Obter as justificativas das 9 demandas sem registro no drive (itens 11 a 19).`],
    ['Análises em curso', `Concluir a análise das demandas encaminhadas (itens 01, 03 e 06) e o reexame das demandas 02, 04 e 05.`],
    ['Manifestação do TI', `Obter a manifestação do TI nas demandas com ata indicada e status “NÃO” (itens 07, 12, 13, 14, 18 e 19).`],
    ['Pesquisa de atas', `Concluir a nova pesquisa de atas registrada para 8 demandas (itens ${lst(D.nova_pesquisa_atas)}).`],
    ['Adesões em tratativa', 'Item 12: anuência do órgão gerenciador por meio do Compras.gov. Item 18: retorno da empresa quanto ao saldo da ata.'],
    ['Saneamento dos registros', 'Conferir os pontos de atenção e registrar o valor estimado das 17 demandas sem valor.'],
  ];
  const ataSemTI = D.ata.SIM.filter((n) => IT[n].ti === 'NÃO');
  assert.deepStrictEqual(ataSemTI, [7, 12, 13, 14, 18, 19]);
  const aw = (CW - 2 * 0.3) / 3, ah = 2.15;
  acoes.forEach(([t, d], i) => {
    const x = M + (i % 3) * (aw + 0.3), y = 1.95 + Math.floor(i / 3) * (ah + 0.3);
    cartao(s, x, y, aw, ah);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: aw, h: 0.07, fill: { color: C.gold }, line: { color: C.gold } });
    s.addText(nn(i + 1), { x: x + 0.3, y: y + 0.25, w: 0.8, h: 0.5, fontFace: SERIF, fontSize: 24, bold: true, color: C.gold, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(t, { x: x + 1.05, y: y + 0.25, w: aw - 1.3, h: 0.5, fontFace: SANS, fontSize: 15, bold: true, color: C.navy, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(d, { x: x + 0.3, y: y + 0.9, w: aw - 0.6, h: 1.1, fontFace: SANS, fontSize: 13, color: C.body, margin: 0, valign: 'top', isTextBox: true });
  });
  rodape(s);
  s.addNotes('Encaminhamentos derivados diretamente dos registros da planilha. As tratativas dos itens 12 e 18 transcrevem as anotações existentes: no item 12, a anuência do órgão deve ser obtida pelo Compras.gov; no item 18, aguarda-se o retorno da empresa quanto à disponibilidade de saldo, e o órgão gerenciador informou que o processo deverá observar os procedimentos previstos na legislação vigente.');
}

// ================================================================== 12 · Considerações finais
{
  const s = slide(C.navy);
  cabecalho(s, 'Considerações finais', 'Síntese para deliberação', true);
  const pts = [
    ['Estágio da carteira', 'As 20 demandas encontram-se na fase preparatória. Nove possuem DOD elaborado e cinco contam com manifestação favorável do TI.'],
    ['Principal pendência', 'Nove demandas (itens 11 a 19) não possuem justificativa no drive, o que condiciona a continuidade da instrução.'],
    ['Vias de contratação', 'Dez demandas têm ata de registro de preços indicada (oito com status “SIM” e duas com status “PARTICIPE”); uma registra dispensa; oito aguardam nova pesquisa de atas.'],
    ['Dimensionamento', `O valor estimado está registrado em três demandas, totalizando ${mi(D.valor_total)}. As demais 17 ainda não possuem estimativa.`],
  ];
  pts.forEach(([t, d], i) => {
    const y = 2.0 + i * 1.12;
    s.addText(nn(i + 1), { x: M, y, w: 0.9, h: 0.9, fontFace: SERIF, fontSize: 30, bold: true, color: C.goldLight, margin: 0, valign: 'top', isTextBox: true });
    s.addText([{ text: t, options: { bold: true, color: C.light, fontSize: 17, breakLine: true } }, { text: d, options: { color: C.lightMuted, fontSize: 14.5 } }],
      { x: M + 1.0, y, w: CW - 1.0, h: 1.0, fontFace: SANS, margin: 0, valign: 'top', isTextBox: true });
  });
  rodape(s, true);
  s.addNotes('Síntese final para deliberação do Subsecretário Executivo, com base exclusiva na planilha de andamento do GT de 25/09/2026.');
}

pres.writeFile({ fileName: path.join(__dirname, 'Situacao_Contratacoes_TI_FAETEC_25-09-2026.pptx') }).then((f) => console.log('ok', f, N, 'slides'));
