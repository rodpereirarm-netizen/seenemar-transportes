import { useState } from 'react';
import { useApp, useCarregar } from '../lib/app';
import { ok, supabase, traduzirErro } from '../lib/supabase';
import { FRENTES, PAPEIS, ROMANOS, data, prazoTexto } from '../lib/format';
import type { AtividadeModelo, Cor, Feriado, Integrante, Modalidade, OpcaoLista, Papel } from '../lib/types';
import { Campo, Carregando, Modal, Segmentado, Selo, toast } from '../components/ui';
import { IcMais } from '../components/Icones';

type Aba = 'integrantes' | 'listas' | 'areas' | 'feriados' | 'modelo' | 'modalidades';

export default function Manutencao() {
  const [aba, setAba] = useState<Aba>('integrantes');
  return (
    <>
      <div className="cabecalho">
        <div>
          <div className="eyebrow">Administração · controle total</div>
          <h1>Manutenção</h1>
          <p>Integrantes e perfis de acesso, listas suspensas, catálogos e regras do fluxo. Tudo registrado na auditoria.</p>
        </div>
      </div>
      <div className="abas">
        {([
          ['integrantes', 'Integrantes e perfis'], ['listas', 'Listas suspensas'], ['areas', 'Áreas demandantes'],
          ['feriados', 'Feriados'], ['modelo', 'Atividades e prazos'], ['modalidades', 'Modalidades'],
        ] as [Aba, string][]).map(([k, r]) => <button key={k} className={`aba ${aba === k ? 'on' : ''}`} onClick={() => setAba(k)}>{r}</button>)}
      </div>
      {aba === 'integrantes' && <Integrantes />}
      {aba === 'listas' && <Listas />}
      {aba === 'areas' && <Areas />}
      {aba === 'feriados' && <Feriados />}
      {aba === 'modelo' && <ModeloAtividades />}
      {aba === 'modalidades' && <Modalidades />}
    </>
  );
}

async function executar(p: PromiseLike<{ error: { message: string } | null }>, msg: string, depois?: () => unknown) {
  const { error } = await p;
  if (error) { toast(traduzirErro(error.message), true); return false; }
  toast(msg);
  await depois?.();
  return true;
}

// -----------------------------------------------------------------------------

