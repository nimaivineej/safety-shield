import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
    const email = 'safetyshield453@gmail.com';
    const password = '12345678';
    const name = 'Admin';

    console.log('🔧 Seeding admin user...');

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
        // Update existing user to ADMIN role and set the correct password
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN', password: hashedPassword, isVerified: true },
        });
        console.log('✅ Existing user updated to ADMIN role.');
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'ADMIN',
                isVerified: true,
            },
        });
        console.log('✅ Admin user created successfully.');
    }

    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     ADMIN`);
    await prisma.$disconnect();
}

seedAdmin().catch((e) => {
    console.error('❌ Seed failed:', e);
    prisma.$disconnect();
    process.exit(1);
});
