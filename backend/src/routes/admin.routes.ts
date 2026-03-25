import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/stats – dashboard overview numbers
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const [totalUsers, totalVolunteers, totalIncidents, totalSOS, activeAlerts, resolvedAlerts] =
            await Promise.all([
                prisma.user.count({ where: { role: 'USER' } }),
                prisma.user.count({ where: { role: 'VOLUNTEER' } }),
                prisma.incidentReport.count(),
                prisma.sOSAlert.count(),
                prisma.sOSAlert.count({ where: { status: 'ACTIVE' } }),
                prisma.sOSAlert.count({ where: { status: 'RESOLVED' } }),
            ]);

        res.json({
            success: true,
            data: { totalUsers, totalVolunteers, totalIncidents, totalSOS, activeAlerts, resolvedAlerts },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/admin/users – list all users with basic info
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                    _count: {
                        select: { sosAlerts: true, incidentReports: true },
                    },
                },
            }),
            prisma.user.count(),
        ]);

        res.json({ success: true, data: { users, total, page, pages: Math.ceil(total / limit) } });
    } catch (error) {
        next(error);
    }
});

// GET /api/admin/sos-alerts – recent SOS alerts
router.get('/sos-alerts', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const alerts = await prisma.sOSAlert.findMany({
            take: 50,
            orderBy: { triggeredAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                location: true,
            },
        });
        res.json({ success: true, data: alerts });
    } catch (error) {
        next(error);
    }
});

// GET /api/admin/incidents – recent incidents
router.get('/incidents', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const incidents = await prisma.incidentReport.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                location: true,
            },
        });
        res.json({ success: true, data: incidents });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/admin/users/:id – delete a user
router.delete('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        await prisma.user.delete({ where: { id } });
        logger.info(`Admin deleted user ${id}`);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/admin/sos-alerts/:id/resolve – resolve an SOS alert
router.patch('/sos-alerts/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        const alert = await prisma.sOSAlert.update({
            where: { id },
            data: { status: 'RESOLVED', resolvedAt: new Date() },
        });
        res.json({ success: true, data: alert });
    } catch (error) {
        next(error);
    }
});

// ─── Services (Hospitals, Police, Insurance, Ambulance) ─────────────────────

// GET /api/admin/services – list all (optionally filter by type)
router.get('/services', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.query.type as string | undefined;
        const services = await prisma.service.findMany({
            where: type ? { type: type as any } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: services });
    } catch (error) {
        next(error);
    }
});

// POST /api/admin/services – create a new service
router.post('/services', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, name, phone, email, latitude, longitude, address } = req.body;
        if (!type || !name || !phone) {
            res.status(400).json({ success: false, message: 'type, name and phone are required' });
            return;
        }
        const service = await prisma.service.create({
            data: {
                type,
                name,
                phone,
                email: email || null,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                address: address || null,
            },
        });
        logger.info(`Admin created service: ${name} (${type})`);
        res.status(201).json({ success: true, data: service });
    } catch (error) {
        next(error);
    }
});

// PUT /api/admin/services/:id – update a service
router.put('/services/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        const { type, name, phone, email, latitude, longitude, address } = req.body;
        const service = await prisma.service.update({
            where: { id },
            data: {
                type,
                name,
                phone,
                email: email || null,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                address: address || null,
            },
        });
        res.json({ success: true, data: service });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/admin/services/:id – delete a service
router.delete('/services/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        await prisma.service.delete({ where: { id } });
        logger.info(`Admin deleted service ${id}`);
        res.json({ success: true, message: 'Service deleted' });
    } catch (error) {
        next(error);
    }
});

export default router;
