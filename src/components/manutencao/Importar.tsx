import { useMemo, useState } from 'react';
import { useApp } from '../../lib/app';
import { supabase, traduzirErro } from '../../lib/supabase';
import { moeda, normalizar, num2 } from '../../lib/format';
import type { Contratacao } from '../../lib/types';
import { Modal, toast } from '../ui';

/**
 * Importação da planilha de andamento do GT.
 * · As colunas são localizadas pelo nome do cabeçalho (a posição muda entre versões da planilha).
 * · Correspondência pelo processo SEI e, na falta dele, pela semelhança do objeto — sempre revisável.
 * · Atualiza só os campos do painel (processo, DOD, ata, TI, documentos, valor, andamento, observação).
 *   Campo em branco na planilha não apaga valor existente. Modalidade e checklist não são alterados.
 * · Nada é gravado antes da confirmação; tudo fica registrado na auditoria.
 */

type Campo = 'processo_sei_origem' | 'processo_sei' | 'objeto' | 'dod_status' | 'dod_obs' | 'ata_status' | 'ata_obs' | 'ti_status' | 'ti_obs'
  | 'docs_prep_status' | 'docs_prep_obs' | 'valor_estimado' | 'ultimo_andamento' | 'observacao';
const ROTULO: Record<Campo, string> = {
  processo_sei_origem: 'Processo antigo', processo_sei: 'Processo SEI', objeto: 'Objeto', dod_status: 'DOD', dod_obs: 'DOD · observação',
  ata_status: 'Ata', ata_obs: 'Ata · observação', ti_status: 'Manifestação do TI', ti_obs: 'TI · observação', docs_prep_status: 'Documentos da fase preparatória',
  docs_prep_obs: 'Documentos · observação', valor_estimado: 'Valor estimado', ultimo_andamento: 'Último andamento', observacao: 'Observação',
};
const ATUALIZAVEIS: Campo[] = ['processo_sei_origem', 'processo_sei', 'dod_status', 'dod_obs', 'ata_status', 'ata_obs', 'ti_status', 'ti_obs', 'docs_prep_status', 'docs_prep_obs', 'valor_estimado', 'ultimo_andamento', 'observacao'];

type Linha = { n: number | null; valores: Partial<Record<Campo, string | number | null>> };
interface Leitura { linhas: Linha[]; ignoradas: string[]; aba: string }
type Vinculo = { tipo: 'nova' } | { tipo: 'existente'; id: string } | { tipo: 'ignorar' };
interface Proposta { linha: Linha; sugestao: { id: string; via: 'processo SEI' | 'objeto'; score: number } | null }

