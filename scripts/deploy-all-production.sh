#!/usr/bin/env bash
# Deploy Clearearth to every production VPS (comma-separated DEPLOY_HOSTS).
#
# Usage (Git Bash):
#   chmod +x scripts/deploy-all-production.sh
#   ./scripts/deploy-all-production.sh
#
# Env:
#   DEPLOY_HOSTS=root@72.60.223.25,root@72.60.222.81
#   GIT_BRANCH=main  SKIP_MIGRATE=  SKIP_NGINX_RELOAD=

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_HOSTS="${DEPLOY_HOSTS:-root@72.60.223.25,root@72.60.222.81}"

# Sync Maps key from sibling frontend .env when deploying from monorepo layout
if [[ -z "${VITE_GOOGLE_MAPS_API_KEY:-}" && -f "${HERE}/../../clearearth-frontend/.env" ]]; then
  VITE_GOOGLE_MAPS_API_KEY="$(grep -E '^VITE_GOOGLE_MAPS_API_KEY=' "${HERE}/../../clearearth-frontend/.env" | cut -d= -f2- || true)"
  export VITE_GOOGLE_MAPS_API_KEY
fi

IFS=',' read -ra HOSTS <<< "${DEPLOY_HOSTS}"
FAILED=()

for host in "${HOSTS[@]}"; do
  host="$(echo "${host}" | xargs)"
  [[ -z "${host}" ]] && continue
  echo ""
  echo "========== ${host} =========="
  if ! DEPLOY_HOST="${host}" VITE_GOOGLE_MAPS_API_KEY="${VITE_GOOGLE_MAPS_API_KEY:-}" bash "${HERE}/deploy-production.sh"; then
    FAILED+=("${host}")
    echo "!! Deploy failed for ${host}"
  fi
done

if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo ""
  echo "Failed hosts: ${FAILED[*]}"
  echo "If SSH was denied, add your public key on that VPS (see DEPLOYMENT.md) or run scripts/deploy-on-server.sh via Hostinger browser SSH."
  exit 1
fi

echo ""
echo "==> All hosts deployed."
