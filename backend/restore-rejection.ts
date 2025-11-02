import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Restoring rejection reason for flyer f2cae575...');

  const updated = await prisma.flyer.update({
    where: {
      id: 'f2cae575-580f-4577-8e0b-d42bdc49f2c7',
    },
    data: {
      rejectionReason: 'Zamítnuto (důvod byl smazán)',
      isDraft: true, // Keep it editable
    },
  });

  console.log('\n✅ Updated flyer:');
  console.log(`   Name: ${updated.name}`);
  console.log(`   Status: ${updated.status}`);
  console.log(`   isDraft: ${updated.isDraft}`);
  console.log(`   Rejection: ${updated.rejectionReason}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
