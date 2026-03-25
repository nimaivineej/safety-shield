# PostgreSQL Installation Guide for Windows

## 📥 Download PostgreSQL

1. **Visit the download page:**
   - Go to: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - OR: https://www.postgresql.org/download/windows/ (click "Download the installer")

2. **Download the installer:**
   - Select **PostgreSQL 16.x** (latest stable version)
   - Choose **Windows x86-64** platform
   - Click **Download**

## 🔧 Install PostgreSQL

1. **Run the installer** (double-click the downloaded `.exe` file)

2. **Follow the installation wizard:**
   - Click **"Next"** on welcome screen
   - **Installation Directory**: Keep default (`C:\Program Files\PostgreSQL\16`)
   - **Select Components**: Keep all checked ✅
     - PostgreSQL Server
     - pgAdmin 4 (GUI tool)
     - Stack Builder
     - Command Line Tools
   - Click **"Next"**

3. **Set Database Password:**
   - Enter a password for the `postgres` superuser
   - **⚠️ IMPORTANT**: Remember this password!
   - **Suggestion**: Use `postgres` for development simplicity
   - Confirm the password
   - Click **"Next"**

4. **Configure Port:**
   - Keep default port: **5432**
   - Click **"Next"**

5. **Select Locale:**
   - Keep default locale
   - Click **"Next"**

6. **Complete Installation:**
   - Review settings and click **"Next"**
   - Wait for installation to complete
   - Uncheck "Launch Stack Builder" (not needed now)
   - Click **"Finish"**

## ✅ Verify Installation

1. **Open a new PowerShell window** (important: new window to refresh PATH)

2. **Check PostgreSQL version:**
   ```powershell
   psql --version
   ```
   You should see: `psql (PostgreSQL) 16.x`

3. **Test connection:**
   ```powershell
   psql -U postgres
   ```
   - Enter the password you set during installation
   - You should see the PostgreSQL prompt: `postgres=#`
   - Type `\q` to exit

## 🔧 Configure Backend

1. **Update the `.env` file** in your backend directory:
   - Open: `e:\Downloads\Women Safety Monitoring App\backend\.env`
   - Find the line: `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/women_safety_db?schema=public"`
   - Replace `YOUR_PASSWORD` with the password you set during installation
   - Save the file

2. **Create the database:**
   ```powershell
   cd "e:\Downloads\Women Safety Monitoring App\backend"
   npx prisma migrate dev --name init
   ```

3. **Seed test data:**
   ```powershell
   npm run prisma:seed
   ```

4. **Start the backend:**
   ```powershell
   npm run dev
   ```

## 🎯 Quick Reference

- **PostgreSQL Service**: Runs automatically on startup
- **Default Port**: 5432
- **Default User**: postgres
- **pgAdmin 4**: GUI tool to manage databases (search in Start menu)
- **Command Line**: `psql -U postgres` to access database

## ❓ Troubleshooting

**If `psql` command not found:**
- Close and reopen PowerShell (PATH needs to refresh)
- Or manually add to PATH: `C:\Program Files\PostgreSQL\16\bin`

**If connection fails:**
- Check if PostgreSQL service is running:
  ```powershell
  Get-Service postgresql*
  ```
- Start service if stopped:
  ```powershell
  Start-Service postgresql-x64-16
  ```

**Forgot password:**
- You'll need to reinstall PostgreSQL or reset via pg_hba.conf

## 🚀 Next Steps After Installation

Once PostgreSQL is installed and running:

1. Update `.env` with your password
2. Run migrations: `npx prisma migrate dev --name init`
3. Seed database: `npm run prisma:seed`
4. Start backend: `npm run dev`

Your backend will be ready at `http://localhost:5000`!
