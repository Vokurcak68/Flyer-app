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
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { eanCode: { contains: search } },
            ];
        }
        if (userRole === 'supplier' && userId) {
            where.supplierId = userId;
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
        return this.formatProductResponse(product);
    }
    async update(id, updateProductDto, userId) {
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
    async validateEanCodeUniqueness(eanCode) {
        const existingProduct = await this.prisma.product.findUnique({
            where: { eanCode },
        });
        if (existingProduct) {
            throw new common_1.ConflictException(`Product with EAN code ${eanCode} already exists`);
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
            price: parseFloat(product.price.toString()),
            originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString()) : null,
            isActive: product.isActive,
            brandId: product.brandId,
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map