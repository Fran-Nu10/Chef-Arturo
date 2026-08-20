#!/usr/bin/env bash
# Aplica el shim, todas las migraciones y las pruebas sobre una base limpia.
#
#   PGHOST=/tmp PGPORT=54322 PGUSER=postgres ./supabase/tests/run.sh
#
# Contra un Supabase local (`supabase start`) sobrarían el shim y la creación
# de la base: `supabase db reset` ya aplica las migraciones.
set -euo pipefail

DB="${TEST_DB:-chef_arturo_test}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "▸ Recreando $DB"
psql -q -c "drop database if exists $DB" -c "create database $DB"

echo "▸ Shim de Supabase (auth, roles, storage)"
psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$RAIZ/supabase/tests/00_shim.sql"

echo "▸ Migraciones"
for f in "$RAIZ"/supabase/migrations/*.sql; do
  printf '  · %s\n' "$(basename "$f")"
  psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$f"
done

echo "▸ Pruebas de RLS, pedidos, stock, pagos e imágenes"
for t in "$RAIZ"/supabase/tests/0[1-9]_*.sql; do
  psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$t"
done
