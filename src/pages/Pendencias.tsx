import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp, useCarregar } from '../lib/app';
import { ok, supabase, traduzirErro } from '../lib/supabase';
import { FRENTES, PAPEIS, ROMANOS, SITUACAO_PRAZO, STATUS_ATIVIDADE, data, num2, prazoTexto } from '../lib/format';
import { exportarExcel } from '../lib/excel';
import type { AtividadeView, CargaIntegrante, ContratacaoView, StatusAtividade } from '../lib/types';
import { Carregando, Erro, Iniciais, Selo, SeloLista, Vazio, toast } from '../components/ui';
import { Voltar } from '../components/Voltar';
import { IcBaixar, IcSeta } from '../components/Icones';

const ABERTA = (a: AtividadeView) => a.status !== 'concluida' && a.status !== 'nao_se_aplica';

export default function Pendencias() {
  const { integranteId } = useParams();
  const { eu } = useApp();
  const [equipe, setEquipe] = useState(false);
  if (equipe && !integranteId) return <VisaoEquipe onVoltar={() => setEquipe(false)} />;
  return <VisaoIndividual id={integranteId ?? eu!.id} onEquipe={() => setEquipe(true)} />;
}

function VisaoIndividual({ id, onEquipe }: { id: string; onEquipe: () => void }) {
  const { integrante, eu, pode, cat } = useApp();
  const nav = useNavigate();
  const pessoa = integrante(id);
  const [filtro, setFiltro] = useState<'abertas' | 'vencidas' | 'semana' | 'concluidas' | 'todas'>('abertas');

  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [a, c] = await Promise.all([
      supabase.from('vw_atividades').select('*').eq('responsavel_id', id).order('prazo_legal', { nullsFirst: false }),
      supabase.from('vw_contratacoes').select('*').eq('responsavel_geral_id', id).order('numero'),
    ]);
    return { ativs: ok(a) as AtividadeView[], coord: ok(c) as ContratacaoView[] };
  }, [id]);

  const grupos = useMemo(() => {
    const as = dados?.ativs ?? [];
    const abertas = as.filter(ABERTA);
    return {
      abertas,
      vencidas: abertas.filter((a) => a.situacao_prazo === 'vencido'),
      semana: abertas.filter((a) => a.dias_restantes != null && a.dias_restantes >= 0 && a.dias_restantes <= 5),
      aguardando: abertas.filter((a) => a.status === 'aguardando'),
      devolvidas: abertas.filter((a) => a.status === 'devolvida'),
      concluidas: as.filter((a) => a.status === 'concluida'),
      todas: as,
    };
  }, [dados]);

  if (carregando && !dados) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  if (!pessoa) return <Vazio>Integrante não encontrado.</Vazio>;

  const ordenar = (l: AtividadeView[]) =>
    [...l].sort((a, b) => {
      const pa = a.prazo_efetivo ?? '9999', pb = b.prazo_efetivo ?? '9999';
      return pa === pb ? a.contratacao_numero - b.contratacao_numero || a.etapa - b.etapa || a.ordem - b.ordem : pa < pb ? -1 : 1;
    });
  const lista = ordenar(grupos[filtro]);
  const souEu = pessoa.id === eu?.id;

  async function mudarStatus(a: AtividadeView, status: StatusAtividade) {
    const { error, data: r } = await supabase.from('atividades').update({ status }).eq('id', a.id).select('id');
    if (error) toast(traduzirErro(error.message), true);
    else if (!r?.length) toast('Seu perfil não permite alterar esta atividade.', true);
    else toast(`${a.nome}: ${STATUS_ATIVIDADE[status].rotulo}`);
    recarregar();
  }

  async function exportar() {
    await exportarExcel(`pendencias-${pessoa!.nome}`, [{
      nome: 'Pendências',
      titulo: `Pendências · ${pessoa!.nome}`,
      subtitulo: `${pessoa!.funcao ?? ''} · extraído em ${new Date().toLocaleString('pt-BR')}`,
      linhas: lista,
      colunas: [
        { titulo: 'Nº', valor: (a: AtividadeView) => a.contratacao_numero, largura: 6 },
        { titulo: 'Contratação', valor: (a: AtividadeView) => a.contratacao_titulo, largura: 30 },
        { titulo: 'Etapa', valor: (a: AtividadeView) => `${ROMANOS[a.etapa]} · ${a.etapa_nome}`, largura: 26 },
        { titulo: 'Atividade', valor: (a: AtividadeView) => a.nome, largura: 34 },
        { titulo: 'Status', valor: (a: AtividadeView) => STATUS_ATIVIDADE[a.status].rotulo, largura: 18 },
        { titulo: 'Prazo', valor: (a: AtividadeView) => data(a.prazo_efetivo), largura: 12 },
        { titulo: 'Dias restantes', valor: (a: AtividadeView) => a.dias_restantes, largura: 10 },
        { titulo: 'Situação do prazo', valor: (a: AtividadeView) => SITUACAO_PRAZO[a.situacao_prazo].rotulo, largura: 20 },
        { titulo: 'Observação', valor: (a: AtividadeView) => a.observacao, largura: 40 },
      ],
    }]);
  }

  const etapasFrente = cat.etapas.filter((e) => e.frente_executora === pessoa.frente);

  return (
    <>
      {!souEu && <Voltar padrao="/equipe" rotuloPadrao="Equipe do GT" />}
      <div className="cabecalho">
        <div className="pessoa">
          <Iniciais nome={pessoa.nome} frente={pessoa.frente} />
          <div>
            <div className="eyebrow">{souEu ? 'Minhas pendências' : 'Pendências do integrante'}</div>
            <h1>{pessoa.nome}</h1>
            <p>
              {pessoa.orgao} · {pessoa.funcao}
              {pessoa.frente ? ` · Frente ${pessoa.frente} (${FRENTES[pessoa.frente].nome})` : ''} · {pessoa.modelo_trabalho}
            </p>
          </div>
        </div>
        <div className="acoes">
          <select className="filtro-btn" value={pessoa.id} onChange={(e) => nav(`/pendencias/${e.target.value}`)} aria-label="Integrante">
            {cat.integrantes.filter((i) => i.ativo).map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
          <button className="btn" onClick={onEquipe}>Visão da equipe</button>
          <button className="btn" onClick={exportar}><IcBaixar width={15} /> Exportar</button>
        </div>
      </div>

      <div className="grid g5 mb">
        <Kpi rotulo="Atividades abertas" valor={grupos.abertas.length} nota={`${new Set(grupos.abertas.map((a) => a.contratacao_id)).size} contratações`} />
        <Kpi rotulo="Prazos vencidos" valor={grupos.vencidas.length} alerta={grupos.vencidas.length > 0} nota="exigem ação imediata" />
        <Kpi rotulo="Vencem em até 5 dias" valor={grupos.semana.length} nota="corridos ou úteis, conforme a norma" />
        <Kpi rotulo="Aguardando terceiros" valor={grupos.aguardando.length} nota={`${grupos.devolvidas.length} devolvida(s)`} />
        <Kpi rotulo="Contratações coordenadas" valor={dados?.coord.length ?? 0} nota={`${grupos.concluidas.length} atividades concluídas`} />
      </div>

      {etapasFrente.length > 0 && (
        <div className="aviso info mb">
          Papel no fluxo: executa {etapasFrente.map((e) => `Etapa ${ROMANOS[e.numero]} (${e.nome})`).join(', ')} · perfil “{PAPEIS[pessoa.papel].rotulo}”.
        </div>
      )}

      <div className="grid g-3-1" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="chips mb">
            {([
              ['abertas', 'Abertas', grupos.abertas.length],
              ['vencidas', 'Vencidas', grupos.vencidas.length],
              ['semana', 'Próximos 5 dias', grupos.semana.length],
              ['concluidas', 'Concluídas', grupos.concluidas.length],
              ['todas', 'Todas', grupos.todas.length],
            ] as const).map(([k, r, n]) => (
              <button key={k} className={`chip ${filtro === k ? 'on' : ''}`} onClick={() => setFiltro(k)}>{r} · {n}</button>
            ))}
          </div>
          {lista.length === 0 ? <Vazio>Nenhuma atividade neste filtro.</Vazio> : (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead><tr><th>Nº</th><th>Contratação · atividade</th><th>Status</th><th>Prazo</th><th>Situação</th><th /></tr></thead>
                <tbody>
                  {lista.map((a) => {
                    const sp = SITUACAO_PRAZO[a.situacao_prazo];
                    const pe = pode.editarAtividade(a);
                    return (
                      <tr key={a.id}>
                        <td className="num">{num2(a.contratacao_numero)}</td>
                        <td>
                          <div className="obj">{a.contratacao_titulo}</div>
                          <div className="sub">
                            Etapa {ROMANOS[a.etapa]} · {a.nome}
                            {a.tipo_prazo && <span className="red"> · {prazoTexto(a.tipo_prazo, a.prazo_dias, a.prorrogado ? a.prorrogacao_dias : null)}</span>}
                          </div>
                          {a.observacao && <div className="sub">{a.observacao}</div>}
                        </td>
                        <td style={{ minWidth: 160 }}>
                          <select className="input" value={a.status} disabled={!pe} onChange={(e) => mudarStatus(a, e.target.value as StatusAtividade)}>
                            {Object.entries(STATUS_ATIVIDADE).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
                          </select>
                        </td>
                        <td className="nowrap">
                          {data(a.prazo_efetivo)}
                          {a.dias_restantes != null && ABERTA(a) && (
                            <div className={`sub ${a.dias_restantes < 0 ? 'red' : ''}`}>
                              {a.dias_restantes < 0 ? `${-a.dias_restantes} dia(s) de atraso` : `${a.dias_restantes} dia(s)`}
                            </div>
                          )}
                        </td>
                        <td><Selo cor={sp.cor}>{sp.rotulo}</Selo></td>
                        <td className="acoes-td"><Link className="abrir" to={`/contratacoes/${a.contratacao_id}`}>Detalhes <IcSeta width={14} /></Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="mb">Contratações sob coordenação</h2>
          {dados?.coord.length ? (
            <ul className="lista-resumo">
              {dados.coord.map((c) => (
                <li key={c.id}>
                  <Link to={`/contratacoes/${c.id}`} style={{ textDecoration: 'none' }}>
                    <strong style={{ color: 'var(--navy)' }}>{num2(c.numero)} · {c.titulo}</strong>
                    <div className="xs muted">Etapa {ROMANOS[c.etapa_atual ?? 1]} · {c.atividade_atual_nome ?? 'concluído'}</div>
                  </Link>
                  <SeloLista lista="situacao" valor={c.situacao} />
                </li>
              ))}
            </ul>
          ) : <p className="small muted">Nenhuma contratação com este integrante como responsável geral.</p>}
        </div>
      </div>
    </>
  );
}

function Kpi({ rotulo, valor, nota, alerta }: { rotulo: string; valor: number; nota?: string; alerta?: boolean }) {
  return (
    <div className="card kpi">
      <div className="rotulo">{rotulo}</div>
      <div className={`valor ${alerta ? 'alerta' : ''}`}>{valor}</div>
      {nota && <div className="nota">{nota}</div>}
    </div>
  );
}

function VisaoEquipe({ onVoltar }: { onVoltar: () => void }) {
  const nav = useNavigate();
  const { dados, erro, carregando } = useCarregar(async () => {
    const [c, s] = await Promise.all([
      supabase.from('vw_carga_integrantes').select('*').eq('ativo', true).order('atividades_vencidas', { ascending: false }).order('atividades_abertas', { ascending: false }),
      supabase.from('vw_atividades').select('id', { count: 'exact', head: true }).is('responsavel_id', null).not('status', 'in', '(concluida,nao_se_aplica)'),
    ]);
    return { carga: ok(c) as CargaIntegrante[], semResp: s.count ?? 0 };
  }, []);

  if (carregando) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  const carga = dados!.carga;
  const tot = (k: keyof CargaIntegrante) => carga.reduce((s, i) => s + Number(i[k]), 0);

  return (
    <>
      <button type="button" className="voltar nao-imprimir" onClick={onVoltar}>← Voltar para Minhas pendências</button>
      <div className="cabecalho">
        <div>
          <div className="eyebrow">Painel de pendências</div>
          <h1>Pendências da equipe</h1>
          <p>Atividades abertas, prazos e carga de cada integrante do GT</p>
        </div>
        <div className="acoes"><button className="btn" onClick={onVoltar}>Minhas pendências</button></div>
      </div>
      <div className="grid g4 mb">
        <Kpi rotulo="Atividades abertas atribuídas" valor={tot('atividades_abertas')} />
        <Kpi rotulo="Prazos vencidos" valor={tot('atividades_vencidas')} alerta={tot('atividades_vencidas') > 0} />
        <Kpi rotulo="Vencem em até 5 dias" valor={tot('vencem_5_dias')} />
        <Kpi rotulo="Atividades abertas sem responsável" valor={dados!.semResp} alerta={dados!.semResp > 0} nota="designe na contratação ou por etapa" />
      </div>
      <div className="card">
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr><th>Integrante</th><th>Frente · órgão</th><th className="right">Abertas</th><th className="right">Em curso</th><th className="right">Vencidas</th><th className="right">≤ 5 dias</th><th className="right">Concluídas</th><th className="right">Contratações</th><th /></tr>
            </thead>
            <tbody>
              {carga.map((i) => (
                <tr key={i.id} className="clicavel" onClick={() => nav(`/pendencias/${i.id}`)}>
                  <td><div className="pessoa"><Iniciais nome={i.nome} frente={i.frente} /><div><div className="obj">{i.nome}</div><div className="sub">{i.funcao}</div></div></div></td>
                  <td>{i.frente ? `Frente ${i.frente}` : '—'} · {i.orgao}</td>
                  <td className="right mono"><strong>{i.atividades_abertas}</strong></td>
                  <td className="right mono">{i.atividades_em_curso}</td>
                  <td className={`right mono ${i.atividades_vencidas ? 'red' : ''}`}><strong>{i.atividades_vencidas}</strong></td>
                  <td className="right mono">{i.vencem_5_dias}</td>
                  <td className="right mono">{i.atividades_concluidas}</td>
                  <td className="right mono">{i.contratacoes_envolvidas}{i.contratacoes_coordenadas ? ` (+${i.contratacoes_coordenadas} coord.)` : ''}</td>
                  <td className="acoes-td"><span className="abrir">Ver <IcSeta width={14} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
