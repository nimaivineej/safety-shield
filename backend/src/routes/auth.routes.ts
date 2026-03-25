import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { validate, registerSchema, loginSchema } from '../utils/validation';
import logger from '../utils/logger';

const router = Router();
const authService = new AuthService();
const notificationService = new NotificationService();

// Register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = validate(registerSchema)(req.body);
        const result = await authService.register(data);

        // Send welcome email
        notificationService
            .sendWelcomeEmail(result.user.email, result.user.name, result.user.verificationToken!)
            .catch((error) => logger.error('Failed to send welcome email:', error));

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

// Register as Volunteer
router.post('/register/volunteer', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = validate(registerSchema)(req.body);
        const result = await authService.registerWithRole({
            ...data,
            role: 'VOLUNTEER',
        });

        // Send welcome email
        notificationService
            .sendWelcomeEmail(result.user.email, result.user.name, result.user.verificationToken!)
            .catch((error) => logger.error('Failed to send welcome email:', error));

        res.status(201).json({
            success: true,
            message: 'Volunteer registration successful',
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

// Register as Authority
router.post('/register/authority', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = validate(registerSchema)(req.body);
        const result = await authService.registerWithRole({
            ...data,
            role: 'AUTHORITY',
        });

        // Send welcome email
        notificationService
            .sendWelcomeEmail(result.user.email, result.user.name, result.user.verificationToken!)
            .catch((error) => logger.error('Failed to send welcome email:', error));

        res.status(201).json({
            success: true,
            message: 'Authority registration successful. Your account will be activated after admin verification.',
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = validate(loginSchema)(req.body);
        const result = await authService.login(data.email, data.password);

        res.json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token required',
            });
        }

        const result = await authService.refreshAccessToken(refreshToken);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

// Verify email
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token required',
            });
        }

        await authService.verifyEmail(token);

        res.json({
            success: true,
            message: 'Email verified successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Request password reset
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email required',
            });
        }

        const resetToken = await authService.requestPasswordReset(email);

        // Only send reset email if the user exists and a token was generated
        if (resetToken) {
            notificationService
                .sendPasswordResetEmail(email, resetToken)
                .catch((error) => logger.error('Failed to send reset email:', error));
        }

        res.json({
            success: true,
            message: 'If the email exists, a reset link has been sent',
        });
    } catch (error) {
        next(error);
    }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Token and password required',
            });
        }

        await authService.resetPassword(token, password);

        res.json({
            success: true,
            message: 'Password reset successful',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
