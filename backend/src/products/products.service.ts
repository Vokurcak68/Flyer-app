import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { Prisma } from '@prisma/client';
import * as archiver from 'archiver';
import * as csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    // Check if EAN code already exists
    await this.validateEanCodeUniqueness(createProductDto.eanCode);

    // Verify brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id: createProductDto.brandId },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${createProductDto.brandId} not found`);
    }

    // Verify user has access to this brand
    await this.validateUserBrandAccess(userId, createProductDto.brandId);

    // Validate icon IDs if provided
    if (createProductDto.iconIds && createProductDto.iconIds.length > 0) {
      await this.validateIconIds(createProductDto.iconIds);
    }

    // Create product with icons
    const { iconIds, imageData, imageMimeType, ...productData } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        supplierId: userId,
        imageData: Buffer.from(imageData, 'base64'),
        imageMimeType,
        icons: iconIds && iconIds.length > 0 ? {
          create: iconIds.map((iconId, index) => ({
            iconId,
            position: index,
          })),
        } : undefined,
      },
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.formatProductResponse(product);
  }

  async findAll(filterDto: ProductFilterDto, userId?: string, userRole?: string) {
    const {
      brandId,
      supplierId,
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (brandId) {
      where.brandId = brandId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      // Split search into words and create AND logic
      // Each word must be found in at least one field
      const searchWords = search.trim().split(/\s+/).filter(word => word.length > 0);

      console.log('🔍 Search query:', search);
      console.log('📝 Search words:', searchWords);

      if (searchWords.length > 0) {
        where.AND = searchWords.map(word => ({
          OR: [
            { name: { contains: word, mode: 'insensitive' } },
            { eanCode: { contains: word } },
            { brand: { name: { contains: word, mode: 'insensitive' } } },
            { category: { name: { contains: word, mode: 'insensitive' } } },
            { subcategory: { name: { contains: word, mode: 'insensitive' } } },
          ],
        }));

        console.log('🎯 Prisma where clause:', JSON.stringify(where, null, 2));
      }
    }

    // If user is a supplier, only show their products
    if (userRole === 'supplier' && userId) {
      where.supplierId = userId;
    }

    // Get total count
    const total = await this.prisma.product.count({ where });

    // Get products
    const products = await this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        category: true,
        subcategory: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      data: products.map(product => this.formatProductResponse(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.formatProductResponse(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    console.log('🔍 Update product DTO:', JSON.stringify(updateProductDto, null, 2));

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { brand: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Verify user owns this product (through brand access)
    await this.validateUserBrandAccess(userId, product.brandId);

    // Validate icon IDs if provided
    if (updateProductDto.iconIds && updateProductDto.iconIds.length > 0) {
      await this.validateIconIds(updateProductDto.iconIds);
    }

    // Note: brandId cannot be changed after creation (excluded from UpdateProductDto)

    // Prepare data object
    const { iconIds, imageData, imageMimeType, ...productData } = updateProductDto;
    const data: any = { ...productData };

    console.log('💾 Product data to update in DB:', JSON.stringify(data, null, 2));

    // Convert base64 image data to Buffer if provided
    if (imageData && imageMimeType) {
      data.imageData = Buffer.from(imageData, 'base64');
      data.imageMimeType = imageMimeType;
    }

    // Handle icon updates if provided
    if (iconIds !== undefined) {
      // Delete existing icons and create new ones
      data.icons = {
        deleteMany: {}, // Delete all existing icons
        create: iconIds.map((iconId, index) => ({
          iconId,
          position: index,
        })),
      };
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.formatProductResponse(updatedProduct);
  }

  async remove(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Verify user owns this product
    await this.validateUserBrandAccess(userId, product.brandId);

    // Soft delete
    const deletedProduct = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.formatProductResponse(deletedProduct);
  }

  // Icon management methods removed - icons are now managed through global icon library
  // Icons are assigned during product create/update via iconIds array

  async getProductImageData(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        imageData: true,
        imageMimeType: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  // Helper methods

  private async validateEanCodeUniqueness(eanCode: string) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { eanCode },
    });

    if (existingProduct) {
      throw new ConflictException(`Product with EAN code ${eanCode} already exists`);
    }
  }

  private async validateUserBrandAccess(userId: string, brandId: string) {
    const userBrand = await this.prisma.userBrand.findFirst({
      where: {
        userId,
        brandId,
      },
    });

    if (!userBrand) {
      throw new ForbiddenException('You do not have access to this brand');
    }
  }

  private async validateIconIds(iconIds: string[]) {
    if (iconIds.length > 4) {
      throw new BadRequestException('Maximum 4 icons allowed per product');
    }

    // Check that all icon IDs exist in global icon library
    const icons = await this.prisma.icon.findMany({
      where: {
        id: {
          in: iconIds,
        },
      },
    });

    if (icons.length !== iconIds.length) {
      throw new BadRequestException('One or more icon IDs are invalid');
    }
  }

  private formatProductResponse(product: any) {
    const baseUrl = process.env.API_URL || 'http://localhost:4000';

    return {
      id: product.id,
      eanCode: product.eanCode,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString()) : null,
      isActive: product.isActive,
      brandId: product.brandId,
      brandName: product.brand?.name,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      subcategoryId: product.subcategoryId,
      subcategoryName: product.subcategory?.name,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
      } : null,
      supplier: product.supplier ? {
        id: product.supplier.id,
        email: product.supplier.email,
        firstName: product.supplier.firstName,
        lastName: product.supplier.lastName,
      } : null,
      icons: product.icons ? product.icons.map(pi => ({
        id: pi.icon.id,
        name: pi.icon.name,
        imageUrl: `${baseUrl}/api/icons/${pi.icon.id}/image`,
        isEnergyClass: pi.icon.isEnergyClass,
        position: pi.position,
      })) : [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  // Export products to ZIP with CSV and images
  async exportProductsToZip(userId: string): Promise<{ zipBuffer: Buffer; filename: string }> {
    // Fetch all active products for this user
    const products = await this.prisma.product.findMany({
      where: {
        supplierId: userId,
        isActive: true,
      },
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        category: true,
        subcategory: true,
      },
    });

    if (products.length === 0) {
      throw new BadRequestException('No products found to export');
    }

    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), `product-export-${Date.now()}`);
    const imagesDir = path.join(tempDir, 'images');
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(imagesDir, { recursive: true });

    try {
      // Prepare XLSX file with proper column types
      const xlsxPath = path.join(tempDir, 'products.xlsx');
      const worksheetData: any[][] = [];

      // Add header row
      worksheetData.push([
        'ID',
        'EAN Code',
        'Name',
        'Description',
        'Price',
        'Original Price',
        'Brand ID',
        'Brand Name',
        'Category ID',
        'Category Name',
        'Subcategory ID',
        'Subcategory Name',
        'Icon IDs',
        'Image File',
      ]);

      // Process each product
      for (const product of products) {
        // Determine image extension from MIME type
        const imageExt = product.imageMimeType?.split('/')[1] || 'jpg';
        const imageFilename = `${product.id}.${imageExt}`;
        const imagePath = path.join(imagesDir, imageFilename);

        // Write image file
        fs.writeFileSync(imagePath, product.imageData);

        // Get icon IDs
        const iconIds = product.icons.map(pi => pi.icon.id).join(',');

        // Add product row - ensure all strings are properly encoded
        worksheetData.push([
          String(product.id),
          String(product.eanCode), // Will be formatted as text
          String(product.name),
          product.description ? String(product.description) : '',
          parseFloat(product.price.toString()),
          product.originalPrice ? parseFloat(product.originalPrice.toString()) : '',
          String(product.brandId),
          String(product.brand.name),
          product.categoryId ? String(product.categoryId) : '',
          product.category?.name ? String(product.category.name) : '',
          product.subcategoryId ? String(product.subcategoryId) : '',
          product.subcategory?.name ? String(product.subcategory.name) : '',
          iconIds,
          imageFilename,
        ]);
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths for better readability
      worksheet['!cols'] = [
        { wch: 36 }, // ID
        { wch: 15 }, // EAN Code
        { wch: 30 }, // Name
        { wch: 50 }, // Description
        { wch: 10 }, // Price
        { wch: 15 }, // Original Price
        { wch: 36 }, // Brand ID
        { wch: 20 }, // Brand Name
        { wch: 36 }, // Category ID
        { wch: 20 }, // Category Name
        { wch: 36 }, // Subcategory ID
        { wch: 20 }, // Subcategory Name
        { wch: 40 }, // Icon IDs
        { wch: 40 }, // Image File
      ];

      // Format EAN Code column as text (column B, index 1)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let row = 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 1 }); // Column B (EAN)
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].t = 's'; // Force type as string
          worksheet[cellAddress].z = '@'; // Text format
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      // Write XLSX file with proper encoding
      XLSX.writeFile(workbook, xlsxPath, {
        bookType: 'xlsx',
        type: 'buffer',
        compression: true,
      });

      // Create ZIP archive
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        archive.on('data', (chunk) => chunks.push(chunk));
        archive.on('end', () => {
          // Clean up temp directory
          fs.rmSync(tempDir, { recursive: true, force: true });

          const zipBuffer = Buffer.concat(chunks);
          const filename = `products-export-${new Date().toISOString().split('T')[0]}.zip`;
          resolve({ zipBuffer, filename });
        });
        archive.on('error', (err) => {
          // Clean up temp directory
          fs.rmSync(tempDir, { recursive: true, force: true });
          reject(err);
        });

        // Add files to archive
        archive.file(xlsxPath, { name: 'products.xlsx' });
        archive.directory(imagesDir, 'images');

        // Finalize archive
        archive.finalize();
      });
    } catch (error) {
      // Clean up on error
      fs.rmSync(tempDir, { recursive: true, force: true });
      throw error;
    }
  }

  // Import products from ZIP with CSV and images
  async importProductsFromZip(zipBuffer: Buffer, userId: string) {
    const tempDir = path.join(os.tmpdir(), `product-import-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Extract ZIP file using node-stream-zip or similar
      // For simplicity, we'll use a streaming approach with archiver's unzip
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(tempDir, true);

      // Check for XLSX or CSV file
      const xlsxPath = path.join(tempDir, 'products.xlsx');
      const csvPath = path.join(tempDir, 'products.csv');

      let products: any[] = [];

      if (fs.existsSync(xlsxPath)) {
        // Parse XLSX file
        const workbook = XLSX.readFile(xlsxPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with header row
        const data = XLSX.utils.sheet_to_json(worksheet);
        products = data;

        console.log('XLSX data:', products[0]);
      } else if (fs.existsSync(csvPath)) {
        // Parse CSV file (backwards compatibility)
        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(csvPath, { encoding: 'utf8' })
            .pipe(csvParser({ separator: ';' }))
            .on('data', (row) => {
              console.log('CSV row:', row);
              products.push(row);
            })
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
        });
      } else {
        throw new BadRequestException('products.xlsx or products.csv not found in ZIP file');
      }

      if (products.length === 0) {
        throw new BadRequestException('No products found in file');
      }

      const imagesDir = path.join(tempDir, 'images');
      if (!fs.existsSync(imagesDir)) {
        throw new BadRequestException('images folder not found in ZIP file');
      }

      console.log('First product keys:', Object.keys(products[0]));

      // Verify user has access to all brands
      const brandIds = [...new Set(products.map(p => p['Brand ID']).filter(Boolean))];
      const userBrands = await this.prisma.userBrand.findMany({
        where: {
          userId,
          brandId: { in: brandIds },
        },
      });

      if (userBrands.length !== brandIds.length) {
        throw new ForbiddenException('You do not have access to all brands in the import file');
      }

      // Import products
      const results = {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const row of products) {
        try {
          const eanCode = row['EAN Code'];
          const imageFile = row['Image File'];

          if (!eanCode) {
            results.errors.push(`Missing EAN Code in row`);
            results.skipped++;
            continue;
          }

          if (!imageFile) {
            results.errors.push(`Missing Image File for EAN ${eanCode}`);
            results.skipped++;
            continue;
          }

          const imagePath = path.join(imagesDir, imageFile);

          if (!fs.existsSync(imagePath)) {
            results.errors.push(`Image file not found for EAN ${eanCode}: ${imageFile}`);
            results.skipped++;
            continue;
          }

          // Read image data
          const imageData = fs.readFileSync(imagePath);
          const imageExt = path.extname(imageFile).substring(1);
          const imageMimeType = `image/${imageExt}`;

          // Parse icon IDs
          const iconIds = row['Icon IDs'] ? row['Icon IDs'].split(',').filter(Boolean) : [];

          // Check if product already exists
          const existingProduct = await this.prisma.product.findUnique({
            where: { eanCode },
          });

          const productData = {
            eanCode,
            name: row['Name'],
            description: row['Description'] || null,
            price: parseFloat(row['Price']),
            originalPrice: row['Original Price'] ? parseFloat(row['Original Price']) : null,
            brandId: row['Brand ID'],
            categoryId: row['Category ID'] || null,
            subcategoryId: row['Subcategory ID'] || null,
            imageData,
            imageMimeType,
            supplierId: userId,
            isActive: true,
          };

          if (existingProduct) {
            // Update existing product
            await this.prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                ...productData,
                icons: iconIds.length > 0 ? {
                  deleteMany: {},
                  create: iconIds.map((iconId, index) => ({
                    iconId,
                    position: index,
                  })),
                } : undefined,
              },
            });
            results.updated++;
          } else {
            // Create new product
            await this.prisma.product.create({
              data: {
                ...productData,
                icons: iconIds.length > 0 ? {
                  create: iconIds.map((iconId, index) => ({
                    iconId,
                    position: index,
                  })),
                } : undefined,
              },
            });
            results.imported++;
          }
        } catch (error) {
          results.errors.push(`Error importing product ${row['EAN Code']}: ${error.message}`);
          results.skipped++;
        }
      }

      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });

      return results;
    } catch (error) {
      // Clean up on error
      fs.rmSync(tempDir, { recursive: true, force: true });
      throw error;
    }
  }
}
