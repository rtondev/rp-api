#!/usr/bin/env bash
set -euo pipefail

# Cria/atualiza usuários iniciais no banco de produção.
# Uso na VPS:
#   cd ~/rp-api
#   bash deploy/seed-production.sh

COMPOSE_FILE="docker-compose.prod.yml"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Execute na pasta rp-api (onde está docker-compose.prod.yml)."
  exit 1
fi

echo "==> Rebuild da API (garante seed.js atualizado na imagem)..."
docker compose -f "$COMPOSE_FILE" up -d --build api

echo "==> Rodando seed..."
docker compose -f "$COMPOSE_FILE" exec api node prisma/seed.js

echo "==> Pronto."
