import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/app';
import { supabase, traduzirErro } from '../lib/supabase';
import { PAPEIS, dataHora, normalizar, num2, relativo } from '../lib/format';
import type { Integrante, Papel } from '../lib/types';
import { EVENTO_MENSAGENS } from '../lib/eventos';
import { Carregando, toast } from '../components/ui';

interface Conversa {
  id: string; titulo: string | null; contratacao_id: string | null; contratacao_numero: number | null; contratacao_titulo: string | null;
  ultima_mensagem_em: string; ultimo_texto: string | null; ultimo_autor: string | null; nao_lidas: number; participantes: { id: string; nome: string }[];
}
interface Mensagem { id: string; autor_id: string; texto: string; created_at: string }
interface Destino { nome: string; sub: string; ids: string[]; grupo: boolean }

const avisarMenu = () => window.dispatchEvent(new Event(EVENTO_MENSAGENS));

export default function Mensagens() {
  const { eu, cat } = useApp();
  const [params, setParams] = useSearchParams();
  const ativa = params.get('c');
  const [conversas, setConversas] = useState<Conversa[] | null>(null);
  const [compondo, setCompondo] = useState(false);

  const ativos = useMemo(() => cat.integrantes.filter((i) => i.ativo && i.id !== eu?.id), [cat.integrantes, eu]);
  const diretorio = useMemo<Destino[]>(() => {
    const grupos: [string, Papel | '*'][] = [['Coordenação', 'coordenacao'], ['Conformidade', 'conformidade'], ['Elaboração de artefatos', 'elaboracao'], ['Ponto focal FAETEC', 'ponto_focal'], ['Todos os integrantes', '*']];
    const g = grupos.map(([nome, p]) => {
      const ids = ativos.filter((i) => p === '*' || i.papel === p).map((i) => i.id);
      return { nome, sub: `grupo · ${ids.length} integrante(s)`, ids, grupo: true };
    }).filter((d) => d.ids.length > 0);
    const pessoas = ativos.map((i) => ({ nome: i.nome, sub: `${PAPEIS[i.papel].rotulo} · ${i.orgao}`, ids: [i.id], grupo: false }));
    return [...g, ...pessoas];
  }, [ativos]);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.rpc('fn_minhas_conversas');
    if (error) return toast(traduzirErro(error.message), true);
    setConversas((data ?? []) as Conversa[]);
  }, []);

  useEffect(() => {
    carregar();
    const h = setInterval(carregar, 30_000);
    return () => clearInterval(h);
  }, [carregar]);

  const abrir = (id: string) => { setCompondo(false); setParams({ c: id }); };
  const atual = conversas?.find((c) => c.id === ativa) ?? null;

  if (!conversas) return <Carregando />;

  return (
    <>
      <div className="cabecalho">
        <div>
          <div className="eyebrow">Comunicação entre integrantes</div>
          <h1>Mensagens</h1>
          <p>Conversas individuais ou em grupo, opcionalmente vinculadas a uma contratação. Só os participantes leem; as mensagens não podem ser editadas nem apagadas.</p>
        </div>
        <div className="acoes"><button className="btn primario" onClick={() => { setCompondo(true); setParams({}); }}>+ Nova mensagem</button></div>
      </div>
      <div className="msg-app">
        <div className="msg-lista">
          {conversas.length === 0 && <div className="vazio small">Nenhuma conversa ainda. Use “+ Nova mensagem”.</div>}
          {conversas.map((c) => (
            <button key={c.id} type="button" className={`msg-item ${c.id === ativa && !compondo ? 'ativa' : ''}`} onClick={() => abrir(c.id)}>
              <span className="msg-av">{tituloConversa(c, eu?.id).charAt(0).toUpperCase()}</span>
              <span className="msg-resumo">
                <span className="entre"><b>{tituloConversa(c, eu?.id)}</b>{c.nao_lidas > 0 && <span className="msg-cont">{c.nao_lidas}</span>}</span>
                <span className="small muted linha-unica">{c.ultimo_autor ? `${c.ultimo_autor.split(' ')[0]}: ` : ''}{c.ultimo_texto}</span>
                <span className="xs muted">{relativo(c.ultima_mensagem_em)}</span>
              </span>
            </button>
          ))}
        </div>
        {compondo ? (
          <Compor diretorio={diretorio} ativos={ativos} onCancelar={() => setCompondo(false)}
            onCriada={(id) => { carregar(); avisarMenu(); abrir(id); }} />
        ) : atual ? (
          <PainelConversa conversa={atual} ativos={ativos} onEnviada={() => { carregar(); avisarMenu(); }} />
        ) : (
          <div className="msg-vazio vazio">Selecione uma conversa ou clique em “+ Nova mensagem”.</div>
        )}
      </div>
    </>
  );
}

