// Capturas para a apresentação — espelho local da produção (somente leitura: nenhuma ação altera dados)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const crypto = require('crypto');
const OUT = process.argv[2];
const BASE = 'http://localhost:54321';
const SECRET = 'segredo-de-teste-local-com-32-caracteres-no-minimo';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub) => { const h = b64({ alg: 'HS256', typ: 'JWT' }); const p = b64({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now()/1000)+36000 }); return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const SUB = '00000000-0000-0000-0000-000000000001';
(async () => {
  const browser = await chromium.launch({ args: ['--lang=pt-BR'], env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' } });
  async function pagina(w, h, dsf) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', ignoreHTTPSErrors: true });
    const s = { access_token: jwt(SUB), refresh_token: 'x', token_type: 'bearer', expires_in: 36000, expires_at: Math.floor(Date.now()/1000)+36000, user: { id: SUB, email: 'rodrigo.maul@desenvolvimento.rj.gov.br', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
    await ctx.addInitScript((v) => localStorage.setItem('sb-localhost-auth-token', v), JSON.stringify(s));
    const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('PAGEERROR', e.message)); return p;
  }
  async function ir(p, url) { await p.goto(BASE + url); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900); }
  // 1 · Dashboard em alta definição: 1920×1080 CSS px, fator 2 → 3840×2160 (4K)
  let p = await pagina(1920, 1080, 2);
  await ir(p, '/');
  await p.screenshot({ path: `${OUT}/dashboard_4k.png` });
  await p.screenshot({ path: `${OUT}/dashboard_4k_completo.png`, fullPage: true });
  // 2 · Demais telas: 1600×900, fator 2
  p = await pagina(1600, 900, 2);
  await ir(p, '/contratacoes'); await p.screenshot({ path: `${OUT}/contratacoes.png` });
  await p.getByText('Chromebooks', { exact: true }).first().click();
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(1200); console.log('url', p.url()); await p.screenshot({ path: `${OUT}/detalhe.png` });
  await ir(p, '/relatorios'); await p.getByText('Carteira', { exact: true }).first().click(); await p.waitForTimeout(1200); await p.screenshot({ path: `${OUT}/relatorios.png` });
  await ir(p, '/equipe'); await p.screenshot({ path: `${OUT}/equipe.png` });
  await browser.close();
})();
