console.log("Server starting...");
import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

// Import middleware
import { errorHandler } from './middleware/error-handler';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import emergencyContactsRoutes from './routes/emergency-contacts.routes';
import sosRoutes from './routes/sos.routes';
import incidentRoutes from './routes/incident.routes';
import locationRoutes from './routes/location.routes';
import volunteerRoutes from './routes/volunteer.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import supportRoutes from './routes/support.routes';
import servicesRoutes from './routes/services.routes';

// Import Socket.IO handler
import { SocketHandler } from './socket/socket.handler';

// Import logger
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Prisma
const prisma = new PrismaClient();

// Create Express app
const app: Application = express();
const server = createServer(app);

// Initialize Socket.IO
const socketHandler = new SocketHandler(server);

// Make Prisma and Socket.IO available to routes
app.locals.prisma = prisma;
app.locals.socketHandler = socketHandler;

// Security middleware
app.use(helmet());

// Trust Railway's edge proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// CORS - Allow specific origin in production, update via .env
const corsOrigin = process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || true);
app.use(
    cors({
        origin: corsOrigin, 
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Serve uploaded files — allow cross-origin media loading (img/audio src from different origins)
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads',
    (_req: Request, res: Response, next) => {
        // Override helmet's same-origin policy so <img> and <audio> tags work cross-origin
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    },
    express.static(path.join(__dirname, '..', uploadDir))
);

// (React static files served AFTER API routes below)
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emergency-contacts', emergencyContactsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/services', servicesRoutes);

// API documentation (Swagger) - placeholder
app.get('/api-docs', (_req: Request, res: Response) => {
    res.json({
        message: 'API Documentation',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            emergencyContacts: '/api/emergency-contacts',
            sos: '/api/sos',
            incidents: '/api/incidents',
            locations: '/api/locations',
            volunteers: '/api/volunteers',
            notifications: '/api/notifications',
        },
    });
});

// Serve React frontend dist (for mobile app via Capacitor)
// Must be AFTER API routes so /api/* routes aren't shadowed
const distPath = path.join(__dirname, '..', '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    logger.info(`📦 Serving React app from ${distPath}`);

    // SPA catch-all: serve index.html for all non-API routes (React Router)
    app.get('*', (_req: Request, res: Response) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).json({ success: false, message: 'Not found' });
        }
    });
} else {
    // 404 handler when no frontend dist exists
    app.use((_req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            message: 'Route not found',
        });
    });
}

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;

/**
 * Ensures a default admin user exists in the database.
 * Resolves "Invalid credentials" errors forever by auto-creating the admin on startup.
 */
const ensureAdminUser = async (prisma: PrismaClient) => {
    const adminEmail = 'safetyshield453@gmail.com';
    const adminPassword = '12345678';

    try {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!existingAdmin) {
            logger.info('👤 Admin user not found, creating...');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const admin = await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: 'System Admin',
                    role: UserRole.ADMIN,
                    isVerified: true
                }
            });
            logger.info('✅ Admin user created successfully');

            // Also ensure admin has a volunteer profile to test features
            await prisma.volunteer.upsert({
                where: { userId: admin.id },
                update: {},
                create: {
                    userId: admin.id,
                    isVerified: true,
                    isAvailable: true
                }
            });
            logger.info('✅ Admin volunteer profile ensures');
        } else {
            // Ensure even existing admin has a volunteer profile
            if (existingAdmin.role !== UserRole.ADMIN) {
                logger.info('🆙 Updating existing user to ADMIN role...');
                await prisma.user.update({
                    where: { email: adminEmail },
                    data: { role: UserRole.ADMIN, isVerified: true }
                });
                logger.info('✅ User role updated to ADMIN');
            }

            await prisma.volunteer.upsert({
                where: { userId: existingAdmin.id },
                update: {},
                create: {
                    userId: existingAdmin.id,
                    isVerified: true,
                    isAvailable: true
                }
            });
        }
    } catch (error) {
        logger.error('❌ Error ensuring admin user:', error);
    }
};

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('✅ Database connected successfully');

        // Ensure admin user exists (forever fix for deployed app)
        await ensureAdminUser(prisma);

        server.listen(Number(PORT), '0.0.0.0', () => {
            logger.info(`🚀 Server is running on port ${PORT}`);
            logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔗 API: http://localhost:${PORT}/api`);
            logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
            logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        await prisma.$disconnect();
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(async () => {
        await prisma.$disconnect();
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export default app;
