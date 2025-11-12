"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const archiver = require("archiver");
const csvParser = require("csv-parser");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const os = require("os");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createProductDto, userId) {
        await this.validateEanCodeUniqueness(createProductDto.eanCode);
        const brand = await this.prisma.brand.findUnique({
            where: { id: createProductDto.brandId },
        });
        if (!brand) {
            throw new common_1.NotFoundException(`Brand with ID ${createProductDto.brandId} not found`);
        }
        await this.validateUserBrandAccess(userId, createProductDto.brandId);
        if (createProductDto.iconIds && createProductDto.iconIds.length > 0) {
            await this.validateIconIds(createProductDto.iconIds);
        }
        const { iconIds, imageData, imageMimeType, ...productData } = createProductDto;
        const product = await this.prisma.product.create({
            data: {
                ...productData,
                supplierId: userId,
                imageData: imageData && imageData.length > 0 ? Buffer.from(imageData, 'base64') : undefined,
                imageMimeType: imageMimeType && imageMimeType.length > 0 ? imageMimeType : undefined,
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
    async findAll(filterDto, userId, userRole) {
        const { brandId, supplierId, search, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', } = filterDto;
        const skip = (page - 1) * limit;
        const where = {};
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
            const searchWords = search.trim().split(/\s+/).filter(word => word.length > 0);
            console.log('🔍 Search query:', search);
            console.log('📝 Search words:', searchWords);
            if (searchWords.length > 0) {
                where.AND = searchWords.map(word => ({
                    OR: [
                        { name: { contains: word, mode: 'insensitive' } },
                        { eanCode: { contains: word } },
                        { supplierNote: { contains: word, mode: 'insensitive' } },
                        { brand: { name: { contains: word, mode: 'insensitive' } } },
                        { category: { name: { contains: word, mode: 'insensitive' } } },
                        { subcategory: { name: { contains: word, mode: 'insensitive' } } },
                    ],
                }));
                console.log('🎯 Prisma where clause:', JSON.stringify(where, null, 2));
            }
        }
        if (userRole === 'supplier' && userId) {
            const userBrands = await this.prisma.userBrand.findMany({
                where: { userId },
                select: { brandId: true },
            });
            const brandIds = userBrands.map(ub => ub.brandId);
            if (brandIds.length > 0) {
                where.brandId = {
                    in: brandIds,
                };
            }
            else {
                return {
                    data: [],
                    meta: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                    },
                };
            }
        }
        const total = await this.prisma.product.count({ where });
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        const isInActiveFlyer = await this.isProductInActiveApprovedFlyer(id);
        return {
            ...this.formatProductResponse(product),
            isInActiveFlyer,
        };
    }
    async findProductsByEan(eanCode, userId) {
        const userBrands = await this.prisma.userBrand.findMany({
            where: { userId },
            select: { brandId: true },
        });
        const brandIds = userBrands.map(ub => ub.brandId);
        const products = await this.prisma.product.findMany({
            where: {
                eanCode,
                brandId: { in: brandIds },
            },
            include: {
                brand: true,
                icons: {
                    include: {
                        icon: true,
                    },
                    orderBy: { position: 'asc' },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return {
            exists: products.length > 0,
            count: products.length,
            latestProduct: products.length > 0 ? this.formatProductResponse(products[0]) : null,
            allProducts: products.map(p => this.formatProductResponse(p)),
        };
    }
    async update(id, updateProductDto, userId) {
        console.log('🔍 Update product DTO:', JSON.stringify(updateProductDto, null, 2));
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { brand: true },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        await this.validateUserBrandAccess(userId, product.brandId);
        if (updateProductDto.iconIds && updateProductDto.iconIds.length > 0) {
            await this.validateIconIds(updateProductDto.iconIds);
        }
        const { iconIds, imageData, imageMimeType, ...productData } = updateProductDto;
        const data = { ...productData };
        console.log('💾 Product data to update in DB:', JSON.stringify(data, null, 2));
        if (imageData && imageMimeType) {
            data.imageData = Buffer.from(imageData, 'base64');
            data.imageMimeType = imageMimeType;
        }
        if (iconIds !== undefined) {
            data.icons = {
                deleteMany: {},
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
    async remove(id, userId) {
        const product = await this.prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        await this.validateUserBrandAccess(userId, product.brandId);
        const isInActiveFlyer = await this.isProductInActiveApprovedFlyer(id);
        if (isInActiveFlyer) {
            throw new common_1.BadRequestException('Produkt nelze smazat, protože je použitý v aktivním nebo schváleném letáku');
        }
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
    async getProductImageData(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            select: {
                imageData: true,
                imageMimeType: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }
    async isProductInActiveApprovedFlyer(productId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeFlyer = await this.prisma.flyerPageSlot.findFirst({
            where: {
                productId,
                page: {
                    flyer: {
                        status: {
                            in: ['approved', 'active'],
                        },
                        validTo: {
                            gte: today,
                        },
                    },
                },
            },
            include: {
                page: {
                    include: {
                        flyer: true,
                    },
                },
            },
        });
        console.log(`🔍 Checking if product ${productId} is in active flyer:`, {
            found: !!activeFlyer,
            flyerId: activeFlyer?.page?.flyer?.id,
            flyerStatus: activeFlyer?.page?.flyer?.status,
            validTo: activeFlyer?.page?.flyer?.validTo,
        });
        return !!activeFlyer;
    }
    async validateEanCodeUniqueness(eanCode, excludeProductId) {
        const enforceUniqueEan = process.env.ENFORCE_UNIQUE_EAN === 'true';
        if (!enforceUniqueEan) {
            return;
        }
        const existingProduct = await this.prisma.product.findFirst({
            where: {
                eanCode,
                isActive: true,
                ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
            },
        });
        if (existingProduct) {
            throw new common_1.ConflictException(`Active product with EAN code ${eanCode} already exists`);
        }
    }
    async validateUserBrandAccess(userId, brandId) {
        const userBrand = await this.prisma.userBrand.findFirst({
            where: {
                userId,
                brandId,
            },
        });
        if (!userBrand) {
            throw new common_1.ForbiddenException('You do not have access to this brand');
        }
    }
    async validateIconIds(iconIds) {
        if (iconIds.length > 4) {
            throw new common_1.BadRequestException('Maximum 4 icons allowed per product');
        }
        const icons = await this.prisma.icon.findMany({
            where: {
                id: {
                    in: iconIds,
                },
            },
        });
        if (icons.length !== iconIds.length) {
            throw new common_1.BadRequestException('One or more icon IDs are invalid');
        }
    }
    formatProductResponse(product) {
        const baseUrl = process.env.API_URL || 'http://localhost:4000';
        return {
            id: product.id,
            eanCode: product.eanCode,
            name: product.name,
            description: product.description,
            supplierNote: product.supplierNote,
            price: parseFloat(product.price.toString()),
            originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString()) : null,
            isActive: product.isActive,
            brandId: product.brandId,
            brandName: product.brand?.name,
            brandColor: product.brand?.color,
            categoryId: product.categoryId,
            categoryName: product.category?.name,
            subcategoryId: product.subcategoryId,
            subcategoryName: product.subcategory?.name,
            installationType: product.installationType,
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
                useBrandColor: pi.icon.useBrandColor,
                position: pi.position,
            })) : [],
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }
    async exportProductsToZip(userId) {
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
            throw new common_1.BadRequestException('No products found to export');
        }
        const tempDir = path.join(os.tmpdir(), `product-export-${Date.now()}`);
        const imagesDir = path.join(tempDir, 'images');
        fs.mkdirSync(tempDir, { recursive: true });
        fs.mkdirSync(imagesDir, { recursive: true });
        try {
            const xlsxPath = path.join(tempDir, 'products.xlsx');
            const worksheetData = [];
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
            for (const product of products) {
                const imageExt = product.imageMimeType?.split('/')[1] || 'jpg';
                const imageFilename = `${product.id}.${imageExt}`;
                const imagePath = path.join(imagesDir, imageFilename);
                fs.writeFileSync(imagePath, product.imageData);
                const iconIds = product.icons.map(pi => pi.icon.id).join(',');
                worksheetData.push([
                    String(product.id),
                    String(product.eanCode),
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
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            worksheet['!cols'] = [
                { wch: 36 },
                { wch: 15 },
                { wch: 30 },
                { wch: 50 },
                { wch: 10 },
                { wch: 15 },
                { wch: 36 },
                { wch: 20 },
                { wch: 36 },
                { wch: 20 },
                { wch: 36 },
                { wch: 20 },
                { wch: 40 },
                { wch: 40 },
            ];
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
            for (let row = 1; row <= range.e.r; row++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: 1 });
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].t = 's';
                    worksheet[cellAddress].z = '@';
                }
            }
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
            XLSX.writeFile(workbook, xlsxPath, {
                bookType: 'xlsx',
                type: 'buffer',
                compression: true,
            });
            const archive = archiver('zip', { zlib: { level: 9 } });
            const chunks = [];
            return new Promise((resolve, reject) => {
                archive.on('data', (chunk) => chunks.push(chunk));
                archive.on('end', () => {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    const zipBuffer = Buffer.concat(chunks);
                    const filename = `products-export-${new Date().toISOString().split('T')[0]}.zip`;
                    resolve({ zipBuffer, filename });
                });
                archive.on('error', (err) => {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    reject(err);
                });
                archive.file(xlsxPath, { name: 'products.xlsx' });
                archive.directory(imagesDir, 'images');
                archive.finalize();
            });
        }
        catch (error) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            throw error;
        }
    }
    async importProductsFromZip(zipBuffer, userId) {
        const tempDir = path.join(os.tmpdir(), `product-import-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
        try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(zipBuffer);
            zip.extractAllTo(tempDir, true);
            const xlsxPath = path.join(tempDir, 'products.xlsx');
            const csvPath = path.join(tempDir, 'products.csv');
            let products = [];
            if (fs.existsSync(xlsxPath)) {
                const workbook = XLSX.readFile(xlsxPath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet);
                products = data;
                console.log('XLSX data:', products[0]);
            }
            else if (fs.existsSync(csvPath)) {
                await new Promise((resolve, reject) => {
                    fs.createReadStream(csvPath, { encoding: 'utf8' })
                        .pipe(csvParser({ separator: ';' }))
                        .on('data', (row) => {
                        console.log('CSV row:', row);
                        products.push(row);
                    })
                        .on('end', () => resolve())
                        .on('error', (err) => reject(err));
                });
            }
            else {
                throw new common_1.BadRequestException('products.xlsx or products.csv not found in ZIP file');
            }
            if (products.length === 0) {
                throw new common_1.BadRequestException('No products found in file');
            }
            const imagesDir = path.join(tempDir, 'images');
            if (!fs.existsSync(imagesDir)) {
                throw new common_1.BadRequestException('images folder not found in ZIP file');
            }
            console.log('First product keys:', Object.keys(products[0]));
            const brandIds = [...new Set(products.map(p => p['Brand ID']).filter(Boolean))];
            const userBrands = await this.prisma.userBrand.findMany({
                where: {
                    userId,
                    brandId: { in: brandIds },
                },
            });
            if (userBrands.length !== brandIds.length) {
                throw new common_1.ForbiddenException('You do not have access to all brands in the import file');
            }
            const results = {
                imported: 0,
                updated: 0,
                skipped: 0,
                errors: [],
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
                    const imageData = fs.readFileSync(imagePath);
                    const imageExt = path.extname(imageFile).substring(1);
                    const imageMimeType = `image/${imageExt}`;
                    const iconIds = row['Icon IDs'] ? row['Icon IDs'].split(',').filter(Boolean) : [];
                    const existingProduct = await this.prisma.product.findFirst({
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
                    }
                    else {
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
                }
                catch (error) {
                    results.errors.push(`Error importing product ${row['EAN Code']}: ${error.message}`);
                    results.skipped++;
                }
            }
            fs.rmSync(tempDir, { recursive: true, force: true });
            return results;
        }
        catch (error) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            throw error;
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map