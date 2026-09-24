import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ok, supabase } from './supabase';
import { permissoes, type Permissoes } from './permissoes';
import type { Area, Ata, AtividadeModelo, Etapa, Integrante, Modalidade, OpcaoLista } from './types';

export interface Catalogos {
  etapas: Etapa[];
  modalidades: Modalidade[];
  modelo: AtividadeModelo[];
  integrantes: Integrante[];
  opcoes: OpcaoLista[];
  areas: Area[];
  atas: Ata[];
}

interface AppCtx {
  session: Session | null;
  carregando: boolean;
  eu: Integrante | null;
  pode: Permissoes;
  cat: Catalogos;
  recarregarCatalogos: () => Promise<void>;
  lista: (nome: string) => OpcaoLista[];
  integrante: (id: string | null | undefined) => Integrante | undefined;
  modalidade: (codigo: string | null | undefined) => Modalidade | undefined;
  sair: () => Promise<void>;
}

const vazio: Catalogos = { etapas: [], modalidades: [], modelo: [], integrantes: [], opcoes: [], areas: [], atas: [] };
const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [cat, setCat] = useState<Catalogos>(vazio);
  const [vinculos, setVinculos] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const recarregarCatalogos = useCallback(async () => {
    const [etapas, modalidades, modelo, integrantes, opcoes, areas, atas] = await Promise.all([
      supabase.from('etapas').select('*').order('numero'),
      supabase.from('modalidades').select('*').order('ordem'),
      supabase.from('atividades_modelo').select('*').order('etapa').order('ordem'),
      supabase.from('integrantes').select('*').order('nome'),
      supabase.from('opcoes_lista').select('*').order('lista').order('ordem'),
      supabase.from('areas_demandantes').select('*').order('nome'),
      supabase.from('atas').select('*').order('numero'),
    ]);
    setCat({
      etapas: ok(etapas) ?? [],
      modalidades: ok(modalidades) ?? [],
      modelo: ok(modelo) ?? [],
      integrantes: ok(integrantes) ?? [],
      opcoes: ok(opcoes) ?? [],
      areas: ok(areas) ?? [],
      atas: ok(atas) ?? [],
    });
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setCat(vazio);
      return;
    }
    setCarregando(true);
    recarregarCatalogos()
      .catch((e) => console.error(e))
      .finally(() => setCarregando(false));
  }, [userId, recarregarCatalogos]);

  const eu = useMemo(
    () => cat.integrantes.find((i) => i.user_id === userId) ?? null,
    [cat.integrantes, userId],
  );

  // contratações em que o integrante tem atividade/etapa (libera edição para o perfil Elaboração)
  useEffect(() => {
    if (!eu || eu.papel !== 'elaboracao') return;
    Promise.all([
      supabase.from('atividades').select('contratacao_id').eq('responsavel_id', eu.id),
      supabase.from('contratacao_responsaveis').select('contratacao_id').eq('integrante_id', eu.id),
    ]).then(([a, r]) => {
      const s = new Set<string>();
      (a.data ?? []).forEach((x) => s.add(x.contratacao_id));
      (r.data ?? []).forEach((x) => s.add(x.contratacao_id));
      setVinculos(s);
    });
  }, [eu]);

  const valor = useMemo<AppCtx>(
    () => ({
      session,
      carregando,
      eu,
      pode: permissoes(eu, { contratacoesComigo: vinculos }),
      cat,
      recarregarCatalogos,
      lista: (nome) => cat.opcoes.filter((o) => o.lista === nome && o.ativo),
      integrante: (id) => (id ? cat.integrantes.find((i) => i.id === id) : undefined),
      modalidade: (c) => (c ? cat.modalidades.find((m) => m.codigo === c) : undefined),
      sair: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, carregando, eu, vinculos, cat, recarregarCatalogos],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp fora do AppProvider');
  return c;
}

/** Carregamento simples com recarga manual. */
export function useCarregar<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    fn()
      .then((d) => ativo && (setDados(d), setErro(null)))
      .catch((e: Error) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, versao]);

  return { dados, erro, carregando, recarregar: () => setVersao((v) => v + 1) };
}
