import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp, useCarregar } from '../lib/app';
import { lerTodas, ok, supabase } from '../lib/supabase';
import {
  ROMANOS, SITUACAO_PRAZO, STATUS_ATIVIDADE, data, dataHora, hojeISO, moeda, num2, prazoTexto, somarDiasISO,
} from '../lib/format';
import { exportarExcel, type AbaExcel } from '../lib/excel';
import type { Andamento, AtividadeView, ContratacaoView, SituacaoPrazo } from '../lib/types';
import { Campo, Carregando, Erro, Selo, SeloLista, SeloModalidade } from '../components/ui';
import { IcBaixar, IcImprimir } from '../components/Icones';

type Periodo = 'semanal' | 'mensal' | 'personalizado';
type Tipo = 'periodo' | 'carteira' | 'prazos' | 'pendencias';

function intervalo(p: Periodo, de: string, ate: string): [string, string] {
  const hoje = hojeISO();
  if (p === 'semanal') {
    const d = new Date(`${hoje}T12:00:00Z`);
    const dow = (d.getUTCDay() + 6) % 7; // segunda = 0
    const seg = somarDiasISO(hoje, -dow - 7);
    return [seg, somarDiasISO(seg, 6)];
  }
  if (p === 'mensal') {
    const [a, m] = hoje.split('-').map(Number);
    const ini = `${a}-${String(m).padStart(2, '0')}-01`;
    return [ini, hoje];
  }
  return [de || somarDiasISO(hoje, -30), ate || hoje];
}

