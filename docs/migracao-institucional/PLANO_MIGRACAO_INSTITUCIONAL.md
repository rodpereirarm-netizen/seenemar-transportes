# Plano de migração do sistema para o ambiente institucional da Secretaria

Status: **em espera** — retomar quando autorizado (fase 1 ainda não iniciada).
Registro feito em 16/10/2026.

## Objetivo
Institucionalizar o sistema: sair do Supabase em nuvem e rodar tudo no ambiente da Secretaria.

## Ambiente informado pela Secretaria
- Banco de dados PostgreSQL (capacidade ~10 GB)
- Servidor **somente Windows Server** (sem Linux/Docker)
- Gerenciamento e domínio institucional

## Levantamento do ambiente atual (consulta somente leitura, 16/10/2026)
| Item | Situação |
|---|---|
| Banco inteiro | 16 MB (dados do sistema ~3 MB; auditoria 1,6 MB, 4.750 registros) |
| Projetos / etapas | 69 projetos / 697 linhas de EAP |
| Usuários (login) | 9 |
| Anexos | 2 buckets (anexos-observacoes, anexos-mensagens), 1 arquivo (1,7 MB) |
| Tempo real | somente tabela `mensagens` |
| Edge Functions | nenhuma |
| Rotinas agendadas (cron) | nenhuma |
| Extensões | pg_stat_statements, uuid-ossp, pgcrypto, supabase_vault |
| PostgreSQL atual | 17.6 (mínimo recomendado no destino: 15+) |
| Regras de acesso | 23 tabelas com RLS, 57 políticas, 20 funções que usam o usuário logado (auth.uid) |

Conclusão: 10 GB sobram com folga. O ponto crítico não é espaço, e sim substituir os serviços do Supabase no Windows.

## Dependências do código (v33) em relação ao Supabase
| Serviço | Uso no código | Substituto no Windows |
|---|---|---|
| API de dados (PostgREST) | 65 chamadas `sb.from(...)` + 15 `sb.rpc(...)` | **PostgREST para Windows** (mesmo software; consultas não mudam) |
| Regras de acesso (RLS) | dependem de `auth.uid()` | ficam no PostgreSQL; PostgREST repassa a identidade do usuário (claims do JWT) |
| Login | `signInWithPassword`, `signOut`, `getSession` (2x), `updateUser` | serviço pequeno (Node.js ou .NET) que emite o token e reaproveita as senhas atuais (hash bcrypt) |
| Anexos | 6 usos de `sb.storage` | mesmo serviço grava em pasta do servidor |
| Tempo real | 2 `sb.channel` / `removeChannel` (mensagens e sino) | atualização automática periódica (polling) |

Funções RPC usadas: fn_cancelar_repactuacao, fn_conversa_direta, fn_conversa_leituras, fn_conversa_participantes, fn_conversa_projeto, fn_decidir_repactuacao, fn_decidir_solicitacao_eap, fn_desconsiderar_mensagem, fn_marcar_lida, fn_mensagens_pessoas, fn_mensagens_resumo, fn_registrar_mensagem_observacao, fn_renumerar_projeto, fn_salvar_ppa_loa, fn_solicitar_repactuacao.

## Plano em fases (cada fase com entrega e validação antes da próxima)
1. **Projeto técnico + protótipo** em ambiente de teste (sem tocar no sistema no ar): PostgreSQL + PostgREST + serviço de login/anexos; provar login, regras por perfil, anexos e mensagens.
2. **Nova versão das telas (v34-institucional)**: ajustar só login, anexos e mensagens; regressão completa de telas e perfis (gerente, sponsor, PMO, admin, executivo).
3. **Pacote de implantação para a TI**: scripts do banco, instalação/configuração do PostgREST e do serviço no Windows (como serviço), IIS, HTTPS no domínio institucional, backup e roteiro.
4. **Ensaio no servidor da Secretaria**, com o sistema atual funcionando em paralelo.
5. **Virada** em horário combinado; ambiente atual mantido como plano de volta por algumas semanas.

## Pendências com a TI da Secretaria (para a fase 3)
- Versão do Windows Server e do PostgreSQL
- Permissão para instalar serviços (PostgREST e Node.js ou .NET)
- Acesso ao IIS e certificado HTTPS do domínio institucional
- Responsável técnico do lado da TI; política de backup

## Observações
- A exportação completa do banco atual exige credencial que o assistente não possui: orientar o usuário a baixar pelo painel do Supabase no momento certo.
- Alternativa descartada pelo usuário: VM Linux com Supabase self-hosted (exigiria Linux/Docker, indisponível).
- Regras de trabalho: não alterar o banco sem autorização; não publicar; mockup → aprovação → implementação.
