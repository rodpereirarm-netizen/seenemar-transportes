import type { Cor, StatusAtividade, SituacaoPrazo, Papel } from './types';

export const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

export const num2 = (n: number | null | undefined) => (n == null ? '—' : String(n).padStart(2, '0'));

export function moeda(v: number | null | undefined, compacto = false): string {
  if (v == null) return '—';
  if (compacto && Math.abs(v) >= 1_000_000)
    return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;
  if (compacto && Math.abs(v) >= 1_000)
    return `R$ ${(v / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** 'AAAA-MM-DD' → 'DD/MM/AAAA' sem conversão de fuso. */
export function data(d: string | null | undefined): string {
  if (!d) return '—';
  const [a, m, dia] = d.slice(0, 10).split('-');
  return `${dia}/${m}/${a}`;
}

export function dataHora(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function relativo(d: string): string {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ontem';
  return dataHora(d);
}

/** Data de hoje em Brasília, formato ISO (AAAA-MM-DD). */
export function hojeISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export function somarDiasISO(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export const STATUS_ATIVIDADE: Record<StatusAtividade, { rotulo: string; cor: Cor }> = {
  pendente: { rotulo: 'Pendente', cor: 'cinza' },
  em_andamento: { rotulo: 'Em andamento', cor: 'ouro' },
  aguardando: { rotulo: 'Aguardando terceiros', cor: 'azul' },
  devolvida: { rotulo: 'Devolvida', cor: 'vermelho' },
  concluida: { rotulo: 'Concluída', cor: 'verde' },
  nao_se_aplica: { rotulo: 'Não se aplica', cor: 'cinza' },
};

export const SITUACAO_PRAZO: Record<SituacaoPrazo, { rotulo: string; cor: Cor }> = {
  sem_prazo: { rotulo: 'Sem prazo', cor: 'cinza' },
  aguardando_envio: { rotulo: 'Contagem não iniciada', cor: 'cinza' },
  no_prazo: { rotulo: 'No prazo', cor: 'verde' },
  atencao: { rotulo: 'Vence em breve', cor: 'ouro' },
  vencido: { rotulo: 'Vencido', cor: 'vermelho' },
  cumprido: { rotulo: 'Cumprido', cor: 'verde' },
  cumprido_com_atraso: { rotulo: 'Cumprido com atraso', cor: 'vermelho' },
  nao_se_aplica: { rotulo: 'Não se aplica', cor: 'cinza' },
};

export const PAPEIS: Record<Papel, { rotulo: string; descricao: string }> = {
  admin: { rotulo: 'Administrador', descricao: 'Controle total: integrantes, catálogos, exclusões e auditoria.' },
  coordenacao: {
    rotulo: 'Coordenação',
    descricao: 'Frente I · cria e edita contratações, designa responsáveis, aprova artefatos, vê auditoria.',
  },
  conformidade: {
    rotulo: 'Conformidade',
    descricao: 'Frente I · valida artefatos: edita atividades e situação das contratações, vê auditoria.',
  },
  elaboracao: {
    rotulo: 'Elaboração de artefatos',
    descricao: 'Frente II · atividades das Etapas I e II e as que lhe forem atribuídas; cadastra atas.',
  },
  ponto_focal: {
    rotulo: 'Ponto focal FAETEC',
    descricao: 'Frente III · lança dados nos sistemas, edita contratações e as atividades das Etapas III a V.',
  },
  consulta: { rotulo: 'Consulta', descricao: 'Somente leitura de painéis, contratações e relatórios.' },
};

export const FRENTES: Record<string, { nome: string; descricao: string }> = {
  I: { nome: 'Coordenação, aprovação e conformidade', descricao: 'SEDES · SECTI · FAETEC' },
  II: { nome: 'Pesquisa e elaboração de artefatos', descricao: 'SEDES · SECTI · PRODERJ' },
  III: { nome: 'Pontos focais e lançamento nos sistemas', descricao: 'FAETEC' },
};

export function prazoTexto(tipo: string | null, dias: number | null, prorrog: number | null): string {
  if (!tipo || !dias) return '';
  const base = `${dias} dias ${tipo === 'uteis' ? 'úteis' : 'corridos'}`;
  return prorrog ? `${base} (+${prorrog})` : base;
}

export function primeiroNome(nome: string | null | undefined): string {
  if (!nome) return '';
  return nome.split(' ')[0];
}

export function nomeCurto(nome: string | null | undefined): string {
  if (!nome) return '';
  const p = nome.split(' ');
  return p.length <= 2 ? nome : `${p[0]} ${p[p.length - 1]}`;
}

export function tamanhoArquivo(b: number | null): string {
  if (b == null) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
