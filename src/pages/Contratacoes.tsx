import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp, useCarregar } from '../lib/app';
import { ok, supabase, traduzirErro } from '../lib/supabase';
import { ROMANOS, data, moeda, normalizar, num2 } from '../lib/format';
import { exportarExcel } from '../lib/excel';
import type { ContratacaoView } from '../lib/types';
import { Carregando, Erro, Progresso, SelectLista, SeloLista, SeloModalidade, toast } from '../components/ui';
import { IcBaixar, IcMais } from '../components/Icones';

type Chip = 'todas' | 'andamento' | 'aguardando' | 'devolvidas' | 'divergencias' | 'semjust' | 'semresp' | 'vencidos' | 'encerradas';

const CHIPS: { id: Chip; rotulo: string; teste: (c: ContratacaoView) => boolean }[] = [
  { id: 'todas', rotulo: 'Todas', teste: (c) => !['Concluída', 'Cancelada'].includes(c.situacao) },
  { id: 'andamento', rotulo: 'Em andamento', teste: (c) => c.situacao === 'Em andamento' },
  { id: 'aguardando', rotulo: 'Aguardando', teste: (c) => c.situacao === 'Aguardando' },
  { id: 'devolvidas', rotulo: 'Devolvidas', teste: (c) => c.situacao === 'Devolvida' },
  { id: 'divergencias', rotulo: 'Divergências', teste: (c) => c.situacao === 'Divergência' },
  { id: 'semjust', rotulo: 'Sem justificativa', teste: (c) => !c.justificativa_recebida },
  { id: 'semresp', rotulo: 'Sem responsável', teste: (c) => Boolean(c.atividade_atual_id) && !c.atividade_atual_responsavel_id },
  { id: 'vencidos', rotulo: 'Prazo vencido', teste: (c) => c.prazos_vencidos > 0 },
  { id: 'encerradas', rotulo: 'Concluídas/canceladas', teste: (c) => ['Concluída', 'Cancelada'].includes(c.situacao) },
];