function Integrantes() {
  const { cat, recarregarCatalogos, eu } = useApp();
  const [edit, setEdit] = useState<Partial<Integrante> | null>(null);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const lista = cat.integrantes.filter((i) => mostrarInativos || i.ativo);

  async function salvar() {
    if (!edit?.nome?.trim()) return toast('Informe o nome.', true);
    const payload = {
      nome: edit.nome.trim(), email: edit.email?.trim().toLowerCase() || null, orgao: edit.orgao ?? 'FAETEC',
      frente: edit.frente || null, funcao: edit.funcao?.trim() || null, papel: edit.papel ?? 'consulta',
      modelo_trabalho: edit.modelo_trabalho ?? 'Presencial', telefone: edit.telefone?.trim() || null,
      membro_gt: edit.membro_gt ?? true, ativo: edit.ativo ?? true,
    };
    const q = edit.id ? supabase.from('integrantes').update(payload).eq('id', edit.id) : supabase.from('integrantes').insert(payload);
    if (await executar(q, edit.id ? 'Integrante atualizado.' : 'Integrante cadastrado. A pessoa já pode fazer o primeiro acesso com o e-mail informado.', recarregarCatalogos)) setEdit(null);
  }

  return (
    <div className="card">
      <div className="card-titulo">
        <div>
          <h2>Integrantes ({lista.length})</h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            Cadastre o e-mail institucional: a pessoa entra por “Primeiro acesso” e a conta é vinculada automaticamente ao perfil. E-mails não cadastrados não conseguem criar conta.
          </p>
        </div>
        <div className="linha">
          <label className="check small"><input type="checkbox" checked={mostrarInativos} onChange={(e) => setMostrarInativos(e.target.checked)} /> Mostrar inativos</label>
          <button className="btn primario" onClick={() => setEdit({ ativo: true, membro_gt: true, papel: 'elaboracao', orgao: 'FAETEC', modelo_trabalho: 'Presencial' })}><IcMais width={15} /> Novo integrante</button>
        </div>
      </div>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead><tr><th>Nome</th><th>Órgão · frente</th><th>Função</th><th>Perfil de acesso</th><th>E-mail · acesso</th><th>Trabalho</th><th /></tr></thead>
          <tbody>
            {lista.map((i) => (
              <tr key={i.id} style={{ opacity: i.ativo ? 1 : 0.5 }}>
                <td><div className="obj">{i.nome}</div>{!i.membro_gt && <div className="sub">Conta técnica (fora do GT)</div>}</td>
                <td>{i.orgao}{i.frente ? ` · Frente ${i.frente}` : ''}</td>
                <td className="small">{i.funcao}</td>
                <td><Selo cor={i.papel === 'admin' ? 'vermelho' : i.papel === 'coordenacao' ? 'ouro' : i.papel === 'consulta' ? 'cinza' : 'azul'}>{PAPEIS[i.papel].rotulo}</Selo></td>
                <td className="small">
                  {i.email ?? <span className="red">sem e-mail</span>}
                  <div className="sub">{i.user_id ? '● conta ativa' : i.email ? 'aguardando primeiro acesso' : 'não pode acessar'}</div>
                </td>
                <td>{i.modelo_trabalho}</td>
                <td className="acoes-td"><button className="btn pequeno" onClick={() => setEdit(i)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal titulo={edit.id ? `Editar ${edit.nome}` : 'Novo integrante'} onFechar={() => setEdit(null)} largo
          rodape={<><button className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn primario" onClick={salvar}>Salvar</button></>}>
          <div className="form-grid">
            <Campo rotulo="Nome" obrigatorio className="c6"><input className="input" value={edit.nome ?? ''} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></Campo>
            <Campo rotulo="E-mail institucional (login)" className="c6" ajuda="Vincula a conta de acesso a este integrante.">
              <input className="input" type="email" value={edit.email ?? ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            </Campo>
            <Campo rotulo="Órgão" className="c4">
              <select className="input" value={edit.orgao} onChange={(e) => setEdit({ ...edit, orgao: e.target.value as Integrante['orgao'] })}>
                {['SEDES', 'SECTI', 'FAETEC', 'PRODERJ', 'OUTRO'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Frente do GT" className="c4">
              <select className="input" value={edit.frente ?? ''} onChange={(e) => setEdit({ ...edit, frente: (e.target.value || null) as Integrante['frente'] })}>
                <option value="">—</option>
                {Object.entries(FRENTES).map(([k, v]) => <option key={k} value={k}>Frente {k} · {v.nome}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Modelo de trabalho" className="c4">
              <Segmentado valor={edit.modelo_trabalho} onChange={(v) => setEdit({ ...edit, modelo_trabalho: v })}
                opcoes={[{ valor: 'Presencial', rotulo: 'Presencial' }, { valor: 'Híbrido', rotulo: 'Híbrido' }, { valor: 'Remoto', rotulo: 'Remoto' }]} />
            </Campo>
            <Campo rotulo="Função no GT" className="c8"><input className="input" value={edit.funcao ?? ''} onChange={(e) => setEdit({ ...edit, funcao: e.target.value })} /></Campo>
            <Campo rotulo="Telefone" className="c4"><input className="input" value={edit.telefone ?? ''} onChange={(e) => setEdit({ ...edit, telefone: e.target.value })} /></Campo>
            <div className="c12">
              <div className="rotulo-campo" style={{ marginBottom: 8 }}>Perfil de acesso</div>
              <div className="opcoes-cartao">
                {(Object.keys(PAPEIS) as Papel[]).map((p) => (
                  <button type="button" key={p} className={`opcao-cartao ${edit.papel === p ? 'on' : ''}`} onClick={() => setEdit({ ...edit, papel: p })}>
                    <strong>{PAPEIS[p].rotulo}</strong><span>{PAPEIS[p].descricao}</span>
                  </button>
                ))}
              </div>
            </div>
            <label className="check c6"><input type="checkbox" checked={edit.membro_gt ?? true} onChange={(e) => setEdit({ ...edit, membro_gt: e.target.checked })} /> Integra a composição oficial do GT</label>
            <label className="check c6"><input type="checkbox" checked={edit.ativo ?? true} disabled={edit.id === eu?.id} onChange={(e) => setEdit({ ...edit, ativo: e.target.checked })} /> Ativo (inativos perdem o acesso imediatamente)</label>
          </div>
        </Modal>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

const NOMES_LISTAS: Record<string, string> = {
  situacao: 'Situação da contratação', dod_status: 'DOD · status', ata_status: 'Ata de registro · status',
  ti_status: 'Manifestação do TI · status', ti_obs: 'Manifestação do TI · situação', docs_prep_status: 'Fase preparatória · status',
  origem_estimativa: 'Origem da estimativa', tipo_documento: 'Tipo de documento',
};
const CORES: Cor[] = ['azul', 'ouro', 'verde', 'vermelho', 'cinza', 'roxo'];

function Listas() {
  const { cat, recarregarCatalogos } = useApp();
  const listas = [...new Set([...Object.keys(NOMES_LISTAS), ...cat.opcoes.map((o) => o.lista)])];
  const [lista, setLista] = useState(listas[0]);
  const [novo, setNovo] = useState('');
  const itens = cat.opcoes.filter((o) => o.lista === lista);

  const upd = (o: OpcaoLista, p: Partial<OpcaoLista>) => executar(supabase.from('opcoes_lista').update(p).eq('id', o.id), 'Opção atualizada.', recarregarCatalogos);

  return (
    <div className="grid g-3-1" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="card-titulo">
          <h2>{NOMES_LISTAS[lista] ?? lista}</h2>
          <select className="input" style={{ width: 280 }} value={lista} onChange={(e) => setLista(e.target.value)}>
            {listas.map((l) => <option key={l} value={l}>{NOMES_LISTAS[l] ?? l}</option>)}
          </select>
        </div>
        <table className="tabela">
          <thead><tr><th>Ordem</th><th>Valor</th><th>Cor do selo</th><th>Ativo</th></tr></thead>
          <tbody>
            {itens.map((o) => (
              <tr key={o.id}>
                <td style={{ width: 90 }}><input className="input" type="number" defaultValue={o.ordem} onBlur={(e) => Number(e.target.value) !== o.ordem && upd(o, { ordem: Number(e.target.value) })} /></td>
                <td><Selo cor={o.cor}>{o.valor}</Selo></td>
                <td style={{ width: 160 }}>
                  <select className="input" value={o.cor ?? ''} onChange={(e) => upd(o, { cor: (e.target.value || null) as Cor })}>
                    <option value="">—</option>{CORES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td><input type="checkbox" checked={o.ativo} onChange={(e) => upd(o, { ativo: e.target.checked })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2 className="mb">Nova opção</h2>
        <div className="pilha">
          <input className="input" placeholder="Valor" value={novo} onChange={(e) => setNovo(e.target.value)} />
          <button className="btn primario" disabled={!novo.trim()} onClick={async () => {
            if (await executar(supabase.from('opcoes_lista').insert({ lista, valor: novo.trim(), ordem: (itens.at(-1)?.ordem ?? 0) + 1 }), 'Opção incluída.', recarregarCatalogos)) setNovo('');
          }}>Incluir</button>
          <p className="xs muted" style={{ margin: 0 }}>Para retirar uma opção sem perder o histórico, desmarque “Ativo”. Registros antigos mantêm o valor.</p>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------

function Areas() {
  const { cat, recarregarCatalogos } = useApp();
  const [nome, setNome] = useState('');
  const [sigla, setSigla] = useState('');
  return (
    <div className="grid g-3-1" style={{ alignItems: 'start' }}>
      <div className="card">
        <h2 className="mb">Áreas demandantes</h2>
        <table className="tabela">
          <thead><tr><th>Nome</th><th>Sigla</th><th>Ativa</th></tr></thead>
          <tbody>
            {cat.areas.map((a) => (
              <tr key={a.id}>
                <td><input className="input" defaultValue={a.nome} onBlur={(e) => e.target.value.trim() && e.target.value !== a.nome && executar(supabase.from('areas_demandantes').update({ nome: e.target.value.trim() }).eq('id', a.id), 'Área atualizada.', recarregarCatalogos)} /></td>
                <td style={{ width: 140 }}><input className="input" defaultValue={a.sigla ?? ''} onBlur={(e) => e.target.value !== (a.sigla ?? '') && executar(supabase.from('areas_demandantes').update({ sigla: e.target.value.trim() || null }).eq('id', a.id), 'Área atualizada.', recarregarCatalogos)} /></td>
                <td><input type="checkbox" checked={a.ativo} onChange={(e) => executar(supabase.from('areas_demandantes').update({ ativo: e.target.checked }).eq('id', a.id), 'Área atualizada.', recarregarCatalogos)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2 className="mb">Nova área</h2>
        <div className="pilha">
          <input className="input" placeholder="Nome da diretoria / setor" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className="input" placeholder="Sigla" value={sigla} onChange={(e) => setSigla(e.target.value)} />
          <button className="btn primario" disabled={!nome.trim()} onClick={async () => {
            if (await executar(supabase.from('areas_demandantes').insert({ nome: nome.trim(), sigla: sigla.trim() || null }), 'Área incluída.', recarregarCatalogos)) { setNome(''); setSigla(''); }
          }}>Incluir</button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------

function Feriados() {
  const { dados, carregando, recarregar } = useCarregar(async () => ok(await supabase.from('feriados').select('*').order('data')) as Feriado[], []);
  const [d, setD] = useState('');
  const [desc, setDesc] = useState('');
  if (carregando) return <Carregando />;
  return (
    <div className="grid g-3-1" style={{ alignItems: 'start' }}>
      <div className="card">
        <h2>Feriados e pontos facultativos</h2>
        <p className="small muted">Usados na contagem de dias úteis (PRODERJ) e na prorrogação de vencimentos que caem em dia não útil.</p>
        <table className="tabela">
          <thead><tr><th>Data</th><th>Descrição</th><th /></tr></thead>
          <tbody>
            {(dados ?? []).map((f) => (
              <tr key={f.data}>
                <td className="nowrap">{data(f.data)} · {new Date(`${f.data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' })}</td>
                <td>{f.descricao}</td>
                <td className="acoes-td"><button className="btn pequeno perigo" onClick={() => executar(supabase.from('feriados').delete().eq('data', f.data), 'Feriado removido. Prazos futuros serão recalculados na próxima alteração.', recarregar)}>Remover</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2 className="mb">Incluir feriado</h2>
        <div className="pilha">
          <input className="input" type="date" value={d} onChange={(e) => setD(e.target.value)} />
          <input className="input" placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <button className="btn primario" disabled={!d || !desc.trim()} onClick={async () => {
            if (await executar(supabase.from('feriados').insert({ data: d, descricao: desc.trim() }), 'Feriado incluído.', recarregar)) { setD(''); setDesc(''); }
          }}>Incluir</button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------

function ModeloAtividades() {
  const { cat, recarregarCatalogos } = useApp();
  const [edit, setEdit] = useState<Partial<AtividadeModelo> | null>(null);

  async function salvar() {
    if (!edit?.nome?.trim() || !edit.etapa || !edit.ordem) return toast('Etapa, ordem e nome são obrigatórios.', true);
    const temPrazo = Boolean(edit.tipo_prazo);
    const payload = {
      etapa: edit.etapa, ordem: edit.ordem, nome: edit.nome.trim(), descricao: edit.descricao?.trim() || null,
      tipo_prazo: temPrazo ? edit.tipo_prazo : null, prazo_dias: temPrazo ? edit.prazo_dias ?? null : null,
      prorrogacao_dias: temPrazo ? edit.prorrogacao_dias || null : null, prazo_critico: temPrazo || Boolean(edit.prazo_critico),
      ponto_atencao: edit.ponto_atencao?.trim() || null, gate: Boolean(edit.gate), base_legal: edit.base_legal?.trim() || null,
      ativo: edit.ativo ?? true,
    };
    if (temPrazo && !payload.prazo_dias) return toast('Informe a quantidade de dias do prazo.', true);
    const q = edit.id ? supabase.from('atividades_modelo').update(payload).eq('id', edit.id) : supabase.from('atividades_modelo').insert(payload);
    if (await executar(q, 'Modelo atualizado. Vale para novas contratações e trocas de modalidade.', recarregarCatalogos)) setEdit(null);
  }

  return (
    <div className="card">
      <div className="card-titulo">
        <div>
          <h2>Atividades do fluxo e prazos legais ({cat.modelo.filter((m) => m.ativo).length})</h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>Modelo copiado para cada contratação. Alterações não mudam checklists já gerados.</p>
        </div>
        <button className="btn primario" onClick={() => setEdit({ etapa: 1, ordem: 99, ativo: true })}><IcMais width={15} /> Nova atividade</button>
      </div>
      {cat.etapas.map((e) => (
        <div key={e.numero} className="mb">
          <h3 className="mt-s mb" style={{ marginBottom: 6 }}>Etapa {ROMANOS[e.numero]} · {e.nome}</h3>
          <table className="tabela">
            <tbody>
              {cat.modelo.filter((m) => m.etapa === e.numero).map((m) => (
                <tr key={m.id} style={{ opacity: m.ativo ? 1 : 0.5 }}>
                  <td className="num" style={{ width: 40 }}>{m.ordem}</td>
                  <td>
                    <strong>{m.nome}</strong>
                    {m.ponto_atencao && <div className="sub gold">{m.ponto_atencao}</div>}
                    {m.base_legal && <div className="sub">{m.base_legal}</div>}
                  </td>
                  <td style={{ width: 200 }}>{m.tipo_prazo ? <Selo cor="vermelho">{prazoTexto(m.tipo_prazo, m.prazo_dias, m.prorrogacao_dias)}</Selo> : <span className="muted small">sem prazo legal</span>}</td>
                  <td style={{ width: 90 }}>{m.gate && <Selo cor="ouro">Gate</Selo>}</td>
                  <td className="acoes-td" style={{ width: 90 }}><button className="btn pequeno" onClick={() => setEdit(m)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {edit && (
        <Modal titulo={edit.id ? `Editar ${edit.nome}` : 'Nova atividade'} onFechar={() => setEdit(null)}
          rodape={<><button className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn primario" onClick={salvar}>Salvar</button></>}>
          <div className="form-grid">
            <Campo rotulo="Etapa" className="c4">
              <select className="input" value={edit.etapa} onChange={(ev) => setEdit({ ...edit, etapa: Number(ev.target.value) })}>
                {cat.etapas.map((e) => <option key={e.numero} value={e.numero}>{ROMANOS[e.numero]} · {e.nome}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Ordem" className="c2"><input className="input" type="number" value={edit.ordem ?? ''} onChange={(ev) => setEdit({ ...edit, ordem: Number(ev.target.value) })} /></Campo>
            <Campo rotulo="Nome" className="c6"><input className="input" value={edit.nome ?? ''} onChange={(ev) => setEdit({ ...edit, nome: ev.target.value })} /></Campo>
            <Campo rotulo="Prazo legal" className="c4">
              <select className="input" value={edit.tipo_prazo ?? ''} onChange={(ev) => setEdit({ ...edit, tipo_prazo: (ev.target.value || null) as AtividadeModelo['tipo_prazo'] })}>
                <option value="">Sem prazo legal</option><option value="corridos">Dias corridos</option><option value="uteis">Dias úteis</option>
              </select>
            </Campo>
            <Campo rotulo="Dias" className="c4"><input className="input" type="number" min="1" disabled={!edit.tipo_prazo} value={edit.prazo_dias ?? ''} onChange={(ev) => setEdit({ ...edit, prazo_dias: Number(ev.target.value) || null })} /></Campo>
            <Campo rotulo="Prorrogação (dias)" className="c4"><input className="input" type="number" min="0" disabled={!edit.tipo_prazo} value={edit.prorrogacao_dias ?? ''} onChange={(ev) => setEdit({ ...edit, prorrogacao_dias: Number(ev.target.value) || null })} /></Campo>
            <Campo rotulo="Ponto de atenção" className="c12"><input className="input" value={edit.ponto_atencao ?? ''} onChange={(ev) => setEdit({ ...edit, ponto_atencao: ev.target.value })} /></Campo>
            <Campo rotulo="Base legal" className="c12"><input className="input" value={edit.base_legal ?? ''} onChange={(ev) => setEdit({ ...edit, base_legal: ev.target.value })} /></Campo>
            <label className="check c6"><input type="checkbox" checked={Boolean(edit.gate)} onChange={(ev) => setEdit({ ...edit, gate: ev.target.checked })} /> Gate (bloqueia o fluxo se não atendido)</label>
            <label className="check c6"><input type="checkbox" checked={edit.ativo ?? true} onChange={(ev) => setEdit({ ...edit, ativo: ev.target.checked })} /> Ativa</label>
          </div>
        </Modal>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

function Modalidades() {
  const { cat, recarregarCatalogos } = useApp();
  const alternar = (m: Modalidade, etapa: number) => {
    const etapas = m.etapas.includes(etapa) ? m.etapas.filter((e) => e !== etapa) : [...m.etapas, etapa].sort();
    if (!etapas.includes(1)) return toast('A Etapa I (planejamento) é obrigatória em todas as modalidades.', true);
    executar(supabase.from('modalidades').update({ etapas }).eq('codigo', m.codigo), 'Modalidade atualizada.', recarregarCatalogos);
  };
  return (
    <div className="card">
      <h2>Modalidades e etapas do checklist</h2>
      <p className="small muted">Define quais etapas são geradas para cada enquadramento. Trocar a modalidade de uma contratação ajusta o checklist.</p>
      <table className="tabela matriz">
        <thead><tr><th>Modalidade</th>{cat.etapas.map((e) => <th key={e.numero}>{ROMANOS[e.numero]}</th>)}<th>Atividades</th><th>Ativa</th></tr></thead>
        <tbody>
          {cat.modalidades.map((m) => (
            <tr key={m.codigo}>
              <td><div className="obj">{m.nome}</div><div className="sub">{m.descricao}</div></td>
              {cat.etapas.map((e) => <td key={e.numero}><input type="checkbox" checked={m.etapas.includes(e.numero)} onChange={() => alternar(m, e.numero)} /></td>)}
              <td className="mono">{cat.modelo.filter((x) => x.ativo && m.etapas.includes(x.etapa)).length}</td>
              <td><input type="checkbox" checked={m.ativo} onChange={(ev) => executar(supabase.from('modalidades').update({ ativo: ev.target.checked }).eq('codigo', m.codigo), 'Modalidade atualizada.', recarregarCatalogos)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