export default function Relatorios() {
  const { cat, lista, integrante } = useApp();
  const [params] = useSearchParams();
  const [tipo, setTipo] = useState<Tipo>((params.get('tipo') as Tipo) ?? 'periodo');
  const [periodo, setPeriodo] = useState<Periodo>((params.get('periodo') as Periodo) ?? 'semanal');
  const [de, setDe] = useState(somarDiasISO(hojeISO(), -30));
  const [ate, setAte] = useState(hojeISO());
  const [fMod, setFMod] = useState('');
  const [fEtapa, setFEtapa] = useState('');
  const [fSit, setFSit] = useState('');
  const [fResp, setFResp] = useState('');
  const [fOrgao, setFOrgao] = useState('');
  const [fPrazo, setFPrazo] = useState<'' | SituacaoPrazo>('');

  const [ini, fim] = intervalo(periodo, de, ate);

  const { dados, erro, carregando } = useCarregar(async () => {
    const [c, a, n] = await Promise.all([
      supabase.from('vw_contratacoes').select('*').order('numero'),
      lerTodas<AtividadeView>((de, ate) => supabase.from('vw_atividades').select('*').order('id').range(de, ate)),
      lerTodas<Andamento>((de, ate) => supabase.from('andamentos').select('*').gte('created_at', `${ini}T00:00:00-03:00`).lte('created_at', `${fim}T23:59:59-03:00`).order('created_at').order('id').range(de, ate)),
    ]);
    return { cs: ok(c) as ContratacaoView[], as: a, ns: n };
  }, [ini, fim]);

  const fm = useMemo(() => {
    if (!dados) return null;
    const cs = dados.cs.filter((c) =>
      !c.rascunho &&
      (!fMod || c.modalidade === fMod) &&
      (!fEtapa || String(c.etapa_atual) === fEtapa) &&
      (!fSit || c.situacao === fSit) &&
      (!fResp || c.responsavel_geral_id === fResp || dados.as.some((a) => a.contratacao_id === c.id && a.responsavel_id === fResp)));
    const ids = new Set(cs.map((c) => c.id));
    const as = dados.as.filter((a) =>
      ids.has(a.contratacao_id) &&
      (!fResp || a.responsavel_id === fResp) &&
      (!fOrgao || a.responsavel_orgao === fOrgao) &&
      (!fEtapa || String(a.etapa) === fEtapa || tipo !== 'prazos'));
    const ns = dados.ns.filter((n) => ids.has(n.contratacao_id));
    return { cs, as, ns };
  }, [dados, fMod, fEtapa, fSit, fResp, fOrgao, tipo]);

  if (carregando && !dados) return <Carregando />;
  if (erro || !fm) return <Erro msg={erro} />;
  const f = fm;

  const noPeriodo = (d: string | null) => Boolean(d && d.slice(0, 10) >= ini && d.slice(0, 10) <= fim);
  const novas = f.cs.filter((c) => noPeriodo(c.created_at));
  const concluidas = f.as.filter((a) => a.status === 'concluida' && noPeriodo(a.data_conclusao));
  const enviosLegais = f.as.filter((a) => a.tipo_prazo && noPeriodo(a.data_envio));
  const vencidasPeriodo = f.as.filter((a) => a.prazo_efetivo && noPeriodo(a.prazo_efetivo) && a.situacao_prazo === 'vencido');
  const andamentosManuais = f.ns.filter((n) => n.tipo !== 'sistema');
  const proximoIni = somarDiasISO(hojeISO(), 0);
  const proximoFim = somarDiasISO(hojeISO(), 7);
  const aVencer = f.as.filter((a) => a.prazo_efetivo && a.prazo_efetivo >= proximoIni && a.prazo_efetivo <= proximoFim && !['concluida', 'nao_se_aplica'].includes(a.status));
  const abertasComPrazo = f.as.filter((a) => a.prazo_efetivo || a.tipo_prazo);
  const prazos = abertasComPrazo.filter((a) => !fPrazo || a.situacao_prazo === fPrazo)
    .sort((a, b) => (a.prazo_efetivo ?? '9') < (b.prazo_efetivo ?? '9') ? -1 : 1);

  const titulo = {
    periodo: `Report ${periodo === 'semanal' ? 'semanal' : periodo === 'mensal' ? 'mensal' : 'por período'} · ${data(ini)} a ${data(fim)}`,
    carteira: 'Posição da carteira de contratações',
    prazos: 'Controle de prazos (legais e internos)',
    pendencias: 'Pendências por integrante',
  }[tipo];

  const filtrosTexto = [
    fMod && `Modalidade: ${cat.modalidades.find((m) => m.codigo === fMod)?.nome}`,
    fEtapa && `Etapa ${ROMANOS[Number(fEtapa)]}`,
    fSit && `Situação: ${fSit}`,
    fResp && `Responsável: ${integrante(fResp)?.nome}`,
    fOrgao && `Órgão: ${fOrgao}`,
  ].filter(Boolean).join(' · ') || 'sem filtros';

  const pendPorPessoa = cat.integrantes.filter((i) => i.ativo && i.membro_gt && (!fOrgao || i.orgao === fOrgao)).map((i) => {
    const ab = f.as.filter((a) => a.responsavel_id === i.id && !['concluida', 'nao_se_aplica'].includes(a.status));
    return {
      i, abertas: ab.length, vencidas: ab.filter((a) => a.situacao_prazo === 'vencido').length,
      semana: ab.filter((a) => a.dias_restantes != null && a.dias_restantes >= 0 && a.dias_restantes <= 5).length,
      concluidasPeriodo: concluidas.filter((a) => a.responsavel_id === i.id).length, lista: ab,
    };
  }).sort((a, b) => b.vencidas - a.vencidas || b.abertas - a.abertas);
  const semResp = f.as.filter((a) => !a.responsavel_id && !['concluida', 'nao_se_aplica'].includes(a.status));

  async function exportar() {
    const colAtiv = [
      { titulo: 'Nº', valor: (a: AtividadeView) => a.contratacao_numero, largura: 6 },
      { titulo: 'Contratação', valor: (a: AtividadeView) => a.contratacao_titulo, largura: 28 },
      { titulo: 'Etapa', valor: (a: AtividadeView) => `${ROMANOS[a.etapa]} · ${a.etapa_nome}`, largura: 24 },
      { titulo: 'Atividade', valor: (a: AtividadeView) => a.nome, largura: 32 },
      { titulo: 'Responsável', valor: (a: AtividadeView) => a.responsavel_nome ?? 'Sem responsável', largura: 26 },
      { titulo: 'Status', valor: (a: AtividadeView) => STATUS_ATIVIDADE[a.status].rotulo, largura: 16 },
      { titulo: 'Prazo legal', valor: (a: AtividadeView) => prazoTexto(a.tipo_prazo, a.prazo_dias, a.prorrogado ? a.prorrogacao_dias : null), largura: 18 },
      { titulo: 'Envio', valor: (a: AtividadeView) => data(a.data_envio), largura: 12 },
      { titulo: 'Vencimento', valor: (a: AtividadeView) => data(a.prazo_efetivo), largura: 12 },
      { titulo: 'Dias restantes', valor: (a: AtividadeView) => a.dias_restantes, largura: 10 },
      { titulo: 'Situação do prazo', valor: (a: AtividadeView) => SITUACAO_PRAZO[a.situacao_prazo].rotulo, largura: 20 },
      { titulo: 'Conclusão', valor: (a: AtividadeView) => data(a.data_conclusao), largura: 12 },
    ];
    const colC = [
      { titulo: 'Nº', valor: (c: ContratacaoView) => c.numero, largura: 6 },
      { titulo: 'Objeto', valor: (c: ContratacaoView) => c.titulo, largura: 28 },
      { titulo: 'Processo SEI', valor: (c: ContratacaoView) => c.processo_sei, largura: 24 },
      { titulo: 'Modalidade', valor: (c: ContratacaoView) => c.modalidade_nome, largura: 18 },
      { titulo: 'Via / ata', valor: (c: ContratacaoView) => c.via_descricao, largura: 24 },
      { titulo: 'Etapa', valor: (c: ContratacaoView) => `${ROMANOS[c.etapa_atual ?? 1]} · ${c.etapa_atual_nome ?? ''}`, largura: 24 },
      { titulo: 'Progresso', valor: (c: ContratacaoView) => `${c.etapa_concluidas ?? 0}/${c.etapa_total ?? 0}`, largura: 10 },
      { titulo: 'Atividade atual', valor: (c: ContratacaoView) => c.atividade_atual_nome, largura: 28 },
      { titulo: 'Responsável', valor: (c: ContratacaoView) => c.atividade_atual_responsavel_nome ?? 'Sem responsável', largura: 24 },
      { titulo: 'Responsável geral', valor: (c: ContratacaoView) => c.responsavel_geral_nome, largura: 24 },
      { titulo: 'Situação', valor: (c: ContratacaoView) => c.situacao, largura: 16 },
      { titulo: 'Valor', valor: (c: ContratacaoView) => (c.valor_estimado == null ? null : Number(c.valor_estimado)), largura: 16, formato: '"R$" #,##0.00' },
      { titulo: 'Prazos vencidos', valor: (c: ContratacaoView) => c.prazos_vencidos, largura: 10 },
      { titulo: 'Último andamento', valor: (c: ContratacaoView) => c.ultimo_andamento, largura: 40 },
    ];
    const sub = `${filtrosTexto} · gerado em ${new Date().toLocaleString('pt-BR')}`;
    const abas: AbaExcel[] =
      tipo === 'periodo' ? [
        { nome: 'Resumo', titulo, subtitulo: sub, linhas: [
          ['Novas contratações', novas.length], ['Atividades concluídas', concluidas.length],
          ['Envios com prazo legal', enviosLegais.length], ['Prazos vencidos no período', vencidasPeriodo.length],
          ['Andamentos registrados', andamentosManuais.length], ['Prazos nos próximos 7 dias', aVencer.length],
          ['Carteira ativa', f.cs.filter((c) => !['Concluída', 'Cancelada'].includes(c.situacao)).length],
        ], colunas: [{ titulo: 'Indicador', valor: (r: [string, number]) => r[0], largura: 36 }, { titulo: 'Quantidade', valor: (r: [string, number]) => r[1], largura: 14 }] },
        { nome: 'Concluídas', linhas: concluidas, colunas: colAtiv },
        { nome: 'Andamentos', linhas: andamentosManuais, colunas: [
          { titulo: 'Data', valor: (n: Andamento) => dataHora(n.created_at), largura: 18 },
          { titulo: 'Nº', valor: (n: Andamento) => f.cs.find((c) => c.id === n.contratacao_id)?.numero, largura: 6 },
          { titulo: 'Contratação', valor: (n: Andamento) => f.cs.find((c) => c.id === n.contratacao_id)?.titulo, largura: 28 },
          { titulo: 'Autor', valor: (n: Andamento) => integrante(n.integrante_id)?.nome, largura: 26 },
          { titulo: 'Texto', valor: (n: Andamento) => n.texto, largura: 70 },
        ] },
        { nome: 'Próximos 7 dias', linhas: aVencer, colunas: colAtiv },
        { nome: 'Carteira', linhas: f.cs, colunas: colC },
      ] : tipo === 'carteira' ? [{ nome: 'Carteira', titulo, subtitulo: sub, linhas: f.cs, colunas: colC }]
      : tipo === 'prazos' ? [{ nome: 'Prazos', titulo, subtitulo: sub, linhas: prazos, colunas: colAtiv }]
      : [
        { nome: 'Por integrante', titulo, subtitulo: sub, linhas: pendPorPessoa, colunas: [
          { titulo: 'Integrante', valor: (p: typeof pendPorPessoa[0]) => p.i.nome, largura: 30 },
          { titulo: 'Órgão', valor: (p: typeof pendPorPessoa[0]) => p.i.orgao, largura: 10 },
          { titulo: 'Frente', valor: (p: typeof pendPorPessoa[0]) => p.i.frente, largura: 8 },
          { titulo: 'Abertas', valor: (p: typeof pendPorPessoa[0]) => p.abertas, largura: 10 },
          { titulo: 'Vencidas', valor: (p: typeof pendPorPessoa[0]) => p.vencidas, largura: 10 },
          { titulo: 'Vencem ≤ 5 dias', valor: (p: typeof pendPorPessoa[0]) => p.semana, largura: 12 },
          { titulo: 'Concluídas no período', valor: (p: typeof pendPorPessoa[0]) => p.concluidasPeriodo, largura: 14 },
        ] },
        { nome: 'Detalhe', linhas: f.as.filter((a) => !['concluida', 'nao_se_aplica'].includes(a.status)), colunas: colAtiv },
      ];
    await exportarExcel(`relatorio-${tipo}-${ini}-a-${fim}`, abas);
  }

  const porSit = lista('situacao').map((o) => ({ o, n: f.cs.filter((c) => c.situacao === o.valor).length })).filter((x) => x.n);
  const porEt = cat.etapas.map((e) => ({ e, n: f.cs.filter((c) => c.etapa_atual === e.numero && !['Concluída', 'Cancelada'].includes(c.situacao)).length }));

  return (
    <>
      <div className="cabecalho nao-imprimir">
        <div>
          <div className="eyebrow">Relatórios e acompanhamento</div>
          <h1>Relatórios</h1>
          <p>Reports semanal, mensal e por período, posição da carteira, prazos e pendências — com filtros e exportação</p>
        </div>
        <div className="acoes">
          <button className="btn" onClick={() => window.print()}><IcImprimir width={15} /> Imprimir / PDF</button>
          <button className="btn primario" onClick={exportar}><IcBaixar width={15} /> Exportar Excel</button>
        </div>
      </div>

      <div className="abas nao-imprimir">
        {([['periodo', 'Report do período'], ['carteira', 'Carteira'], ['prazos', 'Prazos'], ['pendencias', 'Pendências por integrante']] as [Tipo, string][]).map(([k, r]) => (
          <button key={k} className={`aba ${tipo === k ? 'on' : ''}`} onClick={() => setTipo(k)}>{r}</button>
        ))}
      </div>

      <div className="card mb nao-imprimir">
        <div className="form-grid">
          {(tipo === 'periodo' || tipo === 'pendencias') && (
            <>
              <Campo rotulo="Período" className="c3">
                <select className="input" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
                  <option value="semanal">Semana anterior (seg–dom)</option>
                  <option value="mensal">Mês corrente</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </Campo>
              {periodo === 'personalizado' ? (
                <>
                  <Campo rotulo="De" className="c2"><input className="input" type="date" value={de} onChange={(e) => setDe(e.target.value)} /></Campo>
                  <Campo rotulo="Até" className="c2"><input className="input" type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></Campo>
                </>
              ) : <Campo rotulo="Intervalo" className="c4"><input className="input" readOnly value={`${data(ini)} a ${data(fim)}`} /></Campo>}
            </>
          )}
          <Campo rotulo="Modalidade" className="c3">
            <select className="input" value={fMod} onChange={(e) => setFMod(e.target.value)}>
              <option value="">Todas</option>
              {cat.modalidades.map((m) => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Etapa" className="c2">
            <select className="input" value={fEtapa} onChange={(e) => setFEtapa(e.target.value)}>
              <option value="">Todas</option>
              {cat.etapas.map((e) => <option key={e.numero} value={e.numero}>{ROMANOS[e.numero]} · {e.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Situação" className="c2">
            <select className="input" value={fSit} onChange={(e) => setFSit(e.target.value)}>
              <option value="">Todas</option>
              {lista('situacao').map((o) => <option key={o.id}>{o.valor}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Responsável" className="c3">
            <select className="input" value={fResp} onChange={(e) => setFResp(e.target.value)}>
              <option value="">Todos</option>
              {cat.integrantes.filter((i) => i.ativo).map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Órgão do responsável" className="c2">
            <select className="input" value={fOrgao} onChange={(e) => setFOrgao(e.target.value)}>
              <option value="">Todos</option>
              {['SEDES', 'SECTI', 'FAETEC', 'PRODERJ'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Campo>
          {tipo === 'prazos' && (
            <Campo rotulo="Situação do prazo" className="c3">
              <select className="input" value={fPrazo} onChange={(e) => setFPrazo(e.target.value as SituacaoPrazo)}>
                <option value="">Todas</option>
                {Object.entries(SITUACAO_PRAZO).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
              </select>
            </Campo>
          )}
        </div>
      </div>

      <div className="card">
        <div className="entre mb" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow">GT PROPAG · Compras públicas · FAETEC</div>
            <h2 className="serif" style={{ fontSize: 22, marginTop: 4 }}>{titulo}</h2>
            <div className="small muted">{filtrosTexto} · gerado em {new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>

        {tipo === 'periodo' && (
          <>
            <div className="grid g5 mb">
              <Mini r="Novas contratações" v={novas.length} />
              <Mini r="Atividades concluídas" v={concluidas.length} />
              <Mini r="Envios c/ prazo legal" v={enviosLegais.length} />
              <Mini r="Prazos vencidos no período" v={vencidasPeriodo.length} alerta />
              <Mini r="Andamentos registrados" v={andamentosManuais.length} />
            </div>
            <Secao titulo={`Atividades concluídas no período (${concluidas.length})`}><TabelaAtiv linhas={concluidas} /></Secao>
            <Secao titulo={`Prazos que vencem nos próximos 7 dias (${aVencer.length})`}><TabelaAtiv linhas={aVencer} /></Secao>
            <Secao titulo={`Prazos vencidos no período (${vencidasPeriodo.length})`}><TabelaAtiv linhas={vencidasPeriodo} /></Secao>
            <Secao titulo={`Andamentos registrados (${andamentosManuais.length})`}>
              {andamentosManuais.length === 0 ? <p className="small muted">Nenhum andamento no período.</p> : (
                <table className="tabela"><thead><tr><th>Data</th><th>Contratação</th><th>Autor</th><th>Andamento</th></tr></thead>
                  <tbody>{andamentosManuais.map((n) => {
                    const c = f.cs.find((x) => x.id === n.contratacao_id);
                    return <tr key={n.id}><td className="nowrap">{dataHora(n.created_at)}</td><td>{c ? `${num2(c.numero)} · ${c.titulo}` : ''}</td><td>{integrante(n.integrante_id)?.nome ?? 'Sistema'}</td><td>{n.texto}</td></tr>;
                  })}</tbody></table>
              )}
            </Secao>
            <Secao titulo="Posição da carteira ao fim do período"><TabelaCarteira cs={f.cs} /></Secao>
          </>
        )}

        {tipo === 'carteira' && (
          <>
            <div className="grid g2 mb">
              <div>
                <h3 className="mb">Por situação</h3>
                <ul className="lista-resumo">{porSit.map(({ o, n }) => <li key={o.id}><SeloLista lista="situacao" valor={o.valor} /><span className="n">{n}</span></li>)}</ul>
              </div>
              <div>
                <h3 className="mb">Por etapa (ativas)</h3>
                <ul className="lista-resumo">{porEt.map(({ e, n }) => <li key={e.numero}><span>{ROMANOS[e.numero]} · {e.nome}</span><span className="n">{n}</span></li>)}</ul>
              </div>
            </div>
            <p className="small">
              Valor estimado informado: <strong>{moeda(f.cs.reduce((s, c) => s + Number(c.valor_estimado ?? 0), 0))}</strong> em {f.cs.filter((c) => c.valor_estimado != null).length} de {f.cs.length} demandas.
            </p>
            <TabelaCarteira cs={f.cs} />
          </>
        )}

        {tipo === 'prazos' && (
          <>
            <div className="grid g4 mb">
              <Mini r="Vencidos" v={abertasComPrazo.filter((a) => a.situacao_prazo === 'vencido').length} alerta />
              <Mini r="Vencem em breve (≤ 3 dias)" v={abertasComPrazo.filter((a) => a.situacao_prazo === 'atencao').length} />
              <Mini r="No prazo" v={abertasComPrazo.filter((a) => a.situacao_prazo === 'no_prazo').length} />
              <Mini r="Legais sem envio registrado" v={abertasComPrazo.filter((a) => a.situacao_prazo === 'aguardando_envio').length} />
            </div>
            <TabelaAtiv linhas={prazos} completo />
          </>
        )}

        {tipo === 'pendencias' && (
          <>
            <table className="tabela mb">
              <thead><tr><th>Integrante</th><th>Órgão · frente</th><th className="right">Abertas</th><th className="right">Vencidas</th><th className="right">≤ 5 dias</th><th className="right">Concluídas no período</th></tr></thead>
              <tbody>
                {pendPorPessoa.map((p) => (
                  <tr key={p.i.id}>
                    <td><Link to={`/pendencias/${p.i.id}`}>{p.i.nome}</Link><div className="sub">{p.i.funcao}</div></td>
                    <td>{p.i.orgao} · {p.i.frente ? `Frente ${p.i.frente}` : '—'}</td>
                    <td className="right mono">{p.abertas}</td>
                    <td className={`right mono ${p.vencidas ? 'red' : ''}`}>{p.vencidas}</td>
                    <td className="right mono">{p.semana}</td>
                    <td className="right mono">{p.concluidasPeriodo}</td>
                  </tr>
                ))}
                <tr><td className="red"><strong>Sem responsável</strong></td><td /><td className="right mono red">{semResp.length}</td><td className="right mono red">{semResp.filter((a) => a.situacao_prazo === 'vencido').length}</td><td /><td /></tr>
              </tbody>
            </table>
            {pendPorPessoa.filter((p) => p.lista.length).map((p) => (
              <Secao key={p.i.id} titulo={`${p.i.nome} · ${p.abertas} aberta(s)`}><TabelaAtiv linhas={p.lista} semResp /></Secao>
            ))}
          </>
        )}
      </div>
    </>
  );
}

function Mini({ r, v, alerta }: { r: string; v: number; alerta?: boolean }) {
  return <div className="card kpi" style={{ padding: 14 }}><div className="rotulo">{r}</div><div className={`valor ${alerta && v ? 'alerta' : ''}`} style={{ fontSize: 26 }}>{v}</div></div>;
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <div className="mt" style={{ breakInside: 'avoid' }}><h3 className="mb">{titulo}</h3><div className="tabela-wrap">{children}</div></div>;
}

function TabelaAtiv({ linhas, completo, semResp }: { linhas: AtividadeView[]; completo?: boolean; semResp?: boolean }) {
  if (!linhas.length) return <p className="small muted">Nenhum registro.</p>;
  return (
    <table className="tabela">
      <thead><tr><th>Nº</th><th>Contratação · atividade</th>{!semResp && <th>Responsável</th>}<th>Status</th>{completo && <th>Envio</th>}<th>Prazo</th><th className="right">Dias</th><th>Situação</th></tr></thead>
      <tbody>
        {linhas.map((a) => (
          <tr key={a.id}>
            <td className="num">{num2(a.contratacao_numero)}</td>
            <td><Link to={`/contratacoes/${a.contratacao_id}`} className="obj" style={{ textDecoration: 'none' }}>{a.contratacao_titulo}</Link>
              <div className="sub">Etapa {ROMANOS[a.etapa]} · {a.nome}{a.tipo_prazo && <span className="red"> · {prazoTexto(a.tipo_prazo, a.prazo_dias, a.prorrogado ? a.prorrogacao_dias : null)}</span>}</div></td>
            {!semResp && <td>{a.responsavel_nome ?? <span className="red">Sem responsável</span>}</td>}
            <td><Selo cor={STATUS_ATIVIDADE[a.status].cor}>{STATUS_ATIVIDADE[a.status].rotulo}</Selo></td>
            {completo && <td className="nowrap">{data(a.data_envio)}</td>}
            <td className="nowrap">{data(a.status === 'concluida' && !a.prazo_efetivo ? a.data_conclusao : a.prazo_efetivo)}</td>
            <td className="right mono">{a.status === 'concluida' ? '—' : a.dias_restantes ?? '—'}</td>
            <td><Selo cor={SITUACAO_PRAZO[a.situacao_prazo].cor}>{SITUACAO_PRAZO[a.situacao_prazo].rotulo}</Selo></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TabelaCarteira({ cs }: { cs: ContratacaoView[] }) {
  return (
    <table className="tabela">
      <thead><tr><th>Nº</th><th>Objeto</th><th>Modalidade</th><th>Etapa</th><th>Atividade atual · responsável</th><th className="right">Valor</th><th>Situação</th></tr></thead>
      <tbody>
        {cs.map((c) => (
          <tr key={c.id}>
            <td className="num">{num2(c.numero)}</td>
            <td><Link to={`/contratacoes/${c.id}`} className="obj" style={{ textDecoration: 'none' }}>{c.titulo}</Link><div className="sub">{c.via_descricao ?? c.processo_sei ?? ''}</div></td>
            <td><SeloModalidade codigo={c.modalidade} /></td>
            <td className="nowrap">{ROMANOS[c.etapa_atual ?? 1]} · {c.etapa_concluidas ?? 0}/{c.etapa_total ?? 0}</td>
            <td>{c.atividade_atual_nome ?? '—'}<div className={`sub ${c.atividade_atual_responsavel_nome ? '' : 'red'}`}>{c.atividade_atual_responsavel_nome ?? 'Sem responsável'}</div></td>
            <td className="right nowrap">{moeda(c.valor_estimado, true)}</td>
            <td><SeloLista lista="situacao" valor={c.situacao} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
