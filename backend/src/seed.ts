import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create brands
  const samsung = await prisma.brand.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Samsung',
    }
  });

  const lg = await prisma.brand.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'LG',
    }
  });

  const bosch = await prisma.brand.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Bosch',
    }
  });

  console.log('✅ Brands created');

  // Create users
  const passwordHash = await bcrypt.hash('admin123', 10);

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@system.cz' },
    update: {
      passwordHash,
    },
    create: {
      email: 'admin@system.cz',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Systému',
      role: 'admin',
    }
  });

  const supplier = await prisma.user.upsert({
    where: { email: 'dodavatel@acme.cz' },
    update: {
      passwordHash,
    },
    create: {
      email: 'dodavatel@acme.cz',
      passwordHash,
      firstName: 'Jan',
      lastName: 'Novák',
      role: 'supplier',
      brands: {
        create: [
          { brandId: samsung.id },
          { brandId: lg.id },
          { brandId: bosch.id }
        ]
      }
    }
  });

  await prisma.user.upsert({
    where: { email: 'schvalovatel1@company.cz' },
    update: {
      passwordHash,
    },
    create: {
      email: 'schvalovatel1@company.cz',
      passwordHash,
      firstName: 'Eva',
      lastName: 'Svobodová',
      role: 'approver'
    }
  });

  await prisma.user.upsert({
    where: { email: 'schvalovatel2@company.cz' },
    update: {
      passwordHash,
    },
    create: {
      email: 'schvalovatel2@company.cz',
      passwordHash,
      firstName: 'Petr',
      lastName: 'Dvořák',
      role: 'approver'
    }
  });

  await prisma.user.upsert({
    where: { email: 'uzivatel@email.cz' },
    update: {
      passwordHash,
    },
    create: {
      email: 'uzivatel@email.cz',
      passwordHash,
      firstName: 'Marie',
      lastName: 'Nováková',
      role: 'end_user'
    }
  });

  console.log('✅ Users created');
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📧 Login credentials:');
  console.log('Admin: admin@system.cz / admin123');
  console.log('Dodavatel: dodavatel@acme.cz / admin123');
  console.log('Schvalovatel 1: schvalovatel1@company.cz / admin123');
  console.log('Schvalovatel 2: schvalovatel2@company.cz / admin123');
  console.log('Koncový uživatel: uzivatel@email.cz / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
