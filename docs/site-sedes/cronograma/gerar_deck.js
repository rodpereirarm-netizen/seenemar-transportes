// Cronograma (Gantt) e esforço em HH do rebranding do site institucional da SEDES
const path = require('path');
const pptxgen = require('pptxgenjs');
const { applyTheme } = require(process.argv[3] + '/scripts/apply_theme.js');
const OUT = process.argv[2];
const LOGO = path.join(__dirname, 'brasao.png');

const THEME = {
  name: 'SEDES RJ',
  headFontFace: 'Arial', bodyFontFace: 'Arial',
  colors: {
    dk1: '1F2A3D', lt1: 'FFFFFF', dk2: '0A2252', lt2: 'EEF5FD',
    accent1: '1E88E5', accent2: '159FB5', accent3: '5CC3F7', accent4: 'F07C12', accent5: '2EA44F', accent6: '7A8AA6',
    hlink: '1673D1', folHlink: '0A2252',
  },
};
const HEX = THEME.colors;
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Rebranding do site institucional da SEDES: cronograma e esforço';
pres.author = 'SEDES RJ';
pres.company = 'Governo do Estado do Rio de Janeiro';
const C = pres.SchemeColor;
const RESP = { SEDES: C.accent1, PRODERJ: C.accent2, Conjunta: C.text2 };
const MUTED = '5B6B84';

