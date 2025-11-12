"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔍 Finding draft flyers named "Nový leták"...');
    const flyers = await prisma.flyer.findMany({
        where: {
            name: 'Nový leták',
            status: 'draft',
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    console.log(`\n📊 Found ${flyers.length} flyers:`);
    flyers.forEach((flyer, index) => {
        console.log(`\n${index + 1}. Flyer ID: ${flyer.id}`);
        console.log(`   Name: ${flyer.name}`);
        console.log(`   Status: ${flyer.status}`);
        console.log(`   isDraft: ${flyer.isDraft}`);
        console.log(`   Rejection Reason: ${flyer.rejectionReason || 'None'}`);
        console.log(`   Created: ${flyer.createdAt}`);
    });
    console.log('\n🔧 Fixing flyers...');
    const result = await prisma.flyer.updateMany({
        where: {
            name: 'Nový leták',
            status: 'draft',
        },
        data: {
            isDraft: true,
            rejectionReason: null,
        },
    });
    console.log(`\n✅ Updated ${result.count} flyers`);
    console.log('\n🔍 Verifying updates...');
    const updatedFlyers = await prisma.flyer.findMany({
        where: {
            name: 'Nový leták',
            status: 'draft',
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    console.log(`\n📊 After update:`);
    updatedFlyers.forEach((flyer, index) => {
        console.log(`\n${index + 1}. Flyer ID: ${flyer.id}`);
        console.log(`   Name: ${flyer.name}`);
        console.log(`   Status: ${flyer.status}`);
        console.log(`   isDraft: ${flyer.isDraft}`);
        console.log(`   Rejection Reason: ${flyer.rejectionReason || 'None'}`);
    });
}
main()
    .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=fix-draft-flyers.js.map