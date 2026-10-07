#!/usr/bin/env bash
# Aplica o schema num Postgres 16 local, limpo, e roda os testes de regra de negócio.
# Uso: testes/rodar.sh [nome_do_banco]      (padrão: sigc_teste; exige acesso de superusuário)
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${1:-sigc_teste}"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$DB")

dropdb --if-exists "$DB"
createdb "$DB"
"${PSQL[@]}" -f testes/00_stub_supabase.sql
for f in sql/[0-9][0-9]_*.sql; do
  case "$f" in *13_agendamentos.sql) continue ;; esac   # pg_cron só existe no Supabase
  echo "aplicando $f"
  "${PSQL[@]}" -f "$f"
done
for t in testes/t[0-9][0-9]_*.sql; do
  echo "== $t"
  "${PSQL[@]}" -f "$t"
done
