// Gera o documento técnico de levantamento de conteúdos do novo site da SEDES
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, BorderStyle, Header, Footer, PageNumber, PageOrientation, HeadingLevel, LevelFormat,
  TableOfContents, PositionalTab, PositionalTabAlignment, PositionalTabRelativeTo, PositionalTabLeader,
  VerticalAlign, PageBreak, TableLayoutType, TabStopType,
} = require('docx');

const [, , BRASAO, OUT] = process.argv;
const brasao = fs.readFileSync(BRASAO);

// ---------- identidade visual ----------
const NAVY = '0A2252', BLUE = '1E88E5', CYAN = '5CC3F7', GREY = '4F5F78', LIGHT = 'EEF5FD', LINE = 'C9D6E8';
const YELLOW = 'FFF4C2', RED_BG = 'FDE2E2', ORANGE_BG = 'FFE9D2', GREEN_BG = 'E2F4E8';
const FONT = 'Arial';

const t = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [typeof runs === 'string' ? t(runs) : runs], ...o });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [t(text)] });
const body = (text, o = {}) => new Paragraph({ style: 'Corpo', children: rich(text), ...o });
const bullet = (text, lvl = 0) => new Paragraph({ style: 'Corpo', numbering: { reference: 'marcadores', level: lvl }, children: rich(text) });
const num = (text) => new Paragraph({ style: 'Corpo', numbering: { reference: 'passos', level: 0 }, children: rich(text) });
// **negrito** simples dentro do texto
function rich(text, base = {}) {
  return String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(s =>
    s.startsWith('**') ? t(s.slice(2, -2), { bold: true, ...base }) : t(s, base));
}
const border = (c = LINE, sz = 4) => ({ style: BorderStyle.SINGLE, size: sz, color: c });
const borders = (c) => ({ top: border(c), bottom: border(c), left: border(c), right: border(c) });

function cell(content, width, o = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map(x => x instanceof Paragraph ? x :
    new Paragraph({ spacing: { before: 30, after: 30 }, alignment: o.align, children: rich(x, { size: o.size || 16, color: o.color, bold: o.bold }) }));
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, children: paras, verticalAlign: o.valign || VerticalAlign.TOP,
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 }, borders: borders(o.borderColor || LINE),
    columnSpan: o.span,
  });
}
function table(widths, rows, o = {}) {
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows, layout: TableLayoutType.FIXED, ...o });
}
function headRow(labels, widths, size = 16) {
  return new TableRow({ tableHeader: true, cantSplit: true, children: labels.map((l, i) => cell(l, widths[i], { fill: NAVY, color: 'FFFFFF', bold: true, size, valign: VerticalAlign.CENTER })) });
}
const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });
const callout = (title, text, fill = LIGHT, bar = BLUE) => new Paragraph({
  style: 'Corpo', shading: { type: ShadingType.CLEAR, color: 'auto', fill },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: bar, space: 8 } },
  spacing: { before: 120, after: 160 }, indent: { left: 160, right: 160 },
  children: [t(title + ' ', { bold: true, color: NAVY }), ...rich(text)],
});

// ---------- cabeçalho e rodapé (identidade do Governo) ----------
function header(w) {
  return new Header({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: w }],
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 6 } },
    spacing: { after: 120 },
    children: [
      new ImageRun({ type: 'png', data: brasao, transformation: { width: 116, height: 41 }, altText: { title: 'Governo do Estado do Rio de Janeiro', description: 'Assinatura do Governo do Estado do Rio de Janeiro', name: 'brasao' } }),
      new TextRun({ text: '\t' }),
      t('Secretaria de Desenvolvimento Econômico', { bold: true, color: NAVY, size: 16 }),
      t('  |  SEDES', { color: BLUE, bold: true, size: 16 }),
    ],
  })] });
}
function footer(w) {
  return new Footer({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: w }],
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: CYAN, space: 6 } },
    children: [
      t('Novo Site SEDES · Levantamento de Conteúdos · v1.0 · Documento de trabalho', { size: 14, color: GREY }),
      new TextRun({ text: '\t' }),
      new TextRun({ children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES], font: FONT, size: 14, color: NAVY, bold: true }),
    ],
  })] });
}

