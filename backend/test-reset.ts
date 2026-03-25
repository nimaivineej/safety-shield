import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ 
    where: { resetToken: { not: null } }
  });
  console.log('Users with tokens:', users.map(u => ({ email: u.email, token: u.resetToken, expiry: u.resetTokenExpiry })));
  
  if (users.length > 0) {
    const ts = users[0].resetTokenExpiry;
    console.log('Is valid?', ts && ts > new Date());
    console.log('Current time:', new Date());
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
