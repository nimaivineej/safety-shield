import { Router, Response, NextFunction } from 'express';
import { SOSService } from '../services/sos.service';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { validate, sosAlertSchema } from '../utils/validation';

const router = Router();
const sosService = new SOSService();

// All routes require authentication
router.use(authenticate);

// Create SOS alert
router.post('/alert', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const location = validate(sosAlertSchema)(req.body);
        const alert = await sosService.createAlert(req.user!.id, location);

        res.status(201).json({
            success: true,
            message: 'SOS alert created successfully',
            data: alert,
        });
    } catch (error) {
        next(error);
    }
});

// Get user's alert history
router.get('/alerts', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const alerts = await sosService.getAlertHistory(req.user!.id);

        res.json({
            success: true,
            data: alerts,
        });
    } catch (error) {
        next(error);
    }
});

// Get specific alert
router.get('/alerts/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const alert = await sosService.getAlertById(req.params.id, req.user!.id);

        res.json({
            success: true,
            data: alert,
        });
    } catch (error) {
        next(error);
    }
});

// Cancel SOS alert
router.put('/alerts/:id/cancel', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const alert = await sosService.cancelAlert(req.params.id, req.user!.id);

        res.json({
            success: true,
            message: 'Alert cancelled successfully',
            data: alert,
        });
    } catch (error) {
        next(error);
    }
});

// Get all active alerts (Authority only)
router.get(
    '/active',
    authorize('AUTHORITY', 'ADMIN'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const alerts = await sosService.getActiveAlerts();

            res.json({
                success: true,
                data: alerts,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Resolve alert (Authority only)
router.put(
    '/alerts/:id/resolve',
    authorize('AUTHORITY', 'ADMIN'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { notes } = req.body;
            const alert = await sosService.resolveAlert(req.params.id, notes);

            res.json({
                success: true,
                message: 'Alert resolved successfully',
                data: alert,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
