import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useCarregar } from '../lib/app';
import { ok, supabase, traduzirErro } from '../lib/supabase';
import { data, hojeISO, normalizar, num2, somarDiasISO } from '../lib/format';
import type { Ata } from '../lib/types';
import { Campo, Carregando, Modal, Segmentado, Selo, Vazio, toast } from '../components/ui';
import { IcMais } from '../components/Icones';

export default function Atas() {
  const { cat, pode, recarregarCatalogos } = useApp();
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Ata | null | 'nova'>(null);
  const { dados: uso, carregando } = useCarregar(
    async () => ok(await supabase.from('contratacoes').select('id, numero, titulo, ata_id').not('ata_id', 'is', null)) as { id: string; numero: number; titulo: string; ata_id: string }[],
    [cat.atas.length],
  );

  const hoje = hojeISO();
  const lista = cat.atas.filter((a) => {
    const q = normalizar(busca);
    return !q || normalizar([a.numero, a.orgao_gerenciador, a.objeto, a.fornecedor].join(' ')).includes(q);
  });

  const vig = (a: Ata) => {
    if (!a.vigencia_fim) return { cor: 'cinza' as const, t: 'Vigência não informada' };
    if (a.vigencia_fim < hoje) return { cor: 'vermelho' as const, t: `Vencida em ${data(a.vigencia_fim)}` };
    if (a.vigencia_fim <= somarDiasISO(hoje, 60)) return { cor: 'ouro' as const, t: `Vence em ${data(a.vigencia_fim)}` };
    return { cor: 'verde' as const, t: `Vigente até ${data(a.vigencia_fim)}` };
  };

  async function excluir(a: Ata) {
    if (!confirm(`Excluir a ata ${a.numero}? As contratações vinculadas ficam sem ata.`)) return;
    const { error } = await supabase.from('atas').delete().eq('id', a.id);
    if (error) return toast(traduzirErro(error.message), true);
    toast('Ata excluída.');
    recarregarCatalogos();
  }

  return (
    <>
      <div className="cabecalho">
        <div>
          <div className="eyebrow">Catálogo · {cat.atas.length} atas</div>
          <h1>Atas de registro de preços</h1>
          <p>Atas pesquisadas pelo GT para adesão (carona) ou participação. Gate da Etapa II: sem ata válida, o fluxo de ARP é interrompido.</p>
        </div>
        {pode.gerirAtas && <button className="btn primario" onClick={() => setEditando('nova')}><IcMais width={15} /> Cadastrar ata</button>}
      </div>
      <div className="card mb">
        <input className="input" placeholder="Buscar por número, órgão gerenciador, objeto ou fornecedor" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <div className="card">
        {carregando ? <Carregando /> : lista.length === 0 ? <Vazio>Nenhuma ata cadastrada.</Vazio> : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Ata</th><th>Objeto · fornecedor</th><th>Uso</th><th>Vigência</th><th>Contratações</th><th /></tr></thead>
              <tbody>
                {lista.map((a) => {
                  const v = vig(a);
                  const cs = (uso ?? []).filter((u) => u.ata_id === a.id);
                  return (
                    <tr key={a.id}>
                      <td><div className="obj">{a.numero}</div><div className="sub">{a.orgao_gerenciador}</div></td>
                      <td style={{ maxWidth: 320 }}>
                        <div>{a.objeto ?? '—'}</div>
                        {a.fornecedor && <div className="sub">{a.fornecedor}</div>}
                        {a.observacao && <div className="sub gold">{a.observacao}</div>}
                      </td>
                      <td><Selo cor={a.forma_uso === 'Participante' ? 'roxo' : 'azul'} quadrado>{a.forma_uso}</Selo></td>
                      <td><Selo cor={v.cor}>{v.t}</Selo><div className="sub">{a.situacao}</div></td>
                      <td>{cs.length ? cs.map((c) => <div key={c.id}><Link to={`/contratacoes/${c.id}`}>{num2(c.numero)} · {c.titulo}</Link></div>) : <span className="muted">—</span>}</td>
                      <td className="acoes-td">
                        {a.link && <a className="btn pequeno" href={a.link} target="_blank" rel="noreferrer">Abrir</a>}{' '}
                        {pode.gerirAtas && <button className="btn pequeno" onClick={() => setEditando(a)}>Editar</button>}{' '}
                        {pode.admin && <button className="btn pequeno perigo" onClick={() => excluir(a)}>Excluir</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editando && (
        <AtaForm ata={editando === 'nova' ? undefined : editando} onFechar={() => setEditando(null)}
          onSalvo={async () => { await recarregarCatalogos(); setEditando(null); }} />
      )}
    </>
  );
}

export function AtaForm({ ata, onFechar, onSalvo }: { ata?: Ata; onFechar: () => void; onSalvo: (id: string) => void }) {
  const [f, setF] = useState<Partial<Ata>>(ata ?? { forma_uso: 'Adesão', situacao: 'Vigente' });
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof Ata>(k: K, v: Ata[K] | null) => setF((x) => ({ ...x, [k]: v }));

  async function salvar() {
    if (!f.numero?.trim() || !f.orgao_gerenciador?.trim()) return toast('Número e órgão gerenciador são obrigatórios.', true);
    setSalvando(true);
    const payload = {
      numero: f.numero.trim(), orgao_gerenciador: f.orgao_gerenciador.trim(), objeto: f.objeto?.trim() || null,
      fornecedor: f.fornecedor?.trim() || null, forma_uso: f.forma_uso, vigencia_inicio: f.vigencia_inicio || null,
      vigencia_fim: f.vigencia_fim || null, situacao: f.situacao?.trim() || 'Vigente', link: f.link?.trim() || null,
      observacao: f.observacao?.trim() || null,
    };
    const res = ata
      ? await supabase.from('atas').update(payload).eq('id', ata.id).select('id').single()
      : await supabase.from('atas').insert(payload).select('id').single();
    setSalvando(false);
    if (res.error) return toast(traduzirErro(res.error.message), true);
    toast(ata ? 'Ata atualizada.' : 'Ata cadastrada.');
    onSalvo(res.data.id);
  }

  return (
    <Modal titulo={ata ? `Editar ${ata.numero}` : 'Cadastrar ata de registro de preços'} onFechar={onFechar}
      rodape={<><button className="btn" onClick={onFechar}>Cancelar</button><button className="btn primario" disabled={salvando} onClick={salvar}>Salvar</button></>}>
      <div className="form-grid">
        <Campo rotulo="Número da ata" obrigatorio className="c6"><input className="input" placeholder="ARP 032/2026" value={f.numero ?? ''} onChange={(e) => set('numero', e.target.value)} /></Campo>
        <Campo rotulo="Órgão gerenciador" obrigatorio className="c6"><input className="input" placeholder="SEAD/MA, PRODERJ…" value={f.orgao_gerenciador ?? ''} onChange={(e) => set('orgao_gerenciador', e.target.value)} /></Campo>
        <Campo rotulo="Objeto" className="c12"><input className="input" value={f.objeto ?? ''} onChange={(e) => set('objeto', e.target.value)} /></Campo>
        <Campo rotulo="Fornecedor" className="c6"><input className="input" value={f.fornecedor ?? ''} onChange={(e) => set('fornecedor', e.target.value)} /></Campo>
        <Campo rotulo="Forma de uso pela FAETEC" className="c6">
          <Segmentado valor={f.forma_uso} onChange={(v) => set('forma_uso', v)} opcoes={[{ valor: 'Adesão', rotulo: 'Adesão (carona)' }, { valor: 'Participante', rotulo: 'Participante' }]} />
        </Campo>
        <Campo rotulo="Vigência início" className="c4"><input className="input" type="date" value={f.vigencia_inicio ?? ''} onChange={(e) => set('vigencia_inicio', e.target.value)} /></Campo>
        <Campo rotulo="Vigência fim" className="c4"><input className="input" type="date" value={f.vigencia_fim ?? ''} onChange={(e) => set('vigencia_fim', e.target.value)} /></Campo>
        <Campo rotulo="Situação" className="c4">
          <select className="input" value={f.situacao ?? 'Vigente'} onChange={(e) => set('situacao', e.target.value)}>
            {['Vigente', 'Em assinatura / publicação', 'Saldo esgotado', 'Vencida', 'A verificar'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Link (PNCP, Diário Oficial, SEI)" className="c12"><input className="input" type="url" placeholder="https://" value={f.link ?? ''} onChange={(e) => set('link', e.target.value)} /></Campo>
        <Campo rotulo="Observação" className="c12"><textarea className="input" value={f.observacao ?? ''} onChange={(e) => set('observacao', e.target.value)} /></Campo>
      </div>
    </Modal>
  );
}
