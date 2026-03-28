import { PrismaClient, User } from '@prisma/client';
import { NotFoundError, AuthenticationError } from '../utils/errors';
import bcrypt from 'bcryptjs';

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
        let settings = await prisma.notificationSettings.findUnique({
            where: { userId },
        });

        // If settings don't exist, return defaults
        if (!settings) {
            settings = await prisma.notificationSettings.create({
                data: {
                    userId,
                    sosAlerts: true,
                    incidentUpdates: true,
                    volunteerNearby: true,
                    appSounds: true,
                    vibration: true,
                    emailAlerts: false,
                    smsAlerts: true,
                },
            });
        }

        return settings;
    }

    async updateUserSettings(userId: string, settings: any): Promise<any> {
        return await prisma.notificationSettings.upsert({
            where: { userId },
            update: settings,
            create: {
                userId,
                ...settings,
            },
        });
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError('User not found');

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) throw new AuthenticationError('Current password is incorrect');

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    }
}
