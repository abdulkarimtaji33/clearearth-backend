#!/usr/bin/env bash
# Apply recyclingerp.com nginx config on this VPS (run on 72.60.222.81).
set -euo pipefail
CONF_SRC="${1:-/var/www/clearearth-backend/scripts/nginx-clearearth-recyclingerp.conf}"
CONF_DST="/etc/nginx/sites-available/clearearth"
cp "$CONF_SRC" "$CONF_DST"
ln -sf "$CONF_DST" /etc/nginx/sites-enabled/clearearth
nginx -t
systemctl reload nginx
echo "Nginx updated for recyclingerp.com"
