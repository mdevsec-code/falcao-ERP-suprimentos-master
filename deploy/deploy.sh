#!/usr/bin/env bash
# Publica a versão atual no VPS: código, dependências, build, migrations e reinício.
# Rode como o usuário da aplicação, na pasta do projeto:
#
#   cd /var/www/falcao-erp && bash deploy/deploy.sh            # branch main
#   BRANCH=feat/minha-branch bash deploy/deploy.sh             # outra branch
set -euo pipefail

cd "$(dirname "$0")/.."
BRANCH="${BRANCH:-main}"

if [[ ! -f .env ]]; then
  echo "Falta o .env na raiz (copie de deploy/env.production.example)." >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a; source .env; set +a
: "${VITE_API_URL:?Defina VITE_API_URL no .env (ex.: https://suprimentos.seudominio.com.br/api/v1).}"

echo "==> Código ($BRANCH)"
git fetch --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Dependências"
npm ci

echo "==> Prisma client e migrations"
npm run prisma:generate -w apps/api
npm run prisma:deploy -w apps/api

echo "==> Build (tipos compartilhados, API e Web com VITE_API_URL=$VITE_API_URL)"
npm run build

echo "==> Reinicia a API"
pm2 startOrReload deploy/ecosystem.config.cjs --env production
pm2 save

echo "==> Conferindo a API"
sleep 3
if curl -fsS "http://127.0.0.1:${PORT:-3333}/api/v1/health" >/dev/null; then
  echo "API respondendo."
else
  echo "A API não respondeu em /api/v1/health — veja: pm2 logs falcao-erp-api" >&2
  exit 1
fi
