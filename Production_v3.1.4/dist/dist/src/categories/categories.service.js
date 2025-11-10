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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        products: true,
                        subcategories: true,
                    },
                },
            },
        });
    }
    async findOne(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                subcategories: {
                    orderBy: { name: 'asc' },
                },
                _count: {
                    select: {
                        products: true,
                        subcategories: true,
                    },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }
    async findSubcategories(categoryId) {
        return this.prisma.subcategory.findMany({
            where: {
                categoryId,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }
    async create(dto) {
        const existing = await this.prisma.category.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException(`Category with name "${dto.name}" already exists`);
        }
        return this.prisma.category.create({
            data: {
                name: dto.name,
                mssqlCode: dto.mssqlCode,
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.name) {
            const existing = await this.prisma.category.findUnique({
                where: { name: dto.name },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Category with name "${dto.name}" already exists`);
            }
        }
        return this.prisma.category.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.mssqlCode !== undefined && { mssqlCode: dto.mssqlCode }),
            },
        });
    }
    async remove(id) {
        const category = await this.findOne(id);
        if (category._count.products > 0) {
            throw new common_1.ConflictException(`Cannot delete category "${category.name}" because it has ${category._count.products} associated products`);
        }
        return this.prisma.category.delete({
            where: { id },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map