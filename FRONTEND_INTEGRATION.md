# 🎯 Frontend Integration Guide

## Step-by-Step: Connect Your Frontend to Backend

### ✅ What I Just Created

I've created the necessary files to connect your frontend to the backend:

1. **API Configuration** - `src/config/api.config.ts`
2. **API Client** - `src/services/api.ts` (with auto token refresh)
3. **Auth Service** - `src/services/auth.service.ts`
4. **SOS Service** - `src/services/sos.service.ts`

### 📋 Next Steps

#### 1. Install Axios (if not already installed)

```bash
cd "e:\Downloads\Women Safety Monitoring App"
npm install axios
```

#### 2. Update Your Login Component

Replace the login logic in `src/app/components/LoginScreen.tsx`:

```typescript
import { authService } from '../../services/auth.service';

// In your handleLogin function:
const handleLogin = async () => {
  try {
    setLoading(true);
    const response = await authService.login({
      email: email,
      password: password,
    });
    
    console.log('Login successful:', response);
    navigate('/home');
  } catch (error: any) {
    console.error('Login failed:', error);
    alert(error.response?.data?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

#### 3. Update Your Register Component

In `src/app/components/RegisterScreen.tsx`:

```typescript
import { authService } from '../../services/auth.service';

const handleRegister = async () => {
  try {
    setLoading(true);
    const response = await authService.register({
      email: email,
      password: password,
      name: name,
      phone: phone,
    });
    
    console.log('Registration successful:', response);
    navigate('/home');
  } catch (error: any) {
    console.error('Registration failed:', error);
    alert(error.response?.data?.message || 'Registration failed');
  } finally {
    setLoading(false);
  }
};
```

#### 4. Update SOS Alert Component

In `src/app/components/SOSAlertScreen.tsx`:

```typescript
import { sosService } from '../../services/sos.service';

const handleSendAlert = async () => {
  try {
    // Get user's current location
    navigator.geolocation.getCurrentPosition(async (position) => {
      const response = await sosService.triggerAlert({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: 'Current Location',
      });
      
      console.log('SOS Alert sent:', response);
      setAlertSent(true);
    });
  } catch (error) {
    console.error('Failed to send SOS:', error);
    alert('Failed to send SOS alert');
  }
};
```

#### 5. Test the Integration

1. **Start your frontend** (in a new terminal):
   ```bash
   cd "e:\Downloads\Women Safety Monitoring App"
   npm run dev
   ```

2. **Open browser**: http://localhost:5173

3. **Try to register** a new user or login with test credentials:
   - Email: user@test.com
   - Password: password123

4. **Test SOS alert** from the home screen

### 🔍 Debugging Tips

**Check browser console** (F12) for:
- Network requests to `http://localhost:5000/api`
- Any error messages
- Response data

**Common Issues:**

1. **CORS Error**: Backend should already have CORS enabled for `http://localhost:5173`
2. **Network Error**: Make sure backend is running (`npm run dev` in backend folder)
3. **401 Unauthorized**: Token might be expired, try logging in again

### 📊 What Works Now

Once integrated, you'll have:
- ✅ User registration and login
- ✅ JWT token authentication (auto-refresh)
- ✅ SOS alert triggering
- ✅ All API endpoints accessible
- ✅ Automatic error handling

### 🎯 Create More Services (Optional)

Follow the same pattern to create services for:
- Emergency contacts
- Incident reporting
- Location services
- Volunteer features

Example structure:
```typescript
// src/services/incident.service.ts
import api from './api';

export const incidentService = {
  async createIncident(data: FormData) {
    const response = await api.post('/incidents', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  // ... more methods
};
```

### 🚀 You're Ready!

Your backend is running and your frontend now has the connection code. Just:
1. Install axios
2. Update your components to use the services
3. Test the login/register flow
4. Start building features!

**Both servers should be running:**
- Backend: http://localhost:5000 ✅
- Frontend: http://localhost:5173 (start this now)