// ---------- layouts ----------
pres.defineSlideMaster({
  title: 'CAPA', background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.35, w: 8.6, h: 1.9, fontSize: 40, bold: true, color: C.background1, valign: 'top', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 4.35, w: 8.6, h: 1.0, fontSize: 18, color: C.accent3, valign: 'top', align: 'left', margin: 0 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'CONTEUDO', background: { color: HEX.lt1 },
  margin: [0.5, 0.6, 0.75, 0.6],
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 10.4, h: 0.75, fontSize: 30, bold: true, color: C.text2, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { image: { path: LOGO, x: 11.25, y: 0.38, w: 1.5, h: 0.53, altText: 'Governo do Estado do Rio de Janeiro' } },
    { text: { text: 'Rebranding do site institucional · SEDES + PRODERJ', options: { x: 0.6, y: 7.05, w: 8, h: 0.3, fontSize: 10, color: MUTED, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.05, w: 0.55, h: 0.3, fontSize: 10, color: MUTED, align: 'right' },
});
pres.defineSlideMaster({
  title: 'FINAL', background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.45, w: 10.4, h: 0.8, fontSize: 32, bold: true, color: C.background1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Rebranding do site institucional · SEDES + PRODERJ', options: { x: 0.6, y: 7.05, w: 8, h: 0.3, fontSize: 10, color: C.accent3, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.05, w: 0.55, h: 0.3, fontSize: 10, color: C.accent3, align: 'right' },
});

// ---------- dados ----------
const D = (s) => { const [d, m, y] = s.split('/').map(Number); return Date.UTC(y, m - 1, d); };
const DAY = 86400000;
// [código, atividade, responsável, início, fim, HH SEDES, HH PRODERJ, perfis]
const FASES = [
  { n: 'Fase 1 · Abertura e proposta técnica', curta: 'Abertura e proposta técnica', a: [
    ['1.1', 'Abertura do SEI com fundamentação e documentação técnica', 'SEDES', '01/12/2026', '03/12/2026', 24, 0, 'Pontos focais SEDES'],
    ['1.2', 'Levantamento de requisitos (workshops)', 'Conjunta', '04/12/2026', '09/12/2026', 30, 48, 'Equipe técnica PRODERJ + pontos focais'],
    ['1.3', 'Elaboração do TAP e da proposta técnica', 'PRODERJ', '10/12/2026', '15/12/2026', 8, 48, 'GP + analista PRODERJ'],
  ]},
  { n: 'Fase 2 · Contratação', curta: 'Contratação', a: [
    ['2.1', 'Proposta comercial e minuta de contrato', 'PRODERJ', '16/12/2026', '22/12/2026', 0, 24, 'Contratos PRODERJ'],
    ['2.2', 'Análise, aprovação e assinatura no SEI-RJ', 'SEDES', '23/12/2026', '15/01/2027', 32, 8, 'Jurídico, orçamento, gabinete'],
  ]},
  { n: 'Fase 3 · Projeto e documentação técnica', curta: 'Projeto e documentação', a: [
    ['3.1', 'Kickoff e validação da Maquete 2', 'Conjunta', '18/01/2027', '22/01/2027', 16, 32, 'GP, UX, ASCOM'],
    ['3.2', 'Adequação ao Manual de Identidade e ao padrão Portal Único; protótipo final', 'PRODERJ', '25/01/2027', '05/02/2027', 24, 140, 'UX/UI PRODERJ; validação ASCOM'],
    ['3.3', 'Mapa do site, arquitetura da informação e plano de redirecionamentos 301', 'Conjunta', '25/01/2027', '05/02/2027', 24, 40, 'Analista PRODERJ, ASCOM'],
    ['3.4', 'Coleta e validação de conteúdo (77 campos)', 'SEDES', '18/01/2027', '12/02/2027', 232, 0, 'ASCOM, subsecretarias, dados'],
    ['3.5', 'Aviso de privacidade, termos de uso e política de cookies (LGPD)', 'SEDES', '01/02/2027', '26/02/2027', 40, 16, 'Encarregado LGPD, jurídico'],
  ]},
  { n: 'Fase 4 · Construção', curta: 'Construção', a: [
    ['4.1', 'Desenvolvimento front-end e CMS', 'PRODERJ', '10/02/2027', '23/03/2027', 0, 420, 'Desenvolvedores PRODERJ'],
    ['4.2', 'Integrações (mapa, Desenvolve RJ, vídeos) e liberação no firewall', 'PRODERJ', '03/03/2027', '23/03/2027', 24, 170, 'Desenvolvedores, infraestrutura'],
    ['4.3', 'Domínio *.rj.gov.br: formulário e termo (se aplicável)', 'Conjunta', '01/03/2027', '12/03/2027', 8, 8, 'TI SEDES, infraestrutura'],
    ['4.4', 'Carga de conteúdo no CMS', 'Conjunta', '15/03/2027', '26/03/2027', 40, 60, 'ASCOM, PRODERJ'],
  ]},
  { n: 'Fase 5 · Qualidade, homologação e publicação', curta: 'Homologação e publicação', a: [
    ['5.1', 'Testes funcionais e de segurança', 'PRODERJ', '24/03/2027', '06/04/2027', 0, 80, 'QA, segurança'],
    ['5.2', 'Checklist e relatório de acessibilidade (e-MAG / WCAG)', 'Conjunta', '24/03/2027', '06/04/2027', 16, 48, 'QA PRODERJ, ASCOM'],
    ['5.3', 'Homologação SEDES (ASCOM e TI) e aprovação no SEI', 'SEDES', '05/04/2027', '09/04/2027', 32, 8, 'ASCOM, TI, gabinete'],
    ['5.4', 'Formulário de migração para produção, publicação e treinamento', 'Conjunta', '12/04/2027', '16/04/2027', 20, 40, 'Infraestrutura, editores'],
    ['5.5', 'Operação assistida', 'PRODERJ', '19/04/2027', '14/05/2027', 20, 40, 'Sustentação PRODERJ'],
  ]},
];
const GESTAO = ['G', 'Gestão do projeto (contínua)', 'Conjunta', '01/12/2026', '14/05/2027', 48, 96, 'GP PRODERJ + ponto focal SEDES'];
const ALL = FASES.flatMap(f => f.a).concat([GESTAO]);
const sum = (arr, i) => arr.reduce((a, r) => a + r[i], 0);
const TOT_S = sum(ALL, 5), TOT_P = sum(ALL, 6), TOT = TOT_S + TOT_P;
const fmt = (n) => n.toLocaleString('pt-BR');
const faseIni = (f) => Math.min(...f.a.map(r => D(r[3]))), faseFim = (f) => Math.max(...f.a.map(r => D(r[4])));
const ddmm = (t) => { const d = new Date(t); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0'); };

const MARCOS = [
  ['01/12/2026', 'SEI aberto'], ['15/12/2026', 'Proposta técnica e TAP'], ['22/12/2026', 'Proposta comercial e minuta'],
  ['15/01/2027', 'Contrato assinado'], ['05/02/2027', 'Protótipo final e mapa do site'], ['09/04/2027', 'Homologação aprovada'],
  ['16/04/2027', 'Lançamento do site'], ['14/05/2027', 'Encerramento'],
];

// ---------- helpers ----------
const tb = (slide, text, o) => slide.addText(text, { isTextBox: true, margin: 0, fontSize: 14, color: C.text1, valign: 'top', ...o });
function circleNum(slide, x, y, n, fill, size = 0.5) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: size, h: size, fill: { color: fill }, line: { color: fill }, objectName: 'num-' + n });
  tb(slide, String(n), { x, y, w: size, h: size, align: 'center', valign: 'middle', bold: true, color: C.background1, fontSize: size > 0.45 ? 16 : 12 });
}
function card(slide, x, y, w, h, fill = C.background2, name = 'card') {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill }, objectName: name });
}
function legendaResp(slide, x, y, extra = true) {
  const items = [['SEDES', RESP.SEDES], ['PRODERJ', RESP.PRODERJ], ['Conjunta', RESP.Conjunta]];
  items.forEach(([t, c], i) => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + i * 1.45, y: y + 0.06, w: 0.32, h: 0.16, rectRadius: 0.04, fill: { color: c }, line: { color: c } });
    tb(slide, t, { x: x + i * 1.45 + 0.4, y, w: 1.0, h: 0.28, fontSize: 11, color: MUTED, valign: 'middle' });
  });
  if (extra) {
    slide.addShape(pres.shapes.DIAMOND, { x: x + 3 * 1.45 + 0.08, y: y + 0.03, w: 0.22, h: 0.22, fill: { color: C.accent4 }, line: { color: C.accent4 } });
    tb(slide, 'Marco', { x: x + 3 * 1.45 + 0.4, y, w: 0.8, h: 0.28, fontSize: 11, color: MUTED, valign: 'middle' });
    slide.addShape(pres.shapes.RECTANGLE, { x: x + 4 * 1.45 + 0.05, y: y + 0.04, w: 0.28, h: 0.2, fill: { color: 'E3E8F0' }, line: { color: 'E3E8F0' } });
    tb(slide, 'Recesso / feriado', { x: x + 4 * 1.45 + 0.4, y, w: 1.6, h: 0.28, fontSize: 11, color: MUTED, valign: 'middle' });
  }
}
const FERIADOS = [['24/12/2026', '01/01/2027'], ['08/02/2027', '10/02/2027'], ['26/03/2027', '26/03/2027'], ['21/04/2027', '21/04/2027'], ['23/04/2027', '23/04/2027']];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Gantt: rows = [{label, ini, fim, resp, kind:'fase'|'tarefa'|'marco', code}]
function gantt(slide, rows, ini, fim, o) {
  const { x = 0.6, y = 1.55, labelW = 4.2, w = 12.15, rowH = 0.3, tick = 'week', bracket } = o;
  const gx = x + labelW, gw = w - labelW, t0 = D(ini), t1 = D(fim) + DAY, span = t1 - t0;
  const X = (t) => gx + (t - t0) / span * gw;
  const top = y + 0.42, H = rows.length * rowH;
  // feriados
  FERIADOS.forEach(([a, b]) => {
    const s = Math.max(D(a), t0), e = Math.min(D(b) + DAY, t1);
    if (e > s) slide.addShape(pres.shapes.RECTANGLE, { x: X(s), y: top, w: Math.max(0.03, X(e) - X(s)), h: H, fill: { color: 'E3E8F0' }, line: { color: 'E3E8F0' }, objectName: 'feriado' });
  });
  // cabeçalho de meses
  let m = new Date(t0); m = Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), 1);
  while (m < t1) {
    const nm = Date.UTC(new Date(m).getUTCFullYear(), new Date(m).getUTCMonth() + 1, 1);
    const s = Math.max(m, t0), e = Math.min(nm, t1);
    const label = MESES[new Date(m).getUTCMonth()] + '/' + String(new Date(m).getUTCFullYear()).slice(2);
    slide.addShape(pres.shapes.RECTANGLE, { x: X(s), y, w: X(e) - X(s), h: 0.32, fill: { color: C.background2 }, line: { color: 'FFFFFF', width: 1 } });
    if (X(e) - X(s) > 0.45) tb(slide, label, { x: X(s), y, w: X(e) - X(s), h: 0.32, align: 'center', valign: 'middle', fontSize: 11, bold: true, color: C.text2 });
    slide.addShape(pres.shapes.LINE, { x: X(s), y: top, w: 0, h: H, line: { color: 'C9D6E8', width: 0.75 } });
    m = nm;
  }
  // linhas
  rows.forEach((r, i) => {
    const ry = top + i * rowH;
    if (r.kind === 'fase') slide.addShape(pres.shapes.RECTANGLE, { x, y: ry, w, h: rowH, fill: { color: 'F4F8FD' }, line: { color: 'F4F8FD' } });
    slide.addShape(pres.shapes.LINE, { x, y: ry + rowH, w, h: 0, line: { color: 'E2E9F3', width: 0.5 } });
    const lab = (r.code ? r.code + '  ' : '') + r.label;
    tb(slide, lab, { x: x + (r.kind === 'fase' ? 0 : 0.1), y: ry, w: labelW - 0.15, h: rowH, valign: 'middle', fontSize: r.kind === 'fase' ? 11 : 10, bold: r.kind === 'fase', color: r.kind === 'fase' ? C.text2 : C.text1, fit: 'shrink' });
    if (r.kind === 'marco') {
      r.datas.forEach(([dt, nome]) => {
        const cx = X(D(dt) + DAY / 2);
        slide.addShape(pres.shapes.DIAMOND, { x: cx - 0.1, y: ry + rowH / 2 - 0.1, w: 0.2, h: 0.2, fill: { color: C.accent4 }, line: { color: 'FFFFFF', width: 0.75 }, objectName: 'marco ' + nome });
      });
      return;
    }
    const s = Math.max(D(r.ini), t0), e = Math.min(D(r.fim) + DAY, t1);
    if (e <= s) return;
    const bh = r.kind === 'fase' ? rowH * 0.55 : rowH * 0.5;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X(s), y: ry + (rowH - bh) / 2, w: Math.max(0.06, X(e) - X(s)), h: bh, rectRadius: 0.05, fill: { color: RESP[r.resp] || C.text2 }, line: { color: RESP[r.resp] || C.text2 }, objectName: 'barra ' + (r.code || r.label) });
    if (r.showDates) {
      const txt = ddmm(D(r.ini)) + ' – ' + ddmm(D(r.fim));
      const bx = X(e) + 0.06;
      if (bx + 1.0 < gx + gw) tb(slide, txt, { x: bx, y: ry, w: 1.1, h: rowH, valign: 'middle', fontSize: 9, color: MUTED });
      else tb(slide, txt, { x: X(s) - 1.16, y: ry, w: 1.1, h: rowH, valign: 'middle', fontSize: 9, color: MUTED, align: 'right' });
    }
  });
  if (bracket) {
    const s = X(D(bracket[0])), e = X(D(bracket[1]) + DAY), by = top + H + 0.12;
    slide.addShape(pres.shapes.LINE, { x: s, y: by, w: e - s, h: 0, line: { color: C.accent4, width: 1.5, beginArrowType: 'arrow', endArrowType: 'arrow' } });
    tb(slide, bracket[2], { x: s, y: by + 0.06, w: e - s, h: 0.3, align: 'center', fontSize: 11, bold: true, color: C.accent4 });
  }
  return { bottom: top + H };
}

