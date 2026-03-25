# 🚀 Final Setup Steps

## Step 1: Update Database Password

1. Open the file: `backend\.env`
2. Find line 8: `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/women_safety_db?schema=public"`
3. Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation
4. Save the file

**Example:**
If your password is `postgres`, the line should be:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/women_safety_db?schema=public"
```

## Step 2: Run Database Migrations

Open PowerShell in the backend directory and run:

```powershell
cd "e:\Downloads\Women Safety Monitoring App\backend"
npx prisma migrate dev --name init
```

This will:
- Create the `women_safety_db` database
- Create all 11 tables (User, SOSAlert, IncidentReport, etc.)
- Set up all relationships

## Step 3: Seed Test Data

```powershell
npm run prisma:seed
```

This will create:
- 3 test users (user, volunteer, authority)
- Emergency contacts
- Safe zones and risk zones
- Sample data for testing

## Step 4: Start the Backend Server

```powershell
npm run dev
```

The server will start at: **http://localhost:5000**

## ✅ Verify It's Working

1. **Health check**: Open browser to http://localhost:5000/health
2. **API docs**: http://localhost:5000/api-docs
3. **Test login**: 
   - Email: user@test.com
   - Password: password123

## 🎯 You're Done!

Your backend is now fully operational with:
- ✅ All API endpoints ready
- ✅ Real-time WebSocket support
- ✅ Database with test data
- ✅ Authentication system
- ✅ SOS alerts, incidents, volunteers, etc.

## ❓ Troubleshooting

**If migration fails with "database doesn't exist":**
- PostgreSQL service might not be running
- Check password is correct in .env file

**If "connection refused":**
- Make sure PostgreSQL is running
- Check if port 5432 is correct

**Need help?**
- Check the full guide: `INSTALL_POSTGRESQL.md`
- Check backend README: `README.md`
