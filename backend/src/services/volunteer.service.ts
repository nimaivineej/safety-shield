import { PrismaClient, Volunteer, IncidentReport } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class VolunteerService {
    async registerVolunteer(userId: string): Promise<Volunteer> {
        // Check if already a volunteer
        const existing = await prisma.volunteer.findUnique({
            where: { userId },
        });

        if (existing) {
            throw new ConflictError('Already registered as volunteer');
        }

        // Update user role
        await prisma.user.update({
            where: { id: userId },
            data: { role: 'VOLUNTEER' },
        });

        // Create volunteer profile
        return prisma.volunteer.create({
            data: {
                userId,
                isVerified: false, // Requires verification
                isAvailable: true,
            },
        });
    }

    async getNearbyIncidents(
        _volunteerId: string,
        _radiusKm: number = 10
    ): Promise<IncidentReport[]> {
        // In a real app, you'd use geospatial queries
        // For now, return all pending incidents
        return prisma.incidentReport.findMany({
            where: {
                status: 'PENDING',
            },
            include: {
                location: true,
                user: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 20,
        });
    }

    async acceptIncident(volunteerId: string, incidentId: string): Promise<void> {
        const volunteer = await prisma.volunteer.findUnique({
            where: { id: volunteerId },
            include: { user: true },
        });

        if (!volunteer) {
            throw new NotFoundError('Volunteer not found');
        }

        const incident = await prisma.incidentReport.findUnique({
            where: { id: incidentId },
        });

        if (!incident) {
            throw new NotFoundError('Incident not found');
        }

        // Create volunteer response
        await prisma.volunteerResponse.create({
            data: {
                volunteerId,
                incidentId,
                status: 'ACCEPTED',
            },
        });

        // Update incident status
        await prisma.incidentReport.update({
            where: { id: incidentId },
            data: { status: 'INVESTIGATING' },
        });

        // Notify user
        await notificationService.sendVolunteerResponseNotification(
            incident.userId,
            volunteer.user.name
        );
    }

    async completeIncident(volunteerId: string, incidentId: string, notes?: string): Promise<void> {
        const response = await prisma.volunteerResponse.findFirst({
            where: {
                volunteerId,
                incidentId,
            },
        });

        if (!response) {
            throw new NotFoundError('Response not found');
        }

        // Update response
        await prisma.volunteerResponse.update({
            where: { id: response.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                notes,
            },
        });

        // Update incident
        await prisma.incidentReport.update({
            where: { id: incidentId },
            data: { status: 'RESOLVED' },
        });

        // Update volunteer stats
        await prisma.volunteer.update({
            where: { id: volunteerId },
            data: {
                totalResponses: {
                    increment: 1,
                },
            },
        });
    }

    async getVolunteerStats(volunteerId: string): Promise<any> {
        const volunteer = await prisma.volunteer.findUnique({
            where: { id: volunteerId },
            include: {
                responses: {
                    include: {
                        incident: true,
                    },
                },
            },
        });

        if (!volunteer) {
            throw new NotFoundError('Volunteer not found');
        }

        const pending = volunteer.responses.filter((r) => r.status === 'ACCEPTED').length;
        const completed = volunteer.responses.filter((r) => r.status === 'COMPLETED').length;

        return {
            totalResponses: volunteer.totalResponses,
            rating: volunteer.rating,
            pending,
            completed,
            isVerified: volunteer.isVerified,
            isAvailable: volunteer.isAvailable,
        };
    }

    async updateAvailability(volunteerId: string, isAvailable: boolean): Promise<Volunteer> {
        return prisma.volunteer.update({
            where: { id: volunteerId },
            data: { isAvailable },
        });
    }
}
