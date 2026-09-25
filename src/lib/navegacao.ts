/**
 * Registro da tela anterior, para o botão “Voltar para …”.
 * O Layout registra cada mudança de rota; as telas secundárias consultam a anterior.
 */
let atual: string | null = null;
let anterior: string | null = null;

export function registrarRota(caminho: string) {
  if (caminho === atual) return;
  anterior = atual;
  atual = caminho;
}

/** Tela anterior à rota informada (o registro do Layout pode ainda não ter rodado nesta renderização). */
export const rotaAnterior = (caminhoAtual: string) => (atual !== caminhoAtual ? atual : anterior);

const NOMES: [RegExp, string][] = [
  [/^\/$/, 'Painel'],
  [/^\/contratacoes\/nova/, 'Nova contratação'],
  [/^\/contratacoes\/[^/?]+/, 'a contratação'],
  [/^\/contratacoes/, 'Contratações'],
  [/^\/pendencias\/[^/?]+/, 'Pendências do integrante'],
  [/^\/pendencias/, 'Minhas pendências'],
  [/^\/mensagens/, 'Mensagens'],
  [/^\/agenda/, 'Agenda de prazos'],
  [/^\/atas/, 'Atas de registro'],
  [/^\/relatorios/, 'Relatórios'],
  [/^\/evolucao/, 'Evolução'],
  [/^\/equipe/, 'Equipe do GT'],
  [/^\/auditoria/, 'Auditoria'],
  [/^\/manutencao/, 'Manutenção'],
];

export function nomeDaRota(caminho: string): string {
  return NOMES.find(([re]) => re.test(caminho))?.[1] ?? 'a tela anterior';
}
