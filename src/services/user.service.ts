import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: string;
    isVerified: boolean;
    createdAt: string;
}

export const userService = {
    // Get user profile
    async getProfile(): Promise<UserProfile> {
        const response = await api.get(API_ENDPOINTS.PROFILE);
        return response.data.data;
    },

    // Update profile
    async updateProfile(data: { name?: string; phone?: string }): Promise<UserProfile> {
        const response = await api.put(API_ENDPOINTS.PROFILE, data);
        return response.data.data;
    },

    // Update location
    async updateLocation(latitude: number, longitude: number, address?: string): Promise<void> {
        await api.put(API_ENDPOINTS.UPDATE_LOCATION, { latitude, longitude, address });
    },
};
