/**
 * Export Categories and Subcategories Script
 * Exports categories and subcategories from development database to SQL file
 * Usage: node scripts/export-categories.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportCategories() {
  try {
    console.log('🔍 Načítám kategorie a podkategorie z databáze...');

    // Fetch all categories with subcategories
    const categories = await prisma.category.findMany({
      include: {
        subcategories: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`✅ Nalezeno ${categories.length} kategorií`);

    let totalSubcategories = 0;
    categories.forEach(cat => {
      totalSubcategories += cat.subcategories.length;
    });
    console.log(`✅ Nalezeno ${totalSubcategories} podkategorií`);

    // Generate SQL INSERT statements
    let sqlStatements = [];

    // Header with UTF-8 declaration
    sqlStatements.push('-- -*- coding: utf-8 -*-');
    sqlStatements.push('-- Kódování: UTF-8');
    sqlStatements.push('-- Export kategorií a podkategorií');
    sqlStatements.push('-- Vygenerováno: ' + new Date().toISOString());
    sqlStatements.push('-- Počet kategorií: ' + categories.length);
    sqlStatements.push('-- Počet podkategorií: ' + totalSubcategories);
    sqlStatements.push('');
    sqlStatements.push('-- Nastavení client encoding na UTF-8');
    sqlStatements.push('SET client_encoding = \'UTF8\';');
    sqlStatements.push('');
    sqlStatements.push('-- Začátek transakce');
    sqlStatements.push('BEGIN;');
    sqlStatements.push('');

    // Export categories
    sqlStatements.push('-- Kategorie');
    for (const category of categories) {
      const id = category.id;
      const name = category.name.replace(/'/g, "''"); // Escape single quotes
      const mssqlCode = category.mssqlCode ? `'${category.mssqlCode}'` : 'NULL';
      const createdAt = category.createdAt.toISOString();
      const updatedAt = category.updatedAt.toISOString();

      sqlStatements.push(
        `INSERT INTO categories (id, name, mssql_code, created_at, updated_at) ` +
        `VALUES ('${id}', '${name}', ${mssqlCode}, '${createdAt}', '${updatedAt}') ` +
        `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, mssql_code = EXCLUDED.mssql_code, updated_at = EXCLUDED.updated_at;`
      );
    }

    sqlStatements.push('');
    sqlStatements.push('-- Podkategorie');

    // Export subcategories
    for (const category of categories) {
      if (category.subcategories.length > 0) {
        sqlStatements.push(`-- Podkategorie pro kategorii: ${category.name}`);

        for (const subcategory of category.subcategories) {
          const id = subcategory.id;
          const categoryId = subcategory.categoryId;
          const name = subcategory.name.replace(/'/g, "''"); // Escape single quotes
          const createdAt = subcategory.createdAt.toISOString();
          const updatedAt = subcategory.updatedAt.toISOString();

          sqlStatements.push(
            `INSERT INTO subcategories (id, category_id, name, created_at, updated_at) ` +
            `VALUES ('${id}', '${categoryId}', '${name}', '${createdAt}', '${updatedAt}') ` +
            `ON CONFLICT (id) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, updated_at = EXCLUDED.updated_at;`
          );
        }
        sqlStatements.push('');
      }
    }

    // Footer
    sqlStatements.push('-- Konec transakce');
    sqlStatements.push('COMMIT;');
    sqlStatements.push('');
    sqlStatements.push('-- Export dokončen');

    // Write to file
    const outputPath = path.join(__dirname, '..', 'categories-export.sql');
    fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf8');

    console.log('');
    console.log('✅ Export dokončen!');
    console.log(`📄 Soubor uložen: ${outputPath}`);
    console.log('');
    console.log('📋 Shrnutí:');
    console.log(`   - Kategorií: ${categories.length}`);
    console.log(`   - Podkategorií: ${totalSubcategories}`);
    console.log('');
    console.log('🚀 Další kroky:');
    console.log('   1. Zkopírujte soubor categories-export.sql na produkční server');
    console.log('   2. Připojte se k produkční databázi');
    console.log('   3. Spusťte: psql -U username -d database_name -f categories-export.sql');
    console.log('   nebo použijte pgAdmin/jiný nástroj pro spuštění SQL scriptu');
    console.log('');

  } catch (error) {
    console.error('❌ Chyba při exportu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run export
exportCategories();
