import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface SafeZone {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    description?: string;
    distance?: number;
}

export interface RiskZone {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    riskLevel: string;
    description?: string;
    distance?: number;
}

export interface RouteSafety {
    safetyScore: number;
    riskZonesNearby: number;
    safeZonesNearby: number;
    warnings: string[];
}

export const locationService = {
    // Get nearby safe zones
    async getSafeZones(latitude: number, longitude: number, radius?: number): Promise<SafeZone[]> {
        const response = await api.get(API_ENDPOINTS.SAFE_ZONES, {
            params: { latitude, longitude, radius },
        });
        return response.data.data;
    },

    // Get nearby risk zones
    async getRiskZones(latitude: number, longitude: number, radius?: number): Promise<RiskZone[]> {
        const response = await api.get(API_ENDPOINTS.RISK_ZONES, {
            params: { latitude, longitude, radius },
        });
        return response.data.data;
    },

    // Calculate route safety
    async getRouteSafety(waypoints: Array<{ latitude: number; longitude: number }>): Promise<RouteSafety> {
        const response = await api.post(API_ENDPOINTS.ROUTE_SAFETY, { waypoints });
        return response.data.data;
    },
};
