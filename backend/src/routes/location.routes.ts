import { Router, Response, NextFunction, Request } from 'express';
import { LocationService } from '../services/location.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, zoneSchema, riskZoneSchema } from '../utils/validation';

const router = Router();
const locationService = new LocationService();

// Get nearby safe zones
router.get('/safe-zones', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { latitude, longitude, radius } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude required',
            });
        }

        const safeZones = await locationService.getNearbySafeZones(
            parseFloat(latitude as string),
            parseFloat(longitude as string),
            radius ? parseFloat(radius as string) : undefined
        );

        res.json({
            success: true,
            data: safeZones,
        });
    } catch (error) {
        next(error);
    }
});

// Get nearby risk zones
router.get('/risk-zones', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { latitude, longitude, radius } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude required',
            });
        }

        const riskZones = await locationService.getNearbyRiskZones(
            parseFloat(latitude as string),
            parseFloat(longitude as string),
            radius ? parseFloat(radius as string) : undefined
        );

        res.json({
            success: true,
            data: riskZones,
        });
    } catch (error) {
        next(error);
    }
});

// Calculate route safety
router.post('/route-safety', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { waypoints } = req.body;

        if (!waypoints || !Array.isArray(waypoints)) {
            return res.status(400).json({
                success: false,
                message: 'Waypoints array required',
            });
        }

        const safety = await locationService.calculateRouteSafety(waypoints);

        res.json({
            success: true,
            data: safety,
        });
    } catch (error) {
        next(error);
    }
});

// Report safe zone (authenticated users)
router.post(
    '/safe-zones',
    authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const data = validate(zoneSchema)(req.body);
            const safeZone = await locationService.createSafeZone({
                ...data,
                reportedBy: req.user!.id,
            });

            res.status(201).json({
                success: true,
                message: 'Safe zone reported successfully',
                data: safeZone,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Report risk zone (authenticated users)
router.post(
    '/risk-zones',
    authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const data = validate(riskZoneSchema)(req.body);
            const riskZone = await locationService.createRiskZone({
                ...data,
                reportedBy: req.user!.id,
            });

            res.status(201).json({
                success: true,
                message: 'Risk zone reported successfully',
                data: riskZone,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
