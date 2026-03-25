import { PrismaClient, EmergencyContact } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

export class EmergencyContactService {
    async getContacts(userId: string): Promise<EmergencyContact[]> {
        return prisma.emergencyContact.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createContact(
        userId: string,
        data: {
            name: string;
            phone: string;
            relationship: string;
        }
    ): Promise<EmergencyContact> {
        return prisma.emergencyContact.create({
            data: {
                userId,
                ...data,
            },
        });
    }

    async updateContact(
        contactId: string,
        userId: string,
        data: {
            name?: string;
            phone?: string;
            relationship?: string;
        }
    ): Promise<EmergencyContact> {
        const contact = await prisma.emergencyContact.findFirst({
            where: {
                id: contactId,
                userId,
            },
        });

        if (!contact) {
            throw new NotFoundError('Contact not found');
        }

        return prisma.emergencyContact.update({
            where: { id: contactId },
            data,
        });
    }

    async deleteContact(contactId: string, userId: string): Promise<void> {
        const contact = await prisma.emergencyContact.findFirst({
            where: {
                id: contactId,
                userId,
            },
        });

        if (!contact) {
            throw new NotFoundError('Contact not found');
        }

        await prisma.emergencyContact.delete({
            where: { id: contactId },
        });
    }
}
