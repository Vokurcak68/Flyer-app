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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlyersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const approvals_service_1 = require("../approvals/approvals.service");
const pdf_service_1 = require("./pdf.service");
const client_1 = require("@prisma/client");
let FlyersService = class FlyersService {
    constructor(prisma, approvalsService, pdfService) {
        this.prisma = prisma;
        this.approvalsService = approvalsService;
        this.pdfService = pdfService;
    }
    async create(createFlyerDto, userId) {
        const flyer = await this.prisma.flyer.create({
            data: {
                name: createFlyerDto.name,
                validFrom: createFlyerDto.validFrom
                    ? new Date(createFlyerDto.validFrom)
                    : null,
                validTo: createFlyerDto.validTo ? new Date(createFlyerDto.validTo) : null,
                supplierId: userId,
                status: client_1.FlyerStatus.draft,
                isDraft: true,
            },
            include: {
                pages: {
                    include: {
                        slots: {
                            include: {
                                product: {
                                    include: {
                                        brand: true,
                                        icons: {
                                            include: {
                                                icon: true,
                                            },
                                            orderBy: {
                                                position: 'asc',
                                            },
                                        },
                                    },
                                },
                                promoImage: true,
                            },
                            orderBy: {
                                slotPosition: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        pageNumber: 'asc',
                    },
                },
            },
        });
        await this.createEditHistory(flyer.id, userId, client_1.FlyerActionType.update_info, {
            action: 'created',
            name: createFlyerDto.name,
        });
        return this.transformFlyerForFrontend(flyer);
    }
    async findAll(filterDto, userId, userRole) {
        await this.updateExpiredFlyers();
        const where = {};
        if (userRole === client_1.UserRole.supplier) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    brands: {
                        include: {
                            brand: {
                                include: {
                                    users: true,
                                },
                            },
                        },
                    },
                },
            });
            if (user && user.brands.length > 0) {
                const sharedBrandUserIds = new Set();
                user.brands.forEach(userBrand => {
                    userBrand.brand.users.forEach(brandUser => {
                        sharedBrandUserIds.add(brandUser.userId);
                    });
                });
                where.supplierId = {
                    in: Array.from(sharedBrandUserIds),
                };
            }
            else {
                where.supplierId = userId;
            }
        }
        else if (userRole === client_1.UserRole.approver) {
            where.status = {
                in: [client_1.FlyerStatus.pending_approval, client_1.FlyerStatus.approved],
            };
        }
        else if (userRole === client_1.UserRole.end_user) {
            where.supplierId = userId;
        }
        if (filterDto.status) {
            where.status = filterDto.status;
        }
        if (filterDto.isDraft !== undefined) {
            where.isDraft = filterDto.isDraft;
        }
        if (filterDto.validFrom) {
            where.validFrom = {
                gte: new Date(filterDto.validFrom),
            };
        }
        if (filterDto.validTo) {
            where.validTo = {
                lte: new Date(filterDto.validTo),
            };
        }
        const total = await this.prisma.flyer.count({ where });
        const flyers = await this.prisma.flyer.findMany({
            where,
            select: {
                id: true,
                name: true,
                validFrom: true,
                validTo: true,
                status: true,
                supplierId: true,
                completionPercentage: true,
                createdAt: true,
                updatedAt: true,
                publishedAt: true,
                rejectionReason: true,
                lastEditedAt: true,
                supplier: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                pages: {
                    select: {
                        id: true,
                        pageNumber: true,
                    },
                    orderBy: {
                        pageNumber: 'asc',
                    },
                },
                approvals: {
                    select: {
                        id: true,
                        status: true,
                        comment: true,
                        decidedAt: true,
                        approver: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                _count: {
                    select: {
                        pages: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const transformedFlyers = flyers.map(flyer => this.transformFlyerForFrontend(flyer));
        return {
            data: transformedFlyers,
            meta: {
                total,
                page: 1,
                limit: total,
                totalPages: 1,
            },
        };
    }
    async getActiveFlyers(userId, userRole) {
        await this.updateExpiredFlyers();
        const flyers = await this.prisma.flyer.findMany({
            where: {
                status: client_1.FlyerStatus.active,
            },
            include: {
                pages: {
                    include: {
                        slots: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        eanCode: true,
                                        price: true,
                                        originalPrice: true,
                                        brandId: true,
                                        brand: true,
                                        icons: {
                                            select: {
                                                icon: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                        isEnergyClass: true,
                                                    },
                                                },
                                                position: true,
                                            },
                                            orderBy: {
                                                position: 'asc',
                                            },
                                        },
                                    },
                                },
                                promoImage: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                            orderBy: {
                                slotPosition: 'asc',
                            },
                        },
                        footerPromoImage: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        pageNumber: 'asc',
                    },
                },
            },
            orderBy: {
                publishedAt: 'desc',
            },
        });
        return flyers.map(flyer => this.transformFlyerForFrontend(flyer));
    }
    async findOneForPdf(id, userId, userRole) {
        const flyer = await this.prisma.flyer.findUnique({
            where: { id },
            include: {
                supplier: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                pages: {
                    include: {
                        slots: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        eanCode: true,
                                        price: true,
                                        originalPrice: true,
                                        imageData: true,
                                        imageMimeType: true,
                                        brandId: true,
                                        supplierId: true,
                                        createdAt: true,
                                        updatedAt: true,
                                        brand: true,
                                        icons: {
                                            select: {
                                                icon: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                        isEnergyClass: true,
                                                        imageData: true,
                                                        imageMimeType: true,
                                                    },
                                                },
                                                position: true,
                                            },
                                            orderBy: {
                                                position: 'asc',
                                            },
                                        },
                                    },
                                },
                                promoImage: {
                                    select: {
                                        id: true,
                                        name: true,
                                        imageData: true,
                                        imageMimeType: true,
                                        supplierId: true,
                                        createdAt: true,
                                    },
                                },
                            },
                            orderBy: {
                                slotPosition: 'asc',
                            },
                        },
                        footerPromoImage: {
                            select: {
                                id: true,
                                name: true,
                                imageData: true,
                                imageMimeType: true,
                                supplierId: true,
                                createdAt: true,
                            },
                        },
                    },
                    orderBy: {
                        pageNumber: 'asc',
                    },
                },
            },
        });
        if (!flyer) {
            throw new common_1.NotFoundException(`Flyer with ID ${id} not found`);
        }
        if (userRole === client_1.UserRole.supplier && flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this flyer');
        }
        if (userRole === client_1.UserRole.end_user) {
            const isOwnFlyer = flyer.supplierId === userId;
            const isActiveFlyer = flyer.status === client_1.FlyerStatus.approved || flyer.status === client_1.FlyerStatus.active;
            if (!isOwnFlyer && !isActiveFlyer) {
                throw new common_1.ForbiddenException('You do not have access to this flyer');
            }
        }
        return this.transformFlyerForFrontend(flyer);
    }
    async findOne(id, userId, userRole) {
        await this.updateExpiredFlyers();
        const flyer = await this.prisma.flyer.findUnique({
            where: { id },
            include: {
                supplier: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                pages: {
                    include: {
                        slots: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        eanCode: true,
                                        price: true,
                                        originalPrice: true,
                                        brandId: true,
                                        supplierId: true,
                                        createdAt: true,
                                        updatedAt: true,
                                        brand: true,
                                        icons: {
                                            select: {
                                                icon: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                        isEnergyClass: true,
                                                    },
                                                },
                                                position: true,
                                            },
                                            orderBy: {
                                                position: 'asc',
                                            },
                                        },
                                    },
                                },
                                promoImage: {
                                    select: {
                                        id: true,
                                        name: true,
                                        supplierId: true,
                                        createdAt: true,
                                    },
                                },
                            },
                            orderBy: {
                                slotPosition: 'asc',
                            },
                        },
                        footerPromoImage: {
                            select: {
                                id: true,
                                name: true,
                                supplierId: true,
                                createdAt: true,
                            },
                        },
                    },
                    orderBy: {
                        pageNumber: 'asc',
                    },
                },
                verificationLogs: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 5,
                },
                approvals: {
                    include: {
                        approver: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                approvalWorkflow: true,
            },
        });
        if (!flyer) {
            throw new common_1.NotFoundException('Flyer not found');
        }
        await this.checkAccessPermission(flyer, userId, userRole);
        return this.transformFlyerForFrontend(flyer);
    }
    async update(id, updateFlyerDto, userId, userRole) {
        const flyer = await this.prisma.flyer.findUnique({ where: { id } });
        if (!flyer) {
            throw new common_1.NotFoundException('Flyer not found');
        }
        if ((userRole !== client_1.UserRole.supplier && userRole !== client_1.UserRole.end_user) || flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to update this flyer');
        }
        if (flyer.status !== client_1.FlyerStatus.draft) {
            throw new common_1.BadRequestException('Only draft flyers can be updated');
        }
        const data = {
            name: updateFlyerDto.name,
            validFrom: updateFlyerDto.validFrom
                ? new Date(updateFlyerDto.validFrom)
                : undefined,
            validTo: updateFlyerDto.validTo
                ? new Date(updateFlyerDto.validTo)
                : undefined,
            lastEditedAt: new Date(),
        };
        if (updateFlyerDto.pdfData && updateFlyerDto.pdfMimeType) {
            data.pdfData = updateFlyerDto.pdfData;
            data.pdfMimeType = updateFlyerDto.pdfMimeType;
        }
        if (updateFlyerDto.pages) {
            await this.syncPages(id, updateFlyerDto.pages, userId, userRole);
        }
        const updated = await this.prisma.flyer.update({
            where: { id },
            data,
            include: {
                pages: {
                    include: {
                        slots: {
                            include: {
                                product: {
                                    include: {
                                        brand: true,
                                        icons: {
                                            include: {
                                                icon: true,
                                            },
                                            orderBy: {
                                                position: 'asc',
                                            },
                                        },
                                    },
                                },
                                promoImage: true,
                            },
                            orderBy: {
                                slotPosition: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        pageNumber: 'asc',
                    },
                },
            },
        });
        await this.createEditHistory(id, userId, client_1.FlyerActionType.update_info, {
            changes: updateFlyerDto,
        });
        await this.updateCompletionPercentage(id);
        return this.transformFlyerForFrontend(updated);
    }
    async remove(id, userId, userRole) {
        const flyer = await this.prisma.flyer.findUnique({ where: { id } });
        if (!flyer) {
            throw new common_1.NotFoundException('Flyer not found');
        }
        if ((userRole !== client_1.UserRole.supplier && userRole !== client_1.UserRole.end_user) || flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to delete this flyer');
        }
        if (flyer.status !== client_1.FlyerStatus.draft) {
            throw new common_1.BadRequestException('Only draft flyers can be deleted');
        }
        await this.prisma.flyer.delete({ where: { id } });
        return { message: 'Flyer deleted successfully' };
    }
    async addPage(flyerId, addPageDto, userId) {
        const flyer = await this.prisma.flyer.findUnique({ where: { id: flyerId } });
        if (!flyer) {
            throw new common_1.NotFoundException('Flyer not found');
        }
        if (flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to modify this flyer');
        }
        if (flyer.status !== client_1.FlyerStatus.draft) {
            throw new common_1.BadRequestException('Only draft flyers can be modified');
        }
        const existingPage = await this.prisma.flyerPage.findUnique({
            where: {
                flyerId_pageNumber: {
                    flyerId,
                    pageNumber: addPageDto.pageNumber,
                },
            },
        });
        if (existingPage) {
            throw new common_1.BadRequestException(`Page ${addPageDto.pageNumber} already exists`);
        }
        const page = await this.prisma.flyerPage.create({
            data: {
                flyerId,
                pageNumber: addPageDto.pageNumber,
            },
        });
        for (let position = 0; position < 8; position++) {
            await this.prisma.flyerPageSlot.create({
                data: {
                    pageId: page.id,
                    slotPosition: position,
                    slotType: client_1.SlotType.empty,
                },
            });
        }
        const pageWithSlots = await this.prisma.flyerPage.findUnique({
            where: { id: page.id },
            include: {
                slots: {
                    include: {
                        product: {
                            include: {
                                brand: true,
                                icons: true,
                            },
                        },
                        promoImage: true,
                    },
                    orderBy: {
                        slotPosition: 'asc',
                    },
                },
            },
        });
        await this.prisma.flyer.update({
            where: { id: flyerId },
            data: { lastEditedAt: new Date() },
        });
        await this.createEditHistory(flyerId, userId, client_1.FlyerActionType.add_page, {
            pageNumber: addPageDto.pageNumber,
        });
        await this.updateCompletionPercentage(flyerId);
        return pageWithSlots;
    }
    async removePage(pageId, userId) {
        const page = await this.prisma.flyerPage.findUnique({
            where: { id: pageId },
            include: { flyer: true },
        });
        if (!page) {
            throw new common_1.NotFoundException('Page not found');
        }
        if (page.flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to modify this flyer');
        }
        if (page.flyer.status !== client_1.FlyerStatus.draft) {
            throw new common_1.BadRequestException('Only draft flyers can be modified');
        }
        await this.prisma.flyerPage.delete({ where: { id: pageId } });
        await this.prisma.flyer.update({
            where: { id: page.flyerId },
            data: { lastEditedAt: new Date() },
        });
        await this.createEditHistory(page.flyerId, userId, client_1.FlyerActionType.remove_page, {
            pageNumber: page.pageNumber,
        });
        await this.updateCompletionPercentage(page.flyerId);
        return { message: 'Page removed successfully' };
    }
    async addProductToPage(pageId, addProductDto, userId) {
        const page = await this.prisma.flyerPage.findUnique({
            where: { id: pageId },
            include: {
                flyer: true,
                slots: true,
            },
        });
        if (!page) {
            throw new common_1.NotFoundException('Page not found');
        }
        if (page.flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to modify this flyer');
        }
        if (page.flyer.status !== client_1.FlyerStatus.draft) {
            throw new common_1.BadRequestException('Only draft flyers can be modified');
        }
        if (addProductDto.position < 0 || addProductDto.position >= 8) {
            throw new common_1.BadRequestException('Position must be between 0 and 7');
        }
        const slot = await this.prisma.flyerPageSlot.findUnique({
            where: {
                pageId_slotPosition: {
                    pageId,
                    slotPosition: addProductDto.position,
                },
            },
        });
        if (!slot) {
            throw new common_1.NotFoundException('Slot not found');
        }
        if (slot.slotType !== client_1.SlotType.empty) {
            throw new common_1.BadRequestException(`Slot at position ${addProductDto.position} is not available`);
        }
        const product = await this.prisma.product.findUnique({
            where: { id: addProductDto.productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.supplierId !== userId) {
            throw new common_1.ForbiddenException('You can only add your own products');
        }
        const existingProductInFlyer = await this.prisma.flyerPageSlot.findFirst({
            where: {
                page: {
                    flyerId: page.flyerId,
                },
                productId: addProductDto.productId,
                slotType: client_1.SlotType.product,
            },
        });
        if (existingProductInFlyer) {
            throw new common_1.BadRequestException('This product is already used in this flyer');
        }
        const updatedSlot = await this.prisma.flyerPageSlot.update({
            where: { id: slot.id },
            data: {
                slotType: client_1.SlotType.product,
                productId: addProductDto.productId,
            },
            include: {
                product: {
                    include: {
                        brand: true,
                        icons: true,
                    },
                },
            },
        });
        await this.prisma.flyer.update({
            where: { id: page.flyerId },
            data: { lastEditedAt: new Date() },
        });
        await this.createEditHistory(page.flyerId, userId, client_1.FlyerActionType.add_product, {
            pageId,
            productId: addProductDto.productId,
            position: addProductDto.position,
        });
        await this.updateCompletionPercentage(page.flyerId);
        return updatedSlot;
    }
    async removeProductFromPage(slotId, userId) {
        const slot = await this.prisma.flyerPageSlot.findUnique({
            where: { id: slotId },
            include: {
                page: {
                    include: {
                        flyer: true,
                    },
                },
            },
        });
        if (!slot) {
            throw new common_1.NotFoundException('Slot not found');
        }
        if (slot.page.flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to modify this flyer');
        }
        if (slot.page.flyer.status !== client_1.FlyerStatus.draft) {
            throw new common_1.BadRequestException('Only draft flyers can be modified');
        }
        await this.prisma.flyerPageSlot.update({
            where: { id: slotId },
            data: {
                slotType: client_1.SlotType.empty,
                productId: null,
                promoImageId: null,
            },
        });
        await this.prisma.flyer.update({
            where: { id: slot.page.flyerId },
            data: { lastEditedAt: new Date() },
        });
        await this.createEditHistory(slot.page.flyerId, userId, client_1.FlyerActionType.remove_product, {
            pageId: slot.pageId,
            slotPosition: slot.slotPosition,
        });
        await this.updateCompletionPercentage(slot.page.flyerId);
        return { message: 'Product removed from slot successfully' };
    }
    async updateProductPosition(slotId, updatePositionDto, userId) {
        const slot = await this.prisma.flyerPageSlot.findUnique({
            where: { id: slotId },
            include: {
                page: {
                    include: {
                        flyer: true,
                    },
                },
            },
        });
        if (!slot) {
            throw new common_1.NotFoundException('Slot not found');
        }
        if (slot.page.flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to modify this flyer');
        }
        if (slot.page.flyer.status !== client_1.FlyerStatus.draft) {
            throw new common_1.BadRequestException('Only draft flyers can be modified');
        }
        if (updatePositionDto.position < 0 || updatePositionDto.position >= 8) {
            throw new common_1.BadRequestException('Position must be between 0 and 7');
        }
        const targetSlot = await this.prisma.flyerPageSlot.findUnique({
            where: {
                pageId_slotPosition: {
                    pageId: slot.pageId,
                    slotPosition: updatePositionDto.position,
                },
            },
        });
        if (!targetSlot) {
            throw new common_1.NotFoundException('Target slot not found');
        }
        const tempSlotType = slot.slotType;
        const tempProductId = slot.productId;
        const tempPromoImageId = slot.promoImageId;
        await this.prisma.flyerPageSlot.update({
            where: { id: slot.id },
            data: {
                slotType: targetSlot.slotType,
                productId: targetSlot.productId,
                promoImageId: targetSlot.promoImageId,
            },
        });
        const updated = await this.prisma.flyerPageSlot.update({
            where: { id: targetSlot.id },
            data: {
                slotType: tempSlotType,
                productId: tempProductId,
                promoImageId: tempPromoImageId,
            },
            include: {
                product: {
                    include: {
                        brand: true,
                        icons: true,
                    },
                },
                promoImage: true,
            },
        });
        await this.prisma.flyer.update({
            where: { id: slot.page.flyerId },
            data: { lastEditedAt: new Date() },
        });
        await this.createEditHistory(slot.page.flyerId, userId, client_1.FlyerActionType.reorder, {
            oldPosition: slot.slotPosition,
            newPosition: updatePositionDto.position,
        });
        return updated;
    }
    async submitForVerification(flyerId, userId) {
        const flyer = await this.prisma.flyer.findUnique({
            where: { id: flyerId },
            include: {
                pages: {
                    include: {
                        slots: true,
                    },
                },
            },
        });
        if (!flyer) {
            throw new common_1.NotFoundException('Flyer not found');
        }
        if (flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to submit this flyer');
        }
        if (flyer.status !== client_1.FlyerStatus.draft) {
            throw new common_1.BadRequestException('Only draft flyers can be submitted');
        }
        if (!flyer.validFrom || !flyer.validTo) {
            throw new common_1.BadRequestException('Flyer must have valid dates set');
        }
        if (flyer.pages.length === 0) {
            throw new common_1.BadRequestException('Flyer must have at least one page');
        }
        await this.createVersionSnapshot(flyerId, userId, 'Submitted for verification');
        const flyerForPdf = await this.findOneForPdf(flyerId, userId, client_1.UserRole.supplier);
        const pdfData = await this.pdfService.generateFlyerPDF(flyerForPdf);
        const updated = await this.prisma.flyer.update({
            where: { id: flyerId },
            data: {
                status: client_1.FlyerStatus.pending_approval,
                isDraft: false,
                pdfData: pdfData,
                pdfMimeType: 'application/pdf',
                rejectionReason: null,
            },
            include: {
                pages: {
                    include: {
                        slots: {
                            include: {
                                product: {
                                    include: {
                                        brand: true,
                                        icons: {
                                            include: {
                                                icon: true,
                                            },
                                            orderBy: {
                                                position: 'asc',
                                            },
                                        },
                                    },
                                },
                                promoImage: true,
                            },
                            orderBy: {
                                slotPosition: 'asc',
                            },
                        },
                    },
                },
            },
        });
        console.log(`🔄 Cleaning up existing approvals for flyer ${flyerId}`);
        try {
            await this.prisma.approvalWorkflow.delete({
                where: { flyerId },
            });
            console.log(`✅ Deleted approval workflow for flyer ${flyerId}`);
        }
        catch (error) {
            console.log(`ℹ️ No existing workflow to delete for flyer ${flyerId}`);
        }
        const deletedCount = await this.prisma.approval.deleteMany({
            where: { flyerId },
        });
        console.log(`✅ Deleted ${deletedCount.count} approval records for flyer ${flyerId}`);
        const approvers = await this.prisma.user.findMany({
            where: {
                role: {
                    in: [client_1.UserRole.approver, client_1.UserRole.pre_approver]
                }
            },
        });
        console.log(`👥 Found ${approvers.length} approvers and pre-approvers`);
        const workflow = await this.approvalsService.createApprovalWorkflow(flyerId, 1);
        console.log(`✅ Created approval workflow: ${workflow.id}`);
        for (const approver of approvers) {
            try {
                const approval = await this.approvalsService.requestApproval(flyerId, approver.id);
                console.log(`✅ Created approval request for ${approver.email}: ${approval.id}`);
            }
            catch (error) {
                console.error(`❌ Failed to create approval for ${approver.email}:`, error.message);
            }
        }
        return updated;
    }
    async getPreview(flyerId, userId, userRole) {
        const flyer = await this.findOne(flyerId, userId, userRole);
        return {
            id: flyer.id,
            name: flyer.name,
            validFrom: flyer.validFrom,
            validTo: flyer.validTo,
            status: flyer.status,
            completionPercentage: flyer.completionPercentage,
            pages: flyer.pages,
        };
    }
    async autoSave(flyerId, userId) {
        const flyer = await this.prisma.flyer.findUnique({ where: { id: flyerId } });
        if (!flyer) {
            throw new common_1.NotFoundException('Flyer not found');
        }
        if (flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to modify this flyer');
        }
        const updated = await this.prisma.flyer.update({
            where: { id: flyerId },
            data: {
                lastEditedAt: new Date(),
                autoSaveVersion: {
                    increment: 1,
                },
            },
            select: {
                id: true,
                lastEditedAt: true,
                autoSaveVersion: true,
            },
        });
        return {
            message: 'Flyer auto-saved successfully',
            ...updated,
        };
    }
    async expireFlyer(flyerId, userId, userRole) {
        const flyer = await this.prisma.flyer.findUnique({ where: { id: flyerId } });
        if (!flyer) {
            throw new common_1.NotFoundException('Flyer not found');
        }
        if (userRole !== client_1.UserRole.admin && flyer.supplierId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to expire this flyer');
        }
        if (flyer.status !== client_1.FlyerStatus.active) {
            throw new common_1.BadRequestException('Only active flyers can be expired');
        }
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);
        const updated = await this.prisma.flyer.update({
            where: { id: flyerId },
            data: {
                validTo: yesterday,
                status: client_1.FlyerStatus.expired,
            },
            include: {
                pages: {
                    include: {
                        slots: {
                            include: {
                                product: {
                                    include: {
                                        brand: true,
                                        icons: {
                                            include: {
                                                icon: true,
                                            },
                                            orderBy: {
                                                position: 'asc',
                                            },
                                        },
                                    },
                                },
                                promoImage: true,
                            },
                            orderBy: {
                                slotPosition: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        pageNumber: 'asc',
                    },
                },
            },
        });
        console.log(`✅ Flyer ${flyerId} expired by ${userRole} (${userId})`);
        return this.transformFlyerForFrontend(updated);
    }
    async updateExpiredFlyers() {
        const now = new Date();
        const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const expiredFlyers = await this.prisma.flyer.findMany({
            where: {
                status: client_1.FlyerStatus.active,
                validTo: {
                    lt: todayStart,
                },
            },
        });
        if (expiredFlyers.length > 0) {
            console.log(`🔄 Found ${expiredFlyers.length} flyers with expired validTo date, updating status to expired...`);
            await this.prisma.flyer.updateMany({
                where: {
                    id: {
                        in: expiredFlyers.map(f => f.id),
                    },
                },
                data: {
                    status: client_1.FlyerStatus.expired,
                },
            });
            console.log(`✅ Updated ${expiredFlyers.length} flyers to expired status`);
        }
    }
    async updateCompletionPercentage(flyerId) {
        const flyer = await this.prisma.flyer.findUnique({
            where: { id: flyerId },
            include: {
                pages: {
                    include: {
                        slots: true,
                    },
                },
            },
        });
        if (!flyer)
            return;
        let totalScore = 0;
        const maxScore = 100;
        if (flyer.name)
            totalScore += 10;
        if (flyer.validFrom)
            totalScore += 10;
        if (flyer.validTo)
            totalScore += 10;
        const pageScore = Math.min((flyer.pages.length / 2) * 30, 30);
        totalScore += pageScore;
        const totalProducts = flyer.pages.reduce((sum, page) => sum + page.slots.filter((slot) => slot.slotType === client_1.SlotType.product).length, 0);
        const productScore = Math.min((totalProducts / 8) * 40, 40);
        totalScore += productScore;
        const completionPercentage = Math.round(totalScore);
        await this.prisma.flyer.update({
            where: { id: flyerId },
            data: { completionPercentage },
        });
    }
    async syncPages(flyerId, pages, userId, userRole) {
        console.log(`[syncPages] Called with ${pages.length} pages for user role: ${userRole}`);
        console.log(`[syncPages] First page:`, JSON.stringify(pages[0], null, 2));
        await this.prisma.flyerPage.deleteMany({
            where: { flyerId },
        });
        for (const page of pages) {
            let validFooterPromoImageId = null;
            if (page.footerPromoImageId) {
                if (userRole === client_1.UserRole.supplier) {
                    const dbPromoImage = await this.prisma.promoImage.findUnique({
                        where: { id: page.footerPromoImageId },
                    });
                    if (dbPromoImage && dbPromoImage.supplierId === userId) {
                        validFooterPromoImageId = page.footerPromoImageId;
                    }
                }
                else if (userRole === client_1.UserRole.end_user) {
                    const dbPromoImage = await this.prisma.promoImage.findUnique({
                        where: { id: page.footerPromoImageId },
                    });
                    if (dbPromoImage) {
                        validFooterPromoImageId = page.footerPromoImageId;
                    }
                }
            }
            const createdPage = await this.prisma.flyerPage.create({
                data: {
                    flyerId,
                    pageNumber: page.pageNumber,
                    footerPromoImageId: validFooterPromoImageId,
                },
            });
            for (let position = 0; position < 8; position++) {
                await this.prisma.flyerPageSlot.create({
                    data: {
                        pageId: createdPage.id,
                        slotPosition: position,
                        slotType: client_1.SlotType.empty,
                    },
                });
            }
            if (page.slots && Array.isArray(page.slots)) {
                for (let position = 0; position < Math.min(page.slots.length, 8); position++) {
                    const slotData = page.slots[position];
                    if (!slotData || slotData.type === 'empty')
                        continue;
                    if (slotData.type === 'product' && slotData.productId) {
                        let canUseProduct = false;
                        if (userRole === client_1.UserRole.supplier) {
                            const dbProduct = await this.prisma.product.findUnique({
                                where: { id: slotData.productId },
                            });
                            canUseProduct = dbProduct && dbProduct.supplierId === userId;
                        }
                        else if (userRole === client_1.UserRole.end_user) {
                            const dbProduct = await this.prisma.product.findUnique({
                                where: { id: slotData.productId },
                            });
                            canUseProduct = !!dbProduct;
                        }
                        if (canUseProduct) {
                            await this.prisma.flyerPageSlot.updateMany({
                                where: {
                                    pageId: createdPage.id,
                                    slotPosition: position,
                                },
                                data: {
                                    slotType: client_1.SlotType.product,
                                    productId: slotData.productId,
                                },
                            });
                        }
                        else {
                            console.log(`[syncPages] Product ${slotData.productId} not accessible for user ${userId} (role: ${userRole})`);
                        }
                    }
                    else if (slotData.type === 'promo' && slotData.promoImageId) {
                        let canUsePromoImage = false;
                        if (userRole === client_1.UserRole.supplier) {
                            const dbPromoImage = await this.prisma.promoImage.findUnique({
                                where: { id: slotData.promoImageId },
                            });
                            canUsePromoImage = dbPromoImage && dbPromoImage.supplierId === userId;
                        }
                        else if (userRole === client_1.UserRole.end_user) {
                            const dbPromoImage = await this.prisma.promoImage.findUnique({
                                where: { id: slotData.promoImageId },
                            });
                            canUsePromoImage = !!dbPromoImage;
                        }
                        if (canUsePromoImage) {
                            await this.prisma.flyerPageSlot.updateMany({
                                where: {
                                    pageId: createdPage.id,
                                    slotPosition: position,
                                },
                                data: {
                                    slotType: client_1.SlotType.promo,
                                    promoImageId: slotData.promoImageId,
                                    promoSize: slotData.promoSize || null,
                                },
                            });
                        }
                        else {
                            console.log(`[syncPages] Promo image ${slotData.promoImageId} not accessible for user ${userId} (role: ${userRole})`);
                        }
                    }
                }
            }
        }
    }
    transformFlyerForFrontend(flyer) {
        if (!flyer.pages) {
            return flyer;
        }
        const baseUrl = process.env.API_URL || 'http://localhost:4000';
        const transformedPages = flyer.pages.map((page) => {
            if (!page.slots || !Array.isArray(page.slots) || page.slots.length === 0) {
                return page;
            }
            const slotsArray = new Array(8).fill(null).map(() => ({ type: 'empty' }));
            if (page.slots && Array.isArray(page.slots)) {
                page.slots.forEach((slot) => {
                    if (slot.slotPosition >= 0 && slot.slotPosition < 8) {
                        const formattedProduct = slot.product ? {
                            ...slot.product,
                            price: slot.product.price ? parseFloat(slot.product.price.toString()) : 0,
                            originalPrice: slot.product.originalPrice ? parseFloat(slot.product.originalPrice.toString()) : null,
                            brandName: slot.product.brand?.name,
                            icons: slot.product.icons ? slot.product.icons.map((productIcon) => ({
                                id: productIcon.icon.id,
                                name: productIcon.icon.name,
                                imageUrl: `${baseUrl}/api/icons/${productIcon.icon.id}/image`,
                                isEnergyClass: productIcon.icon.isEnergyClass,
                                position: productIcon.position,
                                icon: productIcon.icon,
                            })) : [],
                        } : null;
                        slotsArray[slot.slotPosition] = {
                            type: slot.slotType,
                            product: formattedProduct,
                            promoImage: slot.promoImage || null,
                            promoSize: slot.promoSize || null,
                        };
                    }
                });
            }
            return {
                ...page,
                slots: slotsArray,
            };
        });
        return {
            ...flyer,
            pages: transformedPages,
        };
    }
    async checkAccessPermission(flyer, userId, userRole) {
        if (userRole === client_1.UserRole.supplier) {
            if (flyer.supplierId !== userId) {
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    include: {
                        brands: {
                            include: {
                                brand: {
                                    include: {
                                        users: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (user && user.brands.length > 0) {
                    const sharedBrandUserIds = new Set();
                    user.brands.forEach(userBrand => {
                        userBrand.brand.users.forEach(brandUser => {
                            sharedBrandUserIds.add(brandUser.userId);
                        });
                    });
                    if (!sharedBrandUserIds.has(flyer.supplierId)) {
                        throw new common_1.ForbiddenException('You do not have access to this flyer');
                    }
                }
                else {
                    throw new common_1.ForbiddenException('You do not have access to this flyer');
                }
            }
        }
        else if (userRole === client_1.UserRole.end_user) {
            if (flyer.supplierId !== userId) {
                throw new common_1.ForbiddenException('This flyer is not available');
            }
        }
    }
    async createEditHistory(flyerId, userId, actionType, details) {
        await this.prisma.flyerEditHistory.create({
            data: {
                flyerId,
                userId,
                actionType,
                details,
            },
        });
    }
    async createVersionSnapshot(flyerId, userId, description) {
        const flyer = await this.prisma.flyer.findUnique({
            where: { id: flyerId },
            include: {
                pages: {
                    include: {
                        slots: {
                            include: {
                                product: true,
                                promoImage: true,
                            },
                        },
                    },
                },
            },
        });
        if (!flyer)
            return;
        const lastVersion = await this.prisma.flyerVersion.findFirst({
            where: { flyerId },
            orderBy: { versionNumber: 'desc' },
        });
        const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;
        await this.prisma.flyerVersion.create({
            data: {
                flyerId,
                versionNumber,
                snapshotData: flyer,
                createdBy: userId,
                changeDescription: description,
            },
        });
    }
};
exports.FlyersService = FlyersService;
exports.FlyersService = FlyersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => approvals_service_1.ApprovalsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approvals_service_1.ApprovalsService,
        pdf_service_1.PdfService])
], FlyersService);
//# sourceMappingURL=flyers.service.js.map