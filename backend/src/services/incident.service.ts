import { PrismaClient, IncidentReport, IncidentType, IncidentStatus } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { NotificationService } from './notification.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class IncidentService {
    async createIncident(
        userId: string,
        data: {
            type: IncidentType;
            description: string;
            latitude: number;
            longitude: number;
            address?: string;
            photoUrls?: string[];
            voiceNoteUrl?: string;
        }
    ): Promise<IncidentReport> {
        // Create location
        const location = await prisma.location.create({
            data: {
                userId,
                latitude: data.latitude,
                longitude: data.longitude,
                address: data.address,
            },
        });

        // Create incident
        const incident = await prisma.incidentReport.create({
            data: {
                userId,
                locationId: location.id,
                type: data.type,
                description: data.description,
                photoUrls: data.photoUrls || [],
                voiceNoteUrl: data.voiceNoteUrl,
                status: 'PENDING',
            },
            include: {
                location: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Send notifications
        const locationText = data.address || `${data.latitude}, ${data.longitude}`;
        notificationService
            .sendIncidentReportNotification(incident.id, data.type, locationText)
            .catch((error) => {
                logger.error('Failed to send incident notifications:', error);
            });

        /* 
        // Send SMS to emergency contacts (moved to frontend device-sent SMS)
        notificationService
            .sendIncidentAlertToContacts(userId, data.type, locationText, incident.id)
            .catch((error) => {
                logger.error('Failed to send incident SMS to contacts:', error);
            });
        */

        return incident;
    }

    async getIncidents(filters?: {
        userId?: string;
        type?: IncidentType;
        status?: IncidentStatus;
        limit?: number;
    }): Promise<IncidentReport[]> {
        return prisma.incidentReport.findMany({
            where: {
                userId: filters?.userId,
                type: filters?.type,
                status: filters?.status || { notIn: ['RESOLVED', 'CLOSED'] },
            },
            include: {
                location: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: filters?.limit || 50,
        });
    }

    async getIncidentById(incidentId: string): Promise<IncidentReport> {
        const incident = await prisma.incidentReport.findUnique({
            where: { id: incidentId },
            include: {
                location: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                volunteerResponses: {
                    include: {
                        volunteer: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        phone: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!incident) {
            throw new NotFoundError('Incident not found');
        }

        return incident;
    }

    async updateIncidentStatus(
        incidentId: string,
        status: IncidentStatus,
        assignedTo?: string
    ): Promise<IncidentReport> {
        return prisma.incidentReport.update({
            where: { id: incidentId },
            data: {
                status,
                assignedTo,
            },
        });
    }

    async deleteIncident(incidentId: string, userId: string): Promise<void> {
        const incident = await prisma.incidentReport.findFirst({
            where: {
                id: incidentId,
                userId,
            },
        });

        if (!incident) {
            throw new NotFoundError('Incident not found');
        }

        await prisma.incidentReport.delete({
            where: { id: incidentId },
        });
    }
}
