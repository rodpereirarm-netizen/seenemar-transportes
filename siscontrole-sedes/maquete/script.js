/* =========================================================================
   SisControle SEDES — Maquete navegável
   Tudo aqui é FICTÍCIO: nomes, números de processo, prazos e documentos
   servem apenas para validar telas, fluxo e perfis com a ASCOIN.
   Na versão real, os dados vêm do Supabase (Postgres + RLS).
   ========================================================================= */
'use strict';

/* ---------- Data de referência da maquete ---------- */
const HOJE = new Date(2026, 10, 13, 12, 0, 0); // 13/11/2026
const DIA = 86400000;
const toDate = (s) => new Date(s + 'T12:00:00');
const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
const addDias = (s, n) => iso(new Date(toDate(s).getTime() + n * DIA));
const diasAte = (s) => Math.round((toDate(s) - HOJE) / DIA);
const fmt = (s) => (s ? s.split('-').reverse().join('/') : '—');
const fmtCurta = (s) => (s ? s.split('-').reverse().slice(0, 2).join('/') : '—');
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

/* ---------- Ícones (traço único, 24px) ---------- */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M11 10v8M15 12v6M19 6v12"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7z"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  checklist: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  paperclip: '<path d="m21 11-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l8-8"/>',
  search2: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>',
  stamp: '<path d="M5 22h14M19 18H5v-3a2 2 0 0 1 2-2h3l-1-5a3 3 0 1 1 6 0l-1 5h3a2 2 0 0 1 2 2z"/>',
};
const ico = (n) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const BRASAO = `<svg class="brasao" viewBox="0 0 40 46" role="img" aria-label="Espaço reservado para o brasão oficial do Estado do Rio de Janeiro"><path d="M20 2 37 8v14c0 11-8 19-17 22C11 41 3 33 3 22V8Z" fill="none" stroke="var(--gold)" stroke-width="2"/><path d="M20 7 32 11.5V22c0 8-5.5 14-12 16.5C13.5 36 8 30 8 22V11.5Z" fill="var(--gov-2)" stroke="var(--gold)" stroke-width=".8" stroke-dasharray="2 2"/><text x="20" y="24.5" text-anchor="middle" font-size="5" fill="#a9bbd4" font-family="sans-serif" font-weight="700">BRASÃO</text></svg>`;

/* =========================================================================
   DADOS FICTÍCIOS
   ========================================================================= */
// Organograma (Art. 2º do Regimento) — siglas das coordenadorias da DGAF a confirmar
const AREAS = [
  ['SEDES', 'Secretaria de Estado de Desenvolvimento Econômico', 'secretaria', null],
  ['GABSEC', 'Gabinete do Secretário', 'gabinete', 'SEDES'],
  ['CORREG', 'Corregedoria', 'assessoria', 'GABSEC'],
  ['OUVID', 'Ouvidoria', 'assessoria', 'GABSEC'],
  ['ASCOIN', 'Assessoria de Controle Interno', 'assessoria', 'GABSEC'],
  ['AUDIN', 'Assessoria de Auditoria Interna', 'assessoria', 'GABSEC'],
  ['ASSJUR', 'Assessoria Jurídica', 'assessoria', 'GABSEC'],
  ['CHEGAB', 'Chefia de Gabinete', 'chefia', 'SEDES'],
  ['SUBEXE', 'Subsecretaria Executiva', 'subsecretaria', 'SEDES'],
  ['AGE', 'Assessoria de Gestão Estratégica', 'assessoria', 'SUBEXE'],
  ['ASPO', 'Assessoria de Planejamento e Orçamento', 'assessoria', 'SUBEXE'],
  ['SGP', 'Superintendência de Gestão de Pessoas', 'superintendencia', 'SUBEXE'],
  ['DGAF', 'Diretoria-Geral de Administração e Finanças', 'diretoria', 'SUBEXE'],
  ['COFIN', 'Coordenadoria de Finanças', 'coordenadoria', 'DGAF'],
  ['COCON', 'Coordenadoria de Convênios', 'coordenadoria', 'DGAF'],
  ['COLIC', 'Coordenadoria de Licitações e Contratos', 'coordenadoria', 'DGAF'],
  ['ATI', 'Assessoria de Tecnologia da Informação', 'assessoria', 'SUBEXE'],
  ['SUBICS', 'Subsecretaria de Indústria, Comércio e Serviços', 'subsecretaria', 'SEDES'],
  ['SUBINOV', 'Subsecretaria de Inovação', 'subsecretaria', 'SEDES'],
  ['SUBEEM', 'Subsecretaria de Energia e Economia do Mar', 'subsecretaria', 'SEDES'],
  ['CODIN', 'Companhia de Desenvolvimento Industrial', 'vinculada', 'SEDES'],
  ['AGERIO', 'Agência Estadual de Fomento', 'vinculada', 'SEDES'],
  ['AGENERSA', 'Agência Reguladora de Energia e Saneamento', 'vinculada', 'SEDES'],
  ['FUNDOS', 'Fundos e colegiados (lista a confirmar)', 'colegiado', 'SEDES'],
].map(([sigla, nome, tipo, pai]) => ({ sigla, nome, tipo, pai }));
const AREA = Object.fromEntries(AREAS.map((a) => [a.sigla, a]));
function descendentes(sigla) {
  const out = new Set([sigla]);
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const a of AREAS) if (a.pai && out.has(a.pai) && !out.has(a.sigla)) { out.add(a.sigla); mudou = true; }
  }
  return out;
}

const PAPEIS = {
  admin: 'Administrador', ascoin: 'Controle Interno (ASCOIN)', auditoria: 'Auditoria Interna',
  ponto_focal: 'Ponto focal', gestor: 'Gestor',
};
const USERS = [
  { id: 'u2', nome: 'Juliana Prado', papel: 'ascoin', area: 'ASCOIN', cargo: 'Assessora de Controle Interno', email: 'jprado@sedes.rj.gov.br', ativo: true, troca: false },
  { id: 'u3', nome: 'Renata Duarte', papel: 'ascoin', area: 'ASCOIN', cargo: 'Analista de Controle Interno', email: 'rduarte@sedes.rj.gov.br', ativo: true, troca: false },
  { id: 'u1', nome: 'Marcelo Teixeira', papel: 'admin', area: 'AGE', cargo: 'Administrador do sistema (ASSGEST)', email: 'mteixeira@sedes.rj.gov.br', ativo: true, troca: false },
  { id: 'u4', nome: 'Roberto Alves', papel: 'auditoria', area: 'AUDIN', cargo: 'Auditor interno', email: 'ralves@sedes.rj.gov.br', ativo: true, troca: false },
  { id: 'u5', nome: 'Fernanda Lopes', papel: 'ponto_focal', area: 'DGAF', cargo: 'Ponto focal da DGAF', email: 'flopes@sedes.rj.gov.br', ativo: true, troca: false },
  { id: 'u6', nome: 'André Siqueira', papel: 'ponto_focal', area: 'ATI', cargo: 'Ponto focal da ATI', email: 'asiqueira@sedes.rj.gov.br', ativo: true, troca: true },
  { id: 'u9', nome: 'Carla Mendes', papel: 'ponto_focal', area: 'ASPO', cargo: 'Ponto focal da ASPO', email: 'cmendes@sedes.rj.gov.br', ativo: true, troca: false },
  { id: 'u10', nome: 'Tiago Nunes', papel: 'ponto_focal', area: 'SUBINOV', cargo: 'Ponto focal da SUBINOV', email: 'tnunes@sedes.rj.gov.br', ativo: true, troca: true },
  { id: 'u7', nome: 'Paulo Henrique Costa', papel: 'gestor', area: 'CHEGAB', cargo: 'Chefe de Gabinete', email: 'phcosta@sedes.rj.gov.br', ativo: true, troca: false, restrito: true },
  { id: 'u8', nome: 'Luciana Barros', papel: 'gestor', area: 'SUBEXE', cargo: 'Subsecretária Executiva', email: 'lbarros@sedes.rj.gov.br', ativo: true, troca: false },
];
const USER = Object.fromEntries(USERS.map((u) => [u.id, u]));
const SWITCH = ['u2', 'u5', 'u6', 'u7', 'u8', 'u4', 'u1'];
const PONTO_FOCAL = {
  DGAF: 'Fernanda Lopes', COCON: 'Bruno Carvalho', COFIN: 'Patrícia Gomes', COLIC: 'Rafael Moura', ASPO: 'Carla Mendes',
  ATI: 'André Siqueira', SGP: 'Helena Rocha', SUBICS: 'Gustavo Lima', CODIN: 'Marina Castro', OUVID: 'Sérgio Pinto',
  AGE: 'Beatriz Farias', SUBINOV: 'Tiago Nunes', SUBEEM: 'Eduardo Ramos', AGERIO: 'Lívia Moreira',
};

// Status configuráveis (tabela status_acompanhamento)
const STATUS = [
  ['recebida', 'Recebida', 'c-neutral', 1, false],
  ['distribuida', 'Distribuída', 'c-neutral', 2, false],
  ['em_atendimento', 'Em atendimento', 'c-info', 3, false],
  ['respondida_area', 'Respondida pela área', 'c-info', 4, false],
  ['em_analise_ascoin', 'Em análise (ASCOIN)', 'c-info', 5, false],
  ['devolvida', 'Devolvida', 'c-warn', 6, false],
  ['consolidada', 'Consolidada', 'c-violet', 7, false],
  ['ciencia_chegab', 'Ciência CHEGAB', 'c-violet', 8, false],
  ['enviada_orgao', 'Enviada ao órgão', 'c-violet', 9, false],
  ['em_monitoramento', 'Em monitoramento', 'c-violet', 10, false],
  ['atendida', 'Atendida', 'c-ok', 11, true],
  ['parcialmente_atendida', 'Parcialmente atendida', 'c-serious', 12, true],
  ['nao_atendida', 'Não atendida', 'c-crit', 13, true],
  ['cancelada', 'Cancelada', 'c-neutral', 14, true],
].map(([cod, nome, cls, ordem, final]) => ({ cod, nome, cls, ordem, final }));
const ST = Object.fromEntries(STATUS.map((s) => [s.cod, s]));
// status em que o prazo está com a área (contam para "vencidas" e "a vencer")
const COM_AREA = new Set(['distribuida', 'em_atendimento', 'devolvida', 'em_monitoramento']);
const GRAV = ['', 'Baixa', 'Média', 'Alta', 'Crítica'];
const ORGAOS = ['TCE-RJ', 'CGE-RJ', 'MPRJ', 'ALERJ'];

const DEMANDAS = [
  { n: '0044', org: 'TCE-RJ', tipo: 'Diligência', doc: 'Ofício nº 498/2026 – SGE', sei: 'SEI-220006/004812/2026', procOrg: 'TCE-RJ 301.552-7/2026', canal: 'Sistema do TCE', receb: '2026-11-12', prazo: '2026-12-02', grav: 3, assunto: 'Contratação de consultoria para estudos de atração de investimentos', resumo: 'O Tribunal solicita o processo de contratação, os estudos técnicos preliminares e a justificativa de preço da consultoria.', obs: 'Aguardando definição das áreas responsáveis.' },
  { n: '0041', org: 'TCE-RJ', tipo: 'Diligência', doc: 'Ofício nº 412/2026 – 3ª CAC', sei: 'SEI-220006/003977/2026', procOrg: 'TCE-RJ 245.678-3/2026', canal: 'SEI', receb: '2026-10-30', prazo: '2026-11-24', grav: 3, assunto: 'Prestação de contas de convênios celebrados em 2025', resumo: 'Diligência sobre três convênios com municípios: relatórios de cumprimento do objeto, comprovação de despesas e dotação orçamentária.', obs: 'Tema já apontado em 2025 (DEM-2025-0118).', reinc: 'DEM-2025-0118' },
  { n: '0042', org: 'CGE-RJ', tipo: 'Relatório de auditoria', doc: 'Relatório de Auditoria nº 18/2026', sei: 'SEI-220006/003511/2026', procOrg: '—', canal: 'E-mail', receb: '2026-10-06', prazo: '2026-11-10', grav: 4, assunto: 'Recomendações sobre a gestão de contratos de TI', resumo: 'Três recomendações: plano de continuidade, designação de fiscais e inventário de licenças.', obs: '' },
  { n: '0040', org: 'CGE-RJ', tipo: 'Solicitação de informações', doc: 'Ofício CGE nº 233/2026', sei: 'SEI-220006/003850/2026', procOrg: '—', canal: 'SEI', receb: '2026-10-27', prazo: '2026-11-20', grav: 2, assunto: 'Diárias e passagens concedidas no exercício de 2026', resumo: 'Relação de diárias e passagens com beneficiário, destino, motivo e valor.', obs: '' },
  { n: '0039', org: 'TCE-RJ', tipo: 'Solicitação de informações', doc: 'Ofício nº 397/2026 – SGE', sei: 'SEI-220006/003702/2026', procOrg: 'TCE-RJ 240.115-9/2026', canal: 'SEI', receb: '2026-10-20', prazo: '2026-11-19', grav: 2, assunto: 'Incentivos fiscais concedidos ao setor industrial', resumo: 'Termos de acordo celebrados e acompanhamento das contrapartidas de emprego.', obs: 'Respostas das áreas consolidadas. Aguardando ciência da CHEGAB.' },
  { n: '0038', org: 'TCE-RJ', tipo: 'Diligência', doc: 'Ofício nº 381/2026 – 5ª CAC', sei: 'SEI-220006/003655/2026', procOrg: 'TCE-RJ 238.904-1/2026', canal: 'Sistema do TCE', receb: '2026-10-15', prazo: '2026-11-16', grav: 3, assunto: 'Operações de crédito com recursos de fundos estaduais', resumo: 'Relação das operações contratadas pela agência de fomento com recursos de fundos geridos pela Secretaria.', obs: 'Escalonado à SUBEXE e à CHEGAB em 12/11.' },
  { n: '0037', org: 'CGE-RJ', tipo: 'Monitoramento', doc: 'Ofício CGE nº 187/2026', sei: 'SEI-220006/002940/2026', procOrg: '—', canal: 'SEI', receb: '2026-08-15', prazo: '2026-11-30', grav: 2, assunto: 'Monitoramento das recomendações de transparência ativa', resumo: 'Acompanhamento de três recomendações do relatório de 2025 sobre o portal da Secretaria.', obs: '', reinc: 'DEM-2025-0097' },
  { n: '0035', org: 'MPRJ', tipo: 'Requisição', doc: 'Ofício MPRJ nº 1.204/2026', sei: 'SEI-220006/004102/2026', procOrg: 'IC nº 0457/2026', canal: 'E-mail', receb: '2026-11-03', prazo: '2026-11-18', grav: 3, assunto: 'Documentos do edital de subvenção à inovação', resumo: 'Requisição de documentos do processo seletivo do edital 02/2026.', obs: '', restrito: true },
  { n: '0033', org: 'TCE-RJ', tipo: 'Auditoria governamental', doc: 'Ofício nº 205/2026 – SGE', sei: 'SEI-220006/002118/2026', procOrg: 'TCE-RJ 215.330-4/2026', canal: 'SEI', receb: '2026-06-10', prazo: '2026-07-10', grav: 3, assunto: 'Auditoria operacional na política de economia do mar', resumo: 'Plano de ação para as determinações da auditoria operacional.', obs: '' },
  { n: '0030', org: 'CGE-RJ', tipo: 'Solicitação de informações', doc: 'Ofício CGE nº 121/2026', sei: 'SEI-220006/001887/2026', procOrg: '—', canal: 'SEI', receb: '2026-05-20', prazo: '2026-06-19', grav: 2, assunto: 'Execução de convênios com municípios no 1º semestre', resumo: 'Informações sobre repasses e prestações de contas.', obs: '' },
  { n: '0028', org: 'ALERJ', tipo: 'Requerimento de informação', doc: 'Requerimento de Informação nº 312/2026', sei: 'SEI-220006/001640/2026', procOrg: '—', canal: 'SEI', receb: '2026-04-28', prazo: '2026-05-28', grav: 1, assunto: 'Investimentos previstos no setor de óleo e gás', resumo: 'Relação de investimentos anunciados e acompanhados pela Secretaria.', obs: '' },
];
const DEM = Object.fromEntries(DEMANDAS.map((d) => [d.n, d]));

// Itens de acompanhamento: [origem-ref, seq, área, status, prazo original, prazo vigente, gravidade, restrito, título, resumo, observações, devoluções]
const ITENS = [
  ['0041', 1, 'COCON', 'em_atendimento', '2026-11-17', '2026-11-17', 3, false, 'Prestação de contas dos convênios nº 008, 011 e 014/2025', 'Apresentar os relatórios de cumprimento do objeto e a documentação de despesas dos três convênios do item 2 do ofício.', 'O convênio 014/2025 tem pendência do convenente. A área vai juntar a notificação enviada ao município.', 0],
  ['0041', 2, 'COFIN', 'respondida_area', '2026-11-17', '2026-11-17', 2, false, 'Comprovantes de repasse e conciliação bancária', 'Encaminhar extratos e comprovantes de repasse dos convênios do item 2.', '', 0],
  ['0041', 3, 'ASPO', 'devolvida', '2026-11-15', '2026-11-15', 2, false, 'Dotação orçamentária e notas de empenho dos convênios', 'Informar a dotação e as notas de empenho de cada convênio.', 'Devolvida: faltou a nota de empenho do convênio 011/2025.', 2],
  ['0041', 4, 'DGAF', 'em_atendimento', '2026-11-14', '2026-11-14', 3, false, 'Manifestação da DGAF sobre as falhas do item 3', 'Justificar a ausência de parecer técnico conclusivo nas prestações de contas.', '', 0],
  ['0042', 1, 'ATI', 'em_atendimento', '2026-11-10', '2026-11-10', 4, false, 'Rec. 1 — Plano de continuidade dos serviços de TI', 'Elaborar e aprovar plano de continuidade para os sistemas críticos.', 'Prorrogação de 15 dias solicitada em 08/11, aguardando decisão.', 0],
  ['0042', 2, 'COLIC', 'em_analise_ascoin', '2026-11-10', '2026-11-10', 3, false, 'Rec. 2 — Designação formal de fiscais dos contratos de TI', 'Comprovar a designação de fiscal técnico e administrativo dos contratos 021 e 027/2025.', '', 1],
  ['0042', 3, 'ATI', 'consolidada', '2026-11-10', '2026-11-10', 2, false, 'Rec. 3 — Inventário de licenças de software', 'Apresentar inventário atualizado de licenças e contratos de suporte.', '', 0],
  ['0040', 1, 'SGP', 'respondida_area', '2026-11-20', '2026-11-20', 2, false, 'Diárias concedidas — janeiro a outubro', 'Planilha de diárias com beneficiário, destino, motivo e valor.', '', 1],
  ['0040', 2, 'COFIN', 'em_atendimento', '2026-11-20', '2026-11-20', 2, false, 'Passagens aéreas emitidas — janeiro a outubro', 'Relação de bilhetes emitidos e faturas da agência de viagens.', '', 0],
  ['0039', 1, 'SUBICS', 'consolidada', '2026-11-12', '2026-11-12', 2, false, 'Termos de acordo celebrados em 2025 e 2026', 'Relacionar os termos de acordo e a estimativa de renúncia.', '', 0],
  ['0039', 2, 'CODIN', 'consolidada', '2026-11-12', '2026-11-12', 2, false, 'Contrapartidas de emprego das empresas incentivadas', 'Informar o acompanhamento das metas de emprego pactuadas.', '', 0],
  ['0038', 1, 'AGERIO', 'em_atendimento', '2026-11-11', '2026-11-11', 3, false, 'Operações contratadas com recursos de fundos estaduais', 'Relação das operações, saldos e situação de adimplência.', '', 0],
  ['0037', 1, 'OUVID', 'atendida', '2026-09-30', '2026-09-30', 2, false, 'Rec. 1 — Carta de Serviços ao Usuário atualizada', 'Publicar a Carta de Serviços revisada.', '', 0],
  ['0037', 2, 'AGE', 'parcialmente_atendida', '2026-09-30', '2026-10-15', 2, false, 'Rec. 2 — Indicadores de desempenho no portal', 'Publicar indicadores dos programas finalísticos.', 'Publicados 6 de 9 indicadores.', 2],
  ['0037', 3, 'AGE', 'em_monitoramento', '2026-11-30', '2026-11-30', 2, false, 'Rec. 3 — Dados abertos dos programas de fomento', 'Disponibilizar bases em formato aberto.', '', 0],
  ['0035', 1, 'SUBINOV', 'distribuida', '2026-11-18', '2026-11-18', 3, true, 'Processo seletivo do edital de subvenção 02/2026', 'Encaminhar edital, atas da comissão e pareceres.', 'Item restrito: procedimento sob sigilo no MPRJ.', 0],
  ['0033', 1, 'SUBEEM', 'enviada_orgao', '2026-07-10', '2026-07-10', 3, false, 'Determinação 1 — Plano de ação da política de economia do mar', 'Apresentar plano de ação com responsáveis e prazos.', '', 0],
  ['0033', 2, 'SUBEEM', 'em_monitoramento', '2026-11-12', '2026-11-12', 3, false, 'Determinação 2 — Licenciamento de áreas portuárias', 'Concluir o levantamento das áreas e o cronograma de licenciamento.', 'Relatório de andamento previsto no plano de ação.', 1],
  ['0030', 1, 'COCON', 'atendida', '2026-06-19', '2026-06-19', 2, false, 'Repasses e prestações de contas do 1º semestre', '', '', 1],
  ['0030', 2, 'ASPO', 'atendida', '2026-06-19', '2026-06-19', 2, false, 'Execução orçamentária dos convênios', '', '', 0],
  ['0028', 1, 'SUBEEM', 'atendida', '2026-05-28', '2026-05-28', 1, false, 'Investimentos anunciados no setor de óleo e gás', '', '', 0],
  ['CHK0011', 7, 'COCON', 'em_atendimento', '2026-11-27', '2026-11-27', 3, false, 'Não conforme — Certidão de regularidade do FGTS do convenente', 'Checklist CHK-2026-0011, item 7: certidão vencida na data da celebração.', '', 0],
  ['CHK0011', 11, 'COCON', 'distribuida', '2026-11-27', '2026-11-27', 2, false, 'Não conforme — Plano de trabalho sem cronograma de desembolso', 'Checklist CHK-2026-0011, item 11: anexar cronograma aprovado.', '', 0],
].map(([ref, seq, area, status, prazoOrig, prazo, grav, restrito, titulo, resumo, obs, devol]) => {
  const chk = ref.startsWith('CHK');
  const id = `${ref}-${String(seq).padStart(2, '0')}`;
  return {
    id, ref, seq, area, status, prazoOrig, prazo, grav, restrito, titulo, resumo, obs, devol,
    origem: chk ? 'checklist' : 'demanda_externa',
    numero: chk ? `CHK-2026-${ref.slice(3)}/${String(seq).padStart(2, '0')}` : `DEM-2026-${ref}/${String(seq).padStart(2, '0')}`,
    receb: chk ? '2026-11-06' : DEM[ref].receb,
    extra: [],
  };
});
const ITEM = Object.fromEntries(ITENS.map((i) => [i.id, i]));