// ---------- slides ----------
// 1 · capa
pres.addSection({ title: 'Abertura' });
let s = pres.addSlide({ masterName: 'CAPA', sectionTitle: 'Abertura' });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 0.7, w: 3.1, h: 1.1, rectRadius: 0.08, fill: { color: C.background1 }, line: { color: C.background1 }, objectName: 'fundo-brasao' });
s.addImage({ path: LOGO, x: 0.95, y: 0.82, w: 2.45, h: 0.86, altText: 'Governo do Estado do Rio de Janeiro' });
tb(s, 'SECRETARIA DE DESENVOLVIMENTO ECONÔMICO  ·  PRODERJ', { x: 0.8, y: 1.95, w: 9, h: 0.35, fontSize: 13, bold: true, color: C.accent3, charSpacing: 2 });
s.addText('Rebranding do site institucional da SEDES', { placeholder: 'title' });
s.addText('Fluxo, cronograma (Gantt) e esforço estimado em HH', { placeholder: 'body' });
tb(s, 'Novembro de 2026  ·  Base: Maquete 2  ·  Documento de planejamento para discussão', { x: 0.8, y: 6.55, w: 9, h: 0.35, fontSize: 12, color: 'B9CDEA' });
// selo: 3 números grandes
[[`${fmt(TOT)} HH`, 'esforço estimado'], ['15 dias', 'até a proposta técnica'], ['16/04/2027', 'lançamento previsto']].forEach(([n, l], i) => {
  const y = 2.35 + i * 1.35;
  card(s, 9.85, y, 2.85, 1.15, '13306E', 'selo-' + i);
  tb(s, n, { x: 10.05, y: y + 0.14, w: 2.5, h: 0.55, fontSize: 26, bold: true, color: C.background1 });
  tb(s, l, { x: 10.05, y: y + 0.7, w: 2.5, h: 0.3, fontSize: 12, color: C.accent3 });
});
s.addNotes('Abertura. Objetivo: alinhar o fluxo obrigatório com o PRODERJ, o cronograma e o esforço estimado do rebranding do site institucional da SEDES, partindo da Maquete 2, que consolida o que já foi produzido.');

