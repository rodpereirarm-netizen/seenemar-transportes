export type Papel = 'admin' | 'coordenacao' | 'conformidade' | 'elaboracao' | 'ponto_focal' | 'consulta';
export type Orgao = 'SEDES' | 'SECTI' | 'FAETEC' | 'PRODERJ' | 'OUTRO';
export type Frente = 'I' | 'II' | 'III';
export type StatusAtividade = 'pendente' | 'em_andamento' | 'aguardando' | 'devolvida' | 'concluida' | 'nao_se_aplica';
export type SituacaoPrazo =
  | 'sem_prazo' | 'aguardando_envio' | 'no_prazo' | 'atencao' | 'vencido'
  | 'cumprido' | 'cumprido_com_atraso' | 'nao_se_aplica';

export interface Integrante {
  id: string;
  user_id: string | null;
  nome: string;
  email: string | null;
  orgao: Orgao;
  frente: Frente | null;
  funcao: string | null;
  papel: Papel;
  modelo_trabalho: 'Presencial' | 'Híbrido' | 'Remoto';
  telefone: string | null;
  membro_gt: boolean;
  ativo: boolean;
}

export interface Etapa {
  numero: number;
  nome: string;
  macroprocesso: number;
  macroprocesso_nome: string;
  equipe: string | null;
  perfil_executor: string | null;
  frente_executora: Frente | null;
  ponto_atencao: string | null;
  base_legal: string | null;
}

export interface Modalidade {
  codigo: string;
  nome: string;
  descricao: string | null;
  etapas: number[];
  ordem: number;
  ativo: boolean;
}

export interface AtividadeModelo {
  id: number;
  etapa: number;
  ordem: number;
  nome: string;
  descricao: string | null;
  tipo_prazo: 'corridos' | 'uteis' | null;
  prazo_dias: number | null;
  prorrogacao_dias: number | null;
  prazo_critico: boolean;
  ponto_atencao: string | null;
  gate: boolean;
  base_legal: string | null;
  reaproveitada_em: string[];
  ativo: boolean;
}

export interface OpcaoLista {
  id: number;
  lista: string;
  valor: string;
  ordem: number;
  cor: Cor | null;
  ativo: boolean;
}
export type Cor = 'azul' | 'ouro' | 'verde' | 'vermelho' | 'cinza' | 'roxo';

export interface Area { id: number; nome: string; sigla: string | null; ativo: boolean }
export interface Feriado { data: string; descricao: string }

export interface Ata {
  id: string;
  numero: string;
  orgao_gerenciador: string;
  objeto: string | null;
  fornecedor: string | null;
  forma_uso: 'Adesão' | 'Participante';
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  situacao: string;
  link: string | null;
  observacao: string | null;
}

export interface Contratacao {
  id: string;
  numero: number;
  titulo: string;
  objeto: string;
  categoria: 'Bem' | 'Serviço' | 'Ambos';
  area_demandante_id: number | null;
  solucao_tic: boolean;
  processo_sei_origem: string | null;
  processo_sei: string | null;
  justificativa_recebida: boolean;
  consta_pca: boolean | null;
  item_pca: string | null;
  id_siga: string | null;
  valor_estimado: number | null;
  origem_estimativa: string | null;
  data_meta: string | null;
  modalidade: string;
  ata_id: string | null;
  via_descricao: string | null;
  nenhuma_ata_compativel: boolean;
  responsavel_geral_id: string | null;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  situacao: string;
  rascunho: boolean;
  dod_status: string | null;
  dod_obs: string | null;
  ata_status: string | null;
  ata_obs: string | null;
  ti_status: string | null;
  ti_obs: string | null;
  docs_prep_status: string | null;
  docs_prep_obs: string | null;
  divergencia_obs: string | null;
  ultimo_andamento: string | null;
  ultimo_andamento_em: string | null;
  observacao: string | null;
  link_pasta: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContratacaoView extends Contratacao {
  area_nome: string | null;
  modalidade_nome: string;
  modalidade_etapas: number[];
  ata_numero: string | null;
  ata_orgao: string | null;
  responsavel_geral_nome: string | null;
  etapa_atual: number | null;
  etapa_atual_nome: string | null;
  total_atividades: number;
  atividades_concluidas: number;
  prazos_vencidos: number;
  prazos_legais_em_curso: number;
  proximo_prazo: string | null;
  etapa_total: number | null;
  etapa_concluidas: number | null;
  atividade_atual_id: string | null;
  atividade_atual_nome: string | null;
  atividade_atual_status: StatusAtividade | null;
  atividade_atual_responsavel_id: string | null;
  atividade_atual_responsavel_nome: string | null;
}

export interface Atividade {
  id: string;
  contratacao_id: string;
  modelo_id: number | null;
  etapa: number;
  ordem: number;
  nome: string;
  tipo_prazo: 'corridos' | 'uteis' | null;
  prazo_dias: number | null;
  prorrogacao_dias: number | null;
  prazo_critico: boolean;
  ponto_atencao: string | null;
  gate: boolean;
  base_legal: string | null;
  status: StatusAtividade;
  responsavel_id: string | null;
  data_inicio: string | null;
  data_envio: string | null;
  prorrogado: boolean;
  prazo_legal: string | null;
  prazo_meta: string | null;
  data_conclusao: string | null;
  observacao: string | null;
  updated_at: string;
}

export interface AtividadeView extends Atividade {
  contratacao_numero: number;
  contratacao_titulo: string;
  contratacao_situacao: string;
  contratacao_modalidade: string;
  responsavel_geral_id: string | null;
  etapa_nome: string;
  responsavel_nome: string | null;
  responsavel_orgao: Orgao | null;
  responsavel_frente: Frente | null;
  prazo_efetivo: string | null;
  dias_restantes: number | null;
  situacao_prazo: SituacaoPrazo;
}

export interface Andamento {
  id: string;
  contratacao_id: string;
  atividade_id: string | null;
  integrante_id: string | null;
  tipo: 'andamento' | 'envio' | 'devolucao' | 'divergencia' | 'conclusao' | 'sistema';
  texto: string;
  created_at: string;
}

export interface Documento {
  id: string;
  contratacao_id: string;
  atividade_id: string | null;
  tipo_documento: string;
  nome_arquivo: string;
  storage_path: string;
  mime_type: string | null;
  tamanho_bytes: number | null;
  descricao: string | null;
  enviado_por: string | null;
  created_at: string;
}

export interface Notificacao {
  id: number;
  integrante_id: string;
  tipo: string;
  titulo: string;
  texto: string | null;
  contratacao_id: string | null;
  conversa_id?: string | null;
  lida: boolean;
  created_at: string;
}

export interface RegistroAuditoria {
  id: number;
  created_at: string;
  tabela: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  registro_id: string | null;
  contratacao_id: string | null;
  usuario_id: string | null;
  integrante_id: string | null;
  usuario_nome: string | null;
  campos_alterados: string[] | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
}

export interface CargaIntegrante {
  id: string;
  nome: string;
  orgao: Orgao;
  frente: Frente | null;
  funcao: string | null;
  papel: Papel;
  modelo_trabalho: string;
  membro_gt: boolean;
  ativo: boolean;
  atividades_abertas: number;
  atividades_em_curso: number;
  atividades_vencidas: number;
  vencem_5_dias: number;
  atividades_concluidas: number;
  contratacoes_envolvidas: number;
  contratacoes_coordenadas: number;
}
