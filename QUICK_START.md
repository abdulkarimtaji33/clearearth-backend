# Quick Start Guide

Get the ClearEarth ERP Backend running in 5 minutes!

## 🚀 Quick Setup

### Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

### Step 2: Configure Database (2 minutes)

1. **Create MySQL Database:**
```bash
mysql -u root -p
```

```sql
CREATE DATABASE clearearth_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

2. **Update .env file:**
```bash
# Open .env and update these lines:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clearearth_erp
DB_USER=root
DB_PASSWORD=your_mysql_password
```

### Step 3: Start Server (1 minute)

```bash
npm run dev
```

You should see:
```
✅ Database connection established successfully
✅ Database synchronized successfully
🚀 Server started successfully
📍 Environment: development
🌐 Server running on port 3000
🔗 API URL: http://localhost:3000/api/v1
```

---

## ✅ Test It Works

### Health Check

Open browser or use curl:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "development"
}
```

### Register First User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "My Company",
    "companyName": "My Company LLC",
    "email": "admin@mycompany.com",
    "password": "Admin123456",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

Save the `accessToken` from response!

### Get Current User

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🎯 What's Next?

### Option 1: Use Postman

1. Import `postman_collection.json`
2. Set environment variable `base_url` to `http://localhost:3000/api/v1`
3. Run "Register Tenant" request
4. Copy access token to environment
5. Explore other endpoints

### Option 2: Read Documentation

- **API Reference:** `API_DOCUMENTATION.md`
- **Full Guide:** `README.md`
- **Testing:** `TESTING_GUIDE.md`
- **Deployment:** `DEPLOYMENT.md`

### Option 3: Start Building

1. Choose a module (e.g., Clients)
2. Check the model in `src/models/Client.js`
3. Implement controller in `src/controllers/client.controller.js`
4. Implement service in `src/services/client.service.js`
5. Test your endpoints

---

## 🐛 Troubleshooting

### Port Already in Use

Change port in `.env`:
```
PORT=3001
```

### Database Connection Failed

1. Check MySQL is running:
```bash
mysql -u root -p -e "SELECT 1;"
```

2. Verify credentials in `.env`

3. Ensure database exists:
```sql
SHOW DATABASES LIKE 'clearearth_erp';
```

### JWT Token Errors

Make sure you have set JWT secrets in `.env`:
```
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

---

## 📞 Need Help?

- Check `TESTING_GUIDE.md` for detailed testing
- Read `API_DOCUMENTATION.md` for all endpoints
- Review `PROJECT_SUMMARY.md` for architecture overview

---

**That's it! You're ready to build! 🎉**
