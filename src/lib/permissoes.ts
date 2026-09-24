import type { Atividade, Contratacao, Integrante, Papel } from './types';

/**
 * Espelho no front-end das políticas RLS do banco (migration 03).
 * O banco é quem decide; aqui só escondemos o que o perfil não pode fazer.
 */
export function permissoes(eu: Integrante | null, vinculos?: { contratacoesComigo?: Set<string> }) {
  const p: Papel | null = eu?.ativo ? eu.papel : null;
  const tem = (...ps: Papel[]) => p != null && ps.includes(p);

  return {
    papel: p,
    admin: tem('admin'),
    operar: tem('admin', 'coordenacao', 'conformidade', 'elaboracao', 'ponto_focal'),
    criarContratacao: tem('admin', 'coordenacao'),
    excluirContratacao: tem('admin'),
    designarResponsaveis: tem('admin', 'coordenacao'),
    verAuditoria: tem('admin', 'coordenacao', 'conformidade'),
    verPendenciasDeOutros: tem('admin', 'coordenacao', 'conformidade'),
    gerirAtas: tem('admin', 'coordenacao', 'conformidade', 'elaboracao', 'ponto_focal'),
    editarContratacao(c: Pick<Contratacao, 'id' | 'responsavel_geral_id'>) {
      if (tem('admin', 'coordenacao', 'conformidade', 'ponto_focal')) return true;
      if (tem('elaboracao'))
        return c.responsavel_geral_id === eu?.id || Boolean(vinculos?.contratacoesComigo?.has(c.id));
      return false;
    },
    editarAtividade(a: Pick<Atividade, 'etapa' | 'responsavel_id'>) {
      if (tem('admin', 'coordenacao', 'conformidade')) return true;
      if (a.responsavel_id && a.responsavel_id === eu?.id) return true;
      if (tem('elaboracao')) return a.etapa <= 2;
      if (tem('ponto_focal')) return a.etapa >= 3;
      return false;
    },
  };
}

export type Permissoes = ReturnType<typeof permissoes>;
