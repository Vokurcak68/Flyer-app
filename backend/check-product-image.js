const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProduct() {
  try {
    // Zkontroluj kopii
    const copy = await prisma.product.findUnique({
      where: { eanCode: '8003437041402' },
      select: {
        id: true,
        eanCode: true,
        name: true,
        imageData: true,
        imageMimeType: true,
      },
    });

    console.log('=== KOPIE (8003437041402) ===');
    if (!copy) {
      console.log('Produkt nebyl nalezen');
    } else {
      console.log('- ID:', copy.id);
      console.log('- EAN:', copy.eanCode);
      console.log('- Název:', copy.name);
      console.log('- Má obrázek:', copy.imageData ? 'ANO' : 'NE');
      console.log('- Velikost obrázku:', copy.imageData ? `${copy.imageData.length} bytů` : 'N/A');
      console.log('- MIME type:', copy.imageMimeType || 'N/A');
    }

    // Zkontroluj všechny produkty s podobným názvem (původní)
    const originals = await prisma.product.findMany({
      where: {
        name: {
          contains: 'IKGS 5IVe1000',
        },
      },
      select: {
        id: true,
        eanCode: true,
        name: true,
        imageData: true,
        imageMimeType: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log('\n=== PRODUKTY S PODOBNÝM NÁZVEM ===');
    originals.forEach((p, idx) => {
      console.log(`\n${idx + 1}. Produkt:`);
      console.log('- ID:', p.id);
      console.log('- EAN:', p.eanCode);
      console.log('- Název:', p.name);
      console.log('- Má obrázek:', p.imageData ? 'ANO' : 'NE');
      console.log('- Velikost obrázku:', p.imageData ? `${p.imageData.length} bytů` : 'N/A');
      console.log('- MIME type:', p.imageMimeType || 'N/A');
    });
  } catch (error) {
    console.error('Chyba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProduct();
