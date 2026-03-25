import { Router, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, locationSchema } from '../utils/validation';

const router = Router();
const userService = new UserService();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserProfile(req.user!.id);

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

// Update user profile
router.put('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, phone } = req.body;
        const user = await userService.updateUserProfile(req.user!.id, { name, phone });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

// Update user location
router.put('/location', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const location = validate(locationSchema)(req.body);
        await userService.updateUserLocation(req.user!.id, location);

        res.json({
            success: true,
            message: 'Location updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Get user settings
router.get('/settings', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const settings = await userService.getUserSettings(req.user!.id);

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
});

// Update user settings
router.put('/settings', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const settings = await userService.updateUserSettings(req.user!.id, req.body);

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