function tituloConversa(c: Conversa, eu?: string) {
  if (c.titulo) return c.titulo;
  const outros = c.participantes.filter((p) => p.id !== eu).map((p) => p.nome.split(' ')[0]);
  const base = outros.length ? outros.join(', ') : 'Somente você';
  return c.contratacao_numero ? `${base} · ${num2(c.contratacao_numero)} ${c.contratacao_titulo}` : base;
}

/** Destaca @Nome dos integrantes no texto. */
function comMencoes(texto: string, nomes: string[]) {
  const ord = [...nomes].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!ord.length) return texto;
  const re = new RegExp(`(@(?:${ord.join('|')}))`, 'g');
  return texto.split(re).map((p, i) => (i % 2 ? <span key={i} className="msg-mencao">{p}</span> : p));
}

function mencionados(texto: string, pessoas: Integrante[]) {
  return pessoas.filter((p) => texto.includes('@' + p.nome)).map((p) => p.id);
}

function Sugestoes({ itens, onEscolher, acima }: { itens: Destino[]; onEscolher: (d: Destino) => void; acima?: boolean }) {
  if (!itens.length) return null;
  return (
    <div className={`msg-sug ${acima ? 'acima' : ''}`} role="listbox">
      {itens.map((d) => (
        <button key={d.nome} type="button" role="option" aria-selected="false" onMouseDown={(e) => { e.preventDefault(); onEscolher(d); }}>
          <span>@{d.nome}</span><span className="xs muted">{d.sub}</span>
        </button>
      ))}
    </div>
  );
}
const filtrar = (dir: Destino[], q: string) => { const n = normalizar(q.replace(/^@/, '').trim()); return dir.filter((d) => !n || normalizar(d.nome).includes(n)).slice(0, 8); };

