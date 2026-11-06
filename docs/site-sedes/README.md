# Novo site SEDES RJ · Maquete estática

Maquete em HTML estático da página inicial proposta em *Proposta_Novo_Site_SEDES_VS.2.pdf*.
Abra `index.html` direto no navegador; não precisa de build nem de servidor.

- `index.html`: página única com CSS e JS embutidos
- `img/`: fotos recortadas da própria apresentação (resolução de rascunho)

> Textos, números, datas e eventos são **ilustrativos**. Antes de publicar, substitua pelos conteúdos e pelas fontes oficiais.

## Identidade aplicada (vinda da proposta)

| Token | Cor | Uso |
|---|---|---|
| Azul-marinho | `#0a2252` | Títulos ("Introdução", "Rio de Janeiro"), rodapé |
| Azul institucional | `#1e88e5` | Destaques ("e contexto", "em movimento"), botão principal |
| Ciano | `#4fc3f7` | Traços de destaque, "acontece aqui." |
| Teal | `#159fb5` / `#5fd3e6` | Pilares Dinamismo e Acessibilidade |
| Eixo Energia e Mar | `#1e7be0` | Cor temática |
| Eixo Inovação | `#f07c12` (texto `#b85500`) | Cor temática |
| Eixo Indústria | `#2ea44f` (texto `#1f7a3a`) | Cor temática |
| Fundo | `#f4f8fd` | Fundo claro azulado dos slides |

- **Tipografia:** *Plus Jakarta Sans* (Google Fonts), uma sans geométrica parecida com a dos títulos dos slides; *Dancing Script* para a assinatura "Rio de Janeiro é mais forte quando desenvolve."
- **Elementos gráficos:** traço ciano sob os títulos, linha curva ("swoosh") no hero, cards arredondados com sombra suave e selos circulares com ícones nos eixos.

## Estrutura (na ordem do protótipo do slide 06)

1. Cabeçalho: SEDES RJ, menu com submenus, busca e brasão do Governo
2. Hero: "O futuro do Rio acontece aqui." + vídeo institucional
3. Caminhos por perfil: cidadão, empreendedor, investidor, inovação
4. Três eixos, com a cor temática de cada subsecretaria
5. **Estude o Rio:** quiz que funciona de verdade (educação básica e ensino superior, 5 perguntas cada, com explicações)
6. **O Rio em dados:** indicadores com fonte e data + **mapa clicável por região de governo**, com lista de seleção acessível e um destaque (Porto do Rio)
7. Notícias e histórias que transformam
8. Agenda com filtro (eventos, editais, missões)
9. Chamada final, newsletter e rodapé institucional

## Melhorias sugeridas

As marcadas com ✅ já estão na maquete.

### Acessibilidade e conformidade (portal público)
- ✅ **Barra de governo e acessibilidade:** atalhos de teclado (accesskey), A−/A/A+, alto contraste, Libras (VLibras) e link "Ir para o conteúdo".
- ✅ **Mapa com alternativa em texto:** cada região pode ser escolhida pelo teclado e por uma lista de seleção, como a proposta pede ("mapa com busca por município e dados em texto").
- ✅ **Banner de cookies (LGPD)** com opção "Só essenciais".
- ✅ **Vídeo com legendas, Libras e transcrição** (o espaço do player já traz essa orientação).
- ✅ **Contraste das cores dos eixos:** o laranja e o verde do protótipo não passam no WCAG AA quando usados em texto pequeno sobre fundo branco. A maquete usa tons mais escuros (`#b85500` e `#1f7a3a`) nos textos e mantém os tons vivos nos ícones.
- Usar o modelo de acessibilidade e-MAG e testar com leitor de tela (NVDA ou VoiceOver) antes de publicar.

### Arquitetura e navegação
- ✅ **"LGPD" e "Transparência" saíram do menu principal** e foram para a barra superior e o rodapé. Isso libera espaço no menu e cumpre a exigência legal (Acesso à Informação, e-SIC e Ouvidoria continuam sempre visíveis).
- ✅ **Busca global** com sugestões frequentes (atalho de teclado "/").
- ✅ **Submenus descritivos:** cada item tem uma linha de explicação, o que reduz cliques errados.
- **Ordem das seções:** o quiz tem público mais específico. Vale testar "O Rio em dados" logo após os eixos e o quiz mais abaixo, ou um bloco de quiz mais compacto. A maquete mantém a ordem da proposta.
- Criar páginas internas por eixo e por perfil, com trilha de navegação (breadcrumb).

### Conteúdo e dados
- ✅ **Fonte, data de atualização e download (CSV)** junto aos indicadores, o que dá credibilidade, um dos pilares da proposta.
- ✅ **Contadores animados** nos KPIs ("animações discretas").
- Ligar o painel a fontes oficiais (IBGE, Novo CAGED, CEPERJ) por API, para não depender de atualização manual.
- ✅ **Tipo de conteúdo nos cards de notícia** (vídeo, história que transforma), o que reforça a seção "Histórias que transformam".
- **Versões em EN/ES** da jornada "Quero investir no RJ" para o investidor estrangeiro (o seletor já aparece na barra).

### Relacionamento
- ✅ **Newsletter com alertas por tema** (editais e oportunidades) para trazer o visitante de volta.
- Agenda com o botão "Adicionar ao calendário" (.ics).

### Técnica e governança
- Gerar imagens em WebP/AVIF com `srcset`; as fotos atuais saíram do PDF e precisam ser trocadas pelos originais em alta resolução, com direitos de uso.
- Usar um CMS (por exemplo, WordPress ou Strapi) com perfis por subsecretaria, como a proposta prevê na "governança editorial", e um guia de estilo de conteúdo.
- Medir o uso com uma ferramenta respeitosa à LGPD (Matomo, por exemplo) e definir metas por jornada (cliques em editais, uso do mapa, quizzes concluídos).
- As fotos da proposta parecem geradas por IA. Para um portal oficial, vale usar o banco de imagens do Governo, de forma a evitar estranheza e questões de autenticidade.
