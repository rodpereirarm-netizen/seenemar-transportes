/** Nomes legíveis para tabelas e campos (auditoria e relatórios). */
export const TABELAS: Record<string, string> = {
  contratacoes: 'Contratação',
  contratacao_responsaveis: 'Responsável por etapa',
  atividades: 'Atividade',
  andamentos: 'Andamento',
  documentos: 'Documento',
  integrantes: 'Integrante',
  atas: 'Ata de registro',
  areas_demandantes: 'Área demandante',
  opcoes_lista: 'Lista suspensa',
  feriados: 'Feriado',
  atividades_modelo: 'Modelo de atividade',
  modalidades: 'Modalidade',
  etapas: 'Etapa',
};

export const OPERACOES: Record<string, { rotulo: string; cor: 'verde' | 'ouro' | 'vermelho' }> = {
  INSERT: { rotulo: 'Inclusão', cor: 'verde' },
  UPDATE: { rotulo: 'Alteração', cor: 'ouro' },
  DELETE: { rotulo: 'Exclusão', cor: 'vermelho' },
};

export const CAMPOS: Record<string, string> = {
  numero: 'Nº', titulo: 'Nome curto', objeto: 'Objeto', categoria: 'Categoria', area_demandante_id: 'Área demandante',
  solucao_tic: 'Solução de TIC', processo_sei_origem: 'Processo SEI de origem', processo_sei: 'Processo SEI',
  justificativa_recebida: 'Justificativa recebida', consta_pca: 'Consta no PCA/PEDTIC', item_pca: 'Item do PCA',
  id_siga: 'ID SIGA', valor_estimado: 'Valor estimado', origem_estimativa: 'Origem da estimativa', data_meta: 'Data-meta',
  modalidade: 'Modalidade', ata_id: 'Ata', via_descricao: 'Via / ata', nenhuma_ata_compativel: 'Nenhuma ata compatível',
  responsavel_geral_id: 'Responsável geral', prioridade: 'Prioridade', situacao: 'Situação', rascunho: 'Rascunho',
  dod_status: 'DOD · status', dod_obs: 'DOD · observação', ata_status: 'ARP · status', ata_obs: 'ARP · observação',
  ti_status: 'Manifestação TI · status', ti_obs: 'Manifestação TI · observação', docs_prep_status: 'Fase preparatória · status',
  docs_prep_obs: 'Fase preparatória · observação', divergencia_obs: 'Divergência', ultimo_andamento: 'Último andamento',
  ultimo_andamento_em: 'Data do último andamento', observacao: 'Observação', link_pasta: 'Link da pasta',
  status: 'Status', responsavel_id: 'Responsável', data_inicio: 'Início', data_envio: 'Data de envio', prorrogado: 'Prorrogado',
  prazo_legal: 'Prazo legal', prazo_meta: 'Prazo interno', data_conclusao: 'Conclusão', nome: 'Nome', email: 'E-mail',
  orgao: 'Órgão', frente: 'Frente', funcao: 'Função', papel: 'Perfil de acesso', modelo_trabalho: 'Modelo de trabalho',
  ativo: 'Ativo', membro_gt: 'Membro do GT', telefone: 'Telefone', user_id: 'Conta de acesso', etapa: 'Etapa',
  integrante_id: 'Integrante', texto: 'Texto', tipo: 'Tipo', nome_arquivo: 'Arquivo', tipo_documento: 'Tipo de documento',
  orgao_gerenciador: 'Órgão gerenciador', fornecedor: 'Fornecedor', forma_uso: 'Forma de uso', vigencia_inicio: 'Vigência início',
  vigencia_fim: 'Vigência fim', link: 'Link', valor: 'Valor', lista: 'Lista', cor: 'Cor', data: 'Data', descricao: 'Descrição',
  tipo_prazo: 'Tipo de prazo', prazo_dias: 'Prazo (dias)', prorrogacao_dias: 'Prorrogação (dias)', etapas: 'Etapas',
};

export const IGNORAR_CAMPOS = new Set(['id', 'created_at', 'updated_at', 'contratacao_id', 'modelo_id', 'created_by']);
