"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const categoriesData = [
    {
        name: 'Lednice',
        subcategories: [
            'Vestavná chladnička',
            'Vestavná kombinovaná chladnička',
            'Vestavná vinotéka',
            'Volně stojící americká chladnička',
            'Volně stojící chladnička',
            'Volně stojící kombinovaná chladnička',
            'Volně stojící vinotéka',
        ],
    },
    {
        name: 'Varné desky',
        subcategories: [
            'Indukční deska',
            'Indukční varná deska s odsavačem par',
            'Plynová deska',
            'Plynová deska - tvrzené sklo',
            'Sklokeramická deska',
        ],
    },
    {
        name: 'Trouby',
        subcategories: [
            'Kompaktní multifunkční trouba',
            'Kompaktní multifunkční trouba s mikrovlnným ohřevem',
            'Kompaktní parní trouba',
            'Kompaktní trouba',
            'Plech na pečení',
            'Příslušenství',
            'Rošt na pečení',
            'Vestavná multifunkční trouba',
            'Vestavná multifunkční trouba s mikrovlnným ohřevem',
            'Vestavná plně parní trouba',
            'Vestavná rustikální trouba',
            'Vestavná trouba',
            'Vestavná trouba s podporou páry',
            'Vestavná zásuvka na vakuování',
            'Volně stojící sporák',
        ],
    },
    {
        name: 'Sušičky',
        subcategories: [
            'Vestavná sušička',
            'Volně stojící sušička',
        ],
    },
    {
        name: 'Pračky',
        subcategories: [
            'Mezikus pračka-sušička',
            'Příslušenství',
            'Vestavná pračka',
            'Vestavná pračka se sušičkou',
            'Volně stojící pračka',
            'Volně stojící pračka se sušičkou',
            'Vrchem plněná pračka',
        ],
    },
    {
        name: 'Myčky',
        subcategories: [
            'Plně vestavná myčka',
            'Vestavná myčka s panelem',
            'Volně stojící myčka',
        ],
    },
    {
        name: 'Mikrovlnky',
        subcategories: [
            'Vestavná mikrovlnná trouba',
            'Vestavná mikrovlnná trouba do horní skříňky',
            'Volně stojící mikrovlnná trouba',
        ],
    },
    {
        name: 'Mrazáky',
        subcategories: [
            'Kompaktní šokový mrazák',
            'Vestavný mrazák',
            'Volně stojící mrazák',
        ],
    },
    {
        name: 'Kávovary',
        subcategories: [
            'Vestavná ohřevná zásuvka',
            'Vestavný kávovar',
            'Volně stojící kávovar',
        ],
    },
    {
        name: 'Digestoře',
        subcategories: [],
    },
    {
        name: 'Dřezy',
        subcategories: [],
    },
    {
        name: 'Drtiče',
        subcategories: [],
    },
    {
        name: 'Dávkovače Jaru',
        subcategories: [],
    },
    {
        name: 'Baterie',
        subcategories: [],
    },
    {
        name: 'Ohřevné zásuvky',
        subcategories: [],
    },
    {
        name: 'Odpadkové koše',
        subcategories: [],
    },
];
async function main() {
    console.log('Start seeding categories and subcategories...');
    for (const categoryData of categoriesData) {
        const category = await prisma.category.upsert({
            where: { name: categoryData.name },
            update: {},
            create: { name: categoryData.name },
        });
        console.log(`Created/Updated category: ${category.name}`);
        for (const subcategoryName of categoryData.subcategories) {
            const existing = await prisma.subcategory.findFirst({
                where: {
                    categoryId: category.id,
                    name: subcategoryName,
                },
            });
            if (!existing) {
                await prisma.subcategory.create({
                    data: {
                        name: subcategoryName,
                        categoryId: category.id,
                    },
                });
                console.log(`  - Created subcategory: ${subcategoryName}`);
            }
            else {
                console.log(`  - Subcategory already exists: ${subcategoryName}`);
            }
        }
    }
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-categories.js.map