// ---------- dados: inventário de campos ----------
// [id, campo, atual na maquete, informação necessária / regras, responsável, prioridade]
const SECOES = [
  { cod: 'CAB', nome: 'Cabeçalho, marca e navegação', desc: 'Faixa fixa no topo de todas as páginas: marca SEDES RJ, menu principal, busca e assinatura do Governo.', campos: [
    ['CAB-01', 'Logotipo SEDES RJ', 'Marca composta em texto ("SEDES RJ" + "Secretaria de Desenvolvimento Econômico").', 'Arquivo oficial da marca em vetor (SVG e PDF) nas versões positiva e negativa, com a área de proteção e o tamanho mínimo definidos no manual de marca.', 'ASCOM', 'Alta'],
    ['CAB-02', 'Assinatura do Governo do Estado (brasão)', 'Imagem recortada da apresentação, em baixa resolução.', 'Arquivo oficial da assinatura do Governo (SVG/PDF), versões colorida e monocromática, e as regras de aplicação ao lado da marca da Secretaria.', 'ASCOM', 'Alta'],
    ['CAB-03', 'Itens do menu principal', 'A SEDES · Áreas de atuação · Oportunidades · O Rio em dados · Notícias e agenda · LGPD · Transparência · Fale conosco.', 'Validar os nomes e a ordem dos itens (no máximo 8). Informar se LGPD e Transparência ficam no menu ou passam ao rodapé (recomendado).', 'ASCOM / GAB', 'Alta'],
    ['CAB-04', 'Submenus', 'A SEDES: Quem somos, Subsecretarias, Legislação. Áreas: os 3 eixos. Oportunidades: Central, Eventos e missões. Dados: Mapa, Observatório.', 'Lista final de subpáginas de cada item, com uma linha de descrição (até 60 caracteres) e a página de destino.', 'ASCOM', 'Alta'],
    ['CAB-05', 'Endereços (URLs) de destino', 'Na maquete os links abrem páginas simuladas.', 'URL definitiva de cada página interna e dos links externos (Portal da Transparência, e-SIC, Ouvidoria, LGPD).', 'TI / ASCOM', 'Alta'],
    ['CAB-06', 'Busca do site', 'Busca simulada em páginas e municípios.', 'Termos mais procurados (para sugestões), sinônimos (ex.: "edital" = "chamada pública") e o escopo da busca (páginas, notícias, editais, municípios).', 'ASCOM / TI', 'Média'],
    ['CAB-07', 'Título da aba e descrição (SEO)', '"SEDES RJ · Secretaria de Desenvolvimento Econômico".', 'Título (até 60 caracteres) e descrição (até 155 caracteres) da página inicial; ícone do site (favicon) 512×512 px.', 'ASCOM', 'Média'],
  ]},
  { cod: 'HER', nome: 'Hero: "Desenvolvimento que transforma"', desc: 'Primeira área da página, com foto de fundo, mensagem principal, dois botões e o vídeo institucional.', campos: [
    ['HER-01', 'Rótulo superior', '"DESENVOLVIMENTO QUE TRANSFORMA".', 'Validar ou substituir. Até 35 caracteres.', 'ASCOM', 'Alta'],
    ['HER-02', 'Título principal', '"O futuro do Rio acontece aqui."', 'Validar ou substituir. Até 40 caracteres, em duas linhas; a segunda linha aparece em azul-claro.', 'ASCOM / GAB', 'Alta'],
    ['HER-03', 'Texto de apoio', '"Energia, inovação e negócios para um estado mais forte, competitivo e com mais oportunidades para as pessoas."', 'Validar ou substituir. Até 140 caracteres.', 'ASCOM', 'Alta'],
    ['HER-04', 'Botão "Explore oportunidades"', 'Abre a Central de oportunidades (simulada).', 'Confirmar o texto do botão (até 25 caracteres) e a página de destino.', 'ASCOM', 'Alta'],
    ['HER-05', 'Botão "Conheça a SEDES"', 'Abre "Quem somos" (simulada).', 'Confirmar o texto do botão e a página de destino.', 'ASCOM', 'Alta'],
    ['HER-06', 'Imagem de fundo', 'Foto do Pão de Açúcar recortada da proposta (aparenta ter sido gerada por IA).', 'Foto oficial em alta resolução (mínimo 2560×1000 px, JPG), com crédito do fotógrafo e autorização de uso. Área à esquerda sem elementos que atrapalhem a leitura do texto.', 'ASCOM', 'Alta'],
    ['HER-07', 'Vídeo institucional', 'Cartão "Um Rio de mais oportunidades" abre um espaço reservado ao vídeo.', 'Endereço do vídeo (YouTube/Vimeo oficial), título, duração, miniatura (1280×720 px), legendas (SRT), janela de Libras e transcrição em texto.', 'ASCOM', 'Média'],
  ]},
  { cod: 'PER', nome: 'Caminhos por perfil de visitante', desc: 'Barra com quatro atalhos para públicos diferentes. Cada atalho leva a uma página com serviços e programas daquele público.', campos: [
    ['PER-01', 'Sou cidadão', 'Texto: "Conheça projetos e benefícios para o seu município".', 'Validar o texto (até 60 caracteres) e enviar o conteúdo da página de destino: lista de programas, cursos de qualificação e serviços ao cidadão, com links.', 'ASCOM / Subsecretarias', 'Alta'],
    ['PER-02', 'Sou empreendedor', 'Texto: "Programas, apoio e serviços para o seu negócio".', 'Validar o texto e enviar o conteúdo da página: abertura de empresa, crédito e fomento, capacitação, canais de atendimento.', 'SUBICS', 'Alta'],
    ['PER-03', 'Quero investir no RJ', 'Texto: "Oportunidades e ambiente de negócios".', 'Validar o texto e enviar o conteúdo da página: setores estratégicos, incentivos, contato do atendimento ao investidor. Informar se haverá versão em inglês/espanhol.', 'SUBICS / GAB', 'Alta'],
    ['PER-04', 'Quero inovar', 'Texto: "Tecnologia, startups e parcerias".', 'Validar o texto e enviar o conteúdo da página: programas para startups, parques tecnológicos, editais de inovação, parcerias.', 'SUBINOV', 'Alta'],
  ]},
  { cod: 'EIX', nome: 'Nossas áreas de atuação: os três eixos', desc: 'Apresenta as três subsecretarias com foto, descrição, link e temas. Cada eixo tem cor própria (azul, laranja e verde).', campos: [
    ['EIX-01', 'Título e texto de apresentação da seção', '"Três eixos para um Rio de mais oportunidades." + parágrafo sobre a atuação integrada da SEDES.', 'Validar o título (até 50 caracteres) e o parágrafo (até 200 caracteres).', 'ASCOM', 'Alta'],
    ['EIX-02', 'Link "Conheça todas as iniciativas"', 'Abre página simulada.', 'Lista completa de programas e projetos da SEDES (nome, eixo, público, situação, link), para a página de iniciativas.', 'Subsecretarias', 'Média'],
    ['EIX-03', 'Energia e Economia do Mar: título e descrição', 'Descrição: "O potencial energético e marítimo que movimenta o Rio de Janeiro..."', 'Nome oficial da subsecretaria (conforme o Decreto nº 50.447/2026) e descrição de até 160 caracteres.', 'SUBEM', 'Alta'],
    ['EIX-04', 'Energia e Economia do Mar: foto', 'Navio-plataforma (imagem da proposta).', 'Foto oficial, mínimo 1200×400 px, com crédito e autorização. Área inferior esquerda livre (fica atrás do ícone).', 'SUBEM / ASCOM', 'Alta'],
    ['EIX-05', 'Energia e Economia do Mar: temas e página', 'Temas: Petróleo e Gás · Energia Renovável · Economia Azul.', 'Validar os 3 temas e enviar o conteúdo da página do eixo: cadeias energéticas, transição, infraestrutura marítima, projetos e oportunidades.', 'SUBEM', 'Alta'],
    ['EIX-06', 'Inovação: título e descrição', '"Conectando conhecimento, tecnologia e empreendedorismo ao futuro da economia."', 'Nome oficial da subsecretaria e descrição de até 160 caracteres.', 'SUBINOV', 'Alta'],
    ['EIX-07', 'Inovação: foto', 'Pesquisadora diante de telas (imagem da proposta).', 'Foto oficial, mínimo 1200×400 px, com crédito e autorização.', 'SUBINOV / ASCOM', 'Alta'],
    ['EIX-08', 'Inovação: temas e página', 'Temas: Startups · Ecossistemas de Inovação · Fomento.', 'Validar os 3 temas e enviar o conteúdo da página do eixo: startups, ecossistemas, tecnologia, programas e parcerias.', 'SUBINOV', 'Alta'],
    ['EIX-09', 'Indústria, Comércio e Serviços: título e descrição', '"Fortalecendo cadeias produtivas, atraindo investimentos e criando oportunidades..."', 'Nome oficial da subsecretaria e descrição de até 160 caracteres.', 'SUBICS', 'Alta'],
    ['EIX-10', 'Indústria, Comércio e Serviços: foto', 'Técnico em linha de produção (imagem da proposta).', 'Foto oficial, mínimo 1200×400 px, com crédito e autorização.', 'SUBICS / ASCOM', 'Alta'],
    ['EIX-11', 'Indústria, Comércio e Serviços: temas e página', 'Temas: Investimentos · Ambiente de Negócios · Desenvolvimento Regional.', 'Validar os 3 temas e enviar o conteúdo da página do eixo: desenvolvimento regional, cadeias produtivas, incentivos e investimentos.', 'SUBICS', 'Alta'],
  ]},
  { cod: 'QUI', nome: 'Estude o Rio: quiz para estudantes e acadêmicos', desc: 'Faixa azul-clara com foto de estudantes e quiz sem cadastro, em duas etapas de ensino.', campos: [
    ['QUI-01', 'Textos da seção', 'Selo "Para estudantes e acadêmicos", título "Estude o Rio: teste seus conhecimentos", subtítulo e descrição.', 'Validar os textos. Título até 45 caracteres; descrição até 150.', 'ASCOM', 'Média'],
    ['QUI-02', 'Foto de fundo', 'Dois estudantes com notebook (imagem da proposta).', 'Foto oficial (mínimo 1400×800 px). Se houver menores de idade, é obrigatória a autorização de uso de imagem assinada pelos responsáveis.', 'ASCOM / JUR', 'Média'],
    ['QUI-03', 'Perguntas: Educação básica', '5 perguntas de exemplo, elaboradas para a maquete.', 'Banco de perguntas (mínimo 5; recomendado 20 para sorteio): enunciado, 4 alternativas, resposta correta, explicação (até 300 caracteres) e fonte.', 'Subsecretarias', 'Média'],
    ['QUI-04', 'Perguntas: Ensino superior', '5 perguntas de exemplo, elaboradas para a maquete.', 'Mesmo formato do QUI-03, com nível de aprofundamento acadêmico.', 'Subsecretarias', 'Média'],
    ['QUI-05', 'Validação pedagógica', 'Conteúdo não validado.', 'Indicar o especialista ou a instituição parceira que revisará as perguntas e as explicações.', 'GAB', 'Média'],
    ['QUI-06', 'Conteúdos para aprofundamento', 'Links para os eixos e para "O Rio em dados".', 'Materiais de estudo por tema (textos, vídeos, publicações), com título e link, exibidos ao final do quiz.', 'Subsecretarias', 'Baixa'],
  ]},
  { cod: 'DAD', nome: 'O Rio em dados: indicadores e mapa de oportunidades', desc: 'Painel com três indicadores, mapa interativo dos 92 municípios e o botão do Observatório do Desenvolvimento.', campos: [
    ['DAD-01', 'Textos da seção', '"O Rio em dados" + "Indicadores, investimentos, cadeias produtivas e vocações regionais em um painel interativo."', 'Validar os textos (descrição até 120 caracteres).', 'ASCOM', 'Média'],
    ['DAD-02', 'Indicador: PIB do Estado', 'R$ 1,1 trilhão · +2,4% (2023). Valor ilustrativo do protótipo.', 'Valor oficial, variação, ano de referência, fonte (ex.: IBGE/CEPERJ) e data da última atualização.', 'DADOS', 'Alta'],
    ['DAD-03', 'Indicador: Empregos formais', '3,8 milhões · +3,1% (2023). Valor ilustrativo.', 'Valor oficial, variação, período, fonte (ex.: RAIS/Novo CAGED) e data da última atualização.', 'DADOS', 'Alta'],
    ['DAD-04', 'Indicador: Investimentos', 'R$ 19 bilhões · +18% (2023). Valor ilustrativo.', 'Definir o conceito (anunciados, contratados ou realizados), o valor, o período, a fonte e a data da última atualização.', 'DADOS / SUBICS', 'Alta'],
    ['DAD-05', 'Periodicidade de atualização dos indicadores', 'Não definida.', 'Para cada indicador: periodicidade (mensal, trimestral, anual), responsável pela atualização e forma de envio (planilha, API).', 'DADOS', 'Alta'],
    ['DAD-06', 'Mapa: dados por município', 'Mapa real dos 92 municípios (malha IBGE). Vocações por região e pontos de setor ilustrativos.', 'Planilha com uma linha por município: código IBGE, região de governo, setor de destaque, vocações econômicas, principais oportunidades/projetos, links e fonte.', 'DADOS / Subsecretarias', 'Alta'],
    ['DAD-07', 'Mapa: critério dos pontos de setor', 'Legenda: Energia · Indústria · Comércio e Serviços · Inovação.', 'Definir o critério para classificar cada município (ex.: maior participação no VAB, projetos ativos) e validar as quatro categorias da legenda.', 'DADOS', 'Média'],
    ['DAD-08', 'Mapa: recorte regional', '8 Regiões de Governo (classificação CEPERJ).', 'Confirmar o recorte oficial a ser usado e a composição de cada região.', 'DADOS', 'Média'],
    ['DAD-09', 'Observatório do Desenvolvimento ("Acessar painel de dados")', 'Abre página simulada.', 'Ferramenta e endereço do painel (ex.: Power BI publicado), indicadores disponíveis, filtros (setor, período, região) e responsável técnico.', 'DADOS / TI', 'Alta'],
    ['DAD-10', 'Dados abertos', 'Não existente na maquete.', 'Conjuntos de dados que serão publicados (CSV/API), licença de uso e dicionário de dados.', 'DADOS / TI', 'Baixa'],
    ['DAD-11', 'Cartão "Destaque"', '"Porto do Rio: mais competitividade para o estado" + texto, foto e link.', 'Título (até 55 caracteres), texto (até 120), foto (mínimo 800×600 px), página de destino e critério/frequência de troca do destaque.', 'ASCOM', 'Média'],
  ]},
  { cod: 'NOT', nome: 'Notícias e histórias que transformam', desc: 'Quatro notícias recentes em cartões, com editoria, data, título, resumo e foto.', campos: [
    ['NOT-01', 'Textos da seção', '"Notícias e histórias que transformam" + parágrafo e botão "Ver todas as notícias".', 'Validar os textos (parágrafo até 160 caracteres).', 'ASCOM', 'Média'],
    ['NOT-02', 'Notícias exibidas (4 cartões)', 'Quatro notícias ilustrativas, datadas de abril de 2024.', 'Para cada notícia: título (até 80 caracteres), resumo (até 120), data, editoria, foto (mínimo 800×500 px, com crédito) e link para a matéria.', 'ASCOM', 'Alta'],
    ['NOT-03', 'Editorias e cores', 'Inovação, Economia do Mar, Indústria, Sociedade.', 'Lista oficial de editorias (categorias) e a cor de cada uma, alinhada às cores dos eixos.', 'ASCOM', 'Média'],
    ['NOT-04', 'Origem das notícias', 'Conteúdo fixo na maquete.', 'Informar se as notícias virão do site atual (migração), de feed RSS ou do CMS do novo site, e o volume a migrar.', 'ASCOM / TI', 'Alta'],
    ['NOT-05', 'Histórias que transformam', 'Não diferenciadas na maquete.', 'Pauta inicial de histórias (pessoas, empresas, municípios), com autorização de uso de imagem e voz dos participantes.', 'ASCOM / JUR', 'Baixa'],
  ]},
  { cod: 'AGE', nome: 'Agenda: eventos e oportunidades', desc: 'Lista de próximos eventos, chamadas públicas e missões, com data e link.', campos: [
    ['AGE-01', 'Textos da seção', '"Eventos e oportunidades" + parágrafo e botão "Ver agenda completa".', 'Validar os textos.', 'ASCOM', 'Média'],
    ['AGE-02', 'Eventos', 'Rio Innovation Week 2024 (15/abr, Rio de Janeiro). Ilustrativo.', 'Para cada evento: nome, data e horário, local (ou "on-line"), descrição curta, link de inscrição e programação.', 'Subsecretarias / ASCOM', 'Alta'],
    ['AGE-03', 'Editais e chamadas públicas', 'Edital de Fomento à Economia Azul (inscrições até 28/04). Ilustrativo.', 'Número do edital, objeto, público, período de inscrições, situação (aberto/encerrado/em breve), edital em PDF e link de inscrição.', 'Subsecretarias / JUR', 'Alta'],
    ['AGE-04', 'Missões empresariais', 'Missão Energia e Transição Energética (10/mai, Houston, EUA). Ilustrativo.', 'Destino, datas, setores, critérios de participação de empresas e contato.', 'SUBICS / SUBEM', 'Média'],
    ['AGE-05', 'Fluxo de atualização da agenda', 'Não definido.', 'Quem cadastra, quem aprova e com que antecedência os itens entram na agenda; regra de retirada após a data.', 'ASCOM', 'Média'],
  ]},
  { cod: 'BAN', nome: 'Banner final: "Juntos por um Rio de mais oportunidades"', desc: 'Faixa de encerramento com foto e chamada para conhecer a Secretaria.', campos: [
    ['BAN-01', 'Título e texto', '"Juntos por um Rio de mais oportunidades" + "Desenvolvimento econômico que gera negócios, empregos e mais qualidade de vida para todos."', 'Validar os textos (título até 45 caracteres; texto até 110).', 'ASCOM', 'Baixa'],
    ['BAN-02', 'Foto', 'Família observando a Baía de Guanabara (imagem da proposta).', 'Foto oficial (mínimo 2200×300 px, panorâmica), com autorização de uso de imagem das pessoas retratadas.', 'ASCOM / JUR', 'Média'],
    ['BAN-03', 'Botão "Conheça a SEDES"', 'Abre "Quem somos".', 'Confirmar o texto e o destino.', 'ASCOM', 'Baixa'],
  ]},
  { cod: 'ROD', nome: 'Rodapé, atendimento e conformidade legal', desc: 'Informações institucionais e links obrigatórios para portais públicos.', campos: [
    ['ROD-01', 'Endereço e contato', 'Não exibidos na maquete.', 'Endereço completo, CEP, telefone, e-mail institucional e horário de atendimento.', 'GAB', 'Alta'],
    ['ROD-02', 'Redes sociais', 'Não exibidas na maquete.', 'Endereços oficiais (Instagram, LinkedIn, YouTube, Facebook, outras).', 'ASCOM', 'Média'],
    ['ROD-03', 'Ouvidoria', 'Abre página simulada.', 'Link oficial da Ouvidoria e canais de atendimento.', 'OUV', 'Alta'],
    ['ROD-04', 'Acesso à Informação (e-SIC) e Transparência', 'Abre página simulada.', 'Links oficiais do e-SIC e do Portal da Transparência; conteúdo da seção "Acesso à Informação" exigido pela Lei nº 12.527/2011.', 'GAB / OUV', 'Alta'],
    ['ROD-05', 'Privacidade e LGPD', 'Abre página simulada.', 'Política de privacidade, política de cookies, nome e e-mail do encarregado de dados (Lei nº 13.709/2018) e texto do aviso de cookies.', 'LGPD / JUR', 'Alta'],
    ['ROD-06', 'Declaração de acessibilidade', 'Abre página simulada.', 'Texto sobre os recursos de acessibilidade do portal (e-MAG), canal para relatar barreiras e data da última avaliação.', 'TI / ASCOM', 'Média'],
  ]},
  { cod: 'PAG', nome: 'Páginas internas (destinos dos links)', desc: 'Na maquete, os links abrem páginas simuladas. Estas são as páginas que precisam de conteúdo próprio para o lançamento.', campos: [
    ['PAG-01', 'Quem somos', 'Resumo simulado.', 'Missão, visão, competências, histórico e estrutura organizacional (organograma), conforme o Decreto nº 50.447/2026 e alterações.', 'GAB', 'Alta'],
    ['PAG-02', 'Subsecretarias e equipe', 'Lista simulada dos três eixos.', 'Para cada subsecretaria: titular (nome, cargo, foto, minicurrículo), atribuições, contato e equipe dirigente.', 'GAB', 'Alta'],
    ['PAG-03', 'Legislação', 'Decretos nº 50.447/2026 e nº 50.472/2026; Resolução SEDES nº 217/2026.', 'Lista de atos normativos com número, data, ementa e arquivo PDF (ou link para o Diário Oficial).', 'JUR', 'Alta'],
    ['PAG-04', 'Central de oportunidades', 'Página simulada.', 'Taxonomia dos filtros (perfil, tema, situação) e cadastro inicial de oportunidades: editais, programas, fomento, eventos e serviços.', 'Subsecretarias', 'Alta'],
    ['PAG-05', 'Fale conosco', 'Página simulada.', 'Campos do formulário, assuntos disponíveis, e-mail/área que recebe cada assunto e prazo de resposta.', 'GAB / TI', 'Alta'],
    ['PAG-06', 'Notícias (listagem) e Agenda (completa)', 'Páginas simuladas.', 'Regras de listagem (ordem, quantidade por página, filtros por editoria e tipo).', 'ASCOM', 'Média'],
  ]},
  { cod: 'TRA', nome: 'Requisitos transversais', desc: 'Informações que afetam o portal como um todo.', campos: [
    ['TRA-01', 'Textos alternativos das imagens', 'Descrições provisórias escritas para a maquete.', 'Descrição de cada imagem para leitores de tela (até 125 caracteres), entregue junto com a foto.', 'ASCOM', 'Alta'],
    ['TRA-02', 'Manual de marca e identidade', 'Paleta, fonte e estilo extraídos da proposta.', 'Manual de identidade visual do Governo do Estado / SEDES: cores oficiais (códigos), tipografia licenciada e regras de aplicação.', 'ASCOM', 'Alta'],
    ['TRA-03', 'Gestão de conteúdo (CMS) e perfis', 'Não aplicável à maquete.', 'Plataforma do CMS, lista de editores por subsecretaria e perfis de acesso (redator, revisor, publicador).', 'TI / ASCOM', 'Alta'],
    ['TRA-04', 'Domínio e hospedagem', 'Arquivo HTML estático.', 'Domínio oficial (ex.: subdomínio de rj.gov.br), ambiente de hospedagem, certificado HTTPS e responsável técnico.', 'TI', 'Alta'],
    ['TRA-05', 'Métricas de uso', 'Não implementadas.', 'Ferramenta de medição compatível com a LGPD e as metas por jornada (ex.: acessos a editais, uso do mapa, quizzes concluídos).', 'ASCOM / TI', 'Média'],
    ['TRA-06', 'Idiomas', 'Somente português.', 'Definir se haverá versões em inglês e espanhol (recomendado para "Quero investir no RJ") e quem fará a tradução.', 'GAB', 'Baixa'],
  ]},
];

