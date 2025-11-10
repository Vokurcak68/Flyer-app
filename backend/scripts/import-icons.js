/**
 * Import Icons Script
 * Imports SVG icons from Ikony_zdroj folder to database
 * Usage: node scripts/import-icons.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importIcons() {
  try {
    console.log('🔍 Načítám SVG ikony ze složky Ikony_zdroj...');

    const iconsSourceDir = path.join(__dirname, '..', '..', 'Ikony_zdroj');

    // Check if directory exists
    if (!fs.existsSync(iconsSourceDir)) {
      console.error(`❌ Složka ${iconsSourceDir} neexistuje!`);
      process.exit(1);
    }

    // Read all SVG files
    const files = fs.readdirSync(iconsSourceDir).filter(file => file.endsWith('.svg'));
    console.log(`✅ Nalezeno ${files.length} SVG souborů`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of files) {
      try {
        // Remove .svg extension to get icon name
        const iconName = file.replace('.svg', '');
        const filePath = path.join(iconsSourceDir, file);

        // Read SVG content as binary buffer
        const svgBuffer = fs.readFileSync(filePath);

        // Check if icon with this name already exists
        const existingIcon = await prisma.icon.findFirst({
          where: { name: iconName }
        });

        if (existingIcon) {
          console.log(`⏭️  Přeskakuji: ${iconName} (již existuje)`);
          skipped++;
          continue;
        }

        // Create new icon in database
        await prisma.icon.create({
          data: {
            name: iconName,
            imageData: svgBuffer,
            imageMimeType: 'image/svg+xml',
            isEnergyClass: iconName.includes('ENERG') || iconName.startsWith('Energie '),
          }
        });

        console.log(`✅ Import: ${iconName}`);
        imported++;

      } catch (error) {
        console.error(`❌ Chyba při importu ${file}:`, error.message);
        errors++;
      }
    }

    console.log('');
    console.log('✅ Import dokončen!');
    console.log('');
    console.log('📋 Shrnutí:');
    console.log(`   - Celkem souborů: ${files.length}`);
    console.log(`   - Naimportováno: ${imported}`);
    console.log(`   - Přeskočeno (již existuje): ${skipped}`);
    console.log(`   - Chyby: ${errors}`);
    console.log('');

  } catch (error) {
    console.error('❌ Chyba při importu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importIcons();