const limpa = (v: unknown) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim());
const semProcesso = (s: string) => !s || /n[aã]o h[aá] process/i.test(s);
const seiNorm = (s: string | null | undefined) => { const m = (s ?? '').toUpperCase().replace(/\s/g, '').match(/SEI-?(\d+\/\d+\/\d{4})/); return m ? `SEI-${m[1]}` : ''; };
const PARADAS = new Set(['contratacao', 'para', 'aquisicao', 'de', 'da', 'do', 'das', 'dos', 'e', 'of', 'a', 'o', 'visando', 'atender', 'as', 'necessidades', 'faetec', 'com', 'em']);
function tokens(objeto: string): Set<string> {
  const t = normalizar(objeto).replace(/,?\s*visando.*$/, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ');
  return new Set(t.split(/\s+/).filter((w) => w.length >= 2 && !/^\d+$/.test(w) && !PARADAS.has(w)).map((w) => w.replace(/(es|s)$/, '')));
}
function dice(a: Set<string>, b: Set<string>) { if (!a.size || !b.size) return 0; let i = 0; a.forEach((w) => b.has(w) && i++); return (2 * i) / (a.size + b.size); }
function tituloDe(objeto: string) {
  const t = objeto.replace(/^contrata[cç][aã]o\s+(para\s+aquisi[cç][aã]o\s+de\s+|de\s+)/i, '').replace(/,?\s*visando.*$/i, '').trim();
  const s = t.charAt(0).toUpperCase() + t.slice(1);
  return s.length > 80 ? s.slice(0, 77) + '…' : s;
}
function modalidadeDe(v: Linha['valores']) {
  const ata = normalizar(limpa(v.ata_status)), obs = normalizar(limpa(v.ata_obs));
  if (obs.includes('dispensa')) return 'dispensa';
  if (ata === 'participe') return 'participante_rp';
  if (ata === 'sim') return 'adesao_arp';
  return 'a_definir';
}
function valorNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function lerPlanilha(arquivo: File): Promise<Leitura> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await arquivo.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('A planilha não tem abas.');
  const texto = (r: number, c: number) => { const cel = ws.getCell(r, c); const m = cel.isMerged ? cel.master : cel; return limpa(m.text); };
  // Linha de cabeçalho: a que contém “OBJETO”
  let rCab = 0;
  for (let r = 1; r <= Math.min(15, ws.rowCount); r++) {
    for (let c = 1; c <= ws.columnCount; c++) if (normalizar(texto(r, c)) === 'objeto') { rCab = r; break; }
    if (rCab) break;
  }
  if (!rCab) throw new Error('Não encontrei o cabeçalho com a coluna “OBJETO”.');
  const sub = (c: number) => { const s = texto(rCab + 1, c); return s && s !== texto(rCab, c) ? normalizar(s) : ''; };
  const temSub = Array.from({ length: ws.columnCount }, (_, i) => sub(i + 1)).some((s) => s === 'status' || s === 'observacao');
  const mapa = new Map<number, Campo>();
  const ignoradas: string[] = [];
  for (let c = 1; c <= ws.columnCount; c++) {
    const top = normalizar(texto(rCab, c)); const s = temSub ? sub(c) : '';
    const obs = s.startsWith('observ');
    let campo: Campo | null = null;
    if (top.startsWith('processo antigo')) campo = 'processo_sei_origem';
    else if (top.startsWith('processo novo') || top === 'processo sei') campo = 'processo_sei';
    else if (top === 'objeto') campo = 'objeto';
    else if (top === 'dod') campo = obs ? 'dod_obs' : 'dod_status';
    else if (top.startsWith('ata de registro')) campo = obs ? 'ata_obs' : 'ata_status';
    else if (top.startsWith('manifestacao do ti')) campo = obs ? 'ti_obs' : 'ti_status';
    else if (top.startsWith('documentos da fase')) campo = obs ? 'docs_prep_obs' : 'docs_prep_status';
    else if (top.startsWith('valor')) campo = 'valor_estimado';
    else if (top.startsWith('ultimo andamento')) campo = 'ultimo_andamento';
    else if (top === 'observacao') campo = 'observacao';
    if (campo && ![...mapa.values()].includes(campo)) mapa.set(c, campo);
    else if (top && c > 1 && !campo) ignoradas.push(texto(rCab, c));
  }
  if (![...mapa.values()].includes('objeto')) throw new Error('Coluna “OBJETO” não identificada.');
  const linhas: Linha[] = [];
  for (let r = rCab + (temSub ? 2 : 1); r <= ws.rowCount; r++) {
    const valores: Linha['valores'] = {};
    mapa.forEach((campo, c) => {
      const cel = ws.getCell(r, c);
      valores[campo] = campo === 'valor_estimado' ? valorNum(cel.value) : limpa(cel.text) || null;
    });
    if (!valores.objeto) continue;
    if (semProcesso(limpa(valores.processo_sei))) valores.processo_sei = null;
    if (semProcesso(limpa(valores.processo_sei_origem))) valores.processo_sei_origem = null;
    const n = Number(limpa(ws.getCell(r, 1).text));
    linhas.push({ n: Number.isFinite(n) && n > 0 ? n : null, valores });
  }
  return { linhas, ignoradas: [...new Set(ignoradas)], aba: ws.name };
}

/** Sugere a correspondência de cada linha: processo SEI; senão, maior semelhança do objeto (cada contratação usada uma vez). */
function sugerir(linhas: Linha[], cs: Contratacao[]): Proposta[] {
  const usados = new Set<string>();
  const props: Proposta[] = linhas.map((linha) => ({ linha, sugestao: null }));
  props.forEach((p) => {
    const s = seiNorm(limpa(p.linha.valores.processo_sei));
    const c = s && cs.find((x) => seiNorm(x.processo_sei) === s);
    if (c) { p.sugestao = { id: c.id, via: 'processo SEI', score: 1 }; usados.add(c.id); }
  });
  const pares: { i: number; id: string; score: number }[] = [];
  props.forEach((p, i) => {
    if (p.sugestao) return;
    const tl = tokens(limpa(p.linha.valores.objeto));
    cs.forEach((c) => { if (!usados.has(c.id)) { const sc = Math.max(dice(tl, tokens(c.objeto)), dice(tl, tokens(c.titulo))); if (sc >= 0.6) pares.push({ i, id: c.id, score: sc }); } });
  });
  pares.sort((a, b) => b.score - a.score).forEach(({ i, id, score }) => {
    if (props[i].sugestao || usados.has(id)) return;
    props[i].sugestao = { id, via: 'objeto', score }; usados.add(id);
  });
  return props;
}