// ---------- ativos de imagem ----------
const IMAGENS = [
  ['HER-06', 'Hero (fundo)', '2560 × 1000 px', 'Paisagem do Rio; área esquerda limpa para o texto', 'ASCOM'],
  ['HER-07', 'Miniatura do vídeo', '1280 × 720 px', 'Quadro representativo do vídeo institucional', 'ASCOM'],
  ['EIX-04', 'Eixo Energia e Mar', '1200 × 400 px', 'Energia, plataforma, porto ou costa', 'SUBEM'],
  ['EIX-07', 'Eixo Inovação', '1200 × 400 px', 'Pesquisa, tecnologia, startups', 'SUBINOV'],
  ['EIX-10', 'Eixo Indústria', '1200 × 400 px', 'Indústria, comércio ou serviços no RJ', 'SUBICS'],
  ['QUI-02', 'Estude o Rio', '1400 × 800 px', 'Estudantes; autorização de imagem obrigatória', 'ASCOM'],
  ['DAD-11', 'Destaque', '800 × 600 px', 'Tema do destaque vigente', 'ASCOM'],
  ['NOT-02', 'Notícias (4)', '800 × 500 px cada', 'Foto da matéria, com crédito', 'ASCOM'],
  ['BAN-02', 'Banner final', '2200 × 300 px', 'Panorâmica com pessoas; autorização de imagem', 'ASCOM'],
  ['CAB-01/02', 'Marcas', 'Vetor (SVG/PDF)', 'SEDES RJ e assinatura do Governo', 'ASCOM'],
];

