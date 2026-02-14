# Deployment Guide - ClearEarth ERP Backend

## Prerequisites

- Node.js >= 18.0.0
- MySQL >= 8.0
- npm >= 9.0.0
- Git

---

## Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd clearearth-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database credentials
- JWT secrets
- SMTP settings
- Other configurations

### 4. Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE clearearth_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

---

## Production Deployment

### Option 1: Traditional Server (Ubuntu/Debian)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install PM2
sudo npm install -g pm2
```

#### 2. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone <repository-url> clearearth-backend
cd clearearth-backend

# Install dependencies
sudo npm install --production

# Configure environment
sudo cp .env.example .env
sudo nano .env  # Edit with production values
```

#### 3. Configure MySQL

```bash
sudo mysql_secure_installation

sudo mysql -u root -p
```

```sql
CREATE DATABASE clearearth_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clearearth_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON clearearth_erp.* TO 'clearearth_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Update `.env` with database credentials.

#### 4. Start with PM2

```bash
# Start application
pm2 start src/server.js --name clearearth-erp

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 5. Setup Nginx Reverse Proxy

```bash
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/clearearth
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/clearearth /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 2: Docker Deployment

#### 1. Create Dockerfile

Already included in the repository.

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

### Option 3: Cloud Platform (AWS, Azure, GCP)

#### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

#### Azure App Service

```bash
# Login
az login

# Create resource group
az group create --name clearearth-rg --location eastus

# Create App Service plan
az appservice plan create --name clearearth-plan --resource-group clearearth-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group clearearth-rg --plan clearearth-plan --name clearearth-api --runtime "NODE|18-lts"

# Deploy
az webapp deployment source config --name clearearth-api --resource-group clearearth-rg --repo-url <git-url> --branch main
```

---

## Database Migrations

### Create Migration

```bash
npx sequelize-cli migration:generate --name migration-name
```

### Run Migrations

```bash
npx sequelize-cli db:migrate
```

### Rollback Migration

```bash
npx sequelize-cli db:migrate:undo
```

---

## Monitoring & Logging

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs clearearth-erp

# Restart application
pm2 restart clearearth-erp

# Stop application
pm2 stop clearearth-erp
```

### Application Logs

Logs are stored in `./logs` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

---

## Backup & Restore

### Database Backup

```bash
# Backup
mysqldump -u username -p clearearth_erp > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
mysql -u username -p clearearth_erp < backup_20240101_120000.sql
```

### Automated Backups

Create a cron job:

```bash
crontab -e
```

```
# Daily backup at 2 AM
0 2 * * * mysqldump -u username -p'password' clearearth_erp > /backups/db_$(date +\%Y\%m\%d).sql
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Update JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW/iptables)
- [ ] Set up database user with limited privileges
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Keep dependencies updated
- [ ] Set up monitoring and alerts
- [ ] Regular security audits

---

## Performance Optimization

### 1. Enable Compression

Already enabled in `app.js`

### 2. Database Optimization

```sql
-- Add indexes
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE clients ADD INDEX idx_status (status);
```

### 3. Caching

Consider implementing Redis caching for frequently accessed data.

### 4. Load Balancing

Use Nginx or AWS ELB for load balancing multiple instances.

---

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs clearearth-erp`
2. Verify environment variables
3. Check database connection
4. Ensure port 3000 is available

### Database Connection Issues

1. Verify MySQL is running: `sudo systemctl status mysql`
2. Check credentials in `.env`
3. Ensure database exists
4. Check firewall rules

### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER /var/www/clearearth-backend
chmod -R 755 /var/www/clearearth-backend
```

---

## Scaling

### Horizontal Scaling

1. Deploy multiple instances
2. Use load balancer
3. Share session storage (Redis)
4. Use centralized logging

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Implement caching layer

---

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Security audit
npm audit
npm audit fix

# Update Node.js
nvm install 18
nvm use 18
```

### Health Monitoring

Access health endpoint:
```
GET http://your-domain.com/health
```

---

## Support & Resources

- Documentation: `/api/v1/docs`
- GitHub Issues: [Repository URL]
- Email Support: support@clearearth.com

---

**Last Updated:** February 2026
