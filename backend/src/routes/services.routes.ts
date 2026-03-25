import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All service routes require authentication (any role)
router.use(authenticate);

// GET /api/services – list all services (optionally filter by type)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.query.type as string | undefined;
        const services = await prisma.service.findMany({
            where: type ? { type: type as any } : undefined,
            orderBy: { name: 'asc' },
        });
        res.json({ success: true, data: services });
    } catch (error) {
        next(error);
    }
});

export default router;