// ---------- montagem ----------
const PORTRAIT_W = 11906 - 2 * 1134; // A4 com margens de 2 cm
const LAND_W = 16838 - 2 * 1000;

function capa() {
  const w = PORTRAIT_W;
  const infoW = [2800, w - 2800];
  const info = [
    ['Órgão', 'Secretaria de Desenvolvimento Econômico do Estado do Rio de Janeiro (SEDES)'],
    ['Projeto', 'Novo site institucional da SEDES'],
    ['Documento', 'Levantamento de conteúdos e informações pendentes da página inicial'],
    ['Versão', '1.0 (minuta para preenchimento)'],
    ['Data', '09/11/2026'],
    ['Situação', 'Em preenchimento'],
    ['Responsável pela consolidação', '[preencher: nome e área]'],
  ];
  return [
    new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 200, after: 500 }, children: [
      new ImageRun({ type: 'png', data: brasao, transformation: { width: 255, height: 90 }, altText: { title: 'Governo do Estado do Rio de Janeiro', description: 'Assinatura do Governo do Estado do Rio de Janeiro', name: 'brasao-capa' } })] }),
    new Paragraph({ spacing: { after: 60 }, children: [t('SECRETARIA DE DESENVOLVIMENTO ECONÔMICO', { bold: true, color: NAVY, size: 22, characterSpacing: 40 })] }),
    new Paragraph({ spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: CYAN, space: 10 } }, children: [t('SEDES RJ', { bold: true, color: BLUE, size: 22 })] }),
    table([w], [new TableRow({ children: [new TableCell({ width: { size: w, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: NAVY },
      margins: { top: 360, bottom: 360, left: 360, right: 360 }, borders: borders(NAVY), children: [
        new Paragraph({ spacing: { after: 120 }, children: [t('DOCUMENTO TÉCNICO', { color: CYAN, bold: true, size: 20, characterSpacing: 60 })] }),
        new Paragraph({ spacing: { after: 160 }, children: [t('Novo Site SEDES', { color: 'FFFFFF', bold: true, size: 52 })] }),
        new Paragraph({ spacing: { after: 0 }, children: [t('Levantamento de conteúdos e campos pendentes de informação da página inicial', { color: 'FFFFFF', size: 28 })] }),
      ] })] })]),
    spacer(300),
    table(infoW, info.map(([k, v]) => new TableRow({ children: [cell(k, infoW[0], { bold: true, color: NAVY, fill: LIGHT, size: 18 }), cell(v, infoW[1], { size: 18, fill: v.startsWith('[') ? YELLOW : undefined })] }))),
    spacer(400),
    new Paragraph({ children: [t('Rio de Janeiro é mais forte quando desenvolve.', { italics: true, color: BLUE, size: 24 })] }),
    new Paragraph({ spacing: { before: 120 }, children: [t('Documento de trabalho, de uso interno. Os conteúdos da maquete citados neste documento são ilustrativos e devem ser substituídos pelas informações oficiais.', { size: 16, color: GREY })] }),
  ];
}

