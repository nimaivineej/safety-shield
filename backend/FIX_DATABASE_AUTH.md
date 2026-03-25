# 🔧 Fixing Database Authentication Error

## Problem
You're getting: `Authentication failed - database credentials for 'postgres' are not valid`

This means the password in your `.env` file doesn't match your PostgreSQL password.

## Solution

### Option 1: Find Your Correct Password

1. **Remember the password** you set during PostgreSQL installation
2. Open `backend\.env` file
3. On line 8, update the password in the DATABASE_URL:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/women_safety_db?schema=public"
   ```
4. Save the file
5. Try running the migration again:
   ```powershell
   npx prisma migrate dev --name init
   ```

### Option 2: Reset PostgreSQL Password

If you forgot your password, you can reset it:

1. **Open pgAdmin 4** (search in Windows Start menu)
2. Connect to PostgreSQL server (it may ask for your password)
3. Right-click on "postgres" user → Properties → Definition
4. Set a new password
5. Update the `.env` file with this new password

### Option 3: Use Windows Authentication (Alternative)

If you're having trouble with password authentication, you can try connecting as the Windows user:

1. Find your PostgreSQL installation directory (usually `C:\Program Files\PostgreSQL\16`)
2. Edit `data\pg_hba.conf`
3. Change the authentication method from `md5` to `trust` for localhost (temporarily)
4. Restart PostgreSQL service
5. Run migrations
6. Change back to `md5` for security

## Quick Test

To test if your password is correct, try connecting with psql:

```powershell
# If PostgreSQL bin is in PATH:
psql -U postgres -h localhost

# Or use full path:
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost
```

Enter your password when prompted. If it works, use that same password in `.env`.

## Common Passwords to Try

If you used a simple password during installation, try these common ones:
- `postgres`
- `admin`
- `password`
- `root`
- The password might be blank (empty string)

Update line 8 in `.env` accordingly and try again!
