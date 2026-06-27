#!/usr/bin/env bash
set -euo pipefail

# Corrige proxy nginx a partir do .env (resolve 502 por porta errada)
# Uso na VPS:
#   cd ~/rp-api
#   sudo bash deploy/sync-nginx.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOMAIN="api.rotapotiguar.com"
NGINX_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Execute como root: sudo bash deploy/sync-nginx.sh"
  exit 1
fi

cd "$PROJECT_DIR"

# shellcheck disable=SC1091
set -a
source .env
set +a

API_PORT="${API_HOST_PORT:-${API_PORT:-${PORT:-6000}}}"

echo "==> Porta da API no .env: ${API_PORT}"

echo "==> Verificando container..."
if ! docker compose -f docker-compose.prod.yml ps --status running 2>/dev/null | grep -q api; then
  echo "AVISO: container api não está rodando."
  echo "       docker compose -f docker-compose.prod.yml up -d --build"
fi

echo "==> Testando API em 127.0.0.1:${API_PORT}..."
if curl -sf "http://127.0.0.1:${API_PORT}/" >/dev/null; then
  echo "OK: API respondeu."
else
  echo "ERRO: API NÃO responde em 127.0.0.1:${API_PORT}"
  echo ""
  echo "Confira o .env (produção):"
  echo "  PORT=6000"
  echo "  API_PORT=6000"
  echo "  API_HOST_PORT=6000"
  echo ""
  echo "Depois recrie o container:"
  echo "  docker compose -f docker-compose.prod.yml up -d --build"
  echo ""
  docker compose -f docker-compose.prod.yml ps || true
  docker compose -f docker-compose.prod.yml logs --tail=30 api || true
  exit 1
fi

echo "==> Gerando nginx a partir do .env..."
bash "${SCRIPT_DIR}/render-nginx-config.sh"

if [[ -f "$NGINX_AVAILABLE" ]]; then
  echo "==> Atualizando proxy_pass no nginx existente (inclui bloco SSL)..."
  sed -i -E "s|proxy_pass http://127.0.0.1:[0-9]+/?;|proxy_pass http://127.0.0.1:${API_PORT};|g" "$NGINX_AVAILABLE"
else
  echo "==> Instalando site nginx..."
  cp "${SCRIPT_DIR}/nginx-api.conf" "$NGINX_AVAILABLE"
  ln -sf "$NGINX_AVAILABLE" "/etc/nginx/sites-enabled/${DOMAIN}"
fi

echo "==> Recarregando nginx..."
nginx -t
systemctl reload nginx

echo ""
echo "Pronto. Proxy: https://${DOMAIN} → 127.0.0.1:${API_PORT}"
curl -sfI "https://${DOMAIN}/" | head -n 3 || curl -sfI "http://127.0.0.1:${API_PORT}/" | head -n 3
