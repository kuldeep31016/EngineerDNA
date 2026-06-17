#!/usr/bin/env bash
# Stop the stack AND delete all data volumes (Postgres, Redis, Neo4j).
# Destructive — use when you want a clean slate.
set -euo pipefail
cd "$(dirname "$0")/.."

read -r -p "This deletes all local database data. Continue? [y/N] " reply
case "$reply" in
  [yY][eE][sS] | [yY]) ;;
  *)
    echo "Aborted."
    exit 0
    ;;
esac

echo "Resetting EngineerDNA (removing containers + volumes)…"
docker compose down -v
