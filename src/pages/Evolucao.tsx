import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp, useCarregar } from '../lib/app';
import { lerTodas, ok, supabase } from '../lib/supabase';
import { ROMANOS, num2 } from '../lib/format';
import type { AtividadeView, ContratacaoView } from '../lib/types';
import { Carregando, Erro } from '../components/ui';

const f1 = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const pct = (v: number, t: number) => (t ? f1((v / t) * 100) : '0') + '%';
const COR_ETAPA = ['#16284d', '#2a4478', '#c8962f', '#8a5f0d', '#6f8fc4'];
const COR_SITUACAO: Record<string, string> = {
  'Em instrução': '#6f8fc4', 'Em andamento': '#c8962f', Aguardando: '#8b8577', Devolvida: '#b3372b', 'Divergência': '#d4574a',
  'Sem justificativa': '#e9a39a', Suspensa: '#a39e92', 'Concluída': '#2c7a4d', Cancelada: '#5f5c55',
};
const MIN_SEMANAS = 3;

/** Segunda-feira da semana da data (AAAA-MM-DD). */
function semanaDe(isoData: string): string {
  const [a, m, d] = isoData.slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
  return dt.toISOString().slice(0, 10);
}
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const dica = (...linhas: (string | false | null | undefined)[]) => ({ 'data-dica': linhas.filter(Boolean).join('\n'), tabIndex: 0 });

