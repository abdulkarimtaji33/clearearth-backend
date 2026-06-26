#!/usr/bin/env bash
set -euo pipefail
PRIMARY="${PRIMARY:-root@72.60.223.25}"
SECONDARY="${SECONDARY:-root@72.60.222.81}"
BACKEND="/var/www/clearearth-backend"
FRONTEND="/var/www/clearearth-frontend"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_FRONTEND_ENV="${HERE}/../../clearearth-frontend/.env"
TMP="/tmp/clearearth-env-sync-$$"
mkdir -p "$TMP"

echo "==> Backend .env: ${PRIMARY} -> ${SECONDARY}"
scp "$PRIMARY:${BACKEND}/.env" "$TMP/backend.env"
scp "$TMP/backend.env" "$SECONDARY:${BACKEND}/.env"

echo "==> Frontend .env.production"
scp "$PRIMARY:${FRONTEND}/.env.production" "$TMP/frontend.env.production" 2>/dev/null || echo "VITE_API_URL=/api/v1" > "$TMP/frontend.env.production"

MAPS_KEY=""
if grep -qE '^VITE_GOOGLE_MAPS_API_KEY=AIza' "$TMP/frontend.env.production" 2>/dev/null; then
  MAPS_KEY="$(grep -E '^VITE_GOOGLE_MAPS_API_KEY=' "$TMP/frontend.env.production" | cut -d= -f2-)"
elif [[ -f "$LOCAL_FRONTEND_ENV" ]]; then
  MAPS_KEY="$(grep -E '^VITE_GOOGLE_MAPS_API_KEY=' "$LOCAL_FRONTEND_ENV" | cut -d= -f2- | tr -d '\r' || true)"
  if [[ "$MAPS_KEY" == "your_google_maps_api_key_here" ]]; then MAPS_KEY=""; fi
fi
if [[ -z "$MAPS_KEY" ]]; then
  MAPS_KEY="$(ssh "$PRIMARY" "grep -roh 'AIzaSy[A-Za-z0-9_-]\{30,\}' ${FRONTEND}/dist/assets/*.js 2>/dev/null | head -1" || true)"
fi
if [[ -z "$MAPS_KEY" ]]; then
  echo "ERROR: No Google Maps API key found on primary or in local clearearth-frontend/.env" >&2
  exit 1
fi

cat > "$TMP/frontend.env.production" <<EOF
VITE_API_URL=/api/v1
VITE_GOOGLE_MAPS_API_KEY=${MAPS_KEY}
EOF

echo "==> Upload .env.production to primary and secondary (same config)"
scp "$TMP/frontend.env.production" "$PRIMARY:${FRONTEND}/.env.production"
scp "$TMP/frontend.env.production" "$SECONDARY:${FRONTEND}/.env.production"
rm -rf "$TMP"

for HOST in "$PRIMARY" "$SECONDARY"; do
  echo "==> Rebuild frontend on ${HOST}..."
  ssh "$HOST" "cd ${FRONTEND} && npm run build"
done

echo "==> Restart API on ${SECONDARY}..."
ssh "$SECONDARY" "cd ${BACKEND} && pm2 restart clearearth-api --update-env"

echo "==> Env sync complete."
