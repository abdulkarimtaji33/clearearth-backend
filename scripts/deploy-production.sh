#!/usr/bin/env bash
# ClearEarth production deploy (VPS: Ubuntu + nginx + PM2).
# Server layout:
#   /var/www/clearearth-backend   — API repo, PM2 name clearearth-api, node src/server.js, port from .env (nginx → 3000)
#   /var/www/clearearth-frontend  — SPA repo, Vite build → dist/, nginx root
#   nginx: /etc/nginx/sites-available/clearearth → static + proxy /api and /uploads to Node
#
# Usage (Git Bash / WSL / macOS / Linux):
#   chmod +x scripts/deploy-production.sh
#   ./scripts/deploy-production.sh
#
# Env overrides:
#   DEPLOY_HOST=root@72.60.223.25  GIT_BRANCH=main  SKIP_MIGRATE=1  SKIP_NGINX_RELOAD=1

set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-root@72.60.223.25}"
GIT_BRANCH="${GIT_BRANCH:-main}"
BACKEND_DIR="${BACKEND_DIR:-/var/www/clearearth-backend}"
FRONTEND_DIR="${FRONTEND_DIR:-/var/www/clearearth-frontend}"
PM2_NAME="${PM2_NAME:-clearearth-api}"

echo "==> Deploying to ${DEPLOY_HOST} (branch: ${GIT_BRANCH})"

ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${DEPLOY_HOST}" \
  "GIT_BRANCH='${GIT_BRANCH}' BACKEND_DIR='${BACKEND_DIR}' FRONTEND_DIR='${FRONTEND_DIR}' PM2_NAME='${PM2_NAME}' SKIP_MIGRATE='${SKIP_MIGRATE:-}' SKIP_NGINX_RELOAD='${SKIP_NGINX_RELOAD:-}' bash -s" <<'REMOTE'
set -euo pipefail

echo "---- Backend: ${BACKEND_DIR} ----"
cd "${BACKEND_DIR}"
git fetch origin
git reset --hard "origin/${GIT_BRANCH}"
npm ci --omit=dev
if [[ -z "${SKIP_MIGRATE:-}" ]]; then
  npm run run-migration
else
  echo "(skipped npm run run-migration — set SKIP_MIGRATE unset to run)"
fi
if pm2 describe "${PM2_NAME}" >/dev/null 2>&1; then
  pm2 restart "${PM2_NAME}" --update-env
else
  echo "PM2 app ${PM2_NAME} not found; starting..."
  pm2 start src/server.js --name "${PM2_NAME}" --cwd "${BACKEND_DIR}"
  pm2 save
fi

echo "---- Frontend: ${FRONTEND_DIR} ----"
cd "${FRONTEND_DIR}"
git fetch origin
git reset --hard "origin/${GIT_BRANCH}"
npm ci
npm run build

if [[ -z "${SKIP_NGINX_RELOAD:-}" ]]; then
  nginx -t
  systemctl reload nginx
else
  echo "(skipped nginx reload)"
fi

echo "---- Done ----"
pm2 list | head -20
REMOTE

echo "==> Finished."
