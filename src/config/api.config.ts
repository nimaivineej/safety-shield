import { Capacitor } from '@capacitor/core';

// API Configuration
export const getApiConfig = () => {
    const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

    // Local backend URL for physical device — connects to your computer's IP on the same WiFi
    const ANDROID_HOST = 'https://harper-unruminating-wendy.ngrok-free.dev';

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
};
