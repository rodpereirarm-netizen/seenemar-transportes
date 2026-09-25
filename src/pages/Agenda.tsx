import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useCarregar } from '../lib/app';
import { ok, supabase } from '../lib/supabase';
import { hojeISO, num2 } from '../lib/format';
import type { AtividadeView, ContratacaoView } from '../lib/types';
import { Carregando, Erro } from '../components/ui';

type Tipo = 'legal' | 'meta' | 'contratacao' | 'ata';
interface Evento { data: string; tipo: Tipo; titulo: string; detalhe: string; destino: string }
type Modo = 'dia' | 'semana' | 'mes';

const ROTULO: Record<Tipo, string> = { legal: 'Prazo legal', meta: 'Prazo-meta', contratacao: 'Data-meta da contratação', ata: 'Fim de vigência de ata' };
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const deIso = (s: string) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
const ABERTA = (a: AtividadeView) => a.status !== 'concluida' && a.status !== 'nao_se_aplica';

export default function Agenda() {
  const { cat } = useApp();
  const nav = useNavigate();
  const [modo, setModo] = useState<Modo>('mes');
  const [ref, setRef] = useState(() => deIso(hojeISO()));

  const { dados, erro, carregando } = useCarregar(async () => {
    const [c, a] = await Promise.all([
      supabase.from('vw_contratacoes').select('*').order('numero'),
      supabase.from('vw_atividades').select('*').or('prazo_legal.not.is.null,prazo_meta.not.is.null').limit(10000),
    ]);
    return { contratacoes: ok(c) as ContratacaoView[], atividades: ok(a) as AtividadeView[] };
  }, []);

  const eventos = useMemo<Evento[]>(() => {
    if (!dados) return [];
    const ev: Evento[] = [];
    const ctr = new Map(dados.contratacoes.map((c) => [c.id, c]));
    const nome = (id: string) => { const c = ctr.get(id); return c ? `${num2(c.numero)} · ${c.titulo}` : ''; };
    dados.atividades.filter(ABERTA).forEach((a) => {
      if (a.prazo_legal) ev.push({ data: a.prazo_legal, tipo: 'legal', titulo: nome(a.contratacao_id), detalhe: a.nome, destino: `/contratacoes/${a.contratacao_id}` });
      if (a.prazo_meta) ev.push({ data: a.prazo_meta, tipo: 'meta', titulo: nome(a.contratacao_id), detalhe: a.nome, destino: `/contratacoes/${a.contratacao_id}` });
    });
    dados.contratacoes.filter((c) => c.data_meta && !c.rascunho)
      .forEach((c) => ev.push({ data: c.data_meta!, tipo: 'contratacao', titulo: `${num2(c.numero)} · ${c.titulo}`, detalhe: 'Data-meta da contratação', destino: `/contratacoes/${c.id}` }));
    cat.atas.filter((a) => a.vigencia_fim).forEach((a) => {
      const vinc = dados.contratacoes.filter((c) => c.ata_id === a.id);
      if (vinc.length) vinc.forEach((c) => ev.push({ data: a.vigencia_fim!, tipo: 'ata', titulo: `${num2(c.numero)} · ${c.titulo}`, detalhe: `Fim de vigência · ${a.numero} (${a.orgao_gerenciador})`, destino: `/contratacoes/${c.id}` }));
      else ev.push({ data: a.vigencia_fim!, tipo: 'ata', titulo: a.numero, detalhe: `Fim de vigência · ${a.orgao_gerenciador}`, destino: '/atas' });
    });
    return ev.sort((x, y) => (x.data < y.data ? -1 : x.data > y.data ? 1 : 0));
  }, [dados, cat.atas]);

  if (carregando) return <Carregando />;
  if (erro) return <Erro msg={erro} />;

  const doDia = (d: Date) => eventos.filter((e) => e.data === iso(d));
  const hoje = hojeISO();
  const abrirDia = (d: Date) => { setRef(d); setModo('dia'); };
  const passo = (k: number) => {
    const d = new Date(ref);
    if (modo === 'mes') d.setMonth(d.getMonth() + k, 1); else d.setDate(d.getDate() + (modo === 'semana' ? 7 : 1) * k);
    setRef(d);
  };
  const Ev = ({ e }: { e: Evento }) => (
    <button type="button" className={`agenda-ev ${e.tipo}`} title={`${ROTULO[e.tipo]} · ${e.titulo} · ${e.detalhe}`}
      onClick={(x) => { x.stopPropagation(); nav(e.destino); }}>
      {e.titulo} · {e.detalhe}
    </button>
  );

  let titulo = '';
  let corpo;
  if (modo === 'mes') {
    titulo = `${MESES[ref.getMonth()]} de ${ref.getFullYear()}`;
    const ini = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const d0 = new Date(ini); d0.setDate(1 - ((ini.getDay() + 6) % 7));
    const dias = Array.from({ length: 42 }, (_, i) => { const d = new Date(d0); d.setDate(d0.getDate() + i); return d; });
    corpo = (
      <div className="agenda-cal">
        {DIAS.map((d) => <div key={d} className="dow">{d}</div>)}
        {dias.map((d) => (
          <div key={iso(d)} className={`dia ${d.getMonth() !== ref.getMonth() ? 'fora' : ''} ${iso(d) === hoje ? 'hoje' : ''}`} onClick={() => abrirDia(d)}>
            <span className="num">{d.getDate()}</span>
            {doDia(d).slice(0, 3).map((e, i) => <Ev key={i} e={e} />)}
            {doDia(d).length > 3 && <span className="xs muted">+{doDia(d).length - 3} prazo(s)</span>}
          </div>
        ))}
      </div>
    );
  } else if (modo === 'semana') {
    const d0 = new Date(ref); d0.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
    const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(d0); d.setDate(d0.getDate() + i); return d; });
    titulo = `${dias[0].toLocaleDateString('pt-BR')} a ${dias[6].toLocaleDateString('pt-BR')}`;
    corpo = (
      <div className="agenda-cal">
        {dias.map((d) => <div key={'c' + iso(d)} className="dow">{d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>)}
        {dias.map((d) => (
          <div key={iso(d)} className={`dia alto ${iso(d) === hoje ? 'hoje' : ''}`} onClick={() => abrirDia(d)}>
            {doDia(d).map((e, i) => <Ev key={i} e={e} />)}
          </div>
        ))}
      </div>
    );
  } else {
    titulo = ref.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const l = doDia(ref);
    corpo = l.length ? (
      <div className="agenda-lista">
        {l.map((e, i) => (
          <button key={i} type="button" className="item" onClick={() => nav(e.destino)}>
            <span className={`agenda-ev ${e.tipo} fixo`}>{ROTULO[e.tipo]}</span>
            <span className="txt"><b>{e.titulo}</b><span className="small muted">{e.detalhe}</span></span>
            <span className="abrir-link">Abrir →</span>
          </button>
        ))}
      </div>
    ) : <div className="vazio">Nenhum prazo neste dia.</div>;
  }

  const proximos = eventos.filter((e) => e.data >= hoje).slice(0, 8);

  return (
    <>
      <div className="cabecalho">
        <div>
          <div className="eyebrow">Prazos legais, prazos-meta e vigência de atas</div>
          <h1>Agenda de prazos</h1>
          <p>Clique no dia para ver o detalhe; clique no prazo para abrir a contratação.</p>
        </div>
        <div className="acoes">
          <div className="segmentado">
            {([['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']] as [Modo, string][]).map(([k, r]) => (
              <button key={k} type="button" className={modo === k ? 'on' : ''} onClick={() => setModo(k)}>{r}</button>
            ))}
          </div>
        </div>
      </div>
      {eventos.length === 0 && (
        <div className="aviso info mb">Nenhum prazo registrado até o momento. A agenda é preenchida quando as equipes registram data de envio (prazo legal), prazo-meta das atividades, data-meta da contratação ou vigência das atas.</div>
      )}
      <div className="grid g-3-1">
        <div className="card">
          <div className="entre mb">
            <button type="button" className="btn pequeno" onClick={() => passo(-1)}>‹ Anterior</button>
            <strong>{titulo}</strong>
            <div className="linha">
              <button type="button" className="btn pequeno" onClick={() => setRef(deIso(hoje))}>Hoje</button>
              <button type="button" className="btn pequeno" onClick={() => passo(1)}>Próximo ›</button>
            </div>
          </div>
          {corpo}
          <div className="agenda-legenda">
            {(Object.keys(ROTULO) as Tipo[]).map((t) => <span key={t}><i className={t} />{ROTULO[t]}</span>)}
          </div>
        </div>
        <div className="card">
          <h2 className="card-titulo">Próximos prazos</h2>
          {proximos.length === 0 ? <div className="vazio small">Nenhum prazo futuro registrado.</div> : (
            <div className="agenda-lista compacta">
              {proximos.map((e, i) => (
                <button key={i} type="button" className="item" onClick={() => nav(e.destino)}>
                  <span className="data">{deIso(e.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                  <span className="txt"><b>{e.titulo}</b><span className="small muted">{ROTULO[e.tipo]} · {e.detalhe}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
