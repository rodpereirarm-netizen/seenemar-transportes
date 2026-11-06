# Novo site SEDES RJ · Maquete estática

Reprodução em HTML estático da página inicial proposta em *Proposta_Novo_Site_SEDES_VS.2.pdf* (protótipo dos slides 6 a 9).
Abra `index.html` direto no navegador; não precisa de build nem de servidor.

- `index.html`: página única com CSS, JS e a malha do mapa embutidos
- `img/`: imagens recortadas da própria apresentação, com o texto que vinha "queimado" nelas removido, para que o texto real do HTML fique por cima

## Fidelidade à proposta

- **Layout:** comparado lado a lado com os slides 7, 8 e 9 em 1334 px de largura, a mesma escala do protótipo. Ordem, medidas, cores, imagens e textos seguem a referência.
- **Paleta:** azul-marinho `#0a2252`, azul `#1e88e5`, ciano `#5cc3f7`, fundo `#f4f8fd` e as cores temáticas dos eixos (azul `#1d7fe6`, laranja `#f07c12`, verde `#2ba24c`).
- **Fonte:** *Plus Jakarta Sans*, sans geométrica equivalente à dos títulos da proposta.
- **Imagens:** fotos do hero, dos eixos, do "Estude o Rio", do destaque, das notícias, do banner final e o brasão colorido do Governo, todas tiradas do PDF.

## Mapa do Rio de Janeiro (O Rio em dados)

- **Malha:** os 92 municípios reais, a partir da malha municipal do IBGE (via `tbrugz/geodata-br`), simplificada e embutida em SVG.
- **Visual:** tons de azul por município e pontos coloridos por setor (Energia, Indústria, Comércio e Serviços, Inovação), como no slide 9. Os pontos são ilustrativos.
- **Interação:**
  - passar o mouse mostra o nome do município e a região;
  - clicar ou tocar abre o painel do município, com região, vocações e o botão "Ver oportunidades";
  - "Explore por região" abre a busca por município, com autocompletar, e o filtro por Região de Governo;
  - clicar na legenda liga e desliga os pontos de cada setor;
  - o mapa pode ser navegado pelo teclado (Tab e Enter).

## Interações (todas testadas)

Todos os elementos clicáveis respondem. Como as páginas internas ainda não existem, cada link abre uma página interna simulada, com título, resumo e imagem.

- **Menu:** submenus por clique e por passar o mouse; menu "hambúrguer" no celular; Esc fecha.
- **Busca:** lupa ou tecla "/"; encontra páginas e municípios (clicar num município leva ao mapa).
- **Vídeo:** o cartão do hero abre o modal do vídeo institucional.
- **Navegação geral:** perfis, "Saiba mais", tags dos eixos, KPIs, destaque, notícias, eventos, banner final e rodapé.
- **Quiz:** educação básica e ensino superior, 5 perguntas cada, com explicação, resultado, "Refazer" e "Sair".

Um teste automatizado no Playwright clica em cada elemento em 1334 px, 820 px e 390 px, sem erros no console e sem rolagem lateral.

> Textos, números, datas e eventos são os do protótipo e são **ilustrativos**. Antes de publicar, substitua pelos conteúdos e pelas fontes oficiais.

## Sugestões de melhoria (não aplicadas, para manter a fidelidade à proposta)

- Barra de acessibilidade (A+/A−, alto contraste, VLibras) e atalhos de teclado, conforme o e-MAG.
- Fonte e data de atualização junto aos indicadores, com download em CSV.
- Levar "LGPD" e "Transparência" para o rodapé ou para uma barra superior, liberando espaço no menu.
- Aviso de cookies (LGPD) e cadastro para receber editais por tema.
- Contraste: o laranja e o verde dos eixos não atingem o WCAG AA em texto pequeno; usar tons mais escuros em textos.
- Trocar as fotos, que parecem geradas por IA, por fotos reais do banco de imagens do Governo, em alta resolução.
- Versões em inglês e espanhol da jornada "Quero investir no RJ".
