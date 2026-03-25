import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface IncidentReportData {
    type: 'HARASSMENT' | 'ACCIDENT' | 'THEFT' | 'UNSAFE_AREA' | 'OTHER';
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
}

export interface IncidentReport {
    id: string;
    userId: string;
    type: string;
    description: string;
    status: string;
    photoUrls: string[];
    voiceNoteUrl?: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    user?: {
        id: string;
        name: string;
    };
    createdAt: string;
}

export const incidentService = {
    // Create incident report (with optional voice note blob and photos)
    async createIncident(
        data: IncidentReportData,
        voiceBlob?: Blob | null,
        photos?: File[]
    ): Promise<IncidentReport> {
        const hasFiles = voiceBlob || (photos && photos.length > 0);

        if (hasFiles) {
            // Send as multipart/form-data
            const form = new FormData();
            form.append('type', data.type);
            form.append('description', data.description);
            form.append('latitude', String(data.latitude));
            form.append('longitude', String(data.longitude));
            if (data.address) form.append('address', data.address);

            if (voiceBlob) {
                // Use the correct extension based on the actual recorded MIME type
                const mimeType = voiceBlob.type || 'audio/webm';
                let ext = 'webm';
                if (mimeType.includes('mp4')) ext = 'mp4';
                else if (mimeType.includes('ogg')) ext = 'ogg';
                else if (mimeType.includes('wav')) ext = 'wav';
                form.append('voiceNote', voiceBlob, `voice-note.${ext}`);
            }

            if (photos) {
                photos.forEach((file) => form.append('photos', file));
            }

            const response = await api.post(API_ENDPOINTS.INCIDENTS, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.data;
        }

        // No attachments — plain JSON request
        const response = await api.post(API_ENDPOINTS.INCIDENTS, data);
        return response.data.data;
    },

    // Get incidents
    async getIncidents(filters?: { type?: string; status?: string; limit?: number }): Promise<IncidentReport[]> {
        const response = await api.get(API_ENDPOINTS.INCIDENTS, { params: filters });
        return response.data.data;
    },

    // Get incident by ID
    async getIncidentById(id: string): Promise<IncidentReport> {
        const response = await api.get(`${API_ENDPOINTS.INCIDENTS}/${id}`);
        return response.data.data;
    },

    // Delete incident
    async deleteIncident(id: string): Promise<void> {
        await api.delete(`${API_ENDPOINTS.INCIDENTS}/${id}`);
    },
};
