import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app';
import { supabase, traduzirErro } from '../lib/supabase';
import { PAPEIS, relativo } from '../lib/format';
import type { Notificacao } from '../lib/types';
import { Campo, Modal, toast } from './ui';
import { InputSenha } from './InputSenha';
import { registrarRota } from '../lib/navegacao';
import {
  IcAgenda, IcBarras, IcCheck, IcDoc, IcEngrenagem, IcEquipe, IcEscudo, IcEvolucao, IcLista, IcMenu, IcMensagem, IcPainel, IcSino,
} from './Icones';
import { EVENTO_MENSAGENS } from '../lib/eventos';

export default function Layout() {
  const { eu, pode, sair } = useApp();
  const [aberta, setAberta] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const [msgNaoLidas, setMsgNaoLidas] = useState(0);
  const [trocarSenha, setTrocarSenha] = useState(false);
  const loc = useLocation();

  useEffect(() => setAberta(false), [loc.pathname]);
  useEffect(() => registrarRota(loc.pathname + loc.search), [loc.pathname, loc.search]);

  // Mensagens não lidas: a cada 30 s, ao trocar de tela e quando a central avisa
  useEffect(() => {
    if (!eu) return;
    const contar = () => supabase.rpc('fn_mensagens_nao_lidas').then(({ data, error }) => !error && setMsgNaoLidas(Number(data ?? 0)));
    contar();
    const h = setInterval(contar, 30_000);
    window.addEventListener(EVENTO_MENSAGENS, contar);
    return () => { clearInterval(h); window.removeEventListener(EVENTO_MENSAGENS, contar); };
  }, [eu, loc.pathname]);

  useEffect(() => {
    if (!eu) return;
    supabase
      .from('atividades')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', eu.id)
      .not('status', 'in', '(concluida,nao_se_aplica)')
      .then(({ count }) => setPendentes(count ?? 0));
  }, [eu, loc.pathname]);

  return (
    <div className="app">
      <aside className={`sidebar ${aberta ? 'aberta' : ''}`}>
        <div className="brand">
          <div className="eyebrow">GT PROPAG · Compras</div>
          <div className="nome">FAETEC</div>
          <div className="sub">Controle de contratações</div>
        </div>
        <nav className="nav">
          <NavLink to="/" end><IcPainel /> Painel</NavLink>
          <NavLink to="/contratacoes"><IcLista /> Contratações</NavLink>
          <NavLink to="/pendencias">
            <IcCheck /> Minhas pendências {pendentes > 0 && <span className="contador">{pendentes}</span>}
          </NavLink>
          <NavLink to="/mensagens">
            <IcMensagem /> Mensagens {msgNaoLidas > 0 && <span className="contador">{msgNaoLidas}</span>}
          </NavLink>
          <NavLink to="/agenda"><IcAgenda /> Agenda de prazos</NavLink>
          <NavLink to="/atas"><IcDoc /> Atas de registro</NavLink>
          <NavLink to="/relatorios"><IcBarras /> Relatórios</NavLink>
          <NavLink to="/evolucao"><IcEvolucao /> Evolução</NavLink>
          <NavLink to="/equipe"><IcEquipe /> Equipe do GT</NavLink>
          {(pode.verAuditoria || pode.admin) && <div className="grupo">Administração</div>}
          {pode.verAuditoria && <NavLink to="/auditoria"><IcEscudo /> Auditoria</NavLink>}
          {pode.admin && (
            <NavLink to="/manutencao">
              <IcEngrenagem /> Manutenção <span className="tag">ADMIN</span>
            </NavLink>
          )}
        </nav>
        <div className="usuario">
          <strong>{eu?.nome ?? '—'}</strong>
          <div className="perfil">Perfil: {eu ? PAPEIS[eu.papel].rotulo : '—'}</div>
          <div className="perfil xs">Toda ação é registrada na auditoria</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setTrocarSenha(true)}>Alterar senha</button>
            <button onClick={sair}>Sair</button>
          </div>
        </div>
      </aside>
      {aberta && <div className="modal-fundo" style={{ zIndex: 35 }} onClick={() => setAberta(false)} />}
      <main className="main">
        <div className="topbar">
          <div className="linha">
            <button className="menu-mobile" onClick={() => setAberta(true)} aria-label="Abrir menu">
              <IcMenu width={18} />
            </button>
            <span className="eyebrow">Fluxo de contratação · 5 etapas · 32 atividades</span>
          </div>
          <div className="direita">
            <span className="muted small nao-imprimir">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
            <Notificacoes />
          </div>
        </div>
        <Outlet />
      </main>
      {trocarSenha && <AlterarSenha onFechar={() => setTrocarSenha(false)} />}
    </div>
  );
}