function intro() {
  const out = [];
  out.push(h1('Controle de versões'));
  const vw = [1200, 1600, 2800, PORTRAIT_W - 5600];
  out.push(table(vw, [headRow(['Versão', 'Data', 'Responsável', 'Descrição da alteração'], vw, 17),
    new TableRow({ children: [cell('1.0', vw[0], { size: 17 }), cell('09/11/2026', vw[1], { size: 17 }), cell('Equipe do projeto', vw[2], { size: 17 }), cell('Minuta inicial gerada a partir da maquete da página inicial.', vw[3], { size: 17 })] }),
    ...[1, 2, 3].map(() => new TableRow({ children: vw.map(x => cell('', x, { fill: YELLOW })) })),
  ]));
  out.push(spacer(200));
  out.push(h1('Sumário'));
  out.push(new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-2' }));
  out.push(body('Para atualizar o sumário no Word: clique com o botão direito sobre ele e escolha **Atualizar campo**.', { spacing: { before: 120 } }));
  out.push(new Paragraph({ children: [new PageBreak()] }));

  out.push(h1('1. Objetivo'));
  out.push(body('Este documento reúne, em um só lugar, **todos os campos da página inicial do novo site da SEDES que dependem de informação oficial**. Ele foi elaborado a partir da maquete navegável aprovada na proposta "Novo Site SEDES" e serve para:'));
  out.push(bullet('identificar o que precisa ser fornecido, em que formato e por quem;'));
  out.push(bullet('registrar o conteúdo definitivo de cada campo, já validado;'));
  out.push(bullet('acompanhar o andamento das pendências até o lançamento do portal.'));
  out.push(callout('Importante:', 'na maquete, textos, números, notícias, eventos e fotos são **ilustrativos** (vindos do protótipo da proposta). Nenhum deles deve ir ao ar sem validação.'));

  out.push(h1('2. Como preencher este documento'));
  out.push(h2('2.1 Passo a passo'));
  [
    'Localize a sua área na coluna **Responsável** do inventário (Seção 4). As siglas estão explicadas no item 2.4.',
    'Leia a coluna **Informação necessária e regras**: ela diz o que enviar e os limites de tamanho.',
    'Escreva o conteúdo final na coluna **Conteúdo definitivo** (células em amarelo). Se o conteúdo for longo ou for um arquivo, escreva onde ele está (pasta, link ou número do processo SEI).',
    'Atualize a coluna **Status** conforme a legenda do item 2.2.',
    'Envie fotos e arquivos seguindo as especificações da Seção 5, nomeando cada arquivo com o ID do campo (ex.: **HER-06_foto-hero.jpg**).',
    'Ao concluir, registre a versão no Controle de versões e encaminhe para validação (Seção 6).',
  ].forEach(x => out.push(num(x)));

  out.push(h2('2.2 Legenda de status'));
  const sw = [2000, PORTRAIT_W - 2000];
  out.push(table(sw, [headRow(['Status', 'Significado'], sw, 17),
    ...[['Pendente', 'Informação ainda não fornecida.', YELLOW], ['Em elaboração', 'A área responsável está produzindo o conteúdo.', ORANGE_BG], ['Em validação', 'Conteúdo enviado, aguardando aprovação (ASCOM/Gabinete).', LIGHT], ['Validado', 'Conteúdo aprovado e pronto para publicação.', GREEN_BG], ['Não se aplica', 'O campo não será usado no lançamento (registrar o motivo).', 'EDEDED']]
      .map(([a, b, c]) => new TableRow({ children: [cell(a, sw[0], { bold: true, fill: c, size: 17 }), cell(b, sw[1], { size: 17 })] }))]));

  out.push(h2('2.3 Legenda de prioridade'));
  const pw = [2000, PORTRAIT_W - 2000];
  out.push(table(pw, [headRow(['Prioridade', 'Critério'], pw, 17),
    new TableRow({ children: [cell('Alta', pw[0], { bold: true, fill: RED_BG, size: 17 }), cell('Impede o lançamento: obrigatória para colocar o site no ar.', pw[1], { size: 17 })] }),
    new TableRow({ children: [cell('Média', pw[0], { bold: true, fill: ORANGE_BG, size: 17 }), cell('Necessária no lançamento, mas pode usar uma versão provisória aprovada.', pw[1], { size: 17 })] }),
    new TableRow({ children: [cell('Baixa', pw[0], { bold: true, fill: GREEN_BG, size: 17 }), cell('Pode ser entregue depois do lançamento.', pw[1], { size: 17 })] }),
  ]));

  out.push(h2('2.4 Siglas das áreas responsáveis'));
  out.push(body('As siglas abaixo são **sugestões** para este levantamento. Ajuste-as à estrutura oficial da Secretaria (Decreto nº 50.447/2026 e alterações) e informe o nome de cada pessoa de referência.'));
  const aw = [1600, 4200, PORTRAIT_W - 5800];
  const areas = [['ASCOM', 'Comunicação / Assessoria de Comunicação'], ['GAB', 'Gabinete da Secretaria'], ['SUBEM', 'Subsecretaria de Energia e Economia do Mar'], ['SUBINOV', 'Subsecretaria de Inovação'], ['SUBICS', 'Subsecretaria de Indústria, Comércio e Serviços'], ['DADOS', 'Inteligência econômica / Observatório'], ['TI', 'Tecnologia da informação / equipe de desenvolvimento'], ['JUR', 'Assessoria jurídica'], ['LGPD', 'Encarregado(a) de proteção de dados'], ['OUV', 'Ouvidoria']];
  out.push(table(aw, [headRow(['Sigla', 'Área', 'Pessoa de referência (nome e e-mail)'], aw, 17),
    ...areas.map(([a, b]) => new TableRow({ children: [cell(a, aw[0], { bold: true, color: NAVY, size: 17 }), cell(b, aw[1], { size: 17 }), cell('', aw[2], { fill: YELLOW })] }))]));

  out.push(h2('2.5 Regras gerais de redação'));
  [
    '**Linguagem simples:** frases curtas, voz ativa e palavras do dia a dia. Evite siglas sem explicação.',
    '**Respeite os limites de caracteres** indicados: eles garantem que o texto caiba no layout, inclusive no celular.',
    '**Números sempre com fonte e data** de atualização (ex.: "Fonte: IBGE, 2023. Atualizado em out/2026").',
    '**Fotos com crédito e autorização de uso**; pessoas identificáveis exigem termo de autorização de imagem (menores, com assinatura dos responsáveis).',
    '**Acessibilidade:** toda imagem precisa de texto alternativo e todo vídeo precisa de legendas e transcrição.',
  ].forEach(x => out.push(bullet(x)));

  out.push(h1('3. Estrutura da página inicial'));
  out.push(body('A página inicial está organizada em blocos, de cima para baixo. Cada bloco tem um prefixo usado nos IDs dos campos do inventário.'));
  const ew = [1100, 3300, PORTRAIT_W - 4400 - 1000, 1000];
  out.push(table(ew, [headRow(['Prefixo', 'Bloco', 'Função', 'Campos'], ew, 17),
    ...SECOES.map(s => new TableRow({ cantSplit: true, children: [cell(s.cod, ew[0], { bold: true, color: BLUE, size: 17 }), cell(s.nome, ew[1], { bold: true, color: NAVY, size: 17 }), cell(s.desc, ew[2], { size: 16 }), cell(String(s.campos.length), ew[3], { size: 17, align: AlignmentType.CENTER, bold: true })] })),
    new TableRow({ children: [cell('Total', ew[0] + ew[1] + ew[2], { span: 3, bold: true, fill: LIGHT, size: 17, align: AlignmentType.RIGHT }), cell(String(SECOES.reduce((a, s) => a + s.campos.length, 0)), ew[3], { bold: true, fill: LIGHT, size: 17, align: AlignmentType.CENTER })] }),
  ]));
  return out;
}

function inventario() {
  const out = [];
  out.push(h1('4. Inventário de campos pendentes de informação'));
  out.push(body('Cada linha corresponde a um campo da página. As colunas em **amarelo** devem ser preenchidas pela área responsável. A coluna "Atual na maquete" mostra o que está provisoriamente no protótipo.'));
  // ID, Campo, Atual, Informação necessária, Responsável, Prioridade, Status, Conteúdo definitivo
  const W = [800, 1750, 2350, 3300, 1250, 1050, 950];
  W.push(LAND_W - W.reduce((a, b) => a + b, 0));
  const pri = { Alta: RED_BG, 'Média': ORANGE_BG, Baixa: GREEN_BG };
  SECOES.forEach((s, idx) => {
    out.push(h2(`4.${idx + 1} ${s.cod} · ${s.nome}`));
    out.push(body(s.desc, { spacing: { after: 100 } }));
    out.push(table(W, [headRow(['ID', 'Campo', 'Atual na maquete', 'Informação necessária e regras', 'Responsável', 'Prioridade', 'Status', 'Conteúdo definitivo (preencher)'], W, 15),
      ...s.campos.map(([id, campo, atual, info, resp, prio]) => new TableRow({ cantSplit: true, children: [
        cell(id, W[0], { bold: true, color: BLUE, size: 15 }),
        cell(campo, W[1], { bold: true, color: NAVY, size: 15 }),
        cell(atual, W[2], { size: 15, color: GREY }),
        cell(info, W[3], { size: 15 }),
        cell(resp, W[4], { size: 15 }),
        cell(prio, W[5], { size: 15, bold: true, fill: pri[prio], align: AlignmentType.CENTER }),
        cell('Pendente', W[6], { size: 15, fill: YELLOW, align: AlignmentType.CENTER }),
        cell('', W[7], { fill: YELLOW }),
      ] }))]));
    out.push(spacer(80));
  });
  return out;
}

function fechamento() {
  const out = [];
  out.push(h1('5. Especificações das imagens e arquivos'));
  out.push(body('As fotos da maquete foram recortadas da apresentação e servem apenas como referência de enquadramento. Para o lançamento, envie arquivos oficiais conforme a tabela.'));
  const iw = [1300, 2100, 1900, PORTRAIT_W - 1300 - 2100 - 1900 - 1300, 1300];
  out.push(table(iw, [headRow(['Campo', 'Uso', 'Tamanho mínimo', 'Conteúdo e cuidados', 'Responsável'], iw, 16),
    ...IMAGENS.map(r => new TableRow({ cantSplit: true, children: r.map((x, i) => cell(x, iw[i], { size: 16, bold: i === 0, color: i === 0 ? BLUE : undefined })) }))]));
  out.push(h2('5.1 Requisitos para todos os arquivos'));
  [
    '**Formato:** JPG (fotos) com qualidade alta; PNG ou SVG (marcas e ícones). Perfil de cor sRGB.',
    '**Nome do arquivo:** ID do campo + descrição curta, sem acentos ou espaços (ex.: EIX-04_plataforma-bacia-de-campos.jpg).',
    '**Metadados:** crédito do autor, data, local e termo de autorização (quando houver pessoas identificáveis).',
    '**Texto alternativo:** descrição objetiva da imagem para leitores de tela (até 125 caracteres).',
    '**Imagens geradas por inteligência artificial:** evitar no portal oficial. Se forem usadas, identificar como tal.',
  ].forEach(x => out.push(bullet(x)));

  out.push(h1('6. Fluxo de validação e governança editorial'));
  out.push(body('Conforme a proposta, **cada subsecretaria será responsável pela atualização dos seus conteúdos** e a **Comunicação manterá a unidade visual, a linguagem e a qualidade das publicações**.'));
  const fw = [600, 2600, 2600, PORTRAIT_W - 5800];
  const etapas = [['1', 'Produção', 'Área responsável', 'Preenche o campo e anexa arquivos.'], ['2', 'Revisão de linguagem', 'ASCOM', 'Ajusta a redação, os limites e a padronização visual.'], ['3', 'Conferência técnica', 'DADOS / JUR / LGPD', 'Valida números, fontes, aspectos legais e de privacidade (quando aplicável).'], ['4', 'Aprovação final', 'GAB', 'Aprova o conteúdo para publicação.'], ['5', 'Publicação', 'TI / ASCOM', 'Publica no CMS e confere no site (desktop e celular).']];
  out.push(table(fw, [headRow(['Etapa', 'Atividade', 'Quem', 'O que faz'], fw, 17),
    ...etapas.map(r => new TableRow({ cantSplit: true, children: r.map((x, i) => cell(x, fw[i], { size: 17, bold: i < 2, color: i < 2 ? NAVY : undefined, align: i === 0 ? AlignmentType.CENTER : undefined })) }))]));

  out.push(h2('6.1 Cronograma de entrega'));
  const cw = [3600, 2200, PORTRAIT_W - 5800];
  out.push(table(cw, [headRow(['Marco', 'Data prevista', 'Observações'], cw, 17),
    ...['Entrega dos campos de prioridade Alta', 'Entrega dos campos de prioridade Média', 'Validação final (Gabinete)', 'Carga de conteúdo no CMS', 'Testes com usuários e acessibilidade', 'Lançamento do portal', 'Entrega dos campos de prioridade Baixa']
      .map(m => new TableRow({ children: [cell(m, cw[0], { size: 17 }), cell('[dd/mm/aaaa]', cw[1], { size: 17, fill: YELLOW }), cell('', cw[2], { fill: YELLOW })] }))]));

  out.push(h1('7. Termo de validação'));
  out.push(body('Declaramos que os conteúdos registrados neste documento foram revisados e estão aprovados para publicação no novo site institucional da Secretaria de Desenvolvimento Econômico.'));
  const tw = [3000, 2800, 1600, PORTRAIT_W - 7400];
  out.push(table(tw, [headRow(['Nome', 'Cargo / Área', 'Data', 'Assinatura'], tw, 17),
    ...[0, 1, 2, 3].map(() => new TableRow({ height: { value: 700, rule: 'atLeast' }, children: tw.map(x => cell('', x, { fill: YELLOW })) }))]));
  out.push(spacer(300));
  out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [t('Governo do Estado do Rio de Janeiro · Secretaria de Desenvolvimento Econômico', { color: NAVY, bold: true, size: 18 })] }));
  out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [t('Rio de Janeiro é mais forte quando desenvolve.', { italics: true, color: BLUE, size: 18 })] }));
  return out;
}

