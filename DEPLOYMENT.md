# Clearearth production deploy

## Servers

| Host | URL | SSH |
|------|-----|-----|
| **Primary** | http://72.60.223.25:3333/ | `ssh root@72.60.223.25` |
| **Secondary** | http://72.60.222.81:3333/ | `ssh root@72.60.222.81` |

Both use the same layout:

| | |
|---|---|
| **Frontend path** | `/var/www/clearearth-frontend` |
| **Backend path** | `/var/www/clearearth-backend` |
| **API (Node)** | PM2 process `clearearth-api` → `src/server.js`, listens on port **3000** |
| **Frontend URL** | `:3333` only (**not** bare port 80 on the main IP) |
| **Port 80** | Do **not** serve Clearearth on the main IP. Remove or rewrite any `:80` vhost that proxies or roots to this SPA. |
| **Web** | Nginx **:3333**: static SPA from `/var/www/clearearth-frontend/dist`; `/api` and `/uploads` → `http://127.0.0.1:3000` |
| **Nginx site** | `/etc/nginx/sites-available/clearearth` (symlink `sites-enabled/clearearth`) |

## Git remotes (on server)

- Frontend: `https://github.com/abdulkarimtaji33/clearearth-frontend.git` — branch `main`
- Backend: `https://github.com/abdulkarimtaji33/clearearth-backend.git` — branch `main`

Push from your machine first, then deploy on the server.

---

## Deploy frontend (after `git push` to `clearearth-frontend`)

```bash
ssh root@72.60.223.25
cd /var/www/clearearth-frontend
git pull origin main
npm ci   # or: npm install
npm run build
```

Nginx serves `dist/` on **3333**; after changing nginx: `sudo nginx -t && sudo systemctl reload nginx`. Open firewall: `sudo ufw allow 3333/tcp` (remove `8080`/`80` rules for Clearearth if no longer wanted).

---

## Deploy backend (after `git push` to `clearearth-backend`)

```bash
ssh root@72.60.223.25
cd /var/www/clearearth-backend
git pull origin main
npm ci   # or: npm install
npm run run-migration   # idempotent schema updates (required when schema changed)
pm2 restart clearearth-api --update-env
pm2 list   # confirm clearearth-api online
```

**One-shot deploy from a dev machine** (Git Bash / WSL; requires SSH key on each VPS):

```bash
cd clearearth-backend
npm run deploy:vps              # primary only (72.60.223.25)
npm run deploy:vps:all          # both servers
DEPLOY_HOST=root@72.60.222.81 npm run deploy:vps   # secondary only
```

Maps key: set `VITE_GOOGLE_MAPS_API_KEY` in `clearearth-frontend/.env` before deploy, or export it — deploy scripts copy it into each server’s `.env.production` before `npm run build`.

**If SSH is denied on a host** (e.g. `Permission denied (publickey)` on `72.60.222.81`): add your PC’s public key in the hosting panel (SSH keys), or open **Hostinger → VPS → Browser terminal** and run:

```bash
bash /var/www/clearearth-backend/scripts/deploy-on-server.sh
# or with Maps key:
VITE_GOOGLE_MAPS_API_KEY='AIza...' bash /var/www/clearearth-backend/scripts/deploy-on-server.sh
```

Set `SKIP_MIGRATE=1` only if you intentionally skip DB changes.

### Reset business data (keep users, roles, permissions, lookups)

Removes deals, contacts, companies, invoices, work orders, journals, etc. **Does not** remove users, roles, permissions, tenants, chart of accounts, or dropdown seed tables.

```bash
cd /var/www/clearearth-backend
DRY_RUN=1 node scripts/clear-transactional-data.js    # preview
CONFIRM_CLEAR=YES node scripts/clear-transactional-data.js
```

---

## Quick verify

```bash
nginx -t
pm2 show clearearth-api
curl -sI http://127.0.0.1:3333/ | head -5
```

`curl http://127.0.0.1:3000/...` may 404 if there is no root route; use a real API path or the browser against the domain/IP.

---

## Notes

- **Other PM2 apps** on the same host (e.g. astrology, lunchboxai) — only restart `clearearth-api` for Clearearth backend changes.
- Keep `.env` (or secrets) only on the server; do not commit them.
