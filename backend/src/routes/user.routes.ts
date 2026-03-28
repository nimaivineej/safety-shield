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
        return next(error);
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
        return next(error);
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
        return next(error);
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
        return next(error);
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
        return next(error);
    }
});

// Change password (in-app, requires current password)
router.put('/change-password', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password required' });
        }
        await userService.changePassword(req.user!.id, currentPassword, newPassword);
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        return next(error);
    }
});

export default router;
