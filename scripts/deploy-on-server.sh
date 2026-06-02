#!/usr/bin/env bash
# Run this script ON the VPS as root (e.g. Hostinger browser SSH) when your PC cannot SSH in.
#   bash /var/www/clearearth-backend/scripts/deploy-on-server.sh
#
# Optional env:
#   GIT_BRANCH=main
#   VITE_GOOGLE_MAPS_API_KEY=AIza...   (written to frontend .env.production before build)
#   SKIP_MIGRATE=1

set -euo pipefail

GIT_BRANCH="${GIT_BRANCH:-main}"
BACKEND_DIR="${BACKEND_DIR:-/var/www/clearearth-backend}"
FRONTEND_DIR="${FRONTEND_DIR:-/var/www/clearearth-frontend}"
PM2_NAME="${PM2_NAME:-clearearth-api}"

echo "---- Backend: ${BACKEND_DIR} ----"
cd "${BACKEND_DIR}"
git fetch origin
git reset --hard "origin/${GIT_BRANCH}"
npm ci --omit=dev
if [[ -z "${SKIP_MIGRATE:-}" ]]; then
  npm run run-migration
else
  echo "(skipped run-migration)"
fi
if pm2 describe "${PM2_NAME}" >/dev/null 2>&1; then
  pm2 restart "${PM2_NAME}" --update-env
else
  pm2 start src/server.js --name "${PM2_NAME}" --cwd "${BACKEND_DIR}"
  pm2 save
fi

echo "---- Frontend: ${FRONTEND_DIR} ----"
cd "${FRONTEND_DIR}"
if [[ -n "${VITE_GOOGLE_MAPS_API_KEY:-}" ]]; then
  cat > .env.production <<EOF
VITE_API_URL=/api/v1
VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
EOF
  echo "  Wrote .env.production (Maps key set)"
elif [[ ! -f .env.production ]]; then
  echo "VITE_API_URL=/api/v1" > .env.production
  echo "  Created minimal .env.production (set VITE_GOOGLE_MAPS_API_KEY for map search)"
fi
git fetch origin
git reset --hard "origin/${GIT_BRANCH}"
npm ci
npm run build

nginx -t
systemctl reload nginx

echo "---- Deploy complete on $(hostname -I | awk '{print $1}') ----"
pm2 list | head -10
