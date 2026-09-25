import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app';
import { supabase, traduzirErro } from '../lib/supabase';
import { ROMANOS, prazoTexto } from '../lib/format';
import type { Contratacao } from '../lib/types';
import { Campo, Segmentado, SelectIntegrante, SelectLista, toast } from '../components/ui';
import { Dropzone, ListaArquivosPendentes, enviarDocumento, validarArquivo } from '../components/Upload';
import { Voltar } from '../components/Voltar';
import { AtaForm } from './Atas';

type Form = Partial<Contratacao> & { observacao_inicial?: string };

const PASSOS = ['Identificação', 'Planejamento e PCA', 'Enquadramento', 'Responsáveis', 'Documentos'];

/** "Contratação de telefonia VoIP, visando…" → "Telefonia VoIP" */
function sugerirTitulo(objeto: string): string {
  const m = objeto.match(/^(?:contrata[çc][ãa]o\s+(?:de|para)\s+)?(.+?)(?:,\s*visando.*)?$/i);
  const t = (m?.[1] ?? objeto).trim();
  return t ? t[0].toUpperCase() + t.slice(1, 60) : '';
}

export default function NovaContratacao() {
  const { cat, eu, recarregarCatalogos } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState<Form>({
    categoria: 'Bem',
    solucao_tic: true,
    justificativa_recebida: undefined,
    consta_pca: undefined,
    modalidade: 'adesao_arp',
    prioridade: 'Média',
    nenhuma_ata_compativel: false,
  });
  const [tituloManual, setTituloManual] = useState(false);
  const [resp, setResp] = useState<Record<number, string | null>>({});
  const [arquivos, setArquivos] = useState<{ file: File; tipo: string }[]>([]);
  const [proximoNumero, setProximoNumero] = useState<number | null>(null);
  const [buscaAta, setBuscaAta] = useState('');
  const [novaAta, setNovaAta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    supabase.from('contratacoes').select('numero').order('numero', { ascending: false }).limit(1)
      .then(({ data }) => setProximoNumero((data?.[0]?.numero ?? 0) + 1));
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const mod = cat.modalidades.find((m) => m.codigo === f.modalidade);
  const etapasMod = mod?.etapas ?? [1];
  const totalAtiv = cat.modelo.filter((m) => m.ativo && etapasMod.includes(m.etapa)).length;
  const legais = cat.modelo.filter((m) => m.prazo_critico && m.ativo && etapasMod.includes(m.etapa));

  const faltam = useMemo(() => {
    const x: string[] = [];
    if (!f.objeto?.trim()) x.push('objeto');
    if (!f.area_demandante_id) x.push('área demandante');
    if (f.justificativa_recebida == null) x.push('justificativa da área');
    if (f.consta_pca == null) x.push('PCA/PEDTIC');
    if (!f.responsavel_geral_id) x.push('responsável geral');
    return x;
  }, [f]);

  const atasFiltradas = cat.atas.filter((a) => {
    const q = buscaAta.toLowerCase();
    return !q || [a.numero, a.orgao_gerenciador, a.objeto].join(' ').toLowerCase().includes(q);
  });

  function adicionarArquivos(fs: File[]) {
    const validos: { file: File; tipo: string }[] = [];
    fs.forEach((file) => {
      const e = validarArquivo(file);
      if (e) toast(e, true);
      else validos.push({ file, tipo: arquivos.length === 0 && validos.length === 0 && f.justificativa_recebida ? 'Justificativa da área técnica' : 'Outro' });
    });
    setArquivos((a) => [...a, ...validos]);
  }

  async function criar(rascunho: boolean) {
    setTentou(true);
    if (!rascunho && faltam.length) {
      toast(`Preencha: ${faltam.join(', ')}.`, true);
      return;
    }
    if (rascunho && !f.objeto?.trim()) {
      toast('Informe ao menos o objeto para salvar o rascunho.', true);
      return;
    }
    setSalvando(true);
    try {
      const ata = cat.atas.find((a) => a.id === f.ata_id);
      const payload = {
        titulo: (f.titulo?.trim() || sugerirTitulo(f.objeto!)).slice(0, 80),
        objeto: f.objeto!.trim(),
        categoria: f.categoria,
        area_demandante_id: f.area_demandante_id ?? null,
        solucao_tic: f.solucao_tic ?? true,
        processo_sei_origem: f.processo_sei_origem?.trim() || null,
        processo_sei: f.processo_sei?.trim() || null,
        justificativa_recebida: Boolean(f.justificativa_recebida),
        consta_pca: f.consta_pca ?? null,
        item_pca: f.item_pca?.trim() || null,
        id_siga: f.id_siga?.trim() || null,
        valor_estimado: f.valor_estimado ?? null,
        origem_estimativa: f.origem_estimativa ?? null,
        data_meta: f.data_meta || null,
        modalidade: f.modalidade,
        ata_id: f.ata_id ?? null,
        via_descricao: ata
          ? `${ata.numero} · ${ata.orgao_gerenciador}`
          : f.nenhuma_ata_compativel ? 'Sem ata compatível' : f.modalidade === 'dispensa' ? 'Art. 75 · Lei 14.133/2021' : f.modalidade === 'inexigibilidade' ? 'Art. 74 · Lei 14.133/2021' : null,
        nenhuma_ata_compativel: Boolean(f.nenhuma_ata_compativel),
        ata_status: ata ? (ata.forma_uso === 'Participante' ? 'PARTICIPE' : 'SIM') : f.nenhuma_ata_compativel ? 'NÃO' : null,
        responsavel_geral_id: f.responsavel_geral_id ?? null,
        prioridade: f.prioridade,
        situacao: f.justificativa_recebida ? 'Em instrução' : 'Sem justificativa',
        rascunho,
        link_pasta: f.link_pasta?.trim() || null,
        observacao: f.observacao?.trim() || null,
        dod_status: 'Não iniciado',
      };
      const { data: c, error } = await supabase.from('contratacoes').insert(payload).select('id, numero').single();
      if (error) throw error;

      const linhasResp = Object.entries(resp)
        .filter(([e, i]) => i && etapasMod.includes(Number(e)))
        .map(([e, i]) => ({ contratacao_id: c.id, etapa: Number(e), integrante_id: i }));
      if (linhasResp.length) {
        const r = await supabase.from('contratacao_responsaveis').insert(linhasResp);
        if (r.error) throw r.error;
      }
      if (f.observacao_inicial?.trim()) {
        await supabase.from('andamentos').insert({
          contratacao_id: c.id, tipo: 'andamento', texto: f.observacao_inicial.trim(), integrante_id: eu!.id,
        });
      }
      for (const a of arquivos) {
        try {
          await enviarDocumento(a.file, c.id, { tipo: a.tipo, integranteId: eu!.id });
        } catch (e) {
          toast((e as Error).message, true);
        }
      }
      toast(`Contratação ${String(c.numero).padStart(2, '0')} criada com ${totalAtiv} atividades no checklist.`);
      nav(`/contratacoes/${c.id}`);
    } catch (e) {
      toast(traduzirErro((e as Error).message), true);
    } finally {
      setSalvando(false);
    }
  }

  const irPara = (i: number) => {
    setPasso(i);
    document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const invalido = (cond: boolean) => (tentou && cond ? 'invalido' : '');

  return (
    <>
      <div className="cabecalho">
        <div>
          <Voltar padrao="/contratacoes" rotuloPadrao="Contratações" />
          <div className="migalha"><Link to="/contratacoes">Contratações</Link> / Nova contratação</div>
          <div className="eyebrow">Cadastro da demanda · gera o checklist do fluxo</div>
          <h1>Nova contratação</h1>
          <p>Preencha a identificação e o enquadramento. O sistema cria as atividades, os prazos legais e avisa os responsáveis.</p>
        </div>
        <div className="acoes">
          <Link className="btn" to="/contratacoes">Cancelar</Link>
          <button className="btn contorno" disabled={salvando} onClick={() => criar(true)}>Salvar rascunho</button>
        </div>
      </div>

      <div className="passos">
        {PASSOS.map((p, i) => (
          <button key={p} type="button" className={`passo ${passo === i ? 'on' : ''}`} onClick={() => irPara(i)}>
            <span className="n">{i + 1}</span> {p}
          </button>
        ))}
      </div>

      <div className="grid g-3-1" style={{ alignItems: 'start' }}>
        <div className="pilha">
          {/* 1 · Identificação */}
          <section className="card" id="sec-0" onFocus={() => setPasso(0)}>
            <div className="card-titulo"><h2>1 · Identificação da demanda</h2><span className="xs muted">* obrigatório</span></div>
            <div className="form-grid">
              <Campo rotulo="Nº de controle" className="c2">
                <input className="input" readOnly value={proximoNumero ?? ''} />
              </Campo>
              <Campo rotulo="Objeto" obrigatorio className="c10">
                <input
                  className={`input ${invalido(!f.objeto?.trim())}`}
                  placeholder="Contratação de [objeto], visando atender às necessidades da FAETEC"
                  value={f.objeto ?? ''}
                  onChange={(e) => {
                    set('objeto', e.target.value);
                    if (!tituloManual) set('titulo', sugerirTitulo(e.target.value));
                  }}
                />
              </Campo>
              <Campo rotulo="Nome curto (painel)" className="c6" ajuda="Como a demanda aparece nas listas. Ex.: Chromebooks">
                <input className="input" maxLength={80} value={f.titulo ?? ''} onChange={(e) => { setTituloManual(true); set('titulo', e.target.value); }} />
              </Campo>
              <Campo rotulo="Categoria" obrigatorio className="c6">
                <Segmentado valor={f.categoria} onChange={(v) => set('categoria', v)}
                  opcoes={[{ valor: 'Bem', rotulo: 'Bem' }, { valor: 'Serviço', rotulo: 'Serviço' }, { valor: 'Ambos', rotulo: 'Ambos' }]} />
              </Campo>
              <Campo rotulo="Área demandante" obrigatorio className="c6">
                <select className={`input ${invalido(!f.area_demandante_id)}`} value={f.area_demandante_id ?? ''}
                  onChange={(e) => set('area_demandante_id', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Selecione a diretoria ou setor</option>
                  {cat.areas.filter((a) => a.ativo).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Solução de TIC?" obrigatorio className="c6">
                <Segmentado valor={f.solucao_tic} onChange={(v) => set('solucao_tic', v)}
                  opcoes={[{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não' }]} />
              </Campo>
              <Campo rotulo="Processo SEI de origem" className="c6">
                <input className="input" placeholder="SEI-260005/000000/2026" value={f.processo_sei_origem ?? ''} onChange={(e) => set('processo_sei_origem', e.target.value)} />
              </Campo>
              <Campo rotulo="Processo SEI da contratação" className="c6">
                <input className="input" placeholder="Pode ser informado depois" value={f.processo_sei ?? ''} onChange={(e) => set('processo_sei', e.target.value)} />
              </Campo>
              <Campo rotulo="Justificativa da área técnica recebida?" obrigatorio className="c6"
                erro={tentou && f.justificativa_recebida == null ? 'Obrigatório' : null}
                ajuda={f.justificativa_recebida === false ? 'Sem justificativa a demanda entra como “Sem justificativa” e bloqueia o DOD.' : undefined}>
                <Segmentado valor={f.justificativa_recebida} onChange={(v) => set('justificativa_recebida', v)}
                  opcoes={[{ valor: true, rotulo: 'Sim, anexar' }, { valor: false, rotulo: 'Ainda não' }]} />
              </Campo>
            </div>
          </section>

          {/* 2 · PCA */}
          <section className="card" id="sec-1" onFocus={() => setPasso(1)}>
            <h2 className="mb">2 · Planejamento e PCA</h2>
            <div className="form-grid">
              <Campo rotulo="Consta no PCA / PEDTIC?" obrigatorio className="c4"
                erro={tentou && f.consta_pca == null ? 'Obrigatório' : null}
                ajuda={f.consta_pca === false ? 'Exige justificativa técnica e revisão extraordinária do PEDTIC.' : undefined}>
                <Segmentado valor={f.consta_pca} onChange={(v) => set('consta_pca', v)}
                  opcoes={[{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não' }]} />
              </Campo>
              <Campo rotulo="Item do PCA / PEDTIC" className="c4">
                <input className="input" placeholder="Nº do item" value={f.item_pca ?? ''} onChange={(e) => set('item_pca', e.target.value)} />
              </Campo>
              <Campo rotulo="ID SIGA do item" className="c4">
                <input className="input" placeholder="Ou marque: não cadastrado" value={f.id_siga ?? ''} onChange={(e) => set('id_siga', e.target.value)} />
              </Campo>
              <Campo rotulo="Valor estimado (R$)" className="c4">
                <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={f.valor_estimado ?? ''}
                  onChange={(e) => set('valor_estimado', e.target.value === '' ? null : Number(e.target.value))} />
              </Campo>
              <Campo rotulo="Origem da estimativa" className="c4">
                <SelectLista lista="origem_estimativa" valor={f.origem_estimativa} onChange={(v) => set('origem_estimativa', v)} vazio="Ata, pesquisa prévia, histórico" />
              </Campo>
              <Campo rotulo="Data-meta da contratação" className="c4">
                <input className="input" type="date" value={f.data_meta ?? ''} onChange={(e) => set('data_meta', e.target.value)} />
              </Campo>
            </div>
          </section>

          {/* 3 · Enquadramento */}
          <section className="card" id="sec-2" onFocus={() => setPasso(2)}>
            <h2>3 · Enquadramento *</h2>
            <p className="small muted" style={{ margin: '4px 0 14px' }}>A modalidade define quais atividades e prazos entram no checklist.</p>
            <div className="opcoes-cartao">
              {cat.modalidades.filter((m) => m.ativo).map((m) => (
                <button type="button" key={m.codigo} className={`opcao-cartao ${f.modalidade === m.codigo ? 'on' : ''}`} onClick={() => set('modalidade', m.codigo)}>
                  <strong>{m.nome}</strong>
                  <span>{m.descricao}</span>
                </button>
              ))}
            </div>
            <div className="caixa-ata mt">
              <div className="rotulo-campo mb" style={{ marginBottom: 8 }}>Ata de registro de preços</div>
              <div className="linha" style={{ flexWrap: 'nowrap' }}>
                <input className="input" placeholder="Buscar no catálogo: nº da ata, órgão ou objeto" value={buscaAta} onChange={(e) => setBuscaAta(e.target.value)} />
                <button type="button" className="btn contorno" onClick={() => setNovaAta(true)}>Cadastrar nova ata</button>
              </div>
              <select className="input mt-s" value={f.ata_id ?? ''} disabled={f.nenhuma_ata_compativel}
                onChange={(e) => set('ata_id', e.target.value || null)}>
                <option value="">{atasFiltradas.length ? 'Selecione a ata' : 'Nenhuma ata encontrada'}</option>
                {atasFiltradas.map((a) => (
                  <option key={a.id} value={a.id}>{a.numero} · {a.orgao_gerenciador}{a.objeto ? ` · ${a.objeto}` : ''}</option>
                ))}
              </select>
              <label className="check mt-s">
                <input type="checkbox" checked={Boolean(f.nenhuma_ata_compativel)}
                  onChange={(e) => setF((x) => ({ ...x, nenhuma_ata_compativel: e.target.checked, ata_id: e.target.checked ? null : x.ata_id }))} />
                Nenhuma ata compatível encontrada: registrar a pesquisa e manter o enquadramento em aberto
              </label>
            </div>
          </section>

          {/* 4 · Responsáveis */}
          <section className="card" id="sec-3" onFocus={() => setPasso(3)}>
            <h2 className="mb">4 · Responsáveis</h2>
            <div className="form-grid">
              <Campo rotulo="Responsável geral (Coordenação)" obrigatorio className="c6"
                erro={tentou && !f.responsavel_geral_id ? 'Obrigatório' : null}>
                <SelectIntegrante valor={f.responsavel_geral_id} onChange={(v) => set('responsavel_geral_id', v)}
                  filtro={(i) => i.frente === 'I' || i.papel === 'coordenacao' || i.papel === 'admin'} vazio="Selecione um integrante da Frente I"
                  invalido={tentou && !f.responsavel_geral_id} />
              </Campo>
              <Campo rotulo="Prioridade" className="c6">
                <Segmentado valor={f.prioridade} onChange={(v) => set('prioridade', v)}
                  opcoes={[{ valor: 'Alta', rotulo: 'Alta' }, { valor: 'Média', rotulo: 'Média' }, { valor: 'Baixa', rotulo: 'Baixa' }]} />
              </Campo>
            </div>
            <div className="tabela-wrap mt">
              <table className="tabela">
                <thead><tr><th>Etapa</th><th>Perfil que executa</th><th style={{ width: '45%' }}>Responsável</th></tr></thead>
                <tbody>
                  {cat.etapas.map((e) => {
                    const aplica = etapasMod.includes(e.numero);
                    const semFoco = aplica && !resp[e.numero] && /sem ponto focal/i.test(e.ponto_atencao ?? '');
                    return (
                      <tr key={e.numero} style={{ opacity: aplica ? 1 : 0.45 }}>
                        <td className="serif" style={{ fontWeight: 700 }}>{ROMANOS[e.numero]}</td>
                        <td>
                          <div>{e.nome}</div>
                          <div className="sub">{e.perfil_executor}</div>
                        </td>
                        <td>
                          {aplica ? (
                            <>
                              <SelectIntegrante valor={resp[e.numero]} onChange={(v) => setResp((r) => ({ ...r, [e.numero]: v }))}
                                filtro={(i) => i.frente === e.frente_executora || i.orgao === 'FAETEC'} invalido={semFoco} />
                              {semFoco && <div className="xs red" style={{ marginTop: 4 }}>Etapa sem ponto focal nomeado no GT</div>}
                            </>
                          ) : <span className="small muted">Não se aplica a esta modalidade</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5 · Documentos */}
          <section className="card" id="sec-4" onFocus={() => setPasso(4)}>
            <h2 className="mb">5 · Documentos iniciais</h2>
            <Dropzone onArquivos={adicionarArquivos} />
            <ListaArquivosPendentes arquivos={arquivos} tipos
              onTipo={(i, t) => setArquivos((a) => a.map((x, j) => (j === i ? { ...x, tipo: t } : x)))}
              onRemover={(i) => setArquivos((a) => a.filter((_, j) => j !== i))} />
            <div className="form-grid mt">
              <Campo rotulo="Link da pasta no Drive ou documento SEI" className="c6">
                <input className="input" type="url" placeholder="https://" value={f.link_pasta ?? ''} onChange={(e) => set('link_pasta', e.target.value)} />
              </Campo>
              <Campo rotulo="Observação inicial" className="c6">
                <input className="input" placeholder="Vira o primeiro andamento da linha do tempo" value={f.observacao_inicial ?? ''} onChange={(e) => set('observacao_inicial', e.target.value)} />
              </Campo>
            </div>
          </section>
        </div>

        <aside className="pilha" style={{ position: 'sticky', top: 16 }}>
          <div className="card escuro">
            <div className="eyebrow" style={{ color: 'var(--gold)' }}>Ao criar, o sistema gera</div>
            <div className="linha" style={{ alignItems: 'baseline', margin: '8px 0' }}>
              <span className="serif" style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>{totalAtiv}</span>
              <span>atividades no checklist</span>
            </div>
            <div className="small">Modalidade: <strong style={{ color: '#fff' }}>{mod?.nome}</strong></div>
            <div className="mt-s">
              {cat.etapas.map((e) => {
                const n = cat.modelo.filter((m) => m.ativo && m.etapa === e.numero).length;
                const on = etapasMod.includes(e.numero);
                return (
                  <div key={e.numero} className="linha" style={{ flexWrap: 'nowrap', padding: '5px 0', opacity: on ? 1 : 0.35 }}>
                    <span className="serif" style={{ width: 24, color: 'var(--gold)', fontWeight: 700 }}>{ROMANOS[e.numero]}</span>
                    <div style={{ flex: 1 }}>
                      <div className="small" style={{ color: '#fff' }}>{e.nome}</div>
                      <div className="barra fina" style={{ background: 'rgba(255,255,255,.15)' }}>
                        <span className="b-gold" style={{ width: on ? `${(n / 9) * 100}%` : 0 }} />
                      </div>
                    </div>
                    <strong style={{ color: '#fff' }}>{on ? n : 0}</strong>
                  </div>
                );
              })}
            </div>
            <p className="xs" style={{ color: '#aab5cf', marginBottom: 0 }}>
              {etapasMod.length === 5 ? 'Fluxo completo das 5 etapas, conforme o caminho crítico do GT.' : `Etapas ${etapasMod.map((n) => ROMANOS[n]).join(', ')} para esta modalidade.`}
            </p>
          </div>
          <div className="card">
            <h3 className="mb">Prazos legais que serão monitorados</h3>
            {legais.length ? (
              <ul className="lista-resumo">
                {legais.map((m) => (
                  <li key={m.id}><span className="red small">{m.nome}</span><strong className="red small">{prazoTexto(m.tipo_prazo, m.prazo_dias, m.prorrogacao_dias)}</strong></li>
                ))}
              </ul>
            ) : <p className="small muted">Nenhum prazo legal nesta modalidade até o enquadramento.</p>}
            <p className="xs muted" style={{ marginBottom: 0 }}>A contagem começa quando a data de envio for registrada na atividade.</p>
          </div>
          <div className="card">
            <h3 className="mb">Também acontece</h3>
            <ul className="lista-resumo small">
              <li>✓ Situação inicial: <strong>{f.justificativa_recebida === false ? 'Sem justificativa' : 'Em instrução'}</strong></li>
              <li>✓ Aviso no sininho para cada responsável designado</li>
              <li>✓ Registro da criação na auditoria</li>
              <li>✓ Entrada no painel e no próximo report semanal</li>
            </ul>
          </div>
          <button className="btn primario bloco" disabled={salvando} onClick={() => criar(false)}>
            {salvando ? 'Criando…' : 'Criar contratação'}
          </button>
          {faltam.length > 0 && <div className="xs muted center">Faltam: {faltam.join(', ')}</div>}
        </aside>
      </div>

      {novaAta && (
        <AtaForm
          onFechar={() => setNovaAta(false)}
          onSalvo={async (id) => {
            await recarregarCatalogos();
            set('ata_id', id);
            set('nenhuma_ata_compativel', false);
            setNovaAta(false);
          }}
        />
      )}
    </>
  );
}