export default function Evolucao() {
  const { cat } = useApp();
  const { dados, erro, carregando } = useCarregar(async () => {
    const [c, a] = await Promise.all([
      supabase.from('vw_contratacoes').select('*').order('numero'),
      lerTodas<AtividadeView>((de, ate) => supabase.from('vw_atividades').select('*').order('id').range(de, ate)),
    ]);
    return { contratacoes: (ok(c) as ContratacaoView[]).filter((x) => !x.rascunho), atividades: a };
  }, []);

  const m = useMemo(() => {
    if (!dados) return null;
    const ids = new Set(dados.contratacoes.map((c) => c.id));
    const at = dados.atividades.filter((a) => ids.has(a.contratacao_id) && a.status !== 'nao_se_aplica');
    const conc = at.filter((a) => a.status === 'concluida');
    const curso = at.filter((a) => ['em_andamento', 'aguardando', 'devolvida'].includes(a.status));
    // série semanal pelas datas de conclusão
    const porSemana = new Map<string, number[]>();
    conc.forEach((a) => {
      if (!a.data_conclusao) return;
      const s = semanaDe(a.data_conclusao);
      const v = porSemana.get(s) ?? [0, 0, 0, 0, 0];
      v[a.etapa - 1] += 1;
      porSemana.set(s, v);
    });
    const semanas: { s: string; total: number; etapas: number[] }[] = [];
    if (porSemana.size) {
      const ini = [...porSemana.keys()].sort()[0];
      const fim = semanaDe(new Date().toISOString());
      for (let d = new Date(ini + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= fim; d.setUTCDate(d.getUTCDate() + 7)) {
        const k = d.toISOString().slice(0, 10);
        const e = porSemana.get(k) ?? [0, 0, 0, 0, 0];
        semanas.push({ s: k, total: e.reduce((x, y) => x + y, 0), etapas: e });
      }
    }
    return { at, conc, curso, semanas, contratacoes: dados.contratacoes };
  }, [dados]);

  if (carregando) return <Carregando />;
  if (erro || !m) return <Erro msg={erro} />;

  const { at, conc, curso, semanas, contratacoes } = m;
  const TOT = at.length;
  const situacoes = [...new Set(contratacoes.map((c) => c.situacao))]
    .map((s) => [s, contratacoes.filter((c) => c.situacao === s).length, COR_SITUACAO[s] ?? '#8b8577'] as [string, number, string])
    .sort((a, b) => b[1] - a[1]);
  const etapas = cat.etapas.map((e) => {
    const t = at.filter((a) => a.etapa === e.numero);
    return { e, total: t.length, conc: t.filter((a) => a.status === 'concluida').length };
  }).filter((x) => x.total > 0);
  const mods = cat.modalidades.map((md) => ({ md, n: contratacoes.filter((c) => c.modalidade === md.codigo).length })).filter((x) => x.n > 0);
  const alemEtapa1 = contratacoes.filter((c) => (c.etapa_atual ?? 1) > 1).length;

  return (
    <Dicas>
      <div className="cabecalho">
        <div>
          <div className="eyebrow">Indicadores de desempenho</div>
          <h1>Evolução</h1>
          <p>Situação atual da carteira e evolução semanal das atividades, com média, tendência e projeção. Passe o mouse sobre os gráficos para ver os valores.</p>
        </div>
      </div>

      <h2 className="mb">Situação atual</h2>
      <div className="grid g4 mb">
        <Kpi rotulo="Atividades concluídas" valor={<>{conc.length}<span className="small muted"> / {TOT}</span></>} nota={`${pct(conc.length, TOT)} do checklist`}
          d={dica('Atividades concluídas', `${conc.length} de ${TOT} atividades do checklist (${pct(conc.length, TOT)})`)} />
        <Kpi rotulo="Em curso" valor={curso.length} nota="em andamento, aguardando ou devolvidas" cor="var(--gold-ink)"
          d={dica('Atividades em curso', `${curso.length} atividades em andamento, aguardando terceiros ou devolvidas`)} />
        <Kpi rotulo="Contratações além da Etapa I" valor={alemEtapa1} nota={`de ${contratacoes.length}`} cor={alemEtapa1 ? 'var(--navy)' : 'var(--red)'}
          d={dica('Contratações além da Etapa I', `${alemEtapa1} de ${contratacoes.length} contratações já passaram do planejamento`)} />
        <Kpi rotulo="Semanas de histórico" valor={semanas.length} nota={semanas.length ? `desde ${ddmm(semanas[0].s)}` : 'nenhuma conclusão registrada'}
          d={dica('Semanas de histórico', 'Semanas desde a primeira atividade concluída registrada no sistema')} />
      </div>

      <div className="evol-grade mb">
        <div className="card">
          <h2 className="card-titulo">Atividades por situação</h2>
          <p className="small muted">Checklist completo das {contratacoes.length} contratações</p>
          <Rosca total={TOT} rotulo="atividades" unidade="atividades" fatias={[
            ['concluídas', conc.length, '#16284d'], ['em curso', curso.length, '#c8962f'], ['pendentes', TOT - conc.length - curso.length, '#e6e0d4'],
          ]} />
        </div>
        <div className="card">
          <h2 className="card-titulo">Demandas por situação</h2>
          <p className="small muted">Situação registrada em cada contratação</p>
          <Rosca total={contratacoes.length} rotulo="demandas" unidade="demandas" fatias={situacoes} />
        </div>
        <div className="card">
          <h2 className="card-titulo">Andamento por etapa</h2>
          <p className="small muted">Concluídas sobre o total de atividades previstas em cada etapa</p>
          {etapas.map(({ e, total, conc: c }) => (
            <BarraH key={e.numero} rotulo={`${ROMANOS[e.numero]} · ${e.nome}`} valor={c} total={total} direita={`${c} de ${total}`}
              d={dica(`Etapa ${ROMANOS[e.numero]} · ${e.nome}`, `${c} de ${total} atividades concluídas (${pct(c, total)})`, `${total - c} atividades ainda não concluídas`)} />
          ))}
        </div>
        <div className="card">
          <h2 className="card-titulo">Demandas por modalidade</h2>
          <p className="small muted">A modalidade define o tamanho do checklist</p>
          {mods.map(({ md, n }) => {
            const tam = (md.etapas ?? []).reduce((s, et) => s + cat.modelo.filter((x) => x.etapa === et).length, 0);
            return (
              <BarraH key={md.codigo} rotulo={md.nome} valor={n} total={contratacoes.length} direita={`${n} de ${contratacoes.length}`} cor={md.codigo === 'a_definir' ? '#c8962f' : '#16284d'}
                d={dica(md.nome, `${n} de ${contratacoes.length} demandas (${pct(n, contratacoes.length)})`, `Checklist de ${tam} atividades por demanda`)} />
            );
          })}
        </div>
        <div className="card largo">
          <h2 className="card-titulo">Progresso por contratação</h2>
          <p className="small muted">Percentual de evolução: atividades concluídas sobre o total do checklist de cada contratação</p>
          <div className="evol-colunas2">
            {contratacoes.map((c) => (
              <BarraH key={c.id} rotulo={`${num2(c.numero)} · ${c.titulo}`} valor={c.atividades_concluidas} total={c.total_atividades}
                direita={<><b>{c.total_atividades ? Math.round((c.atividades_concluidas / c.total_atividades) * 100) : 0}%</b> · {c.atividades_concluidas}/{c.total_atividades}</>}
                d={dica(`${num2(c.numero)} · ${c.titulo}`, `Evolução: ${pct(c.atividades_concluidas, c.total_atividades)} (${c.atividades_concluidas} de ${c.total_atividades} atividades concluídas)`, `Modalidade: ${c.modalidade_nome} · atividade atual: ${c.atividade_atual_nome ?? '—'}`)} />
            ))}
          </div>
        </div>
      </div>

      <h2 className="mb">Evolução no tempo</h2>
      {semanas.length < MIN_SEMANAS ? (
        <div className="card">
          <div className="vazio">
            <strong>Histórico insuficiente</strong><br />
            <span className="small">
              O sistema possui {semanas.length} semana(s) com registro de conclusão ({conc.length} atividades concluídas). Os gráficos de evolução semanal,
              média, tendência, curva acumulada e burn-down são exibidos a partir de {MIN_SEMANAS} semanas de histórico.
            </span>
          </div>
        </div>
      ) : <SerieTemporal semanas={semanas} total={TOT} />}
    </Dicas>
  );
}

function SerieTemporal({ semanas, total }: { semanas: { s: string; total: number; etapas: number[] }[]; total: number }) {
  const ys = semanas.map((s) => s.total);
  const rot = semanas.map((s) => ddmm(s.s));
  let ac = 0;
  const acum = ys.map((v) => (ac += v));
  const pend = acum.map((a) => Math.max(0, total - a));
  const ult = ys.slice(-4);
  const media = ult.reduce((a, b) => a + b, 0) / ult.length;
  const n = ys.length, mx = (n - 1) / 2, my = ys.reduce((a, b) => a + b, 0) / n;
  const den = ys.reduce((a, _, i) => a + (i - mx) ** 2, 0) || 1;
  const inc = ys.reduce((a, y, i) => a + (i - mx) * (y - my), 0) / den;
  const proj = [1, 2, 3, 4].map((k) => Math.max(0, Math.round(my + inc * (n - 1 + k - mx))));
  const mm = ys.map((_, i) => (i < 3 ? null : ys.slice(i - 3, i + 1).reduce((a, b) => a + b, 0) / 4));
  const rotP = [...rot, '+1', '+2', '+3', '+4'];
  const pendProj: (number | null)[] = pend.map(() => null);
  let pp = pend[n - 1];
  pendProj[n - 1] = pp;
  proj.forEach((v) => { pp = Math.max(0, pp - v); pendProj.push(pp); });
  const semanasFim = media > 0 ? Math.ceil(pend[n - 1] / media) : null;
  const vazio4 = [null, null, null, null];
  const ET = ['I · Planejamento', 'II · Adesão à ARP', 'III · Comunicações', 'IV · Pesquisa de preços', 'V · Formalização'];

  return (
    <>
      <div className="grid g4 mb">
        <Kpi rotulo="Média das últimas 4 semanas" valor={f1(media)} nota="atividades concluídas por semana"
          d={dica('Média das últimas 4 semanas', `(${ult.join(' + ')}) ÷ ${ult.length} = ${f1(media)} atividades concluídas por semana`)} />
        <Kpi rotulo="Tendência" valor={`${inc >= 0 ? '▲' : '▼'} ${f1(Math.abs(inc))}`} nota="atividades a mais (ou a menos) por semana, a cada semana" cor={inc >= 0 ? 'var(--green)' : 'var(--red)'}
          d={dica('Tendência (quantidade, não percentual)', `A cada semana, o número de atividades concluídas ${inc >= 0 ? 'cresce' : 'cai'} em média ${f1(Math.abs(inc))} atividade(s)`, `Inclinação da reta de tendência sobre ${n} semanas`)} />
        <Kpi rotulo="Concluídas no período" valor={acum[n - 1]} nota={`em ${n} semanas`}
          d={dica('Concluídas no período', `${acum[n - 1]} atividades concluídas em ${n} semanas`, `${pct(acum[n - 1], total)} das ${total} atividades do checklist`)} />
        <Kpi rotulo="Previsão no ritmo médio" valor={semanasFim != null ? `${semanasFim} sem.` : '—'} nota={`para concluir as ${pend[n - 1]} pendentes`} cor="var(--gold-ink)"
          d={dica('Previsão no ritmo médio', semanasFim != null ? `${pend[n - 1]} pendentes ÷ ${f1(media)} por semana ≈ ${semanasFim} semanas` : 'Sem conclusões nas últimas semanas', 'Estimativa; não considera mudanças de ritmo')} />
      </div>
      <div className="evol-grade">
        <div className="card">
          <h2 className="card-titulo">Concluídas por semana</h2>
          <p className="small muted">Quantidade de atividades concluídas em cada semana</p>
          <Colunas rotulos={rot} valores={ys.map((v) => [v])} cores={['#16284d']}
            dicaDe={(i) => dica(`Semana de ${rot[i]}`, `${ys[i]} atividades concluídas na semana`, i > 0 && `${ys[i] - ys[i - 1] >= 0 ? '+' : ''}${ys[i] - ys[i - 1]} em relação à semana anterior (${ys[i - 1]})`)} />
        </div>
        <div className="card">
          <h2 className="card-titulo">Tendência e projeção</h2>
          <p className="small muted">Quantidade de atividades concluídas por semana, média móvel de 4 semanas e projeção linear das próximas 4 (estimativa)</p>
          <Linhas rotulos={rotP} eixo="atividades por semana" series={[
            { nome: 'Concluídas na semana', cor: '#16284d', pts: [...ys, ...vazio4], dica: (v, i) => dica(`Semana de ${rotP[i]} · registrado`, `${v} atividades concluídas na semana`) },
            { nome: 'Média móvel (4 semanas)', cor: '#c8962f', pts: [...mm, ...vazio4], dica: (v, i) => dica(`Semana de ${rotP[i]} · média móvel`, `${f1(v)} atividades por semana`, `Média das 4 semanas encerradas em ${rotP[i]} (${ys.slice(i - 3, i + 1).join(' + ')}) ÷ 4`) },
            { nome: 'Projeção (estimativa)', cor: '#8a5f0d', tracejada: true, pts: [...ys.map((v, i) => (i === n - 1 ? v : null)), ...proj], pular: (i) => i === n - 1,
              dica: (v, i) => dica(`Semana ${rotP[i]} · projeção`, `${v} atividades concluídas previstas na semana`, `Estimativa pela reta de tendência (${inc >= 0 ? '+' : ''}${f1(inc)} por semana); não é dado registrado`) },
          ]} />
        </div>
        <div className="card">
          <h2 className="card-titulo">Curva acumulada de conclusão</h2>
          <p className="small muted">Quantidade total de atividades concluídas até o fim de cada semana</p>
          <Linhas rotulos={rot} eixo="atividades (acumulado)" series={[
            { nome: 'Concluídas (acumulado)', cor: '#16284d', pts: acum, dica: (v, i) => dica(`Até a semana de ${rot[i]}`, `${v} atividades concluídas no total`, `${pct(v, total)} das ${total} atividades do checklist`, `+${ys[i]} na semana`) },
          ]} />
        </div>
        <div className="card">
          <h2 className="card-titulo">Burn-down das atividades pendentes</h2>
          <p className="small muted">Quantidade de atividades pendentes ao fim de cada semana (sobre o checklist atual) e projeção no ritmo da tendência (estimativa)</p>
          <Linhas rotulos={rotP} eixo="atividades pendentes" max={total} series={[
            { nome: 'Pendentes', cor: '#b3372b', pts: [...pend, ...vazio4], dica: (v, i) => dica(`Fim da semana de ${rotP[i]} · registrado`, `${v} atividades pendentes`, `${pct(v, total)} das ${total} atividades do checklist`) },
            { nome: 'Projeção (estimativa)', cor: '#b3372b', tracejada: true, pts: pendProj, pular: (i) => i <= n - 1,
              dica: (v, i) => dica(`Semana ${rotP[i]} · projeção`, `${v} atividades pendentes previstas`, `${pct(v, total)} das ${total}; estimativa no ritmo da tendência, não é dado registrado`) },
          ]} />
        </div>
        <div className="card largo">
          <h2 className="card-titulo">Concluídas por semana, por etapa</h2>
          <p className="small muted">Quantidade de atividades concluídas em cada semana, separada por etapa</p>
          <Colunas rotulos={rot} valores={semanas.map((s) => s.etapas)} cores={COR_ETAPA} alto
            dicaDe={(i, k) => dica(`Semana de ${rot[i]} · Etapa ${ET[k!]}`, `${semanas[i].etapas[k!]} atividade(s) concluída(s) nesta etapa`, `${pct(semanas[i].etapas[k!], semanas[i].total)} das ${semanas[i].total} concluídas na semana`)} />
          <div className="evol-legenda">{ET.map((r, k) => <span key={r}><i style={{ background: COR_ETAPA[k] }} />{r}</span>)}</div>
        </div>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ componentes gráficos
type Dica = ReturnType<typeof dica>;

function Kpi({ rotulo, valor, nota, cor = 'var(--navy)', d }: { rotulo: string; valor: ReactNode; nota: string; cor?: string; d: Dica }) {
  return (
    <div className="card kpi evol-alvo" {...d}>
      <div className="small muted">{rotulo}</div>
      <div className="evol-kpi" style={{ color: cor }}>{valor}</div>
      <div className="small muted">{nota}</div>
    </div>
  );
}

function BarraH({ rotulo, valor, total, direita, cor = '#16284d', d }: { rotulo: string; valor: number; total: number; direita: ReactNode; cor?: string; d: Dica }) {
  return (
    <div className="evol-hbar evol-alvo" {...d}>
      <span className="rot">{rotulo}</span>
      <span className="trilho"><i style={{ width: `${total ? (valor / total) * 100 : 0}%`, background: cor }} /></span>
      <span className="dir">{direita}</span>
    </div>
  );
}

function Rosca({ fatias, total, rotulo, unidade }: { fatias: [string, number, string][]; total: number; rotulo: string; unidade: string }) {
  const R = 70, C = 2 * Math.PI * R;
  let ac = 0;
  const d = (n: string, v: number) => dica(`${v} ${unidade} · ${n}`, `${pct(v, total)} do total de ${total} ${unidade}`);
  return (
    <div className="evol-rosca">
      <svg viewBox="0 0 180 180" width="170" height="170" role="img" aria-label={rotulo}>
        {fatias.filter(([, v]) => v > 0).map(([nm, v, cor]) => {
          const l = total ? (v / total) * C : 0;
          const el = <circle key={nm} className="evol-fatia" r={R} cx="90" cy="90" fill="none" stroke={cor} strokeWidth="26" strokeDasharray={`${l} ${C - l}`} strokeDashoffset={-ac} transform="rotate(-90 90 90)" {...d(nm, v)} />;
          ac += l;
          return el;
        })}
        <text x="90" y="86" textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontWeight="700" fontSize="28" fill="#16284d" pointerEvents="none">{total}</text>
        <text x="90" y="106" textAnchor="middle" fontSize="11" fill="#6e6758" pointerEvents="none">{rotulo}</text>
      </svg>
      <div>
        {fatias.map(([nm, v, cor]) => (
          <div key={nm} className="evol-leg evol-alvo" {...d(nm, v)}>
            <i style={{ background: cor }} /><b>{v}</b> {nm} <span className="muted">({pct(v, total)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Colunas({ rotulos, valores, cores, dicaDe, alto }: { rotulos: string[]; valores: number[][]; cores: string[]; dicaDe: (i: number, k?: number) => Dica; alto?: boolean }) {
  const h = alto ? 180 : 160;
  const max = Math.max(1, ...valores.map((v) => v.reduce((a, b) => a + b, 0)));
  return (
    <>
      <div className="xs muted">Eixo vertical: quantidade de atividades concluídas</div>
      <div className="evol-colunas" style={{ height: h }}>
        {valores.map((v, i) => {
          const t = v.reduce((a, b) => a + b, 0);
          return (
            <div key={i} className="col">
              <span className="xs muted">{t}</span>
              <div className="pilha-col">
                {v.map((x, k) => (x ? <i key={k} className="seg" style={{ height: (x / max) * (h - 30), background: cores[k] }} {...(v.length > 1 ? dicaDe(i, k) : dicaDe(i))} /> : null)).reverse()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="evol-eixo">{rotulos.map((r, i) => <span key={i}>{r}</span>)}</div>
    </>
  );
}

interface Serie { nome: string; cor: string; pts: (number | null)[]; tracejada?: boolean; pular?: (i: number) => boolean; dica: (v: number, i: number) => Dica }
function Linhas({ rotulos, series, eixo, max }: { rotulos: string[]; series: Serie[]; eixo: string; max?: number }) {
  const W = 560, H = 180, pl = 44, pb = 22, pt = 12, n = rotulos.length;
  const my = max ?? Math.max(1, ...series.flatMap((s) => s.pts.filter((v): v is number => v != null)));
  const x = (i: number) => pl + (i * (W - pl - 10)) / Math.max(1, n - 1);
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / my);
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={eixo} style={{ overflow: 'visible' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((fr) => (
          <g key={fr}>
            <line x1={pl} x2={W - 10} y1={y(my * fr)} y2={y(my * fr)} stroke="#ece6da" />
            <text x={pl - 6} y={y(my * fr) + 4} fontSize="10" textAnchor="end" fill="#6e6758">{Math.round(my * fr)}</text>
          </g>
        ))}
        <text x="12" y={(H - pb) / 2} fontSize="10" fill="#6e6758" textAnchor="middle" transform={`rotate(-90 12 ${(H - pb) / 2})`}>{eixo}</text>
        {series.map((s) => (
          <g key={s.nome}>
            <polyline points={s.pts.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(' ')} fill="none" stroke={s.cor} strokeWidth="2.5" strokeDasharray={s.tracejada ? '6 5' : undefined} pointerEvents="none" />
            {s.pts.map((v, i) => (v == null || s.pular?.(i) ? null : (
              <g key={i}>
                <circle cx={x(i)} cy={y(v)} r="3.5" fill={s.cor} pointerEvents="none" />
                <circle className="evol-ponto" cx={x(i)} cy={y(v)} r="11" fill="transparent" {...s.dica(v, i)} />
              </g>
            )))}
          </g>
        ))}
        {rotulos.map((r, i) => <text key={i} x={x(i)} y={H - 5} fontSize="10" textAnchor="middle" fill="#6e6758">{r}</text>)}
      </svg>
      <div className="evol-legenda">{series.map((s) => <span key={s.nome}><i style={{ background: s.cor }} />{s.nome}</span>)}</div>
    </>
  );
}

/** Caixa de informação que acompanha o mouse (ou o foco do teclado) sobre elementos com data-dica. */
function Dicas({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dc, setDc] = useState<{ linhas: string[]; x: number; y: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const alvo = (t: EventTarget | null) => (t instanceof Element ? t.closest('[data-dica]') : null);
    const mover = (e: MouseEvent) => { const a = alvo(e.target); setDc(a ? { linhas: a.getAttribute('data-dica')!.split('\n'), x: e.clientX, y: e.clientY } : null); };
    const foco = (e: FocusEvent) => { const a = alvo(e.target); if (!a) return; const r = a.getBoundingClientRect(); setDc({ linhas: a.getAttribute('data-dica')!.split('\n'), x: r.left + r.width / 2, y: r.bottom }); };
    const sair = () => setDc(null);
    el.addEventListener('mousemove', mover); el.addEventListener('mouseleave', sair);
    el.addEventListener('focusin', foco); el.addEventListener('focusout', sair);
    window.addEventListener('scroll', sair, true);
    return () => { el.removeEventListener('mousemove', mover); el.removeEventListener('mouseleave', sair); el.removeEventListener('focusin', foco); el.removeEventListener('focusout', sair); window.removeEventListener('scroll', sair, true); };
  }, []);
  const esq = dc ? Math.min(dc.x + 14, window.innerWidth - 330) : 0;
  const topo = dc ? (dc.y + 120 > window.innerHeight ? dc.y - 100 : dc.y + 16) : 0;
  return (
    <div ref={ref}>
      {children}
      {dc && (
        <div className="evol-dica" style={{ left: esq, top: topo }} role="tooltip">
          <b>{dc.linhas[0]}</b>
          {dc.linhas.slice(1).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
