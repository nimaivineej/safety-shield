import { Capacitor } from '@capacitor/core';

// API Configuration
export const getApiConfig = () => {
    // Check for environment variables (Vite)
    const envApiUrl = import.meta.env.VITE_API_BASE_URL;
    const envSocketUrl = import.meta.env.VITE_SOCKET_URL;

    if (envApiUrl) {
        // If the env points to the blocked Railway domain, use the Vercel proxy rewrite instead
        if (envApiUrl.includes('railway.app')) {
            return {
                BASE_URL: '/api',
                SOCKET_URL: '', // Connects to same origin, will fall back to long-polling via proxy
                TIMEOUT: 30000,
            };
        }

        return {
            BASE_URL: envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`,
            SOCKET_URL: envSocketUrl || envApiUrl.replace(/\/api$/, ''),
            TIMEOUT: 30000,
        };
    }

    const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

    // Local backend URL for physical device — connects to your computer's IP on the same WiFi
    const ANDROID_HOST = 'http://10.38.39.18:5000';

    const BASE_URL = isNativeAndroid ? `${ANDROID_HOST}/api` : 'http://localhost:5000/api';
    const SOCKET_URL = isNativeAndroid ? ANDROID_HOST : 'http://localhost:5000';

    return {
        BASE_URL,
        SOCKET_URL,
        TIMEOUT: 30000, // 30s for slower WiFi connections
    };
};

export const API_CONFIG = getApiConfig();

// API endpoints
export const API_ENDPOINTS = {
    // Auth
    REGISTER: '/auth/register',
    REGISTER_VOLUNTEER: '/auth/register/volunteer',
    REGISTER_AUTHORITY: '/auth/register/authority',
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',

    // User
    PROFILE: '/users/profile',
    UPDATE_LOCATION: '/users/location',
    SETTINGS: '/users/settings',

    // Emergency Contacts
    EMERGENCY_CONTACTS: '/emergency-contacts',

    // SOS
    SOS_ALERT: '/sos/alert',
    SOS_ALERTS: '/sos/alerts',
    SOS_ACTIVE: '/sos/active',

    // Incidents
    INCIDENTS: '/incidents',

    // Locations
    SAFE_ZONES: '/locations/safe-zones',
    RISK_ZONES: '/locations/risk-zones',
    ROUTE_SAFETY: '/locations/route-safety',

    // Volunteers
    VOLUNTEER_REGISTER: '/volunteers/register',
    VOLUNTEER_INCIDENTS: '/volunteers/incidents',
    VOLUNTEER_STATS: '/volunteers/stats',
    VOLUNTEER_AVAILABILITY: '/volunteers/availability',

    // Notifications
    NOTIFICATIONS: '/notifications',

    // Services
    SERVICES: '/services',
};
