"""Gera o painel HTML (arquivo único, sem dependências externas).

Uso: python build_html.py <pasta_origem> <saida.html>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import agg
import etl

MOD_CURTO = {"Coffee Simples": "Coffee Simples", "Brunch": "Brunch", "Coquetel": "Coquetel",
             "Buffet – Almoço/Jantar": "Almoço/Jantar", "A definir": "A definir"}


def dados(origem: Path):
    regs, issues, contagem = etl.consolidar(origem)
    A = agg.calcular(regs, issues)
    eventos = [{
        "id": g["ID"], "unidade": g["Unidade remetente"], "sub": g["Subsecretaria"], "setor": g["Setor"],
        "nome": g["Nome do evento"], "cat": g["Categoria"], "periodo": g["Data/período (original)"],
        "tipo": g["Tipo de período"], "ini": g["Data início"].isoformat(), "fim": g["Data fim"].isoformat(),
        "mes": g["Data início"].month, "mesdef": g["Mês definido?"] == "Sim", "publico": g["Público estimado"],
        "pubtot": g["Público entra nos totais?"] == "Sim", "buffet": g["Necessita buffet?"],
        "modal": g["Modalidade de buffet"], "pessoas": g["Pessoas buffet"], "status": g["Status"],
        "demanda": g["Demanda de buffet"], "obs": g["Observações"],
    } for g in regs]
    return {
        "kpi": A["kpi"], "eventos": eventos, "inconsistencias": issues,
        "modalidades": etl.MODALIDADES, "meses": etl.MESES, "mesesExt": [m.capitalize() for m in etl.MESES_EXTENSO],
        "unidades": list(etl.ARQUIVOS.values()), "fontes": contagem,
    }


HTML = r"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Eventos SEDES 2027</title>
<style>
:root{
  --azul-esc:#002f6c; --azul:#0060a8; --azul-claro:#dce8f5; --azul-suave:#f2f6fb; --dourado:#c9a227;
  --bg:#f5f7fa; --card:#ffffff; --txt:#1f2937; --txt2:#4b5563; --linha:#d9e2ee;
  --firme-bg:#d9f0df; --firme-tx:#1e5631; --cond-bg:#fff1c7; --cond-tx:#7a5a00; --hip-bg:#ede7f6; --hip-tx:#4a3a75;
  --heat:0,96,168;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#0e1622; --card:#152132; --txt:#e8edf4; --txt2:#a9b6c7; --linha:#2a3a52; --azul-suave:#1a2940;
    --azul-claro:#22385a; --azul:#5aa0e6; --firme-bg:#183c25; --firme-tx:#a8e0b8; --cond-bg:#43360d;
    --cond-tx:#f3d77a; --hip-bg:#2e2547; --hip-tx:#cfc2f0; --heat:90,160,230;
  }
}
:root[data-theme="dark"]{
  --bg:#0e1622; --card:#152132; --txt:#e8edf4; --txt2:#a9b6c7; --linha:#2a3a52; --azul-suave:#1a2940;
  --azul-claro:#22385a; --azul:#5aa0e6; --firme-bg:#183c25; --firme-tx:#a8e0b8; --cond-bg:#43360d;
  --cond-tx:#f3d77a; --hip-bg:#2e2547; --hip-tx:#cfc2f0; --heat:90,160,230;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font:14px/1.45 Arial,"Helvetica Neue",Helvetica,sans-serif}
header{background:#002f6c;color:#fff;border-bottom:4px solid var(--dourado)}
.topo{max-width:1280px;margin:0 auto;padding:18px 16px 14px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.selo{width:46px;height:46px;border-radius:50%;border:2px solid var(--dourado);display:grid;place-items:center;
  font-weight:700;font-size:12px;letter-spacing:.5px;flex:none}
.topo h1{margin:0;font-size:20px;letter-spacing:.2px}
.topo p{margin:2px 0 0;font-size:12.5px;opacity:.85}
.topo .gov{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;opacity:.8}
nav{background:var(--card);border-bottom:1px solid var(--linha);position:sticky;top:0;z-index:5}
nav .in{max-width:1280px;margin:0 auto;padding:0 8px;display:flex;overflow-x:auto}
nav button{background:none;border:0;border-bottom:3px solid transparent;padding:12px 14px;font:inherit;
  color:var(--txt2);cursor:pointer;white-space:nowrap}
nav button[aria-selected="true"]{color:var(--azul);border-bottom-color:var(--azul);font-weight:700}
main{max-width:1280px;margin:0 auto;padding:18px 16px 40px}
section[hidden]{display:none}
h2{font-size:17px;color:var(--azul-esc);margin:26px 0 4px}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) h2{color:#9cc4ee}}
:root[data-theme="dark"] h2{color:#9cc4ee}
.nota{color:var(--txt2);font-size:12.5px;margin:0 0 10px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
.kpi{background:var(--card);border:1px solid var(--linha);border-top:4px solid var(--azul);border-radius:8px;padding:12px 14px}
.kpi.ouro{border-top-color:var(--dourado)}
.kpi b{display:block;font-size:26px;color:var(--txt);font-variant-numeric:tabular-nums}
.kpi span{font-size:12px;color:var(--txt2)}
.card{background:var(--card);border:1px solid var(--linha);border-radius:8px;padding:14px;margin-top:10px}
.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{padding:7px 9px;border-bottom:1px solid var(--linha);text-align:right;font-variant-numeric:tabular-nums}
th{background:#002f6c;color:#fff;font-weight:700;text-align:center;position:sticky;top:0}
td.t,th.t{text-align:left}
tbody tr:nth-child(even) td{background:var(--azul-suave)}
tr.tot td{background:var(--azul-claro)!important;font-weight:700;border-top:2px solid var(--azul-esc)}
.pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;font-weight:700}
.p-Firme{background:var(--firme-bg);color:var(--firme-tx)}
.p-Condicionada{background:var(--cond-bg);color:var(--cond-tx)}
.p-Hipótese{background:var(--hip-bg);color:var(--hip-tx)}
.p-Sem{background:var(--azul-suave);color:var(--txt2)}
.chart{display:grid;grid-template-columns:repeat(12,1fr);gap:6px;align-items:end;height:220px;padding:22px 4px 0;
  border-bottom:1px solid var(--linha)}
.col{display:flex;flex-direction:column;justify-content:flex-end;height:100%;position:relative;cursor:default}
.seg{width:100%;border-radius:4px 4px 0 0}
.seg.f{background:var(--azul)}
.seg.c{background:repeating-linear-gradient(45deg,var(--dourado) 0 4px,transparent 4px 7px);border:1px solid var(--dourado);border-radius:4px 4px 0 0}
.seg.f + .seg.c, .seg.c + .seg.f{margin-top:2px}
.col .v{font-size:11px;text-align:center;color:var(--txt2);margin-bottom:3px}
.eixo{display:grid;grid-template-columns:repeat(12,1fr);gap:6px;font-size:12px;color:var(--txt2);text-align:center;padding-top:4px}
.leg{display:flex;gap:16px;font-size:12px;color:var(--txt2);margin-top:8px;flex-wrap:wrap}
.leg i{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:5px}
.tip{position:fixed;pointer-events:none;background:var(--card);color:var(--txt);border:1px solid var(--linha);
  box-shadow:0 4px 14px rgba(0,0,0,.18);border-radius:6px;padding:8px 10px;font-size:12px;z-index:20;display:none;max-width:260px}
.filtros{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}
.filtros select,.filtros input{font:inherit;padding:6px 8px;border:1px solid var(--linha);border-radius:6px;background:var(--card);color:var(--txt)}
.filtros input{flex:1;min-width:180px}
.bar{height:10px;background:var(--azul);border-radius:0 3px 3px 0;display:inline-block;vertical-align:middle}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media (max-width:820px){.grid2{grid-template-columns:1fr}.chart{height:180px}.col .v{font-size:9px}}
footer{color:var(--txt2);font-size:12px;text-align:center;padding:16px}
.tema{margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.5);color:#fff;border-radius:6px;padding:6px 10px;font:inherit;cursor:pointer}
@media print{nav,.filtros,.tema{display:none}section[hidden]{display:block}th{position:static}}
</style>
</head>
<body>
<header><div class="topo">
  <div class="selo" aria-hidden="true">RJ</div>
  <div>
    <div class="gov">Governo do Estado do Rio de Janeiro</div>
    <h1>SEDES · Levantamento de Eventos 2027</h1>
    <p>Consolidação das 7 planilhas recebidas · necessidade mensal e quantitativo de buffet</p>
  </div>
  <button class="tema" id="tema" type="button">Tema claro/escuro</button>
</div></header>
<nav><div class="in" role="tablist">
  <button role="tab" data-tab="painel" aria-selected="true">Painel</button>
  <button role="tab" data-tab="mensal" aria-selected="false">Necessidade mensal</button>
  <button role="tab" data-tab="buffet" aria-selected="false">Quantitativo de buffet</button>
  <button role="tab" data-tab="periodo" aria-selected="false">Eventos por período</button>
  <button role="tab" data-tab="lista" aria-selected="false">Todos os eventos</button>
  <button role="tab" data-tab="incons" aria-selected="false">Inconsistências</button>
</div></nav>
<main>
<section id="painel">
  <div class="kpis" id="kpis"></div>
  <h2>Pessoas atendidas por buffet, mês a mês</h2>
  <p class="nota">Barra azul = demanda firme · hachurado dourado = demanda condicionada (patrocínio, confirmação ou buffet “a definir”). Passe o mouse para ver o detalhe.</p>
  <div class="card"><div class="chart" id="chart"></div><div class="eixo" id="eixo"></div>
    <div class="leg"><span><i style="background:var(--azul)"></i>Firme</span><span><i style="background:repeating-linear-gradient(45deg,var(--dourado) 0 3px,transparent 3px 5px);border:1px solid var(--dourado)"></i>Condicionada</span></div></div>
  <h2>Resumo por planilha recebida</h2>
  <div class="card scroll"><table id="tUnid"></table></div>
  <p class="nota" style="margin-top:10px">Hipóteses internas da SUPATI (6 linhas) ficam fora dos totais. O público das 3 feiras da SUBENEMAR (46 mil pessoas, público total da feira) não entra no total de público.</p>
</section>
<section id="mensal" hidden>
  <h2>Esquema de necessidade mensal de buffet</h2>
  <p class="nota">Pessoas a atender por mês e tipo de serviço. Mês de referência = início do evento; eventos informados só por bimestre/trimestre/semestre entram no 1º mês da janela.</p>
  <div class="filtros"><select id="cenario">
    <option value="Firme">Demanda firme</option><option value="Condicionada">Demanda condicionada</option>
    <option value="Max" selected>Cenário máximo (firme + condicionada)</option></select></div>
  <div class="card scroll"><table id="tMensal"></table></div>
</section>
<section id="buffet" hidden>
  <h2>Quantitativo por tipo de serviço</h2>
  <div class="card scroll"><table id="tModal"></table></div>
  <div class="grid2">
    <div><h2>Por semestre (cenário máximo)</h2><div class="card scroll"><table id="tModSem"></table></div></div>
    <div><h2>Por trimestre (cenário máximo)</h2><div class="card scroll"><table id="tModTri"></table></div></div>
  </div>
  <h2>Por setor e tipo de serviço (cenário máximo)</h2>
  <div class="card scroll"><table id="tSetMod"></table></div>
</section>
<section id="periodo" hidden>
  <h2>Eventos por mês</h2>
  <div class="card scroll"><table id="tMes"></table></div>
  <div class="grid2">
    <div><h2>Por trimestre</h2><div class="card scroll"><table id="tTri"></table></div></div>
    <div><h2>Por semestre</h2><div class="card scroll"><table id="tSem"></table></div></div>
  </div>
  <h2>Calendário por setor (nº de eventos, exceto hipóteses)</h2>
  <div class="card scroll"><table id="tSetMes"></table></div>
</section>
<section id="lista" hidden>
  <h2>Todos os eventos</h2>
  <div class="filtros">
    <input id="busca" type="search" placeholder="Buscar evento, setor ou observação…">
    <select id="fUnid"><option value="">Todas as unidades</option></select>
    <select id="fMes"><option value="">Todos os meses</option></select>
    <select id="fDem"><option value="">Toda demanda de buffet</option><option>Firme</option><option>Condicionada</option><option>Hipótese</option><option>Sem buffet</option></select>
  </div>
  <p class="nota" id="contLista"></p>
  <div class="card scroll"><table id="tLista"></table></div>
</section>
<section id="incons" hidden>
  <h2>Inconsistências e tratamentos aplicados</h2>
  <p class="nota">Nada foi descartado: os valores originais estão na planilha (aba Base Consolidada).</p>
  <div class="card scroll"><table id="tIncons"></table></div>
</section>
</main>
<footer>SEDES · Levantamento de Eventos 2027 · gerado a partir de Consolidado_Eventos_SEDES_2027.xlsx · paleta inspirada na identidade visual do Governo do Estado do RJ</footer>
<div class="tip" id="tip"></div>
<script id="dados" type="application/json">__DADOS__</script>
<script>
(function(){
const D = JSON.parse(document.getElementById('dados').textContent);
const E = D.eventos, MODS = D.modalidades, CURTO = {"Buffet – Almoço/Jantar":"Almoço/Jantar"};
const fmt = n => (n||0).toLocaleString('pt-BR');
const nf = n => n ? fmt(n) : '–';
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const HIP = 'Hipótese (validar)', BUF = d => d==='Firme' || d==='Condicionada';
const sum = (a,f) => a.reduce((s,x)=>s+f(x),0);
const trim = e => 'T'+Math.ceil(e.mes/3), sem = e => e.mes<=6 ? '1º Semestre' : '2º Semestre';
const nh = E.filter(e => e.status!==HIP);

// tema
const root = document.documentElement;
try{ const t = localStorage.getItem('tema'); if(t) root.dataset.theme = t; }catch(e){}
document.getElementById('tema').onclick = () => {
  const escuro = root.dataset.theme ? root.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = escuro ? 'light' : 'dark';
  try{ localStorage.setItem('tema', root.dataset.theme); }catch(e){}
};
// abas
document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
  document.querySelectorAll('nav button').forEach(x => x.setAttribute('aria-selected', x===b));
  document.querySelectorAll('main section').forEach(s => s.hidden = s.id!==b.dataset.tab);
});
// tooltip
const tip = document.getElementById('tip');
function showTip(ev, html){ tip.innerHTML = html; tip.style.display='block';
  const x = Math.min(ev.clientX+14, innerWidth-tip.offsetWidth-8), y = Math.max(ev.clientY-tip.offsetHeight-10, 8);
  tip.style.left = x+'px'; tip.style.top = y+'px'; }
const hideTip = () => tip.style.display='none';

function resumo(lst){
  const n = lst.filter(e=>e.status!==HIP);
  return {eventos:n.length, exato:n.filter(e=>e.mesdef).length, estim:n.filter(e=>!e.mesdef).length,
    prev:lst.filter(e=>e.status==='Previsto').length, cond:lst.filter(e=>e.status==='Condicionado').length,
    pub:sum(n.filter(e=>e.pubtot),e=>e.publico||0), evbuf:lst.filter(e=>BUF(e.demanda)).length,
    pf:sum(lst.filter(e=>e.demanda==='Firme'),e=>e.pessoas), pc:sum(lst.filter(e=>e.demanda==='Condicionada'),e=>e.pessoas),
    hip:lst.filter(e=>e.status===HIP).length};
}
function table(id, head, rows, tot, alignLeft){
  alignLeft = alignLeft || [0];
  const th = head.map((h,i)=>`<th class="${alignLeft.includes(i)?'t':''}">${h}</th>`).join('');
  const tr = r => r.map((c,i)=>`<td class="${alignLeft.includes(i)?'t':''}">${c}</td>`).join('');
  document.getElementById(id).innerHTML = `<thead><tr>${th}</tr></thead><tbody>${rows.map(r=>`<tr>${tr(r)}</tr>`).join('')}`+
    (tot?`<tr class="tot">${tr(tot)}</tr>`:'')+'</tbody>';
}
function colsum(rows, from){ return rows[0].map((_,i)=> i<from ? '' : rows.reduce((s,r)=>s+(+String(r[i]).replace(/\./g,'').replace('–','0')||0),0)); }

// KPIs
const K = D.kpi;
const kp = [["Eventos previstos (exceto hipóteses)",K.eventos],["Status Previsto",K.previstos],["Status Condicionado",K.condicionados],
  ["Hipóteses a validar",K.hipoteses],["Pessoas – buffet firme",K.pessoas_firme,1],["Pessoas – buffet condicionado",K.pessoas_cond,1],
  ["Cenário máximo de pessoas",K.pessoas_max,1],["Eventos com buffet",K.eventos_buffet],["Público estimado (exc. feiras ext.)",K.publico],
  ["Inconsistências apontadas",K.inconsistencias]];
document.getElementById('kpis').innerHTML = kp.map(k=>`<div class="kpi ${k[2]?'ouro':''}"><b data-kpi="${esc(k[0])}">${fmt(k[1])}</b><span>${k[0]}</span></div>`).join('');

// gráfico mensal
const porMes = m => ({f: sum(E.filter(e=>e.mes===m&&e.demanda==='Firme'),e=>e.pessoas), c: sum(E.filter(e=>e.mes===m&&e.demanda==='Condicionada'),e=>e.pessoas)});
const mx = Math.max(...D.meses.map((_,i)=>{const p=porMes(i+1);return p.f+p.c;}));
document.getElementById('chart').innerHTML = D.meses.map((m,i)=>{const p=porMes(i+1);
  return `<div class="col" data-m="${i+1}"><div class="v">${fmt(p.f+p.c)}</div>${p.c?`<div class="seg c" style="height:${p.c/mx*170}px"></div>`:''}<div class="seg f" style="height:${p.f/mx*170}px"></div></div>`;}).join('');
document.getElementById('eixo').innerHTML = D.meses.map(m=>`<div>${m}</div>`).join('');
document.querySelectorAll('#chart .col').forEach(c=>{
  const m=+c.dataset.m, p=porMes(m);
  const det = MODS.map(mod=>[mod, sum(E.filter(e=>e.mes===m&&BUF(e.demanda)&&e.modal===mod),e=>e.pessoas)]).filter(x=>x[1]);
  c.onmousemove = ev => showTip(ev, `<b>${D.mesesExt[m-1]}</b><br>Firme: ${fmt(p.f)}<br>Condicionada: ${fmt(p.c)}<hr style="border:0;border-top:1px solid var(--linha)">`+det.map(d=>`${esc(CURTO[d[0]]||d[0])}: ${fmt(d[1])}`).join('<br>'));
  c.onmouseleave = hideTip;
});

// por unidade
{ const rows = D.unidades.map(u=>{const l=E.filter(e=>e.unidade===u), r=resumo(l);
    return [u,l.length,r.eventos,r.prev,r.cond,r.hip,nf(r.pub),r.evbuf,nf(r.pf),nf(r.pc),nf(r.pf+r.pc),D.inconsistencias.filter(i=>i.unidade===u).length];});
  const t = colsum(rows,1); t[0]='TOTAL'; table('tUnid',["Unidade","Linhas","Eventos","Previstos","Condic.","Hipóteses","Público","Eventos c/ buffet","Pessoas firme","Pessoas condic.","Cenário máx.","Inconsist."],rows,t.map((v,i)=>i?fmt(v):v)); }

// necessidade mensal
function renderMensal(){
  const cen = document.getElementById('cenario').value;
  const ok = e => cen==='Max' ? BUF(e.demanda) : e.demanda===cen;
  let acum=0;
  const rows = D.mesesExt.map((m,i)=>{const l=E.filter(e=>e.mes===i+1&&ok(e)); const tot=sum(l,e=>e.pessoas); acum+=tot;
    return [m,...MODS.map(mod=>nf(sum(l.filter(e=>e.modal===mod),e=>e.pessoas))),`<b>${nf(tot)}</b>`,nf(l.length),nf(sum(l.filter(e=>e.mesdef),e=>e.pessoas)),nf(sum(l.filter(e=>!e.mesdef),e=>e.pessoas)),fmt(acum)];});
  const raw = (a,b) => { const l=E.filter(e=>e.mes>=a&&e.mes<=b&&ok(e));
    return [...MODS.map(mod=>nf(sum(l.filter(e=>e.modal===mod),e=>e.pessoas))),`<b>${nf(sum(l,e=>e.pessoas))}</b>`,nf(l.length),nf(sum(l.filter(e=>e.mesdef),e=>e.pessoas)),nf(sum(l.filter(e=>!e.mesdef),e=>e.pessoas)),'']; };
  table('tMensal',["Mês",...MODS.map(m=>CURTO[m]||m),"Total pessoas","Nº eventos","Pessoas c/ mês exato","Pessoas c/ mês estimado","Acumulado"],
    rows.concat([["1º Semestre",...raw(1,6)],["2º Semestre",...raw(7,12)]]), ["TOTAL 2027",...raw(1,12)]);
  // heatmap
  const cells=[...document.querySelectorAll('#tMensal tbody tr')].slice(0,12).flatMap(tr=>[...tr.children].slice(1,1+MODS.length));
  const vals=cells.map(td=>+td.textContent.replace(/\./g,'')||0), m=Math.max(1,...vals);
  cells.forEach((td,i)=>{ if(vals[i]) td.style.background=`rgba(var(--heat),${(0.08+0.5*vals[i]/m).toFixed(2)})`; });
  [...document.querySelectorAll('#tMensal tbody tr')].slice(12,14).forEach(tr=>tr.classList.add('tot'));
}
document.getElementById('cenario').onchange = renderMensal; renderMensal();

// quantitativo por modalidade
{ const tot = sum(E.filter(e=>BUF(e.demanda)),e=>e.pessoas);
  const rows = MODS.map(m=>{const f=E.filter(e=>e.modal===m&&e.demanda==='Firme'), c=E.filter(e=>e.modal===m&&e.demanda==='Condicionada'), h=E.filter(e=>e.modal===m&&e.demanda==='Hipótese');
    const p=sum(f,e=>e.pessoas)+sum(c,e=>e.pessoas);
    return [`<b>${esc(m)}</b>`,nf(f.length),nf(sum(f,e=>e.pessoas)),nf(c.length),nf(sum(c,e=>e.pessoas)),nf(f.length+c.length),`<b>${nf(p)}</b>`,
      `<span class="bar" style="width:${tot?p/tot*90:0}px"></span> ${(tot?p/tot*100:0).toFixed(1).replace('.',',')}%`,nf(h.length),nf(sum(h,e=>e.pessoas))];});
  const F=E.filter(e=>e.demanda==='Firme'), C=E.filter(e=>e.demanda==='Condicionada'), H=E.filter(e=>e.demanda==='Hipótese'&&MODS.includes(e.modal));
  table('tModal',["Tipo de serviço","Eventos firmes","Pessoas firmes","Eventos condic.","Pessoas condic.","Eventos (máx.)","Pessoas (máx.)","% pessoas","Hipót. eventos","Hipót. pessoas"],rows,
    ["TOTAL",fmt(F.length),fmt(sum(F,e=>e.pessoas)),fmt(C.length),fmt(sum(C,e=>e.pessoas)),fmt(F.length+C.length),fmt(tot),'100,0%',fmt(H.length),fmt(sum(H,e=>e.pessoas))]);
  const mat=(id,keys,fn)=>{const rows=MODS.map(m=>[esc(CURTO[m]||m),...keys.map(k=>nf(sum(E.filter(e=>e.modal===m&&BUF(e.demanda)&&fn(e)===k),e=>e.pessoas))),`<b>${nf(sum(E.filter(e=>e.modal===m&&BUF(e.demanda)),e=>e.pessoas))}</b>`]);
    table(id,["Tipo de serviço",...keys,"Total"],rows,["TOTAL",...keys.map(k=>fmt(sum(E.filter(e=>BUF(e.demanda)&&fn(e)===k),e=>e.pessoas))),fmt(tot)]);};
  mat('tModSem',["1º Semestre","2º Semestre"],sem); mat('tModTri',["T1","T2","T3","T4"],trim);
  const setores=[...new Set(E.filter(e=>BUF(e.demanda)).map(e=>e.sub+'|'+e.setor))].sort();
  const rs=setores.map(k=>{const [s,st]=k.split('|'), l=E.filter(e=>e.sub===s&&e.setor===st&&BUF(e.demanda));
    return [s,`<b>${esc(st)}</b>`,...MODS.map(m=>nf(sum(l.filter(e=>e.modal===m),e=>e.pessoas))),`<b>${nf(sum(l,e=>e.pessoas))}</b>`,nf(l.length)];});
  const Lb=E.filter(e=>BUF(e.demanda));
  table('tSetMod',["Subsec.","Setor",...MODS.map(m=>CURTO[m]||m),"Total pessoas","Eventos"],rs,["","TOTAL",...MODS.map(m=>fmt(sum(Lb.filter(e=>e.modal===m),e=>e.pessoas))),fmt(tot),fmt(Lb.length)],[0,1]);
}

// eventos por período
{ const H=["Período","Eventos","Mês exato","Mês estimado","Previstos","Condic.","Público","Eventos c/ buffet","Pessoas firme","Pessoas condic.","Cenário máx.","Hipóteses"];
  const linha=(rot,l)=>{const r=resumo(l);return [rot,r.eventos,r.exato,r.estim,r.prev,r.cond,nf(r.pub),r.evbuf,nf(r.pf),nf(r.pc),nf(r.pf+r.pc),r.hip];};
  const tot=linha('TOTAL',E).map((v,i)=>i?(typeof v==='number'?fmt(v):v):v);
  table('tMes',H,D.mesesExt.map((m,i)=>linha(m,E.filter(e=>e.mes===i+1))),tot);
  table('tTri',H,["T1","T2","T3","T4"].map(t=>linha(t,E.filter(e=>trim(e)===t))),tot);
  table('tSem',H,["1º Semestre","2º Semestre"].map(s=>linha(s,E.filter(e=>sem(e)===s))),tot);
  const setores=[...new Set(nh.map(e=>e.sub+'|'+e.setor))].sort();
  const rs=setores.map(k=>{const [s,st]=k.split('|'), l=nh.filter(e=>e.sub===s&&e.setor===st);
    return [s,`<b>${esc(st)}</b>`,...D.meses.map((_,i)=>nf(l.filter(e=>e.mes===i+1).length)),`<b>${l.length}</b>`];});
  table('tSetMes',["Subsec.","Setor",...D.meses,"Total"],rs,["","TOTAL",...D.meses.map((_,i)=>fmt(nh.filter(e=>e.mes===i+1).length)),fmt(nh.length)],[0,1]);
  const cells=[...document.querySelectorAll('#tSetMes tbody tr:not(.tot)')].flatMap(tr=>[...tr.children].slice(2,14));
  const vals=cells.map(td=>+td.textContent||0), m=Math.max(1,...vals);
  cells.forEach((td,i)=>{ if(vals[i]) td.style.background=`rgba(var(--heat),${(0.08+0.5*vals[i]/m).toFixed(2)})`; });
}

// lista de eventos
{ const fU=document.getElementById('fUnid'), fM=document.getElementById('fMes');
  D.unidades.forEach(u=>fU.insertAdjacentHTML('beforeend',`<option>${esc(u)}</option>`));
  D.mesesExt.forEach((m,i)=>fM.insertAdjacentHTML('beforeend',`<option value="${i+1}">${m}</option>`));
  const pill = d => `<span class="pill p-${d.split(' ')[0]}">${esc(d)}</span>`;
  const br = s => s.split('-').reverse().join('/');
  function render(){
    const q=document.getElementById('busca').value.toLowerCase(), u=fU.value, m=fM.value, d=document.getElementById('fDem').value;
    const l=E.filter(e=>(!u||e.unidade===u)&&(!m||e.mes===+m)&&(!d||e.demanda===d)&&(!q||(e.nome+' '+e.setor+' '+e.obs+' '+e.sub).toLowerCase().includes(q)))
      .sort((a,b)=>a.ini<b.ini?-1:a.ini>b.ini?1:a.id<b.id?-1:1);
    document.getElementById('contLista').textContent = `${l.length} evento(s) · ${fmt(sum(l.filter(e=>BUF(e.demanda)),e=>e.pessoas))} pessoas com buffet (firme + condicionada)`;
    table('tLista',["ID","Mês","Data/período informado","Subsec. / Setor","Evento","Público","Buffet","Modalidade","Pessoas","Demanda","Status"],
      l.map(e=>[e.id,D.meses[e.mes-1]+(e.mesdef?'':'*'),esc(e.periodo),esc(e.sub+' / '+e.setor),esc(e.nome)+(e.obs?`<br><small style="color:var(--txt2)">${esc(e.obs)}</small>`:''),nf(e.publico),e.buffet,esc(e.modal),nf(e.pessoas),pill(e.demanda),esc(e.status)]),null,[0,1,2,3,4,6,7,9,10]);
  }
  ['busca','fUnid','fMes','fDem'].forEach(id=>document.getElementById(id).addEventListener('input',render)); render();
  document.getElementById('contLista').insertAdjacentHTML('afterend','');
}
// inconsistências
table('tIncons',["ID","Unidade","Evento","Campo","Problema","Tratamento","Ação sugerida"],
  D.inconsistencias.slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).map(i=>[i.id,esc(i.unidade),esc(i.evento),esc(i.campo),esc(i.problema),esc(i.tratamento),esc(i.acao)]),null,[0,1,2,3,4,5,6]);
})();
</script>
</body>
</html>
"""


def main(origem: Path, saida: Path):
    d = dados(origem)
    js = json.dumps(d, ensure_ascii=False, default=str).replace("</", "<\\/")
    saida.write_text(HTML.replace("__DADOS__", js), encoding="utf-8")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
