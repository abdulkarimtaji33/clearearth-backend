#!/usr/bin/env bash
# Sync uploads from primary to secondary (run ON primary VPS).
set -euo pipefail

SECONDARY_HOST="${SECONDARY_HOST:-root@72.60.222.81}"
SRC="${SRC:-/var/www/clearearth-backend/uploads}"
DST="${DST:-/var/www/clearearth-backend/uploads}"

echo "==> Rsync uploads to ${SECONDARY_HOST}..."
rsync -az --delete "${SRC}/" "${SECONDARY_HOST}:${DST}/"
echo "==> Uploads sync complete."
