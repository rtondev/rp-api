#!/usr/bin/env bash
set -euo pipefail

# Diagnóstico rápido de 502 na API
# Uso: bash deploy/diagnose-api.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$PROJECT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

API_PORT="${API_HOST_PORT:-${API_PORT:-${PORT:-6000}}}"

echo "=== .env (portas) ==="
grep -E '^(PORT|API_PORT|API_HOST_PORT)=' .env 2>/dev/null || echo "(sem .env)"

echo ""
echo "=== Docker ==="
docker compose -f docker-compose.prod.yml ps 2>/dev/null || docker compose ps 2>/dev/null || echo "compose não encontrado"

echo ""
echo "=== Porta ${API_PORT} no host ==="
ss -tlnp | grep ":${API_PORT} " || echo "Nada escutando em ${API_PORT}"

echo ""
echo "=== CORS (.env) ==="
grep '^CORS_ORIGINS=' .env 2>/dev/null || echo "CORS_ORIGINS não definido (API usa padrão de produção se NODE_ENV=production)"

echo ""
echo "=== Preflight CORS (simula www.rotapotiguar.com) ==="
curl -sv -X OPTIONS "http://127.0.0.1:${API_PORT}/auth/login" \
  -H "Origin: https://www.rotapotiguar.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  2>&1 | grep -iE 'HTTP/|access-control' || true

echo ""
curl -sv "http://127.0.0.1:${API_PORT}/" 2>&1 | tail -n 15

echo ""
echo "=== Últimos logs da API ==="
docker compose -f docker-compose.prod.yml logs --tail=20 api 2>/dev/null || true
