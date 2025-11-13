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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const users = await this.prisma.user.findMany({
            include: {
                brands: {
                    include: {
                        brand: true,
                    },
                },
            },
        });
        return users.map(user => ({
            ...user,
            brands: user.brands.map(ub => ub.brand),
        }));
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                brands: {
                    include: {
                        brand: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return {
            ...user,
            brands: user.brands.map(ub => ub.brand),
        };
    }
    async create(createUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: createUserDto.email,
                passwordHash: hashedPassword,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                role: createUserDto.role,
            },
            include: {
                brands: true,
            },
        });
        return user;
    }
    async update(id, updateUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
            const emailExists = await this.prisma.user.findUnique({
                where: { email: updateUserDto.email },
            });
            if (emailExists) {
                throw new common_1.ConflictException('User with this email already exists');
            }
        }
        const updateData = { ...updateUserDto };
        if (updateUserDto.password) {
            delete updateData.password;
            updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                brands: true,
            },
        });
        return user;
    }
    async remove(id) {
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        await this.prisma.user.delete({
            where: { id },
        });
        return { message: 'User deleted successfully' };
    }
    async assignBrands(userId, assignBrandsDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        if (user.role !== client_1.UserRole.supplier) {
            throw new common_1.BadRequestException('Only suppliers can be assigned brands');
        }
        const brands = await this.prisma.brand.findMany({
            where: {
                id: { in: assignBrandsDto.brandIds },
            },
        });
        if (brands.length !== assignBrandsDto.brandIds.length) {
            throw new common_1.BadRequestException('One or more brands not found');
        }
        await this.prisma.userBrand.deleteMany({
            where: { userId },
        });
        if (assignBrandsDto.brandIds.length > 0) {
            await this.prisma.userBrand.createMany({
                data: assignBrandsDto.brandIds.map(brandId => ({
                    userId,
                    brandId,
                })),
            });
        }
        const updatedUser = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                brands: {
                    include: {
                        brand: true,
                    },
                },
            },
        });
        return {
            ...updatedUser,
            brands: updatedUser.brands.map(ub => ub.brand),
        };
    }
    async removeBrand(userId, brandId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                brands: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const brandAssigned = user.brands.some(brand => brand.id === brandId);
        if (!brandAssigned) {
            throw new common_1.BadRequestException('Brand is not assigned to this user');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                brands: {
                    disconnect: { id: brandId },
                },
            },
            include: {
                brands: true,
            },
        });
        return updatedUser;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map