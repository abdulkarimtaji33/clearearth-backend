#!/usr/bin/env bash
# Run from dev machine (Git Bash) — pipes MySQL dump primary → secondary.
set -euo pipefail

PRIMARY="${PRIMARY:-root@72.60.223.25}"
SECONDARY="${SECONDARY:-root@72.60.222.81}"
BACKEND="/var/www/clearearth-backend"

echo "==> Syncing DB ${PRIMARY} -> ${SECONDARY}..."
ssh "$PRIMARY" "set -a; source <(sed 's/\r$//' ${BACKEND}/.env); set +a; mysqldump -h \"\$DB_HOST\" -u \"\$DB_USER\" -p\"\$DB_PASSWORD\" \"\$DB_NAME\" --single-transaction --routines --triggers | gzip" \
  | ssh "$SECONDARY" "set -a; source <(sed 's/\r$//' ${BACKEND}/.env); set +a; gunzip | mysql -h \"\$DB_HOST\" -u \"\$DB_USER\" -p\"\$DB_PASSWORD\" \"\$DB_NAME\""

echo "==> Verify secondary DB..."
ssh "$SECONDARY" "cd ${BACKEND} && node scripts/check-db.js"

echo "==> Syncing uploads via local temp..."
TMP="/tmp/clearearth-uploads-sync-$$"
rm -rf "$TMP"
mkdir -p "$TMP"
scp -r "$PRIMARY:${BACKEND}/uploads/." "$TMP/"
ssh "$SECONDARY" "mkdir -p ${BACKEND}/uploads"
scp -r "$TMP/." "$SECONDARY:${BACKEND}/uploads/"
rm -rf "$TMP"

ssh "$SECONDARY" "pm2 restart clearearth-api --update-env"
echo "==> Secondary sync complete."
