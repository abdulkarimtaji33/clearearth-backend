# Clearearth production deploy

## Server

| | |
|---|---|
| **SSH** | `ssh root@72.60.223.25` |
| **Frontend path** | `/var/www/clearearth-frontend` |
| **Backend path** | `/var/www/clearearth-backend` |
| **API (Node)** | PM2 process `clearearth-api` → `src/server.js`, listens on port **3000** |
| **Frontend URL** | `http://72.60.223.25:3333/` only (**not** `http://72.60.223.25/` bare port 80) |
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

**One-shot deploy from a dev machine** (Git Bash / WSL; requires SSH key to the server): from `clearearth-backend` run `npm run deploy:vps` — this pulls backend + frontend, runs `npm run run-migration`, restarts PM2, builds the SPA, and reloads nginx (see `scripts/deploy-production.sh`). Set `SKIP_MIGRATE=1` only if you intentionally skip DB changes.

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
