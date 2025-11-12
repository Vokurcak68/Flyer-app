"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔍 Finding all flyers...');
    const flyers = await prisma.flyer.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            supplier: {
                select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
    console.log(`\n📊 Total flyers: ${flyers.length}\n`);
    flyers.forEach((flyer, index) => {
        console.log(`${index + 1}. ${flyer.name}`);
        console.log(`   ID: ${flyer.id}`);
        console.log(`   Status: ${flyer.status}`);
        console.log(`   isDraft: ${flyer.isDraft}`);
        console.log(`   Supplier: ${flyer.supplier?.email || 'Unknown'}`);
        console.log(`   Rejection: ${flyer.rejectionReason || 'None'}`);
        console.log(`   Created: ${flyer.createdAt.toLocaleString()}`);
        console.log('');
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
//# sourceMappingURL=check-all-flyers.js.map