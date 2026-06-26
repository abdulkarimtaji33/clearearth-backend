#!/usr/bin/env bash
# Sync clearearth_erp MySQL from primary (72.60.223.25) to secondary (72.60.222.81).
# Run ON the primary VPS: bash scripts/sync-db-to-secondary.sh
set -euo pipefail

SECONDARY_HOST="${SECONDARY_HOST:-root@72.60.222.81}"
BACKEND_DIR="${BACKEND_DIR:-/var/www/clearearth-backend}"
DUMP="/tmp/clearearth_erp_sync.sql.gz"

cd "$BACKEND_DIR"
set -a
# shellcheck disable=SC1091
source .env
set +a

echo "==> Dumping ${DB_NAME} from primary..."
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  --single-transaction --routines --triggers | gzip > "$DUMP"

echo "==> Restoring on ${SECONDARY_HOST}..."
scp -o StrictHostKeyChecking=accept-new "$DUMP" "${SECONDARY_HOST}:/tmp/clearearth_erp_sync.sql.gz"
ssh -o StrictHostKeyChecking=accept-new "$SECONDARY_HOST" bash -s <<REMOTE
set -euo pipefail
set -a
source ${BACKEND_DIR}/.env
set +a
gunzip -c /tmp/clearearth_erp_sync.sql.gz | mysql -h "\$DB_HOST" -u "\$DB_USER" -p"\$DB_PASSWORD" "\$DB_NAME"
rm -f /tmp/clearearth_erp_sync.sql.gz
cd ${BACKEND_DIR} && node scripts/check-db.js
REMOTE

rm -f "$DUMP"
echo "==> DB sync complete."
