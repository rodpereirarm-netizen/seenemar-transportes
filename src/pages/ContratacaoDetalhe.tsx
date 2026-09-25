import { Fragment, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp, useCarregar } from '../lib/app';
import { BUCKET_DOCUMENTOS, ok, supabase, traduzirErro } from '../lib/supabase';
import {
  ROMANOS, SITUACAO_PRAZO, STATUS_ATIVIDADE, data, dataHora, moeda, nomeCurto, num2, prazoTexto, tamanhoArquivo,
} from '../lib/format';
import { exportarExcel } from '../lib/excel';
import { OPERACOES, TABELAS } from '../lib/rotulos';
import type {
  Andamento, AtividadeView, Contratacao, ContratacaoView, Documento, RegistroAuditoria, StatusAtividade,
} from '../lib/types';
import {
  Campo, Carregando, Erro, Modal, Progresso, Segmentado, Selo, SelectIntegrante, SelectLista, SeloLista, SeloModalidade, Vazio, toast,
} from '../components/ui';
import { Dropzone, IconeExt, baixarDocumento, enviarDocumento, validarArquivo } from '../components/Upload';
import DiffAuditoria from '../components/Diff';
import { Voltar } from '../components/Voltar';
import { IcBaixar, IcLapis, IcLixo } from '../components/Icones';

type Aba = 'checklist' | 'dados' | 'andamentos' | 'documentos' | 'historico';

