import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    phone: string;
}

export const authService = {
    // Login
    async login(credentials: LoginCredentials) {
        const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    },

    // Register
    async register(data: RegisterData) {
        const response = await api.post(API_ENDPOINTS.REGISTER, data);
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    },

    // Register as Volunteer
    async registerVolunteer(data: RegisterData) {
        const response = await api.post(API_ENDPOINTS.REGISTER_VOLUNTEER, data);
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    },

    // Register as Authority
    async registerAuthority(data: RegisterData) {
        const response = await api.post(API_ENDPOINTS.REGISTER_AUTHORITY, data);
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    },

    // Logout
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Check if authenticated
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },

    // Forgot password – sends a reset email via the backend
    async forgotPassword(email: string) {
        const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
        return response.data;
    },

    // Reset password using the token from the email link
    async resetPassword(token: string, password: string) {
        const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, { token, password });
        return response.data;
    },
};