// 2 · resumo executivo
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Abertura' });
s.addText('Resumo executivo', { placeholder: 'title' });
tb(s, 'Com a Maquete 2 e o levantamento de conteúdos prontos, a SEDES abre o SEI com a documentação técnica e o PRODERJ entrega a proposta técnica em até 15 dias corridos.', { x: 0.6, y: 1.2, w: 12.1, h: 0.7, fontSize: 16, color: MUTED });
const stats = [
  ['15/12/2026', 'Proposta técnica', 'TAP e proposta técnica em até 15 dias corridos após a abertura do SEI (01/12)'],
  ['15/01/2027', 'Contrato assinado', 'proposta comercial e minuta do PRODERJ, com recesso de fim de ano'],
  ['16/04/2027', 'Lançamento', 'no domínio rj.gov.br, após homologação e checklist de acessibilidade'],
  [`${fmt(TOT)} HH`, 'Esforço estimado', `${fmt(TOT_S)} HH SEDES  ·  ${fmt(TOT_P)} HH PRODERJ`],
];
stats.forEach(([n, t, d], i) => {
  const x = 0.6 + i * 3.08;
  card(s, x, 2.15, 2.88, 2.7, C.background2, 'stat-' + i);
  tb(s, n, { x: x + 0.25, y: 2.4, w: 2.45, h: 0.75, fontSize: i === 3 ? 30 : 28, bold: true, color: i === 3 ? C.accent4 : C.text2 });
  tb(s, t, { x: x + 0.25, y: 3.2, w: 2.45, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
  tb(s, d, { x: x + 0.25, y: 3.65, w: 2.45, h: 1.05, fontSize: 13, color: MUTED });
});
tb(s, [
  { text: 'Duração total: ', options: { bold: true, color: C.text2 } },
  { text: '~24 semanas, de 01/12/2026 (abertura do SEI) a 14/05/2027 (fim da operação assistida), em 5 fases. ' },
  { text: 'Execução obrigatória em conjunto com o PRODERJ ', options: { bold: true, color: C.text2 } },
  { text: '(Decreto nº 48.671/2023, Portal Único RJ Digital).' },
], { x: 0.6, y: 5.2, w: 12.1, h: 0.9, fontSize: 15 });
tb(s, 'Datas e HH são estimativas referenciais, a validar na proposta técnica do PRODERJ.', { x: 0.6, y: 6.25, w: 12.1, h: 0.35, fontSize: 12, italic: true, color: MUTED });
s.addNotes('Mensagem principal: o caminho até a proposta técnica é curto (15 dias corridos) porque a SEDES já tem protótipo navegável e inventário de conteúdo. O gargalo seguinte é a contratação, que atravessa o recesso de fim de ano.');

// 3 · fundamentação legal
pres.addSection({ title: 'Contexto' });
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Contexto' });
s.addText('Por que o rebranding é feito com o PRODERJ', { placeholder: 'title' });
tb(s, 'Os canais digitais do Poder Executivo estadual são unificados no domínio rj.gov.br, sob gestão tecnológica do PRODERJ.', { x: 0.6, y: 1.2, w: 12.1, h: 0.5, fontSize: 16, color: MUTED });
const normas = [
  ['Decreto nº 48.671/2023', 'Portal Único RJ Digital', 'Unifica os canais digitais no rj.gov.br sob gestão do PRODERJ. Órgãos migram, integram e padronizam seus portais em conjunto com o PRODERJ; a comunicação social não divulga endereços fora do portal único.'],
  ['Decreto nº 48.672/2023', 'Transformação Digital', 'Regulamenta a Lei nº 9.128/2020: serviços e sistemas digitalizados devem se integrar às ferramentas do PRODERJ no Portal Único.'],
  ['Portaria PRODERJ/PRE nº 174/2006', 'Hospedagem e segurança', 'Acesso ao servidor web, gerenciamento técnico, segurança da informação e regras para criar, hospedar e manter sites no domínio rj.gov.br.'],
  ['Lei nº 4.480/2004', 'PRODERJ como órgão central', 'Reestrutura o PRODERJ como órgão central e executor da política de TIC da Administração Pública Estadual.'],
];
normas.forEach(([lei, tema, desc], i) => {
  const x = 0.6 + (i % 2) * 6.15, y = 1.95 + Math.floor(i / 2) * 2.35;
  card(s, x, y, 5.95, 2.15, C.background2, 'norma-' + i);
  circleNum(s, x + 0.25, y + 0.25, i + 1, C.text2);
  tb(s, lei, { x: x + 0.95, y: y + 0.22, w: 4.8, h: 0.35, fontSize: 16, bold: true, color: C.text2 });
  tb(s, tema, { x: x + 0.95, y: y + 0.55, w: 4.8, h: 0.3, fontSize: 13, bold: true, color: C.accent1 });
  tb(s, desc, { x: x + 0.95, y: y + 0.92, w: 4.8, h: 1.15, fontSize: 13, color: C.text1 });
});
tb(s, 'Alinhamento também às normas da SETD e da Subsecretaria de Comunicação Social. Normativos conforme informados pela SEDES.', { x: 0.6, y: 6.6, w: 12.1, h: 0.3, fontSize: 11, italic: true, color: MUTED });
s.addNotes('Fundamentação para o SEI: o Decreto 48.671/2023 torna obrigatória a atuação conjunta com o PRODERJ e o uso do domínio rj.gov.br. A Portaria 174/2006 traz as regras técnicas de hospedagem e segurança.');

// 4 · ponto de partida: Maquete 2
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Contexto' });
s.addText('Ponto de partida: a Maquete 2', { placeholder: 'title' });
tb(s, 'A Maquete 2 é a referência do que já foi produzido e entra no SEI como protótipo navegável.', { x: 0.6, y: 1.2, w: 12.1, h: 0.45, fontSize: 16, color: MUTED });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.8, w: 5.95, h: 4.75, rectRadius: 0.06, fill: { color: C.background2 }, line: { color: 'D6E1EF', width: 1 }, objectName: 'moldura-maquete' });
s.addImage({ path: path.join(__dirname, 'maquete2.jpg'), x: 0.75, y: 1.95, w: 5.65, h: 4.38, altText: 'Captura de tela da Maquete 2: cabeçalho com menu Subsecretarias, hero, régua com cinco perfis e cards das subsecretarias com botão de vídeo' });
tb(s, 'Maquete 2 · página inicial (desktop)', { x: 0.75, y: 6.6, w: 5.65, h: 0.3, fontSize: 11, italic: true, color: MUTED });
const status = [
  ['Pronto', C.accent5, 'Protótipo navegável da página inicial', 'HTML único com imagens embutidas, testado em desktop, tablet e celular'],
  ['Pronto', C.accent5, 'Ajustes da SEDES aplicados', 'Subsecretarias no menu, "Sou investidor" com Desenvolve RJ, Jovens do Mar, Empregos Azuis'],
  ['Pronto', C.accent5, 'Recursos interativos', 'Vídeos de até 1:30 nos eixos, quiz, mapa dos 92 municípios, redes sociais'],
  ['Parcial', C.accent4, 'Inventário de conteúdo', '77 campos estruturados (.docx); conteúdo oficial a preencher'],
  ['A fazer', C.accent6, 'Páginas internas e padrão Portal Único', 'Hoje simuladas; cabeçalho unificado, barra de acessibilidade, tipografia oficial'],
];
status.forEach(([st, col, t, d], i) => {
  const y = 1.85 + i * 0.95;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.85, y: y + 0.04, w: 1.05, h: 0.3, rectRadius: 0.15, fill: { color: col }, line: { color: col } });
  tb(s, st, { x: 6.85, y: y + 0.04, w: 1.05, h: 0.3, fontSize: 11, bold: true, color: C.background1, align: 'center', valign: 'middle' });
  tb(s, t, { x: 8.05, y, w: 4.65, h: 0.36, fontSize: 15, bold: true, color: C.text2 });
  tb(s, d, { x: 8.05, y: y + 0.38, w: 4.65, h: 0.5, fontSize: 12, color: C.text1 });
});
s.addNotes('A Maquete 2 é a base do projeto: incorpora a proposta original (Maquete 1) e as melhorias pedidas pela SEDES. O que falta é conteúdo oficial, páginas internas e a adequação ao padrão do Portal Único RJ Digital.');

