# ClearEarth ERP – Complete Deployment Guide (Fresh Ubuntu VPS)

This guide covers deploying **clearearth-backend** and **clearearth-frontend** on a new Ubuntu VPS from scratch.

---

## Prerequisites

- Ubuntu 20.04 or 22.04 VPS (min 1GB RAM, 2 vCPU recommended)
- Root or sudo access
- Domain or server IP (e.g. `72.60.223.25`)

---

## Step 1: Server Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create app user (optional, for security)
sudo adduser clearearth
sudo usermod -aG sudo clearearth
# Or use root if preferred
```

---

## Step 2: Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # v18.x or higher
npm -v    # 9.x or higher
```

---

## Step 3: Install MySQL / MariaDB

```bash
sudo apt install -y mariadb-server mariadb-client

# Secure installation
sudo mysql_secure_installation
# Set root password, remove anonymous users, disable remote root, remove test DB

# Start and enable
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

---

## Step 4: Create Database and Import Schema

```bash
# Login to MySQL
sudo mysql -u root -p

# In MySQL shell:
CREATE DATABASE clearearth_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clearearth_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON clearearth_erp.* TO 'clearearth_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Import initial schema:**

Use the full schema SQL file (`clearearth_erp.sql` in backend folder, or `clearearth_erp (2).sql` from project root). Copy to server, then:

```bash
mysql -u clearearth_user -p clearearth_erp < /path/to/clearearth_erp.sql
```

Or, if you have the file locally, from your machine:

```bash
scp "clearearth_erp (2).sql" root@YOUR_SERVER_IP:/tmp/
# Then on server:
mysql -u clearearth_user -p clearearth_erp < /tmp/clearearth_erp\ \(2\).sql
```

---

## Step 5: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Step 6: Install PM2 (Node Process Manager)

```bash
sudo npm install -g pm2
```

---

## Step 7: Clone Repositories

```bash
sudo mkdir -p /var/www
cd /var/www

# Clone backend
sudo git clone https://github.com/abdulkarimtaji33/clearearth-backend.git
sudo chown -R $USER:$USER clearearth-backend

# Clone frontend
sudo git clone https://github.com/abdulkarimtaji33/clearearth-frontend.git
sudo chown -R $USER:$USER clearearth-frontend
```

---

## Step 8: Backend Setup

```bash
cd /var/www/clearearth-backend

# Install dependencies
npm install --production

# Create .env file
cp .env.example .env
nano .env   # or vim
```

**Edit `.env` with production values:**

```env
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database - use credentials from Step 4
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clearearth_erp
DB_USER=clearearth_user
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_DIALECT=mysql
DB_POOL_MAX=10
DB_POOL_MIN=2

# JWT - CHANGE THESE in production
JWT_SECRET=your_very_long_random_secret_key_min_32_chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=another_long_random_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Optional
BCRYPT_ROUNDS=10
UPLOAD_PATH=./uploads
CORS_ORIGIN=*
```

**Create uploads and logs directories:**

```bash
mkdir -p uploads logs
```

**Run migration** (adds tables, roles, super_admin, etc.):

```bash
node run-migration.js
```

You should see output ending with: `✅ Migration completed successfully!`

**Run seed** (creates permissions, assigns to tenant_admin):

```bash
node src/database/seed.js
```

---

## Step 9: Frontend Setup

```bash
cd /var/www/clearearth-frontend

# Install dependencies
npm install

# Create .env for production build
echo "VITE_API_URL=http://YOUR_SERVER_IP/api/v1" > .env.production
# Or if using domain:
# echo "VITE_API_URL=https://yourdomain.com/api/v1" > .env.production

# Build
npm run build
```

Build output will be in `dist/`.

---

## Step 10: PM2 – Start Backend

```bash
cd /var/www/clearearth-backend

pm2 start src/server.js --name clearearth-api

# Save PM2 config for restart on reboot
pm2 save
pm2 startup   # Run the command it prints (usually sudo env PATH=... pm2 startup systemd -u root --hp /root)
```

**Useful PM2 commands:**

```bash
pm2 status
pm2 logs clearearth-api
pm2 restart clearearth-api
pm2 stop clearearth-api
```

---

## Step 11: Nginx Configuration

Create/edit Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/clearearth
```

**Content** (replace `YOUR_SERVER_IP` with your IP or domain):

```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP;   # or yourdomain.com

    # Frontend (Vite build output)
    root /var/www/clearearth-frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads (static files from backend)
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

**Enable site and reload Nginx:**

```bash
sudo ln -sf /etc/nginx/sites-available/clearearth /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 12: Firewall (Optional)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (if adding SSL later)
sudo ufw enable
```

---

## Super Admin Login

After migration, super admin exists:

- **Email:** `superadmin@clearearth.com`
- **Password:** `SuperAdmin123!`

⚠️ **Change the password after first login.**

---

## Deployment Checklist

| Step | Action | Command |
|------|--------|---------|
| 1 | Update system | `sudo apt update && sudo apt upgrade -y` |
| 2 | Install Node.js 18+ | See Step 2 |
| 3 | Install MariaDB | `sudo apt install -y mariadb-server` |
| 4 | Create DB & import schema | `mysql ... < clearearth_erp.sql` |
| 5 | Install Nginx | `sudo apt install -y nginx` |
| 6 | Install PM2 | `sudo npm install -g pm2` |
| 7 | Clone repos | `git clone` both repos to `/var/www/` |
| 8 | Backend .env | Copy .env.example, fill DB + JWT secrets |
| 9 | Backend migrate | `node run-migration.js` |
| 10 | Backend seed | `node src/database/seed.js` |
| 11 | Frontend .env.production | `VITE_API_URL=http://YOUR_IP/api/v1` |
| 12 | Frontend build | `npm run build` |
| 13 | PM2 start | `pm2 start src/server.js --name clearearth-api` |
| 14 | PM2 startup | `pm2 save` + `pm2 startup` |
| 15 | Nginx config | Configure and reload |
| 16 | Test | Open `http://YOUR_IP` |

---

## Updating After Code Changes

```bash
# Backend
cd /var/www/clearearth-backend
git pull origin main
npm install --production
node run-migration.js    # If DB changes
pm2 restart clearearth-api

# Frontend
cd /var/www/clearearth-frontend
git pull origin main
npm install
npm run build
# No restart needed – Nginx serves static files
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **502 Bad Gateway** | Backend not running: `pm2 status`, `pm2 start clearearth-api` |
| **Database connection refused** | Check MariaDB: `sudo systemctl status mariadb` |
| **Migration fails** | Ensure base schema is imported first (Step 4) |
| **Frontend shows blank** | Check `VITE_API_URL` in .env.production matches server |
| **API 404** | Nginx proxy: ensure `location /api/` proxies to port 3000 |
| **Uploads 404** | Nginx: ensure `location /uploads/` proxies to backend |

**View logs:**

```bash
pm2 logs clearearth-api
sudo tail -f /var/log/nginx/error.log
```

---

## File Locations Summary

| Item | Path |
|------|------|
| Backend | `/var/www/clearearth-backend` |
| Frontend | `/var/www/clearearth-frontend` |
| Frontend build | `/var/www/clearearth-frontend/dist` |
| Backend .env | `/var/www/clearearth-backend/.env` |
| Uploads | `/var/www/clearearth-backend/uploads` |
| Nginx config | `/etc/nginx/sites-available/clearearth` |
