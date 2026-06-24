#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

BACKEND_DIR="/var/www/clearearth-backend"
FRONTEND_DIR="/var/www/clearearth-frontend"
DB_NAME="clearearth_erp"
DB_USER="clearearth"
DB_PASS="Clearearth2026"

echo "==> [1/6] Installing packages..."
apt-get update -qq
apt-get install -y -qq git curl nginx mariadb-server mariadb-client

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
npm install -g pm2
systemctl enable --now nginx mariadb

echo "==> [2/6] Setting up database user..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "==> [3/6] Cloning repos..."
mkdir -p /var/www
if [[ ! -d "${BACKEND_DIR}/.git" ]]; then
  git clone https://github.com/abdulkarimtaji33/clearearth-backend.git "${BACKEND_DIR}"
fi
if [[ ! -d "${FRONTEND_DIR}/.git" ]]; then
  git clone https://github.com/abdulkarimtaji33/clearearth-frontend.git "${FRONTEND_DIR}"
fi

echo "==> [4/6] Frontend env + nginx..."
cat > "${FRONTEND_DIR}/.env.production" <<'ENV'
VITE_API_URL=/api/v1
# Required for map search in collection details — get key from Google Cloud (Maps JS + Places + Geocoding)
VITE_GOOGLE_MAPS_API_KEY=
ENV

cat > /etc/nginx/sites-available/clearearth <<'NGINX'
# Clearearth — only on port 3333. Port :80 intentionally does NOT serve this app.
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 204;
}

server {
    listen 3333;
    listen [::]:3333;
    server_name _;

    root /var/www/clearearth-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/clearearth /etc/nginx/sites-enabled/clearearth
rm -f /etc/nginx/sites-enabled/default

echo "==> [5/6] npm install (backend)..."
cd "${BACKEND_DIR}"
npm ci --omit=dev

echo "==> [6/6] Ready for data import (.env, DB, uploads from old server)"
echo "Node: $(node -v) | npm: $(npm -v) | nginx: $(nginx -v 2>&1)"
