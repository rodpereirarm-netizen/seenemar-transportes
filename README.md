# GT PROPAG · Compras Públicas — Controle de contratações FAETEC

Micro SaaS para automatizar o fluxo de contratações do **GT PROPAG – Compras Públicas** (SEDES · SECTI · FAETEC · PRODERJ).
O foco é o **controle dos prazos legais, dos papéis e responsabilidades e das atividades** de cada contratação.

- **Front-end:** React 19 + Vite + TypeScript (SPA estática) — hospedado no **Netlify**
- **Back-end:** **Supabase** (Postgres com RLS, Auth, Storage) — toda regra crítica roda no banco

---

## O que o sistema faz

| Módulo | Conteúdo |
|---|---|
| **Painel** | Carteira, valor estimado, demandas sem justificativa, prazos legais em contagem, caminho crítico por etapa, andamento da Etapa I, distribuição por modalidade, contratações que pedem ação, pendências por responsável, qualidade do registro. Filtros por modalidade, etapa e responsável. |
| **Contratações** | Lista com busca, filtros e atalhos (em andamento, devolvidas, divergências, sem justificativa, sem responsável, prazo vencido). Visão **Planilha de andamento** editável com **listas suspensas** (espelho da PLANILHA ANDAMENTO GT). Exportação Excel. |
| **Nova contratação** | Cadastro em 5 blocos (identificação, PCA, enquadramento, responsáveis, documentos). Ao criar, o sistema **gera o checklist** conforme a modalidade, designa os responsáveis por etapa, avisa no sininho e registra na auditoria. |
| **Detalhe da contratação** | Checklist das atividades por etapa com status, responsável e prazo; **data de envio** inicia a contagem do prazo legal (com prorrogação); linha do tempo de andamentos; documentos (PDF, Word, Excel); histórico de auditoria da contratação; exportação da ficha. |
| **Minhas pendências** | Atividades de cada integrante: abertas, vencidas, a vencer em 5 dias, aguardando terceiros, contratações sob coordenação. Visão da equipe com a carga de todos. |
| **Atas de registro** | Catálogo de ARPs (adesão ou participação) com vigência e contratações vinculadas. |
| **Relatórios** | Report semanal, mensal e por período; carteira; prazos; pendências por integrante. Filtros por modalidade, etapa, situação, responsável e órgão. Exporta Excel e imprime/PDF. |
| **Equipe do GT** | 3 frentes, 15 integrantes, 4 órgãos, modelo de trabalho, matriz "quem faz o quê" por etapa, carga atual e perfis de acesso. |
| **Auditoria** | Quem, quando e o quê: cada inclusão, alteração e exclusão com os valores **antes e depois** de cada campo. Trilha gravada por trigger e imutável pela API. |
| **Manutenção (admin)** | Integrantes e perfis, listas suspensas, áreas demandantes, feriados, modelo das 32 atividades e prazos, modalidades × etapas. |

### Fluxo de contratação (base: documento do GT)

3 macroprocessos · 5 etapas · 32 atividades

| Etapa | Atividades | Executa | Prazo legal / atenção |
|---|---|---|---|
| I · Planejamento da contratação | 7 | Frente II (FAETEC/DGI · GT · VPA) | PCA/PEDTIC a confirmar |
| II · Adesão à ARP | 6 | Frente II | **Gate:** sem ata válida, o fluxo de ARP é interrompido |
| III · Comunicações e análises | 3 | Frente III (FAETEC) | **SEPLAG 15 dias corridos · PRODERJ 20 dias úteis (+20)** |
| IV · Pesquisa de preços | 7 | FAETEC | Sem ponto focal nomeado |
| V · Formalização e publicidade | 9 | FAETEC | **CGE 15 dias corridos** · sem ponto focal nomeado |

**Modalidades** (definem as etapas geradas): Adesão à ARP (I–V, 32 atividades) · Participante de RP (I, III–V; ETP do gerenciador reaproveitado) · Dispensa · Inexigibilidade · Licitação própria (I, III–V) · A definir (só Etapa I). Trocar a modalidade ajusta o checklist automaticamente.

**Contagem de prazos** (art. 183 da Lei 14.133/2021): exclui o dia do envio, inclui o do vencimento e prorroga o vencimento que cair em dia não útil. Dias úteis descontam fins de semana e a tabela de **feriados** (nacionais, RJ e município do Rio 2026–2027, editável). O cálculo roda no banco (`fn_calcular_prazo`), no fuso de Brasília.

### Perfis de acesso