function AlterarSenha({ onFechar }: { onFechar: () => void }) {
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setErro(null);
    if (senha.length < 8) return setErro('Use uma senha com pelo menos 8 caracteres.');
    if (senha !== senha2) return setErro('As senhas não conferem.');
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) return setErro(traduzirErro(error.message));
    toast('Senha alterada. Use a nova senha no próximo acesso.');
    onFechar();
  }

  return (
    <Modal
      titulo="Alterar minha senha"
      onFechar={onFechar}
      rodape={
        <>
          <button className="btn" onClick={onFechar}>Cancelar</button>
          <button className="btn primario" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar nova senha'}</button>
        </>
      }
    >
      <div className="pilha">
        <p className="small muted" style={{ margin: 0 }}>Recomendado no primeiro acesso com senha provisória. A senha deve ter pelo menos 8 caracteres.</p>
        <Campo rotulo="Nova senha">
          <InputSenha autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Campo>
        <Campo rotulo="Confirme a nova senha" erro={erro}>
          <InputSenha autoComplete="new-password" value={senha2}
            onChange={(e) => setSenha2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvar()} />
        </Campo>
      </div>
    </Modal>
  );
}

function Notificacoes() {
  const { eu } = useApp();
  const nav = useNavigate();
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    if (!eu) return;
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('integrante_id', eu.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setItens(data ?? []);
  }, [eu]);

  useEffect(() => {
    carregar();
    const h = setInterval(carregar, 60_000);
    return () => clearInterval(h);
  }, [carregar]);

  useEffect(() => {
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  const naoLidas = itens.filter((i) => !i.lida).length;

  async function marcarTodas() {
    if (!eu) return;
    await supabase.from('notificacoes').update({ lida: true }).eq('integrante_id', eu.id).eq('lida', false);
    carregar();
  }

  async function abrir(n: Notificacao) {
    if (!n.lida) await supabase.from('notificacoes').update({ lida: true }).eq('id', n.id);
    setAberto(false);
    carregar();
    if (n.conversa_id) nav(`/mensagens?c=${n.conversa_id}`);
    else if (n.contratacao_id) nav(`/contratacoes/${n.contratacao_id}`);
  }

  return (
    <div style={{ position: 'relative' }} ref={ref} className="nao-imprimir">
      <button className="sino" onClick={() => setAberto((a) => !a)} aria-label={`Notificações (${naoLidas} não lidas)`}>
        <IcSino />
        {naoLidas > 0 && <span className="badge">{naoLidas}</span>}
      </button>
      {aberto && (
        <div className="popover">
          <div className="cab">
            <h3>Notificações</h3>
            {naoLidas > 0 && (
              <button className="btn-link" onClick={marcarTodas}>
                Marcar todas como lidas
              </button>
            )}
          </div>
          {itens.length === 0 ? (
            <div className="vazio small">Nenhuma notificação.</div>
          ) : (
            <ul>
              {itens.map((n) => (
                <li key={n.id} className={`${n.lida ? 'lida' : 'nova'} ${n.tipo}`} onClick={() => abrir(n)}>
                  <div>{n.titulo}</div>
                  <div className="quando">
                    {relativo(n.created_at)}
                    {n.texto ? ` · ${n.texto}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
