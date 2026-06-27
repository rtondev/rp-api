#!/usr/bin/env bash
set -euo pipefail

# Lê a porta da API do .env e gera deploy/nginx-api.conf
# Uso: bash deploy/render-nginx-config.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"
TEMPLATE="${SCRIPT_DIR}/nginx-api.conf.template"
OUTPUT="${SCRIPT_DIR}/nginx-api.conf"

read_api_port() {
  local port=""

  if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a
    source "$ENV_FILE"
    set +a
  fi

  port="${API_HOST_PORT:-${API_PORT:-${PORT:-6000}}}"
  echo "$port"
}

API_PORT="$(read_api_port)"

if [[ ! "$API_PORT" =~ ^[0-9]+$ ]]; then
  echo "Porta inválida no .env: ${API_PORT}"
  exit 1
fi

sed "s/__API_PORT__/${API_PORT}/g" "$TEMPLATE" > "$OUTPUT"

echo "nginx-api.conf gerado com proxy → 127.0.0.1:${API_PORT}"
echo "Arquivo: ${OUTPUT}"