export default function ContratacaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { pode, integrante, eu } = useApp();
  const nav = useNavigate();
  const [aba, setAba] = useState<Aba>('checklist');
  const [editarAtiv, setEditarAtiv] = useState<AtividadeView | null>(null);
  const [excluir, setExcluir] = useState(false);

  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [c, a, r, n, d] = await Promise.all([
      supabase.from('vw_contratacoes').select('*').eq('id', id!).maybeSingle(),
      supabase.from('vw_atividades').select('*').eq('contratacao_id', id!).order('etapa').order('ordem'),
      supabase.from('contratacao_responsaveis').select('*').eq('contratacao_id', id!),
      supabase.from('andamentos').select('*').eq('contratacao_id', id!).order('created_at', { ascending: false }),
      supabase.from('documentos').select('*').eq('contratacao_id', id!).order('created_at', { ascending: false }),
    ]);
    return {
      c: ok(c) as ContratacaoView | null,
      ativs: ok(a) as AtividadeView[],
      resp: ok(r) as { etapa: number; integrante_id: string | null }[],
      andamentos: ok(n) as Andamento[],
      docs: ok(d) as Documento[],
    };
  }, [id]);

  if (carregando && !dados) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  if (!dados?.c) return <Vazio>Contratação não encontrada. <Link to="/contratacoes">Voltar</Link></Vazio>;

  const { c, ativs, resp, andamentos, docs } = dados;
  const podeEditar = pode.editarContratacao(c);
  const vencidas = ativs.filter((a) => a.situacao_prazo === 'vencido');
  const legaisAbertos = ativs.filter((a) => a.tipo_prazo && a.prazo_legal && !['concluida', 'nao_se_aplica'].includes(a.status));

  async function atualizarAtividade(a: AtividadeView, patch: Partial<AtividadeView>) {
    const { error, data: res } = await supabase.from('atividades').update(patch).eq('id', a.id).select('id');
    if (error) toast(traduzirErro(error.message), true);
    else if (!res?.length) toast('Seu perfil não permite alterar esta atividade.', true);
    recarregar();
  }

  async function excluirContratacao() {
    const paths = docs.map((d) => d.storage_path);
    if (paths.length) await supabase.storage.from(BUCKET_DOCUMENTOS).remove(paths);
    const { error } = await supabase.from('contratacoes').delete().eq('id', c!.id);
    if (error) return toast(traduzirErro(error.message), true);
    toast('Contratação excluída. O registro permanece na auditoria.');
    nav('/contratacoes');
  }

  async function exportarFicha() {
    await exportarExcel(`contratacao-${num2(c!.numero)}-${c!.titulo}`, [
      {
        nome: 'Checklist',
        titulo: `${num2(c!.numero)} · ${c!.titulo}`,
        subtitulo: `${c!.modalidade_nome} · ${c!.via_descricao ?? ''} · situação: ${c!.situacao}`,
        linhas: ativs,
        colunas: [
          { titulo: 'Etapa', valor: (a: AtividadeView) => `${ROMANOS[a.etapa]} · ${a.etapa_nome}`, largura: 28 },
          { titulo: 'Atividade', valor: (a: AtividadeView) => a.nome, largura: 36 },
          { titulo: 'Status', valor: (a: AtividadeView) => STATUS_ATIVIDADE[a.status].rotulo, largura: 16 },
          { titulo: 'Responsável', valor: (a: AtividadeView) => a.responsavel_nome, largura: 28 },
          { titulo: 'Prazo legal', valor: (a: AtividadeView) => prazoTexto(a.tipo_prazo, a.prazo_dias, a.prorrogado ? a.prorrogacao_dias : null), largura: 20 },
          { titulo: 'Envio', valor: (a: AtividadeView) => data(a.data_envio), largura: 12 },
          { titulo: 'Vencimento', valor: (a: AtividadeView) => data(a.prazo_efetivo), largura: 12 },
          { titulo: 'Situação do prazo', valor: (a: AtividadeView) => SITUACAO_PRAZO[a.situacao_prazo].rotulo, largura: 20 },
          { titulo: 'Conclusão', valor: (a: AtividadeView) => data(a.data_conclusao), largura: 12 },
          { titulo: 'Observação', valor: (a: AtividadeView) => a.observacao, largura: 40 },
        ],
      },
      {
        nome: 'Andamentos',
        linhas: andamentos,
        colunas: [
          { titulo: 'Data', valor: (n: Andamento) => dataHora(n.created_at), largura: 18 },
          { titulo: 'Autor', valor: (n: Andamento) => integrante(n.integrante_id)?.nome ?? 'Sistema', largura: 28 },
          { titulo: 'Tipo', valor: (n: Andamento) => n.tipo, largura: 12 },
          { titulo: 'Texto', valor: (n: Andamento) => n.texto, largura: 80 },
        ],
      },
    ]);
  }

  return (
    <>
      <div className="cabecalho">
        <div style={{ minWidth: 0 }}>
          <Voltar padrao="/contratacoes" rotuloPadrao="Contratações" />
          <div className="migalha"><Link to="/contratacoes">Contratações</Link> / {num2(c.numero)}</div>
          <div className="linha" style={{ marginBottom: 4 }}>
            <span className="eyebrow">Nº {num2(c.numero)}</span>
            <SeloModalidade codigo={c.modalidade} />
            <SeloLista lista="situacao" valor={c.situacao} />
            {c.prioridade === 'Alta' && <Selo cor="vermelho">Prioridade alta</Selo>}
            {c.rascunho && <Selo cor="cinza">Rascunho</Selo>}
          </div>
          <h1>{c.titulo}</h1>
          <p style={{ maxWidth: 820 }}>{c.objeto}</p>
        </div>
        <div className="acoes">
          <button className="btn" onClick={exportarFicha}><IcBaixar width={15} /> Exportar ficha</button>
          {pode.excluirContratacao && <button className="btn perigo" onClick={() => setExcluir(true)}><IcLixo width={15} /> Excluir</button>}
        </div>
      </div>

      {c.situacao === 'Divergência' && c.divergencia_obs && <div className="aviso erro mb">Divergência a validar: {c.divergencia_obs}</div>}
      {!c.justificativa_recebida && <div className="aviso atencao mb">Sem justificativa da área técnica: o DOD fica bloqueado até o recebimento.</div>}
      {vencidas.length > 0 && (
        <div className="aviso erro mb">
          {vencidas.length} atividade(s) com prazo vencido: {vencidas.map((a) => `${a.nome} (${data(a.prazo_efetivo)})`).join(' · ')}
        </div>
      )}

      <div className="grid g4 mb">
        <div className="card kpi">
          <div className="rotulo">Etapa atual</div>
          <div className="valor" style={{ fontSize: 26 }}>{c.etapa_atual ? ROMANOS[c.etapa_atual] : '—'} <span className="small muted" style={{ fontFamily: 'var(--sans)', fontWeight: 400 }}>{c.etapa_atual_nome}</span></div>
          <Progresso feito={c.etapa_concluidas ?? 0} total={c.etapa_total ?? 0} />
          <div className="nota mt-s">{c.etapa_concluidas ?? 0} de {c.etapa_total ?? 0} na etapa · {c.atividades_concluidas} de {c.total_atividades} no fluxo</div>
        </div>
        <div className="card kpi">
          <div className="rotulo">Atividade atual</div>
          <div style={{ fontWeight: 600, color: 'var(--navy)', margin: '8px 0 4px', fontSize: 15 }}>{c.atividade_atual_nome ?? 'Checklist concluído'}</div>
          <div className={`nota ${c.atividade_atual_responsavel_nome ? '' : 'red'}`}>
            {c.atividade_atual_id ? c.atividade_atual_responsavel_nome ?? 'Sem responsável' : ''}
          </div>
        </div>
        <div className="card kpi">
          <div className="rotulo">Próximo prazo</div>
          <div className={`valor ${vencidas.length ? 'alerta' : ''}`} style={{ fontSize: 26 }}>{data(c.proximo_prazo)}</div>
          <div className="nota">{legaisAbertos.length} prazo(s) legal(is) em contagem</div>
        </div>
        <div className="card kpi">
          <div className="rotulo">Valor estimado</div>
          <div className="valor" style={{ fontSize: 26 }}>{moeda(c.valor_estimado, true)}</div>
          <div className="nota">Responsável geral: {c.responsavel_geral_nome ?? <span className="red">não definido</span>}</div>
        </div>
      </div>

      <div className="abas">
        {([
          ['checklist', `Checklist do fluxo`],
          ['dados', 'Dados e painel'],
          ['andamentos', `Andamentos · ${andamentos.filter((a) => a.tipo !== 'sistema').length}`],
          ['documentos', `Documentos · ${docs.length}`],
          ...(pode.verAuditoria ? [['historico', 'Histórico (auditoria)']] : []),
        ] as [Aba, string][]).map(([k, r]) => (
          <button key={k} className={`aba ${aba === k ? 'on' : ''}`} onClick={() => setAba(k)}>{r}</button>
        ))}
      </div>

      {aba === 'checklist' && (
        <Checklist
          c={c} ativs={ativs} resp={resp}
          onAtualizar={atualizarAtividade} onEditar={setEditarAtiv} recarregar={recarregar}
        />
      )}
      {aba === 'dados' && <Dados c={c} podeEditar={podeEditar} onSalvo={recarregar} />}
      {aba === 'andamentos' && <Andamentos c={c} itens={andamentos} ativs={ativs} onSalvo={recarregar} />}
      {aba === 'documentos' && <Documentos c={c} docs={docs} ativs={ativs} onSalvo={recarregar} />}
      {aba === 'historico' && <Historico contratacaoId={c.id} />}

      {editarAtiv && (
        <ModalAtividade
          a={editarAtiv}
          docs={docs.filter((d) => d.atividade_id === editarAtiv.id)}
          podeEditar={pode.editarAtividade(editarAtiv)}
          onFechar={() => setEditarAtiv(null)}
          onSalvar={async (patch) => {
            await atualizarAtividade(editarAtiv, patch);
            setEditarAtiv(null);
          }}
          onDocs={recarregar}
          integranteId={eu!.id}
          contratacaoId={c.id}
        />
      )}

      {excluir && (
        <Modal titulo="Excluir contratação" onFechar={() => setExcluir(false)}
          rodape={<><button className="btn" onClick={() => setExcluir(false)}>Cancelar</button><button className="btn perigo" onClick={excluirContratacao}>Excluir definitivamente</button></>}>
          <p>Excluir <strong>{num2(c.numero)} · {c.titulo}</strong> apaga o checklist, os andamentos e {docs.length} documento(s).</p>
          <p className="small muted">A exclusão fica registrada na auditoria com todos os dados anteriores. Para encerrar sem apagar, altere a situação para “Cancelada”.</p>
        </Modal>
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// Checklist por etapa
// -----------------------------------------------------------------------------

function Checklist({
  c, ativs, resp, onAtualizar, onEditar, recarregar,
}: {
  c: ContratacaoView; ativs: AtividadeView[]; resp: { etapa: number; integrante_id: string | null }[];
  onAtualizar: (a: AtividadeView, p: Partial<AtividadeView>) => Promise<void>;
  onEditar: (a: AtividadeView) => void; recarregar: () => void;
}) {
  const { cat, pode } = useApp();
  const [recolhidas, setRecolhidas] = useState<Set<number>>(() => new Set());
  const etapas = cat.etapas.filter((e) => ativs.some((a) => a.etapa === e.numero));

  async function definirRespEtapa(etapa: number, integranteId: string | null) {
    const { error } = await supabase
      .from('contratacao_responsaveis')
      .upsert({ contratacao_id: c.id, etapa, integrante_id: integranteId }, { onConflict: 'contratacao_id,etapa' });
    if (error) toast(traduzirErro(error.message), true);
    else toast('Responsável da etapa atualizado nas atividades abertas.');
    recarregar();
  }

  if (!ativs.length) return <Vazio>Checklist ainda não gerado.</Vazio>;

  return (
    <div>
      <div className="legenda mb">
        <span><i className="ponto" style={{ background: 'var(--red)' }} /> Prazo legal crítico (contagem a partir da data de envio)</span>
        <span><i className="ponto" style={{ background: 'var(--gold)' }} /> Ponto de atenção / gate</span>
        {c.modalidade === 'a_definir' && <span className="gold">Modalidade “A definir”: só a Etapa I é gerada até o enquadramento.</span>}
      </div>
      {etapas.map((e) => {
        const lista = ativs.filter((a) => a.etapa === e.numero);
        const validas = lista.filter((a) => a.status !== 'nao_se_aplica');
        const feitas = validas.filter((a) => a.status === 'concluida').length;
        const r = resp.find((x) => x.etapa === e.numero)?.integrante_id ?? null;
        const aberta = !recolhidas.has(e.numero);
        const toggle = () => setRecolhidas((s) => { const n = new Set(s); if (n.has(e.numero)) n.delete(e.numero); else n.add(e.numero); return n; });
        return (
          <div className="etapa-bloco" key={e.numero}>
            <div className="etapa-cab" onClick={toggle}>
              <span className="romano">{ROMANOS[e.numero]}</span>
              <div className="info">
                <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{e.nome}</div>
                <div className="xs muted">{e.perfil_executor} · {e.equipe}{e.base_legal ? ` · ${e.base_legal}` : ''}</div>
              </div>
              <div onClick={(ev) => ev.stopPropagation()} style={{ width: 260 }} className="nao-imprimir">
                {pode.designarResponsaveis ? (
                  <SelectIntegrante valor={r} onChange={(v) => definirRespEtapa(e.numero, v)} vazio="Responsável da etapa…" />
                ) : (
                  <span className="small">{r ? nomeCurto(cat.integrantes.find((i) => i.id === r)?.nome) : <span className="muted">Sem responsável de etapa</span>}</span>
                )}
              </div>
              <div className="prog">
                <Progresso feito={feitas} total={validas.length} />
                <div className="xs muted" style={{ marginTop: 3 }}>{feitas} de {validas.length} concluídas</div>
              </div>
            </div>
            {aberta && (
              <>
                <div className="ativ cab">
                  <span /><span>Atividade</span><span>Status</span><span>Responsável</span><span>Prazo</span><span />
                </div>
                {lista.map((a) => (
                  <LinhaAtividade key={a.id} a={a} onAtualizar={onAtualizar} onEditar={onEditar} />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LinhaAtividade({
  a, onAtualizar, onEditar,
}: { a: AtividadeView; onAtualizar: (a: AtividadeView, p: Partial<AtividadeView>) => Promise<void>; onEditar: (a: AtividadeView) => void }) {
  const { pode } = useApp();
  const pe = pode.editarAtividade(a);
  const fechada = a.status === 'concluida' || a.status === 'nao_se_aplica';
  const sp = SITUACAO_PRAZO[a.situacao_prazo];

  return (
    <div className={`ativ ${fechada ? 'fechada' : ''}`}>
      <span className={`bolinha ${a.status}`}>{a.status === 'concluida' && <svg width="10" viewBox="0 0 12 12"><path d="m2 6 3 3 5-6" stroke="#fff" strokeWidth="2" fill="none" /></svg>}</span>
      <div>
        <div className="nome-ativ" style={{ textDecoration: a.status === 'nao_se_aplica' ? 'line-through' : undefined }}>
          {a.nome}
          {a.prazo_critico && <span className="selo vermelho quadrado" style={{ marginLeft: 6 }}>{prazoTexto(a.tipo_prazo, a.prazo_dias, a.prorrogacao_dias)}</span>}
          {a.gate && <span className="selo ouro quadrado" style={{ marginLeft: 6 }}>Gate</span>}
        </div>
        {a.ponto_atencao && !a.prazo_critico && <div className="nota gold">{a.ponto_atencao}</div>}
        {a.observacao && <div className="nota muted">{a.observacao}</div>}
        {a.base_legal && <div className="nota muted xs">{a.base_legal}</div>}
      </div>
      <select className="input" value={a.status} disabled={!pe}
        onChange={(e) => onAtualizar(a, { status: e.target.value as StatusAtividade })}>
        {Object.entries(STATUS_ATIVIDADE).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
      </select>
      <SelectIntegrante valor={a.responsavel_id} disabled={!pe} vazio="Sem responsável"
        onChange={(v) => onAtualizar(a, { responsavel_id: v })} />
      <div>
        {a.tipo_prazo ? (
          <div className={`prazo-box ${a.situacao_prazo}`}>
            <div className="linha" style={{ gap: 6, flexWrap: 'nowrap' }}>
              <span className="xs">Envio</span>
              <input type="date" className="input" style={{ padding: '3px 6px' }} value={a.data_envio ?? ''} disabled={!pe}
                onChange={(e) => onAtualizar(a, { data_envio: e.target.value || null })} />
            </div>
            {a.prazo_legal ? (
              <div className="xs" style={{ marginTop: 4 }}>
                Vence {data(a.prazo_legal)} · <strong>{a.status === 'concluida' ? sp.rotulo : a.dias_restantes! < 0 ? `${-a.dias_restantes!} dia(s) de atraso` : `${a.dias_restantes} dia(s) ${a.tipo_prazo === 'uteis' ? 'úteis' : ''} restantes`}</strong>
                {a.prorrogacao_dias && (
                  <label className="check xs" style={{ marginLeft: 8 }}>
                    <input type="checkbox" checked={a.prorrogado} disabled={!pe} onChange={(e) => onAtualizar(a, { prorrogado: e.target.checked })} />
                    prorrogado (+{a.prorrogacao_dias})
                  </label>
                )}
              </div>
            ) : <div className="xs" style={{ marginTop: 4 }}>Contagem inicia com a data de envio</div>}
          </div>
        ) : (
          <div className="linha" style={{ gap: 6, flexWrap: 'nowrap' }}>
            <input type="date" className="input" title="Prazo interno" value={a.prazo_meta ?? ''} disabled={!pe || fechada}
              onChange={(e) => onAtualizar(a, { prazo_meta: e.target.value || null })} />
            {a.prazo_meta && !fechada && <Selo cor={sp.cor}>{a.dias_restantes! < 0 ? `${-a.dias_restantes!}d atraso` : `${a.dias_restantes}d`}</Selo>}
            {a.status === 'concluida' && a.data_conclusao && <span className="xs muted nowrap">em {data(a.data_conclusao)}</span>}
          </div>
        )}
      </div>
      <button className="icone-btn" title="Detalhes, observação e anexos" onClick={() => onEditar(a)}><IcLapis /></button>
    </div>
  );
}

function ModalAtividade({
  a, docs, podeEditar, onFechar, onSalvar, onDocs, integranteId, contratacaoId,
}: {
  a: AtividadeView; docs: Documento[]; podeEditar: boolean; onFechar: () => void;
  onSalvar: (p: Partial<AtividadeView>) => Promise<void>; onDocs: () => void; integranteId: string; contratacaoId: string;
}) {
  const [obs, setObs] = useState(a.observacao ?? '');
  const [meta, setMeta] = useState(a.prazo_meta ?? '');
  const [inicio, setInicio] = useState(a.data_inicio ?? '');
  const [conclusao, setConclusao] = useState(a.data_conclusao ?? '');
  const [enviando, setEnviando] = useState(false);

  async function anexar(fs: File[]) {
    setEnviando(true);
    for (const f of fs) {
      try {
        await enviarDocumento(f, contratacaoId, { tipo: 'Outro', atividadeId: a.id, integranteId });
        toast(`${f.name} anexado.`);
      } catch (e) {
        toast((e as Error).message, true);
      }
    }
    setEnviando(false);
    onDocs();
  }

  return (
    <Modal titulo={a.nome} onFechar={onFechar}
      rodape={<>
        <button className="btn" onClick={onFechar}>Fechar</button>
        {podeEditar && (
          <button className="btn primario" onClick={() => onSalvar({
            observacao: obs.trim() || null, prazo_meta: meta || null, data_inicio: inicio || null,
            ...(a.status === 'concluida' ? { data_conclusao: conclusao || null } : {}),
          })}>Salvar</button>
        )}
      </>}>
      <div className="linha mb">
        <Selo cor="azul">Etapa {ROMANOS[a.etapa]} · {a.etapa_nome}</Selo>
        <Selo cor={STATUS_ATIVIDADE[a.status].cor}>{STATUS_ATIVIDADE[a.status].rotulo}</Selo>
        {a.tipo_prazo && <Selo cor="vermelho">Prazo legal: {prazoTexto(a.tipo_prazo, a.prazo_dias, a.prorrogacao_dias)}</Selo>}
      </div>
      {a.ponto_atencao && <div className="aviso atencao mb">{a.ponto_atencao}</div>}
      {a.base_legal && <p className="small muted">Base legal: {a.base_legal}</p>}
      <div className="form-grid">
        <Campo rotulo="Início" className="c4">
          <input className="input" type="date" value={inicio} disabled={!podeEditar} onChange={(e) => setInicio(e.target.value)} />
        </Campo>
        {!a.tipo_prazo && (
          <Campo rotulo="Prazo interno (meta)" className="c4">
            <input className="input" type="date" value={meta} disabled={!podeEditar} onChange={(e) => setMeta(e.target.value)} />
          </Campo>
        )}
        {a.status === 'concluida' && (
          <Campo rotulo="Data de conclusão" className="c4">
            <input className="input" type="date" value={conclusao} disabled={!podeEditar} onChange={(e) => setConclusao(e.target.value)} />
          </Campo>
        )}
        <Campo rotulo="Observação / pendência" className="c12">
          <textarea className="input" value={obs} disabled={!podeEditar} onChange={(e) => setObs(e.target.value)} placeholder="O que falta, com quem está, próximo passo…" />
        </Campo>
      </div>
      <h3 className="mt mb">Anexos da atividade</h3>
      {docs.length > 0 && (
        <ul className="arquivos mb">
          {docs.map((d) => (
            <li key={d.id}>
              <IconeExt nome={d.nome_arquivo} />
              <span style={{ flex: 1 }}>{d.nome_arquivo}</span>
              <button className="btn pequeno" onClick={() => baixarDocumento(d.storage_path, d.nome_arquivo).catch((e) => toast(e.message, true))}>Baixar</button>
            </li>
          ))}
        </ul>
      )}
      {podeEditar && <Dropzone onArquivos={anexar} disabled={enviando} texto={enviando ? 'Enviando…' : 'Anexar à atividade'} />}
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Dados da contratação (inclui colunas do painel/planilha)
// -----------------------------------------------------------------------------

function Dados({ c, podeEditar, onSalvo }: { c: ContratacaoView; podeEditar: boolean; onSalvo: () => void }) {
  const { cat, pode } = useApp();
  const [f, setF] = useState<Partial<Contratacao>>(() => ({ ...c }));
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof Contratacao>(k: K, v: Contratacao[K] | null) => setF((x) => ({ ...x, [k]: v }));
  const dis = !podeEditar;

  const CAMPOS_EDITAVEIS: (keyof Contratacao)[] = [
    'titulo', 'objeto', 'categoria', 'area_demandante_id', 'solucao_tic', 'processo_sei_origem', 'processo_sei',
    'justificativa_recebida', 'consta_pca', 'item_pca', 'id_siga', 'valor_estimado', 'origem_estimativa', 'data_meta',
    'modalidade', 'ata_id', 'via_descricao', 'nenhuma_ata_compativel', 'responsavel_geral_id', 'prioridade', 'situacao',
    'rascunho', 'dod_status', 'dod_obs', 'ata_status', 'ata_obs', 'ti_status', 'ti_obs', 'docs_prep_status', 'docs_prep_obs',
    'divergencia_obs', 'observacao', 'link_pasta',
  ];
  const alterados = useMemo(
    () => CAMPOS_EDITAVEIS.filter((k) => (f[k] ?? null) !== (c[k] ?? null)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f, c],
  );

  async function salvar() {
    if (!f.titulo?.trim() || !f.objeto?.trim()) return toast('Nome curto e objeto são obrigatórios.', true);
    setSalvando(true);
    const patch: Record<string, unknown> = {};
    alterados.forEach((k) => {
      const v = f[k];
      patch[k] = typeof v === 'string' ? v.trim() || null : v;
    });
    if (patch.situacao === null) delete patch.situacao;
    const { error, data: res } = await supabase.from('contratacoes').update(patch).eq('id', c.id).select('id');
    setSalvando(false);
    if (error) return toast(traduzirErro(error.message), true);
    if (!res?.length) return toast('Seu perfil não permite editar esta contratação.', true);
    toast(patch.modalidade ? 'Dados salvos. Checklist ajustado à nova modalidade.' : 'Dados salvos.');
    onSalvo();
  }

  const txt = (k: keyof Contratacao, rot: string, cls = 'c6', ph?: string) => (
    <Campo rotulo={rot} className={cls}>
      <input className="input" disabled={dis} placeholder={ph} value={(f[k] as string) ?? ''} onChange={(e) => set(k, e.target.value as never)} />
    </Campo>
  );
  const area = (k: keyof Contratacao, rot: string, cls = 'c6') => (
    <Campo rotulo={rot} className={cls}>
      <textarea className="input" rows={2} disabled={dis} value={(f[k] as string) ?? ''} onChange={(e) => set(k, e.target.value as never)} />
    </Campo>
  );
  const lst = (k: keyof Contratacao, lista: string, rot: string, cls = 'c6') => (
    <Campo rotulo={rot} className={cls}>
      <SelectLista lista={lista} disabled={dis} valor={f[k] as string} onChange={(v) => set(k, v as never)} />
    </Campo>
  );

  return (
    <div className="pilha">
      {!podeEditar && <div className="aviso info">Seu perfil tem acesso de leitura a esta contratação.</div>}
      <div className="card">
        <h2 className="mb">Situação e responsabilidade</h2>
        <div className="form-grid">
          {lst('situacao', 'situacao', 'Situação', 'c4')}
          <Campo rotulo="Prioridade" className="c4">
            <Segmentado disabled={dis} valor={f.prioridade} onChange={(v) => set('prioridade', v)}
              opcoes={[{ valor: 'Alta', rotulo: 'Alta' }, { valor: 'Média', rotulo: 'Média' }, { valor: 'Baixa', rotulo: 'Baixa' }]} />
          </Campo>
          <Campo rotulo="Responsável geral (Coordenação)" className="c4">
            <SelectIntegrante disabled={dis || !pode.designarResponsaveis} valor={f.responsavel_geral_id}
              onChange={(v) => set('responsavel_geral_id', v)} filtro={(i) => i.frente === 'I' || i.papel === 'coordenacao'} />
          </Campo>
          {area('divergencia_obs', 'Divergência a validar', 'c12')}
          <Campo rotulo="Rascunho" className="c4">
            <Segmentado disabled={dis} valor={Boolean(f.rascunho)} onChange={(v) => set('rascunho', v)}
              opcoes={[{ valor: false, rotulo: 'Publicado' }, { valor: true, rotulo: 'Rascunho' }]} />
          </Campo>
        </div>
      </div>

      <div className="card">
        <h2 className="mb">Identificação</h2>
        <div className="form-grid">
          {txt('titulo', 'Nome curto', 'c4')}
          {area('objeto', 'Objeto', 'c8')}
          <Campo rotulo="Categoria" className="c4">
            <Segmentado disabled={dis} valor={f.categoria} onChange={(v) => set('categoria', v)}
              opcoes={[{ valor: 'Bem', rotulo: 'Bem' }, { valor: 'Serviço', rotulo: 'Serviço' }, { valor: 'Ambos', rotulo: 'Ambos' }]} />
          </Campo>
          <Campo rotulo="Área demandante" className="c4">
            <select className="input" disabled={dis} value={f.area_demandante_id ?? ''} onChange={(e) => set('area_demandante_id', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {cat.areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Solução de TIC?" className="c4">
            <Segmentado disabled={dis} valor={f.solucao_tic} onChange={(v) => set('solucao_tic', v)} opcoes={[{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não' }]} />
          </Campo>
          {txt('processo_sei_origem', 'Processo SEI de origem (antigo)', 'c4')}
          {txt('processo_sei', 'Processo SEI da contratação (novo)', 'c4')}
          <Campo rotulo="Justificativa da área recebida?" className="c4">
            <Segmentado disabled={dis} valor={f.justificativa_recebida} onChange={(v) => set('justificativa_recebida', v)} opcoes={[{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Ainda não' }]} />
          </Campo>
        </div>
      </div>

      <div className="card">
        <h2 className="mb">Planejamento, PCA e enquadramento</h2>
        <div className="form-grid">
          <Campo rotulo="Consta no PCA / PEDTIC?" className="c4">
            <Segmentado disabled={dis} valor={f.consta_pca} onChange={(v) => set('consta_pca', v)} opcoes={[{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não' }]} />
          </Campo>
          {txt('item_pca', 'Item do PCA / PEDTIC', 'c4')}
          {txt('id_siga', 'ID SIGA', 'c4')}
          <Campo rotulo="Valor estimado (R$)" className="c4">
            <input className="input" type="number" min="0" step="0.01" disabled={dis} value={f.valor_estimado ?? ''}
              onChange={(e) => set('valor_estimado', e.target.value === '' ? null : Number(e.target.value))} />
          </Campo>
          {lst('origem_estimativa', 'origem_estimativa', 'Origem da estimativa', 'c4')}
          <Campo rotulo="Data-meta" className="c4">
            <input className="input" type="date" disabled={dis} value={f.data_meta ?? ''} onChange={(e) => set('data_meta', e.target.value || null)} />
          </Campo>
          <Campo rotulo="Modalidade" className="c4" ajuda={f.modalidade !== c.modalidade ? 'Ao salvar, o checklist é ajustado às etapas da nova modalidade.' : undefined}>
            <select className="input" disabled={dis || !pode.criarContratacao} value={f.modalidade} onChange={(e) => set('modalidade', e.target.value)}>
              {cat.modalidades.map((m) => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Ata de registro de preços" className="c4">
            <select className="input" disabled={dis} value={f.ata_id ?? ''} onChange={(e) => set('ata_id', e.target.value || null)}>
              <option value="">—</option>
              {cat.atas.map((a) => <option key={a.id} value={a.id}>{a.numero} · {a.orgao_gerenciador}</option>)}
            </select>
          </Campo>
          {txt('via_descricao', 'Via / ata (texto do painel)', 'c4')}
          <Campo rotulo=" " className="c12">
            <label className="check">
              <input type="checkbox" disabled={dis} checked={Boolean(f.nenhuma_ata_compativel)} onChange={(e) => set('nenhuma_ata_compativel', e.target.checked)} />
              Nenhuma ata compatível encontrada
            </label>
          </Campo>
        </div>
      </div>

      <div className="card">
        <h2 className="mb">Painel de andamento (colunas da planilha do GT)</h2>
        <div className="form-grid">
          {lst('dod_status', 'dod_status', 'DOD · status', 'c4')}
          {area('dod_obs', 'DOD · observação', 'c8')}
          {lst('ata_status', 'ata_status', 'Ata de registro · status', 'c4')}
          {area('ata_obs', 'Ata de registro · observação', 'c8')}
          {lst('ti_status', 'ti_status', 'Manifestação do TI · status', 'c4')}
          {lst('ti_obs', 'ti_obs', 'Manifestação do TI · situação', 'c8')}
          {lst('docs_prep_status', 'docs_prep_status', 'Fase preparatória · status', 'c4')}
          {area('docs_prep_obs', 'Fase preparatória · observação', 'c8')}
          {area('observacao', 'Observação', 'c6')}
          {txt('link_pasta', 'Link da pasta (Drive / SEI)', 'c6', 'https://')}
        </div>
      </div>

      {podeEditar && (
        <div className="entre card" style={{ position: 'sticky', bottom: 12 }}>
          <span className="small muted">{alterados.length ? `${alterados.length} campo(s) alterado(s)` : 'Nenhuma alteração pendente'}</span>
          <div className="linha">
            <button className="btn" disabled={!alterados.length} onClick={() => setF({ ...c })}>Descartar</button>
            <button className="btn primario" disabled={!alterados.length || salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Andamentos (linha do tempo)
// -----------------------------------------------------------------------------

function Andamentos({ c, itens, ativs, onSalvo }: { c: ContratacaoView; itens: Andamento[]; ativs: AtividadeView[]; onSalvo: () => void }) {
  const { pode, eu, integrante } = useApp();
  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState<Andamento['tipo']>('andamento');
  const [ativ, setAtiv] = useState('');
  const [sistema, setSistema] = useState(true);

  async function registrar() {
    if (!texto.trim()) return;
    const { error } = await supabase.from('andamentos').insert({
      contratacao_id: c.id, texto: texto.trim(), tipo, atividade_id: ativ || null, integrante_id: eu!.id,
    });
    if (error) return toast(traduzirErro(error.message), true);
    setTexto('');
    toast('Andamento registrado.');
    onSalvo();
  }

  const visiveis = itens.filter((i) => sistema || i.tipo !== 'sistema');
  const ROT: Record<string, string> = { andamento: 'Andamento', envio: 'Envio', devolucao: 'Devolução', divergencia: 'Divergência', conclusao: 'Conclusão', sistema: 'Sistema' };

  return (
    <div className="grid g-3-1" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="card-titulo">
          <h2>Linha do tempo</h2>
          <label className="check small"><input type="checkbox" checked={sistema} onChange={(e) => setSistema(e.target.checked)} /> Mostrar registros automáticos</label>
        </div>
        {visiveis.length === 0 ? <Vazio>Nenhum andamento registrado.</Vazio> : (
          <ul className="timeline">
            {visiveis.map((n) => {
              const a = ativs.find((x) => x.id === n.atividade_id);
              return (
                <li key={n.id} className={n.tipo}>
                  <div className="quando">{dataHora(n.created_at)} · {integrante(n.integrante_id)?.nome ?? 'Sistema'} · {ROT[n.tipo]}{a ? ` · ${a.nome}` : ''}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{n.texto}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {pode.operar && (
        <div className="card">
          <h2 className="mb">Registrar andamento</h2>
          <div className="pilha">
            <Campo rotulo="Tipo">
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as Andamento['tipo'])}>
                <option value="andamento">Andamento</option>
                <option value="envio">Envio / tramitação</option>
                <option value="devolucao">Devolução</option>
                <option value="divergencia">Divergência</option>
              </select>
            </Campo>
            <Campo rotulo="Atividade relacionada (opcional)">
              <select className="input" value={ativ} onChange={(e) => setAtiv(e.target.value)}>
                <option value="">—</option>
                {ativs.filter((a) => a.status !== 'nao_se_aplica').map((a) => <option key={a.id} value={a.id}>{ROMANOS[a.etapa]} · {a.nome}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Descrição">
              <textarea className="input" rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="O que aconteceu, com quem está, próximo passo" />
            </Campo>
            <button className="btn primario" disabled={!texto.trim()} onClick={registrar}>Registrar</button>
            <p className="xs muted" style={{ margin: 0 }}>O texto passa a ser o “último andamento” no painel e avisa o responsável geral.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Documentos
// -----------------------------------------------------------------------------

function Documentos({ c, docs, ativs, onSalvo }: { c: ContratacaoView; docs: Documento[]; ativs: AtividadeView[]; onSalvo: () => void }) {
  const { pode, eu, integrante, lista } = useApp();
  const [tipo, setTipo] = useState('Outro');
  const [ativ, setAtiv] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState<Documento | null>(null);

  async function enviar(fs: File[]) {
    setEnviando(true);
    for (const f of fs) {
      const e = validarArquivo(f);
      if (e) { toast(e, true); continue; }
      try {
        await enviarDocumento(f, c.id, { tipo, atividadeId: ativ || null, integranteId: eu!.id });
        toast(`${f.name} anexado.`);
      } catch (err) {
        toast((err as Error).message, true);
      }
    }
    setEnviando(false);
    onSalvo();
  }

  async function remover(d: Documento) {
    const s = await supabase.storage.from(BUCKET_DOCUMENTOS).remove([d.storage_path]);
    if (s.error) return toast(traduzirErro(s.error.message), true);
    const { error } = await supabase.from('documentos').delete().eq('id', d.id);
    if (error) return toast(traduzirErro(error.message), true);
    setExcluindo(null);
    toast('Documento removido.');
    onSalvo();
  }

  return (
    <div className="grid g-3-1" style={{ alignItems: 'start' }}>
      <div className="card">
        <h2 className="mb">Documentos da contratação</h2>
        {c.link_pasta && <p className="small">Pasta: <a href={c.link_pasta} target="_blank" rel="noreferrer">{c.link_pasta}</a></p>}
        {docs.length === 0 ? <Vazio>Nenhum documento anexado.</Vazio> : (
          <ul className="arquivos">
            {docs.map((d) => {
              const a = ativs.find((x) => x.id === d.atividade_id);
              const podeExcluir = pode.designarResponsaveis || d.enviado_por === eu?.id;
              return (
                <li key={d.id}>
                  <IconeExt nome={d.nome_arquivo} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nome_arquivo}</div>
                    <div className="xs muted">
                      {d.tipo_documento}{a ? ` · ${a.nome}` : ''} · {tamanhoArquivo(d.tamanho_bytes)} · {integrante(d.enviado_por)?.nome ?? '—'} · {dataHora(d.created_at)}
                    </div>
                  </div>
                  <button className="btn pequeno" onClick={() => baixarDocumento(d.storage_path, d.nome_arquivo).catch((e) => toast(e.message, true))}>
                    <IcBaixar width={13} /> Baixar
                  </button>
                  {podeExcluir && <button className="icone-btn" title="Remover" onClick={() => setExcluindo(d)}><IcLixo /></button>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {pode.operar && (
        <div className="card">
          <h2 className="mb">Anexar</h2>
          <div className="pilha">
            <Campo rotulo="Tipo de documento">
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {lista('tipo_documento').map((o) => <option key={o.id}>{o.valor}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Atividade (opcional)">
              <select className="input" value={ativ} onChange={(e) => setAtiv(e.target.value)}>
                <option value="">—</option>
                {ativs.filter((a) => a.status !== 'nao_se_aplica').map((a) => <option key={a.id} value={a.id}>{ROMANOS[a.etapa]} · {a.nome}</option>)}
              </select>
            </Campo>
            <Dropzone onArquivos={enviar} disabled={enviando} texto={enviando ? 'Enviando…' : 'Arraste arquivos ou clique para anexar'} />
          </div>
        </div>
      )}
      {excluindo && (
        <Modal titulo="Remover documento" onFechar={() => setExcluindo(null)}
          rodape={<><button className="btn" onClick={() => setExcluindo(null)}>Cancelar</button><button className="btn perigo" onClick={() => remover(excluindo)}>Remover</button></>}>
          <p>Remover <strong>{excluindo.nome_arquivo}</strong>? A remoção fica registrada na auditoria.</p>
        </Modal>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Histórico (auditoria da contratação)
// -----------------------------------------------------------------------------

function Historico({ contratacaoId }: { contratacaoId: string }) {
  const [aberto, setAberto] = useState<number | null>(null);
  const { dados, carregando, erro } = useCarregar(
    async () =>
      ok(await supabase.from('auditoria').select('*').eq('contratacao_id', contratacaoId).order('created_at', { ascending: false }).limit(500)) as RegistroAuditoria[],
    [contratacaoId],
  );
  if (carregando) return <Carregando />;
  if (erro) return <Erro msg={erro} />;
  return (
    <div className="card">
      <div className="tabela-wrap">
        <table className="tabela">
          <thead><tr><th>Quando</th><th>Quem</th><th>Operação</th><th>O quê</th><th>Campos</th><th /></tr></thead>
          <tbody>
            {(dados ?? []).map((r) => (
              <Fragment key={r.id}>
                <tr className="clicavel" onClick={() => setAberto(aberto === r.id ? null : r.id)}>
                  <td className="nowrap">{dataHora(r.created_at)}</td>
                  <td>{r.usuario_nome}</td>
                  <td><Selo cor={OPERACOES[r.operacao].cor}>{OPERACOES[r.operacao].rotulo}</Selo></td>
                  <td>{TABELAS[r.tabela] ?? r.tabela}{r.tabela === 'atividades' ? ` · ${(r.dados_novos ?? r.dados_anteriores)?.nome as string}` : ''}</td>
                  <td className="small muted">{r.campos_alterados?.join(', ') ?? '—'}</td>
                  <td className="small"><button className="btn-link">{aberto === r.id ? 'Ocultar' : 'Detalhes'}</button></td>
                </tr>
                {aberto === r.id && (
                  <tr><td colSpan={6} style={{ background: 'var(--paper)' }}><DiffAuditoria r={r} /></td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
