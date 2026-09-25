// Telas por perfil — réplica local idêntica à produção. Nenhuma ação salva dados.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const crypto = require('crypto');
const OUT = process.argv[2];
const BASE = 'http://localhost:54321';
const SECRET = 'segredo-de-teste-local-com-32-caracteres-no-minimo';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub) => { const h = b64({ alg: 'HS256', typ: 'JWT' }); const p = b64({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now()/1000)+36000 }); return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const U = { admin: '00000000-0000-0000-0000-000000000001', vinicius: '00000000-0000-0000-0000-000000000011', elias: '00000000-0000-0000-0000-000000000012',
  andressa: '00000000-0000-0000-0000-000000000013', gibson: '00000000-0000-0000-0000-000000000014', luene: '00000000-0000-0000-0000-000000000015' };
let browser;
async function nova(who) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', ignoreHTTPSErrors: true });
  if (who) {
    const sub = U[who];
    const s = { access_token: jwt(sub), refresh_token: 'x', token_type: 'bearer', expires_in: 36000, expires_at: Math.floor(Date.now()/1000)+36000, user: { id: sub, email: who + '@local', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
    await ctx.addInitScript((v) => localStorage.setItem('sb-localhost-auth-token', v), JSON.stringify(s));
  }
  // bloqueia qualquer escrita (POST/PATCH/DELETE) — garantia de que nada é salvo
  await ctx.route('**/rest/v1/**', (r) => ['GET', 'HEAD', 'OPTIONS'].includes(r.request().method()) || r.request().url().includes('/rpc/') ? r.continue() : r.abort());
  const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('PAGEERROR', e.message)); return p;
}
async function ir(p, url) { await p.goto(BASE + url); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800); }
async function marcar(p, marcas) {
  const boxes = [];
  for (const m of marcas) {
    const loc = typeof m.sel === 'string' ? p.locator(m.sel).first() : m.sel;
    const b = await loc.boundingBox().catch(() => null);
    if (!b) { console.log('SEM ELEMENTO', m.n, String(m.sel)); continue; }
    const sc = await p.evaluate(() => [window.scrollX, window.scrollY]);
    boxes.push({ x: b.x + sc[0], y: b.y + sc[1], w: b.width, h: b.height, n: m.n, lado: m.lado || 'tl' });
  }
  await p.evaluate((boxes) => {
    for (const b of boxes) {
      const r = document.createElement('div');
      Object.assign(r.style, { position: 'absolute', left: b.x - 4 + 'px', top: b.y - 4 + 'px', width: b.w + 8 + 'px', height: b.h + 8 + 'px', border: '2.5px solid #c8962f', borderRadius: '8px', zIndex: 99998, pointerEvents: 'none', boxShadow: '0 0 0 3px rgba(200,150,47,.18)' });
      const c = document.createElement('div'); c.textContent = b.n;
      const pos = { tl: [b.x - 16, b.y - 16], tr: [b.x + b.w - 12, b.y - 16], l: [b.x - 34, b.y + b.h / 2 - 13], r: [b.x + b.w + 8, b.y + b.h / 2 - 13] }[b.lado];
      Object.assign(c.style, { position: 'absolute', left: pos[0] + 'px', top: pos[1] + 'px', width: '26px', height: '26px', borderRadius: '50%', background: '#b3372b', color: '#fff', font: '700 13px Inter, sans-serif', display: 'grid', placeItems: 'center', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,.35)', zIndex: 99999 });
      document.body.appendChild(r); document.body.appendChild(c);
    }
  }, boxes);
}
async function foto(p, nome, marcas = []) { await marcar(p, marcas); await p.screenshot({ path: `${OUT}/${nome}.png` }); console.log('ok', nome); }
async function rolar(p, sel, topo = 90) { await p.evaluate(([s, t]) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - t); }, [sel, topo]); await p.waitForTimeout(400); }
async function chromebooks(p) { await ir(p, '/contratacoes'); await p.getByText('Chromebooks', { exact: true }).first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1000); }

