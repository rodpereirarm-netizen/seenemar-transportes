# SisControle SEDES — Controle Interno e Auditoria

Sistema de Controle Interno e Auditoria da Secretaria de Estado de Desenvolvimento Econômico do Rio de Janeiro (SEDES/RJ).
Área demandante: Assessoria de Controle Interno (ASCOIN). PO: Assessoria de Gestão Estratégica.

> Projeto independente, hospedado nesta subpasta do repositório por decisão do PO (sem custo adicional).
> Não compartilha código nem banco com o GT PROPAG.

## Situação atual

| Etapa | Situação |
|---|---|
| 8.1 — Modelo de dados, matriz RLS, telas e plano de 10 dias | Aprovado com as decisões abaixo |
| Maquete v1 (tema escuro neutro) | `maquete/` e `SisControle_SEDES_maquete.html` |
| Maquete v2 (azul institucional, relatórios com várias assinaturas, pool de checklists, trilha legível) | `maquete-v2/` e `SisControle_SEDES_maquete_v2.html` |
| Maquete v3 (temas institucional, claro e escuro; faixa de notícias no topo; Configurações; Manutenção; guia da assinatura; cadastro de processo com abertura automática do checklist) | `maquete-v3/` e `SisControle_SEDES_maquete_v3.html` |
| Maquete v4 (melhorias da análise: faixa só no painel, status simples para áreas, prazo do órgão em coluna, pareceres, busca global, assinatura sequencial com recusa e substituto, reincidência por tema, resumo diário para o SEI, checklist com anexos e salvamento automático, menu com Configurações e Manutenção em subitens) | `maquete-v4/` e `SisControle_SEDES_maquete_v4.html` |
| Imagens do passo a passo da assinatura | `docs/assinatura/` |
| Migrations, RLS, Edge Functions, PWA | Próxima etapa |

## Decisões do PO (13/11/2026)

1. **Repositório:** subpasta `siscontrole-sedes/` neste repositório, sem custo adicional.
2. **Consolidação e ciência da CHEGAB:** por **demanda**. A ciência leva todos os itens consolidados juntos. Pode ser revista.
3. **Itens restritos:** visíveis para admin, ascoin, responsável designado e gestores com `acesso_restrito`.
4. **Independência da Auditoria (Art. 11, §1º):** o `admin` **não** vê trabalhos de auditoria restritos.
5. **E-mail:** por enquanto, alertas **somente no sistema**. Usuários criados direto no banco. A fila de e-mail fica pronta para ligar um SMTP depois.
6. **Prorrogação:** padrão de até 50% do prazo original, 1 pedido por item. Tudo parametrizável.
7. **Gestores:** CHEGAB e Secretário veem tudo; Subsecretários veem a própria árvore. **Um papel por usuário.**

## Maquete

Abra `maquete/index.html` no navegador. Use **Ver como** no topo para trocar de perfil
(ASCOIN, ponto focal DGAF, ponto focal ATI, CHEGAB, SUBEXE, Auditoria, Administrador).
A data de referência é fixa em 13/11/2026 para os prazos fazerem sentido.

Telas: início por papel, painel executivo, demandas, detalhe da demanda (fluxo até a ciência da CHEGAB),
item de acompanhamento (histórico, evidências, prorrogação), pendências, prorrogações, checklists
(modelos versionados, amostragem, preenchimento, assinatura), relatórios, notificações, lixeira,
trilha de auditoria, administração, login, troca de senha no primeiro acesso, verificação pública
de assinatura e prévias da Fase 2 (auditoria e riscos).

## Pendências com a área

- Planilha base da ASCOIN (importação) e tabela de checklists de convênios em uso
- Lista completa de vinculadas e siglas das coordenadorias da DGAF
- Validação do conjunto de status
- Brasão/logo e manual de identidade visual do Governo do RJ
- Volume de demandas (por ano e abertas hoje)

## Escopo proposto (análise de melhorias)

| Entra no MVP (10 dias) | Fica para a fase 1.5 |
|---|---|
| Demandas, itens, fluxo até a ciência da CHEGAB | Agenda/calendário |
| Alertas no sistema e resumo diário para o SEI | Catálogo de widgets e painel personalizável |
| Painel executivo fixo (por perfil) | Perfis personalizados |
| Checklists com parecer e assinatura sequencial | Temas claro e escuro (fica o institucional) |
| Trilha de auditoria, lixeira, exclusão lógica | Manutenção completa (no MVP: backups e rotinas) |
| Importação da planilha base | Faixa de notícias |

## Distribuição (passo 2) — decisões de 16/11/2026

1. Cada demanda tem um **analista da ASCOIN**. A fila de cada analista mostra só as demandas dele; a Assessora vê também toda a ASCOIN.
2. **Só a ASCOIN distribui** (Regimento, Art. 10, VII). CHEGAB e subsecretarias entram apenas com a ciência.
3. O ponto focal pode **encaminhar o item para uma subárea**. O prazo não muda, a ASCOIN é avisada e a área de origem continua responsável.
4. Ao confirmar o recebimento, o ponto focal indica o **responsável na área** (opcional também na distribuição).
5. **Lembrete de ciência**: 2 dias sem confirmação, aviso ao ponto focal; 3 dias, aviso à chefia da área. Ajustável.
6. **Itens conjuntos ficam fora do MVP**: um item por área.

Também: área sem pré-seleção na distribuição, prazo sugerido = prazo do órgão menos 5 dias, e distribuição de vários itens de uma vez.

## Atendimento pela área (passo 3) — decisões de 16/11/2026

1. **Colaborador da área**: perfil derivado do ponto focal que vê e responde só os itens em que foi designado.
2. **Rascunho automático** da resposta (texto e anexos); só segue ao clicar em "Enviar".
3. **Validação da chefia** opcional, ligada por botão área por área (Configurações › Validação da chefia). Vale para as subáreas. A chefia aprova ou devolve à equipe; o prazo continua correndo.
4. **Evidência obrigatória**, com exceção justificada ("Não há documento a anexar").
5. **Dúvida à ASCOIN** no próprio item, sem parar o prazo; o analista responde no histórico.
6. **Resposta parcial fora do MVP**: entregas em partes viram mais itens na distribuição.

Agenda: ao passar o mouse sobre um dia, uma caixa lista os eventos daquele dia.
