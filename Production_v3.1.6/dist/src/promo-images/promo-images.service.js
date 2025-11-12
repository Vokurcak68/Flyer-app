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
exports.PromoImagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PromoImagesService = class PromoImagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, userRole, dto) {
        if (dto.brandId && userRole !== 'admin') {
            const hasAccess = await this.prisma.userBrand.findFirst({
                where: {
                    userId,
                    brandId: dto.brandId,
                },
            });
            if (!hasAccess) {
                throw new common_1.ForbiddenException('You do not have access to this brand');
            }
        }
        return this.prisma.promoImage.create({
            data: {
                supplierId: userId,
                name: dto.name,
                imageData: Buffer.from(dto.imageData, 'base64'),
                imageMimeType: dto.imageMimeType,
                defaultSize: dto.defaultSize,
                brandId: dto.brandId,
                isForEndUsers: dto.isForEndUsers || false,
                fillDate: dto.fillDate || false,
            },
            include: {
                brand: true,
            },
        });
    }
    async findAll(userId, role, filters) {
        const where = {};
        if (role === 'supplier') {
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
                return [];
            }
        }
        else if (role === 'end_user') {
            where.isForEndUsers = true;
        }
        if (filters.brandId) {
            where.brandId = filters.brandId;
        }
        if (filters.search) {
            where.name = {
                contains: filters.search,
                mode: 'insensitive',
            };
        }
        const promoImages = await this.prisma.promoImage.findMany({
            where,
            include: {
                brand: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return promoImages.map(({ imageData, imageMimeType, ...promo }) => promo);
    }
    async findOne(id) {
        const promoImage = await this.prisma.promoImage.findUnique({
            where: { id },
            include: {
                brand: true,
            },
        });
        if (!promoImage) {
            throw new common_1.NotFoundException(`Promo image with ID ${id} not found`);
        }
        return promoImage;
    }
    async update(id, dto, userId, userRole) {
        const promoImage = await this.findOne(id);
        if (userRole !== 'admin' && promoImage.supplierId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own promo images');
        }
        if (dto.brandId && userRole !== 'admin') {
            const hasAccess = await this.prisma.userBrand.findFirst({
                where: {
                    userId,
                    brandId: dto.brandId,
                },
            });
            if (!hasAccess) {
                throw new common_1.ForbiddenException('You do not have access to this brand');
            }
        }
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.defaultSize !== undefined)
            updateData.defaultSize = dto.defaultSize;
        if (dto.brandId !== undefined)
            updateData.brandId = dto.brandId;
        if (dto.isForEndUsers !== undefined)
            updateData.isForEndUsers = dto.isForEndUsers;
        if (dto.fillDate !== undefined)
            updateData.fillDate = dto.fillDate;
        if (dto.imageData && dto.imageMimeType) {
            updateData.imageData = Buffer.from(dto.imageData, 'base64');
            updateData.imageMimeType = dto.imageMimeType;
        }
        return this.prisma.promoImage.update({
            where: { id },
            data: updateData,
            include: {
                brand: true,
            },
        });
    }
    async remove(id, userId, userRole) {
        const promoImage = await this.findOne(id);
        if (userRole !== 'admin' && promoImage.supplierId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own promo images');
        }
        return this.prisma.promoImage.delete({
            where: { id },
        });
    }
    async findBySizeType(sizeType) {
        return this.prisma.promoImage.findMany({
            where: {},
            include: {
                brand: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.PromoImagesService = PromoImagesService;
exports.PromoImagesService = PromoImagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromoImagesService);
//# sourceMappingURL=promo-images.service.js.map