const heading = (size, color, before, after) => ({ run: { font: FONT, size, bold: true, color }, paragraph: { spacing: { before, after }, keepNext: true, keepLines: true } });
const doc = new Document({
  creator: 'SEDES RJ', title: 'Novo Site SEDES — Levantamento de conteúdos', description: 'Documento técnico de campos pendentes de informação da página inicial do novo site da SEDES',
  styles: {
    default: { document: { run: { font: FONT, size: 20, color: '1F2A3D' } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, ...heading(30, NAVY, 360, 160) },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, ...heading(24, BLUE, 280, 120) },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, ...heading(21, NAVY, 200, 80) },
      { id: 'Corpo', name: 'Corpo de texto', basedOn: 'Normal', quickFormat: true, run: { font: FONT, size: 20 }, paragraph: { spacing: { after: 100, line: 300 } } },
    ],
  },
  numbering: { config: [
    { reference: 'marcadores', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } }, run: { color: BLUE } } }] },
    { reference: 'passos', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } }, run: { color: NAVY, bold: true } } }] },
  ] },
  features: { updateFields: true },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: capa() },
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1400, bottom: 1134, left: 1134, right: 1134, header: 600, footer: 500 } } }, headers: { default: header(PORTRAIT_W) }, footers: { default: footer(PORTRAIT_W) }, children: intro() },
    { properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 1300, bottom: 1000, left: 1000, right: 1000, header: 500, footer: 450 } } }, headers: { default: header(LAND_W) }, footers: { default: footer(LAND_W) }, children: inventario() },
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1400, bottom: 1134, left: 1134, right: 1134, header: 600, footer: 500 } } }, headers: { default: header(PORTRAIT_W) }, footers: { default: footer(PORTRAIT_W) }, children: fechamento() },
  ],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('ok', OUT, b.length, 'bytes ·', SECOES.reduce((a, s) => a + s.campos.length, 0), 'campos'); });
