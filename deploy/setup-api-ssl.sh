#!/usr/bin/env bash
set -euo pipefail

# Configura nginx + SSL (Let's Encrypt) para api.rotapotiguar.com
# Uso na VPS (como root):
#   cd /caminho/rp-api
#   sudo bash deploy/setup-api-ssl.sh seu@email.com
#
# Pré-requisitos:
#   - DNS: registro A de api.rotapotiguar.com → IP da VPS
#   - API rodando: docker compose -f docker-compose.prod.yml up -d
#   - Porta 6000 em 127.0.0.1: ss -tlnp | grep 6000

DOMAIN="api.rotapotiguar.com"
API_PORT="6000"
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
NGINX_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

echo "==> Verificando API em 127.0.0.1:${API_PORT}..."
if ! curl -sf "http://127.0.0.1:${API_PORT}/" >/dev/null 2>&1; then
  echo "AVISO: API não respondeu em 127.0.0.1:${API_PORT}."
  echo "       Suba o container antes: docker compose -f docker-compose.prod.yml up -d"
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

echo "==> Copiando config nginx..."
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

echo "==> Testando HTTPS..."
curl -sfI "https://${DOMAIN}/" | head -n 5 || true

echo ""
echo "Pronto."
echo "  API:  https://${DOMAIN}"
echo "  Proxy → 127.0.0.1:${API_PORT}"
echo ""
echo "Renovação automática: certbot renew (timer systemd já costuma estar ativo)."
echo "Testar renovação: certbot renew --dry-run"
