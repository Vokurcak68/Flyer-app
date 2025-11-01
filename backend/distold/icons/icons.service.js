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
exports.IconsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let IconsService = class IconsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createIconDto) {
        const { imageData, ...rest } = createIconDto;
        const imageBuffer = Buffer.from(imageData, 'base64');
        return this.prisma.icon.create({
            data: {
                ...rest,
                imageData: imageBuffer,
            },
        });
    }
    async findAll() {
        const icons = await this.prisma.icon.findMany({
            orderBy: { name: 'asc' },
        });
        const baseUrl = process.env.API_URL || 'http://localhost:4000';
        return icons.map(icon => ({
            ...icon,
            imageData: undefined,
            imageUrl: `${baseUrl}/api/icons/${icon.id}/image`,
        }));
    }
    async findOne(id) {
        const icon = await this.prisma.icon.findUnique({
            where: { id },
        });
        if (!icon) {
            throw new common_1.NotFoundException(`Icon with ID ${id} not found`);
        }
        const baseUrl = process.env.API_URL || 'http://localhost:4000';
        return {
            ...icon,
            imageData: undefined,
            imageUrl: `${baseUrl}/api/icons/${id}/image`,
        };
    }
    async getImage(id) {
        const icon = await this.prisma.icon.findUnique({
            where: { id },
            select: { imageData: true, imageMimeType: true },
        });
        if (!icon) {
            throw new common_1.NotFoundException(`Icon with ID ${id} not found`);
        }
        return {
            data: icon.imageData,
            mimeType: icon.imageMimeType,
        };
    }
    async update(id, updateIconDto) {
        const icon = await this.prisma.icon.findUnique({ where: { id } });
        if (!icon) {
            throw new common_1.NotFoundException(`Icon with ID ${id} not found`);
        }
        const { imageData, ...rest } = updateIconDto;
        const data = { ...rest };
        if (imageData) {
            data.imageData = Buffer.from(imageData, 'base64');
        }
        return this.prisma.icon.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        const icon = await this.prisma.icon.findUnique({ where: { id } });
        if (!icon) {
            throw new common_1.NotFoundException(`Icon with ID ${id} not found`);
        }
        return this.prisma.icon.delete({ where: { id } });
    }
};
exports.IconsService = IconsService;
exports.IconsService = IconsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IconsService);
//# sourceMappingURL=icons.service.js.map