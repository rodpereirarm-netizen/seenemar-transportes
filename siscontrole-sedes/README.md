# SisControle SEDES — Controle Interno e Auditoria

Sistema de Controle Interno e Auditoria da Secretaria de Estado de Desenvolvimento Econômico do Rio de Janeiro (SEDES/RJ).
Área demandante: Assessoria de Controle Interno (ASCOIN). PO: Assessoria de Gestão Estratégica.

> Projeto independente, hospedado nesta subpasta do repositório por decisão do PO (sem custo adicional).
> Não compartilha código nem banco com o GT PROPAG.

## Situação atual

| Etapa | Situação |
|---|---|
| 8.1 — Modelo de dados, matriz RLS, telas e plano de 10 dias | Aprovado com as decisões abaixo |
| Maquete navegável com dados fictícios | `maquete/` (HTML + CSS + JS puro) |
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
