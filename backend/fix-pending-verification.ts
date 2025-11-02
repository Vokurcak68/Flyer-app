import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding flyer with pending_verification status...');

  const flyer = await prisma.flyer.findUnique({
    where: {
      id: '66fb41b8-0433-45e1-acc5-9fdc07e66378',
    },
  });

  if (!flyer) {
    console.log('❌ Flyer not found');
    return;
  }

  console.log('\n📊 Current state:');
  console.log(`   Name: ${flyer.name}`);
  console.log(`   Status: ${flyer.status}`);
  console.log(`   isDraft: ${flyer.isDraft}`);
  console.log(`   Rejection: ${flyer.rejectionReason || 'None'}`);

  console.log('\n🔧 Fixing flyer status to draft...');

  const updated = await prisma.flyer.update({
    where: {
      id: '66fb41b8-0433-45e1-acc5-9fdc07e66378',
    },
    data: {
      status: 'draft',
      isDraft: true,
      rejectionReason: null,
    },
  });

  console.log('\n✅ Updated successfully!');
  console.log('\n📊 New state:');
  console.log(`   Name: ${updated.name}`);
  console.log(`   Status: ${updated.status}`);
  console.log(`   isDraft: ${updated.isDraft}`);
  console.log(`   Rejection: ${updated.rejectionReason || 'None'}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
