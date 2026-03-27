import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();
const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get user notifications
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json({ success: true, data: notifications });
    } catch (error) { return next(error); }
});

// Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await prisma.notification.updateMany({
            where: { id: req.params.id as string, userId: req.user!.id },
            data: { isRead: true },
        });
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) { return next(error); }
});

// Mark all as read
router.put('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user!.id, isRead: false },
            data: { isRead: true },
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) { return next(error); }
});

// Send SMS
router.post('/send-sms', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) { res.status(400).json({ success: false, message: 'phone and message are required' }); return; }
        await notificationService.sendSMS(phone, message);
        res.json({ success: true, message: 'SMS sent successfully' });
    } catch (error) { return next(error); }
});

// ── Send insurance claim photos to agent via email (multipart upload) ──
router.post('/send-claim-email', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const multer = (await import('multer')).default;
        const upload = multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: 20 * 1024 * 1024, files: 10 },
        });

        upload.array('photos')(req as any, res as any, async (err: any) => {
            if (err) { res.status(400).json({ success: false, message: err.message }); return; }

            const { agentEmail, incidentId, userName } = req.body;
            if (!agentEmail) { res.status(400).json({ success: false, message: 'agentEmail is required' }); return; }

            const files = (req as any).files as Express.Multer.File[];
            const photoCount = files?.length ?? 0;
            const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            const incidentRow = incidentId
                ? `<tr><td style="padding:8px;color:#6b7280;">Incident ID</td><td style="padding:8px;font-weight:600;font-family:monospace;">${String(incidentId).slice(0, 16).toUpperCase()}</td></tr>`
                : '';

            const html = `
              <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;">
                <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                  <h1 style="color:white;margin:0;font-size:24px;">📸 Insurance Claim Photos</h1>
                </div>
                <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
                  <p style="font-size:16px;color:#111;">
                    <strong>${userName || 'A SafetyShield user'}</strong> has submitted accident photos and needs your assistance.
                  </p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                    <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">From</td><td style="padding:8px;font-weight:600;">${userName || 'SafetyShield User'}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Photos Attached</td><td style="padding:8px;font-weight:600;">${photoCount} photo${photoCount !== 1 ? 's' : ''}</td></tr>
                    <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Submitted At</td><td style="padding:8px;font-weight:600;">${time}</td></tr>
                    ${incidentRow}
                  </table>
                  <p style="color:#6b7280;font-size:14px;">Please review the attached photos and contact the user to process their claim.</p>
                  <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Sent via SafetyShield</p>
                </div>
              </div>`;

            const attachments = (files || []).map((f, i) => ({
                filename: f.originalname || `accident-photo-${i + 1}.jpg`,
                content: f.buffer,
                contentType: f.mimetype,
            }));

            const nodemailer = (await import('nodemailer')).default;
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
            });

            await transporter.sendMail({
                from: process.env.EMAIL_FROM || 'SafetyShield <noreply@safetyshield.com>',
                to: agentEmail,
                subject: `📸 Insurance Claim – ${userName || 'SafetyShield User'} (${photoCount} photo${photoCount !== 1 ? 's' : ''})`,
                html,
                attachments,
            });

            res.json({ success: true, message: `Email with ${photoCount} photo(s) sent to agent` });
        });
    } catch (error) { return next(error); }
});

export default router;
