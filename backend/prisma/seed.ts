import { PrismaClient, UserRole, IncidentType, IncidentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.volunteerResponse.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.volunteer.deleteMany();
    await prisma.authority.deleteMany();
    await prisma.incidentReport.deleteMany();
    await prisma.sOSAlert.deleteMany();
    await prisma.emergencyContact.deleteMany();
    await prisma.location.deleteMany();
    await prisma.safeZone.deleteMany();
    await prisma.riskZone.deleteMany();
    await prisma.user.deleteMany();

    // Hash passwords
    const defaultPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('12345678', 10);

    // Create admin user
    console.log('🔑 Creating admin user...');
    const admin = await prisma.user.create({
        data: {
            email: 'safetyshield453@gmail.com',
            password: adminPassword,
            name: 'System Admin',
            role: UserRole.ADMIN,
            isVerified: true,
        },
    });

    await prisma.volunteer.create({
        data: {
            userId: admin.id,
            isVerified: true,
            isAvailable: true,
        },
    });

    // Create test users
    console.log('👤 Creating test users...');

    const user1 = await prisma.user.create({
        data: {
            email: 'user@test.com',
            password: defaultPassword,
            name: 'Test User',
            phone: '+1234567890',
            role: UserRole.USER,
            isVerified: true,
        },
    });

    const user2 = await prisma.user.create({
        data: {
            email: 'jane@test.com',
            password: defaultPassword,
            name: 'Jane Doe',
            phone: '+1234567891',
            role: UserRole.USER,
            isVerified: true,
        },
    });

    const volunteerUser = await prisma.user.create({
        data: {
            email: 'volunteer@test.com',
            password: defaultPassword,
            name: 'John Volunteer',
            phone: '+1234567892',
            role: UserRole.VOLUNTEER,
            isVerified: true,
        },
    });

    const authorityUser = await prisma.user.create({
        data: {
            email: 'authority@test.com',
            password: defaultPassword,
            name: 'Officer Smith',
            phone: '+1234567893',
            role: UserRole.AUTHORITY,
            isVerified: true,
        },
    });

    // Create volunteer profile
    console.log('🦸 Creating volunteer profile...');
    const volunteer = await prisma.volunteer.create({
        data: {
            userId: volunteerUser.id,
            isVerified: true,
            isAvailable: true,
            rating: 4.8,
            totalResponses: 15,
        },
    });

    // Create authority profile
    console.log('👮 Creating authority profile...');
    await prisma.authority.create({
        data: {
            userId: authorityUser.id,
            badgeNumber: 'BADGE-001',
            department: 'Police Department',
            jurisdiction: 'Delhi',
            isActive: true,
        },
    });

    // Create emergency contacts
    console.log('📞 Creating emergency contacts...');
    await prisma.emergencyContact.createMany({
        data: [
            {
                userId: user1.id,
                name: 'Mom',
                phone: '+1234567894',
                relationship: 'Mother',
            },
            {
                userId: user1.id,
                name: 'Dad',
                phone: '+1234567895',
                relationship: 'Father',
            },
            {
                userId: user1.id,
                name: 'Best Friend',
                phone: '+1234567896',
                relationship: 'Friend',
            },
        ],
    });

    // Create locations
    console.log('📍 Creating locations...');
    const location1 = await prisma.location.create({
        data: {
            userId: user1.id,
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Connaught Place, New Delhi',
        },
    });

    const location2 = await prisma.location.create({
        data: {
            userId: user2.id,
            latitude: 28.6189,
            longitude: 77.2140,
            address: 'Central Park Area, Delhi',
        },
    });

    // Create safe zones
    console.log('🛡️ Creating safe zones...');
    await prisma.safeZone.createMany({
        data: [
            {
                name: 'Central Park Area',
                latitude: 28.6189,
                longitude: 77.2140,
                radius: 500,
                description: 'Well-lit park with security guards',
            },
            {
                name: 'Hospital District',
                latitude: 28.6089,
                longitude: 77.2040,
                radius: 300,
                description: 'Hospital area with 24/7 security',
            },
            {
                name: 'Police Station Zone',
                latitude: 28.6239,
                longitude: 77.2190,
                radius: 400,
                description: 'Near police station',
            },
            {
                name: 'Shopping Mall Area',
                latitude: 28.6139,
                longitude: 77.2290,
                radius: 600,
                description: 'Busy shopping area with CCTV coverage',
            },
            {
                name: 'University Campus',
                latitude: 28.6339,
                longitude: 77.2090,
                radius: 800,
                description: 'University campus with security',
            },
        ],
    });

    // Create risk zones
    console.log('⚠️ Creating risk zones...');
    await prisma.riskZone.createMany({
        data: [
            {
                name: 'Industrial Area',
                latitude: 28.6039,
                longitude: 77.2240,
                radius: 400,
                riskLevel: 'MEDIUM',
                description: 'Poorly lit industrial area',
            },
            {
                name: 'Highway Junction',
                latitude: 28.6289,
                longitude: 77.1990,
                radius: 500,
                riskLevel: 'HIGH',
                description: 'Isolated highway area with limited visibility',
            },
            {
                name: 'Old Market Area',
                latitude: 28.5989,
                longitude: 77.2140,
                radius: 300,
                riskLevel: 'MEDIUM',
                description: 'Crowded area with narrow lanes',
            },
        ],
    });

    // Create sample SOS alert
    console.log('🚨 Creating sample SOS alert...');
    await prisma.sOSAlert.create({
        data: {
            userId: user1.id,
            locationId: location1.id,
            status: 'RESOLVED',
            notes: 'Test SOS alert - resolved',
            resolvedAt: new Date(),
        },
    });

    // Create sample incident reports
    console.log('📝 Creating sample incident reports...');
    const incident1 = await prisma.incidentReport.create({
        data: {
            userId: user1.id,
            locationId: location1.id,
            type: IncidentType.HARASSMENT,
            description: 'Verbal harassment at bus stop',
            status: IncidentStatus.RESOLVED,
            photoUrls: [],
        },
    });

    await prisma.incidentReport.create({
        data: {
            userId: user2.id,
            locationId: location2.id,
            type: IncidentType.UNSAFE_AREA,
            description: 'Poorly lit street with no security',
            status: IncidentStatus.PENDING,
            photoUrls: [],
        },
    });

    // Create volunteer response
    console.log('🦸 Creating volunteer response...');
    await prisma.volunteerResponse.create({
        data: {
            volunteerId: volunteer.id,
            incidentId: incident1.id,
            status: 'COMPLETED',
            completedAt: new Date(),
            notes: 'Assisted the user and ensured safety',
        },
    });

    // Create notifications
    console.log('🔔 Creating notifications...');
    await prisma.notification.createMany({
        data: [
            {
                userId: user1.id,
                type: 'SOS_ALERT',
                title: 'SOS Alert Resolved',
                message: 'Your SOS alert has been resolved',
                isRead: true,
            },
            {
                userId: volunteerUser.id,
                type: 'INCIDENT_UPDATE',
                title: 'New Incident Nearby',
                message: 'A new incident has been reported in your area',
                isRead: false,
            },
        ],
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('- 4 users created (1 regular user, 1 volunteer, 1 authority, 1 additional user)');
    console.log('- 3 emergency contacts');
    console.log('- 5 safe zones');
    console.log('- 3 risk zones');
    console.log('- 2 incident reports');
    console.log('- 1 SOS alert');
    console.log('- 1 volunteer response');
    console.log('- 2 notifications');
    console.log('\n🔑 Test Credentials:');
    logCredential('Admin', 'safetyshield453@gmail.com', '12345678');
    logCredential('User', 'user@test.com', 'password123');
    logCredential('Volunteer', 'volunteer@test.com', 'password123');
    logCredential('Authority', 'authority@test.com', 'password123');
}

function logCredential(role: string, email: string, pass: string) {
    console.log(`${role.padEnd(10)}: ${email.padEnd(30)} / ${pass}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