function Compor({ diretorio, ativos, onCancelar, onCriada }: { diretorio: Destino[]; ativos: Integrante[]; onCancelar: () => void; onCriada: (id: string) => void }) {
  const { eu } = useApp();
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [busca, setBusca] = useState('');
  const [contratacao, setContratacao] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [lista, setLista] = useState<{ id: string; numero: number; titulo: string }[]>([]);
  const inp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('contratacoes').select('id, numero, titulo').eq('rascunho', false).order('numero').then(({ data }) => setLista(data ?? []));
    inp.current?.focus();
  }, []);

  const sug = busca.trim() ? filtrar(diretorio.filter((d) => !destinos.some((x) => x.nome === d.nome)), busca) : [];
  const escolher = (d: Destino) => { setDestinos((a) => [...a, d]); setBusca(''); inp.current?.focus(); };
  const tecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setBusca('');
    if (e.key === 'Backspace' && !busca && destinos.length) setDestinos((a) => a.slice(0, -1));
    if (e.key === 'Enter' && sug[0]) { e.preventDefault(); escolher(sug[0]); }
  };

  async function enviar() {
    const ids = [...new Set(destinos.flatMap((d) => d.ids))].filter((id) => id !== eu?.id);
    if (!ids.length) return toast('Informe ao menos um destinatário com @.', true);
    if (!texto.trim()) return toast('Escreva a mensagem.', true);
    setEnviando(true);
    const { data, error } = await supabase.rpc('fn_criar_conversa', {
      p_participantes: ids, p_texto: texto.trim(), p_contratacao: contratacao || null, p_titulo: null, p_mencoes: mencionados(texto, ativos),
    });
    setEnviando(false);
    if (error) return toast(traduzirErro(error.message), true);
    toast(`Mensagem enviada a ${ids.length} destinatário(s).`);
    onCriada(data as string);
  }

  return (
    <div className="msg-thread">
      <div className="msg-cab entre">
        <div><b>Nova mensagem</b><div className="small muted">Digite @ no campo “Para” para escolher pessoas ou grupos</div></div>
        <button className="btn" onClick={onCancelar}>Cancelar</button>
      </div>
      <div className="msg-compor">
        <label className="rot" htmlFor="msg-para">Para</label>
        <div className="msg-para" onClick={() => inp.current?.focus()}>
          {destinos.map((d, k) => (
            <span key={d.nome} className={`msg-chip ${d.grupo ? 'grupo' : ''}`}>@{d.nome}
              <button type="button" aria-label={`Remover ${d.nome}`} onClick={() => setDestinos((a) => a.filter((_, i) => i !== k))}>×</button>
            </span>
          ))}
          <input id="msg-para" ref={inp} value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={tecla}
            placeholder={destinos.length ? '' : '@ nome do integrante ou grupo'} autoComplete="off" />
          <Sugestoes itens={sug} onEscolher={escolher} />
        </div>
        <label className="rot" htmlFor="msg-ctr">Vincular à contratação (opcional)</label>
        <select id="msg-ctr" className="input" value={contratacao} onChange={(e) => setContratacao(e.target.value)}>
          <option value="">Nenhuma</option>
          {lista.map((c) => <option key={c.id} value={c.id}>{num2(c.numero)} · {c.titulo}</option>)}
        </select>
        <label className="rot" htmlFor="msg-txt">Mensagem</label>
        <CampoMensagem id="msg-txt" valor={texto} onChange={setTexto} diretorio={diretorio.filter((d) => !d.grupo)} linhas={4} />
        <div className="linha" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primario" disabled={enviando} onClick={enviar}>{enviando ? 'Enviando…' : 'Enviar'}</button>
        </div>
        <p className="small muted" style={{ margin: 0 }}>Cada destinatário recebe um aviso no sino de notificações. Quem for mencionado com @ recebe um aviso específico.</p>
      </div>
    </div>
  );
}

/** Campo de texto com sugestão de @menção. */
function CampoMensagem({ id, valor, onChange, diretorio, linhas = 1, onEnter }: { id: string; valor: string; onChange: (v: string) => void; diretorio: Destino[]; linhas?: number; onEnter?: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [q, setQ] = useState<string | null>(null);
  const atualizar = (v: string, pos: number) => { onChange(v); const m = v.slice(0, pos).match(/@([^@\n]*)$/); setQ(m ? m[1] : null); };
  const completo = q != null && diretorio.some((d) => normalizar(d.nome) === normalizar(q.trim()));
  const sug = q != null && !completo ? filtrar(diretorio, q) : [];
  const escolher = (d: Destino) => {
    const el = ref.current!; const pos = el.selectionStart;
    const ini = valor.slice(0, pos).lastIndexOf('@');
    const novo = valor.slice(0, ini) + '@' + d.nome + ' ' + valor.slice(pos);
    onChange(novo); setQ(null);
    requestAnimationFrame(() => { el.focus(); const p = ini + d.nome.length + 2; el.setSelectionRange(p, p); });
  };
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <textarea id={id} ref={ref} className="input" rows={linhas} value={valor} placeholder="Escreva a mensagem · digite @ para mencionar alguém"
        onChange={(e) => atualizar(e.target.value, e.target.selectionStart)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setQ(null); return; }
          if (e.key === 'Enter' && sug[0] && q != null) { e.preventDefault(); escolher(sug[0]); return; }
          if (e.key === 'Enter' && !e.shiftKey && onEnter) { e.preventDefault(); onEnter(); }
        }}
        onBlur={() => setTimeout(() => setQ(null), 150)} />
      <Sugestoes itens={sug} onEscolher={escolher} acima={linhas === 1} />
    </div>
  );
}

