import { Link } from 'react-router-dom';
import { useApp, useCarregar } from '../lib/app';
import { ok, supabase } from '../lib/supabase';
import { FRENTES, PAPEIS, ROMANOS } from '../lib/format';
import type { CargaIntegrante, Frente, Papel } from '../lib/types';
import { Barra, Carregando, Erro, Iniciais, Selo } from '../components/ui';

/** Matriz de responsabilidades por etapa (Caminho crítico × composição do GT). */
const MATRIZ: Record<number, Record<Frente, 'E' | 'A' | 'C' | 'L' | ''>> = {
  1: { I: 'A', II: 'E', III: 'L' },
  2: { I: 'A', II: 'E', III: 'L' },
  3: { I: 'A', II: 'C', III: 'E' },
  4: { I: 'A', II: 'C', III: 'E' },
  5: { I: 'A', II: '', III: 'E' },
};
const LEG = { E: 'Executa', A: 'Coordena / aprova / conformidade', C: 'Apoia (consulta)', L: 'Lança nos sistemas' };

export default function Equipe() {
  const { cat } = useApp();
  const { dados, erro, carregando } = useCarregar(
    async () => ok(await supabase.from('vw_carga_integrantes').select('*').order('nome')) as CargaIntegrante[],
    [],
  );
  if (carregando) return <Carregando />;
  if (erro) return <Erro msg={erro} />;

  const membros = (dados ?? []).filter((i) => i.membro_gt && i.ativo);
  const orgaos = ['SEDES', 'SECTI', 'FAETEC', 'PRODERJ'].map((o) => ({ o, n: membros.filter((i) => i.orgao === o).length }));
  const hib = membros.filter((i) => i.modelo_trabalho === 'Híbrido').length;
  const pres = membros.filter((i) => i.modelo_trabalho === 'Presencial').length;
  const rem = membros.filter((i) => i.modelo_trabalho === 'Remoto').length;
  const maxCarga = Math.max(1, ...membros.map((i) => i.atividades_abertas));

  return (
    <>
      <div className="cabecalho">
        <div>
          <div className="eyebrow">Composição do GT · {membros.length} integrantes · {orgaos.filter((x) => x.n).length} órgãos</div>
          <h1>Equipe do GT</h1>
          <p>Quem faz o quê no fluxo de contratação, formato de trabalho e carga atual</p>
        </div>
        <div className="acoes"><Link className="btn" to="/pendencias">Painel de pendências</Link></div>
      </div>

      <div className="grid g4 mb">
        <div className="card kpi"><div className="rotulo">Integrantes</div><div className="valor">{membros.length}</div><div className="nota">3 frentes de trabalho</div></div>
        <div className="card kpi"><div className="rotulo">Composição por órgão</div><div className="valor" style={{ fontSize: 22 }}>{orgaos.map((x) => `${x.o} ${x.n}`).join(' · ')}</div></div>
        <div className="card kpi"><div className="rotulo">Modelo de operação</div><div className="valor" style={{ fontSize: 22 }}>Presencial {pres} · Híbrido {hib}{rem ? ` · Remoto ${rem}` : ''}</div><div className="nota">Híbrido: atuação remota + presencial</div></div>
        <div className="card kpi"><div className="rotulo">Atividades abertas atribuídas</div><div className="valor">{membros.reduce((s, i) => s + i.atividades_abertas, 0)}</div><div className="nota">{membros.reduce((s, i) => s + i.atividades_vencidas, 0)} com prazo vencido</div></div>
      </div>

      <div className="grid g3 mb" style={{ alignItems: 'start' }}>
        {(['I', 'II', 'III'] as Frente[]).map((f) => {
          const lista = membros.filter((i) => i.frente === f);
          const orgs = [...new Set(lista.map((i) => i.orgao))];
          return (
            <div className="card" key={f}>
              <div className="eyebrow">Frente {f}</div>
              <h2 className="serif" style={{ fontSize: 19, margin: '4px 0' }}>{FRENTES[f].nome}</h2>
              <div className="small muted mb">{lista.length} integrantes · {orgs.map((o) => `${o} (${lista.filter((i) => i.orgao === o).length})`).join(' · ')}</div>
              <ul className="lista-resumo">
                {lista.map((i) => (
                  <li key={i.id}>
                    <Link to={`/pendencias/${i.id}`} className="pessoa" style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                      <Iniciais nome={i.nome} frente={i.frente} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{i.nome}</div>
                        <div className="xs muted">{i.orgao} · {i.funcao}</div>
                      </div>
                    </Link>
                    <div className="right" style={{ flex: 'none' }}>
                      <Selo cor={i.modelo_trabalho === 'Híbrido' ? 'roxo' : 'azul'} quadrado>{i.modelo_trabalho}</Selo>
                      <div className="xs muted" style={{ marginTop: 3 }}>
                        {i.atividades_abertas} abertas{i.atividades_vencidas ? <span className="red"> · {i.atividades_vencidas} venc.</span> : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="grid g-2-1 mb" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-titulo">
            <h2>Quem faz o quê no fluxo de contratação</h2>
            <div className="legenda">
              {Object.entries(LEG).map(([k, v]) => <span key={k}><span className={`raci ${k}`} style={{ width: 20, height: 20, fontSize: 10 }}>{k}</span>{v}</span>)}
            </div>
          </div>
          <div className="tabela-wrap">
            <table className="tabela matriz">
              <thead>
                <tr><th>Etapa</th><th>Frente I<br /><span className="xs">Coordenação</span></th><th>Frente II<br /><span className="xs">Elaboração</span></th><th>Frente III<br /><span className="xs">Pontos focais</span></th><th style={{ textAlign: 'left' }}>Equipe · atenção</th></tr>
              </thead>
              <tbody>
                {cat.etapas.map((e) => {
                  const ativs = cat.modelo.filter((m) => m.etapa === e.numero && m.ativo);
                  return (
                    <tr key={e.numero}>
                      <td>
                        <div className="obj">{ROMANOS[e.numero]} · {e.nome}</div>
                        <div className="sub">{ativs.length} atividades · Macroprocesso {e.macroprocesso}</div>
                      </td>
                      {(['I', 'II', 'III'] as Frente[]).map((f) => (
                        <td key={f}>{MATRIZ[e.numero]?.[f] ? <span className={`raci ${MATRIZ[e.numero][f]}`}>{MATRIZ[e.numero][f]}</span> : <span className="muted">—</span>}</td>
                      ))}
                      <td style={{ textAlign: 'left' }}>
                        <div className="small">{e.equipe}</div>
                        {e.ponto_atencao && <div className={`xs ${ativs.some((m) => m.prazo_critico) ? 'red' : 'gold'}`}>{e.ponto_atencao}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="xs muted mt-s">
            Etapas IV e V: FAETEC 100% — sem ponto focal nomeado na Relação de Participantes. Designe o responsável em cada contratação para não perder os prazos.
          </p>
        </div>
        <div className="pilha">
          <div className="card">
            <h2 className="mb">Carga atual</h2>
            {membros.filter((i) => i.atividades_abertas > 0).sort((a, b) => b.atividades_abertas - a.atividades_abertas).map((i) => (
              <div className="mod-item" key={i.id}>
                <div className="entre small"><span>{i.nome}</span><strong>{i.atividades_abertas}</strong></div>
                <Barra fina partes={[
                  { valor: i.atividades_vencidas, classe: 'b-red' },
                  { valor: i.atividades_abertas - i.atividades_vencidas, classe: 'b-navy' },
                  { valor: maxCarga - i.atividades_abertas, classe: '' },
                ]} />
              </div>
            ))}
            {membros.every((i) => i.atividades_abertas === 0) && <p className="small muted">Nenhuma atividade atribuída ainda.</p>}
          </div>
          <div className="card">
            <h2 className="mb">Perfis de acesso</h2>
            <ul className="lista-resumo">
              {(Object.keys(PAPEIS) as Papel[]).map((p) => (
                <li key={p} style={{ alignItems: 'flex-start' }}>
                  <div>
                    <strong>{PAPEIS[p].rotulo}</strong>
                    <div className="xs muted">{PAPEIS[p].descricao}</div>
                  </div>
                  <span className="n">{(dados ?? []).filter((i) => i.papel === p && i.ativo).length}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
