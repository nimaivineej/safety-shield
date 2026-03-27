import { Router, Response, NextFunction } from 'express';
import { IncidentService } from '../services/incident.service';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { validate, incidentReportSchema } from '../utils/validation';
import { upload } from '../middleware/upload';

const router = Router();
const incidentService = new IncidentService();

// All routes require authentication
router.use(authenticate);

// Create incident report (with optional photo + voice note upload)
router.post(
    '/',
    upload.fields([
        { name: 'photos', maxCount: 5 },
        { name: 'voiceNote', maxCount: 1 },
    ]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const data = validate(incidentReportSchema)(req.body);

            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

            // Get uploaded photo URLs
            const photoUrls = files?.['photos']
                ? files['photos'].map((file) => `/uploads/${file.filename}`)
                : [];

            // Get optional voice note URL
            const voiceNoteFile = files?.['voiceNote']?.[0];
            const voiceNoteUrl = voiceNoteFile ? `/uploads/${voiceNoteFile.filename}` : undefined;

            const incident = await incidentService.createIncident(req.user!.id, {
                ...data,
                photoUrls,
                voiceNoteUrl,
            });

            res.status(201).json({
                success: true,
                message: 'Incident reported successfully',
                data: incident,
            });
        } catch (error) {
            return next(error);
        }
    }
);

// Get incidents (with filters)
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const filters: any = {};

        // Volunteers, authorities, and admins see all incidents by default
        const isPrivilegedRole = ['VOLUNTEER', 'AUTHORITY', 'ADMIN'].includes(req.user!.role);
        const viewAll = req.query.all === 'true' || isPrivilegedRole;

        // Only regular users see only their own UNLESS they specifically ask for all (though usually restricted)
        if (!viewAll && req.user!.role === 'USER') {
            filters.userId = req.user!.id;
        }

        if (req.query.type) {
            filters.type = req.query.type;
        }

        if (req.query.status) {
            filters.status = req.query.status;
        }

        if (req.query.limit) {
            filters.limit = parseInt(req.query.limit as string);
        }

        const incidents = await incidentService.getIncidents(filters);

        res.json({
            success: true,
            data: incidents,
        });
    } catch (error) {
        return next(error);
    }
});

// Get incident by ID
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const incident = await incidentService.getIncidentById(req.params.id as string);

        res.json({
            success: true,
            data: incident,
        });
    } catch (error) {
        return next(error);
    }
});

// Update incident status (Authority only)
router.put(
    '/:id/status',
    authorize('AUTHORITY', 'ADMIN'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { status, assignedTo } = req.body;
            const incident = await incidentService.updateIncidentStatus(
                req.params.id as string,
                status,
                assignedTo
            );

            res.json({
                success: true,
                message: 'Incident status updated successfully',
                data: incident,
            });
        } catch (error) {
            return next(error);
        }
    }
);

// Delete incident
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await incidentService.deleteIncident(req.params.id as string, req.user!.id);

        res.json({
            success: true,
            message: 'Incident deleted successfully',
        });
    } catch (error) {
        return next(error);
    }
});

export default router;
