// Abre o HTML no Chromium, coleta os números exibidos e grava JSON (usado por test_html.py)
const { chromium } = require('playwright');
(async () => {
  const [,, html, out, shots] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const erros = [];
  p.on('pageerror', e => erros.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto('file://' + html);
  const tab = id => p.$$eval(`#${id} tr`, trs => trs.map(tr => [...tr.children].map(td => td.textContent.trim())));
  const r = { erros };
  r.kpis = await p.$$eval('.kpi', ks => ks.map(k => [k.querySelector('span').textContent, k.querySelector('b').textContent]));
  r.unid = await tab('tUnid');
  await p.click('nav button[data-tab="mensal"]');
  r.mensal = {};
  for (const c of ['Firme', 'Condicionada', 'Max']) {
    await p.selectOption('#cenario', c);
    r.mensal[c] = await tab('tMensal');
  }
  r.modal = await tab('tModal'); r.modSem = await tab('tModSem'); r.modTri = await tab('tModTri');
  r.setMod = await tab('tSetMod'); r.mes = await tab('tMes'); r.tri = await tab('tTri'); r.sem = await tab('tSem');
  r.setMes = await tab('tSetMes');
  await p.click('nav button[data-tab="lista"]');
  r.listaTodos = (await tab('tLista')).length - 1;
  await p.selectOption('#fDem', 'Firme'); r.listaFirme = (await tab('tLista')).length - 1;
  r.contFirme = await p.textContent('#contLista');
  await p.selectOption('#fDem', ''); await p.fill('#busca', 'cedemar'); r.listaBusca = (await tab('tLista')).length - 1;
  r.incons = (await tab('tIncons')).length - 1;
  await p.click('nav button[data-tab="painel"]');
  r.chart = await p.$$eval('#chart .v', vs => vs.map(v => v.textContent));
  // tooltip
  await p.hover('#chart .col[data-m="3"]'); r.tip = await p.textContent('#tip');
  if (shots) {
    await p.click('nav button[data-tab="lista"]'); await p.fill('#busca', ''); await p.click('nav button[data-tab="painel"]');
    await p.screenshot({ path: shots + '/desktop_painel.png', fullPage: true });
    for (const t of ['mensal', 'buffet', 'periodo']) { await p.click(`nav button[data-tab="${t}"]`); await p.screenshot({ path: `${shots}/desktop_${t}.png`, fullPage: true }); }
    const m = await b.newPage({ viewport: { width: 390, height: 844 } });
    await m.goto('file://' + html);
    r.mobileOverflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    await m.screenshot({ path: shots + '/mobile_painel.png', fullPage: false });
    await m.emulateMedia({ colorScheme: 'dark' });
    await m.screenshot({ path: shots + '/mobile_dark.png', fullPage: false });
  }
  require('fs').writeFileSync(out, JSON.stringify(r));
  await b.close();
})();
