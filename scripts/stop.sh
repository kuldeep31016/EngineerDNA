#!/usr/bin/env bash
# Stop the EngineerDNA stack (keeps data volumes).
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Stopping EngineerDNA…"
docker compose down
