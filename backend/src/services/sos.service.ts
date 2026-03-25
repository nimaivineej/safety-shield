import { PrismaClient, SOSAlert } from '@prisma/client';
import { NotificationService } from './notification.service';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class SOSService {
    async createAlert(
        userId: string,
        location: { latitude: number; longitude: number; address?: string }
    ): Promise<SOSAlert> {
        // Create location record
        const locationRecord = await prisma.location.create({
            data: {
                userId,
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
            },
        });

        // Create SOS alert
        const alert = await prisma.sOSAlert.create({
            data: {
                userId,
                locationId: locationRecord.id,
                status: 'ACTIVE',
            },
            include: {
                location: true,
                user: true,
            },
        });

        // Send notifications asynchronously
        notificationService.sendSOSAlertNotifications(userId, location).catch((error) => {
            logger.error('Failed to send SOS notifications:', error);
        });

        logger.info(`SOS alert created for user ${userId}`);

        return alert;
    }

    async getAlertHistory(userId: string): Promise<SOSAlert[]> {
        return prisma.sOSAlert.findMany({
            where: { userId },
            include: {
                location: true,
            },
            orderBy: {
                triggeredAt: 'desc',
            },
        });
    }

    async getAlertById(alertId: string, userId: string): Promise<SOSAlert> {
        const alert = await prisma.sOSAlert.findFirst({
            where: {
                id: alertId,
                userId,
            },
            include: {
                location: true,
            },
        });

        if (!alert) {
            throw new NotFoundError('Alert not found');
        }

        return alert;
    }

    async cancelAlert(alertId: string, userId: string): Promise<SOSAlert> {
        const alert = await prisma.sOSAlert.findFirst({
            where: {
                id: alertId,
                userId,
                status: 'ACTIVE',
            },
        });

        if (!alert) {
            throw new NotFoundError('Active alert not found');
        }

        return prisma.sOSAlert.update({
            where: { id: alertId },
            data: {
                status: 'CANCELLED',
                resolvedAt: new Date(),
            },
        });
    }

    async getActiveAlerts(): Promise<SOSAlert[]> {
        return prisma.sOSAlert.findMany({
            where: { status: 'ACTIVE' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                location: true,
            },
            orderBy: {
                triggeredAt: 'desc',
            },
        });
    }

    async resolveAlert(alertId: string, notes?: string): Promise<SOSAlert> {
        return prisma.sOSAlert.update({
            where: { id: alertId },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
                notes,
            },
        });
    }
}