| Perfil | Quem (carga inicial) | Pode |
|---|---|---|
| **Administrador** | conta técnica | Tudo: integrantes, catálogos, exclusões, auditoria |
| **Coordenação** | Karina, Vinicius, Cristiane (Frente I) | Criar/editar contratações, designar responsáveis, aprovar, ver auditoria |
| **Conformidade** | Elias (Frente I) | Editar/validar atividades e situação, ver auditoria |
| **Elaboração de artefatos** | Frente II (8) | Atividades das Etapas I–II e as atribuídas a si; cadastrar atas; editar contratações em que atua |
| **Ponto focal FAETEC** | Jhonatan, Gibson, Luene (Frente III) | Editar dados das contratações (lançamento nos sistemas) e atividades das Etapas III–V |
| **Consulta** | — | Somente leitura |

As permissões são garantidas por **Row Level Security** no Postgres (`supabase/migrations/…_seguranca.sql`); o front-end apenas esconde o que o perfil não pode fazer.

---

## Implantação

### 1. Supabase

1. Crie um projeto em <https://supabase.com> (região `sa-east-1`, São Paulo).
2. Aplique as migrations **na ordem** — pelo SQL Editor (colando cada arquivo) ou pela CLI:
   ```bash
   npx supabase link --project-ref SEU_REF
   npx supabase db push
   ```
   Arquivos em `supabase/migrations/`:
   1. `…01_schema.sql` — tabelas e índices
   2. `…02_regras.sql` — prazos, checklist, notificações, auditoria e views
   3. `…03_seguranca.sql` — RLS por perfil e bucket `documentos` (privado, 50 MB, PDF/Word/Excel)
   4. `…04_carga_inicial.sql` — etapas, 32 atividades, 15 integrantes, listas, feriados, atas e as 17 demandas da planilha
3. **Defina o e-mail do administrador** (SQL Editor):
   ```sql
   update public.integrantes set email = 'seu.email@orgao.rj.gov.br'
    where papel = 'admin';
   ```
4. Em **Authentication › URL Configuration**, defina *Site URL* com a URL do Netlify (ex.: `https://gt-propag.netlify.app`) e inclua-a em *Redirect URLs*.
5. Copie em **Project Settings › API** a *Project URL* e a chave *anon/publishable*.

### 2. Netlify

1. *Add new site › Import from Git* e selecione este repositório. O `netlify.toml` já define build (`npm run build`), pasta `dist` e o redirecionamento de SPA.
2. Em *Site configuration › Environment variables*, crie:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. *Deploy*.

### 3. Primeiro acesso

1. O administrador entra por **Primeiro acesso** com o e-mail definido no passo 1.3, confirma o e-mail e faz login.
2. Em **Manutenção › Integrantes**, informa o e-mail institucional de cada integrante do GT (e ajusta o perfil, se preciso).
3. Cada integrante entra por **Primeiro acesso** com o próprio e-mail. **E-mails não cadastrados não conseguem criar conta** (bloqueio feito no banco). Desativar um integrante corta o acesso na hora.

### Desenvolvimento local

```bash
cp .env.example .env   # preencha URL e chave do Supabase
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + build de produção
```

---

## Estrutura

```
supabase/migrations/     schema, regras (triggers/funções/views), RLS + storage, carga inicial
src/lib/                 cliente Supabase, tipos, permissões, formatação, exportação Excel
src/components/          layout (menu + sininho), UI, upload, diff de auditoria
src/pages/               Painel, Contratações, Nova contratação, Detalhe, Pendências,
                         Atas, Relatórios, Equipe, Auditoria, Manutenção, Login
netlify.toml             build, SPA e cabeçalhos de segurança
```

### Regras que rodam no banco

- `fn_sincronizar_checklist` — gera/ajusta as atividades conforme a modalidade
- `fn_atividade_antes_gravar` — calcula `prazo_legal` a partir da data de envio (+ prorrogação), datas de início e conclusão
- `fn_propagar_responsavel_etapa` — responsável da etapa vai para as atividades abertas e é notificado
- `fn_atividade_depois_gravar` / `fn_andamento_inserido` — linha do tempo automática e notificações
- `fn_auditoria` — trilha completa em todas as tabelas de negócio e catálogos
- `fn_vincular_usuario` — só integrantes ativos cadastrados criam conta
- `fn_proteger_ultimo_admin` — o sistema nunca fica sem administrador
- Views `vw_contratacoes`, `vw_atividades`, `vw_carga_integrantes` (com `security_invoker`, respeitam o RLS)
