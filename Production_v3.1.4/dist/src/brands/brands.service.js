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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BrandsService = class BrandsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.brand.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
    }
    async findOne(id) {
        const brand = await this.prisma.brand.findUnique({
            where: { id },
            include: {
                products: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: { products: true, users: true },
                },
            },
        });
        if (!brand) {
            throw new common_1.NotFoundException(`Brand with ID ${id} not found`);
        }
        return brand;
    }
    async findBySupplier(userId) {
        const userBrands = await this.prisma.userBrand.findMany({
            where: { userId },
            include: {
                brand: {
                    include: {
                        _count: {
                            select: { products: true },
                        },
                    },
                },
            },
        });
        return userBrands.map((ub) => ub.brand);
    }
    async create(dto) {
        console.log('🔵 Creating brand:', {
            name: dto.name,
            hasLogoData: !!dto.logoData,
            logoMimeType: dto.logoMimeType,
            logoDataLength: dto.logoData?.length,
            color: dto.color
        });
        const data = {
            name: dto.name,
        };
        if (dto.logoData && dto.logoMimeType) {
            data.logoData = Buffer.from(dto.logoData, 'base64');
            data.logoMimeType = dto.logoMimeType;
            console.log('✅ Logo data converted to Buffer, size:', data.logoData.length, 'bytes');
        }
        if (dto.color) {
            data.color = dto.color;
        }
        const result = await this.prisma.brand.create({
            data,
        });
        console.log('✅ Brand created with ID:', result.id);
        return result;
    }
    async update(id, dto) {
        console.log('🔵 Updating brand:', id, {
            name: dto.name,
            hasLogoData: !!dto.logoData,
            logoMimeType: dto.logoMimeType,
            logoDataLength: dto.logoData?.length,
            color: dto.color
        });
        const brand = await this.findOne(id);
        const data = {};
        if (dto.name) {
            data.name = dto.name;
        }
        if (dto.logoData && dto.logoMimeType) {
            data.logoData = Buffer.from(dto.logoData, 'base64');
            data.logoMimeType = dto.logoMimeType;
            console.log('✅ Logo data converted to Buffer, size:', data.logoData.length, 'bytes');
        }
        if (dto.color !== undefined) {
            data.color = dto.color;
        }
        const result = await this.prisma.brand.update({
            where: { id },
            data,
        });
        console.log('✅ Brand updated with ID:', result.id);
        return result;
    }
    async remove(id) {
        const brand = await this.findOne(id);
        return this.prisma.brand.delete({
            where: { id },
        });
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BrandsService);
//# sourceMappingURL=brands.service.js.map