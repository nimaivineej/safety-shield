import { Router, Response, NextFunction } from 'express';
import { VolunteerService } from '../services/volunteer.service';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';

const router = Router();
const volunteerService = new VolunteerService();

// All routes require authentication
router.use(authenticate);

// Register as volunteer
router.post('/register', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const volunteer = await volunteerService.registerVolunteer(req.user!.id);

        res.status(201).json({
            success: true,
            message: 'Volunteer registration successful',
            data: volunteer,
        });
    } catch (error) {
        return next(error);
    }
});

// Get nearby incidents — accessible to any authenticated user (not just volunteers)
router.get(
    '/incidents',
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {


            // Return pending incidents — any authenticated user can view to offer help
            const incidents = await req.app.locals.prisma.incidentReport.findMany({
                where: {
                    status: { in: ['PENDING', 'INVESTIGATING'] },
                },
                include: {
                    location: true,
                    user: {
                        select: { name: true, phone: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });

            // Map to include location fields at top level for frontend compatibility
            const mapped = incidents.map((inc: any) => ({
                ...inc,
                location: {
                    latitude: inc.location?.latitude ?? inc.latitude,
                    longitude: inc.location?.longitude ?? inc.longitude,
                    address: inc.location?.address ?? inc.address,
                },
                distance: null, // frontend calculates distance from user GPS
            }));

            res.json({ success: true, data: mapped });
        } catch (error) {
            return next(error);
        }
    }
);

// Accept incident (All authenticated users can help)
router.post(
    '/incidents/:id/accept',
    authorize('VOLUNTEER', 'ADMIN', 'USER'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            let volunteer = await req.app.locals.prisma.volunteer.findUnique({
                where: { userId: req.user!.id },
            });

            // Auto-register as volunteer if profile doesn't exist
            if (!volunteer) {
                volunteer = await volunteerService.registerVolunteer(req.user!.id);
            }

            await volunteerService.acceptIncident(volunteer.id, req.params.id as string);

            res.json({
                success: true,
                message: 'Incident accepted successfully',
            });
        } catch (error) {
            return next(error);
        }
    }
);

// Complete incident (Volunteer only)
router.put(
    '/incidents/:id/complete',
    authorize('VOLUNTEER', 'ADMIN'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const volunteer = await req.app.locals.prisma.volunteer.findUnique({
                where: { userId: req.user!.id },
            });

            if (!volunteer) {
                return res.status(404).json({
                    success: false,
                    message: 'Volunteer profile not found',
                });
            }

            const { notes } = req.body;
            await volunteerService.completeIncident(volunteer.id, req.params.id as string, notes);

            res.json({
                success: true,
                message: 'Incident marked as completed',
            });
        } catch (error) {
            return next(error);
        }
    }
);

// Get volunteer stats
router.get(
    '/stats',
    authorize('VOLUNTEER', 'ADMIN', 'USER'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            let volunteer = await req.app.locals.prisma.volunteer.findUnique({
                where: { userId: req.user!.id },
            });

            // Auto-register as volunteer if profile doesn't exist
            if (!volunteer) {
                volunteer = await volunteerService.registerVolunteer(req.user!.id);
            }

            const stats = await volunteerService.getVolunteerStats(volunteer.id);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            return next(error);
        }
    }
);

// Update availability
router.put(
    '/availability',
    authorize('VOLUNTEER', 'ADMIN', 'USER'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            let volunteer = await req.app.locals.prisma.volunteer.findUnique({
                where: { userId: req.user!.id },
            });

            // Auto-register as volunteer if profile doesn't exist
            if (!volunteer) {
                volunteer = await volunteerService.registerVolunteer(req.user!.id);
            }

            const { isAvailable } = req.body;
            const updated = await volunteerService.updateAvailability(volunteer.id, isAvailable);

            res.json({
                success: true,
                message: 'Availability updated successfully',
                data: updated,
            });
        } catch (error) {
            return next(error);
        }
    }
);

export default router;