(async () => {
  browser = await chromium.launch({ args: ['--lang=pt-BR'], env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' } });
  let p = await nova(null);
  await ir(p, '/');
  await foto(p, '01-login', [{ sel: 'input[type=email]', n: 1, lado: 'l' }, { sel: 'input[type=password]', n: 2, lado: 'l' }, { sel: 'button.btn.primario', n: 3, lado: 'l' }, { sel: 'text=Primeiro acesso', n: 4, lado: 'l' }]);
  await p.context().close();

  // Coordenação — Vinicius Murat
  p = await nova('vinicius');
  await ir(p, '/contratacoes');
  await foto(p, '02-coord-carteira', [{ sel: '.chips', n: 1 }, { sel: '.filtros .campo >> nth=3', n: 2 }, { sel: 'text=Nova contratação', n: 3, lado: 'l' }, { sel: 'text=Exportar Excel', n: 4, lado: 'l' }]);
  await ir(p, '/contratacoes/nova');
  await foto(p, '03-coord-nova', [{ sel: '.passos', n: 1 }, { sel: '#sec-0 input[placeholder^="Contratação de"]', n: 2 }, { sel: '.card.escuro', n: 3, lado: 'tr' }]);
  await chromebooks(p);
  await rolar(p, '.etapa-bloco');
  await foto(p, '04-coord-responsaveis', [{ sel: '.etapa-bloco >> nth=0 >> .etapa-cab select', n: 1, lado: 'l' }, { sel: 'text=não definido', n: 2, lado: 'tr' }]);
  await p.context().close();

  // Elaboração — Andressa Borges Santos
  p = await nova('andressa');
  await chromebooks(p);
  const b1 = p.locator('.etapa-bloco', { hasText: 'Planejamento da contratação' });
  await rolar(p, '.etapa-bloco', 70);
  await foto(p, '05-elab-checklist', [
    { sel: b1.locator('.ativ', { hasText: 'Elaboração do ETP' }).locator('select').nth(0), n: 1, lado: 'l' },
    { sel: b1.locator('.ativ', { hasText: 'Elaboração do TR' }).locator('input[type=date]'), n: 2, lado: 'tr' },
    { sel: b1.locator('.ativ', { hasText: 'Elaboração do TR' }).locator('.icone-btn'), n: 3, lado: 'tr' },
    { sel: b1.locator('.etapa-cab .prog'), n: 4, lado: 'tr' }]);
  await ir(p, '/atas');
  await foto(p, '06-elab-atas', [{ sel: 'text=Cadastrar ata', n: 1, lado: 'l' }, { sel: 'main input.input', n: 2, lado: 'l' }, { sel: 'main tbody tr >> nth=0', n: 3, lado: 'l' }]);
  await p.context().close();

  // Conformidade — Elias Conceição Magalhães
  p = await nova('elias');
  await ir(p, '/auditoria');
  await p.locator('main table tbody tr.clicavel', { hasText: 'Rodrigo Maul' }).first().click().catch(() => console.log('sem linha Rodrigo'));
  await p.waitForTimeout(400);
  await foto(p, '07-conf-auditoria', [{ sel: 'main .card.mb .form-grid', n: 1, lado: 'l' }, { sel: 'table.diff', n: 2, lado: 'l' }, { sel: 'text=Exportar Excel', n: 3, lado: 'l' }]);
  await ir(p, '/pendencias'); await p.click('text=Visão da equipe').catch(() => console.log('sem visão equipe')); await p.waitForTimeout(800);
  await foto(p, '08-conf-pendencias-equipe', [{ sel: 'text=Visão da equipe', n: 1, lado: 'l' }]);
  await p.context().close();

  // Ponto focal — Gibson Cruz da Silva
  p = await nova('gibson');
  await ir(p, '/pendencias');
  await foto(p, '09-pf-minhas-pendencias', [{ sel: 'main .grid.g5', n: 1, lado: 'l' }, { sel: 'main tbody tr >> nth=0', n: 2, lado: 'l' }]);
  await chromebooks(p);
  const b3 = p.locator('.etapa-bloco', { hasText: 'Comunicações e análises' });
  await rolar(p, '.etapa-bloco:nth-of-type(3)', 70).catch(() => {});
  await b3.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, 250)); await p.waitForTimeout(300);
  await foto(p, '10-pf-prazos-legais', [
    { sel: b3.locator('.ativ', { hasText: 'SEPLAG' }).locator('select').nth(0), n: 1, lado: 'l' },
    { sel: b3.locator('.ativ', { hasText: 'SEPLAG' }).locator('.prazo-box'), n: 2, lado: 'tr' },
    { sel: b3.locator('.ativ', { hasText: 'PRODERJ' }).locator('label.check'), n: 3, lado: 'r' }]);
  await p.context().close();

  // Ponto focal — Luene: documentos e andamentos
  p = await nova('luene');
  await chromebooks(p);
  await p.click('.aba:has-text("Documentos")'); await p.waitForTimeout(600);
  await foto(p, '11-pf-documentos', [{ sel: '.dropzone', n: 1, lado: 'tr' }, { sel: '.aba:has-text("Andamentos")', n: 2, lado: 'tr' }]);
  await p.context().close();

  // Administrador — Rodrigo Maul
  p = await nova('admin');
  await ir(p, '/manutencao');
  await foto(p, '12-admin-integrantes', [{ sel: '.abas', n: 1, lado: 'l' }, { sel: 'text=Novo integrante', n: 2, lado: 'l' }, { sel: 'main tbody tr >> nth=0 >> td >> nth=4', n: 3, lado: 'tr' }]);
  await ir(p, '/equipe');
  await foto(p, '13-equipe', []);
  await ir(p, '/relatorios'); await p.getByText('Carteira', { exact: true }).first().click(); await p.waitForTimeout(1000);
  await foto(p, '14-relatorios', [{ sel: '.abas', n: 1, lado: 'l' }, { sel: 'main .card.mb .form-grid', n: 2, lado: 'l' }, { sel: 'text=Exportar Excel', n: 3, lado: 'l' }, { sel: 'text=Imprimir / PDF', n: 4, lado: 'l' }]);
  await p.context().close();
  await browser.close();
})();
