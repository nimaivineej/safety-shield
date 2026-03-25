import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    metadata?: any;
    createdAt: string;
}

export const notificationService = {
    // Get notifications
    async getNotifications(): Promise<Notification[]> {
        const response = await api.get(API_ENDPOINTS.NOTIFICATIONS);
        return response.data.data;
    },

    // Mark notification as read
    async markAsRead(id: string): Promise<void> {
        await api.put(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`);
    },

    // Mark all as read
    async markAllRead(): Promise<void> {
        await api.put(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`);
    },
};
