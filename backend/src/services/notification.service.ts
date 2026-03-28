import nodemailer from 'nodemailer';
import { PrismaClient, NotificationType } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class NotificationService {
    private emailTransporter: nodemailer.Transporter;

    constructor() {
        // Email transporter
        this.emailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        try {
            await this.emailTransporter.sendMail({
                from: process.env.EMAIL_FROM || 'SafetyShield <noreply@safetyshield.com>',
                to,
                subject,
                html,
            });
            logger.info(`Email sent to ${to}`);
        } catch (error) {
            logger.error('Email sending failed:', error);
            throw error;
        }
    }

    async sendSMS(to: string, message: string): Promise<void> {
        const apiKey = process.env.FAST2SMS_API_KEY;
        if (!apiKey) {
            logger.warn('Fast2SMS API key not configured, skipping SMS');
            return;
        }

        // Fast2SMS expects 10-digit Indian numbers (strip +91 prefix only if number is 12 digits)
        const digits = to.replace(/\D/g, '');
        const number = digits.length === 12 && digits.startsWith('91')
            ? digits.slice(2)   // strip country code
            : digits.length === 10
            ? digits            // already 10-digit
            : to.replace(/^\+91/, '').replace(/\D/g, ''); // fallback: strip +91 then non-digits
        if (number.length !== 10) {
            logger.warn(`Skipping SMS – invalid number format: ${to} (resolved: ${number})`);
            return;
        }

        // Truncate message to 160 chars (1 SMS unit)
        const smsText = message.length > 160 ? message.substring(0, 157) + '...' : message;

        try {
            const url = new URL('https://www.fast2sms.com/dev/bulkV2');
            url.searchParams.set('authorization', apiKey);
            url.searchParams.set('message', smsText);        // plain text param
            url.searchParams.set('language', 'english');
            url.searchParams.set('route', 'q');              // quick (no DLT needed)
            url.searchParams.set('numbers', number);

            const res = await fetch(url.toString());
            const json: any = await res.json();

            logger.info(`Fast2SMS response for ${number}: ${JSON.stringify(json)}`);

            if (json.return === true) {
                logger.info(`✅ SMS sent via Fast2SMS to ${number}`);
            } else {
                logger.error(`❌ Fast2SMS failed for ${number}: ${JSON.stringify(json.message)}`);
            }
        } catch (error) {
            logger.error('Fast2SMS request failed:', error);
            // Don't throw – SMS is optional; alert is already saved in DB
        }
    }

    async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        metadata?: any
    ): Promise<void> {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata,
            },
        });
    }

    async sendSOSAlertNotifications(
        userId: string,
        location: { latitude: number; longitude: number; address?: string }
    ): Promise<void> {
        // Get user details with emergency contacts
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                emergencyContacts: true,
            },
        });

        if (!user) return;

        // Get notification settings
        const settings = await prisma.notificationSettings.findUnique({
            where: { userId },
        });

        const shouldSendEmail = settings ? settings.emailAlerts : false;
        const shouldSendSMS = settings ? settings.smsAlerts : true;

        const locationText = location.address || `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}`;
        const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const smsMessage =
            `🚨 EMERGENCY SOS from ${user.name}!
` +
            `Location: ${locationText}
` +
            `Time: ${time}
` +
            `Map: ${mapsLink}
` +
            `Please help immediately or call 100.`;

        // Send SMS + email to each emergency contact
        for (const contact of user.emergencyContacts) {
            // ── SMS ──────────────────────────────────────
            if (contact.phone) {
                // Format phone number for Twilio (add +91 for Indian numbers if missing)
                let phone = contact.phone.replace(/\s|-/g, '');
                if (!phone.startsWith('+')) {
                    phone = phone.startsWith('91') ? `+${phone}` : `+91${phone}`;
                }
                if (shouldSendSMS) {
                    await this.sendSMS(phone, smsMessage)
                        .then(() => logger.info(`SMS sent to ${contact.name} (${phone})`))
                        .catch((err) => logger.error(`SMS failed for ${contact.name}:`, err));
                }
            }

            // ── Email directly to the contact ────────────
            if (contact.email) {
                const contactEmailHtml = `
                  <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;">
                    <div style="background:#ef4444;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                      <h1 style="color:white;margin:0;font-size:28px;">🚨 EMERGENCY SOS</h1>
                    </div>
                    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
                      <p style="font-size:18px;color:#111;"><strong>${user.name}</strong> has triggered an SOS emergency alert and needs help!</p>
                      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                        <tr><td style="padding:8px;color:#6b7280;">📍 Location</td><td style="padding:8px;font-weight:600;">${locationText}</td></tr>
                        <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">🕐 Time</td><td style="padding:8px;font-weight:600;">${time}</td></tr>
                        <tr><td style="padding:8px;color:#6b7280;">👤 Relation</td><td style="padding:8px;font-weight:600;">${contact.relationship}</td></tr>
                      </table>
                      <div style="text-align:center;margin:24px 0;">
                        <a href="${mapsLink}" style="background:#ef4444;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">
                          📍 View Live Location on Map
                        </a>
                      </div>
                      <p style="color:#6b7280;font-size:14px;text-align:center;">Please check on ${user.name} immediately or contact emergency services (100).</p>
                    </div>
                  </div>
                `;
                if (shouldSendEmail) {
                    await this.sendEmail(contact.email, `🚨 EMERGENCY: ${user.name} needs help NOW!`, contactEmailHtml)
                        .then(() => logger.info(`SOS email sent to contact ${contact.name} (${contact.email})`))
                        .catch((err) => logger.error(`Email failed for ${contact.name}:`, err));
                }
            }
        }

        // Send one confirmation email to the SOS user
        const contactsNotified = user.emergencyContacts.map(c => c.name).join(', ') || 'None added';
        const confirmHtml = `
          <h2>🚨 Your SOS Alert Has Been Sent</h2>
          <p>We've notified your emergency contacts via SMS and email.</p>
          <p><strong>Location:</strong> ${locationText}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><a href="${mapsLink}" style="background:#ef4444;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">View Your Location</a></p>
          <p>Contacts notified: ${contactsNotified}</p>
        `;
        await this.sendEmail(user.email, '🚨 SOS Alert Sent – SafetyShield', confirmHtml)
            .catch((err) => logger.error('Confirmation email failed:', err));

        // Notify nearby volunteers (in-app)
        await this.notifyNearbyVolunteers(location, user.name);

        logger.info(`SOS notifications sent for user ${userId}, contacts: ${user.emergencyContacts.length}`);
    }
    
    async sendIncidentAlertToContacts(
        userId: string,
        type: string,
        locationText: string,
        _incidentId: string
    ): Promise<void> {
        // Get user details with emergency contacts
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                emergencyContacts: true,
            },
        });

        if (!user || user.emergencyContacts.length === 0) return;

        // const mapsLink = `https://www.google.com/maps?q=${incidentId}`; // simplified placeholder if coords aren't passed
        const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const smsMessage =
            `🚨 New Incident Reported by ${user.name}!
` +
            `Type: ${type}
` +
            `Location: ${locationText}
` +
            `Time: ${time}
` +
            `SafetyShield has alerted local authorities & volunteers. Please check on them.`;

        // Send SMS to each emergency contact
        for (const contact of user.emergencyContacts) {
            if (contact.phone) {
                let phone = contact.phone.replace(/\s|-/g, '');
                if (!phone.startsWith('+')) {
                    phone = phone.startsWith('91') ? `+${phone}` : `+91${phone}`;
                }
                await this.sendSMS(phone, smsMessage)
                    .then(() => logger.info(`Incident Alert SMS sent to ${contact.name} (${phone})`))
                    .catch((err) => logger.error(`Incident Alert SMS failed for ${contact.name}:`, err));
            }
        }
    }

    async sendIncidentReportNotification(
        _incidentId: string,
        type: string,
        location: string
    ): Promise<void> {
        // Notify authorities about new incident
        const authorities = await prisma.authority.findMany({
            where: { isActive: true },
            include: { user: true },
        });

        for (const authority of authorities) {
            await this.createNotification(
                authority.userId,
                'INCIDENT_UPDATE',
                'New Incident Reported',
                `A new ${type} incident has been reported at ${location}`
            );

            const emailHtml = `
        <h2>New Incident Report</h2>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>Please review and take appropriate action.</p>
      `;

            await this.sendEmail(
                authority.user.email,
                `New ${type} Incident Reported`,
                emailHtml
            );
        }
    }

    async sendVolunteerResponseNotification(
        userId: string,
        volunteerName: string
    ): Promise<void> {
        await this.createNotification(
            userId,
            'VOLUNTEER_RESPONSE',
            'Help is on the way!',
            `${volunteerName} is responding to your incident and will arrive shortly.`
        );

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await this.sendEmail(
                user.email,
                'Help is on the way!',
                `<p>${volunteerName} is responding to your incident and will arrive shortly.</p>`
            );
        }
    }

    async sendWelcomeEmail(email: string, name: string, verificationToken: string): Promise<void> {
        const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

        const emailHtml = `
      <h2>Welcome to SafetyShield, ${name}!</h2>
      <p>Thank you for joining our community dedicated to women's safety.</p>
      <p>Please verify your email address by clicking the button below:</p>
      <p><a href="${verificationLink}" style="background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
      <p>If you didn't create this account, please ignore this email.</p>
    `;

        await this.sendEmail(email, 'Welcome to SafetyShield - Verify Your Email', emailHtml);
    }

    async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        const emailHtml = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <p><a href="${resetLink}" style="background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

        await this.sendEmail(email, 'Password Reset Request', emailHtml);
    }

    private async notifyNearbyVolunteers(
        _location: { latitude: number; longitude: number },
        userName: string
    ): Promise<void> {
        // Get available volunteers (simplified - in production, use geospatial queries)
        const volunteers = await prisma.volunteer.findMany({
            where: {
                isAvailable: true,
                isVerified: true,
            },
            include: { user: true },
            take: 10,
        });

        for (const volunteer of volunteers) {
            await this.createNotification(
                volunteer.userId,
                'SOS_ALERT',
                '🚨 SOS Alert Nearby',
                `${userName} needs help nearby. Can you assist?`
            );
        }
    }
}
