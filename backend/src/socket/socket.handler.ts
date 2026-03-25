import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}

export class SocketHandler {
    private io: SocketIOServer;

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    private setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket: AuthenticatedSocket, next) => {
            try {
                const token = socket.handshake.auth.token;

                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
                    id: string;
                    role: string;
                };

                socket.userId = decoded.id;
                socket.userRole = decoded.role;

                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            logger.info(`User connected: ${socket.userId}`);

            // Join user-specific room
            socket.join(`user:${socket.userId}`);

            // Join role-specific rooms
            if (socket.userRole === 'AUTHORITY') {
                socket.join('authorities');
            } else if (socket.userRole === 'VOLUNTEER') {
                socket.join('volunteers');
            }

            // Handle location updates
            socket.on('location:update', async (data: { latitude: number; longitude: number }) => {
                try {
                    await prisma.location.create({
                        data: {
                            userId: socket.userId!,
                            latitude: data.latitude,
                            longitude: data.longitude,
                        },
                    });

                    // Broadcast to user's emergency contacts (if needed)
                    socket.to(`user:${socket.userId}`).emit('location:updated', data);
                } catch (error) {
                    logger.error('Location update error:', error);
                }
            });

            // Handle SOS alert
            socket.on('sos:trigger', async (data: { latitude: number; longitude: number; address?: string }) => {
                try {
                    // Broadcast to authorities
                    this.io.to('authorities').emit('sos:alert', {
                        userId: socket.userId,
                        location: data,
                        timestamp: new Date(),
                    });

                    // Broadcast to nearby volunteers
                    this.io.to('volunteers').emit('sos:alert', {
                        userId: socket.userId,
                        location: data,
                        timestamp: new Date(),
                    });

                    logger.info(`SOS alert triggered by user ${socket.userId}`);
                } catch (error) {
                    logger.error('SOS alert error:', error);
                }
            });

            // Handle incident updates
            socket.on('incident:update', (data: { incidentId: string; status: string }) => {
                // Broadcast to relevant parties
                this.io.to('authorities').emit('incident:updated', data);
            });

            // Handle volunteer response
            socket.on('volunteer:respond', (data: { incidentId: string; userId: string }) => {
                // Notify the user who reported the incident
                this.io.to(`user:${data.userId}`).emit('volunteer:responding', {
                    incidentId: data.incidentId,
                    volunteerId: socket.userId,
                });
            });

            // Handle typing indicators (for chat features)
            socket.on('typing:start', (data: { roomId: string }) => {
                socket.to(data.roomId).emit('user:typing', { userId: socket.userId });
            });

            socket.on('typing:stop', (data: { roomId: string }) => {
                socket.to(data.roomId).emit('user:stopped-typing', { userId: socket.userId });
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                logger.info(`User disconnected: ${socket.userId}`);
            });
        });
    }

    // Public methods to emit events from other parts of the application
    public emitSOSAlert(userId: string, location: any) {
        this.io.to('authorities').emit('sos:alert', {
            userId,
            location,
            timestamp: new Date(),
        });

        this.io.to('volunteers').emit('sos:alert', {
            userId,
            location,
            timestamp: new Date(),
        });
    }

    public emitIncidentUpdate(incidentId: string, data: any) {
        this.io.to('authorities').emit('incident:updated', {
            incidentId,
            ...data,
        });
    }

    public emitNotification(userId: string, notification: any) {
        this.io.to(`user:${userId}`).emit('notification', notification);
    }

    public getIO() {
        return this.io;
    }
}