let PRORROGACOES = [
  { id: 'P-0019', item: '0042-01', em: '2026-11-08', por: 'André Siqueira', dias: 15, just: 'O plano depende da contratação do serviço de backup em nuvem, com processo em fase de pesquisa de preços.', status: 'pendente' },
  { id: 'P-0018', item: '0041-03', em: '2026-11-12', por: 'Carla Mendes', dias: 5, just: 'A nota de empenho do convênio 011/2025 está sendo reemitida pela COFIN.', status: 'pendente' },
  { id: 'P-0015', item: '0037-02', em: '2026-09-25', por: 'Beatriz Farias', dias: 15, just: 'A publicação depende de ajuste no portal pela ATI.', status: 'aprovada', decisao: 'Aprovada por Juliana Prado em 26/09/2026.' },
];

let NOTIFS = [
  { id: 1, para: ['ascoin', 'admin'], tipo: 'atraso', quando: '2026-11-13 07:00', txt: 'DEM-2026-0042/01 está 3 dias em atraso (ATI).', item: '0042-01', lida: false },
  { id: 2, para: ['ascoin', 'gestor'], tipo: 'escalonamento', quando: '2026-11-13 07:00', txt: 'Escalonamento: DEM-2026-0038/01 (AGERIO) está 2 dias em atraso. Aviso enviado à CHEGAB.', item: '0038-01', lida: false },
  { id: 3, para: ['ponto_focal', 'ascoin'], tipo: 'd2', quando: '2026-11-13 07:00', txt: 'D-2: DEM-2026-0041/03 vence em 15/11 (ASPO).', item: '0041-03', lida: false },
  { id: 4, para: ['ponto_focal'], tipo: 'vencimento', quando: '2026-11-13 07:00', txt: 'Vence amanhã: DEM-2026-0041/04 (DGAF).', item: '0041-04', lida: false },
  { id: 5, para: ['ascoin'], tipo: 'resposta', quando: '2026-11-12 16:20', txt: 'A COFIN respondeu o item DEM-2026-0041/02.', item: '0041-02', lida: false },
  { id: 6, para: ['gestor'], tipo: 'ciencia', quando: '2026-11-12 15:05', txt: 'DEM-2026-0039 está consolidada e aguarda ciência da CHEGAB.', dem: '0039', lida: false },
  { id: 7, para: ['ascoin'], tipo: 'prorrogacao', quando: '2026-11-12 11:40', txt: 'Pedido de prorrogação P-0018 (ASPO, 5 dias).', lida: true },
  { id: 8, para: ['ponto_focal', 'ascoin'], tipo: 'distribuicao', quando: '2026-11-06 10:12', txt: 'Novo item distribuído: CHK-2026-0011/11 (COCON).', item: 'CHK0011-11', lida: true },
  { id: 9, para: ['admin'], tipo: 'sistema', quando: '2026-11-13 03:00', txt: 'Rotina de limpeza da lixeira concluída: 1 arquivo removido do Storage.', lida: true },
];

let LIXEIRA = [
  { id: 'L-031', tipo: 'Evidência', ref: 'Extrato_conta_convênio_008.pdf (DEM-2026-0041/02)', por: 'Patrícia Gomes', login: 'pgomes', em: '2026-11-11 14:32', motivo: 'Arquivo enviado em duplicidade.' },
  { id: 'L-030', tipo: 'Demanda', ref: 'DEM-2026-0043 (cadastro duplicado da 0041)', por: 'Renata Duarte', login: 'rduarte', em: '2026-11-02 09:15', motivo: 'Demanda cadastrada duas vezes a partir do mesmo ofício.' },
  { id: 'L-027', tipo: 'Item de acompanhamento', ref: 'DEM-2026-0037/04', por: 'Juliana Prado', login: 'jprado', em: '2026-10-20 17:48', motivo: 'Item incluído por engano; a recomendação 4 não existe no relatório.' },
];

const TRILHA = [
  { em: '2026-11-13 09:41:07', user: 'jprado', tabela: 'prorrogacoes', reg: 'P-0018', acao: 'INSERT', antes: null, depois: { item: 'DEM-2026-0041/03', dias: 5, status: 'pendente' } },
  { em: '2026-11-12 16:20:44', user: 'pgomes', tabela: 'itens_acompanhamento', reg: 'DEM-2026-0041/02', acao: 'UPDATE', antes: { status: 'em_atendimento', data_resposta: null }, depois: { status: 'respondida_area', data_resposta: '2026-11-12' } },
  { em: '2026-11-12 15:05:12', user: 'jprado', tabela: 'itens_acompanhamento', reg: 'DEM-2026-0039/02', acao: 'UPDATE', antes: { status: 'em_analise_ascoin' }, depois: { status: 'consolidada' } },
  { em: '2026-11-12 10:02:33', user: 'rduarte', tabela: 'demandas', reg: 'DEM-2026-0044', acao: 'INSERT', antes: null, depois: { orgao: 'TCE-RJ', prazo: '2026-12-02', processo_sei: 'SEI-220006/004812/2026' } },
  { em: '2026-11-11 14:32:09', user: 'pgomes', tabela: 'evidencias', reg: 'EV-0212', acao: 'SOFT_DELETE', antes: { deleted_at: null }, depois: { deleted_at: '2026-11-11 14:32', delete_reason: 'Arquivo enviado em duplicidade.' } },
  { em: '2026-11-10 11:27:51', user: 'jprado', tabela: 'itens_acompanhamento', reg: 'DEM-2026-0041/03', acao: 'UPDATE', antes: { status: 'em_analise_ascoin' }, depois: { status: 'devolvida', devolucoes: 2 } },
  { em: '2026-11-04 08:55:18', user: 'jprado', tabela: 'itens_acompanhamento', reg: 'DEM-2026-0037/03', acao: 'UPDATE', antes: { status: 'enviada_orgao' }, depois: { status: 'em_monitoramento' } },
  { em: '2026-11-03 18:02:40', user: 'mteixeira', tabela: 'perfis', reg: 'tnunes', acao: 'INSERT', antes: null, depois: { papel: 'ponto_focal', area: 'SUBINOV', deve_trocar_senha: true } },
];

// Checklists
const MODELOS = [
  { cod: 'CONV-CEL', nome: 'Convênios — Celebração', area: 'COCON', versao: 3, status: 'publicado', em: '2026-09-15', itens: 12, uso: 9 },
  { cod: 'CONV-CEL', nome: 'Convênios — Celebração', area: 'COCON', versao: 4, status: 'rascunho', em: null, itens: 13, uso: 0 },
  { cod: 'CONV-PC', nome: 'Convênios — Prestação de contas', area: 'COCON', versao: 2, status: 'publicado', em: '2026-08-02', itens: 15, uso: 6 },
  { cod: 'CONT-FISC', nome: 'Contratos — Fiscalização', area: 'COLIC', versao: 1, status: 'rascunho', em: null, itens: 10, uso: 0 },
];
const CK_ITENS = [
  ['Habilitação do convenente', 'O convenente comprovou regularidade fiscal perante a Fazenda Federal, Estadual e Municipal?', 'LC 101/2000, art. 25, §1º, IV, "a"'],
  ['Habilitação do convenente', 'Há comprovação de regularidade com a Seguridade Social (CND previdenciária)?', 'CF, art. 195, §3º'],
  ['Habilitação do convenente', 'Foi verificada a inexistência de pendências em cadastros de inadimplência do Estado?', 'Norma estadual de transferências (a indicar)'],
  ['Plano de trabalho', 'O plano de trabalho descreve objeto, metas, etapas e indicadores mensuráveis?', 'Lei 14.133/2021, art. 184'],
  ['Plano de trabalho', 'O plano de trabalho foi aprovado pela autoridade competente?', 'Regimento Interno SEDES'],
  ['Instrução processual', 'Consta declaração de disponibilidade orçamentária e nota de empenho?', 'Lei 4.320/1964, arts. 58 a 61'],
  ['Habilitação do convenente', 'Há certidão de regularidade do FGTS válida na data da celebração?', 'Lei 8.036/1990, art. 27'],
  ['Instrução processual', 'Consta parecer jurídico sobre a minuta do convênio?', 'Lei 14.133/2021, art. 53 c/c art. 184'],
  ['Instrução processual', 'A contrapartida do convenente está prevista e comprovada?', 'LDO vigente'],
  ['Instrução processual', 'Foi designado gestor/fiscal do convênio?', 'Lei 14.133/2021, art. 117 c/c art. 184'],
  ['Plano de trabalho', 'O cronograma de desembolso está compatível com as metas?', 'Lei 14.133/2021, art. 184'],
  ['Publicidade', 'O extrato do convênio foi publicado no DOERJ?', 'Lei 14.133/2021, art. 184 (publicidade)'],
].map(([secao, q, lei], i) => ({ n: i + 1, secao, q, lei }));
let APLICACOES = [
  { n: '0012', modelo: 'CONV-CEL v3', objeto: 'Convênio nº 019/2026 — Município de Serra Alta (fictício)', sei: 'SEI-220006/004377/2026', area: 'COCON', momento: 'Prévia', status: 'em_preenchimento', resp: 'Renata Duarte', inicio: '2026-11-10', lote: 'L-2026-04',
    respostas: { 1: ['conforme', '', 'Doc. 81234567'], 2: ['conforme', '', 'Doc. 81234570'], 3: ['conforme', '', ''], 4: ['com_ressalva', 'Indicadores da meta 2 não têm linha de base.', 'Doc. 81234601'], 5: ['conforme', '', 'Doc. 81234612'], 6: ['conforme', '', 'Doc. 81234650'], 7: ['nao_conforme', 'CRF vencida em 02/11/2026, antes da data prevista de assinatura.', 'Doc. 81234575'], 8: ['nao_se_aplica', 'Minuta padrão aprovada pela ASSJUR (parecer referencial).', ''], 9: ['conforme', '', 'Doc. 81234660'] } },
  { n: '0011', modelo: 'CONV-CEL v3', objeto: 'Convênio nº 017/2026 — Município de Vale do Ipê (fictício)', sei: 'SEI-220006/004190/2026', area: 'COCON', momento: 'Prévia', status: 'assinado', resp: 'Juliana Prado', inicio: '2026-11-03', lote: 'L-2026-04', codigo: 'SEDES-4F7K-Q29M-XT8D', resumo: '9 C · 2 NC · 1 NA' },
  { n: '0009', modelo: 'CONV-PC v2', objeto: 'Prestação de contas — Convênio nº 004/2025', sei: 'SEI-220006/003120/2026', area: 'COCON', momento: 'Posterior', status: 'assinado', resp: 'Renata Duarte', inicio: '2026-10-14', lote: '—', codigo: 'SEDES-9QW2-L7HN-3RCE', resumo: '14 C · 1 CR' },
];
const LOTES = { 'L-2026-04': { nome: 'Convênios celebrados — 2º semestre/2026', pop: 48, amostra: 12, metodo: 'Aleatória simples, semente 20261103', analisados: 2 } };
let ASSINATURAS = [
  { codigo: 'SEDES-4F7K-Q29M-XT8D', tipo: 'Parecer de checklist (CHK-2026-0011)', nome: 'Juliana Prado', cargo: 'Assessora de Controle Interno', em: '2026-11-06 16:42', hash: '9f3c1a7be0d24c55a8e1f06b7d93e2c4417fa9d0b6c38e5512aa47d09c1e6b3f' },
  { codigo: 'SEDES-9QW2-L7HN-3RCE', tipo: 'Parecer de checklist (CHK-2026-0009)', nome: 'Renata Duarte', cargo: 'Analista de Controle Interno', em: '2026-10-21 10:08', hash: '41d0e7c93ab25f6e8c1d47b0a9e36f2c58d1b7a4e09c3f6d2b8a1e5c7f40d93a' },
];


/* =========================================================================
   ESTADO E REGRAS DE VISIBILIDADE (espelham as políticas RLS propostas)
   ========================================================================= */
const state = { userId: 'u2', route: 'painel', q: '', ladAberto: new Set(['o:TCE-RJ', 'o:CGE-RJ', 'o:MPRJ', 'o:ALERJ', 'o:Checklist']), filtros: { periodo: 'ano', orgao: '', area: '', origem: '', grav: '' }, pendTab: 'todas', ckTab: 'aplicacoes', admTab: 'usuarios', relTipo: 'pendencias', demFiltro: { org: '', sit: '' } };
try { const u = localStorage.getItem('sisc_user'); if (u && USER[u]) state.userId = u; } catch (e) { /* armazenamento indisponível */ }

const eu = () => USER[state.userId];
const raizVisao = (u) => (u.papel === 'gestor' && u.area === 'CHEGAB' ? 'SEDES' : u.area);
const stIdx = (s) => ST[s].ordem;
const isFinal = (it) => ST[it.status].final;

function podeVerItem(it, u = eu()) {
  if (u.papel === 'admin' || u.papel === 'ascoin') return true;
  if (it.restrito && !(u.papel === 'gestor' && u.restrito)) return false;
  if (u.papel === 'auditoria') return true;
  return descendentes(raizVisao(u)).has(it.area);
}
const itensVisiveis = () => ITENS.filter((it) => podeVerItem(it));
const itensDaDemanda = (n) => ITENS.filter((i) => i.ref === n);
function podeVerDemanda(d, u = eu()) {
  if (u.papel === 'admin' || u.papel === 'ascoin') return true;
  if (d.restrito && !(u.papel === 'gestor' && u.restrito)) return false;
  if (u.papel === 'auditoria') return true;
  return itensDaDemanda(d.n).some((i) => podeVerItem(i, u));
}
function statusDemanda(d) {
  const its = itensDaDemanda(d.n).filter((i) => i.status !== 'cancelada');
  if (!its.length) return 'recebida';
  if (its.every(isFinal)) return 'encerrada';
  return its.filter((i) => !isFinal(i)).sort((a, b) => stIdx(a.status) - stIdx(b.status))[0].status;
}
function situacao(it) {
  if (isFinal(it)) return { cls: 'encerrado', txt: 'encerrado', n: null };
  if (!COM_AREA.has(it.status)) return { cls: 'encerrado', txt: it.status === 'respondida_area' || it.status === 'em_analise_ascoin' ? 'com a ASCOIN' : 'resposta entregue', n: null };
  const n = diasAte(it.prazo);
  if (n < 0) return { cls: 'vencido', txt: `${plural(-n, 'dia', 'dias')} em atraso`, n };
  if (n === 0) return { cls: 'avencer', txt: 'vence hoje', n };
  if (n <= 5) return { cls: 'avencer', txt: n === 1 ? 'vence amanhã' : `vence em ${n} dias`, n };
  return { cls: 'noprazo', txt: `${n} dias`, n };
}
const diasResposta = (it) => 4 + ((it.seq * 5 + parseInt(it.ref.replace(/\D/g, ''), 10)) % 11);

/* ---------- Componentes de texto ---------- */
const chipStatus = (s) => (s === 'encerrada' ? '<span class="chip c-ok">Encerrada</span>' : `<span class="chip ${ST[s].cls}">${ST[s].nome}</span>`);
const chipOrigem = (o) => ({ demanda_externa: '<span class="chip plain c-neutral">Demanda externa</span>', checklist: '<span class="chip plain c-neutral">Checklist</span>', auditoria: '<span class="chip plain c-neutral">Auditoria</span>', risco: '<span class="chip plain c-neutral">Risco</span>' }[o]);
const sev = (g) => `<span class="sev g${g}"><i><b></b><b></b><b></b><b></b></i>${GRAV[g]}</span>`;
const prazoCell = (it) => { const s = situacao(it); return `<span class="prazo ${s.cls}"><b>${fmt(it.prazo)}</b><span>${s.txt}</span></span>`; };
const lockTag = (r) => (r ? `<span class="lock" title="Acesso restrito">${ico('lock')}Restrito</span>` : '');
const orgTag = (o) => `<span class="tag-org">${esc(o)}</span>`;
const iniciais = (n) => n.split(' ').filter((p) => p.length > 2).slice(0, 2).map((p) => p[0]).join('');
function linkItem(it) { return `item-${it.id}`; }

/* =========================================================================
   LINHA DO TEMPO (interações geradas a partir do status — na versão real
   vêm da tabela "interacoes", somente inclusão)
   ========================================================================= */
function interacoes(it) {
  const ev = [];
  const base = it.origem === 'checklist' ? '2026-11-06' : addDias(it.receb, 1);
  const pf = PONTO_FOCAL[it.area] || 'Ponto focal';
  const cap = (s) => (toDate(s) > HOJE ? iso(HOJE) : s);
  const i = stIdx(it.status);
  const fin = isFinal(it);
  ev.push({ t: 'Distribuição', who: it.origem === 'checklist' ? 'Sistema (checklist)' : 'Juliana Prado · ASCOIN', when: base, txt: `Item distribuído para ${it.area}. Prazo: ${fmt(it.prazoOrig)}.`, c: 'c-info', i: 'send' });
  if (i > 2 || fin) ev.push({ t: 'Ciência do recebimento', who: `${pf} · ${it.area}`, when: cap(addDias(base, 1)), c: 'c-ok', i: 'checkc' });
  const dr = diasResposta(it);
  if (it.devol > 0) {
    for (let k = 0; k < it.devol; k++) {
      ev.push({ t: 'Resposta da área', who: `${pf} · ${it.area}`, when: cap(addDias(base, dr - 4 + k * 2)), txt: 'Resposta enviada com evidências anexas.', c: 'c-info', i: 'msg' });
      ev.push({ t: 'Devolvida para complementação', who: 'Juliana Prado · ASCOIN', when: cap(addDias(base, dr - 3 + k * 2)), txt: k === it.devol - 1 && it.status === 'devolvida' ? it.obs.replace('Devolvida: ', '') : 'Faltou documento comprobatório citado na resposta.', c: 'c-warn', i: 'undo' });
    }
  }
  if ((i >= 4 && it.status !== 'devolvida') || fin) ev.push({ t: 'Resposta da área', who: `${pf} · ${it.area}`, when: cap(addDias(base, dr)), txt: 'Resposta enviada com evidências anexas.', c: 'c-info', i: 'msg' });
  if ((i >= 5 && it.status !== 'devolvida') || fin) ev.push({ t: 'Análise iniciada', who: 'Juliana Prado · ASCOIN', when: cap(addDias(base, dr + 1)), c: 'c-info', i: 'eye' });
  if (i >= 7 || fin) ev.push({ t: 'Resposta aceita e consolidada', who: 'Juliana Prado · ASCOIN', when: cap(addDias(base, dr + 2)), c: 'c-violet', i: 'check' });
  if (i >= 8 || fin) ev.push({ t: 'Ciência da CHEGAB', who: 'Paulo Henrique Costa · CHEGAB', when: cap(addDias(base, dr + 3)), c: 'c-violet', i: 'stamp' });
  if (i >= 9 || fin) ev.push({ t: 'Enviada ao órgão', who: 'Juliana Prado · ASCOIN', when: cap(addDias(base, dr + 4)), txt: `Ofício SEDES/ASCOIN nº ${100 + parseInt(it.ref.replace(/\D/g, ''), 10) % 90}/2026.`, c: 'c-violet', i: 'send' });
  if (i >= 10 || fin) ev.push({ t: 'Monitoramento iniciado', who: 'Juliana Prado · ASCOIN', when: cap(addDias(base, dr + 5)), txt: 'Acompanhar implementação até o prazo do plano de ação.', c: 'c-violet', i: 'clock' });
  if (fin) ev.push({ t: `Encerrado — ${ST[it.status].nome}`, who: 'Juliana Prado · ASCOIN', when: cap(addDias(base, dr + 12)), txt: it.obs || 'Cumprimento confirmado por ofício do órgão.', c: it.status === 'atendida' ? 'c-ok' : 'c-warn', i: 'checkc' });
  return ev.concat(it.extra);
}
function hashFake(s, len = 64) {
  let h = 2166136261 >>> 0; let out = '';
  while (out.length < len) { for (const ch of s + out.length) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } out += h.toString(16).padStart(8, '0'); }
  return out.slice(0, len);
}
function evidencias(it) {
  const i = stIdx(it.status);
  const lista = [];
  if (i >= 4 || isFinal(it) || it.devol > 0) {
    lista.push({ nome: `Oficio_resposta_${it.area}_${it.seq}.pdf`, ext: 'PDF', tam: '412 KB', por: PONTO_FOCAL[it.area], em: fmt(addDias(it.receb, diasResposta(it) + 1)) });
    if (it.seq % 2 === 0 || it.area === 'COFIN') lista.push({ nome: `Planilha_${it.area}_dados.xlsx`, ext: 'XLSX', tam: '88 KB', por: PONTO_FOCAL[it.area], em: fmt(addDias(it.receb, diasResposta(it) + 1)) });
  }
  return lista.concat(it.evExtra || []).map((e) => ({ ...e, hash: hashFake(e.nome) }));
}

/* =========================================================================
   GRÁFICOS — ver widgets do painel
   ========================================================================= */
/* =========================================================================
   SHELL
   ========================================================================= */
