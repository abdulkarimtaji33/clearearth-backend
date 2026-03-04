# Deployment

## After deploying backend code

Run the database migration on your **production database** to apply schema and role changes:

```bash
# Set production env (or ensure .env points to production DB)
node run-migration.js
```

This migration:
- Adds `created_by` to `contacts` and `companies`
- Creates `sales_manager` and `sales` roles with permissions
- Creates inspection-related tables and permissions if not exist
- Ensures `super_admin` user exists

## Deployment checklist

1. **Backend**: Deploy to your hosting (Render, Railway, VPS, etc.)
2. **Database**: Run `node run-migration.js` against production DB
3. **Frontend**: Netlify auto-deploys on push to `main` (if connected)
