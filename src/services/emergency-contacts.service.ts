import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    email?: string;
    relationship: string;
    createdAt: string;
}

export interface CreateContactData {
    name: string;
    phone: string;
    email?: string;
    relationship: string;
}

export const emergencyContactsService = {
    // Get all emergency contacts
    async getContacts(): Promise<EmergencyContact[]> {
        const response = await api.get(API_ENDPOINTS.EMERGENCY_CONTACTS);
        return response.data.data;
    },

    // Add emergency contact
    async addContact(data: CreateContactData): Promise<EmergencyContact> {
        const response = await api.post(API_ENDPOINTS.EMERGENCY_CONTACTS, data);
        return response.data.data;
    },

    // Update emergency contact
    async updateContact(id: string, data: Partial<CreateContactData>): Promise<EmergencyContact> {
        const response = await api.put(`${API_ENDPOINTS.EMERGENCY_CONTACTS}/${id}`, data);
        return response.data.data;
    },

    // Delete emergency contact
    async deleteContact(id: string): Promise<void> {
        await api.delete(`${API_ENDPOINTS.EMERGENCY_CONTACTS}/${id}`);
    },
};
