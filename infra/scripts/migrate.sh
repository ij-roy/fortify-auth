#!/usr/bin/env bash
set -euo pipefail

echo "Running migrations..."
for f in /migrations/*.sql; do
  echo "Applying $f"
  psql "postgres://app:app@db:5432/app" -v ON_ERROR_STOP=1 -f "$f"
done
echo "Migrations done."