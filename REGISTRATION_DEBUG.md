# 🔧 Registration Failed - Troubleshooting Guide

## Common Causes & Solutions

### 1. **Backend Not Running** ⚠️ (Most Common)

**Check if backend is running:**
- Look for terminal with `npm run dev` in the backend folder
- Should show: "Server is running on port 5000"

**Solution:**
```bash
cd "e:\Downloads\Women Safety Monitoring App\backend"
npm run dev
```

### 2. **Network/CORS Error**

**Check browser console (F12):**
- Look for errors like:
  - `ERR_CONNECTION_REFUSED`
  - `CORS policy` error
  - `Network Error`

**Solution:**
- Make sure backend is running on port 5000
- Check that frontend is calling `http://localhost:5000/api`

### 3. **Database Connection Error**

**Check backend terminal for:**
```
Error: P1000: Authentication failed against database
```

**Solution:**
- Verify PostgreSQL is running
- Check `.env` file has correct password

### 4. **Email Already Registered**

**Error message:** "Email already registered"

**Solution:**
- Use a different email address
- Or login with existing credentials

### 5. **Validation Error**

**Check for:**
- Password less than 8 characters
- Passwords don't match
- Missing required fields

## 🔍 How to Debug

### Step 1: Open Browser Console (F12)

Look for the actual error message. It should show something like:

```javascript
❌ Registration failed: Error: ...
```

### Step 2: Check Network Tab

1. Open DevTools (F12)
2. Go to "Network" tab
3. Try registering again
4. Look for the POST request to `/api/auth/register`
5. Click on it and check:
   - **Status**: Should be 200 (success) or 4xx/5xx (error)
   - **Response**: Shows the actual error from backend

### Step 3: Check Backend Terminal

Look for error logs in the backend terminal. Common errors:

```
[ERROR] 12:00:00 POST /api/auth/register - 400 Bad Request
[ERROR] 12:00:00 POST /api/auth/register - 500 Internal Server Error
```

## 🎯 Quick Fix Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Backend shows "Server is running on port 5000"
- [ ] PostgreSQL database is running
- [ ] Frontend is running (`npm run dev` in main folder)
- [ ] Using a unique email (not already registered)
- [ ] Password is at least 8 characters
- [ ] Passwords match
- [ ] All required fields are filled

## 🧪 Test with cURL

Test if backend is working directly:

```bash
# Test backend health
curl http://localhost:5000/health

# Test registration (PowerShell)
$body = @{
    name = "Test User"
    email = "test@example.com"
    phone = "1234567890"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/auth/register `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

## 📊 Expected Response

**Success (200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "role": "USER"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Error (400/409/500):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

## 🆘 Still Not Working?

**Please provide:**
1. Screenshot of browser console (F12) showing the error
2. Screenshot of Network tab showing the failed request
3. Backend terminal output
4. The exact error message you see

This will help me identify the exact issue!
