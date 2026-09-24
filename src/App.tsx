import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './lib/app';
import { supabaseConfigurado } from './lib/supabase';
import Layout from './components/Layout';
import { Carregando, ToastHost } from './components/ui';
import Login from './pages/Login';

const Painel = lazy(() => import('./pages/Painel'));
const Contratacoes = lazy(() => import('./pages/Contratacoes'));
const NovaContratacao = lazy(() => import('./pages/NovaContratacao'));
const ContratacaoDetalhe = lazy(() => import('./pages/ContratacaoDetalhe'));
const Pendencias = lazy(() => import('./pages/Pendencias'));
const Atas = lazy(() => import('./pages/Atas'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Equipe = lazy(() => import('./pages/Equipe'));
const Auditoria = lazy(() => import('./pages/Auditoria'));
const Manutencao = lazy(() => import('./pages/Manutencao'));

export default function App() {
  const { session, carregando, eu, pode } = useApp();

  if (!supabaseConfigurado) {
    return (
      <div className="login">
        <div className="form" style={{ gridColumn: '1 / -1' }}>
          <div className="card">
            <h2>Configuração pendente</h2>
            <p className="muted">
              Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> nas variáveis de ambiente
              (arquivo <code>.env</code> local ou Netlify › Site configuration › Environment variables) e publique de novo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return (<><Login /><ToastHost /></>);
  if (carregando) return <Carregando texto="Carregando o painel do GT…" />;
  if (!eu || !eu.ativo) return <Login semVinculo />;

  const so = (cond: boolean, el: ReactNode) => (cond ? el : <Navigate to="/" replace />);

  return (
    <>
      <Suspense fallback={<Carregando />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Painel />} />
            <Route path="contratacoes" element={<Contratacoes />} />
            <Route path="contratacoes/nova" element={so(pode.criarContratacao, <NovaContratacao />)} />
            <Route path="contratacoes/:id" element={<ContratacaoDetalhe />} />
            <Route path="pendencias" element={<Pendencias />} />
            <Route path="pendencias/:integranteId" element={<Pendencias />} />
            <Route path="atas" element={<Atas />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="equipe" element={<Equipe />} />
            <Route path="auditoria" element={so(pode.verAuditoria, <Auditoria />)} />
            <Route path="manutencao" element={so(pode.admin, <Manutencao />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastHost />
    </>
  );
}
