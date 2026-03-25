import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json({
            success: true,
            data: notifications,
        });
    } catch (error) {
        next(error);
    }
});

// Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const notification = await prisma.notification.updateMany({
            where: {
                id: req.params.id,
                userId: req.user!.id,
            },
            data: {
                isRead: true,
            },
        });

        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error) {
        next(error);
    }
});

// Mark all as read
router.put('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user!.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
