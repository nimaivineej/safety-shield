import { Router, Response, NextFunction } from 'express';
import { EmergencyContactService } from '../services/emergency-contacts.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, emergencyContactSchema } from '../utils/validation';

const router = Router();
const contactService = new EmergencyContactService();

// All routes require authentication
router.use(authenticate);

// Get all emergency contacts
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const contacts = await contactService.getContacts(req.user!.id);

        res.json({
            success: true,
            data: contacts,
        });
    } catch (error) {
        next(error);
    }
});

// Create emergency contact
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = validate(emergencyContactSchema)(req.body);
        const contact = await contactService.createContact(req.user!.id, data);

        res.status(201).json({
            success: true,
            message: 'Emergency contact added successfully',
            data: contact,
        });
    } catch (error) {
        next(error);
    }
});

// Update emergency contact
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const contact = await contactService.updateContact(req.params.id, req.user!.id, req.body);

        res.json({
            success: true,
            message: 'Emergency contact updated successfully',
            data: contact,
        });
    } catch (error) {
        next(error);
    }
});

// Delete emergency contact
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await contactService.deleteContact(req.params.id, req.user!.id);

        res.json({
            success: true,
            message: 'Emergency contact deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
