import { PrismaClient, User } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

export class UserService {
    async getUserProfile(userId: string): Promise<Omit<User, 'password'>> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateUserProfile(
        userId: string,
        data: {
            name?: string;
            phone?: string;
        }
    ): Promise<Omit<User, 'password'>> {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
        });

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateUserLocation(
        userId: string,
        location: { latitude: number; longitude: number; address?: string }
    ): Promise<void> {
        await prisma.location.create({
            data: {
                userId,
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
            },
        });
    }

    async getUserSettings(userId: string): Promise<any> {
        // In a real app, you'd have a separate settings table
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
            },
        });

        return {
            ...user,
            notifications: {
                email: true,
                sms: true,
                push: true,
            },
        };
    }

    async updateUserSettings(_userId: string, _settings: any): Promise<any> {
        // Placeholder for settings update
        return _settings;
    }
}
