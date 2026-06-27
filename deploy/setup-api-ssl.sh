#!/usr/bin/env bash
set -euo pipefail

# Configura nginx + SSL (Let's Encrypt) para api.rotapotiguar.com
# Lê a porta do .env automaticamente.
#
# Uso na VPS:
#   cd ~/rp-api
#   sudo bash deploy/setup-api-ssl.sh seu@email.com

DOMAIN="api.rotapotiguar.com"
EMAIL="${1:-}"

if [[ -z "$EMAIL" ]]; then
  echo "Uso: sudo bash deploy/setup-api-ssl.sh seu@email.com"
  exit 1
fi

if [[ "$EUID" -ne 0 ]]; then
  echo "Execute como root (sudo)."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
NGINX_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

cd "$PROJECT_DIR"

set -a
# shellcheck disable=SC1091
source .env
set +a

API_PORT="${API_HOST_PORT:-${API_PORT:-${PORT:-6000}}}"

echo "==> Porta da API (.env): ${API_PORT}"

echo "==> Verificando API em 127.0.0.1:${API_PORT}..."
if ! curl -sf "http://127.0.0.1:${API_PORT}/" >/dev/null 2>&1; then
  echo "AVISO: API não respondeu em 127.0.0.1:${API_PORT}."
  echo "       Confira .env: PORT, API_PORT e API_HOST_PORT devem ser iguais (ex.: 6000)"
  echo "       docker compose -f docker-compose.prod.yml up -d --build"
  read -r -p "Continuar mesmo assim? [s/N] " ans
  [[ "${ans,,}" == "s" ]] || exit 1
fi

echo "==> Instalando nginx e certbot (se necessário)..."
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y nginx certbot python3-certbot-nginx curl
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y nginx certbot python3-certbot-nginx curl
else
  echo "Gerenciador de pacotes não suportado. Instale nginx e certbot manualmente."
  exit 1
fi

echo "==> Gerando nginx com porta ${API_PORT}..."
bash "${SCRIPT_DIR}/render-nginx-config.sh"
cp "${SCRIPT_DIR}/nginx-api.conf" "${NGINX_AVAILABLE}"
ln -sf "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"

echo "==> Testando nginx..."
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "==> Emitindo certificado SSL com certbot..."
certbot --nginx \
  -d "${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --redirect \
  --non-interactive

echo "==> Garantindo proxy_pass na porta ${API_PORT} após certbot..."
sed -i -E "s|proxy_pass http://127.0.0.1:[0-9]+/?;|proxy_pass http://127.0.0.1:${API_PORT};|g" "${NGINX_AVAILABLE}"
nginx -t && systemctl reload nginx

echo "==> Testando HTTPS..."
curl -sfI "https://${DOMAIN}/" | head -n 5 || true

echo ""
echo "Pronto."
echo "  API:  https://${DOMAIN}"
echo "  Proxy → 127.0.0.1:${API_PORT}"
