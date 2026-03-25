import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import { ConflictError, AuthenticationError, ValidationError } from '../utils/errors';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class AuthService {
    async register(data: {
        email: string;
        password: string;
        name: string;
        phone?: string;
    }): Promise<{ user: Omit<User, 'password'>; accessToken: string; refreshToken: string }> {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                verificationToken,
            },
        });

        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }

    async registerWithRole(data: {
        email: string;
        password: string;
        name: string;
        phone?: string;
        role: 'USER' | 'VOLUNTEER' | 'AUTHORITY' | 'ADMIN';
    }): Promise<{ user: Omit<User, 'password'>; accessToken: string; refreshToken: string }> {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user with specified role
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: data.role,
                verificationToken,
            },
        });

        // Automatically create associated profiles
        if (data.role === 'VOLUNTEER') {
            await prisma.volunteer.create({
                data: {
                    userId: user.id,
                    isVerified: true, // Auto-verify for test/dev convenience, or keep false if preferred
                    isAvailable: true,
                },
            });
        } else if (data.role === 'AUTHORITY') {
            await prisma.authority.create({
                data: {
                    userId: user.id,
                    badgeNumber: `TEMP-${Date.now()}`, // Placeholder for unique badge number
                    department: 'General assistance',
                    jurisdiction: 'Default',
                    isActive: true,
                },
            });
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }

    async login(email: string, password: string): Promise<{
        user: Omit<User, 'password'>;
        accessToken: string;
        refreshToken: string;
    }> {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new AuthenticationError('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid credentials');
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }

    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const secret = process.env.JWT_REFRESH_SECRET!;
            const decoded = jwt.verify(refreshToken, secret) as { id: string };

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
            });

            if (!user) {
                throw new AuthenticationError('User not found');
            }

            const accessToken = this.generateAccessToken(user);

            return { accessToken };
        } catch (error) {
            throw new AuthenticationError('Invalid refresh token');
        }
    }

    async verifyEmail(token: string): Promise<void> {
        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
        });

        if (!user) {
            throw new ValidationError('Invalid verification token');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
            },
        });
    }

    async requestPasswordReset(email: string): Promise<string | null> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Return null so we don't send a fake email
            return null;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        return resetToken;
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new ValidationError('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
    }

    private generateAccessToken(user: User): string {
        const secret = process.env.JWT_ACCESS_SECRET!;
        const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';

        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            secret,
            { expiresIn: expiry }
        );
    }

    private generateRefreshToken(user: User): string {
        const secret = process.env.JWT_REFRESH_SECRET!;
        const expiry = process.env.JWT_REFRESH_EXPIRY || '7d';

        return jwt.sign(
            {
                id: user.id,
            },
            secret,
            { expiresIn: expiry }
        );
    }
}
