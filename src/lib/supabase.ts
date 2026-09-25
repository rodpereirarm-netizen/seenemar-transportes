import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigurado = Boolean(url && key);

export const supabase = createClient(url ?? 'http://localhost', key ?? 'anon', {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const BUCKET_DOCUMENTOS = 'documentos';

/** Lança o erro do Supabase com mensagem legível. */
export function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(traduzirErro(res.error.message));
  return res.data;
}

export function traduzirErro(msg: string): string {
  if (/row-level security/i.test(msg)) return 'Seu perfil de acesso não permite esta operação.';
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha inválidos.';
  if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  if (/Database error saving new user/i.test(msg))
    return 'E-mail não cadastrado como integrante ativo do GT. Solicite acesso ao administrador.';
  if (/duplicate key/i.test(msg)) return 'Já existe um registro com esses dados.';
  if (/Password should be/i.test(msg)) return 'A senha deve ter pelo menos 6 caracteres.';
  return msg;
}

const PAGINA = 1000;
type Pagina<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/**
 * Lê todas as linhas de uma consulta, em páginas de 1.000.
 * A API do Supabase devolve no máximo 1.000 linhas por requisição (max-rows) e ignora
 * `.limit()` maior, sem avisar. `montar` recebe o intervalo e deve ter ordenação estável.
 */
export async function lerTodas<T>(montar: (de: number, ate: number) => Pagina<T>): Promise<T[]> {
  const linhas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await montar(de, de + PAGINA - 1);
    if (error) throw new Error(traduzirErro(error.message));
    linhas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return linhas;
  }
}
