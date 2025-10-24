import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('\n=== Checking Users in Database ===\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });

  console.log(`Found ${users.length} users:\n`);

  for (const user of users) {
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Password Hash Length: ${user.passwordHash.length}`);
    console.log(`Hash starts with: ${user.passwordHash.substring(0, 20)}...`);

    // Test if the password 'admin123' matches the hash
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, user.passwordHash);
    console.log(`Password 'admin123' matches: ${isMatch}`);
    console.log('---\n');
  }

  await prisma.$disconnect();
}

checkUsers().catch(console.error);