function diferencas(v: Linha['valores'], c: Contratacao) {
  const out: { campo: Campo; antes: unknown; depois: unknown; conferir?: string }[] = [];
  ATUALIZAVEIS.forEach((campo) => {
    const novo = v[campo];
    if (novo == null || novo === '') return; // em branco na planilha: mantém o valor atual
    const atual = (c as unknown as Record<string, unknown>)[campo];
    const igual = campo === 'valor_estimado' ? Number(atual ?? NaN) === Number(novo) : limpa(atual) === limpa(novo);
    if (igual) return;
    let conferir: string | undefined;
    if (campo === 'processo_sei' && typeof novo === 'string') {
      if (!/^SEI-?\d+\/\d+\/\d{4}$/i.test(novo.replace(/\s/g, ''))) conferir = 'formato do processo';
      else if (!novo.endsWith('/' + new Date().getFullYear())) conferir = 'ano do processo';
    }
    out.push({ campo, antes: atual, depois: novo, conferir });
  });
  return out;
}

export default function Importar() {
  const { recarregarCatalogos } = useApp();
  const [lendo, setLendo] = useState(false);
  const [leitura, setLeitura] = useState<(Leitura & { arquivo: string }) | null>(null);
  const [cs, setCs] = useState<Contratacao[]>([]);
  const [vinculos, setVinculos] = useState<Record<number, Vinculo>>({});
  const [props, setProps] = useState<Proposta[]>([]);
  const [confirmar, setConfirmar] = useState(false);
  const [gravando, setGravando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ novas: number; atualizadas: number; erros: string[] } | null>(null);

  async function abrirArquivo(f: File | undefined) {
    if (!f) return;
    setLendo(true); setResultado(null);
    try {
      const [l, r] = await Promise.all([lerPlanilha(f), supabase.from('contratacoes').select('*').eq('rascunho', false).order('numero')]);
      if (r.error) throw new Error(r.error.message);
      const lista = (r.data ?? []) as Contratacao[];
      const p = sugerir(l.linhas, lista);
      setCs(lista); setProps(p); setLeitura({ ...l, arquivo: f.name });
      setVinculos(Object.fromEntries(p.map((x, i) => [i, x.sugestao ? { tipo: 'existente', id: x.sugestao.id } : { tipo: 'nova' }])));
    } catch (e) {
      toast(`Não foi possível ler a planilha: ${(e as Error).message}`, true);
    } finally { setLendo(false); }
  }

  const porId = useMemo(() => new Map(cs.map((c) => [c.id, c])), [cs]);
  const plano = props.map((p, i) => {
    const v = vinculos[i] ?? { tipo: 'nova' };
    const c = v.tipo === 'existente' ? porId.get(v.id) : undefined;
    return { p, i, v, c, dif: c ? diferencas(p.linha.valores, c) : [] };
  });
  const vinculadas = new Set(plano.filter((x) => x.v.tipo === 'existente').map((x) => (x.v as { id: string }).id));
  const repetidas = new Set(plano.filter((x, _, arr) => x.v.tipo === 'existente' && arr.filter((y) => y.v.tipo === 'existente' && (y.v as { id: string }).id === (x.v as { id: string }).id).length > 1).map((x) => x.i));
  const soSistema = cs.filter((c) => !vinculadas.has(c.id));
  const novas = plano.filter((x) => x.v.tipo === 'nova');
  const atualizar = plano.filter((x) => x.v.tipo === 'existente' && x.dif.length);
  const conferir = plano.filter((x) => x.dif.some((d) => d.conferir) || (x.v.tipo === 'existente' && x.p.sugestao?.via === 'objeto' && (x.p.sugestao?.score ?? 1) < 0.85));

  async function gravar() {
    setConfirmar(false);
    const erros: string[] = [];
    let feitas = 0, criadas = 0;
    for (const x of atualizar) {
      setGravando(`Atualizando ${num2(x.c!.numero)} · ${x.c!.titulo}…`);
      const payload = Object.fromEntries(x.dif.map((d) => [d.campo, d.depois]));
      const { error } = await supabase.from('contratacoes').update(payload).eq('id', x.c!.id);
      if (error) erros.push(`${num2(x.c!.numero)}: ${traduzirErro(error.message)}`); else feitas++;
    }
    for (const x of novas) {
      const v = x.p.linha.valores;
      const objeto = limpa(v.objeto);
      setGravando(`Criando ${tituloDe(objeto)}…`);
      const semJust = /aguardando justificativa/i.test(limpa(v.dod_status)) || /sem justificativa/i.test(limpa(v.observacao));
      const payload: Record<string, unknown> = {
        titulo: tituloDe(objeto), objeto, modalidade: modalidadeDe(v), justificativa_recebida: !semJust,
        situacao: semJust ? 'Sem justificativa' : 'Em instrução',
      };
      ATUALIZAVEIS.forEach((k) => { if (v[k] != null && v[k] !== '') payload[k] = v[k]; });
      const { error } = await supabase.from('contratacoes').insert(payload);
      if (error) erros.push(`${tituloDe(objeto)}: ${traduzirErro(error.message)}`); else criadas++;
    }
    setGravando(null);
    setResultado({ novas: criadas, atualizadas: feitas, erros });
    setLeitura(null); setProps([]);
    recarregarCatalogos();
    toast(erros.length ? `Importação concluída com ${erros.length} erro(s).` : 'Importação concluída.', erros.length > 0);
  }

  const fmt = (campo: Campo, v: unknown) => (v == null || v === '' ? '—' : campo === 'valor_estimado' ? moeda(Number(v)) : String(v));

  return (
    <div className="pilha">
      <div className="card">
        <h2 className="card-titulo">Importar dados da planilha do GT</h2>
        <p className="muted">
          Selecione a planilha de andamento (.xlsx). O sistema localiza as colunas pelo cabeçalho, sugere a correspondência de cada linha com as
          contratações existentes e mostra a revisão antes de gravar. Nada é alterado até você confirmar, e tudo fica registrado na auditoria.
        </p>
        <ul className="small muted" style={{ marginTop: 0 }}>
          <li>Correspondência pelo processo SEI e, na falta dele, pela semelhança do objeto (o número do item muda entre planilhas). Você pode ajustar cada linha.</li>
          <li>Atualiza apenas os campos do painel. Campo em branco na planilha não apaga o valor existente. Modalidade, checklist e responsáveis não são alterados.</li>
          <li>Linhas sem correspondência viram novas contratações, com numeração automática e modalidade sugerida pela coluna “Ata”.</li>
        </ul>
        <label className="btn primario">
          {lendo ? 'Lendo a planilha…' : 'Selecionar planilha (.xlsx)'}
          <input type="file" accept=".xlsx" hidden disabled={lendo || !!gravando} onChange={(e) => { abrirArquivo(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {gravando && <div className="aviso info mt">{gravando}</div>}
        {resultado && (
          <div className={`aviso ${resultado.erros.length ? 'atencao' : 'ok'} mt`}>
            Importação concluída: {resultado.atualizadas} contratação(ões) atualizada(s) e {resultado.novas} nova(s).
            {resultado.erros.length > 0 && <ul>{resultado.erros.map((e) => <li key={e}>{e}</li>)}</ul>}
          </div>
        )}
      </div>

      {leitura && (
        <>
          <div className="grid g4">
            <div className="card kpi"><div className="small muted">Novas demandas</div><div className="evol-kpi" style={{ color: 'var(--green)' }}>{novas.length}</div><div className="small muted">serão criadas</div></div>
            <div className="card kpi"><div className="small muted">Atualizações</div><div className="evol-kpi" style={{ color: 'var(--navy)' }}>{atualizar.length}</div><div className="small muted">contratações com campos alterados</div></div>
            <div className="card kpi"><div className="small muted">Só no sistema</div><div className="evol-kpi" style={{ color: 'var(--red)' }}>{soSistema.length}</div><div className="small muted">{soSistema.length ? soSistema.map((c) => `${num2(c.numero)} ${c.titulo}`).join(' · ') + ' — mantidas' : 'nenhuma'}</div></div>
            <div className="card kpi"><div className="small muted">A conferir</div><div className="evol-kpi" style={{ color: 'var(--gold-ink)' }}>{conferir.length}</div><div className="small muted">correspondência por semelhança ou processo SEI fora do padrão</div></div>
          </div>
          <div className="card">
            <div className="entre mb">
              <div><h2 className="card-titulo" style={{ margin: 0 }}>Revisão antes de gravar</h2><div className="small muted">{leitura.arquivo} · aba “{leitura.aba}” · {leitura.linhas.length} linhas{leitura.ignoradas.length ? ` · colunas não importadas: ${leitura.ignoradas.join(', ')}` : ''}</div></div>
              <div className="linha">
                <button className="btn" onClick={() => { setLeitura(null); setProps([]); }}>Cancelar</button>
                <button className="btn primario" disabled={repetidas.size > 0 || (!novas.length && !atualizar.length)} onClick={() => setConfirmar(true)}>Confirmar importação</button>
              </div>
            </div>
            {repetidas.size > 0 && <div className="aviso erro mb">Há linhas apontando para a mesma contratação. Ajuste a correspondência antes de confirmar.</div>}
            <div className="tabela-wrap">
              <table className="tabela">
                <thead><tr><th>Plan.</th><th>Objeto na planilha</th><th>Correspondência</th><th>Alterações</th></tr></thead>
                <tbody>
                  {plano.map(({ p, i, v, c, dif }) => (
                    <tr key={i} className={repetidas.has(i) ? 'linha-erro' : ''}>
                      <td>{p.linha.n != null ? num2(p.linha.n) : '—'}</td>
                      <td><strong>{tituloDe(limpa(p.linha.valores.objeto))}</strong></td>
                      <td style={{ minWidth: 230 }}>
                        <select className="input" value={v.tipo === 'existente' ? v.id : v.tipo}
                          onChange={(e) => setVinculos((a) => ({ ...a, [i]: e.target.value === 'nova' || e.target.value === 'ignorar' ? { tipo: e.target.value } : { tipo: 'existente', id: e.target.value } }))}>
                          <option value="nova">Nova contratação</option>
                          <option value="ignorar">Não importar esta linha</option>
                          {cs.map((x) => <option key={x.id} value={x.id}>{num2(x.numero)} · {x.titulo}</option>)}
                        </select>
                        {p.sugestao && v.tipo === 'existente' && v.id === p.sugestao.id && (
                          <div className="xs muted mt-s">Sugestão por {p.sugestao.via}{p.sugestao.via === 'objeto' ? ` · semelhança ${Math.round(p.sugestao.score * 100)}%` : ''}{p.sugestao.via === 'objeto' && p.sugestao.score < 0.85 ? ' · confira' : ''}</div>
                        )}
                      </td>
                      <td className="small">
                        {v.tipo === 'ignorar' ? <span className="muted">não será importada</span> : v.tipo === 'nova' ? (
                          <span>Nova contratação · modalidade sugerida: <strong>{modalidadeDe(p.linha.valores).replace('_', ' ')}</strong></span>
                        ) : dif.length === 0 ? <span className="muted">sem alterações</span> : dif.map((d) => (
                          <div key={d.campo}>
                            <strong>{ROTULO[d.campo]}:</strong> <span className="imp-antes">{fmt(d.campo, d.antes)}</span> → <span className="imp-depois">{fmt(d.campo, d.depois)}</span>
                            {d.conferir && <span className="imp-conferir"> conferir {d.conferir}</span>}
                          </div>
                        ))}
                        {v.tipo === 'existente' && c && c.modalidade === 'a_definir' && modalidadeDe(p.linha.valores) !== 'a_definir' && (
                          <div className="xs gold mt-s">A planilha indica modalidade “{modalidadeDe(p.linha.valores).replace('_', ' ')}”; a modalidade não é alterada pela importação — ajuste na contratação se confirmado.</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {confirmar && (
        <Modal titulo="Confirmar importação" onFechar={() => setConfirmar(false)}
          rodape={<><button className="btn" onClick={() => setConfirmar(false)}>Voltar à revisão</button><button className="btn primario" onClick={gravar}>Gravar agora</button></>}>
          <p>Serão gravadas <strong>{atualizar.length}</strong> atualização(ões) e criadas <strong>{novas.length}</strong> nova(s) contratação(ões). {soSistema.length} contratação(ões) que não estão na planilha permanecem como estão.</p>
          <p className="small muted">Cada alteração fica registrada na auditoria com o seu nome, data e hora.</p>
        </Modal>
      )}
    </div>
  );
}