export default function Contratacoes() {
  const { cat, pode, lista } = useApp();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState('');
  const [fMod, setFMod] = useState('');
  const [fResp, setFResp] = useState('');
  const [fSit, setFSit] = useState('');
  const [chip, setChip] = useState<Chip>('todas');
  const fEtapa = params.get('etapa') ?? '';
  const visao = params.get('visao') === 'planilha' ? 'planilha' : 'lista';

  const { dados, erro, carregando, recarregar } = useCarregar(
    async () => ok(await supabase.from('vw_contratacoes').select('*').order('numero')) as ContratacaoView[],
    [],
  );

  const base = useMemo(() => {
    if (!dados) return [];
    const q = normalizar(busca.trim());
    return dados.filter(
      (c) =>
        (!q ||
          normalizar(
            [c.titulo, c.objeto, c.processo_sei, c.processo_sei_origem, c.via_descricao, c.ata_numero, num2(c.numero)].join(' '),
          ).includes(q)) &&
        (!fMod || c.modalidade === fMod) &&
        (!fEtapa || String(c.etapa_atual) === fEtapa) &&
        (!fResp || c.atividade_atual_responsavel_id === fResp || c.responsavel_geral_id === fResp) &&
        (!fSit || c.situacao === fSit),
    );
  }, [dados, busca, fMod, fEtapa, fResp, fSit]);

  const teste = CHIPS.find((x) => x.id === chip)!.teste;
  const linhas = base.filter(teste);
  const valorInformado = linhas.filter((c) => c.valor_estimado != null);

  async function exportar() {
    await exportarExcel(`contratacoes-gt-propag-${new Date().toISOString().slice(0, 10)}`, [
      {
        nome: 'Contratações',
        titulo: 'GT PROPAG · Painel de contratações',
        subtitulo: `Extraído em ${new Date().toLocaleString('pt-BR')} · ${linhas.length} demandas`,
        linhas,
        colunas: [
          { titulo: 'Nº', valor: (c: ContratacaoView) => c.numero, largura: 6 },
          { titulo: 'Objeto', valor: (c: ContratacaoView) => c.titulo, largura: 28 },
          { titulo: 'Descrição do objeto', valor: (c: ContratacaoView) => c.objeto, largura: 50 },
          { titulo: 'Processo antigo', valor: (c: ContratacaoView) => c.processo_sei_origem, largura: 24 },
          { titulo: 'Processo SEI', valor: (c: ContratacaoView) => c.processo_sei, largura: 24 },
          { titulo: 'Modalidade', valor: (c: ContratacaoView) => c.modalidade_nome, largura: 18 },
          { titulo: 'Via / ata', valor: (c: ContratacaoView) => c.via_descricao ?? c.ata_numero, largura: 26 },
          { titulo: 'Etapa atual', valor: (c: ContratacaoView) => (c.etapa_atual ? `${ROMANOS[c.etapa_atual]} · ${c.etapa_atual_nome}` : ''), largura: 26 },
          { titulo: 'Progresso na etapa', valor: (c: ContratacaoView) => `${c.etapa_concluidas ?? 0} de ${c.etapa_total ?? 0}`, largura: 12 },
          { titulo: 'Atividade atual', valor: (c: ContratacaoView) => c.atividade_atual_nome, largura: 28 },
          { titulo: 'Responsável atividade', valor: (c: ContratacaoView) => c.atividade_atual_responsavel_nome ?? 'Sem responsável', largura: 26 },
          { titulo: 'Responsável geral', valor: (c: ContratacaoView) => c.responsavel_geral_nome, largura: 26 },
          { titulo: 'Situação', valor: (c: ContratacaoView) => c.situacao, largura: 16 },
          { titulo: 'Prioridade', valor: (c: ContratacaoView) => c.prioridade, largura: 10 },
          { titulo: 'Justificativa recebida', valor: (c: ContratacaoView) => (c.justificativa_recebida ? 'Sim' : 'Não'), largura: 12 },
          { titulo: 'DOD · status', valor: (c: ContratacaoView) => c.dod_status, largura: 16 },
          { titulo: 'DOD · observação', valor: (c: ContratacaoView) => c.dod_obs, largura: 40 },
          { titulo: 'ARP · status', valor: (c: ContratacaoView) => c.ata_status, largura: 14 },
          { titulo: 'ARP · observação', valor: (c: ContratacaoView) => c.ata_obs, largura: 40 },
          { titulo: 'Manifestação TI · status', valor: (c: ContratacaoView) => c.ti_status, largura: 14 },
          { titulo: 'Manifestação TI · observação', valor: (c: ContratacaoView) => c.ti_obs, largura: 24 },
          { titulo: 'Fase preparatória · status', valor: (c: ContratacaoView) => c.docs_prep_status, largura: 28 },
          { titulo: 'Fase preparatória · observação', valor: (c: ContratacaoView) => c.docs_prep_obs, largura: 34 },
          { titulo: 'Valor global estimado', valor: (c: ContratacaoView) => (c.valor_estimado == null ? null : Number(c.valor_estimado)), largura: 18, formato: '"R$" #,##0.00' },
          { titulo: 'Prazos vencidos', valor: (c: ContratacaoView) => c.prazos_vencidos, largura: 10 },
          { titulo: 'Próximo prazo', valor: (c: ContratacaoView) => data(c.proximo_prazo), largura: 12 },
          { titulo: 'Último andamento', valor: (c: ContratacaoView) => c.ultimo_andamento, largura: 40 },
          { titulo: 'Observação', valor: (c: ContratacaoView) => c.observacao, largura: 40 },
        ],
      },
    ]);
  }

  function setEtapa(v: string) {
    const p = new URLSearchParams(params);
    if (v) p.set('etapa', v); else p.delete('etapa');
    setParams(p, { replace: true });
  }
  function setVisao(v: string) {
    const p = new URLSearchParams(params);
    if (v === 'planilha') p.set('visao', 'planilha'); else p.delete('visao');
    setParams(p, { replace: true });
  }

  if (carregando && !dados) return <Carregando />;

  return (
    <>
      <div className="cabecalho">
        <div>
          <div className="eyebrow">Carteira · {dados?.filter(CHIPS[0].teste).length ?? 0} demandas</div>
          <h1>Contratações</h1>
          <p>Todas as demandas do GT, com etapa, atividade atual, responsável e situação</p>
        </div>
        <div className="acoes">
          <button className="btn" onClick={exportar}><IcBaixar width={15} /> Exportar Excel</button>
          {pode.criarContratacao && (
            <Link className="btn primario" to="/contratacoes/nova"><IcMais width={15} /> Nova contratação</Link>
          )}
        </div>
      </div>
      <Erro msg={erro} />

      <div className="card mb">
        <div className="filtros">
          <div className="campo">
            <label>Buscar</label>
            <input className="input" placeholder="objeto, nº SEI ou ata" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="campo">
            <label>Modalidade</label>
            <select className="input" value={fMod} onChange={(e) => setFMod(e.target.value)}>
              <option value="">Todas</option>
              {cat.modalidades.map((m) => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Etapa</label>
            <select className="input" value={fEtapa} onChange={(e) => setEtapa(e.target.value)}>
              <option value="">Todas</option>
              {cat.etapas.map((e) => <option key={e.numero} value={e.numero}>{ROMANOS[e.numero]} · {e.nome}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Responsável</label>
            <select className="input" value={fResp} onChange={(e) => setFResp(e.target.value)}>
              <option value="">Todos</option>
              {cat.integrantes.filter((i) => i.ativo).map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Situação</label>
            <select className="input" value={fSit} onChange={(e) => setFSit(e.target.value)}>
              <option value="">Todas</option>
              {lista('situacao').map((o) => <option key={o.id}>{o.valor}</option>)}
            </select>
          </div>
        </div>
        <div className="chips mt">
          {CHIPS.map((x) => (
            <button key={x.id} className={`chip ${chip === x.id ? 'on' : ''}`} onClick={() => setChip(x.id)}>
              {x.rotulo} · {base.filter(x.teste).length}
            </button>
          ))}
        </div>
      </div>

      <div className="abas">
        <button className={`aba ${visao === 'lista' ? 'on' : ''}`} onClick={() => setVisao('lista')}>Lista</button>
        <button className={`aba ${visao === 'planilha' ? 'on' : ''}`} onClick={() => setVisao('planilha')}>
          Planilha de andamento (edição rápida)
        </button>
      </div>

      {visao === 'lista' ? (
        <div className="card">
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº</th><th>Objeto · processo SEI</th><th>Modalidade</th><th>Etapa</th><th>Via / ata</th>
                  <th>Atividade atual · responsável</th><th className="right">Valor</th><th>Situação</th><th />
                </tr>
              </thead>
              <tbody>
                {linhas.map((c) => (
                  <tr key={c.id} className="clicavel" onClick={() => nav(`/contratacoes/${c.id}`)}>
                    <td className="num">{num2(c.numero)}</td>
                    <td style={{ maxWidth: 240 }}>
                      <div className="obj">{c.titulo}{c.rascunho && <span className="selo cinza" style={{ marginLeft: 6 }}>Rascunho</span>}</div>
                      <div className="sub">{c.processo_sei ?? (c.justificativa_recebida ? 'Processo não informado' : '—')}</div>
                    </td>
                    <td><SeloModalidade codigo={c.modalidade} /></td>
                    <td style={{ minWidth: 130 }}>
                      <div className="xs muted" style={{ marginBottom: 4 }}>Etapa {ROMANOS[c.etapa_atual ?? 1]}</div>
                      <Progresso feito={c.etapa_concluidas ?? 0} total={c.etapa_total ?? 0} />
                      <div className="sub" style={{ marginTop: 3 }}>{c.etapa_concluidas ?? 0} de {c.etapa_total ?? 0} atividades</div>
                    </td>
                    <td className="small" style={{ maxWidth: 140 }}>{c.via_descricao ?? c.ata_numero ?? '—'}</td>
                    <td style={{ maxWidth: 200 }}>
                      <div className="small">{c.atividade_atual_nome ?? 'Checklist concluído'}</div>
                      <div className={`sub ${c.atividade_atual_responsavel_nome ? '' : 'red'}`}>
                        {c.atividade_atual_id ? c.atividade_atual_responsavel_nome ?? 'Sem responsável' : ''}
                      </div>
                      {c.prazos_vencidos > 0 && <div className="sub red">● {c.prazos_vencidos} prazo(s) vencido(s)</div>}
                    </td>
                    <td className="right nowrap">{moeda(c.valor_estimado, true)}</td>
                    <td><SeloLista lista="situacao" valor={c.situacao} /></td>
                    <td className="acoes-td"><Link className="abrir" to={`/contratacoes/${c.id}`} onClick={(e) => e.stopPropagation()} aria-label="Abrir">›</Link></td>
                  </tr>
                ))}
                {linhas.length === 0 && <tr><td colSpan={9} className="vazio">Nenhuma contratação com esses filtros.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="rodape-tabela">
            <span>
              {linhas.length} contratações · valor informado {moeda(valorInformado.reduce((s, c) => s + Number(c.valor_estimado), 0), true)} ({valorInformado.length} demandas)
            </span>
            <span>O progresso considera as atividades da etapa atual de cada demanda.</span>
          </div>
        </div>
      ) : (
        <Planilha linhas={linhas} onSalvo={recarregar} />
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// Planilha editável (espelho da PLANILHA ANDAMENTO GT, com listas suspensas)
// -----------------------------------------------------------------------------

type CampoPlanilha = keyof Pick<
  ContratacaoView,
  | 'processo_sei_origem' | 'processo_sei' | 'dod_status' | 'dod_obs' | 'ata_status' | 'ata_obs' | 'ti_status' | 'ti_obs'
  | 'docs_prep_status' | 'docs_prep_obs' | 'valor_estimado' | 'ultimo_andamento' | 'observacao' | 'situacao' | 'modalidade'
>;

function Planilha({ linhas, onSalvo }: { linhas: ContratacaoView[]; onSalvo: () => void }) {
  const { pode, cat } = useApp();
  const [estado, setEstado] = useState<Record<string, 'salvando' | 'salvo'>>({});
  const [local, setLocal] = useState<Record<string, Partial<ContratacaoView>>>({});

  async function salvar(c: ContratacaoView, campo: CampoPlanilha, valor: string | number | null) {
    if ((c[campo] ?? null) === valor) return;
    if ((campo === 'situacao' || campo === 'modalidade') && !valor) return;
    const k = `${c.id}:${campo}`;
    setEstado((e) => ({ ...e, [k]: 'salvando' }));
    const { error, data: res } = await supabase.from('contratacoes').update({ [campo]: valor }).eq('id', c.id).select('id');
    if (error || !res?.length) {
      toast(error ? traduzirErro(error.message) : 'Seu perfil não pode editar esta contratação.', true);
      setEstado((e) => { const n = { ...e }; delete n[k]; return n; });
      setLocal((l) => ({ ...l, [c.id]: { ...l[c.id], [campo]: c[campo] } }));
      return;
    }
    setEstado((e) => ({ ...e, [k]: 'salvo' }));
    setTimeout(() => setEstado((e) => { const n = { ...e }; delete n[k]; return n; }), 1200);
    if (campo === 'modalidade' || campo === 'situacao') onSalvo();
  }

  const v = (c: ContratacaoView, campo: CampoPlanilha) => (local[c.id]?.[campo] !== undefined ? local[c.id]![campo] : c[campo]);
  const set = (c: ContratacaoView, campo: CampoPlanilha, valor: unknown) =>
    setLocal((l) => ({ ...l, [c.id]: { ...l[c.id], [campo]: valor } }));

  const td = (c: ContratacaoView, campo: CampoPlanilha, conteudo: React.ReactNode, largura = 160) => (
    <td className={estado[`${c.id}:${campo}`] ?? ''} style={{ minWidth: largura }}>{conteudo}</td>
  );

  const texto = (c: ContratacaoView, campo: CampoPlanilha, largura = 200, desab = false) =>
    td(c, campo,
      <textarea
        rows={2}
        disabled={desab}
        value={(v(c, campo) as string) ?? ''}
        onChange={(e) => set(c, campo, e.target.value)}
        onBlur={(e) => salvar(c, campo, e.target.value.trim() || null)}
      />, largura);

  const lista = (c: ContratacaoView, campo: CampoPlanilha, nome: string, desab: boolean) =>
    td(c, campo,
      <SelectLista
        lista={nome}
        className=""
        vazio="—"
        disabled={desab}
        valor={v(c, campo) as string}
        onChange={(val) => { set(c, campo, val); salvar(c, campo, val); }}
      />, 130);

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="aviso info" style={{ margin: 14 }}>
        Edição direta das colunas da planilha de andamento do GT. Cada alteração é salva ao sair do campo e registrada na auditoria.
      </div>
      <div className="tabela-wrap" style={{ maxHeight: '70vh' }}>
        <table className="planilha">
          <thead>
            <tr>
              <th rowSpan={2} className="grupo">Nº · objeto</th>
              <th rowSpan={2}>Processo antigo</th>
              <th rowSpan={2}>Processo novo (SEI)</th>
              <th rowSpan={2}>Modalidade</th>
              <th colSpan={2} className="grupo">DOD</th>
              <th colSpan={2} className="grupo">Ata de registro de preços</th>
              <th colSpan={2} className="grupo">Manifestação do TI</th>
              <th colSpan={2} className="grupo">Documentos da fase preparatória</th>
              <th rowSpan={2}>Valor global</th>
              <th rowSpan={2}>Último andamento</th>
              <th rowSpan={2}>Observação</th>
              <th rowSpan={2}>Situação</th>
            </tr>
            <tr>
              <th>Status</th><th>Observação</th><th>Status</th><th>Observação</th>
              <th>Status</th><th>Observação</th><th>Status</th><th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((c) => {
              const desab = !pode.editarContratacao(c);
              return (
                <tr key={c.id}>
                  <td className="fixa" style={{ minWidth: 220 }}>
                    <Link to={`/contratacoes/${c.id}`} className="obj" style={{ fontWeight: 600, textDecoration: 'none' }}>
                      {num2(c.numero)} · {c.titulo}
                    </Link>
                  </td>
                  {texto(c, 'processo_sei_origem', 170, desab)}
                  {texto(c, 'processo_sei', 170, desab)}
                  {td(c, 'modalidade',
                    <select
                      disabled={desab || !pode.criarContratacao}
                      value={v(c, 'modalidade') as string}
                      onChange={(e) => { set(c, 'modalidade', e.target.value); salvar(c, 'modalidade', e.target.value); }}
                    >
                      {cat.modalidades.filter((m) => m.ativo || m.codigo === c.modalidade).map((m) => (
                        <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                      ))}
                    </select>, 150)}
                  {lista(c, 'dod_status', 'dod_status', desab)}
                  {texto(c, 'dod_obs', 240, desab)}
                  {lista(c, 'ata_status', 'ata_status', desab)}
                  {texto(c, 'ata_obs', 240, desab)}
                  {lista(c, 'ti_status', 'ti_status', desab)}
                  {td(c, 'ti_obs',
                    <SelectLista lista="ti_obs" className="" vazio="—" disabled={desab} valor={v(c, 'ti_obs') as string}
                      onChange={(val) => { set(c, 'ti_obs', val); salvar(c, 'ti_obs', val); }} />, 140)}
                  {lista(c, 'docs_prep_status', 'docs_prep_status', desab)}
                  {texto(c, 'docs_prep_obs', 220, desab)}
                  {td(c, 'valor_estimado',
                    <input
                      type="number" step="0.01" min="0" disabled={desab}
                      value={(v(c, 'valor_estimado') as number | null) ?? ''}
                      onChange={(e) => set(c, 'valor_estimado', e.target.value === '' ? null : Number(e.target.value))}
                      onBlur={(e) => salvar(c, 'valor_estimado', e.target.value === '' ? null : Number(e.target.value))}
                    />, 130)}
                  {texto(c, 'ultimo_andamento', 240, desab)}
                  {texto(c, 'observacao', 240, desab)}
                  {lista(c, 'situacao', 'situacao', desab)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
