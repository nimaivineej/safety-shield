import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface Incident {
    id: string;
    userId: string;
    user: {
        name: string;
        phone: string;
        email: string;
    };
    type: string;
    description: string;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    status: 'PENDING' | 'ACCEPTED' | 'EN_ROUTE' | 'ARRIVED' | 'RESOLVED' | 'INVESTIGATING';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    createdAt: string;
    voiceNoteUrl?: string;
    photoUrls?: string[];
    acceptedBy?: {
        id: string;
        name: string;
    };
    distance?: number;
}

export interface VolunteerStats {
    totalIncidents: number;
    completedIncidents: number;
    activeIncidents: number;
    rating: number;
}

export const volunteerService = {
    // Get nearby incidents — uses the standard incidents API (works for all authenticated roles)
    async getNearbyIncidents(_radius?: number) {
        // ?all=true lets any authenticated user see all incidents (for volunteer page)
        const response = await api.get(API_ENDPOINTS.INCIDENTS, { params: { all: 'true' } });
        return response.data;
    },

    // Accept an incident
    async acceptIncident(incidentId: string) {
        const response = await api.post(`${API_ENDPOINTS.VOLUNTEER_INCIDENTS}/${incidentId}/accept`);
        return response.data;
    },

    // Update incident status
    async updateIncidentStatus(incidentId: string, status: string) {
        const response = await api.put(`${API_ENDPOINTS.VOLUNTEER_INCIDENTS}/${incidentId}/status`, {
            status,
        });
        return response.data;
    },

    // Complete incident
    async completeIncident(incidentId: string, notes?: string) {
        const response = await api.put(`${API_ENDPOINTS.VOLUNTEER_INCIDENTS}/${incidentId}/complete`, {
            notes,
        });
        return response.data;
    },

    // Get nearby services
    async getNearbyServices() {
        const response = await api.get(API_ENDPOINTS.SERVICES);
        return response.data;
    },

    // Get volunteer statistics
    async getVolunteerStats() {
        const response = await api.get(API_ENDPOINTS.VOLUNTEER_STATS);
        return response.data;
    },

    // Get a single incident by ID
    async getIncidentById(incidentId: string) {
        const response = await api.get(`${API_ENDPOINTS.INCIDENTS}/${incidentId}`);
        return response.data;
    },

    // Update availability
    async updateAvailability(isAvailable: boolean) {
        const response = await api.put(API_ENDPOINTS.VOLUNTEER_AVAILABILITY, {
            isAvailable,
        });
        return response.data;
    },

    // Calculate distance between two points (Haversine formula)
    calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    },
};