const TITULOS = { painel: 'Painel executivo', inicio: 'Minha fila', demandas: 'Demandas externas', demanda: 'Demanda', item: 'Item', pendencias: 'Pendências', prorrogacoes: 'Prorrogações', checklists: 'Checklists', aplicacao: 'Checklist', relatorios: 'Relatórios', notificacoes: 'Notificações', lixeira: 'Lixeira', trilha: 'Trilha de auditoria', admin: 'Administração', auditoria: 'Auditoria interna', riscos: 'Riscos e controles' };
function navLinks() {
  const u = eu();
  const vis = itensVisiveis();
  const abertas = vis.filter((i) => !isFinal(i)).length;
  const venc = vis.filter((i) => situacao(i).cls === 'vencido').length;
  const prPend = PRORROGACOES.filter((p) => p.status === 'pendente').length;
  const naoLidas = minhasNotifs().filter((n) => !n.lida).length;
  const items = [
    ['painel', 'Painel executivo', 'chart'],
    ['inicio', 'Minha fila', 'home'],
    ['g'],
    ['demandas', 'Demandas externas', 'inbox'],
    ['pendencias', 'Pendências', 'list', venc ? `<span class="count alert" title="${venc} vencidas">${venc}</span>` : `<span class="count">${abertas}</span>`],
    ...(['ascoin', 'admin'].includes(u.papel) ? [['prorrogacoes', 'Prorrogações', 'clock', prPend ? `<span class="count">${prPend}</span>` : '']] : []),
    ['checklists', 'Checklists', 'checklist'],
    ['g'],
    ['relatorios', 'Relatórios', 'file'],
    ['notificacoes', 'Notificações', 'bell', naoLidas ? `<span class="count">${naoLidas}</span>` : ''],
    ...(['ascoin', 'admin'].includes(u.papel) ? [['lixeira', 'Lixeira', 'trash']] : []),
    ...(['ascoin', 'admin', 'auditoria'].includes(u.papel) ? [['trilha', 'Trilha de auditoria', 'history']] : []),
    ...(u.papel === 'admin' ? [['admin', 'Administração', 'gear']] : []),
    ['g'],
    ['auditoria', 'Auditoria interna (Fase 2)', 'search2'],
    ['riscos', 'Riscos e controles (Fase 2)', 'target'],
  ];
  const ativo = rotaBase();
  return items.map((x) => (x[0] === 'g' ? '<div class="nav-group" role="separator"></div>' : `<a href="#${x[0]}" data-label="${x[1]}" aria-label="${x[1]}" class="${ativo === x[0] ? 'active' : ''} ${x[0] === 'auditoria' || x[0] === 'riscos' ? 'disabled' : ''}" ${ativo === x[0] ? 'aria-current="page"' : ''}>${ico(x[2])}<span class="lbl">${x[1]}</span>${x[3] || ''}</a>`)).join('');
}
function rotaBase() {
  const b = state.route.split('-')[0];
  return { demanda: 'demandas', item: 'pendencias', aplicacao: 'checklists' }[b] || b;
}
function ctxBar() {
  const f = state.filtros;
  const topAreas = AREAS.filter((a) => ['SUBEXE', 'DGAF', 'GABSEC', 'SUBICS', 'SUBINOV', 'SUBEEM', 'CODIN', 'AGERIO'].includes(a.sigla));
  const sel = (id, label, opts) => `<label class="ctx"><span>${label}</span><select data-filtro="${id}" id="f-${id}">${opts.map(([v, t]) => `<option value="${v}" ${f[id] === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
  return `<div class="ctxbar">
    ${sel('orgao', 'Órgão', [['', 'Todos os órgãos'], ...ORGAOS.map((o) => [o, o])])}
    ${sel('area', 'Área', [['', 'Todas as áreas'], ...topAreas.map((a) => [a.sigla, `${a.sigla} e subáreas`])])}
    ${sel('periodo', 'Período', [['ano', 'Exercício 2026'], ['90', 'Últimos 90 dias'], ['30', 'Últimos 30 dias']])}
    ${sel('origem', 'Origem', [['', 'Todas'], ['demanda_externa', 'Demanda externa'], ['checklist', 'Checklist']])}
    ${sel('grav', 'Gravidade', [['', 'Todas'], ['4', 'Crítica'], ['3', 'Alta'], ['2', 'Média'], ['1', 'Baixa']])}
    <span class="grow"></span>
    <button class="btn ghost sm" data-act="limpar-filtros">Limpar filtros</button>
    <button class="btn primary sm" data-act="add-widget">${ico('plus')}Adicionar widget</button>
  </div>`;
}
function shell(content) {
  const u = eu();
  const naoLidas = minhasNotifs().filter((n) => !n.lida).length;
  const base = rotaBase();
  const fixas = [['painel', 'Painel executivo'], ['inicio', 'Minha fila']];
  const abas = fixas.map(([k, t]) => `<a class="vtab ${base === k ? 'on' : ''}" href="#${k}">${t}</a>`).join('')
    + (fixas.some(([k]) => k === base) ? '' : `<a class="vtab on" href="#${state.route}">${TITULOS[state.route.split('-')[0]] || 'Visão'}</a>`)
    + `<button class="vtab add btn ghost" style="height:auto;border-radius:0" data-act="nova-visao" aria-label="Nova visão">${ico('plus')}</button>`;
  return `<div class="app">
    <aside class="sidebar" id="sidebar" aria-label="Menu principal">
      <div class="brand">${BRASAO}<span class="brand-txt">SisControle</span></div>
      <nav class="nav">${navLinks()}</nav>
      <div class="sidebar-foot"><span class="env-tag">SEDES · MAQUETE</span><a class="icon-btn" href="#login" aria-label="Sair" title="Sair">${ico('logout')}</a></div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="icon-btn menu-btn" data-act="menu" aria-label="Abrir menu">${ico('menu')}</button>
        <div class="search">${ico('search')}<input id="q" type="search" placeholder="Buscar ou ir para… (nº, SEI, assunto, área)" aria-label="Buscar" value="${esc(state.q)}"><span class="kbd">/</span></div>
        <div class="topbar-right">
          <a class="icon-btn" href="#notificacoes" aria-label="Notificações">${ico('bell')}${naoLidas ? `<span class="dot">${naoLidas}</span>` : ''}</a>
          <button class="icon-btn" data-act="ajuda" aria-label="Ajuda">${ico('help')}</button>
          <div class="avatar" title="${esc(u.nome)} — ${esc(u.cargo)}">${iniciais(u.nome)}</div>
        </div>
      </header>
      <div class="tabbar">
        <div class="vtabs">${abas}</div>
        <div class="tab-right">
          <span class="upd">Atualizado há <b>3 min</b></span>
          <select class="view-sel" id="perfil" aria-label="Ver o sistema como">${SWITCH.map((id) => `<option value="${id}" ${id === state.userId ? 'selected' : ''}>Visão: ${USER[id].nome} · ${PAPEIS[USER[id].papel]}${USER[id].papel === 'ponto_focal' || USER[id].papel === 'gestor' ? ' ' + USER[id].area : ''}</option>`).join('')}</select>
          <span class="refdate"><small>Data de referência</small>Hoje · 13/11/2026</span>
          <button class="icon-btn" data-act="refresh" aria-label="Atualizar">${ico('refresh')}</button>
        </div>
      </div>
      ${base === 'painel' ? ctxBar() : ''}
      <div class="mock-banner">Maquete com dados fictícios. As ações não gravam nada. Troque a <b>Visão</b> no alto para ver o que cada perfil enxerga.</div>
      <main class="content" id="content">${content}</main>
    </div>
  </div>`;
}
const pageHead = (title, sub, actions = '', crumbs = '') => `<div class="page-head"><div>${crumbs ? `<div class="crumbs">${crumbs}</div>` : ''}<h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;

/* =========================================================================
   TELAS
   ========================================================================= */
function tabelaItens(lista, { demanda = true, vazio = 'Nenhum item encontrado.' } = {}) {
  if (!lista.length) return `<div class="empty">${vazio}</div>`;
  return `<div class="table-wrap"><table class="t"><thead><tr><th>Item</th>${demanda ? '<th>Origem</th>' : ''}<th>Área</th><th>Status</th><th>Prazo</th><th>Gravidade</th></tr></thead><tbody>
  ${lista.map((it) => { const s = situacao(it); return `<tr class="link ${s.cls === 'vencido' ? 'row-crit' : s.cls === 'avencer' ? 'row-warn' : ''}" data-go="${linkItem(it)}" tabindex="0">
    <td class="title-cell"><b>${esc(it.titulo)}</b><small class="mono">${it.numero}</small> ${lockTag(it.restrito)}</td>
    ${demanda ? `<td>${chipOrigem(it.origem)}${it.origem === 'demanda_externa' ? ` <span class="tag-org">${DEM[it.ref].org}</span>` : ''}</td>` : ''}
    <td><b class="mono">${it.area}</b></td><td>${chipStatus(it.status)}</td><td>${prazoCell(it)}</td><td>${sev(it.grav)}</td></tr>`; }).join('')}
  </tbody></table></div>`;
}

function viewInicio() {
  const u = eu();
  const vis = itensVisiveis();
  const abertos = vis.filter((i) => !isFinal(i));
  const venc = abertos.filter((i) => situacao(i).cls === 'vencido');
  const aVencer = abertos.filter((i) => situacao(i).cls === 'avencer');
  const analise = abertos.filter((i) => ['respondida_area', 'em_analise_ascoin'].includes(i.status));
  const pend = PRORROGACOES.filter((p) => p.status === 'pendente');
  const prontasCiencia = DEMANDAS.filter((d) => podeVerDemanda(d) && statusDemanda(d) === 'consolidada' && itensDaDemanda(d.n).filter((i) => !isFinal(i)).every((i) => i.status === 'consolidada'));
  let cards = [];
  let fila = [];
  let filaTitulo = '';
  if (u.papel === 'ascoin') {
    cards = [[analise.length, 'Aguardando sua análise', 'Respostas das áreas', 'pendencias', ''], [venc.length, 'Itens vencidos', 'Prazo com a área', 'pendencias', 'crit'], [aVencer.length, 'Vencem em até 5 dias', 'Alertas D-5 e D-2 enviados', 'pendencias', 'warn'], [pend.length, 'Prorrogações a decidir', 'Pedidos das áreas', 'prorrogacoes', '']];
    fila = [...analise, ...venc, ...aVencer]; filaTitulo = 'Fila de trabalho da ASCOIN';
  } else if (u.papel === 'ponto_focal') {
    const conf = abertos.filter((i) => i.status === 'distribuida');
    const resp = abertos.filter((i) => ['em_atendimento', 'devolvida'].includes(i.status));
    cards = [[conf.length, 'Confirmar recebimento', 'Itens novos da sua área', 'pendencias', ''], [resp.length, 'Para responder', 'Em atendimento ou devolvidos', 'pendencias', ''], [venc.length, 'Vencidos', 'Escalonados ao superior', 'pendencias', 'crit'], [aVencer.length, 'Vencem em até 5 dias', '', 'pendencias', 'warn']];
    fila = [...conf, ...resp.sort((a, b) => a.prazo.localeCompare(b.prazo))]; filaTitulo = `O que a ${u.area} precisa fazer`;
  } else if (u.papel === 'gestor') {
    cards = [[u.area === 'CHEGAB' ? prontasCiencia.length : 0, 'Ciência pendente', u.area === 'CHEGAB' ? 'Respostas consolidadas' : 'Somente CHEGAB', 'demandas', ''], [venc.length, 'Vencidos na sua hierarquia', '', 'pendencias', 'crit'], [aVencer.length, 'Vencem em até 5 dias', '', 'pendencias', 'warn'], [abertos.length, 'Pendências abertas', `Visão: ${raizVisao(u)} e unidades abaixo`, 'pendencias', '']];
    fila = [...venc, ...aVencer]; filaTitulo = 'Pontos de atenção';
  } else if (u.papel === 'admin') {
    cards = [[USERS.filter((x) => x.ativo).length, 'Usuários ativos', `${USERS.filter((x) => x.troca).length} com troca de senha pendente`, 'admin', ''], [LIXEIRA.length, 'Registros na lixeira', 'Restauráveis por 30 dias', 'lixeira', ''], [TRILHA.length, 'Eventos na trilha (semana)', 'Somente inclusão', 'trilha', ''], [venc.length, 'Itens vencidos', 'Visão geral', 'pendencias', 'crit']];
    fila = [...venc, ...aVencer]; filaTitulo = 'Prazos críticos';
  } else {
    const mon = abertos.filter((i) => i.status === 'em_monitoramento');
    cards = [[mon.length, 'Em monitoramento', 'Recomendações e determinações', 'pendencias', ''], [venc.length, 'Vencidos', '', 'pendencias', 'crit'], [0, 'Trabalhos de auditoria', 'Módulo da Fase 2', 'auditoria', ''], [0, 'Achados abertos', 'Módulo da Fase 2', 'auditoria', '']];
    fila = [...mon, ...venc]; filaTitulo = 'Acompanhamento (somente leitura)';
  }
  fila = [...new Map(fila.map((i) => [i.id, i])).values()].slice(0, 8);
  const agenda = abertos.filter((i) => COM_AREA.has(i.status) && diasAte(i.prazo) >= -3 && diasAte(i.prazo) <= 10).sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 7);
  const hoje = HOJE.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return `${pageHead(`Bom dia, ${esc(u.nome.split(' ')[0])}`, `${hoje.charAt(0).toUpperCase() + hoje.slice(1)} · ${esc(u.cargo)}`, u.papel === 'ascoin' ? `<button class="btn primary" data-act="nova-demanda">${ico('plus')}Nova demanda</button>` : '')}
  ${prontasCiencia.length && u.area === 'CHEGAB' ? `<div class="callout info">${ico('stamp')}<p><b>${plural(prontasCiencia.length, 'demanda aguarda', 'demandas aguardam')} sua ciência:</b> ${prontasCiencia.map((d) => `<a href="#demanda-${d.n}">DEM-2026-${d.n}</a>`).join(', ')}.</p></div>` : ''}
  <div class="todo">${cards.map(([n, t, s, go, c]) => `<a href="#${go}" class="${c}"><span class="n">${n}</span><span class="t">${t}</span><span class="s">${s}</span></a>`).join('')}</div>
  <div class="grid g-main">
    <section class="card"><div class="card-head"><h2>${filaTitulo}</h2><a class="hint" href="#pendencias">Ver todas as pendências</a></div><div class="card-body flush">${tabelaItens(fila, { vazio: 'Nada pendente para você agora.' })}</div></section>
    <section class="card"><div class="card-head"><h2>Prazos dos próximos dias</h2><span class="hint">Dias corridos</span></div>
      <div class="agenda">${agenda.length ? agenda.map((i) => { const s = situacao(i); const dt = toDate(i.prazo); return `<a class="d" href="#${linkItem(i)}"><div class="day ${s.cls === 'vencido' ? 'crit' : s.cls === 'avencer' ? 'warn' : ''}"><b>${dt.getDate()}</b><small>${dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></div><div style="min-width:0"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(i.titulo)}</div><div class="small muted"><span class="mono">${i.area}</span> · ${s.txt}</div></div></a>`; }).join('') : '<div class="empty">Sem prazos nos próximos 10 dias.</div>'}</div>
    </section>
  </div>`;
}

function filtrarPainel(lista) {
  const f = state.filtros;
  return lista.filter((it) => {
    const dias = (HOJE - toDate(it.receb)) / DIA;
    if (f.periodo === '90' && dias > 90) return false;
    if (f.periodo === '30' && dias > 30) return false;
    if (f.orgao && (it.origem !== 'demanda_externa' || DEM[it.ref].org !== f.orgao)) return false;
    if (f.area && !descendentes(f.area).has(it.area)) return false;
    if (f.origem && it.origem !== f.origem) return false;
    if (f.grav && String(it.grav) !== f.grav) return false;
    return true;
  });
}
const orgaoDe = (it) => (it.origem === 'checklist' ? 'Checklist' : DEM[it.ref].org);
const pct = (v, t) => (t ? ((v / t) * 100).toFixed(1).replace('.', ',') : '0,0');
function widget(title, body, { cls = '', chips = [], link = '' } = {}) {
  return `<section class="card widget ${cls}"><div class="card-head"><h2>${title}</h2><div class="wicons">${link ? `<a href="#${link}" aria-label="Abrir ${esc(title)}" title="Abrir">${ico('link')}</a>` : ''}<button data-act="w-refresh" aria-label="Atualizar widget" title="Atualizar">${ico('refresh')}</button><button data-act="w-more" aria-label="Mais opções" title="Mais opções">${ico('more')}</button></div></div><div class="wbody">${chips.length ? `<div class="wchips">${chips.map((c) => `<span class="wchip">${esc(c)}</span>`).join('')}</div>` : ''}${body}</div></section>`;
}
function arco(cx, cy, r0, r1, a0, a1) {
  const p = (r, a) => `${(cx + r * Math.sin(a)).toFixed(2)},${(cy - r * Math.cos(a)).toFixed(2)}`;
  const big = a1 - a0 > Math.PI ? 1 : 0;
  if (a1 - a0 >= Math.PI * 2 - 1e-6) a1 = a0 + Math.PI * 2 - 1e-4;
  return `M${p(r1, a0)}A${r1},${r1} 0 ${big} 1 ${p(r1, a1)}L${p(r0, a1)}A${r0},${r0} 0 ${big} 0 ${p(r0, a0)}Z`;
}
function donut(outer, inner, centro) {
  const cx = 180, cy = 112;
  const tot = outer.reduce((a, s) => a + s.v, 0) || 1;
  const totI = inner.reduce((a, s) => a + s.v, 0) || 1;
  let g = ''; let a = 0;
  outer.forEach((s) => {
    if (!s.v) return;
    const da = (s.v / tot) * Math.PI * 2;
    g += `<path d="${arco(cx, cy, 62, 92, a, a + da)}" fill="${s.color}" stroke="var(--surface)" stroke-width="2" data-tip="${esc(`${s.name}|${s.v} pendências · ${pct(s.v, tot)}%`)}"/>`;
    const m = a + da / 2; const lx = cx + 104 * Math.sin(m); const ly = cy - 104 * Math.cos(m);
    g += `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="${Math.sin(m) >= 0 ? 'start' : 'end'}">${esc(s.name)}: ${pct(s.v, tot)}%</text>`;
    a += da;
  });
  a = 0;
  inner.forEach((s) => {
    if (!s.v) return;
    const da = (s.v / totI) * Math.PI * 2;
    g += `<path d="${arco(cx, cy, 36, 58, a, a + da)}" fill="${s.color}" stroke="var(--surface)" stroke-width="2" data-tip="${esc(`${s.name}|${s.v} pendências`)}"/>`;
    a += da;
  });
  g += `<text x="${cx}" y="${cy + 2}" text-anchor="middle" style="fill:var(--fg);font-size:17px;font-weight:700">${centro}</text><text x="${cx}" y="${cy + 15}" text-anchor="middle" style="font-size:8.5px">abertas</text>`;
  return `<div class="donut-wrap"><svg viewBox="0 0 360 224" role="img" aria-label="Pendências abertas por órgão (anel externo) e por situação de prazo (anel interno)">${g}</svg></div>`;
}
function treemapLayout(items, x, y, w, h, out = []) {
  if (!items.length) return out;
  if (items.length === 1) { out.push({ ...items[0], x, y, w, h }); return out; }
  const tot = items.reduce((s, i) => s + i.v, 0);
  let acc = 0; let k = 0;
  while (k < items.length - 1 && acc + items[k].v <= tot / 2) { acc += items[k].v; k++; }
  if (k === 0) { acc = items[0].v; k = 1; }
  const r = acc / tot;
  if (w >= h) { treemapLayout(items.slice(0, k), x, y, w * r, h, out); treemapLayout(items.slice(k), x + w * r, y, w * (1 - r), h, out); }
  else { treemapLayout(items.slice(0, k), x, y, w, h * r, out); treemapLayout(items.slice(k), x, y + h * r, w, h * (1 - r), out); }
  return out;
}
function gbars(grupos, series) {
  const W = 340, H = 200, pl = 26, pr = 8, pt = 14, pb = 24;
  const max = Math.max(5, Math.ceil(Math.max(...grupos.flatMap((g) => g.v)) / 5) * 5);
  const ys = (v) => pt + (1 - v / max) * (H - pt - pb);
  const gw = (W - pl - pr) / grupos.length; const bw = 14;
  let s = '';
  for (let v = 0; v <= max; v += max / 5) s += `<line x1="${pl}" x2="${W - pr}" y1="${ys(v)}" y2="${ys(v)}" class="grid-line"/><text x="${pl - 5}" y="${ys(v) + 3.5}" text-anchor="end">${v}</text>`;
  grupos.forEach((g, i) => {
    const cx = pl + gw * i + gw / 2;
    g.v.forEach((v, k) => {
      const x = cx - bw - 1 + k * (bw + 2);
      s += `<path d="M${x},${ys(0)}V${ys(v) + 3}a3,3 0 0 1 3,-3h${bw - 6}a3,3 0 0 1 3,3V${ys(0)}Z" fill="${series[k].color}" data-tip="${esc(`${g.label}|${series[k].name}: ${v}`)}"/>`;
    });
    s += `<text x="${cx}" y="${H - 7}" text-anchor="middle">${esc(g.label)}</text>`;
  });
  return `<svg class="chart gbar" viewBox="0 0 ${W} ${H}" role="img" aria-label="Demandas recebidas e encerradas por órgão">${s}</svg>`;
}
const SIT_COR = { vencido: 'var(--crit-mark)', avencer: 'var(--warn-mark)', noprazo: 'var(--ok-mark)', encerrado: '#5b6472' };
const ST_COR = { 'c-neutral': '#6b7482', 'c-info': 'var(--s1)', 'c-warn': 'var(--warn-mark)', 'c-violet': 'var(--violet)', 'c-ok': 'var(--ok-mark)', 'c-serious': 'var(--serious)', 'c-crit': 'var(--crit-mark)' };

function viewPainel() {
  const u = eu();
  const f = state.filtros;
  const base = filtrarPainel(itensVisiveis());
  const abertos = base.filter((i) => !isFinal(i));
  const venc = abertos.filter((i) => situacao(i).cls === 'vencido');
  const av = abertos.filter((i) => situacao(i).cls === 'avencer');
  const finais = base.filter((i) => isFinal(i) && i.status !== 'cancelada');
  const pctAt = finais.length ? Math.round((finais.filter((i) => i.status === 'atendida').length / finais.length) * 100) : 0;
  const resp = base.filter((i) => (stIdx(i.status) >= 4 && i.status !== 'devolvida') || isFinal(i));
  const tmr = resp.length ? (resp.reduce((a, i) => a + diasResposta(i), 0) / resp.length).toFixed(1).replace('.', ',') : '—';
  const demsVis = DEMANDAS.filter(podeVerDemanda);
  const reinc = demsVis.filter((d) => d.reinc).length;
  const chipsCtx = [f.orgao || 'Todos os órgãos', { ano: 'Exercício 2026', 90: 'Últimos 90 dias', 30: 'Últimos 30 dias' }[f.periodo]];
  const recorte = u.papel === 'ponto_focal' || (u.papel === 'gestor' && u.area !== 'CHEGAB') ? `Recorte: ${raizVisao(u)} e subáreas` : null;

  // 1. Indicadores-chave
  const tiles = [
    [abertos.length, '', 'Pendências abertas', 'pendencias', ''],
    [venc.length, '', 'Vencidas · escalonadas', 'pendencias', 'crit'],
    [av.length, '', 'A vencer em até 5 dias', 'pendencias', 'warn'],
    [pctAt, '%', 'Recomendações atendidas', 'relatorios', ''],
    [tmr, 'dias', 'Tempo médio de resposta', 'relatorios', ''],
    [reinc, `de ${demsVis.length}`, 'Demandas reincidentes', 'demandas', ''],
  ];
  const w1 = widget('Indicadores-chave', `<div class="tiles">${tiles.map(([v, sf, c, go, cl]) => `<a class="tile ${cl}" href="#${go}"><span class="big">${v}${sf ? `<small>${sf}</small>` : ''}</span><span class="cap">${c}</span></a>`).join('')}</div>`, { cls: 'w4' });

  // 2. Pendências por área
  const porArea = [...new Set(abertos.map((i) => i.area))].map((a) => { const its = abertos.filter((i) => i.area === a); return { a, n: its.length, v: its.filter((i) => situacao(i).cls === 'vencido').length }; }).sort((x, y) => y.v - x.v || y.n - x.n);
  const maxA = Math.max(1, ...porArea.map((x) => x.n));
  const w2 = widget('Pendências por área', porArea.length ? `<div class="xbars">${porArea.slice(0, 9).map((x, i) => `<div class="xbar ${i === 0 && x.v ? 'hot' : ''}"><span class="nm" title="${esc(AREA[x.a]?.nome || x.a)}">${x.a}</span><span class="tr"><span class="b" style="width:${Math.max(6, (x.n / maxA) * 78)}%" data-tip="${esc(`${x.a}|${x.n} abertas · ${x.v} vencidas`)}">${i === 0 && x.v ? `${pct(x.n, abertos.length)} %` : ''}</span>${i === 0 && x.v ? '' : `<span class="v">${pct(x.n, abertos.length)} %</span>`}</span></div>`).join('')}</div>${porArea[0]?.v ? `<p class="small muted">Em vermelho: área com mais itens vencidos (${porArea[0].v}).</p>` : ''}` : '<div class="empty">Sem pendências no recorte.</div>', { chips: recorte ? [recorte] : chipsCtx, link: 'pendencias' });

  // 3. Donut por órgão
  const cores = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
  const outer = [...ORGAOS, 'Checklist'].map((o, i) => ({ name: o, v: abertos.filter((it) => orgaoDe(it) === o).length, color: cores[i] }));
  const sits = [['vencido', 'Vencidas'], ['avencer', 'A vencer'], ['noprazo', 'No prazo'], ['encerrado', 'Com a ASCOIN / consolidação']];
  const inner = sits.map(([k, n]) => ({ name: n, v: abertos.filter((it) => situacao(it).cls === k).length, color: SIT_COR[k] }));
  const w3 = widget('Pendências por órgão', abertos.length ? `${donut(outer, inner, abertos.length)}<div class="legend-dots">${inner.map((s) => `<span><i style="background:${s.color}"></i>${s.name} ${s.v}</span>`).join('')}</div>` : '<div class="empty">Sem pendências no recorte.</div>', { chips: ['Anel externo: órgão', 'Anel interno: prazo'], link: 'demandas' });

  // 4. Conformidade
  const todas = APLICACOES.map((a) => ({ a, r: respostasAplicacao(a) }));
  const ncPrevia = todas.filter((x) => x.a.momento === 'Prévia').reduce((s, x) => s + Object.values(x.r).filter((r) => r[0] === 'nao_conforme').length, 0);
  const emPreench = APLICACOES.filter((a) => a.status !== 'assinado').length;
  const cont = { conforme: 0, nao_conforme: 0, com_ressalva: 0, nao_se_aplica: 0, pendente: 0 };
  todas.forEach((x) => { Object.values(x.r).forEach((r) => { cont[r[0]]++; }); cont.pendente += CK_ITENS.length - Object.keys(x.r).length; });
  const totC = Object.values(cont).reduce((a, b) => a + b, 0);
  const seg = (k, c) => (cont[k] ? `<i style="flex:${cont[k]};background:${c}" data-tip="${esc(`${{ conforme: 'Conforme', nao_conforme: 'Não conforme', com_ressalva: 'Com ressalva', nao_se_aplica: 'Não se aplica', pendente: 'Não avaliado' }[k]}|${cont[k]} de ${totC} itens`)}">${cont[k]}</i>` : '');
  const w4 = widget('Conformidade', `
    <div class="inner"><span class="eyebrow">Análise prévia</span><span>${ncPrevia ? `<span class="xmark">✕</span>${plural(ncPrevia, 'não conformidade', 'não conformidades')}` : '<span class="xmark okmark">✓</span>Sem não conformidades'}</span><span class="small muted">${plural(emPreench, 'aplicação em preenchimento', 'aplicações em preenchimento')}</span></div>
    <div class="inner"><span class="eyebrow">Itens avaliados</span><div class="sbar">${seg('conforme', 'var(--ok-mark)')}${seg('nao_conforme', 'var(--crit-mark)')}${seg('com_ressalva', 'var(--warn-mark)')}${seg('nao_se_aplica', '#5b6472')}${seg('pendente', 'var(--surface-3)')}</div></div>
    <div class="legend-dots"><span><i style="background:var(--ok-mark)"></i>Conforme</span><span><i style="background:var(--crit-mark)"></i>Não conforme</span><span><i style="background:var(--warn-mark)"></i>Com ressalva</span><span><i style="background:#5b6472"></i>Não se aplica</span><span><i style="background:var(--surface-3);outline:1px solid var(--line-strong)"></i>Não avaliado</span></div>`, { chips: ['Convênios · DGAF', 'Lote L-2026-04'], link: 'checklists' });

  // 5. Mapa de calor
  const tmItems = porArea.map((x) => { const its = abertos.filter((i) => i.area === x.a); const pior = its.some((i) => situacao(i).cls === 'vencido') ? 'vencido' : its.some((i) => situacao(i).cls === 'avencer') ? 'avencer' : its.some((i) => situacao(i).cls === 'noprazo') ? 'noprazo' : 'encerrado'; return { a: x.a, v: x.n, pior, nv: x.v }; }).sort((p, q) => q.v - p.v);
  const TM_COR = { vencido: '#b8322a', avencer: '#a8721a', noprazo: '#1f7a3c', encerrado: '#24563a' };
  const tm = treemapLayout(tmItems, 0, 0, 200, 100);
  const w5 = widget('Mapa de calor das áreas', tmItems.length ? `<div class="treemap" role="img" aria-label="Mapa de calor: tamanho pelo número de pendências, cor pela pior situação de prazo">${tm.map((t) => `<a class="tm" href="#pendencias" style="left:${t.x / 2}%;top:${t.y}%;width:${t.w / 2}%;height:${t.h}%;background:${TM_COR[t.pior]}" data-tip="${esc(`${t.a}|${t.v} abertas · ${t.nv} vencidas`)}">${t.w > 20 && t.h > 16 ? `<span>${t.a}${t.w > 28 && t.h > 26 ? `<small>${plural(t.v, 'aberta', 'abertas')}</small>` : ''}</span>` : ''}</a>`).join('')}</div>
    <div class="legend-dots"><span><i style="background:#b8322a"></i>Com vencidos</span><span><i style="background:#a8721a"></i>A vencer</span><span><i style="background:#1f7a3c"></i>No prazo</span><span><i style="background:#24563a"></i>Com a ASCOIN</span></div>` : '<div class="empty">Sem pendências no recorte.</div>', { chips: ['Tamanho: nº de pendências'], link: 'pendencias' });

  // 6. Escada de prazos
  const dias = [0, 1, 2, 3, 4, 5, 6].map((k) => addDias(iso(HOJE), k));
  const comArea = abertos.filter((i) => COM_AREA.has(i.status));
  const balde = (it) => { const n = diasAte(it.prazo); return n < 0 ? 'late' : n > 6 ? 'after' : `d${n}`; };
  const cols = ['late', ...dias.map((_, k) => `d${k}`), 'after'];
  const celulas = (its, lvl) => cols.map((c) => { const n = its.filter((i) => balde(i) === c).length; return `<td class="${c === 'd0' ? 'today' : ''} ${n === 0 ? 'z' : c === 'late' ? 'late' : ''}">${n}</td>`; }).join('');
  const orgs = [...new Set(comArea.map(orgaoDe))];
  const fechado = { has: (k) => !state.ladAberto.has(k) };
  let linhas = '';
  orgs.forEach((o) => {
    const its = comArea.filter((i) => orgaoDe(i) === o); const k0 = `o:${o}`;
    linhas += `<tr class="l0"><td><button class="tg" data-act="lad" data-key="${esc(k0)}" aria-label="Expandir ou recolher ${esc(o)}">${fechado.has(k0) ? '▸' : '▾'}</button>${esc(o)}</td>${celulas(its)}</tr>`;
    if (fechado.has(k0)) return;
    [...new Set(its.map((i) => i.ref))].forEach((r) => {
      const ir = its.filter((i) => i.ref === r); const k1 = `d:${r}`;
      const nome = r.startsWith('CHK') ? `CHK-2026-${r.slice(3)}` : `DEM-2026-${r}`;
      linhas += `<tr class="l1"><td><button class="tg" data-act="lad" data-key="${k1}" aria-label="Expandir ou recolher ${nome}">${fechado.has(k1) ? '▸' : '▾'}</button><a href="#${r.startsWith('CHK') ? `aplicacao-${r.slice(3)}` : `demanda-${r}`}" class="mono">${nome}</a></td>${celulas(ir)}</tr>`;
      if (!fechado.has(k1)) ir.forEach((i) => { linhas += `<tr class="l2"><td><a href="#${linkItem(i)}"><span class="mono">${i.area}</span> · /${String(i.seq).padStart(2, '0')}</a></td>${celulas([i])}</tr>`; });
    });
  });
  const w6 = widget('Escada de prazos', `<div class="ladder-tools"><span class="wchip">Itens com a área</span><span class="wchip">Dias corridos</span><span class="small muted" style="margin-left:auto">Clique nos triângulos para expandir</span></div>
    <div class="table-wrap"><table class="lad"><thead><tr><th>Referência</th><th>Vencidos</th>${dias.map((d, k) => `<th class="${k === 0 ? 'today' : ''}">${k === 0 ? 'Hoje ' : ''}${fmtCurta(d)}</th>`).join('')}<th>Após ${fmtCurta(dias[6])}</th></tr></thead><tbody>${linhas || '<tr><td colspan="10"><div class="empty">Nada com prazo correndo nas áreas.</div></td></tr>'}</tbody></table></div>`, { cls: 'w2', link: 'pendencias' });

  // 7. Status das respostas
  const catResp = (i) => (stIdx(i.status) >= 7 || isFinal(i) ? 'ok' : ['respondida_area', 'em_analise_ascoin'].includes(i.status) ? 'asc' : situacao(i).cls === 'vencido' ? 'venc' : i.status === 'devolvida' ? 'dev' : 'pend');
  const CR = { pend: ['Aguardando área', '#5b6472'], venc: ['Vencido', 'var(--crit-mark)'], dev: ['Devolvido', 'var(--warn-mark)'], asc: ['Com a ASCOIN', 'var(--s1)'], ok: ['Concluído', 'var(--ok-mark)'] };
  const blocos = [...new Set(base.map(orgaoDe))].map((o) => {
    const its = base.filter((i) => orgaoDe(i) === o);
    const c = Object.fromEntries(Object.keys(CR).map((k) => [k, its.filter((i) => catResp(i) === k).length]));
    return `<div class="inner"><div style="display:flex;justify-content:space-between;gap:8px"><span class="eyebrow">${esc(o)}</span><span class="small muted">${ico('calendar')} hoje 07:00</span></div>${c.venc ? `<span class="small" style="color:var(--crit);font-weight:600">${plural(c.venc, 'item vencido', 'itens vencidos')}</span>` : ''}<div class="sbar">${Object.keys(CR).map((k) => (c[k] ? `<i style="flex:${c[k]};background:${CR[k][1]}" data-tip="${esc(`${o} · ${CR[k][0]}|${c[k]} itens`)}">${c[k]}</i>` : '')).join('')}</div></div>`;
  }).join('');
  const w7 = widget('Status das respostas', `${blocos || '<div class="empty">Sem itens no recorte.</div>'}<div class="legend-dots">${Object.values(CR).map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div>`, { chips: chipsCtx.slice(0, 1), link: 'pendencias' });

  // 8. Comparativo por órgão (acumulado ilustrativo)
  const comp = [{ label: 'TCE-RJ', v: [24, 19] }, { label: 'CGE-RJ', v: [17, 14] }, { label: 'MPRJ', v: [6, 5] }, { label: 'ALERJ', v: [5, 5] }];
  const w8 = widget('Comparativo por órgão', `${gbars(comp, [{ name: 'Recebidas', color: 'var(--s1)' }, { name: 'Encerradas', color: 'var(--s5)' }])}<div class="legend-dots"><span><i style="background:var(--s1)"></i>Recebidas</span><span><i style="background:var(--s5)"></i>Encerradas</span><span class="muted">Acumulado 2026 · série ilustrativa</span></div>`, { chips: ['Exercício 2026'], link: 'relatorios' });

  // 9. Gravidade
  const gmax = Math.max(1, ...[4, 3, 2, 1].map((g) => abertos.filter((i) => i.grav === g).length));
  const w9 = widget('Pendências por gravidade', `<div class="xbars">${[4, 3, 2, 1].map((g) => { const its = abertos.filter((i) => i.grav === g); const v = its.filter((i) => situacao(i).cls === 'vencido').length; const a = its.filter((i) => situacao(i).cls === 'avencer').length; const o = its.length - v - a; return `<div class="xbar" style="grid-template-columns:minmax(0,70px) minmax(0,1fr)"><span class="nm" style="font-family:var(--font-text)">${GRAV[g]}</span><span class="tr"><span class="sbar" style="height:15px;width:${Math.max(3, (its.length / gmax) * 85)}%;background:transparent">${v ? `<i style="flex:${v};background:var(--crit-mark)" data-tip="${esc(`${GRAV[g]}|${v} vencidas`)}"></i>` : ''}${a ? `<i style="flex:${a};background:var(--warn-mark)" data-tip="${esc(`${GRAV[g]}|${a} a vencer`)}"></i>` : ''}${o ? `<i style="flex:${o};background:var(--s1)" data-tip="${esc(`${GRAV[g]}|${o} demais`)}"></i>` : ''}</span><span class="v">${its.length}</span></span></div>`; }).join('')}</div>
    <div class="legend-dots"><span><i style="background:var(--crit-mark)"></i>Vencidas</span><span><i style="background:var(--warn-mark)"></i>A vencer</span><span><i style="background:var(--s1)"></i>Demais</span></div>`, { cls: 'w2', chips: chipsCtx, link: 'pendencias' });

  // 10. Situação do fluxo
  const etapas = STATUS.filter((s) => !s.final);
  const emax = Math.max(1, ...etapas.map((s) => abertos.filter((i) => i.status === s.cod).length));
  const w10 = widget('Situação do fluxo', `<div class="flowlist">${etapas.map((s) => { const n = abertos.filter((i) => i.status === s.cod).length; return `<div class="flowrow"><span class="nm">${s.nome}</span><span class="tr"><i style="width:${(n / emax) * 100}%;background:${ST_COR[s.cls]}"></i></span><span class="n ${n ? '' : 'muted'}">${n}</span></div>`; }).join('')}</div>`, { cls: 'w2', chips: ['Itens abertos por status'], link: 'pendencias' });

  // 11. Itens vencidos
  const w11 = widget('Itens vencidos', tabelaItens(venc.sort((a, b) => a.prazo.localeCompare(b.prazo)), { vazio: 'Nenhum item vencido no recorte.' }), { cls: 'w4', link: 'pendencias' });

  return `<h1 class="sr-only">Painel executivo</h1>
  <div class="wgrid">${w1}${w2}${w3}${w4}${w5}${w6}${w7}${w8}${w9}${w10}${w11}
  ${widget('Riscos altos', '<div class="inner"><span class="eyebrow">Fase 2</span><span class="small sec">Entra com o módulo de Riscos e controles. Risco residual alto ou extremo sem tratamento vira pendência.</span></div>', { link: 'riscos' })}</div>`;
}

function respostasAplicacao(a) {
  if (a.respostas) return a.respostas;
  return Object.fromEntries(CK_ITENS.map((q) => [q.n, a.n === '0011' ? [q.n === 7 || q.n === 11 ? 'nao_conforme' : q.n === 8 ? 'nao_se_aplica' : 'conforme', q.n === 7 ? 'CRF vencida na data da celebração.' : q.n === 11 ? 'Cronograma de desembolso ausente.' : q.n === 8 ? 'Parecer referencial da ASSJUR.' : '', `Doc. 8120${q.n}55`] : [q.n === 4 ? 'com_ressalva' : 'conforme', q.n === 4 ? 'Metas sem indicador de resultado.' : '', `Doc. 7931${q.n}08`]]));
}

function viewDemandas() {
  const u = eu();
  const f = state.demFiltro;
  let lista = DEMANDAS.filter(podeVerDemanda);
  if (f.org) lista = lista.filter((d) => d.org === f.org);
  if (f.sit === 'abertas') lista = lista.filter((d) => statusDemanda(d) !== 'encerrada');
  if (f.sit === 'encerradas') lista = lista.filter((d) => statusDemanda(d) === 'encerrada');
  if (state.q) lista = lista.filter((d) => `${d.n} ${d.sei} ${d.assunto} ${d.doc} ${d.org}`.toLowerCase().includes(state.q.toLowerCase()));
  return `${pageHead('Demandas externas', 'Ofícios, diligências, relatórios e requisições do TCE-RJ, da CGE-RJ e de outros órgãos. Cada demanda pode ter vários itens, cada um com sua área responsável.', ['ascoin', 'admin'].includes(u.papel) ? `<button class="btn" data-go="admin" data-tab="importacao">${ico('upload')}Importar planilha</button><button class="btn primary" data-act="nova-demanda">${ico('plus')}Nova demanda</button>` : '')}
  <div class="card"><div class="card-head">
    <div class="filters">
      <label class="field"><span>Órgão</span><select id="df-org" data-demf="org"><option value="">Todos</option>${ORGAOS.map((o) => `<option ${f.org === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
      <label class="field"><span>Situação</span><select id="df-sit" data-demf="sit"><option value="">Todas</option><option value="abertas" ${f.sit === 'abertas' ? 'selected' : ''}>Em andamento</option><option value="encerradas" ${f.sit === 'encerradas' ? 'selected' : ''}>Encerradas</option></select></label>
      ${state.q ? `<span class="chip c-info plain">Busca: “${esc(state.q)}” <button class="btn ghost sm" data-act="limpar-busca" aria-label="Limpar busca">${ico('x')}</button></span>` : ''}
    </div><span class="hint">${plural(lista.length, 'demanda', 'demandas')}</span></div>
    <div class="table-wrap"><table class="t"><thead><tr><th>Demanda</th><th>Órgão</th><th>Documento · SEI</th><th>Itens</th><th>Prazo do órgão</th><th>Situação</th></tr></thead><tbody>
    ${lista.map((d) => {
      const its = itensDaDemanda(d.n);
      const done = its.filter((i) => stIdx(i.status) >= 7).length;
      const st = statusDemanda(d);
      const n = diasAte(d.prazo);
      const venc = st !== 'encerrada' && its.some((i) => situacao(i).cls === 'vencido');
      return `<tr class="link ${venc ? 'row-crit' : ''}" data-go="demanda-${d.n}" tabindex="0">
        <td class="title-cell"><b>${esc(d.assunto)}</b><small class="mono">DEM-2026-${d.n}</small> ${lockTag(d.restrito)} ${d.reinc ? '<span class="chip plain c-serious" title="Tema reincidente">Reincidente</span>' : ''}</td>
        <td>${orgTag(d.org)}<div class="small muted">${esc(d.tipo)}</div></td>
        <td><div class="small">${esc(d.doc)}</div><div class="mono small muted">${d.sei}</div></td>
        <td>${its.length ? `<div class="mini-progress"><div class="progress"><i style="width:${(done / its.length) * 100}%;background:var(--brand)"></i></div><span class="small num">${done}/${its.length}</span></div>` : '<span class="small muted">a distribuir</span>'}</td>
        <td><span class="prazo ${st === 'encerrada' ? 'encerrado' : n < 0 ? 'vencido' : n <= 5 ? 'avencer' : 'noprazo'}"><b>${fmt(d.prazo)}</b><span>${st === 'encerrada' ? 'encerrada' : n < 0 ? `${-n} dias atrás` : n === 0 ? 'hoje' : `em ${n} dias`}</span></span></td>
        <td>${chipStatus(st)}${venc ? '<div class="small" style="color:var(--crit);font-weight:600;margin-top:2px">Item vencido</div>' : ''}</td></tr>`;
    }).join('') || '<tr><td colspan="6"><div class="empty">Nenhuma demanda encontrada.</div></td></tr>'}
    </tbody></table></div></div>`;
}

const FLUXO = ['Recebida', 'Distribuída', 'Em atendimento', 'Análise ASCOIN', 'Consolidada', 'Ciência CHEGAB', 'Enviada ao órgão', 'Monitoramento', 'Encerrada'];
const passoFluxo = (s) => ({ recebida: 0, distribuida: 1, em_atendimento: 2, devolvida: 2, respondida_area: 3, em_analise_ascoin: 3, consolidada: 4, ciencia_chegab: 5, enviada_orgao: 6, em_monitoramento: 7, encerrada: 8 }[s] ?? 8);
const stepper = (idx) => `<div class="flow" role="list" aria-label="Etapas do fluxo">${FLUXO.map((n, i) => `<div class="st ${i < idx ? 'done' : i === idx ? 'cur' : ''}" role="listitem" ${i === idx ? 'aria-current="step"' : ''}><span class="b">${i < idx ? '✓' : i + 1}</span>${n}</div>`).join('')}</div>`;

function viewDemanda(n) {
  const d = DEM[n];
  if (!d || !podeVerDemanda(d)) return semAcesso();
  const u = eu();
  const its = itensDaDemanda(n);
  const visiveis = its.filter((i) => podeVerItem(i));
  const st = statusDemanda(d);
  const ativos = its.filter((i) => !isFinal(i));
  const todosConsol = ativos.length && ativos.every((i) => i.status === 'consolidada');
  const todosCiencia = ativos.length && ativos.every((i) => i.status === 'ciencia_chegab');
  const todosEnviados = ativos.length && ativos.every((i) => i.status === 'enviada_orgao');
  let acoes = '';
  if (u.papel === 'ascoin') {
    if (st !== 'encerrada') acoes += `<button class="btn" data-act="add-item" data-dem="${n}">${ico('plus')}Adicionar item</button>`;
    if (todosConsol) acoes += `<button class="btn" data-act="assinar" data-doc="Resposta consolidada DEM-2026-${n}">${ico('pen')}Assinar resposta consolidada</button>`;
    if (todosCiencia) acoes += `<button class="btn primary" data-act="enviar-orgao" data-dem="${n}">${ico('send')}Registrar envio ao órgão</button>`;
    if (todosEnviados) acoes += `<button class="btn primary" data-act="monitorar" data-dem="${n}">${ico('clock')}Iniciar monitoramento</button>`;
  }
  if (u.papel === 'gestor' && u.area === 'CHEGAB' && todosConsol) acoes += `<button class="btn primary" data-act="ciencia-chegab" data-dem="${n}">${ico('stamp')}Registrar ciência</button>`;
  const ocultos = its.length - visiveis.length;
  return `${pageHead(esc(d.assunto), '', acoes, `<a href="#demandas">Demandas externas</a> / <span class="mono">DEM-2026-${n}</span>`)}
  <div class="card"><div class="card-body">${stepper(passoFluxo(st))}</div></div>
  ${todosConsol && u.papel === 'gestor' && u.area !== 'CHEGAB' ? `<div class="callout info">${ico('info')}<p>Resposta consolidada. Aguarda ciência da CHEGAB.</p></div>` : ''}
  ${todosConsol && u.papel === 'ascoin' ? `<div class="callout info">${ico('stamp')}<p>Todos os itens foram aceitos. A resposta consolidada aguarda <b>ciência da CHEGAB</b> (decisão: ciência por demanda).</p></div>` : ''}
  ${st === 'recebida' && u.papel === 'ascoin' ? `<div class="callout warn">${ico('alert')}<p>Demanda ainda sem itens. Use <b>Adicionar item</b> para distribuir às áreas responsáveis. Cada distribuição gera alerta e pede ciência do recebimento.</p></div>` : ''}
  <div class="grid g-main">
    <section class="card"><div class="card-head"><h2>Itens e áreas responsáveis</h2><span class="hint">${plural(visiveis.length, 'item visível', 'itens visíveis')}${ocultos ? ` · ${ocultos} de outras áreas ocultos pelo seu perfil` : ''}</span></div>
      <div class="card-body flush">${tabelaItens(visiveis, { demanda: false, vazio: 'Nenhum item distribuído.' })}</div></section>
    <section class="card"><div class="card-head"><h2>Dados da demanda</h2>${chipStatus(st)}</div><div class="card-body">
      <dl class="dl">
        <div><dt>Órgão</dt><dd>${orgTag(d.org)} ${esc(d.tipo)}</dd></div>
        <div><dt>Documento</dt><dd>${esc(d.doc)}</dd></div>
        <div><dt>Processo SEI</dt><dd class="mono">${d.sei}</dd></div>
        <div><dt>Processo no órgão</dt><dd class="mono">${esc(d.procOrg)}</dd></div>
        <div><dt>Recebida em</dt><dd>${fmt(d.receb)} · ${esc(d.canal)}</dd></div>
        <div><dt>Prazo do órgão</dt><dd><b>${fmt(d.prazo)}</b></dd></div>
        <div><dt>Gravidade</dt><dd>${sev(d.grav)}</dd></div>
        <div><dt>Reincidência</dt><dd>${d.reinc ? `Sim — <span class="mono">${d.reinc}</span>` : 'Não'}</dd></div>
      </dl>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px">
        <div><div class="eyebrow">Resumo</div><p class="note" style="margin-top:4px">${esc(d.resumo)}</p></div>
        ${d.obs ? `<div><div class="eyebrow">Observações</div><p class="note" style="margin-top:4px">${esc(d.obs)}</p></div>` : ''}
      </div>
    </div></section>
  </div>`;
}

function acoesItem(it) {
  const u = eu();
  const minha = u.papel === 'ponto_focal' && descendentes(u.area).has(it.area);
  const b = [];
  if (minha) {
    if (it.status === 'distribuida') b.push(`<button class="btn primary" data-act="ciencia-area" data-id="${it.id}">${ico('checkc')}Confirmar recebimento</button>`);
    if (['em_atendimento', 'devolvida'].includes(it.status)) {
      b.push(`<button class="btn primary" data-act="responder" data-id="${it.id}">${ico('send')}Responder</button>`);
      if (!PRORROGACOES.some((p) => p.item === it.id && p.status === 'pendente')) b.push(`<button class="btn" data-act="prorrogar" data-id="${it.id}">${ico('clock')}Pedir prorrogação</button>`);
    }
    if (it.status === 'em_monitoramento') b.push(`<button class="btn primary" data-act="andamento" data-id="${it.id}">${ico('msg')}Informar andamento</button>`);
  }
  if (u.papel === 'ascoin') {
    if (it.status === 'respondida_area') b.push(`<button class="btn primary" data-act="iniciar-analise" data-id="${it.id}">${ico('eye')}Iniciar análise</button>`);
    if (it.status === 'em_analise_ascoin') { b.push(`<button class="btn primary" data-act="aceitar" data-id="${it.id}">${ico('check')}Aceitar resposta</button>`); b.push(`<button class="btn" data-act="devolver" data-id="${it.id}">${ico('undo')}Devolver</button>`); }
    if (it.status === 'em_monitoramento') b.push(`<button class="btn primary" data-act="encerrar" data-id="${it.id}">${ico('checkc')}Encerrar item</button>`);
    if (!isFinal(it)) b.push(`<button class="btn" data-act="comentar" data-id="${it.id}">${ico('msg')}Comentar</button>`);
    b.push(`<button class="btn danger" data-act="excluir" data-id="${it.id}">${ico('trash')}Excluir</button>`);
  }
  return b.join('');
}
function viewItem(id) {
  const it = ITEM[id];
  if (!it || !podeVerItem(it)) return semAcesso();
  const u = eu();
  const s = situacao(it);
  const ev = interacoes(it).sort((a, b) => b.when.localeCompare(a.when) || 0);
  const files = evidencias(it);
  const pr = PRORROGACOES.filter((p) => p.item === it.id);
  const dem = it.origem === 'demanda_externa' ? DEM[it.ref] : null;
  const minha = u.papel === 'ponto_focal' && descendentes(u.area).has(it.area);
  const crumbs = dem ? `<a href="#demandas">Demandas externas</a> / <a href="#demanda-${dem.n}" class="mono">DEM-2026-${dem.n}</a> / <span class="mono">${it.numero}</span>` : `<a href="#checklists">Checklists</a> / <a href="#aplicacao-${it.ref.slice(3)}" class="mono">CHK-2026-${it.ref.slice(3)}</a> / <span class="mono">${it.numero}</span>`;
  return `${pageHead(esc(it.titulo), '', acoesItem(it), crumbs)}
  ${s.cls === 'vencido' ? `<div class="callout crit">${ico('alert')}<p><b>${s.txt}.</b> O superior hierárquico da ${it.area} e a CHEGAB foram avisados (escalonamento).</p></div>` : ''}
  ${pr.some((p) => p.status === 'pendente') ? `<div class="callout warn">${ico('clock')}<p>Pedido de prorrogação de ${pr.find((p) => p.status === 'pendente').dias} dias aguardando decisão da ASCOIN.</p></div>` : ''}
  ${it.status === 'distribuida' && minha ? `<div class="callout info">${ico('info')}<p>Confirme o recebimento para registrar a ciência da sua área. O prazo já está correndo desde a distribuição.</p></div>` : ''}
  ${u.papel === 'auditoria' || (u.papel === 'gestor') ? `<div class="callout info">${ico('eye')}<p>Seu perfil tem acesso de leitura a este item.</p></div>` : ''}
  <div class="grid g-main">
    <div class="grid" style="align-content:start">
      <section class="card"><div class="card-head"><h2>Resumo e observações</h2>${lockTag(it.restrito)}</div><div class="card-body" style="display:flex;flex-direction:column;gap:12px">
        <div><div class="eyebrow">Resumo</div><p class="note" style="margin-top:4px">${esc(it.resumo || '—')}</p></div>
        <div><div class="eyebrow">Observações</div><p class="note" style="margin-top:4px">${esc(it.obs || 'Sem observações.')}</p></div>
      </div></section>
      <section class="card"><div class="card-head"><h2>Histórico de interações</h2><span class="hint">Registro permanente, sem edição</span></div><div class="card-body"><div class="timeline">
        ${ev.map((e) => `<div class="ev"><div class="dotc ${e.c}">${ico(e.i)}</div><div style="min-width:0"><div class="head"><b>${esc(e.t)}</b><span class="when">${fmt(e.when)} · ${esc(e.who)}</span></div>${e.txt ? `<div class="txt">${esc(e.txt)}</div>` : ''}</div></div>`).join('')}
      </div></div></section>
    </div>
    <div class="grid" style="align-content:start">
      <section class="card"><div class="card-head"><h2>Situação</h2>${chipStatus(it.status)}</div><div class="card-body"><dl class="dl">
        <div><dt>Área responsável</dt><dd><b class="mono">${it.area}</b><div class="small muted">${esc(AREA[it.area]?.nome || '')}</div></dd></div>
        <div><dt>Ponto focal</dt><dd>${esc(PONTO_FOCAL[it.area] || '—')}</dd></div>
        <div><dt>Prazo vigente</dt><dd>${prazoCell(it)}</dd></div>
        <div><dt>Prazo original</dt><dd>${fmt(it.prazoOrig)}${it.prazo !== it.prazoOrig ? ' <span class="chip plain c-info">prorrogado</span>' : ''}</dd></div>
        <div><dt>Gravidade</dt><dd>${sev(it.grav)}</dd></div>
        <div><dt>Devoluções</dt><dd class="num">${it.devol}</dd></div>
        <div><dt>Origem</dt><dd>${chipOrigem(it.origem)}${dem ? ` ${orgTag(dem.org)}` : ''}</dd></div>
        <div><dt>Processo SEI</dt><dd class="mono small">${dem ? dem.sei : (APLICACOES.find((x) => x.n === it.ref.slice(3))?.sei || '—')}</dd></div>
      </dl></div></section>
      <section class="card"><div class="card-head"><h2>Evidências</h2><span class="hint">Bucket privado · SHA-256</span></div><div class="card-body"><div class="files">
        ${files.length ? files.map((f) => `<div class="file"><span class="ext">${f.ext}</span><div style="min-width:0"><b>${esc(f.nome)}</b><small>${f.tam} · ${esc(f.por || '')} · ${f.em}</small><div class="mono small muted" title="SHA-256: ${f.hash}">SHA-256 ${f.hash.slice(0, 16)}…</div></div><button class="btn ghost sm" data-act="baixar" aria-label="Baixar ${esc(f.nome)}">${ico('download')}</button></div>`).join('') : '<p class="muted small">Nenhuma evidência anexada.</p>'}
        ${minha && ['em_atendimento', 'devolvida', 'em_monitoramento'].includes(it.status) ? `<label class="dropzone" for="up-${it.id}">${ico('paperclip')} Arraste arquivos ou clique para anexar (qualquer formato)<input type="file" id="up-${it.id}" data-act="upload" data-id="${it.id}" multiple hidden></label>` : ''}
      </div></div></section>
      ${pr.length ? `<section class="card"><div class="card-head"><h2>Prorrogações</h2></div><div class="card-body" style="display:flex;flex-direction:column;gap:10px">${pr.map((p) => `<div class="note"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b class="mono">${p.id} · +${p.dias} dias</b>${p.status === 'pendente' ? '<span class="chip c-warn">Pendente</span>' : p.status === 'aprovada' ? '<span class="chip c-ok">Aprovada</span>' : '<span class="chip c-crit">Negada</span>'}</div><p class="small" style="margin-top:4px">${esc(p.just)}</p><p class="small muted" style="margin-top:4px">Pedida por ${esc(p.por)} em ${fmt(p.em)}${p.decisao ? ` · ${esc(p.decisao)}` : ''}</p></div>`).join('')}</div></section>` : ''}
    </div>
  </div>`;
}

function viewPendencias() {
  let lista = itensVisiveis();
  if (state.q) lista = lista.filter((i) => `${i.numero} ${i.titulo} ${i.area} ${i.resumo}`.toLowerCase().includes(state.q.toLowerCase()));
  const abertos = lista.filter((i) => !isFinal(i));
  const tabs = [
    ['todas', 'Abertas', abertos],
    ['vencidas', 'Vencidas', abertos.filter((i) => situacao(i).cls === 'vencido')],
    ['avencer', 'A vencer', abertos.filter((i) => situacao(i).cls === 'avencer')],
    ['analise', 'Com a ASCOIN', abertos.filter((i) => ['respondida_area', 'em_analise_ascoin'].includes(i.status))],
    ['devolvidas', 'Devolvidas', abertos.filter((i) => i.status === 'devolvida')],
    ['encerradas', 'Encerradas', lista.filter(isFinal)],
  ];
  const atual = tabs.find((t) => t[0] === state.pendTab) || tabs[0];
  const ord = [...atual[2]].sort((a, b) => (situacao(a).n ?? 999) - (situacao(b).n ?? 999));
  const u = eu();
  return `${pageHead('Pendências', `Todos os itens do motor de acompanhamento, de qualquer origem: demandas externas, checklists e, na Fase 2, auditoria e riscos.${u.papel === 'ponto_focal' ? ` <b>Você vê apenas a ${u.area} e as unidades abaixo dela.</b>` : ''}`, `<button class="btn" data-act="exportar" data-fmt="Excel">${ico('download')}Exportar</button>`)}
  ${state.q ? `<div><span class="chip c-info plain">Busca: “${esc(state.q)}”</span> <button class="btn ghost sm" data-act="limpar-busca">Limpar busca</button></div>` : ''}
  <section class="card"><div class="tabs" role="tablist">${tabs.map((t) => `<button role="tab" aria-selected="${t[0] === atual[0]}" data-act="pend-tab" data-tab="${t[0]}">${t[1]}<span class="n">${t[2].length}</span></button>`).join('')}</div>
  ${tabelaItens(ord, { vazio: 'Nenhum item nesta visão.' })}</section>`;
}

function viewProrrogacoes() {
  const u = eu();
  const pend = PRORROGACOES.filter((p) => p.status === 'pendente');
  const hist = PRORROGACOES.filter((p) => p.status !== 'pendente');
  const linha = (p) => { const it = ITEM[p.item]; const novo = addDias(it.prazo, p.dias); return `<tr><td class="title-cell"><b><a href="#${linkItem(it)}">${esc(it.titulo)}</a></b><small class="mono">${p.id} · ${it.numero}</small></td><td><b class="mono">${it.area}</b><div class="small muted">${esc(p.por)} · ${fmt(p.em)}</div></td><td class="num">${fmt(it.prazo)} → <b>${fmt(novo)}</b><div class="small muted">+${p.dias} dias corridos</div></td><td style="max-width:320px" class="small">${esc(p.just)}</td><td>${p.status === 'pendente' ? (u.papel === 'ascoin' ? `<div class="actions"><button class="btn primary sm" data-act="decidir" data-id="${p.id}" data-v="aprovada">Aprovar</button><button class="btn sm" data-act="decidir" data-id="${p.id}" data-v="negada">Negar</button></div>` : '<span class="chip c-warn">Pendente</span>') : `${p.status === 'aprovada' ? '<span class="chip c-ok">Aprovada</span>' : '<span class="chip c-crit">Negada</span>'}<div class="small muted">${esc(p.decisao || '')}</div>`}</td></tr>`; };
  const tab = (l) => `<div class="table-wrap"><table class="t"><thead><tr><th>Item</th><th>Área · pedido</th><th>Prazo</th><th>Justificativa</th><th>Decisão</th></tr></thead><tbody>${l.map(linha).join('') || '<tr><td colspan="5"><div class="empty">Nenhum pedido.</div></td></tr>'}</tbody></table></div>`;
  return `${pageHead('Prorrogações', 'Pedidos das áreas. A regra aplicada depende do prazo original e é ajustável em Administração › Parâmetros.')}
  <div class="callout info">${ico('info')}<p>Regra padrão: até 50% do prazo original, um pedido por item. Pedidos acima do limite exigem justificativa da ASCOIN na decisão.</p></div>
  <section class="card"><div class="card-head"><h2>Aguardando decisão</h2><span class="hint">${pend.length}</span></div>${tab(pend)}</section>
  <section class="card"><div class="card-head"><h2>Decididas</h2></div>${tab(hist)}</section>`;
}

function viewChecklists() {
  const u = eu();
  const t = state.ckTab;
  const podeEditar = ['ascoin', 'admin'].includes(u.papel);
  const tabs = `<div class="tabs" role="tablist"><button role="tab" aria-selected="${t === 'aplicacoes'}" data-act="ck-tab" data-tab="aplicacoes">Aplicações<span class="n">${APLICACOES.length}</span></button><button role="tab" aria-selected="${t === 'modelos'}" data-act="ck-tab" data-tab="modelos">Modelos<span class="n">${MODELOS.length}</span></button><button role="tab" aria-selected="${t === 'lotes'}" data-act="ck-tab" data-tab="lotes">Amostragem<span class="n">1</span></button></div>`;
  let corpo = '';
  if (t === 'aplicacoes') {
    corpo = `<div class="table-wrap"><table class="t"><thead><tr><th>Aplicação</th><th>Modelo</th><th>Área</th><th>Momento</th><th>Resultado</th><th>Situação</th></tr></thead><tbody>${APLICACOES.map((a) => `<tr class="link" data-go="aplicacao-${a.n}" tabindex="0"><td class="title-cell"><b>${esc(a.objeto)}</b><small class="mono">CHK-2026-${a.n} · ${a.sei}</small></td><td class="mono small">${a.modelo}</td><td class="mono"><b>${a.area}</b></td><td>${a.momento}</td><td class="small">${a.resumo || `${Object.keys(a.respostas || {}).length}/12 respondidos`}</td><td>${a.status === 'assinado' ? `<span class="chip c-ok">Assinado</span><div class="mono small muted">${a.codigo}</div>` : '<span class="chip c-info">Em preenchimento</span>'}</td></tr>`).join('')}</tbody></table></div>`;
  } else if (t === 'modelos') {
    corpo = `<div class="card-body"><div class="models">${MODELOS.map((m) => `<article class="card model"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="ver">${m.cod} · v${m.versao}</span>${m.status === 'publicado' ? '<span class="chip c-ok">Publicado</span>' : '<span class="chip c-neutral">Rascunho</span>'}</div><h3>${esc(m.nome)}</h3><p class="small sec">Área dona: <b class="mono">${m.area}</b> · ${m.itens} itens</p><p class="small muted">${m.status === 'publicado' ? `Publicado em ${fmt(m.em)}. Versão travada; mudanças geram nova versão. ${m.uso} aplicações.` : 'Em edição. Ao publicar, a versão anterior fica obsoleta e as aplicações antigas mantêm a versão usada.'}</p><div class="actions" style="margin-top:auto">${m.status === 'publicado' ? `<button class="btn sm" data-act="ver-modelo">${ico('eye')}Ver itens</button>${podeEditar ? `<button class="btn sm" data-act="nova-versao">${ico('plus')}Nova versão</button>` : ''}` : podeEditar ? `<button class="btn sm" data-act="editar-modelo">${ico('pen')}Editar</button><button class="btn primary sm" data-act="publicar-modelo">Publicar</button>` : ''}</div></article>`).join('')}</div></div>`;
  } else {
    const l = LOTES['L-2026-04'];
    corpo = `<div class="card-body" style="display:flex;flex-direction:column;gap:14px"><div class="dl"><div><dt>Lote</dt><dd><b class="mono">L-2026-04</b> · ${l.nome}</dd></div><div><dt>Método</dt><dd>${l.metodo}</dd></div><div><dt>População</dt><dd class="num">${l.pop} convênios</dd></div><div><dt>Amostra</dt><dd class="num">${l.amostra} convênios (25%)</dd></div></div>
    <div><div class="small sec" style="margin-bottom:6px">Analisados: <b>${l.analisados}</b> de ${l.amostra}</div><div class="progress" style="height:8px"><i style="width:${(l.analisados / l.amostra) * 100}%;background:var(--brand)"></i></div></div>
    <p class="small muted">A semente fica registrada para que a seleção possa ser reproduzida em auditoria.</p></div>`;
  }
  return `${pageHead('Checklists de conformidade', 'Modelos versionados, começando pelos convênios da DGAF. Cada item não conforme vira uma pendência para a área, e o parecer final é assinado eletronicamente.', podeEditar ? `<button class="btn primary" data-act="nova-aplicacao">${ico('plus')}Nova aplicação</button>` : '')}
  <section class="card">${tabs}${corpo}</section>`;
}

function viewAplicacao(n) {
  const a = APLICACOES.find((x) => x.n === n);
  if (!a) return semAcesso();
  const u = eu();
  const editavel = a.status === 'em_preenchimento' && ['ascoin', 'admin'].includes(u.papel);
  const resp = respostasAplicacao(a);
  const cont = { conforme: 0, nao_conforme: 0, nao_se_aplica: 0, com_ressalva: 0 };
  Object.values(resp).forEach((r) => { cont[r[0]]++; });
  const total = CK_ITENS.length;
  const feitos = Object.keys(resp).length;
  const secoes = [...new Set(CK_ITENS.map((q) => q.secao))];
  const opts = [['conforme', 'Conforme'], ['nao_conforme', 'Não conforme'], ['com_ressalva', 'Com ressalva'], ['nao_se_aplica', 'Não se aplica']];
  const corpo = secoes.map((s) => { const qs = CK_ITENS.filter((q) => q.secao === s); return `<div class="ck-sec"><span>${s}</span><span class="small muted num">${qs.filter((q) => resp[q.n]).length}/${qs.length}</span></div>${qs.map((q) => { const r = resp[q.n]; const v = r ? r[0] : ''; return `<div class="ck-item"><span class="q-n">${String(q.n).padStart(2, '0')}</span><div style="min-width:0"><div class="q">${esc(q.q)}</div><div class="law">${esc(q.lei)}</div>
    <div class="ans"><div class="seg answers" role="group" aria-label="Resposta do item ${q.n}">${opts.map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${v === k}" ${editavel ? `data-act="responder-ck" data-q="${q.n}"` : 'disabled'}>${t}</button>`).join('')}</div></div>
    ${v && v !== 'conforme' || editavel ? `<div class="just"><label class="field"><span>Justificativa${v && v !== 'conforme' ? ' (obrigatória)' : ''}</span><input id="j-${n}-${q.n}" value="${esc(r ? r[1] : '')}" ${editavel ? '' : 'readonly'} placeholder="${v === 'conforme' ? 'Opcional' : 'Descreva a situação encontrada'}"></label><label class="field"><span>Referência SEI</span><input id="s-${n}-${q.n}" class="mono" value="${esc(r ? r[2] : '')}" ${editavel ? '' : 'readonly'} placeholder="Doc. nº"></label></div>` : ''}
    ${v === 'nao_conforme' ? `<div class="gen chip plain c-crit">${a.status === 'assinado' ? `Gerou a pendência <a href="#item-CHK${n}-${String(q.n).padStart(2, '0')}" class="mono">CHK-2026-${n}/${String(q.n).padStart(2, '0')}</a> para ${a.area}` : `Vai gerar pendência para ${a.area} ao finalizar`}</div>` : ''}
  </div></div>`; }).join('')}`; }).join('');
  const segBar = (k, c) => cont[k] ? `<i style="width:${(cont[k] / total) * 100}%;background:${c}" data-tip="${esc(`${k.replace(/_/g, ' ')}: ${cont[k]}`)}"></i>` : '';
  return `${pageHead(esc(a.objeto), `Modelo ${a.modelo} · ${a.momento} · responsável: ${esc(a.resp)}`, editavel ? `<button class="btn" data-act="salvar-ck">Salvar rascunho</button><button class="btn primary" data-act="finalizar-ck" data-n="${n}" ${feitos < total ? 'title="Responda todos os itens para finalizar"' : ''}>${ico('pen')}Finalizar e assinar parecer</button>` : a.status === 'assinado' ? `<a class="btn" href="#verificar">${ico('shield')}Verificar assinatura</a>` : '', `<a href="#checklists">Checklists</a> / <span class="mono">CHK-2026-${n}</span>`)}
  <div class="grid g-main">
    <section class="card"><div class="card-head"><h2>Itens do checklist</h2><span class="hint num">${feitos}/${total} respondidos</span></div>${corpo}</section>
    <div class="grid" style="align-content:start">
      <section class="card"><div class="card-head"><h2>Resultado parcial</h2></div><div class="card-body" style="display:flex;flex-direction:column;gap:12px">
        <div class="progress" style="height:12px">${segBar('conforme', 'var(--ok-mark)')}${segBar('com_ressalva', 'var(--warn-mark)')}${segBar('nao_conforme', 'var(--crit-mark)')}${segBar('nao_se_aplica', 'var(--line-strong)')}</div>
        <div class="legend"><span><i style="background:var(--ok-mark)"></i>Conforme ${cont.conforme}</span><span><i style="background:var(--warn-mark)"></i>Com ressalva ${cont.com_ressalva}</span><span><i style="background:var(--crit-mark)"></i>Não conforme ${cont.nao_conforme}</span><span><i style="background:var(--line-strong)"></i>Não se aplica ${cont.nao_se_aplica}</span></div>
      </div></section>
      <section class="card"><div class="card-head"><h2>Dados da aplicação</h2>${a.status === 'assinado' ? '<span class="chip c-ok">Assinado</span>' : '<span class="chip c-info">Em preenchimento</span>'}</div><div class="card-body"><dl class="dl">
        <div><dt>Processo SEI</dt><dd class="mono small">${a.sei}</dd></div><div><dt>Área analisada</dt><dd class="mono"><b>${a.area}</b></dd></div>
        <div><dt>Início</dt><dd>${fmt(a.inicio)}</dd></div><div><dt>Amostragem</dt><dd>${a.lote !== '—' ? `<span class="mono">${a.lote}</span> · 12 de 48` : 'Não'}</dd></div>
        ${a.codigo ? `<div style="grid-column:1/-1"><dt>Código de verificação</dt><dd class="code-big">${a.codigo}</dd></div>` : ''}
      </dl></div></section>
    </div>
  </div>`;
}

function viewRelatorios() {
  const tipos = [['pendencias', 'Pendências por área', 'Abertas, vencidas e a vencer'], ['orgao', 'Demandas por órgão', 'Recebidas, em andamento e encerradas'], ['vencidos', 'Prazos vencidos', 'Itens com atraso e escalonamentos'], ['devolucoes', 'Devoluções por área', 'Qualidade das respostas'], ['reincidencia', 'Reincidência', 'Temas repetidos por órgão'], ['historico', 'Histórico de item', 'Linha do tempo completa para anexar ao SEI']];
  const t = state.relTipo;
  const vis = itensVisiveis();
  let prev = '';
  if (t === 'orgao') {
    prev = `<table class="t"><thead><tr><th>Órgão</th><th class="r">Demandas</th><th class="r">Em andamento</th><th class="r">Encerradas</th><th class="r">Itens vencidos</th></tr></thead><tbody>${ORGAOS.map((o) => { const ds = DEMANDAS.filter((d) => d.org === o && podeVerDemanda(d)); return `<tr><td>${orgTag(o)}</td><td class="r num">${ds.length}</td><td class="r num">${ds.filter((d) => statusDemanda(d) !== 'encerrada').length}</td><td class="r num">${ds.filter((d) => statusDemanda(d) === 'encerrada').length}</td><td class="r num">${vis.filter((i) => i.origem === 'demanda_externa' && DEM[i.ref].org === o && situacao(i).cls === 'vencido').length}</td></tr>`; }).join('')}</tbody></table>`;
  } else if (t === 'vencidos') {
    prev = tabelaItens(vis.filter((i) => situacao(i).cls === 'vencido'));
  } else if (t === 'devolucoes') {
    const as = [...new Set(vis.filter((i) => i.devol).map((i) => i.area))];
    prev = `<table class="t"><thead><tr><th>Área</th><th class="r">Itens respondidos</th><th class="r">Devoluções</th><th class="r">Taxa</th></tr></thead><tbody>${as.map((a) => { const its = vis.filter((i) => i.area === a); const r = its.filter((i) => stIdx(i.status) >= 4 || i.devol || isFinal(i)).length; const dv = its.reduce((x, i) => x + i.devol, 0); return `<tr><td class="mono"><b>${a}</b></td><td class="r num">${r}</td><td class="r num">${dv}</td><td class="r num">${r ? Math.round((dv / r) * 100) : 0}%</td></tr>`; }).join('')}</tbody></table>`;
  } else if (t === 'reincidencia') {
    prev = `<table class="t"><thead><tr><th>Demanda</th><th>Órgão</th><th>Tema anterior</th></tr></thead><tbody>${DEMANDAS.filter((d) => d.reinc && podeVerDemanda(d)).map((d) => `<tr><td class="title-cell"><b>${esc(d.assunto)}</b><small class="mono">DEM-2026-${d.n}</small></td><td>${orgTag(d.org)}</td><td class="mono">${d.reinc}</td></tr>`).join('')}</tbody></table>`;
  } else if (t === 'historico') {
    prev = `<div class="card-body"><p class="sec">Escolha um item na lista de pendências e use <b>Exportar histórico</b>. O PDF sai com cabeçalho institucional, linha do tempo, evidências com hash e código de verificação.</p></div>`;
  } else {
    const as = [...new Set(vis.filter((i) => !isFinal(i)).map((i) => i.area))].sort();
    prev = `<table class="t"><thead><tr><th>Área</th><th class="r">Abertas</th><th class="r">Vencidas</th><th class="r">A vencer (5 dias)</th><th class="r">Com a ASCOIN</th></tr></thead><tbody>${as.map((a) => { const its = vis.filter((i) => i.area === a && !isFinal(i)); const c = (k) => its.filter((i) => situacao(i).cls === k).length; return `<tr><td class="mono"><b>${a}</b></td><td class="r num">${its.length}</td><td class="r num" ${c('vencido') ? 'style="color:var(--crit);font-weight:700"' : ''}>${c('vencido')}</td><td class="r num">${c('avencer')}</td><td class="r num">${c('encerrado')}</td></tr>`; }).join('')}</tbody></table>`;
  }
  const atual = tipos.find((x) => x[0] === t);
  return `${pageHead('Relatórios', 'Relatórios gerenciais com filtros por período, área, origem, órgão, gravidade, status e responsável. Saída em PDF com identidade do Governo do RJ ou em Excel.')}
  <div class="grid" style="grid-template-columns:minmax(0,280px) minmax(0,1fr)" id="rel-grid">
    <section class="card"><div class="card-head"><h2>Modelos</h2></div><div style="display:flex;flex-direction:column;padding:6px">${tipos.map(([k, n, d]) => `<button class="btn ghost" style="height:auto;padding:10px 12px;justify-content:flex-start;text-align:left;white-space:normal;${k === t ? 'background:var(--brand-soft);color:var(--brand)' : ''}" data-act="rel-tipo" data-tab="${k}"><span><b style="display:block">${n}</b><span class="small muted">${d}</span></span></button>`).join('')}</div></section>
    <section class="card" style="min-width:0"><div class="card-head"><div><h2>${atual[1]}</h2><span class="hint">Pré-visualização · referência 13/11/2026</span></div><div class="actions"><button class="btn" data-act="exportar" data-fmt="PDF">${ico('file')}Gerar PDF</button><button class="btn" data-act="exportar" data-fmt="Excel">${ico('download')}Excel</button></div></div>
      <div class="card-body"><div class="filters">
        <label class="field"><span>De</span><input type="date" id="r-de" value="2026-01-01"></label>
        <label class="field"><span>Até</span><input type="date" id="r-ate" value="2026-11-13"></label>
        <label class="field"><span>Órgão</span><select id="r-org"><option>Todos</option>${ORGAOS.map((o) => `<option>${o}</option>`).join('')}</select></label>
        <label class="field"><span>Status</span><select id="r-st"><option>Todos</option>${STATUS.map((s) => `<option>${s.nome}</option>`).join('')}</select></label>
        <label class="field"><span>Responsável</span><select id="r-resp"><option>Todos</option>${Object.entries(PONTO_FOCAL).map(([a, n]) => `<option>${n} (${a})</option>`).join('')}</select></label>
      </div></div>
      <div class="table-wrap">${prev}</div></section>
  </div>`;
}

function minhasNotifs() { const u = eu(); return NOTIFS.filter((n) => n.para.includes(u.papel)).filter((n) => !n.item || (ITEM[n.item] && podeVerItem(ITEM[n.item]))); }
function viewNotificacoes() {
  const ns = minhasNotifs();
  const icone = { atraso: ['alert', 'c-crit'], escalonamento: ['up', 'c-crit'], d2: ['clock', 'c-warn'], vencimento: ['calendar', 'c-warn'], resposta: ['msg', 'c-info'], ciencia: ['stamp', 'c-violet'], prorrogacao: ['clock', 'c-info'], distribuicao: ['send', 'c-info'], sistema: ['gear', 'c-neutral'] };
  return `${pageHead('Notificações', 'Alertas no sistema. Os mesmos avisos seguem por e-mail quando o envio estiver configurado (por enquanto, apenas no sistema).', `<button class="btn" data-act="ler-todas">${ico('check')}Marcar todas como lidas</button>`)}
  <section class="card">${ns.length ? ns.map((n) => { const [i, c] = icone[n.tipo]; const link = n.item ? `#item-${n.item}` : n.dem ? `#demanda-${n.dem}` : ''; return `<div class="notif ${n.lida ? '' : 'unread'}"><div class="ev" style="padding:0"><div class="dotc ${c}">${ico(i)}</div></div><div style="min-width:0"><div style="font-weight:${n.lida ? 500 : 650}">${esc(n.txt)}</div><div class="small muted">${n.quando.split(' ')[0].split('-').reverse().join('/')} às ${n.quando.split(' ')[1]}</div></div>${link ? `<a class="btn sm" href="${link}">Abrir</a>` : ''}</div>`; }).join('') : '<div class="empty">Nenhuma notificação.</div>'}</section>
  <div class="callout info">${ico('info')}<p>Regras de alerta: na distribuição (com ciência do recebimento), em D-5, D-2, no vencimento e em atraso. Em atraso, o superior hierárquico da área e a CHEGAB recebem o escalonamento.</p></div>`;
}

function viewLixeira() {
  return `${pageHead('Lixeira', 'Registros excluídos pela interface. Nada é apagado fisicamente: o registro e a trilha ficam para sempre. Após 30 dias corridos, a rotina noturna remove apenas os arquivos do Storage.')}
  <section class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Registro</th><th>Excluído por</th><th>Justificativa</th><th>Restaurável até</th><th></th></tr></thead><tbody>
  ${LIXEIRA.map((l) => { const ate = addDias(l.em.split(' ')[0], 30); const n = diasAte(ate); return `<tr><td class="title-cell"><b>${esc(l.ref)}</b><small>${l.tipo} · <span class="mono">${l.id}</span></small></td><td>${esc(l.por)}<div class="small muted"><span class="mono">${l.login}</span> · ${fmt(l.em.split(' ')[0])} ${l.em.split(' ')[1]}</div></td><td class="small" style="max-width:300px">${esc(l.motivo)}</td><td><span class="prazo ${n <= 5 ? 'avencer' : 'noprazo'}"><b>${fmt(ate)}</b><span>${plural(n, 'dia', 'dias')}</span></span></td><td><button class="btn sm" data-act="restaurar" data-id="${l.id}">${ico('undo')}Restaurar</button></td></tr>`; }).join('') || '<tr><td colspan="5"><div class="empty">A lixeira está vazia.</div></td></tr>'}
  </tbody></table></div></section>`;
}

function viewTrilha() {
  const u = eu();
  const linhas = TRILHA.filter((t) => u.papel !== 'auditoria' || t.tabela.startsWith('trabalhos'));
  return `${pageHead('Trilha de auditoria', 'Toda inclusão, alteração e exclusão nas tabelas de negócio, gravada por trigger. A tabela aceita apenas inclusão: nenhum perfil pode alterar ou apagar registros.')}
  ${u.papel === 'auditoria' ? `<div class="callout info">${ico('lock')}<p>O perfil Auditoria vê apenas a trilha das tabelas de auditoria (Fase 2). A ASCOIN não vê a trilha dos trabalhos restritos.</p></div>` : ''}
  <section class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Data e hora</th><th>Usuário</th><th>Tabela · registro</th><th>Ação</th><th>Alteração</th></tr></thead><tbody>
  ${linhas.map((t) => `<tr><td class="mono small num">${t.em.split(' ')[0].split('-').reverse().join('/')} ${t.em.split(' ')[1]}</td><td class="mono">${t.user}</td><td><span class="mono small">${t.tabela}</span><div class="small"><b>${esc(t.reg)}</b></div></td><td><span class="chip plain ${t.acao === 'INSERT' ? 'c-ok' : t.acao === 'UPDATE' ? 'c-info' : 'c-warn'}">${t.acao}</span></td><td style="min-width:260px">${t.antes ? `<pre class="json"><span class="diff-del">- ${esc(JSON.stringify(t.antes))}</span>\n<span class="diff-add">+ ${esc(JSON.stringify(t.depois))}</span></pre>` : `<pre class="json"><span class="diff-add">+ ${esc(JSON.stringify(t.depois))}</span></pre>`}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">Nenhum evento visível para o seu perfil.</div></td></tr>'}
  </tbody></table></div></section>`;
}

function arvore(pai) {
  const filhos = AREAS.filter((a) => a.pai === pai);
  if (!filhos.length) return '';
  return `<ul>${filhos.map((a) => `<li><span class="node"><span class="sig">${a.sigla}</span>${esc(a.nome)} <span class="tp">${a.tipo}</span></span>${arvore(a.sigla)}</li>`).join('')}</ul>`;
}
function viewAdmin() {
  const t = state.admTab;
  const tabs = [['usuarios', 'Usuários'], ['areas', 'Áreas'], ['status', 'Status e fluxo'], ['parametros', 'Parâmetros'], ['importacao', 'Importação']];
  let corpo = '';
  if (t === 'usuarios') {
    corpo = `<div class="table-wrap"><table class="t"><thead><tr><th>Nome</th><th>Papel</th><th>Área</th><th>Situação</th><th></th></tr></thead><tbody>${USERS.map((u) => `<tr><td><div style="display:flex;gap:10px;align-items:center"><div class="avatar">${iniciais(u.nome)}</div><div><b>${esc(u.nome)}</b><div class="small muted">${u.email}</div></div></div></td><td>${PAPEIS[u.papel]}${u.restrito ? ' <span class="lock">' + ico('lock') + 'restritos</span>' : ''}</td><td class="mono"><b>${u.area}</b></td><td>${u.troca ? '<span class="chip c-warn">Troca de senha pendente</span>' : '<span class="chip c-ok">Ativo</span>'}</td><td><button class="btn sm" data-act="editar-usuario">${ico('pen')}Editar</button></td></tr>`).join('')}</tbody></table></div>
    <div class="card-body"><div class="callout info">${ico('info')}<p>Os usuários são criados pelo administrador direto no banco, com o script <span class="kbd">criar_usuario.sql</span>. Todo usuário novo entra com <b>troca de senha obrigatória</b> no primeiro acesso. Usuários de TCE e CGE nunca têm acesso.</p></div></div>`;
  } else if (t === 'areas') {
    corpo = `<div class="card-body"><p class="small muted" style="margin-bottom:12px">Organograma do Art. 2º do Regimento Interno (seed editável em <span class="kbd">seed_areas.sql</span>). Um gestor enxerga a sua unidade e todas as que estão abaixo dela.</p><div class="tree"><span class="node"><span class="sig">SEDES</span>${AREA.SEDES.nome} <span class="tp">secretaria</span></span>${arvore('SEDES')}</div></div>`;
  } else if (t === 'status') {
    corpo = `<div class="table-wrap"><table class="t"><thead><tr><th class="r">Ordem</th><th>Código</th><th>Nome exibido</th><th>Final?</th><th>Quem pode levar a este status</th></tr></thead><tbody>${STATUS.map((s) => `<tr><td class="r num">${s.ordem}</td><td class="mono small">${s.cod}</td><td>${chipStatus(s.cod)}</td><td>${s.final ? 'Sim' : '—'}</td><td class="small">${{ recebida: 'ASCOIN', distribuida: 'ASCOIN', em_atendimento: 'Ponto focal (ciência)', respondida_area: 'Ponto focal', em_analise_ascoin: 'ASCOIN', devolvida: 'ASCOIN', consolidada: 'ASCOIN', ciencia_chegab: 'Gestor da CHEGAB', enviada_orgao: 'ASCOIN', em_monitoramento: 'ASCOIN', atendida: 'ASCOIN', parcialmente_atendida: 'ASCOIN', nao_atendida: 'ASCOIN', cancelada: 'ASCOIN ou Administrador' }[s.cod]}</td></tr>`).join('')}</tbody></table></div><div class="card-body"><p class="small muted">Conjunto proposto, a validar com a ASCOIN. Nome, cor, ordem e transições são editáveis; um trigger no banco rejeita transições não cadastradas.</p></div>`;
  } else if (t === 'parametros') {
    corpo = `<div class="card-body" style="display:flex;flex-direction:column;gap:20px">
      <div class="form-grid">
        <label class="field"><span>Dias de alerta antes do vencimento</span><input id="p-alerta" value="5, 2, 0"><span class="help">Dias corridos. 0 = no dia do vencimento.</span></label>
        <label class="field"><span>Horário da rotina de alertas</span><input id="p-hora" type="time" value="07:00"><span class="help">Executada pelo pg_cron no banco.</span></label>
        <label class="field"><span>Dias para restaurar da lixeira</span><input id="p-lix" type="number" value="30"></label>
        <label class="field"><span>Envio de e-mail</span><select id="p-email"><option>Desativado (somente no sistema)</option><option>SMTP institucional</option></select><span class="help">Decisão atual: alertas apenas no sistema.</span></label>
      </div>
      <div><h3 style="margin-bottom:8px">Regras de prorrogação</h3><div class="table-wrap"><table class="t"><thead><tr><th>Prazo original</th><th>Prorrogação máxima</th><th>Pedidos por item</th></tr></thead><tbody><tr><td>Até 15 dias</td><td>50% do prazo</td><td>1</td></tr><tr><td>16 a 30 dias</td><td>50% do prazo</td><td>1</td></tr><tr><td>Acima de 30 dias</td><td>50% do prazo</td><td>1</td></tr></tbody></table></div><p class="small muted" style="margin-top:6px">Padrão inicial; cada faixa pode ter sua própria regra.</p></div>
      <div class="actions"><button class="btn primary" data-act="salvar-param">Salvar parâmetros</button></div></div>`;
  } else {
    corpo = `<div class="card-body" style="display:flex;flex-direction:column;gap:16px">${stepperImport()}
      <div class="callout warn">${ico('alert')}<p><b>Aguardando a planilha base da ASCOIN.</b> O mapeamento de colunas será montado a partir do arquivo real. Nenhuma coluna será inventada.</p></div>
      <label class="dropzone" for="imp-file" style="padding:28px">${ico('upload')}<br>Arraste a planilha (CSV ou XLSX) ou clique para escolher<input type="file" id="imp-file" accept=".csv,.xlsx" data-act="importar" hidden></label>
      <p class="small muted">Etapas: leitura do arquivo, mapeamento de colunas, validação linha a linha (datas, órgão, área, SEI), pré-visualização com erros destacados e gravação em lote com registro na trilha.</p></div>`;
  }
  return `${pageHead('Administração', 'Cadastros e parâmetros do sistema. Acesso exclusivo do administrador.')}
  <section class="card"><div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button role="tab" aria-selected="${k === t}" data-act="adm-tab" data-tab="${k}">${n}</button>`).join('')}</div>${corpo}</section>`;
}
const stepperImport = () => `<div class="flow">${['Enviar arquivo', 'Mapear colunas', 'Validar', 'Pré-visualizar', 'Gravar'].map((n, i) => `<div class="st ${i === 0 ? 'cur' : ''}"><span class="b">${i + 1}</span>${n}</div>`).join('')}</div>`;

function viewAuditoria() {
  return `${pageHead('Auditoria interna', 'Fase 2. As tabelas já nascem no banco do MVP para evitar retrabalho.')}
  <div class="callout info">${ico('lock')}<p>Trabalhos em andamento ficam <b>restritos à equipe de auditoria</b> (Art. 11, §1º). Nem o administrador nem a ASCOIN os enxergam.</p></div>
  <div class="grid g-2">
    <section class="card"><div class="card-head"><h2>Estrutura proposta do achado</h2><span class="hint">Base: Manual de Auditoria da CGE</span></div><div class="table-wrap"><table class="t"><tbody>
      <tr><td><b>Critério</b></td><td class="sec">O que deveria ser: norma, contrato, boa prática</td></tr>
      <tr><td><b>Condição</b></td><td class="sec">O que foi encontrado, com fatos e números</td></tr>
      <tr><td><b>Causa</b></td><td class="sec">Por que a diferença aconteceu</td></tr>
      <tr><td><b>Efeito</b></td><td class="sec">Consequência real ou potencial (risco, dano, ineficiência)</td></tr>
      <tr><td><b>Evidência</b></td><td class="sec">Papéis de trabalho e anexos que sustentam o achado</td></tr>
      <tr><td><b>Manifestação do auditado</b></td><td class="sec">Resposta da área ao relatório preliminar</td></tr>
      <tr><td><b>Recomendação</b></td><td class="sec">Vira item de acompanhamento com prazo e área</td></tr>
    </tbody></table></div></section>
    <section class="card"><div class="card-head"><h2>Etapas de um trabalho</h2></div><div class="card-body">${['Planejamento', 'Execução e papéis de trabalho', 'Relatório preliminar', 'Manifestação do auditado', 'Relatório final', 'Monitoramento das recomendações'].map((s, i) => `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span class="mono muted">${String(i + 1).padStart(2, '0')}</span><span>${s}</span></div>`).join('')}</div></section>
  </div>`;
}
function viewRiscos() {
  const cont = { '5-4': 1, '4-4': 2, '4-3': 1, '3-4': 1, '3-3': 3, '2-3': 2, '3-2': 2, '2-2': 4, '1-2': 2, '2-1': 1 };
  const nivel = (p, i) => p * i;
  const cor = (n) => (n >= 15 ? 'var(--crit-mark)' : n >= 8 ? 'var(--serious)' : n >= 4 ? 'var(--warn-mark)' : 'var(--ok-mark)');
  let g = '';
  for (let p = 5; p >= 1; p--) { g += `<div class="ax">${p}</div>`; for (let i = 1; i <= 5; i++) { const c = cont[`${p}-${i}`] || ''; g += `<div class="cell" style="background:${cor(nivel(p, i))};opacity:${c ? 1 : .35}" data-tip="${esc(`Probabilidade ${p} × Impacto ${i} = ${nivel(p, i)}|${c || 0} risco(s)`)}">${c}</div>`; } }
  g += '<div></div>' + [1, 2, 3, 4, 5].map((i) => `<div class="ax">${i}</div>`).join('');
  return `${pageHead('Riscos e controles', 'Fase 2. Metodologia sugerida com base na ISO 31000 e no COSO, a validar quando a política de riscos for aprovada.')}
  <div class="grid g-2">
    <section class="card"><div class="card-head"><h2>Mapa de calor — risco residual</h2><span class="hint">Exemplo ilustrativo</span></div><div class="card-body"><div class="heat" role="img" aria-label="Mapa de calor 5 por 5 de probabilidade e impacto">${g}</div>
      <p class="small muted" style="margin-top:8px">Linhas: probabilidade (1–5). Colunas: impacto (1–5).</p>
      <div class="legend" style="margin-top:8px"><span><i style="background:var(--ok-mark)"></i>Baixo 1–3</span><span><i style="background:var(--warn-mark)"></i>Médio 4–6</span><span><i style="background:var(--serious)"></i>Alto 8–12</span><span><i style="background:var(--crit-mark)"></i>Extremo 15–25</span></div></div></section>
    <section class="card"><div class="card-head"><h2>Como entra no motor</h2></div><div class="card-body" style="display:flex;flex-direction:column;gap:10px">
      <p class="sec">Cada risco é avaliado no nível inerente e, depois dos controles, no residual. Risco residual <b>alto ou extremo</b> sem plano de tratamento gera automaticamente um item de acompanhamento para a área dona do processo.</p>
      <p class="sec">Categorias sugeridas: estratégico, operacional, conformidade, orçamentário-financeiro, integridade e imagem. Faixas, escala e categorias ficam em tabela.</p></div></section>
  </div>`;
}

function semAcesso() {
  return `<div class="card"><div class="empty"><h2 style="margin-bottom:6px">Sem acesso a este registro</h2><p>O seu perfil não tem permissão para ver este conteúdo (regra de acesso por área ou registro restrito).</p><p style="margin-top:12px"><a class="btn" href="#inicio">Voltar ao início</a></p></div></div>`;
}

/* ---------- Telas públicas ---------- */
function viewLogin() {
  return `<div class="public"><form class="public-card" data-form="login" novalidate>
    <div class="public-brand">${BRASAO}<div><div class="eyebrow">Governo do Estado do Rio de Janeiro</div><h1 style="font-size:1.25rem">SisControle SEDES</h1><p class="small muted">Controle Interno e Auditoria</p></div></div>
    <label class="field"><span>E-mail institucional</span><input id="l-email" type="email" autocomplete="username" value="${esc(eu().email)}" required></label>
    <label class="field"><span>Senha</span><input id="l-senha" type="password" autocomplete="current-password" value="••••••••••" required></label>
    <button class="btn primary" type="submit" style="justify-content:center;height:40px">Entrar</button>
    <a href="#login" class="small" data-act="esqueci" style="text-align:center">Esqueci a senha</a>
    <p class="small muted" style="text-align:center">Acesso restrito a servidores da SEDES. Órgãos externos não têm acesso.</p>
  </form></div>`;
}
function viewPrimeiroAcesso() {
  return `<div class="public"><form class="public-card" data-form="troca" novalidate>
    <div class="public-brand">${BRASAO}<div><div class="eyebrow">Primeiro acesso</div><h1 style="font-size:1.25rem">Crie a sua senha</h1></div></div>
    <p class="sec small">A senha provisória foi definida pelo administrador. Para continuar, crie uma senha pessoal.</p>
    <label class="field"><span>Nova senha</span><input id="t-1" type="password" autocomplete="new-password" required minlength="10"><span class="help">Mínimo de 10 caracteres, com letras e números.</span></label>
    <label class="field"><span>Repita a nova senha</span><input id="t-2" type="password" autocomplete="new-password" required></label>
    <p class="small" id="t-erro" style="color:var(--crit)" hidden></p>
    <button class="btn primary" type="submit" style="justify-content:center;height:40px">Salvar e entrar</button>
  </form></div>`;
}
function viewVerificar() {
  const cod = state.verificar || ASSINATURAS[0].codigo;
  const a = ASSINATURAS.find((x) => x.codigo === cod.trim().toUpperCase());
  return `<div class="public"><div class="public-card wide">
    <div class="public-brand">${BRASAO}<div><div class="eyebrow">Governo do Estado do Rio de Janeiro · SEDES</div><h1 style="font-size:1.2rem">Verificação de documento</h1></div></div>
    <form class="filters" data-form="verificar" novalidate><label class="field" style="flex:1"><span>Código de verificação</span><input id="v-cod" class="mono" value="${esc(cod)}" placeholder="SEDES-XXXX-XXXX-XXXX"></label><button class="btn primary" type="submit">Verificar</button></form>
    ${a ? `<div class="verify-ok">${ico('checkc')}<div><b>Documento autêntico</b><div class="small">Assinatura eletrônica simples (Lei 14.063/2020)</div></div></div>
    <dl class="dl"><div><dt>Documento</dt><dd>${esc(a.tipo)}</dd></div><div><dt>Assinado em</dt><dd>${a.em.split(' ')[0].split('-').reverse().join('/')} às ${a.em.split(' ')[1]}</dd></div><div><dt>Signatário</dt><dd>${esc(a.nome)}<div class="small muted">${esc(a.cargo)}</div></dd></div><div><dt>Hash SHA-256</dt><dd class="mono small">${a.hash.slice(0, 32)}…</dd></div></dl>
    <label class="dropzone" for="v-file">${ico('upload')} Para conferir a integridade, solte aqui o PDF que você recebeu. O arquivo não sai do seu computador.<input id="v-file" type="file" accept="application/pdf" data-act="conferir-pdf" hidden></label>
    <p class="small" id="v-res"></p>` : `<div class="callout crit">${ico('alert')}<p>Código não encontrado. Confira os caracteres e tente de novo.</p></div>`}
    <p class="small muted">Esta página confirma apenas autenticidade, data e signatário. O conteúdo do documento não é exibido.</p>
    <a class="small" href="#inicio">← Voltar à maquete</a>
  </div></div>`;
}

/* =========================================================================
   MODAIS, TOASTS E AÇÕES
   ========================================================================= */
function toast(msg, i = 'checkc') {
  const el = document.createElement('div');
  el.className = 'toast'; el.innerHTML = `${ico(i)}<span>${msg}</span>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3800);
}
function modal({ title, sub = '', body, ok = 'Confirmar', okClass = 'primary', wide = false, onOk }) {
  fecharModal();
  const ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'overlay';
  ov.innerHTML = `<form class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="m-title" novalidate>
    <div class="modal-head"><div><h2 id="m-title">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${ico('x')}</button></div>
    <div class="modal-body">${body}</div>
    <div class="modal-foot"><button type="button" class="btn" data-act="fechar">${ok ? 'Cancelar' : 'Fechar'}</button>${ok ? `<button type="submit" class="btn ${okClass}">${ok}</button>` : ''}</div></form>`;
  document.body.appendChild(ov);
  const f = ov.querySelector('form');
  f.addEventListener('submit', async (e) => { e.preventDefault(); const r = await onOk?.(f); if (r !== false) fecharModal(); });
  ov.addEventListener('click', (e) => { if (e.target === ov) fecharModal(); });
  setTimeout(() => f.querySelector('input:not([type=hidden]),textarea,select')?.focus(), 30);
}
function fecharModal() { document.getElementById('overlay')?.remove(); }
const erroCampo = (f, sel, msg) => { const el = f.querySelector(sel); el.setCustomValidity(msg); el.reportValidity(); el.addEventListener('input', () => el.setCustomValidity(''), { once: true }); return false; };

function registrar(it, ev, novoStatus) {
  it.extra.push({ when: iso(HOJE), who: `${eu().nome} · ${eu().area}`, ...ev });
  if (novoStatus) it.status = novoStatus;
}

const ACOES = {
  menu: () => document.getElementById('sidebar').classList.toggle('open'),
  fechar: fecharModal,
  'pend-tab': (el) => { state.pendTab = el.dataset.tab; render(); },
  'ck-tab': (el) => { state.ckTab = el.dataset.tab; render(); },
  'adm-tab': (el) => { state.admTab = el.dataset.tab; render(); },
  'rel-tipo': (el) => { state.relTipo = el.dataset.tab; render(); },
  lad: (el) => { const k = el.dataset.key; if (state.ladAberto.has(k)) state.ladAberto.delete(k); else state.ladAberto.add(k); render(); },
  'add-widget': () => toast('Na versão real, cada usuário monta o próprio painel escolhendo os widgets.', 'info'),
  'nova-visao': () => toast('Nova visão: um painel em branco para montar com widgets (simulação).', 'info'),
  'w-refresh': () => toast('Widget atualizado.', 'refresh'),
  'w-more': () => toast('Opções do widget: exportar, tela cheia, remover (simulação).', 'info'),
  refresh: () => { render(); toast('Dados atualizados.', 'refresh'); },
  ajuda: () => toast('Atalho: tecle / para buscar. Passe o mouse nos gráficos para ver os valores.', 'info'),
  'limpar-filtros': () => { state.filtros = { periodo: 'ano', orgao: '', area: '', origem: '', grav: '' }; render(); },
  'limpar-busca': () => { state.q = ''; render(); },
  exportar: (el) => toast(`${el.dataset.fmt} gerado com cabeçalho institucional e filtros aplicados (simulação).`, 'download'),
  baixar: () => toast('Download por URL assinada válida por 60 segundos (simulação).', 'download'),
  'ler-todas': () => { minhasNotifs().forEach((n) => { n.lida = true; }); render(); toast('Notificações marcadas como lidas.'); },
  'salvar-param': () => toast('Parâmetros salvos. A alteração ficou registrada na trilha.'),
  'editar-usuario': () => toast('Edição de usuário: papel, área, ativo e acesso a restritos (simulação).', 'info'),
  'ver-modelo': () => { state.route = 'aplicacao-0011'; location.hash = 'aplicacao-0011'; },
  'nova-versao': () => toast('Nova versão criada como rascunho a partir da v3.', 'info'),
  'editar-modelo': () => toast('Editor de itens do modelo: seções, perguntas, base legal e gravidade (simulação).', 'info'),
  'publicar-modelo': () => toast('Publicação simulada: a versão anterior passaria a obsoleta.', 'info'),
  'salvar-ck': () => toast('Rascunho salvo.'),
  esqueci: (el, e) => { e.preventDefault(); toast('Um link de redefinição seria enviado ao e-mail institucional.', 'info'); },

  'nova-demanda': () => modal({
    title: 'Nova demanda', sub: 'Registro de demanda recebida de órgão de controle. Os itens são distribuídos depois, na tela da demanda.', wide: true, ok: 'Registrar demanda',
    body: `<div class="form-grid">
      <label class="field"><span>Órgão</span><select id="nd-org">${ORGAOS.map((o) => `<option>${o}</option>`).join('')}<option>Judiciário</option><option>Outro</option></select></label>
      <label class="field"><span>Tipo</span><select id="nd-tipo"><option>Diligência</option><option>Solicitação de informações</option><option>Relatório de auditoria</option><option>Determinação</option><option>Recomendação</option><option>Monitoramento</option><option>Requisição</option></select></label>
      <label class="field"><span>Documento de origem</span><input id="nd-doc" placeholder="Ofício nº 000/2026" required></label>
      <label class="field"><span>Processo SEI</span><input id="nd-sei" class="mono" placeholder="SEI-220006/000000/2026" required><span class="help">Texto de referência, sem integração com o SEI.</span></label>
      <label class="field"><span>Processo no órgão</span><input id="nd-proc" class="mono" placeholder="Opcional"></label>
      <label class="field"><span>Canal de entrada</span><select id="nd-canal"><option>SEI</option><option>E-mail</option><option>Sistema do TCE</option><option>Outro</option></select></label>
      <label class="field"><span>Recebida em</span><input id="nd-receb" type="date" value="2026-11-13" required></label>
      <label class="field"><span>Prazo do órgão</span><input id="nd-prazo" type="date" value="2026-12-03" required><span class="help">Dias corridos.</span></label>
      <label class="field"><span>Gravidade</span><select id="nd-grav"><option value="2">Média</option><option value="3">Alta</option><option value="4">Crítica</option><option value="1">Baixa</option></select></label>
      <label class="field"><span>Reincidência</span><input id="nd-reinc" class="mono" placeholder="Nº da demanda anterior, se houver"></label>
      <label class="field full"><span>Assunto</span><input id="nd-assunto" required></label>
      <label class="field full"><span>Resumo</span><textarea id="nd-resumo"></textarea></label>
      <label class="field full" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="nd-rest" style="height:auto"><span>Restrita (visível só para ASCOIN, administrador, responsáveis designados e gestores autorizados)</span></label>
    </div>`,
    onOk: (f) => {
      for (const [id, msg] of [['#nd-doc', 'Informe o documento de origem.'], ['#nd-sei', 'Informe o processo SEI.'], ['#nd-assunto', 'Informe o assunto.']]) if (!f.querySelector(id).value.trim()) return erroCampo(f, id, msg);
      const n = String(45 + DEMANDAS.filter((d) => d.novo).length).padStart(4, '0');
      const d = { n, novo: true, org: f.querySelector('#nd-org').value, tipo: f.querySelector('#nd-tipo').value, doc: f.querySelector('#nd-doc').value, sei: f.querySelector('#nd-sei').value, procOrg: f.querySelector('#nd-proc').value || '—', canal: f.querySelector('#nd-canal').value, receb: f.querySelector('#nd-receb').value, prazo: f.querySelector('#nd-prazo').value, grav: +f.querySelector('#nd-grav').value, assunto: f.querySelector('#nd-assunto').value, resumo: f.querySelector('#nd-resumo').value || '—', obs: '', restrito: f.querySelector('#nd-rest').checked, reinc: f.querySelector('#nd-reinc').value || undefined };
      DEMANDAS.unshift(d); DEM[n] = d;
      toast(`Demanda DEM-2026-${n} registrada. Agora distribua os itens.`);
      location.hash = `demanda-${n}`;
    },
  }),
  'add-item': (el) => modal({
    title: 'Distribuir item', sub: 'O item vai para a área responsável com prazo próprio. A área recebe alerta e deve confirmar o recebimento.', wide: true, ok: 'Distribuir',
    body: `<div class="form-grid">
      <label class="field full"><span>Título do item</span><input id="ai-tit" required placeholder="Ex.: Rec. 1 — ..."></label>
      <label class="field"><span>Área responsável</span><select id="ai-area">${AREAS.filter((a) => !['SEDES', 'GABSEC', 'ASCOIN'].includes(a.sigla)).map((a) => `<option value="${a.sigla}">${a.sigla} — ${esc(a.nome)}</option>`).join('')}</select></label>
      <label class="field"><span>Prazo da área</span><input id="ai-prazo" type="date" value="${addDias(iso(HOJE), 10)}"><span class="help">Sugestão: 5 dias antes do prazo do órgão.</span></label>
      <label class="field"><span>Gravidade</span><select id="ai-grav"><option value="2">Média</option><option value="3">Alta</option><option value="4">Crítica</option><option value="1">Baixa</option></select></label>
      <label class="field" style="flex-direction:row;align-items:center;gap:8px;align-self:end"><input type="checkbox" id="ai-rest" style="height:auto"><span>Item restrito</span></label>
      <label class="field full"><span>Resumo</span><textarea id="ai-res"></textarea></label>
    </div>`,
    onOk: (f) => {
      if (!f.querySelector('#ai-tit').value.trim()) return erroCampo(f, '#ai-tit', 'Informe o título do item.');
      const ref = el.dataset.dem; const seq = itensDaDemanda(ref).length + 1;
      const pr = f.querySelector('#ai-prazo').value;
      const it = { id: `${ref}-${String(seq).padStart(2, '0')}`, ref, seq, area: f.querySelector('#ai-area').value, status: 'distribuida', prazoOrig: pr, prazo: pr, grav: +f.querySelector('#ai-grav').value, restrito: f.querySelector('#ai-rest').checked, titulo: f.querySelector('#ai-tit').value, resumo: f.querySelector('#ai-res').value, obs: '', devol: 0, origem: 'demanda_externa', numero: `DEM-2026-${ref}/${String(seq).padStart(2, '0')}`, receb: iso(HOJE), extra: [] };
      ITENS.push(it); ITEM[it.id] = it;
      toast(`Item ${it.numero} distribuído para ${it.area}. Alerta enviado.`, 'send'); render();
    },
  }),
  'ciencia-area': (el) => { const it = ITEM[el.dataset.id]; registrar(it, { t: 'Ciência do recebimento', c: 'c-ok', i: 'checkc' }, 'em_atendimento'); toast('Recebimento confirmado. O item está em atendimento.'); render(); },
  responder: (el) => { const it = ITEM[el.dataset.id]; modal({
    title: 'Responder item', sub: `${it.numero} · prazo ${fmt(it.prazo)}`, ok: 'Enviar resposta à ASCOIN', wide: true,
    body: `<label class="field"><span>Resposta da área</span><textarea id="r-txt" required placeholder="Descreva o que foi feito e cite os documentos anexos."></textarea></label>
      <label class="dropzone" for="r-files">${ico('paperclip')} Anexar evidências (qualquer formato). O sistema calcula o SHA-256 de cada arquivo.<input id="r-files" type="file" multiple hidden></label><div id="r-lista" class="small muted"></div>`,
    onOk: (f) => {
      const txt = f.querySelector('#r-txt').value.trim();
      if (!txt) return erroCampo(f, '#r-txt', 'Escreva a resposta antes de enviar.');
      const files = [...f.querySelector('#r-files').files];
      it.evExtra = (it.evExtra || []).concat(files.map((x) => ({ nome: x.name, ext: (x.name.split('.').pop() || '').toUpperCase().slice(0, 4), tam: `${Math.max(1, Math.round(x.size / 1024))} KB`, por: eu().nome, em: fmt(iso(HOJE)) })));
      registrar(it, { t: 'Resposta da área', txt, c: 'c-info', i: 'msg' }, 'respondida_area');
      toast('Resposta enviada. A ASCOIN foi avisada.', 'send'); render();
    } });
    document.getElementById('r-files').addEventListener('change', (e) => { document.getElementById('r-lista').textContent = [...e.target.files].map((x) => x.name).join(', '); });
  },
  andamento: (el) => { const it = ITEM[el.dataset.id]; modal({ title: 'Informar andamento', sub: it.numero, ok: 'Registrar', body: '<label class="field"><span>Andamento da implementação</span><textarea id="an-txt" required></textarea></label>', onOk: (f) => { const t = f.querySelector('#an-txt').value.trim(); if (!t) return erroCampo(f, '#an-txt', 'Descreva o andamento.'); registrar(it, { t: 'Andamento informado', txt: t, c: 'c-info', i: 'msg' }); toast('Andamento registrado.'); render(); } }); },
  comentar: (el) => { const it = ITEM[el.dataset.id]; modal({ title: 'Comentário', sub: it.numero, ok: 'Registrar', body: '<label class="field"><span>Comentário</span><textarea id="cm-txt" required></textarea><span class="help">Fica no histórico do item e não pode ser editado depois.</span></label>', onOk: (f) => { const t = f.querySelector('#cm-txt').value.trim(); if (!t) return erroCampo(f, '#cm-txt', 'Escreva o comentário.'); registrar(it, { t: 'Comentário', txt: t, c: 'c-neutral', i: 'msg' }); toast('Comentário registrado.'); render(); } }); },
  prorrogar: (el) => { const it = ITEM[el.dataset.id]; const max = Math.max(1, Math.floor((toDate(it.prazoOrig) - toDate(it.receb)) / DIA / 2)); modal({
    title: 'Pedir prorrogação', sub: `${it.numero} · prazo atual ${fmt(it.prazo)}`, ok: 'Enviar pedido',
    body: `<label class="field"><span>Dias adicionais (corridos)</span><input id="pr-dias" type="number" min="1" value="${Math.min(5, max)}"><span class="help">Regra atual: até ${max} dias (50% do prazo original), 1 pedido por item.</span></label><label class="field"><span>Justificativa</span><textarea id="pr-just" required></textarea></label>`,
    onOk: (f) => { const j = f.querySelector('#pr-just').value.trim(); const dias = +f.querySelector('#pr-dias').value; if (!dias || dias < 1) return erroCampo(f, '#pr-dias', 'Informe os dias.'); if (!j) return erroCampo(f, '#pr-just', 'A justificativa é obrigatória.'); PRORROGACOES.unshift({ id: `P-00${20 + PRORROGACOES.length}`, item: it.id, em: iso(HOJE), por: eu().nome, dias, just: j, status: 'pendente' }); registrar(it, { t: `Prorrogação solicitada (+${dias} dias)`, txt: j, c: 'c-warn', i: 'clock' }); toast('Pedido enviado à ASCOIN.', 'clock'); render(); },
  }); },
  decidir: (el) => { const p = PRORROGACOES.find((x) => x.id === el.dataset.id); const ap = el.dataset.v === 'aprovada'; modal({
    title: ap ? 'Aprovar prorrogação' : 'Negar prorrogação', sub: `${p.id} · +${p.dias} dias`, ok: ap ? 'Aprovar' : 'Negar', okClass: ap ? 'primary' : 'danger',
    body: `<label class="field"><span>Motivação da decisão${ap ? ' (opcional)' : ''}</span><textarea id="dc-txt"></textarea></label>`,
    onOk: (f) => { const t = f.querySelector('#dc-txt').value.trim(); if (!ap && !t) return erroCampo(f, '#dc-txt', 'Explique o motivo para a área.'); const it = ITEM[p.item]; p.status = el.dataset.v; p.decisao = `${ap ? 'Aprovada' : 'Negada'} por ${eu().nome} em ${fmt(iso(HOJE))}.${t ? ' ' + t : ''}`; if (ap) it.prazo = addDias(it.prazo, p.dias); registrar(it, { t: `Prorrogação ${ap ? 'aprovada' : 'negada'}`, txt: ap ? `Novo prazo: ${fmt(it.prazo)}.${t ? ' ' + t : ''}` : t, c: ap ? 'c-ok' : 'c-crit', i: 'clock' }); toast(`Prorrogação ${ap ? 'aprovada' : 'negada'}. A área foi avisada.`); render(); },
  }); },
  'iniciar-analise': (el) => { registrar(ITEM[el.dataset.id], { t: 'Análise iniciada', c: 'c-info', i: 'eye' }, 'em_analise_ascoin'); toast('Análise iniciada.'); render(); },
  aceitar: (el) => { const it = ITEM[el.dataset.id]; registrar(it, { t: 'Resposta aceita e consolidada', c: 'c-violet', i: 'check' }, 'consolidada'); const ativos = itensDaDemanda(it.ref).filter((i) => !isFinal(i)); toast(ativos.every((i) => i.status === 'consolidada') ? 'Todos os itens consolidados. A CHEGAB foi avisada para dar ciência.' : 'Resposta aceita e incorporada à consolidação.'); render(); },
  devolver: (el) => { const it = ITEM[el.dataset.id]; modal({ title: 'Devolver para complementação', sub: it.numero, ok: 'Devolver à área', okClass: 'danger', body: '<label class="field"><span>O que falta</span><textarea id="dv-txt" required placeholder="Indique o documento ou a informação que a área precisa complementar."></textarea></label>', onOk: (f) => { const t = f.querySelector('#dv-txt').value.trim(); if (!t) return erroCampo(f, '#dv-txt', 'Explique o que a área precisa complementar.'); it.devol++; registrar(it, { t: 'Devolvida para complementação', txt: t, c: 'c-warn', i: 'undo' }, 'devolvida'); toast('Item devolvido. A área foi avisada.', 'undo'); render(); } }); },
  encerrar: (el) => { const it = ITEM[el.dataset.id]; modal({ title: 'Encerrar item', sub: it.numero, ok: 'Encerrar', body: `<label class="field"><span>Resultado</span><select id="en-res"><option value="atendida">Atendida</option><option value="parcialmente_atendida">Parcialmente atendida</option><option value="nao_atendida">Não atendida</option></select></label><label class="field"><span>Fundamento</span><textarea id="en-txt" placeholder="Ex.: Ofício do órgão confirmando o cumprimento."></textarea></label>`, onOk: (f) => { const r = f.querySelector('#en-res').value; registrar(it, { t: `Encerrado — ${ST[r].nome}`, txt: f.querySelector('#en-txt').value, c: r === 'atendida' ? 'c-ok' : 'c-warn', i: 'checkc' }, r); toast('Item encerrado.'); render(); } }); },
  excluir: (el) => { const it = ITEM[el.dataset.id]; modal({ title: 'Excluir item', sub: `${it.numero}. O item vai para a lixeira e pode ser restaurado por 30 dias.`, ok: 'Excluir', okClass: 'danger', body: '<label class="field"><span>Justificativa (obrigatória)</span><textarea id="ex-txt" required></textarea><span class="help">Ficam registrados seu login, nome, data e hora.</span></label>', onOk: (f) => { const t = f.querySelector('#ex-txt').value.trim(); if (!t) return erroCampo(f, '#ex-txt', 'A justificativa é obrigatória.'); LIXEIRA.unshift({ id: `L-0${32 + LIXEIRA.length}`, tipo: 'Item de acompanhamento', ref: `${it.numero} — ${it.titulo}`, por: eu().nome, login: eu().email.split('@')[0], em: `${iso(HOJE)} 10:00`, motivo: t, item: it }); ITENS.splice(ITENS.indexOf(it), 1); delete ITEM[it.id]; toast('Item movido para a lixeira.', 'trash'); location.hash = it.origem === 'demanda_externa' ? `demanda-${it.ref}` : 'pendencias'; } }); },
  restaurar: (el) => { const l = LIXEIRA.find((x) => x.id === el.dataset.id); LIXEIRA = LIXEIRA.filter((x) => x !== l); if (l.item) { ITENS.push(l.item); ITEM[l.item.id] = l.item; } toast(`${l.tipo} restaurado. A restauração ficou na trilha.`, 'undo'); render(); },
  'ciencia-chegab': (el) => { const its = itensDaDemanda(el.dataset.dem).filter((i) => i.status === 'consolidada'); its.forEach((i) => registrar(i, { t: 'Ciência da CHEGAB', c: 'c-violet', i: 'stamp' }, 'ciencia_chegab')); toast('Ciência registrada. A ASCOIN pode enviar a resposta ao órgão.', 'stamp'); render(); },
  'enviar-orgao': (el) => modal({ title: 'Registrar envio ao órgão', ok: 'Registrar envio', body: '<label class="field"><span>Ofício de resposta</span><input id="eo-of" placeholder="Ofício SEDES/ASCOIN nº 000/2026" required></label><label class="field"><span>Data do envio</span><input id="eo-dt" type="date" value="2026-11-13"></label>', onOk: (f) => { const of = f.querySelector('#eo-of').value.trim(); if (!of) return erroCampo(f, '#eo-of', 'Informe o ofício de resposta.'); itensDaDemanda(el.dataset.dem).filter((i) => i.status === 'ciencia_chegab').forEach((i) => registrar(i, { t: 'Enviada ao órgão', txt: of, c: 'c-violet', i: 'send' }, 'enviada_orgao')); toast('Envio registrado.', 'send'); render(); } }),
  monitorar: (el) => { itensDaDemanda(el.dataset.dem).filter((i) => i.status === 'enviada_orgao').forEach((i) => registrar(i, { t: 'Monitoramento iniciado', c: 'c-violet', i: 'clock' }, 'em_monitoramento')); toast('Itens em monitoramento.'); render(); },
  'nova-aplicacao': () => modal({ title: 'Nova aplicação de checklist', ok: 'Criar', body: `<label class="field"><span>Modelo (somente versões publicadas)</span><select id="na-mod"><option>CONV-CEL v3 — Convênios — Celebração</option><option>CONV-PC v2 — Convênios — Prestação de contas</option></select></label><label class="field"><span>Objeto</span><input id="na-obj" placeholder="Convênio nº 000/2026 — ..."></label><label class="field"><span>Processo SEI</span><input id="na-sei" class="mono"></label><label class="field"><span>Lote de amostragem</span><select id="na-lote"><option>L-2026-04 — Convênios 2º sem/2026</option><option>Sem amostragem (análise integral)</option></select></label>`, onOk: () => { toast('Aplicação criada (simulação). Abrindo exemplo em preenchimento.', 'info'); location.hash = 'aplicacao-0012'; } }),
  'responder-ck': (el) => { const a = APLICACOES.find((x) => x.n === '0012'); const q = +el.dataset.q; const prev = a.respostas[q] || ['', '', '']; a.respostas[q] = [el.dataset.v, document.getElementById(`j-0012-${q}`)?.value || prev[1], document.getElementById(`s-0012-${q}`)?.value || prev[2]]; const y = window.scrollY; render(); window.scrollTo(0, y); },
  'finalizar-ck': () => {
    const a = APLICACOES.find((x) => x.n === '0012');
    CK_ITENS.forEach((q) => { const j = document.getElementById(`j-0012-${q.n}`); const s = document.getElementById(`s-0012-${q.n}`); if (a.respostas[q.n]) { a.respostas[q.n][1] = j?.value || ''; a.respostas[q.n][2] = s?.value || ''; } });
    const faltam = CK_ITENS.filter((q) => !a.respostas[q.n]).map((q) => q.n);
    if (faltam.length) { toast(`Faltam ${plural(faltam.length, 'item', 'itens')}: ${faltam.join(', ')}.`, 'alert'); return; }
    const semJust = CK_ITENS.filter((q) => a.respostas[q.n][0] !== 'conforme' && !a.respostas[q.n][1].trim()).map((q) => q.n);
    if (semJust.length) { toast(`Justificativa obrigatória nos itens ${semJust.join(', ')}.`, 'alert'); return; }
    abrirAssinatura(`Parecer de checklist (CHK-2026-0012)`, () => {
      a.status = 'assinado'; a.codigo = ultimaAssinatura.codigo;
      const c = { conforme: 0, nao_conforme: 0, nao_se_aplica: 0, com_ressalva: 0 }; Object.values(a.respostas).forEach((r) => c[r[0]]++);
      a.resumo = `${c.conforme} C · ${c.nao_conforme} NC · ${c.com_ressalva} CR · ${c.nao_se_aplica} NA`;
      CK_ITENS.filter((q) => a.respostas[q.n][0] === 'nao_conforme').forEach((q) => { const id = `CHK0012-${String(q.n).padStart(2, '0')}`; const it = { id, ref: 'CHK0012', seq: q.n, area: a.area, status: 'distribuida', prazoOrig: addDias(iso(HOJE), 15), prazo: addDias(iso(HOJE), 15), grav: 3, restrito: false, titulo: `Não conforme — ${q.q.replace(/\?$/, '')}`, resumo: `Checklist CHK-2026-0012, item ${q.n}: ${a.respostas[q.n][1]}`, obs: '', devol: 0, origem: 'checklist', numero: `CHK-2026-0012/${String(q.n).padStart(2, '0')}`, receb: iso(HOJE), extra: [] }; ITENS.push(it); ITEM[id] = it; });
      render();
    });
  },
  assinar: (el) => abrirAssinatura(el.dataset.doc, () => render()),
  upload: (el) => { const it = ITEM[el.dataset.id]; const files = [...el.files]; it.evExtra = (it.evExtra || []).concat(files.map((x) => ({ nome: x.name, ext: (x.name.split('.').pop() || '').toUpperCase().slice(0, 4), tam: `${Math.max(1, Math.round(x.size / 1024))} KB`, por: eu().nome, em: fmt(iso(HOJE)) }))); toast(`${plural(files.length, 'arquivo anexado', 'arquivos anexados')} com hash registrado.`, 'paperclip'); render(); },
  importar: (el) => { const f = el.files[0]; if (f) toast(`“${esc(f.name)}” recebido. O mapeamento será montado quando a planilha oficial chegar (simulação).`, 'info'); },
  'conferir-pdf': async (el) => {
    const f = el.files[0]; if (!f) return;
    const out = document.getElementById('v-res');
    try {
      const buf = await f.arrayBuffer();
      const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((b) => b.toString(16).padStart(2, '0')).join('');
      const a = ASSINATURAS.find((x) => x.codigo === (state.verificar || ASSINATURAS[0].codigo));
      out.innerHTML = h === a.hash ? '<b style="color:var(--ok)">O arquivo confere com o documento assinado.</b>' : `<b style="color:var(--crit)">O arquivo não confere.</b> Hash calculado: <span class="mono">${h.slice(0, 24)}…</span>. Na maquete, só o PDF real gerado pelo sistema confere.`;
    } catch (e) { out.textContent = 'Não foi possível calcular o hash neste navegador.'; }
  },
};

/* ---------- Assinatura eletrônica simples ---------- */
let ultimaAssinatura = null;
function abrirAssinatura(doc, depois) {
  modal({
    title: 'Assinar documento', sub: `${esc(doc)}. Assinatura eletrônica simples (Lei 14.063/2020): digite sua senha novamente para confirmar a autoria.`, ok: 'Assinar',
    body: `<div class="note small">Signatário: <b>${esc(eu().nome)}</b> · ${esc(eu().cargo)}<br>Login: <span class="mono">${eu().email}</span> · data, hora e IP serão registrados.</div>
      <label class="field"><span>Senha</span><input id="as-senha" type="password" autocomplete="current-password" required></label>`,
    onOk: async (f) => {
      if (!f.querySelector('#as-senha').value) return erroCampo(f, '#as-senha', 'Digite sua senha para assinar.');
      const alfa = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const bloco = () => Array.from({ length: 4 }, () => alfa[Math.floor(Math.random() * alfa.length)]).join('');
      const codigo = `SEDES-${bloco()}-${bloco()}-${bloco()}`;
      let hash = hashFake(codigo + doc);
      try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${doc}|${codigo}|${eu().email}`)); hash = [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); } catch (e) { /* mantém o hash simulado */ }
      ultimaAssinatura = { codigo, tipo: doc, nome: eu().nome, cargo: eu().cargo, em: '2026-11-13 10:00', hash };
      ASSINATURAS.unshift(ultimaAssinatura);
      depois?.();
      setTimeout(() => mostrarComprovante(ultimaAssinatura), 0);
    },
  });
}
function mostrarComprovante(a) {
  modal({
    title: 'Documento assinado', sub: 'O PDF foi gerado com o código e o QR code no rodapé. O hash abaixo é do arquivo final.', ok: '',
    body: `<div class="sign-box"><canvas id="qr" width="29" height="29" aria-label="QR code ilustrativo"></canvas><div style="min-width:0"><div class="eyebrow">Código de verificação</div><div class="code-big">${a.codigo}</div><div class="mono small muted" style="overflow-wrap:anywhere;margin-top:6px">SHA-256 ${a.hash}</div></div></div>
      <p class="small muted">QR code ilustrativo. Na versão real, ele aponta para verificar.html?codigo=${a.codigo}.</p>
      <div class="actions"><a class="btn" href="#verificar" data-act="ir-verificar" data-cod="${a.codigo}">${ico('shield')}Abrir página de verificação</a><button type="button" class="btn" data-act="exportar" data-fmt="PDF">${ico('download')}Baixar PDF</button></div>`,
  });
  desenharQR(document.getElementById('qr'), a.hash);
}
function desenharQR(cv, hash) {
  const ctx = cv.getContext('2d'); const N = 29;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, N, N); ctx.fillStyle = '#0a2f5c';
  let bits = ''; for (const ch of (hash + hash + hash + hash)) bits += parseInt(ch, 16).toString(2).padStart(4, '0');
  let k = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (bits[k++ % bits.length] === '1') ctx.fillRect(x, y, 1, 1); }
  const finder = (ox, oy) => { ctx.fillStyle = '#fff'; ctx.fillRect(ox - 1, oy - 1, 9, 9); ctx.fillStyle = '#0a2f5c'; ctx.fillRect(ox, oy, 7, 7); ctx.fillStyle = '#fff'; ctx.fillRect(ox + 1, oy + 1, 5, 5); ctx.fillStyle = '#0a2f5c'; ctx.fillRect(ox + 2, oy + 2, 3, 3); };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
}

/* =========================================================================
   ROTEAMENTO E EVENTOS
   ========================================================================= */
const PUBLICAS = { login: viewLogin, 'primeiro-acesso': viewPrimeiroAcesso, verificar: viewVerificar };
const PERMISSAO = { prorrogacoes: ['ascoin', 'admin'], lixeira: ['ascoin', 'admin'], trilha: ['ascoin', 'admin', 'auditoria'], admin: ['admin'] };
function render() {
  const r = state.route;
  const root = document.getElementById('root');
  if (PUBLICAS[r]) { root.innerHTML = PUBLICAS[r](); return; }
  const [nome, ...resto] = r.split('-');
  const arg = resto.join('-');
  let html;
  if (PERMISSAO[nome] && !PERMISSAO[nome].includes(eu().papel)) html = semAcesso();
  else html = ({ inicio: viewInicio, painel: viewPainel, demandas: viewDemandas, pendencias: viewPendencias, prorrogacoes: viewProrrogacoes, checklists: viewChecklists, relatorios: viewRelatorios, notificacoes: viewNotificacoes, lixeira: viewLixeira, trilha: viewTrilha, admin: viewAdmin, auditoria: viewAuditoria, riscos: viewRiscos, demanda: () => viewDemanda(arg), item: () => viewItem(arg), aplicacao: () => viewAplicacao(arg) }[nome] || viewInicio)();
  root.innerHTML = shell(html);
}
function rota() {
  const h = (location.hash || '#painel').slice(1);
  state.route = h || 'painel';
  fecharModal();
  render();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', rota);

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go && !e.target.closest('a,button:not([data-go])')) { if (go.dataset.tab) state.admTab = go.dataset.tab; location.hash = go.dataset.go; return; }
  if (go && go.tagName === 'BUTTON') { if (go.dataset.tab) state.admTab = go.dataset.tab; location.hash = go.dataset.go; return; }
  const a = e.target.closest('[data-act]');
  if (a && a.tagName !== 'SELECT' && a.tagName !== 'INPUT') {
    if (a.dataset.act === 'ir-verificar') { state.verificar = a.dataset.cod; fecharModal(); return; }
    ACOES[a.dataset.act]?.(a, e);
  }
  const nav = e.target.closest('.nav a');
  if (nav) document.getElementById('sidebar')?.classList.remove('open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !e.target.matches('input,textarea,select')) { const q = document.getElementById('q'); if (q && q.offsetParent) { e.preventDefault(); q.focus(); } }
  if (e.key === 'Escape') { fecharModal(); document.getElementById('sidebar')?.classList.remove('open'); }
  if (e.key === 'Enter' && e.target.matches('tr[data-go]')) location.hash = e.target.dataset.go;
  if (e.key === 'Enter' && e.target.id === 'q') { state.q = e.target.value.trim(); if (state.route !== 'demandas') location.hash = 'pendencias'; else render(); }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'perfil') { state.userId = t.value; try { localStorage.setItem('sisc_user', t.value); } catch (err) { /* sem armazenamento */ } render(); toast(`Agora você vê o sistema como ${USER[t.value].nome} (${PAPEIS[USER[t.value].papel]}).`, 'users'); return; }
  if (t.dataset.filtro) { state.filtros[t.dataset.filtro] = t.value; render(); return; }
  if (t.dataset.demf) { state.demFiltro[t.dataset.demf] = t.value; render(); return; }
  if (t.dataset.act && ACOES[t.dataset.act] && t.tagName === 'INPUT') ACOES[t.dataset.act](t, e);
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'login') { location.hash = eu().troca ? 'primeiro-acesso' : 'inicio'; if (!eu().troca) toast('Sessão iniciada.'); }
  if (f.dataset.form === 'troca') {
    const a = f.querySelector('#t-1').value; const b = f.querySelector('#t-2').value; const err = f.querySelector('#t-erro');
    if (a.length < 10 || !/\d/.test(a) || !/[a-z]/i.test(a)) { err.textContent = 'A senha precisa ter ao menos 10 caracteres, com letras e números.'; err.hidden = false; return; }
    if (a !== b) { err.textContent = 'As senhas não são iguais.'; err.hidden = false; return; }
    eu().troca = false; location.hash = 'inicio'; toast('Senha criada. Bem-vindo ao SisControle.');
  }
  if (f.dataset.form === 'verificar') { state.verificar = f.querySelector('#v-cod').value.trim().toUpperCase(); render(); }
});

/* Dica flutuante dos gráficos */
const tip = document.getElementById('tip');
document.addEventListener('mousemove', (e) => {
  const t = e.target.closest?.('[data-tip]');
  if (!t) { tip.hidden = true; return; }
  tip.innerHTML = t.dataset.tip.split('|').map((s, i) => (i === 0 ? `<b>${esc(s)}</b>` : esc(s))).join('<br>');
  tip.hidden = false;
  const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 10);
  tip.style.left = `${x}px`; tip.style.top = `${e.clientY + 14}px`;
});

rota();
