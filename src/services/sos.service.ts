import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface SOSAlertData {
    latitude: number;
    longitude: number;
    address?: string;
}

export const sosService = {
    // Create SOS Alert (alias for triggerAlert)
    async createAlert(data: SOSAlertData) {
        const response = await api.post(API_ENDPOINTS.SOS_ALERT, data);
        return response.data;
    },

    // Trigger SOS Alert
    async triggerAlert(data: SOSAlertData) {
        const response = await api.post(API_ENDPOINTS.SOS_ALERT, data);
        return response.data;
    },

    // Get alert history
    async getAlerts() {
        const response = await api.get(API_ENDPOINTS.SOS_ALERTS);
        return response.data;
    },

    // Resolve alert
    async resolveAlert(alertId: string) {
        const response = await api.put(`${API_ENDPOINTS.SOS_ALERTS}/${alertId}/resolve`);
        return response.data;
    },

    // Cancel alert
    async cancelAlert(alertId: string) {
        const response = await api.put(`${API_ENDPOINTS.SOS_ALERTS}/${alertId}/cancel`);
        return response.data;
    },
};