// 5 · documentação técnica (4 frentes)
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Contexto' });
s.addText('Documentação técnica exigida: quatro frentes', { placeholder: 'title' });
const ST = { ok: ['Base pronta', C.accent5], parc: ['Parcial', C.accent4], nao: ['A produzir', C.accent6], cond: ['Se aplicável', C.accent6] };
const frentes = [
  ['Identidade e design', [['Manual de Identidade Visual do Governo', 'nao', 'Solicitar à Comunicação Social'], ['Design System Portal Único RJ Digital', 'nao', 'Solicitar ao PRODERJ/SETD'], ['Protótipos navegáveis (desktop e mobile)', 'parc', 'Maquete 2 pronta; versão final na 3.2']]],
  ['Arquitetura, conteúdo e acessibilidade', [['Inventário de conteúdo', 'ok', 'Levantamento dos 77 campos'], ['Mapa do site e plano de redirecionamentos 301', 'parc', 'Menu definido na v2; atividade 3.3'], ['Checklist e-MAG / WCAG (Dec. nº 48.012/2022)', 'nao', 'Atividade 5.2']]],
  ['Infraestrutura, domínio e segurança', [['Normas de hospedagem no servidor PRODERJ', 'nao', 'Fornecidas pelo PRODERJ'], ['Formulário de domínio *.rj.gov.br', 'cond', 'Se mudar o endereço (4.3)'], ['Migração homologação → produção', 'nao', 'Formulário na atividade 5.4'], ['LGPD: privacidade, termos e cookies', 'nao', 'Atividade 3.5'], ['Abertura de portas no firewall', 'cond', 'APIs do mapa, vídeos e redes (4.2)']]],
  ['Contratação e governança', [['Processo administrativo no SEI-RJ', 'nao', 'Abertura em 01/12/2026 (1.1)'], ['ETP e TR (Lei nº 14.133/2021)', 'cond', 'Somente se houver terceiros']]],
];
const FW = [2.85, 2.85, 3.85, 2.25], FX = FW.map((w, i) => 0.6 + FW.slice(0, i).reduce((a, b) => a + b, 0) + i * 0.1);
frentes.forEach(([nome, itens], i) => {
  const x = FX[i], y = 1.3, cw = FW[i];
  card(s, x, y, cw, 5.45, C.background2, 'frente-' + i);
  circleNum(s, x + 0.22, y + 0.22, i + 1, C.text2, 0.42);
  tb(s, nome, { x: x + 0.75, y: y + 0.18, w: cw - 0.9, h: 0.55, fontSize: 14, bold: true, color: C.text2, valign: 'middle' });
  let yy = y + 0.95;
  itens.forEach(([t, st, obs]) => {
    const [lab, col] = ST[st];
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.22, y: yy, w: 1.15, h: 0.24, rectRadius: 0.12, fill: { color: col }, line: { color: col } });
    tb(s, lab, { x: x + 0.22, y: yy, w: 1.15, h: 0.24, fontSize: 9, bold: true, color: C.background1, align: 'center', valign: 'middle' });
    tb(s, t, { x: x + 0.22, y: yy + 0.3, w: cw - 0.4, h: 0.45, fontSize: 11, bold: true, color: C.text1 });
    tb(s, obs, { x: x + 0.22, y: yy + (itens.length > 3 ? 0.58 : 0.72), w: cw - 0.4, h: 0.25, fontSize: 10, color: MUTED });
    yy += itens.length > 3 ? 0.88 : 1.15;
  });
});
s.addNotes('Leitura por frente: verde = base pronta, laranja = parcial, cinza = a produzir ou condicional. As atividades citadas (3.2, 3.3 etc.) estão no Gantt detalhado.');

// 6 · fluxo de abertura
pres.addSection({ title: 'Cronograma' });
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Cronograma' });
s.addText('Fluxo obrigatório de abertura com o PRODERJ', { placeholder: 'title' });
const passos = [
  ['Abertura do SEI', 'Pontos focais SEDES', '01 a 03/12', 'Solicitação de melhoria com fundamentação técnica e documentação técnica (Maquete 2 e levantamento de conteúdos).', C.accent1],
  ['Levantamento de requisitos', 'Equipe técnica PRODERJ + pontos focais', '04 a 09/12', 'Workshops de escopo: páginas, integrações (mapa, Desenvolve RJ, vídeos), padrão Portal Único e LGPD.', C.text2],
  ['TAP e proposta técnica', 'PRODERJ', '10 a 15/12', 'Termo de Abertura do Projeto, escopo, cronograma e estimativa de esforço.', C.accent2],
  ['Contratos PRODERJ', 'PRODERJ → SEDES', '16/12 a 15/01', 'Envio da proposta comercial e da minuta; análise, aprovação e assinatura no SEI-RJ.', C.accent2],
];
passos.forEach(([t, quem, quando, d, col], i) => {
  const x = 0.6 + i * 3.08, y = 1.55;
  card(s, x, y, 2.88, 3.75, C.background2, 'passo-' + i);
  circleNum(s, x + 0.25, y + 0.25, i + 1, col);
  tb(s, quando, { x: x + 0.9, y: y + 0.3, w: 1.8, h: 0.4, fontSize: 15, bold: true, color: col, valign: 'middle' });
  tb(s, t, { x: x + 0.25, y: y + 0.95, w: 2.45, h: 0.7, fontSize: 17, bold: true, color: C.text2 });
  tb(s, quem, { x: x + 0.25, y: y + 1.65, w: 2.45, h: 0.5, fontSize: 12, bold: true, color: C.accent1 });
  tb(s, d, { x: x + 0.25, y: y + 2.15, w: 2.45, h: 1.45, fontSize: 13 });
  if (i < 3) s.addShape(pres.shapes.RIGHT_TRIANGLE, { x: x + 2.92, y: y + 1.75, w: 0.12, h: 0.24, rotate: 0, fill: { color: 'C9D6E8' }, line: { color: 'C9D6E8' }, flipV: false });
});
// chave dos 15 dias (passos 1 a 3)
const bx0 = 0.6, bx1 = 0.6 + 2 * 3.08 + 2.88;
s.addShape(pres.shapes.LINE, { x: bx0, y: 5.6, w: bx1 - bx0, h: 0, line: { color: C.accent4, width: 2, beginArrowType: 'arrow', endArrowType: 'arrow' } });
tb(s, '15 dias corridos até a proposta técnica (01/12 → 15/12/2026)', { x: bx0, y: 5.72, w: bx1 - bx0, h: 0.4, fontSize: 15, bold: true, color: C.accent4, align: 'center' });
tb(s, 'Inclui recesso de fim de ano (24/12 a 01/01) na contratação.', { x: 0.6 + 3 * 3.08, y: 5.72, w: 2.88, h: 0.6, fontSize: 12, italic: true, color: MUTED });
s.addNotes('Fluxo informado pela SEDES. A observação de 15 dias corridos vale até a proposta técnica. A etapa de contratos depende da proposta comercial do PRODERJ e da tramitação interna na SEDES.');

