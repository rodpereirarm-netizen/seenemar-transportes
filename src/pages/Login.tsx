import { useEffect, useState, type FormEvent } from 'react';
import { supabase, traduzirErro } from '../lib/supabase';
import { useApp } from '../lib/app';
import { InputSenha } from '../components/InputSenha';
import { Campo } from '../components/ui';

type Modo = 'entrar' | 'primeiro' | 'esqueci' | 'nova-senha';

export default function Login({ semVinculo }: { semVinculo?: boolean }) {
  const { sair, session } = useApp();
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === 'PASSWORD_RECOVERY') setModo('nova-senha');
    });
    if (window.location.hash.includes('type=recovery')) setModo('nova-senha');
    return () => data.subscription.unsubscribe();
  }, []);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setEnviando(true);
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) throw error;
      } else if (modo === 'primeiro') {
        if (senha.length < 8) throw new Error('Use uma senha com pelo menos 8 caracteres.');
        if (senha !== senha2) throw new Error('As senhas não conferem.');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session)
          setMsg({ ok: true, t: 'Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre com sua senha.' });
      } else if (modo === 'esqueci') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
        if (error) throw error;
        setMsg({ ok: true, t: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.' });
      } else if (modo === 'nova-senha') {
        if (senha.length < 8) throw new Error('Use uma senha com pelo menos 8 caracteres.');
        if (senha !== senha2) throw new Error('As senhas não conferem.');
        const { error } = await supabase.auth.updateUser({ password: senha });
        if (error) throw error;
        window.history.replaceState(null, '', '/');
        setMsg({ ok: true, t: 'Senha alterada.' });
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      setMsg({ t: traduzirErro((err as Error).message) });
    } finally {
      setEnviando(false);
    }
  }

  const titulos: Record<Modo, string> = {
    entrar: 'Entrar',
    primeiro: 'Primeiro acesso',
    esqueci: 'Recuperar senha',
    'nova-senha': 'Definir nova senha',
  };

  return (
    <div className="login">
      <div className="lado">
        <div>
          <div className="eyebrow">GT PROPAG · Compras públicas</div>
          <h1>Controle de contratações FAETEC</h1>
          <p>Fluxo de contratação com 3 macroprocessos, 5 etapas e 32 atividades, acompanhado por 15 integrantes de SEDES, SECTI, FAETEC e PRODERJ.</p>
          <ul>
            <li>Prazos legais monitorados: SEPLAG 15 dias corridos · PRODERJ 20 dias úteis (+20) · CGE 15 dias corridos</li>
            <li>Papéis e responsabilidades por etapa</li>
            <li>Toda ação registrada na auditoria</li>
          </ul>
        </div>
        <div className="small" style={{ color: '#8795b4' }}>Governo do Estado do Rio de Janeiro</div>
      </div>
      <div className="form">
        <div className="card">
          {semVinculo && session ? (
            <>
              <h2 className="serif" style={{ fontSize: 22 }}>Acesso não liberado</h2>
              <p className="muted">
                Sua conta ({session.user.email}) não está vinculada a um integrante ativo do GT. Peça ao administrador para
                cadastrar ou reativar seu e-mail em Manutenção › Integrantes.
              </p>
              <button className="btn" onClick={sair}>Sair</button>
            </>
          ) : (
            <form onSubmit={enviar} className="pilha">
              <div>
                <div className="eyebrow">Acesso restrito</div>
                <h2 className="serif" style={{ fontSize: 24, marginTop: 6 }}>{titulos[modo]}</h2>
                {modo === 'primeiro' && (
                  <p className="small muted">Use o e-mail que o administrador cadastrou para você na equipe do GT.</p>
                )}
              </div>
              {modo !== 'nova-senha' && (
                <Campo rotulo="E-mail institucional">
                  <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Campo>
              )}
              {modo !== 'esqueci' && (
                <Campo rotulo={modo === 'entrar' ? 'Senha' : 'Nova senha'}>
                  <InputSenha
                    required
                    autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                    value={senha} onChange={(e) => setSenha(e.target.value)}
                  />
                </Campo>
              )}
              {(modo === 'primeiro' || modo === 'nova-senha') && (
                <Campo rotulo="Confirme a senha">
                  <InputSenha required autoComplete="new-password" value={senha2} onChange={(e) => setSenha2(e.target.value)} />
                </Campo>
              )}
              {msg && <div className={`aviso ${msg.ok ? 'ok' : 'erro'}`}>{msg.t}</div>}
              <button className="btn primario bloco" disabled={enviando}>
                {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : modo === 'primeiro' ? 'Criar acesso' : modo === 'esqueci' ? 'Enviar link' : 'Salvar senha'}
              </button>
              <div className="entre small">
                {modo !== 'entrar' ? (
                  <button type="button" className="btn-link" onClick={() => { setModo('entrar'); setMsg(null); }}>Voltar para entrar</button>
                ) : (
                  <>
                    <button type="button" className="btn-link" onClick={() => { setModo('primeiro'); setMsg(null); }}>Primeiro acesso</button>
                    <button type="button" className="btn-link" onClick={() => { setModo('esqueci'); setMsg(null); }}>Esqueci a senha</button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
