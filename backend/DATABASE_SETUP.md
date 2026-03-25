# PostgreSQL Database Setup Guide

## Prerequisites

PostgreSQL is required for this application. Follow the steps below to install and configure it.

## Step 1: Install PostgreSQL

### Windows Installation

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the latest PostgreSQL installer (version 15 or higher recommended)

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - Follow the installation wizard
   - **Important**: Remember the password you set for the `postgres` superuser
   - Default port: `5432` (keep this unless you have a conflict)
   - Install Stack Builder components (optional)

3. **Verify Installation**
   ```powershell
   psql --version
   ```
   You should see output like: `psql (PostgreSQL) 15.x`

## Step 2: Create Database and User

1. **Open PowerShell as Administrator**

2. **Connect to PostgreSQL**
   ```powershell
   psql -U postgres
   ```
   Enter the password you set during installation.

3. **Create Database**
   ```sql
   CREATE DATABASE women_safety_db;
   ```

4. **Create User** (Optional - for better security)
   ```sql
   CREATE USER safety_admin WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE women_safety_db TO safety_admin;
   ```

5. **Exit psql**
   ```sql
   \q
   ```

## Step 3: Configure Environment Variables

1. **Copy `.env.example` to `.env`**
   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```

2. **Edit `.env` file** with your database credentials:

   ```env
   # If using postgres superuser:
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/women_safety_db?schema=public"

   # OR if you created safety_admin user:
   DATABASE_URL="postgresql://safety_admin:your_secure_password@localhost:5432/women_safety_db?schema=public"
   ```

3. **Update other environment variables** as needed:
   - `JWT_ACCESS_SECRET` - Change to a random string
   - `JWT_REFRESH_SECRET` - Change to a different random string
   - Email and SMS settings (optional for now)

## Step 4: Run Database Migrations

1. **Navigate to backend directory**
   ```powershell
   cd backend
   ```

2. **Generate Prisma Client**
   ```powershell
   npx prisma generate
   ```

3. **Run Migrations**
   ```powershell
   npx prisma migrate dev --name init
   ```

4. **Seed Database** (optional - adds test data)
   ```powershell
   npx prisma db seed
   ```

## Step 5: Verify Database Setup

1. **Open Prisma Studio** (Database GUI)
   ```powershell
   npx prisma studio
   ```
   This will open http://localhost:5555 in your browser

2. **Check Tables**
   You should see tables like:
   - User
   - EmergencyContact
   - SOSAlert
   - IncidentReport
   - Location
   - SafeZone
   - RiskZone
   - Volunteer
   - Notification

## Troubleshooting

### PostgreSQL Service Not Running

**Windows:**
1. Open Services (Win + R, type `services.msc`)
2. Find "postgresql-x64-15" (or your version)
3. Right-click → Start

### Connection Refused

- Check if PostgreSQL is running
- Verify port 5432 is not blocked by firewall
- Ensure DATABASE_URL in `.env` is correct

### Migration Errors

```powershell
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Then run migrations again
npx prisma migrate dev
```

## Quick Start Commands

```powershell
# After PostgreSQL is installed and database created:

cd backend

# Copy environment file
Copy-Item .env.example .env

# Edit .env with your database credentials
notepad .env

# Install dependencies (if not done)
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start backend server
npm run dev
```

## Database Schema Overview

The database includes the following main entities:

- **User**: App users with authentication
- **Volunteer**: Verified volunteers who respond to incidents
- **Authority**: Police/emergency services
- **SOSAlert**: Emergency alerts triggered by users
- **IncidentReport**: Reported incidents with photos/details
- **Location**: Real-time location tracking
- **SafeZone**: Safe areas (hospitals, police stations, etc.)
- **RiskZone**: High-risk areas to avoid
- **EmergencyContact**: User's emergency contacts
- **Notification**: Push notifications and alerts

## Next Steps

After database setup is complete:
1. Start the backend server: `npm run dev`
2. Verify API is accessible: http://localhost:5000/health
3. Test authentication endpoints
4. Connect frontend to backend