// 7 · Gantt geral
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Cronograma' });
s.addText('Cronograma geral: 5 fases em ~24 semanas', { placeholder: 'title' });
const rowsGeral = FASES.map(f => ({ kind: 'fase', label: f.n, ini: ddmmyyyy(faseIni(f)), fim: ddmmyyyy(faseFim(f)), resp: 'Conjunta', showDates: true }));
function ddmmyyyy(t) { const d = new Date(t); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`; }
rowsGeral.forEach((r, i) => { r.resp = ['SEDES', 'PRODERJ', 'Conjunta', 'PRODERJ', 'Conjunta'][i]; r.kind = 'tarefa'; r.label = FASES[i].n; });
rowsGeral.push({ kind: 'tarefa', label: 'Gestão do projeto (contínua)', ini: GESTAO[3], fim: GESTAO[4], resp: 'Conjunta' });
rowsGeral.push({ kind: 'marco', label: 'Marcos', datas: MARCOS });
gantt(s, rowsGeral, '01/12/2026', '20/05/2027', { y: 1.35, rowH: 0.55, labelW: 3.9 });
// rótulos dos marcos abaixo
const gx0 = 0.6 + 3.9, gw0 = 12.15 - 3.9, T0 = D('01/12/2026'), T1 = D('20/05/2027') + DAY;
const Xg = (t) => gx0 + (t - T0) / (T1 - T0) * gw0;
const mk = [['15/12/2026', 'Proposta técnica'], ['15/01/2027', 'Contrato'], ['16/04/2027', 'Lançamento'], ['14/05/2027', 'Encerramento']];
mk.forEach(([d, t], i) => {
  const cx = Xg(D(d) + DAY / 2);
  tb(s, d.slice(0, 5) + '\n' + t, { x: cx - 0.75, y: 1.77 + 7 * 0.55 + 0.05, w: 1.5, h: 0.55, fontSize: 10, color: C.text1, align: 'center', bold: true });
});
legendaResp(s, 0.6, 6.55);
s.addNotes('Visão por fase. As fases 3 e 4 se sobrepõem: o desenvolvimento começa depois do Carnaval, enquanto o conteúdo e a LGPD terminam em fevereiro. O lançamento previsto é 16/04/2027, antes dos feriados de 21 e 23/04.');

// 8 · Gantt detalhado fases 1-2
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Cronograma' });
s.addText('Detalhe: abertura, proposta técnica e contratação', { placeholder: 'title' });
const rows12 = [];
FASES.slice(0, 2).forEach(f => { rows12.push({ kind: 'fase', label: f.n, ini: ddmmyyyy(faseIni(f)), fim: ddmmyyyy(faseFim(f)), resp: 'Conjunta' }); f.a.forEach(a => rows12.push({ kind: 'tarefa', code: a[0], label: a[1], resp: a[2], ini: a[3], fim: a[4], showDates: true })); });
rows12.push({ kind: 'marco', label: 'Marcos', datas: MARCOS.slice(0, 4) });
gantt(s, rows12, '01/12/2026', '17/01/2027', { y: 1.35, rowH: 0.52, labelW: 4.6, bracket: ['01/12/2026', '15/12/2026', '15 dias corridos'] });
legendaResp(s, 0.6, 6.55);
s.addNotes('Detalhe das primeiras sete semanas. A seta laranja mostra o prazo de 15 dias corridos até a proposta técnica. A assinatura do contrato depende da tramitação no SEI-RJ e atravessa o recesso.');

// 9 · Gantt detalhado fases 3-5
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Cronograma' });
s.addText('Detalhe: projeto, construção e publicação', { placeholder: 'title' });
const rows35 = [];
FASES.slice(2).forEach(f => { rows35.push({ kind: 'fase', label: f.n, ini: ddmmyyyy(faseIni(f)), fim: ddmmyyyy(faseFim(f)), resp: 'Conjunta' }); f.a.forEach(a => rows35.push({ kind: 'tarefa', code: a[0], label: a[1], resp: a[2], ini: a[3], fim: a[4] })); });
rows35.push({ kind: 'marco', label: 'Marcos', datas: MARCOS.slice(4) });
gantt(s, rows35, '18/01/2027', '16/05/2027', { y: 1.25, rowH: 0.262, labelW: 5.3 });
legendaResp(s, 0.6, 6.6);
s.addNotes('Fases 3 a 5. Faixas cinza: Carnaval (08 a 10/02), Sexta-feira Santa (26/03), Tiradentes (21/04) e São Jorge (23/04).');

// 10-11 · tabelas de HH
pres.addSection({ title: 'Esforço' });
function tabelaHH(titulo, fases, incluiGestao, nota) {
  const sl = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Esforço' });
  sl.addText(titulo, { placeholder: 'title' });
  const H = { bold: true, color: 'FFFFFF', fill: { color: HEX.dk2 }, fontSize: 12, valign: 'middle' };
  const rows = [[
    { text: 'Atividade', options: H }, { text: 'Resp.', options: H }, { text: 'Período', options: H },
    { text: 'Perfis envolvidos', options: H }, { text: 'SEDES', options: { ...H, align: 'right' } }, { text: 'PRODERJ', options: { ...H, align: 'right' } }, { text: 'Total HH', options: { ...H, align: 'right' } },
  ]];
  const cell = (t, o = {}) => ({ text: t, options: { fontSize: 11, color: HEX.dk1, valign: 'middle', ...o } });
  let subS = 0, subP = 0;
  fases.forEach(f => {
    const fs = sum(f.a, 5), fp = sum(f.a, 6); subS += fs; subP += fp;
    rows.push([cell(f.n, { bold: true, color: HEX.dk2, fill: { color: HEX.lt2 }, colspan: 4 }), cell(fmt(fs), { bold: true, align: 'right', fill: { color: HEX.lt2 } }), cell(fmt(fp), { bold: true, align: 'right', fill: { color: HEX.lt2 } }), cell(fmt(fs + fp), { bold: true, align: 'right', fill: { color: HEX.lt2 }, color: HEX.dk2 })]);
    f.a.forEach(a => rows.push([cell(a[0] + '  ' + a[1]), cell(a[2], { color: a[2] === 'SEDES' ? HEX.accent1 : a[2] === 'PRODERJ' ? HEX.accent2 : HEX.dk2, bold: true }), cell(ddmm(D(a[3])) + ' – ' + ddmm(D(a[4]))), cell(a[7], { color: MUTED }), cell(fmt(a[5]), { align: 'right' }), cell(fmt(a[6]), { align: 'right' }), cell(fmt(a[5] + a[6]), { align: 'right', bold: true })]));
  });
  if (incluiGestao) {
    subS += GESTAO[5]; subP += GESTAO[6];
    rows.push([cell(GESTAO[1], { bold: true, color: HEX.dk2, fill: { color: HEX.lt2 } }), cell(GESTAO[2], { bold: true, fill: { color: HEX.lt2 }, color: HEX.dk2 }), cell('01/12 – 14/05', { fill: { color: HEX.lt2 } }), cell(GESTAO[7], { color: MUTED, fill: { color: HEX.lt2 } }), cell(fmt(GESTAO[5]), { align: 'right', bold: true, fill: { color: HEX.lt2 } }), cell(fmt(GESTAO[6]), { align: 'right', bold: true, fill: { color: HEX.lt2 } }), cell(fmt(GESTAO[5] + GESTAO[6]), { align: 'right', bold: true, fill: { color: HEX.lt2 } })]);
  }
  const T = { bold: true, color: 'FFFFFF', fill: { color: HEX.accent4 }, fontSize: 12, align: 'right', valign: 'middle' };
  rows.push([{ text: 'Subtotal deste bloco', options: { ...T, align: 'left', colspan: 4 } }, { text: fmt(subS), options: T }, { text: fmt(subP), options: T }, { text: fmt(subS + subP), options: T }]);
  sl.addTable(rows, { x: 0.6, y: 1.3, w: 12.1, colW: [4.9, 1.05, 1.3, 2.35, 0.8, 0.85, 0.85], rowH: 0.3, border: { type: 'solid', pt: 0.5, color: 'D6E1EF' }, fontFace: 'Arial', margin: [0.03, 0.08, 0.03, 0.08] });
  tb(sl, nota, { x: 0.6, y: 6.55, w: 12.1, h: 0.35, fontSize: 11, italic: true, color: MUTED });
  return sl;
}
s = tabelaHH('Esforço por atividade (HH): fases 1 a 3', FASES.slice(0, 3), false, 'HH = homem-hora. Estimativas referenciais, a validar na proposta técnica do PRODERJ.');
s.addNotes('Fases 1 a 3. O maior esforço da SEDES está na coleta e validação dos 77 campos de conteúdo (3.4), que depende das subsecretarias e da ASCOM.');
s = tabelaHH('Esforço por atividade (HH): fases 4, 5 e gestão', FASES.slice(3), true, `Total do projeto: ${fmt(TOT)} HH (SEDES ${fmt(TOT_S)} · PRODERJ ${fmt(TOT_P)}). Gestão: 2 h/semana SEDES e 4 h/semana PRODERJ por 24 semanas.`);
s.addNotes('Fases 4, 5 e gestão. O desenvolvimento front-end e CMS (4.1) é o maior bloco do PRODERJ.');

// 12 · gráfico por fase
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Esforço' });
s.addText('Onde está o esforço', { placeholder: 'title' });
const cats = FASES.map(f => f.curta).concat(['Gestão']);
const serS = FASES.map(f => sum(f.a, 5)).concat([GESTAO[5]]);
const serP = FASES.map(f => sum(f.a, 6)).concat([GESTAO[6]]);
s.addChart(pres.charts.BAR, [{ name: 'SEDES', labels: cats, values: serS }, { name: 'PRODERJ', labels: cats, values: serP }], {
  x: 0.6, y: 1.3, w: 7.9, h: 5.4, barDir: 'bar', barGrouping: 'stacked', chartColors: [HEX.accent1, HEX.accent2],
  showValue: true, dataLabelPosition: 'ctr', dataLabelColor: 'FFFFFF', dataLabelFontSize: 11, dataLabelFontFace: '+mn-lt', dataLabelFormatCode: '#,##0;;;',
  catAxisLabelFontSize: 12, catAxisLabelColor: HEX.dk1, catAxisLabelFontFace: '+mn-lt', catAxisOrientation: 'maxMin',
  valAxisLabelFontSize: 10, valAxisLabelColor: MUTED, valAxisLabelFontFace: '+mn-lt', valGridLine: { color: 'E2E9F3', size: 0.5 }, catGridLine: { style: 'none' },
  showLegend: true, legendPos: 't', legendFontSize: 12, legendFontFace: '+mn-lt', legendColor: HEX.dk1,
  showTitle: true, title: 'HH por fase e instituição', titleFontSize: 14, titleColor: HEX.dk2, titleFontFace: '+mj-lt',
});
const pctP = Math.round(TOT_P / TOT * 100);
card(s, 8.85, 1.35, 3.85, 1.7, C.background2, 'tot');
tb(s, `${fmt(TOT)} HH`, { x: 9.1, y: 1.5, w: 3.4, h: 0.7, fontSize: 34, bold: true, color: C.text2 });
tb(s, `${pctP}% PRODERJ  ·  ${100 - pctP}% SEDES`, { x: 9.1, y: 2.25, w: 3.4, h: 0.4, fontSize: 14, color: MUTED });
const destaques = [
  ['Construção', `${fmt(sum(FASES[3].a, 5) + sum(FASES[3].a, 6))} HH: desenvolvimento, CMS e integrações (PRODERJ).`],
  ['Conteúdo', '232 HH da SEDES só para os 77 campos: o principal risco de prazo.'],
  ['Maquete 2', 'Descoberta e UX da página inicial já feitos: encurtam requisitos e projeto visual.'],
];
destaques.forEach(([t, d], i) => {
  const y = 3.3 + i * 1.12;
  circleNum(s, 8.85, y + 0.05, i + 1, [C.accent2, C.accent1, C.accent4][i], 0.42);
  tb(s, t, { x: 9.4, y, w: 3.3, h: 0.35, fontSize: 15, bold: true, color: C.text2 });
  tb(s, d, { x: 9.4, y: y + 0.36, w: 3.3, h: 0.7, fontSize: 13 });
});
s.addNotes('Distribuição do esforço. A SEDES concentra esforço em conteúdo, validação e homologação; o PRODERJ em projeto visual, construção e testes.');

// 13 · marcos
pres.addSection({ title: 'Encaminhamentos' });
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Encaminhamentos' });
s.addText('Marcos e entregáveis', { placeholder: 'title' });
const ent = ['Processo SEI com fundamentação e anexos', 'TAP e proposta técnica (PRODERJ)', 'Proposta comercial e minuta de contrato', 'Contrato assinado no SEI-RJ', 'Protótipo final, mapa do site e plano 301', 'Relatório e-MAG e homologação SEDES', 'Site no ar em rj.gov.br e editores treinados', 'Encerramento da operação assistida'];
s.addShape(pres.shapes.LINE, { x: 0.9, y: 3.05, w: 11.6, h: 0, line: { color: 'C9D6E8', width: 2 } });
MARCOS.forEach(([d, t], i) => {
  const x = 0.6 + i * 1.53, up = i % 2 === 0;
  s.addShape(pres.shapes.DIAMOND, { x: x + 0.55, y: 2.9, w: 0.3, h: 0.3, fill: { color: i === 6 ? C.accent4 : C.text2 }, line: { color: 'FFFFFF', width: 1 }, objectName: 'marco-' + i });
  tb(s, d.slice(0, 5) + '/' + d.slice(8), { x: x, y: up ? 1.55 : 3.45, w: 1.4, h: 0.35, fontSize: 15, bold: true, color: i === 6 ? C.accent4 : C.text2, align: 'center' });
  tb(s, t, { x: x - 0.05, y: up ? 1.9 : 3.8, w: 1.5, h: 0.8, fontSize: 12, bold: true, align: 'center', color: C.text1 });
});
card(s, 0.6, 4.95, 12.1, 1.75, C.background2, 'entregaveis');
tb(s, 'Entregável de cada marco', { x: 0.85, y: 5.08, w: 11.6, h: 0.35, fontSize: 14, bold: true, color: C.text2 });
const half = Math.ceil(ent.length / 2);
[ent.slice(0, half), ent.slice(half)].forEach((lst, c) => {
  tb(s, lst.map((t, i) => ({ text: `${MARCOS[c * half + i][0].slice(0, 5)}  ${t}`, options: { bullet: true, breakLine: i < lst.length - 1 } })), { x: 0.85 + c * 6, y: 5.45, w: 5.8, h: 1.2, fontSize: 12, paraSpaceAfter: 2 });
});
s.addNotes('Oito marcos. O lançamento (16/04/2027) está em destaque. Cada marco tem um entregável formal registrado no SEI-RJ.');

// 14 · premissas e riscos
s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Encaminhamentos' });
s.addText('Premissas e riscos', { placeholder: 'title' });
const prem = [
  'Abertura do SEI em 01/12/2026; as datas se deslocam com a data real.',
  'Execução pelo PRODERJ, sem terceiros. Com fábrica ou agência, entram ETP e TR (Lei nº 14.133/2021) e o prazo cresce.',
  'Hospedagem no domínio rj.gov.br, conforme o Decreto nº 48.671/2023.',
  'HH estimadas a partir do escopo da Maquete 2; o PRODERJ confirma na proposta técnica.',
];
const riscos = [
  ['Conteúdo atrasado', 'Os 77 campos dependem de várias áreas. Mitigação: pontos focais e prazo por prioridade.'],
  ['Recesso na contratação', 'A tramitação cruza dez/jan. Mitigação: pré-análise jurídica da minuta.'],
  ['Padrão Portal Único', 'Cabeçalho, barra de acessibilidade e tipografia oficial mudam a maquete. Mitigação: obter o Design System na fase 1.'],
  ['Migração do Desenvolve RJ', 'Risco de quebrar links. Mitigação: plano de redirecionamentos 301 (3.3).'],
  ['Imagens', 'Fotos da proposta parecem geradas por IA. Mitigação: banco de imagens oficial com autorização de uso.'],
];
card(s, 0.6, 1.3, 5.0, 5.4, C.background2, 'premissas');
tb(s, 'Premissas', { x: 0.85, y: 1.45, w: 4.5, h: 0.4, fontSize: 18, bold: true, color: C.text2 });
tb(s, prem.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < prem.length - 1 } })), { x: 0.85, y: 1.95, w: 4.55, h: 4.6, fontSize: 14, paraSpaceAfter: 10 });
tb(s, 'Riscos e mitigação', { x: 6.0, y: 1.3, w: 6.7, h: 0.4, fontSize: 18, bold: true, color: C.text2 });
riscos.forEach(([t, d], i) => {
  const y = 1.85 + i * 0.97;
  circleNum(s, 6.0, y + 0.05, i + 1, C.accent4, 0.42);
  tb(s, t, { x: 6.6, y, w: 6.1, h: 0.33, fontSize: 15, bold: true, color: C.text2 });
  tb(s, d, { x: 6.6, y: y + 0.34, w: 6.1, h: 0.55, fontSize: 13 });
});
s.addNotes('Premissas e riscos. O risco mais provável é o atraso de conteúdo; o de maior impacto visual é a adequação ao padrão Portal Único.');

// 15 · próximos passos (fechamento)
s = pres.addSlide({ masterName: 'FINAL', sectionTitle: 'Encaminhamentos' });
s.addText('Próximos passos', { placeholder: 'title' });
const prox = [
  ['Até 27/11', 'Designar os pontos focais', 'ASCOM, subsecretarias, TI, jurídico e encarregado LGPD.'],
  ['Até 30/11', 'Reunir os anexos do SEI', 'Fundamentação (Dec. nº 48.671/2023), Maquete 2 e levantamento de conteúdos.'],
  ['01/12', 'Abrir o processo no SEI-RJ', 'Solicitação de melhoria do site com documentação técnica.'],
  ['04 a 09/12', 'Workshops de requisitos com o PRODERJ', 'E pedir o Design System Portal Único e o Manual de Identidade.'],
];
prox.forEach(([q, t, d], i) => {
  const y = 1.55 + i * 1.3;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 12.1, h: 1.1, rectRadius: 0.08, fill: { color: '13306E' }, line: { color: '13306E' }, objectName: 'passo-final-' + i });
  circleNum(s, 0.85, y + 0.28, i + 1, C.accent3);
  tb(s, q, { x: 1.6, y: y + 0.2, w: 2.2, h: 0.7, fontSize: 18, bold: true, color: C.accent3, valign: 'middle' });
  tb(s, t, { x: 3.9, y: y + 0.15, w: 8.6, h: 0.42, fontSize: 18, bold: true, color: C.background1 });
  tb(s, d, { x: 3.9, y: y + 0.57, w: 8.6, h: 0.4, fontSize: 14, color: 'C7D6EE' });
});
s.addNotes('Encaminhamentos imediatos para cumprir o prazo de 15 dias corridos até a proposta técnica.');

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('ok', OUT, 'HH', TOT_S, TOT_P, TOT);
})();
