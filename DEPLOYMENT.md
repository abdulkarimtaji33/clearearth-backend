# Clearearth production deploy

## Servers

| Host | URL | SSH | Paths |
|------|-----|-----|-------|
| **Dev** | http://72.60.222.81:3335/ | `ssh root@72.60.222.81` | `/var/www/clearearth-dev-frontend`, `/var/www/clearearth-dev-backend` |
| **Live** | http://72.60.222.81:3333/ and https://recyclingerp.com | `ssh root@72.60.222.81` | `/var/www/clearearth-frontend`, `/var/www/clearearth-backend` |

The old primary (`72.60.223.25`) is decommissioned. Dev and live now share `72.60.222.81`.

| | **Dev** | **Live** |
|---|---|---|
| **Frontend path** | `/var/www/clearearth-dev-frontend` | `/var/www/clearearth-frontend` |
| **Backend path** | `/var/www/clearearth-dev-backend` | `/var/www/clearearth-backend` |
| **API (Node)** | PM2 `clearearth-dev-api` → port **3001** | PM2 `clearearth-api` → port **3000** |
| **Frontend URL** | **:3335** | **:3333** and `recyclingerp.com` |
| **Web** | Nginx site `clearearth-dev`: static SPA from `dist/`; `/api` and `/uploads` → `http://127.0.0.1:3001` | Nginx site `clearearth`: static SPA from `dist/`; `/api` and `/uploads` → `http://127.0.0.1:3000` |
| **Database** | `clearearth_erp_dev` (own user/secrets; SMTP blanked) | `clearearth_erp` |
| **Port 80** | `dev.recyclingerp.com` / `dev.clearearth.com` (when DNS is set) | Do **not** serve the SPA on the bare IP. Production uses HTTPS on `recyclingerp.com`. |

## Git remotes (on server)

- Frontend: `https://github.com/abdulkarimtaji33/clearearth-frontend.git` — branch `main`
- Backend: `https://github.com/abdulkarimtaji33/clearearth-backend.git` — branch `main`

Push from your machine first, then deploy on the server.

---

## Deploy frontend (after `git push` to `clearearth-frontend`)

**Dev**

```bash
ssh root@72.60.222.81
cd /var/www/clearearth-dev-frontend
git pull origin main
npm ci   # or: npm install
npm run build
```

**Live**

```bash
ssh root@72.60.222.81
cd /var/www/clearearth-frontend
git pull origin main
npm ci
npm run build
```

Nginx serves `dist/`. After changing nginx: `sudo nginx -t && sudo systemctl reload nginx`.

---

## Deploy backend (after `git push` to `clearearth-backend`)

**Dev**

```bash
ssh root@72.60.222.81
cd /var/www/clearearth-dev-backend
git pull origin main
npm ci   # or: npm install
npm run run-migration   # idempotent schema updates (required when schema changed)
pm2 restart clearearth-dev-api --update-env
pm2 list   # confirm clearearth-dev-api online
```

**Live**

```bash
ssh root@72.60.222.81
cd /var/www/clearearth-backend
git pull origin main
npm ci
npm run run-migration
pm2 restart clearearth-api --update-env
```

> **Roles & permissions are managed in the UI (Roles & Access).** `npm run run-migration` syncs the permission
> catalog (`src/config/accessCatalog.js`) and creates the access-control tables. The first run seeds each existing
> role so behaviour is unchanged; after that the migration **skips every legacy `role_permissions` seeding step**, so
> deploys never overwrite permission edits made in the UI. Wait ~15 s after `pm2 restart` before the API answers
> (AdminJS bundling). Take a database dump before the first run of this feature.

**One-shot deploy from a dev machine** (Git Bash / WSL; requires SSH key on the VPS):

```bash
cd clearearth-backend
# Dev copy on the live server (:3335)
DEPLOY_HOST=root@72.60.222.81 \
  BACKEND_DIR=/var/www/clearearth-dev-backend \
  FRONTEND_DIR=/var/www/clearearth-dev-frontend \
  PM2_NAME=clearearth-dev-api \
  npm run deploy:vps

# Live (:3333 / recyclingerp.com)
DEPLOY_HOST=root@72.60.222.81 npm run deploy:vps
```

Maps key: set `VITE_GOOGLE_MAPS_API_KEY` in `clearearth-frontend/.env` before deploy, or export it — deploy scripts copy it into each server’s `.env.production` before `npm run build`.

**If SSH is denied** (e.g. `Permission denied (publickey)`): add your PC’s public key in the hosting panel (SSH keys), or open **Hostinger → VPS → Browser terminal** and run:

```bash
# Dev
BACKEND_DIR=/var/www/clearearth-dev-backend FRONTEND_DIR=/var/www/clearearth-dev-frontend PM2_NAME=clearearth-dev-api \
  bash /var/www/clearearth-dev-backend/scripts/deploy-on-server.sh

# Live
bash /var/www/clearearth-backend/scripts/deploy-on-server.sh
```

Set `SKIP_MIGRATE=1` only if you intentionally skip DB changes.

### Reset business data (keep users, roles, permissions, lookups)

Removes deals, contacts, companies, invoices, work orders, journals, etc. **Does not** remove users, roles, permissions, tenants, chart of accounts, or dropdown seed tables.

```bash
cd /var/www/clearearth-dev-backend   # or /var/www/clearearth-backend for live
DRY_RUN=1 node scripts/clear-transactional-data.js    # preview
CONFIRM_CLEAR=YES node scripts/clear-transactional-data.js
```

---

## Quick verify

```bash
nginx -t
pm2 show clearearth-dev-api    # or clearearth-api for live
curl -sI http://127.0.0.1:3335/ | head -5
curl -sI http://127.0.0.1:3333/ | head -5
```

`curl http://127.0.0.1:3001/...` (dev) or `:3000` (live) may 404 if there is no root route; use a real API path or the browser against the domain/IP.

---

## Notes

- **Other PM2 apps** on the same host (e.g. astrology, lunchboxai) — only restart `clearearth-dev-api` or `clearearth-api` for Clearearth backend changes.
- Keep `.env` (or secrets) only on the server; do not commit them.
- Dev is a **separate snapshot** of live (own DB). It does not auto-sync from production.
