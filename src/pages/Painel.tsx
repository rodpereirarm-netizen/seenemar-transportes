import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp, useCarregar } from '../lib/app';
import { ok, supabase } from '../lib/supabase';
import { ROMANOS, SITUACAO_PRAZO, data, dataHora, moeda, nomeCurto, num2, prazoTexto } from '../lib/format';
import type { AtividadeView, ContratacaoView } from '../lib/types';
import { Letreiro } from '../components/Letreiro';
import { Barra, Carregando, Erro, Selo, SeloLista } from '../components/ui';

const ABERTAS = (a: AtividadeView) => a.status !== 'concluida' && a.status !== 'nao_se_aplica';
const ENCERRADAS = ['Concluída', 'Cancelada'];

export default function Painel() {
  const { cat, integrante } = useApp();
  const nav = useNavigate();
  const [fModalidade, setFModalidade] = useState('');
  const [fEtapa, setFEtapa] = useState('');
  const [fResp, setFResp] = useState('');

  const { dados, erro, carregando } = useCarregar(async () => {
    const [c, a] = await Promise.all([
      supabase.from('vw_contratacoes').select('*').order('numero'),
      supabase.from('vw_atividades').select('*').limit(10000),
    ]);
    return { contratacoes: ok(c) as ContratacaoView[], atividades: ok(a) as AtividadeView[] };
  }, []);

  const f = useMemo(() => {
    if (!dados) return null;
    const cs = dados.contratacoes.filter(
      (c) =>
        !c.rascunho &&
        (!fModalidade || c.modalidade === fModalidade) &&
        (!fEtapa || String(c.etapa_atual) === fEtapa) &&
        (!fResp ||
          c.responsavel_geral_id === fResp ||
          c.atividade_atual_responsavel_id === fResp ||
          dados.atividades.some((a) => a.contratacao_id === c.id && a.responsavel_id === fResp && ABERTAS(a))),
    );
    const ids = new Set(cs.map((c) => c.id));
    const as = dados.atividades.filter((a) => ids.has(a.contratacao_id));
    return { cs, as, ativas: cs.filter((c) => !ENCERRADAS.includes(c.situacao)) };
  }, [dados, fModalidade, fEtapa, fResp]);

  if (carregando) return <Carregando />;
  if (erro || !f || !dados) return <Erro msg={erro} />;

  const { cs, as, ativas } = f;
  const comValor = ativas.filter((c) => c.valor_estimado != null);
  const valorTotal = comValor.reduce((s, c) => s + Number(c.valor_estimado), 0);
  const semJust = ativas.filter((c) => !c.justificativa_recebida);
  const legais = as.filter((a) => a.tipo_prazo && ABERTAS(a) && a.prazo_legal);
  const legaisVencidos = legais.filter((a) => a.situacao_prazo === 'vencido');
  const vencidas = as.filter((a) => ABERTAS(a) && a.situacao_prazo === 'vencido');
  const proximas = as
    .filter((a) => ABERTAS(a) && a.prazo_efetivo && (a.situacao_prazo === 'atencao' || a.situacao_prazo === 'no_prazo'))
    .sort((a, b) => (a.prazo_efetivo! < b.prazo_efetivo! ? -1 : 1));

  const porEtapa = cat.etapas.map((e) => ({ e, n: ativas.filter((c) => c.etapa_atual === e.numero).length }));
  const etapaMaior = porEtapa.reduce((m, x) => (x.n > m.n ? x : m), porEtapa[0] ?? { n: 0, e: null as never });
  const distribEtapa = porEtapa.filter((x) => x.n > 0);

  // Etapa I · andamento (colunas da planilha do GT + checklist)
  const statusAtiv = (nome: string) => {
    const lista = as.filter((a) => a.nome === nome && a.status !== 'nao_se_aplica');
    return {
      feito: lista.filter((a) => a.status === 'concluida').length,
      and: lista.filter((a) => ['em_andamento', 'aguardando', 'devolvida'].includes(a.status)).length,
    };
  };
  const trMapa = (() => {
    const tr = as.filter((a) => a.nome === 'Elaboração do TR' || a.nome === 'Mapa de Riscos');
    const porC = new Map<string, string[]>();
    tr.forEach((a) => porC.set(a.contratacao_id, [...(porC.get(a.contratacao_id) ?? []), a.status]));
    let feito = 0, and = 0;
    porC.forEach((st) => {
      if (st.every((s) => s === 'concluida' || s === 'nao_se_aplica')) feito++;
      else if (st.some((s) => s !== 'pendente')) and++;
    });
    return { feito, and };
  })();
  const etapa1 = [
    { rotulo: 'Justificativa da área', feito: ativas.filter((c) => c.justificativa_recebida).length, and: 0 },
    {
      rotulo: 'DOD',
      feito: ativas.filter((c) => c.dod_status === 'Elaborado').length,
      and: ativas.filter((c) => ['Em Elaboração', 'Em Análise', 'Devolvido'].includes(c.dod_status ?? '')).length,
    },
    {
      rotulo: 'Definição da via (ata)',
      feito: ativas.filter((c) => c.modalidade !== 'a_definir').length,
      and: ativas.filter((c) => c.modalidade === 'a_definir' && (c.ata_status || c.nenhuma_ata_compativel || c.via_descricao)).length,
    },
    {
      rotulo: 'Manifestação do TI',
      feito: ativas.filter((c) => c.ti_status === 'SIM').length,
      and: ativas.filter((c) => c.ti_status === 'EM ANÁLISE').length,
    },
    { rotulo: 'ETP', ...statusAtiv('Elaboração do ETP') },
    { rotulo: 'TR · Mapa de riscos', ...trMapa },
  ];

  const porModalidade = cat.modalidades
    .map((m) => ({ m, n: ativas.filter((c) => c.modalidade === m.codigo).length }))
    .filter((x) => x.n > 0);
  const maxMod = Math.max(1, ...porModalidade.map((x) => x.n));
  const aDefinir = ativas.filter((c) => c.modalidade === 'a_definir');

  const peso = (c: ContratacaoView) =>
    (c.prazos_vencidos > 0 ? 1000 : 0) +
    (({ 'Divergência': 300, Devolvida: 250, 'Em andamento': 200, Aguardando: 150 } as Record<string, number>)[c.situacao] ?? 0) +
    (c.prioridade === 'Alta' ? 50 : 0) +
    Math.min(49, Number(c.valor_estimado ?? 0) / 1e6);
  const pedemAcao = ativas
    .filter((c) => c.prazos_vencidos > 0 || ['Divergência', 'Devolvida', 'Em andamento', 'Aguardando'].includes(c.situacao))
    .sort((a, b) => peso(b) - peso(a))
    .slice(0, 6);

  const porResp = new Map<string, number>();
  let semResp = 0;
  ativas.forEach((c) => {
    if (!c.atividade_atual_id) return;
    if (c.atividade_atual_responsavel_id)
      porResp.set(c.atividade_atual_responsavel_id, (porResp.get(c.atividade_atual_responsavel_id) ?? 0) + 1);
    else semResp++;
  });
  const respOrdenados = [...porResp.entries()].sort((a, b) => b[1] - a[1]);

  const qualidade = [
    { rotulo: 'Sem datas de andamento', n: ativas.filter((c) => !c.ultimo_andamento_em).length },
    { rotulo: 'Sem processo SEI novo', n: ativas.filter((c) => !c.processo_sei).length },
    { rotulo: 'Sem valor estimado', n: ativas.filter((c) => c.valor_estimado == null).length },
    { rotulo: 'Sem responsável geral', n: ativas.filter((c) => !c.responsavel_geral_id).length },
    { rotulo: 'Divergências a validar', n: ativas.filter((c) => c.situacao === 'Divergência').length },
  ];

  const ultima = dados.contratacoes.reduce((m, c) => (c.updated_at > m ? c.updated_at : m), '');

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Painel de contratações</h1>
          <p>
            Posição em {new Date().toLocaleDateString('pt-BR')} · {ativas.length} demandas em carteira · última
            atualização {dataHora(ultima)}
          </p>
        </div>
        <div className="acoes">
          <span className="eyebrow" style={{ marginRight: 4 }}>Relatórios</span>
          <Link className="btn pequeno" to="/relatorios?periodo=semanal">Report semanal</Link>
          <Link className="btn pequeno" to="/relatorios?periodo=mensal">Report mensal</Link>
          <Link className="btn pequeno" to="/relatorios?periodo=personalizado">Report por período</Link>
        </div>
      </div>

      <Letreiro contratacoes={dados.contratacoes.filter((c) => !c.rascunho && !ENCERRADAS.includes(c.situacao))} atividades={dados.atividades} />

      <div className="linha mb">
        <select className="filtro-btn" value={fModalidade} onChange={(e) => setFModalidade(e.target.value)} aria-label="Modalidade">
          <option value="">Modalidade: todas</option>
          {cat.modalidades.map((m) => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
        </select>
        <select className="filtro-btn" value={fEtapa} onChange={(e) => setFEtapa(e.target.value)} aria-label="Etapa">
          <option value="">Etapa: todas</option>
          {cat.etapas.map((e) => <option key={e.numero} value={e.numero}>Etapa {ROMANOS[e.numero]} · {e.nome}</option>)}
        </select>
        <select className="filtro-btn" value={fResp} onChange={(e) => setFResp(e.target.value)} aria-label="Responsável">
          <option value="">Responsável: todos</option>
          {cat.integrantes.filter((i) => i.ativo && i.membro_gt).map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
        </select>
        {(fModalidade || fEtapa || fResp) && (
          <button className="btn-link" onClick={() => { setFModalidade(''); setFEtapa(''); setFResp(''); }}>Limpar filtros</button>
        )}
      </div>

      <div className="grid g4 mb">
        <div className="card kpi">
          <div className="rotulo">Demandas em carteira</div>
          <div className="valor">{ativas.length}</div>
          <div className="nota">
            {distribEtapa.length === 1
              ? `todas na Etapa ${ROMANOS[distribEtapa[0].e.numero]} · ${distribEtapa[0].e.nome}`
              : distribEtapa.map((x) => `${x.n} na ${ROMANOS[x.e.numero]}`).join(' · ') || 'nenhuma demanda ativa'}
          </div>
        </div>
        <div className="card kpi">
          <div className="rotulo">Valor estimado informado</div>
          <div className="valor">{moeda(valorTotal, true)}</div>
          <div className="nota">apenas {comValor.length} de {ativas.length} demandas com valor</div>
        </div>
        <div className="card kpi">
          <div className="rotulo">Sem justificativa da área</div>
          <div className={`valor ${semJust.length ? 'alerta' : 'ok'}`}>{semJust.length}</div>
          <div className="nota">
            {semJust.length
              ? `itens ${semJust.slice(0, 8).map((c) => num2(c.numero)).join(', ')}${semJust.length > 8 ? '…' : ''} · bloqueiam o DOD`
              : 'todas as demandas justificadas'}
          </div>
        </div>
        <div className="card kpi">
          <div className="rotulo">Prazos legais em contagem</div>
          <div className={`valor ${legaisVencidos.length ? 'alerta' : ''}`}>{legais.length}</div>
          <div className="nota">
            {legais.length === 0
              ? 'nenhuma demanda com envio registrado na Etapa III/V'
              : legaisVencidos.length
                ? `${legaisVencidos.length} vencido(s) · SEPLAG, PRODERJ e CGE`
                : 'todos dentro do prazo'}
          </div>
        </div>
      </div>

      <div className="card mb">
        <div className="card-titulo">
          <h2>Caminho crítico · demandas por etapa</h2>
          <div className="legenda">
            <span><i className="ponto" style={{ background: 'var(--red)' }} /> Prazo legal crítico</span>
            <span><i className="ponto" style={{ background: 'var(--gold)' }} /> Ponto de atenção</span>
          </div>
        </div>
        <div className="etapas">
          {porEtapa.map(({ e, n }) => {
            const ativs = cat.modelo.filter((m) => m.etapa === e.numero && m.ativo);
            const criticos = ativs.filter((m) => m.prazo_critico);
            return (
              <Link
                key={e.numero}
                to={`/contratacoes?etapa=${e.numero}`}
                className={`etapa-card ${n > 0 && e.numero === etapaMaior.e?.numero ? 'ativa' : ''}`}
              >
                <div className="eyebrow">Etapa {ROMANOS[e.numero]}</div>
                <div className="nome">{e.nome}</div>
                <div className="qtd">{n}</div>
                <div className="det">{ativs.length} atividades · {e.equipe}</div>
                {criticos.length > 0 ? (
                  <div className="marcador critico">
                    {criticos.map((m) => `${m.nome.replace(/^(Comunicação à|Análise técnica do|Análise da) /, '').replace(' (TIC)', '')} ${prazoTexto(m.tipo_prazo, m.prazo_dias, m.prorrogacao_dias)}`).join(' · ')}
                  </div>
                ) : e.ponto_atencao ? (
                  <div className="marcador atencao">{e.ponto_atencao.split(' — ')[0]}</div>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid g-3-1 mb">
        <div className="card">
          <div className="card-titulo">
            <h2>Etapa I · andamento das atividades</h2>
            <div className="legenda">
              <span><i className="b-navy" /> Concluída</span>
              <span><i className="b-gold" /> Em andamento</span>
              <span><i style={{ background: '#ebe6da' }} /> Pendente</span>
            </div>
          </div>
          {etapa1.map((l) => (
            <div className="linha-barra" key={l.rotulo}>
              <span>{l.rotulo}</span>
              <Barra partes={[
                { valor: l.feito, classe: 'b-navy' },
                { valor: l.and, classe: 'b-gold' },
                { valor: Math.max(0, ativas.length - l.feito - l.and), classe: '' },
              ]} />
              <span className="n">{l.feito} de {ativas.length}</span>
            </div>
          ))}
          <p className="xs muted mt-s">
            ETP concluído inclui o reaproveitamento do ETP do órgão gerenciador quando a FAETEC é participante da ata.
          </p>
        </div>
        <div className="card">
          <h2 className="mb">Por modalidade</h2>
          {porModalidade.map(({ m, n }) => (
            <div className="mod-item" key={m.codigo}>
              <div className="entre">
                <span>{m.nome}</span>
                <strong className={m.codigo === 'a_definir' ? 'gold' : ''}>{n}</strong>
              </div>
              <Barra fina partes={[
                { valor: n, classe: m.codigo === 'a_definir' ? 'b-gold' : m.codigo === 'adesao_arp' ? 'b-navy' : m.codigo === 'participante_rp' ? 'b-blue' : 'b-blue2' },
                { valor: maxMod - n, classe: '' },
              ]} />
            </div>
          ))}
          {aDefinir.length > 0 && (
            <p className="xs muted mt-s">
              A definir: {aDefinir.filter((c) => c.nenhuma_ata_compativel).length} sem ata compatível encontrada e{' '}
              {aDefinir.filter((c) => !c.justificativa_recebida).length} ainda sem justificativa da área técnica.
            </p>
          )}
        </div>
      </div>

      <div className="grid g-3-1 mb">
        <div className="card">
          <div className="card-titulo">
            <h2>Prazos legais e prazos vencidos</h2>
            <Link to="/relatorios?tipo=prazos" className="btn-link">Relatório de prazos</Link>
          </div>
          {legais.length + vencidas.length === 0 && proximas.length === 0 ? (
            <p className="muted small">
              Nenhum prazo em contagem. O prazo legal começa quando a data de envio é registrada na atividade
              (Comunicação à SEPLAG, Análise técnica do PRODERJ, Análise da CGE).
            </p>
          ) : (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr><th>Nº</th><th>Contratação · atividade</th><th>Responsável</th><th>Prazo</th><th className="right">Dias</th><th>Situação</th></tr>
                </thead>
                <tbody>
                  {[...vencidas, ...legais.filter((a) => a.situacao_prazo !== 'vencido'), ...proximas.filter((a) => !a.tipo_prazo)]
                    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
                    .slice(0, 10)
                    .map((a) => (
                      <tr key={a.id} className="clicavel" onClick={() => nav(`/contratacoes/${a.contratacao_id}`)}>
                        <td className="num">{num2(a.contratacao_numero)}</td>
                        <td>
                          <div className="obj">{a.contratacao_titulo}</div>
                          <div className="sub">
                            {a.nome}
                            {a.tipo_prazo && <> · <span className="red">{prazoTexto(a.tipo_prazo, a.prazo_dias, a.prorrogado ? a.prorrogacao_dias : null)}</span></>}
                          </div>
                        </td>
                        <td>{a.responsavel_nome ? nomeCurto(a.responsavel_nome) : <span className="red">Sem responsável</span>}</td>
                        <td className="nowrap">{data(a.prazo_efetivo)}</td>
                        <td className="right mono">{a.dias_restantes ?? '—'}</td>
                        <td><Selo cor={SITUACAO_PRAZO[a.situacao_prazo].cor}>{SITUACAO_PRAZO[a.situacao_prazo].rotulo}</Selo></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="mb">Prazos legais monitorados</h2>
          <ul className="lista-resumo">
            {cat.modelo.filter((m) => m.prazo_critico).map((m) => (
              <li key={m.id}>
                <span className="red">{m.nome}</span>
                <strong className="red small">{prazoTexto(m.tipo_prazo, m.prazo_dias, m.prorrogacao_dias)}</strong>
              </li>
            ))}
          </ul>
          <p className="xs muted mt-s">
            Contagem conforme art. 183 da Lei 14.133/2021: exclui o dia do envio e prorroga o vencimento para o primeiro dia útil.
            Exposição legal mínima: 15 + 20(+20) + 15 dias em 3 gates que não podem atrasar.
          </p>
        </div>
      </div>

      <div className="grid g-3-1">
        <div className="card">
          <div className="card-titulo">
            <h2>Contratações que pedem ação</h2>
            <Link to="/contratacoes" className="btn-link">Ver as {cs.length} contratações</Link>
          </div>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr><th>Nº</th><th>Objeto · via</th><th>Atividade atual</th><th>Responsável</th><th className="right">Valor</th><th>Situação</th></tr>
              </thead>
              <tbody>
                {pedemAcao.map((c) => (
                  <tr key={c.id} className="clicavel" onClick={() => nav(`/contratacoes/${c.id}`)}>
                    <td className="num">{num2(c.numero)}</td>
                    <td>
                      <div className="obj">{c.titulo}</div>
                      <div className="sub">{c.modalidade_nome}{c.via_descricao ? ` · ${c.via_descricao}` : ''}</div>
                    </td>
                    <td>
                      {c.situacao === 'Divergência' && c.divergencia_obs ? c.divergencia_obs : c.atividade_atual_nome ?? '—'}
                      {c.prazos_vencidos > 0 && <div className="sub red">{c.prazos_vencidos} prazo(s) vencido(s)</div>}
                    </td>
                    <td>
                      {c.atividade_atual_responsavel_nome
                        ? nomeCurto(c.atividade_atual_responsavel_nome)
                        : <span className="red">Sem responsável</span>}
                    </td>
                    <td className="right nowrap">{moeda(c.valor_estimado, true)}</td>
                    <td><SeloLista lista="situacao" valor={c.situacao} /></td>
                  </tr>
                ))}
                {pedemAcao.length === 0 && (
                  <tr><td colSpan={6} className="vazio">Nenhuma contratação exigindo ação imediata.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="pilha">
          <div className="card">
            <h2 className="mb">Pendências por responsável</h2>
            <ul className="lista-resumo">
              {respOrdenados.map(([id, n]) => {
                const i = integrante(id);
                return (
                  <li key={id}>
                    <Link to={`/pendencias/${id}`} style={{ textDecoration: 'none' }}>
                      <strong style={{ color: 'var(--navy)' }}>{i?.nome ?? '—'}</strong>
                      <div className="xs muted">{i?.funcao}</div>
                    </Link>
                    <span className="n">{n}</span>
                  </li>
                );
              })}
              <li>
                <div>
                  <strong className="red">Sem responsável definido</strong>
                  <div className="xs muted">demandas sem atividade atribuída</div>
                </div>
                <span className="n red">{semResp}</span>
              </li>
            </ul>
          </div>
          <div className="card creme">
            <h2 className="mb gold">Qualidade do registro</h2>
            <ul className="lista-resumo">
              {qualidade.map((q) => (
                <li key={q.rotulo}><span>{q.rotulo}</span><span className="n">{q.n}</span></li>
              ))}
            </ul>
            <p className="xs gold mt-s">
              Sem data de envio registrada, o sistema não consegue calcular os prazos da SEPLAG, do PRODERJ e da CGE.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
