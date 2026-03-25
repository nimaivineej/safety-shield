import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().length(10, 'Phone number must be exactly 10 digits').regex(/^\d+$/, 'Phone number must contain only digits').optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// Emergency contact validation
export const emergencyContactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().length(10, 'Phone number must be exactly 10 digits').regex(/^\d+$/, 'Phone number must contain only digits'),
    relationship: z.string().min(2, 'Relationship is required'),
});

// SOS Alert validation
export const sosAlertSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
});

// Incident report validation
export const incidentReportSchema = z.object({
    type: z.enum(['HARASSMENT', 'ACCIDENT', 'THEFT', 'UNSAFE_AREA', 'OTHER']),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    address: z.string().optional(),
});

// Location validation
export const locationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
});

// Safe/Risk zone validation
export const zoneSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().min(50).max(5000).optional(),
    description: z.string().optional(),
});

export const riskZoneSchema = zoneSchema.extend({
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

// Helper function to validate request body
export const validate = <T>(schema: z.ZodSchema<T>) => {
    return (data: unknown): T => {
        return schema.parse(data);
    };
};
