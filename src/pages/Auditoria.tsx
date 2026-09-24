import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useCarregar } from '../lib/app';
import { ok, supabase } from '../lib/supabase';
import { dataHora, hojeISO, somarDiasISO } from '../lib/format';
import { CAMPOS, OPERACOES, TABELAS } from '../lib/rotulos';
import { exportarExcel } from '../lib/excel';
import type { RegistroAuditoria } from '../lib/types';
import { Campo, Carregando, Erro, Selo, Vazio } from '../components/ui';
import DiffAuditoria, { resumoRegistro } from '../components/Diff';
import { IcBaixar } from '../components/Icones';

const POR_PAGINA = 100;

export default function Auditoria() {
  const { cat } = useApp();
  const [de, setDe] = useState(somarDiasISO(hojeISO(), -30));
  const [ate, setAte] = useState(hojeISO());
  const [usuario, setUsuario] = useState('');
  const [tabela, setTabela] = useState('');
  const [operacao, setOperacao] = useState('');
  const [pagina, setPagina] = useState(0);
  const [aberto, setAberto] = useState<number | null>(null);

  const { dados, erro, carregando } = useCarregar(async () => {
    let q = supabase.from('auditoria').select('*', { count: 'exact' })
      .gte('created_at', `${de}T00:00:00-03:00`).lte('created_at', `${ate}T23:59:59-03:00`)
      .order('created_at', { ascending: false })
      .range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA - 1);
    if (usuario === 'sistema') q = q.is('integrante_id', null);
    else if (usuario) q = q.eq('integrante_id', usuario);
    if (tabela) q = q.eq('tabela', tabela);
    if (operacao) q = q.eq('operacao', operacao);
    const res = await q;
    return { linhas: ok(res) as RegistroAuditoria[], total: res.count ?? 0 };
  }, [de, ate, usuario, tabela, operacao, pagina]);

  const numeros = new Map<string, string>();
  // nº e nome da contratação para exibir contexto
  const { dados: contratacoes } = useCarregar(
    async () => ok(await supabase.from('contratacoes').select('id, numero, titulo')) as { id: string; numero: number; titulo: string }[],
    [],
  );
  contratacoes?.forEach((c) => numeros.set(c.id, `${String(c.numero).padStart(2, '0')} · ${c.titulo}`));

  async function exportar() {
    const res = await supabase.from('auditoria').select('*')
      .gte('created_at', `${de}T00:00:00-03:00`).lte('created_at', `${ate}T23:59:59-03:00`)
      .order('created_at', { ascending: false }).limit(10000);
    const linhas = (ok(res) as RegistroAuditoria[]).filter((r) =>
      (!usuario || (usuario === 'sistema' ? !r.integrante_id : r.integrante_id === usuario)) &&
      (!tabela || r.tabela === tabela) && (!operacao || r.operacao === operacao));
    await exportarExcel(`auditoria-${de}-a-${ate}`, [{
      nome: 'Auditoria',
      titulo: 'GT PROPAG · Trilha de auditoria',
      subtitulo: `${de.split('-').reverse().join('/')} a ${ate.split('-').reverse().join('/')} · ${linhas.length} registros`,
      linhas,
      colunas: [
        { titulo: 'Data/hora', valor: (r: RegistroAuditoria) => dataHora(r.created_at), largura: 18 },
        { titulo: 'Usuário', valor: (r: RegistroAuditoria) => r.usuario_nome, largura: 28 },
        { titulo: 'Operação', valor: (r: RegistroAuditoria) => OPERACOES[r.operacao].rotulo, largura: 12 },
        { titulo: 'Registro', valor: (r: RegistroAuditoria) => TABELAS[r.tabela] ?? r.tabela, largura: 20 },
        { titulo: 'Identificação', valor: (r: RegistroAuditoria) => resumoRegistro(r), largura: 34 },
        { titulo: 'Contratação', valor: (r: RegistroAuditoria) => (r.contratacao_id ? numeros.get(r.contratacao_id) : ''), largura: 30 },
        { titulo: 'Campos alterados', valor: (r: RegistroAuditoria) => r.campos_alterados?.map((c) => CAMPOS[c] ?? c).join(', '), largura: 40 },
        { titulo: 'Antes (JSON)', valor: (r: RegistroAuditoria) => r.dados_anteriores ? JSON.stringify(r.campos_alterados ? Object.fromEntries(r.campos_alterados.map((k) => [k, r.dados_anteriores![k]])) : r.dados_anteriores) : '', largura: 50 },
        { titulo: 'Depois (JSON)', valor: (r: RegistroAuditoria) => r.dados_novos ? JSON.stringify(r.campos_alterados ? Object.fromEntries(r.campos_alterados.map((k) => [k, r.dados_novos![k]])) : r.dados_novos) : '', largura: 50 },
      ],
    }]);
  }

  const total = dados?.total ?? 0;

  return (
    <>
      <div className="cabecalho">
        <div>
          <div className="eyebrow">Administração · trilha imutável</div>
          <h1>Auditoria</h1>
          <p>Quem alterou, quando e o quê — antes e depois de cada campo. Registros gravados pelo banco, sem possibilidade de edição.</p>
        </div>
        <button className="btn" onClick={exportar}><IcBaixar width={15} /> Exportar Excel</button>
      </div>
      <div className="card mb">
        <div className="form-grid">
          <Campo rotulo="De" className="c2"><input className="input" type="date" value={de} onChange={(e) => { setDe(e.target.value); setPagina(0); }} /></Campo>
          <Campo rotulo="Até" className="c2"><input className="input" type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(0); }} /></Campo>
          <Campo rotulo="Usuário" className="c3">
            <select className="input" value={usuario} onChange={(e) => { setUsuario(e.target.value); setPagina(0); }}>
              <option value="">Todos</option>
              <option value="sistema">Sistema / carga inicial</option>
              {cat.integrantes.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Registro" className="c3">
            <select className="input" value={tabela} onChange={(e) => { setTabela(e.target.value); setPagina(0); }}>
              <option value="">Todos</option>
              {Object.entries(TABELAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Operação" className="c2">
            <select className="input" value={operacao} onChange={(e) => { setOperacao(e.target.value); setPagina(0); }}>
              <option value="">Todas</option>
              {Object.entries(OPERACOES).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
            </select>
          </Campo>
        </div>
      </div>
      <Erro msg={erro} />
      <div className="card">
        {carregando && !dados ? <Carregando /> : !dados?.linhas.length ? <Vazio>Nenhum registro no período.</Vazio> : (
          <>
            <div className="tabela-wrap">
              <table className="tabela">
                <thead><tr><th>Quando</th><th>Quem</th><th>Operação</th><th>Registro</th><th>Contratação</th><th>Campos alterados</th><th /></tr></thead>
                <tbody>
                  {dados.linhas.map((r) => (
                    <Fragment key={r.id}>
                      <tr className="clicavel" onClick={() => setAberto(aberto === r.id ? null : r.id)}>
                        <td className="nowrap">{dataHora(r.created_at)}</td>
                        <td>{r.usuario_nome}</td>
                        <td><Selo cor={OPERACOES[r.operacao].cor}>{OPERACOES[r.operacao].rotulo}</Selo></td>
                        <td><div>{TABELAS[r.tabela] ?? r.tabela}</div><div className="sub">{resumoRegistro(r).slice(0, 60)}</div></td>
                        <td className="small">{r.contratacao_id ? (numeros.has(r.contratacao_id) ? <Link to={`/contratacoes/${r.contratacao_id}`} onClick={(e) => e.stopPropagation()}>{numeros.get(r.contratacao_id)}</Link> : <span className="muted">excluída</span>) : '—'}</td>
                        <td className="small muted" style={{ maxWidth: 260 }}>{r.campos_alterados?.map((c) => CAMPOS[c] ?? c).join(', ') ?? '—'}</td>
                        <td><button className="btn-link">{aberto === r.id ? 'Ocultar' : 'Detalhes'}</button></td>
                      </tr>
                      {aberto === r.id && <tr><td colSpan={7} style={{ background: 'var(--paper)' }}><DiffAuditoria r={r} /></td></tr>}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rodape-tabela">
              <span>{total} registro(s) · página {pagina + 1} de {Math.max(1, Math.ceil(total / POR_PAGINA))}</span>
              <div className="linha">
                <button className="btn pequeno" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
                <button className="btn pequeno" disabled={(pagina + 1) * POR_PAGINA >= total} onClick={() => setPagina((p) => p + 1)}>Próxima</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
