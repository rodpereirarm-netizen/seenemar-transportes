import { useEffect, useState, type ReactNode } from 'react';
import type { Cor } from '../lib/types';
import { useApp } from '../lib/app';
import { IcX } from './Icones';

export function Selo({ cor = 'cinza', children, quadrado }: { cor?: Cor | null; children: ReactNode; quadrado?: boolean }) {
  return <span className={`selo ${cor ?? 'cinza'} ${quadrado ? 'quadrado' : ''}`}>{children}</span>;
}

/** Selo com a cor configurada na lista suspensa (Manutenção › Listas). */
export function SeloLista({ lista, valor, quadrado }: { lista: string; valor: string | null | undefined; quadrado?: boolean }) {
  const { cat } = useApp();
  if (!valor) return <span className="muted">—</span>;
  const op = cat.opcoes.find((o) => o.lista === lista && o.valor === valor);
  return (
    <Selo cor={op?.cor ?? 'cinza'} quadrado={quadrado}>
      {valor}
    </Selo>
  );
}

const CORES_MODALIDADE: Record<string, Cor> = {
  adesao_arp: 'azul',
  participante_rp: 'roxo',
  dispensa: 'cinza',
  inexigibilidade: 'cinza',
  licitacao_propria: 'verde',
  a_definir: 'ouro',
};
const CURTO_MODALIDADE: Record<string, string> = {
  adesao_arp: 'Adesão ARP',
  participante_rp: 'Participante RP',
  dispensa: 'Dispensa',
  inexigibilidade: 'Inexigibilidade',
  licitacao_propria: 'Licitação própria',
  a_definir: 'A definir',
};
export function SeloModalidade({ codigo }: { codigo: string }) {
  const { modalidade } = useApp();
  return (
    <Selo cor={CORES_MODALIDADE[codigo] ?? 'cinza'} quadrado>
      {CURTO_MODALIDADE[codigo] ?? modalidade(codigo)?.nome ?? codigo}
    </Selo>
  );
}

export function Barra({ partes, fina }: { partes: { valor: number; classe: string }[]; fina?: boolean }) {
  const total = Math.max(1, partes.reduce((s, p) => s + p.valor, 0));
  return (
    <div className={`barra ${fina ? 'fina' : ''}`}>
      {partes.map((p, i) => (
        <span key={i} className={p.classe} style={{ width: `${(p.valor / total) * 100}%` }} />
      ))}
    </div>
  );
}

export function Progresso({ feito, total, fina = true }: { feito: number; total: number; fina?: boolean }) {
  return <Barra fina={fina} partes={[{ valor: feito, classe: 'b-navy' }, { valor: Math.max(0, total - feito), classe: '' }]} />;
}

export function Modal({
  titulo, onFechar, children, rodape, largo,
}: { titulo: ReactNode; onFechar: () => void; children: ReactNode; rodape?: ReactNode; largo?: boolean }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onFechar]);
  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className={`modal ${largo ? 'largo' : ''}`} role="dialog" aria-modal>
        <div className="cab">
          <h2>{titulo}</h2>
          <button className="icone-btn" onClick={onFechar} aria-label="Fechar">
            <IcX />
          </button>
        </div>
        <div className="corpo">{children}</div>
        {rodape && <div className="rodape">{rodape}</div>}
      </div>
    </div>
  );
}

export function Campo({
  rotulo, children, ajuda, erro, className, obrigatorio,
}: { rotulo: ReactNode; children: ReactNode; ajuda?: ReactNode; erro?: string | null; className?: string; obrigatorio?: boolean }) {
  return (
    <div className={`campo ${className ?? ''}`}>
      <label>
        {rotulo}
        {obrigatorio && ' *'}
      </label>
      {children}
      {erro ? <span className="erro">{erro}</span> : ajuda ? <span className="ajuda">{ajuda}</span> : null}
    </div>
  );
}

export function Segmentado<T extends string | boolean>({
  valor, opcoes, onChange, disabled,
}: { valor: T | null | undefined; opcoes: { valor: T; rotulo: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="segmentado" role="radiogroup">
      {opcoes.map((o) => (
        <button
          type="button"
          key={String(o.valor)}
          role="radio"
          aria-checked={valor === o.valor}
          className={valor === o.valor ? 'on' : ''}
          onClick={() => onChange(o.valor)}
          disabled={disabled}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

export function SelectLista({
  lista, valor, onChange, vazio = 'Selecione', className = 'input', disabled,
}: {
  lista: string; valor: string | null | undefined; onChange: (v: string | null) => void;
  vazio?: string; className?: string; disabled?: boolean;
}) {
  const { lista: obter } = useApp();
  const ops = obter(lista);
  const fora = valor && !ops.some((o) => o.valor === valor);
  return (
    <select className={className} value={valor ?? ''} onChange={(e) => onChange(e.target.value || null)} disabled={disabled}>
      <option value="">{vazio}</option>
      {fora && <option value={valor!}>{valor}</option>}
      {ops.map((o) => (
        <option key={o.id} value={o.valor}>
          {o.valor}
        </option>
      ))}
    </select>
  );
}

export function SelectIntegrante({
  valor, onChange, filtro, vazio = 'Selecione um integrante', className = 'input', disabled, invalido,
}: {
  valor: string | null | undefined; onChange: (v: string | null) => void;
  filtro?: (i: import('../lib/types').Integrante) => boolean; vazio?: string; className?: string; disabled?: boolean; invalido?: boolean;
}) {
  const { cat } = useApp();
  const lista = cat.integrantes.filter((i) => i.ativo && (!filtro || filtro(i) || i.id === valor));
  const porFrente: Record<string, typeof lista> = {};
  lista.forEach((i) => {
    const k = i.frente ? `Frente ${i.frente}` : 'Outros';
    (porFrente[k] ??= []).push(i);
  });
  return (
    <select
      className={`${className} ${invalido ? 'invalido' : ''}`}
      value={valor ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
    >
      <option value="">{vazio}</option>
      {Object.entries(porFrente)
        .sort()
        .map(([g, is]) => (
          <optgroup key={g} label={g}>
            {is.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome} · {i.orgao}
              </option>
            ))}
          </optgroup>
        ))}
    </select>
  );
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return <div className="carregando">{texto}</div>;
}

export function Erro({ msg }: { msg: string | null | undefined }) {
  if (!msg) return null;
  return <div className="aviso erro">{msg}</div>;
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="vazio">{children}</div>;
}

// ---- toast global simples ----
type ToastMsg = { texto: string; erro?: boolean; id: number };
let emitir: ((t: ToastMsg) => void) | null = null;
export function toast(texto: string, erro = false) {
  emitir?.({ texto, erro, id: Date.now() });
}
export function ToastHost() {
  const [t, setT] = useState<ToastMsg | null>(null);
  useEffect(() => {
    emitir = setT;
    return () => {
      emitir = null;
    };
  }, []);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), t.erro ? 6000 : 3000);
    return () => clearTimeout(h);
  }, [t]);
  if (!t) return null;
  return (
    <div className={`toast ${t.erro ? 'erro' : ''}`} role="status" onClick={() => setT(null)}>
      {t.texto}
    </div>
  );
}

export function Iniciais({ nome, frente }: { nome: string; frente?: string | null }) {
  const p = nome.split(' ').filter(Boolean);
  const ini = ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  const cls = frente === 'I' ? 'f1' : frente === 'II' ? 'f2' : frente === 'III' ? 'f3' : '';
  return <span className={`avatar ${cls}`}>{ini}</span>;
}