function PainelConversa({ conversa, ativos, onEnviada }: { conversa: Conversa; ativos: Integrante[]; onEnviada: () => void }) {
  const { eu, cat } = useApp();
  const [msgs, setMsgs] = useState<Mensagem[] | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const corpo = useRef<HTMLDivElement>(null);
  const nomes = useMemo(() => cat.integrantes.map((i) => i.nome), [cat.integrantes]);
  const nomeDe = (id: string) => cat.integrantes.find((i) => i.id === id)?.nome ?? '—';
  const diretorio = useMemo(() => ativos.map((i) => ({ nome: i.nome, sub: `${PAPEIS[i.papel].rotulo} · ${i.orgao}`, ids: [i.id], grupo: false })), [ativos]);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('mensagens').select('id, autor_id, texto, created_at').eq('conversa_id', conversa.id).order('created_at');
    if (error) return toast(traduzirErro(error.message), true);
    setMsgs(data ?? []);
    await supabase.rpc('fn_marcar_conversa_lida', { p_conversa: conversa.id });
    window.dispatchEvent(new Event(EVENTO_MENSAGENS));
  }, [conversa.id]);

  useEffect(() => {
    setMsgs(null);
    carregar();
    const h = setInterval(carregar, 30_000);
    return () => clearInterval(h);
  }, [carregar]);
  useEffect(() => { corpo.current?.scrollTo(0, corpo.current.scrollHeight); }, [msgs]);

  async function enviar() {
    const t = texto.trim();
    if (!t || !eu) return;
    setEnviando(true);
    const { error } = await supabase.from('mensagens').insert({ conversa_id: conversa.id, autor_id: eu.id, texto: t, mencoes: mencionados(t, ativos) });
    setEnviando(false);
    if (error) return toast(traduzirErro(error.message), true);
    setTexto('');
    await carregar();
    onEnviada();
  }

  return (
    <div className="msg-thread">
      <div className="msg-cab entre">
        <div>
          <b>{tituloConversa(conversa, eu?.id)}</b>
          <div className="small muted">{conversa.participantes.map((p) => (p.id === eu?.id ? 'Você' : p.nome)).join(' · ')}</div>
        </div>
        {conversa.contratacao_id && <Link className="btn" to={`/contratacoes/${conversa.contratacao_id}`}>Abrir contratação {num2(conversa.contratacao_numero)}</Link>}
      </div>
      <div className="msg-corpo" ref={corpo}>
        {!msgs ? <Carregando /> : msgs.map((m) => {
          const minha = m.autor_id === eu?.id;
          return (
            <div key={m.id} className={`msg-bolha ${minha ? 'eu' : ''}`}>
              {!minha && <div className="small" style={{ fontWeight: 700 }}>{nomeDe(m.autor_id)}</div>}
              <div className="msg-texto">{comMencoes(m.texto, nomes)}</div>
              <div className="meta" title={dataHora(m.created_at)}>{relativo(m.created_at)}</div>
            </div>
          );
        })}
      </div>
      <div className="msg-envio">
        <CampoMensagem id="msg-resp" valor={texto} onChange={setTexto} diretorio={diretorio} onEnter={enviar} />
        <button className="btn primario" disabled={enviando || !texto.trim()} onClick={enviar}>Enviar</button>
      </div>
    </div>
  );
}
