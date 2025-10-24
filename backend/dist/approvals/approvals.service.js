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
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ApprovalsService = class ApprovalsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createApprovalWorkflow(flyerId, requiredApprovers = 2) {
        return this.prisma.approvalWorkflow.create({
            data: {
                flyerId,
                requiredApprovers,
                currentApprovals: 0,
                isComplete: false,
            },
        });
    }
    async requestApproval(flyerId, approverId) {
        const existingApproval = await this.prisma.approval.findUnique({
            where: {
                flyerId_approverId: {
                    flyerId,
                    approverId,
                },
            },
        });
        if (existingApproval) {
            throw new common_1.BadRequestException('Approval request already exists for this approver');
        }
        return this.prisma.approval.create({
            data: {
                flyerId,
                approverId,
                status: client_1.ApprovalStatus.pending,
            },
        });
    }
    async processApproval(flyerId, approverId, status, comment) {
        const approval = await this.prisma.approval.findUnique({
            where: {
                flyerId_approverId: {
                    flyerId,
                    approverId,
                },
            },
        });
        if (!approval) {
            throw new common_1.NotFoundException('Approval request not found');
        }
        if (approval.status !== client_1.ApprovalStatus.pending) {
            throw new common_1.BadRequestException('This approval has already been processed');
        }
        const updated = await this.prisma.approval.update({
            where: {
                flyerId_approverId: {
                    flyerId,
                    approverId,
                },
            },
            data: {
                status,
                comment,
                decidedAt: new Date(),
            },
        });
        if (status === client_1.ApprovalStatus.approved) {
            await this.updateApprovalWorkflow(flyerId);
        }
        else if (status === client_1.ApprovalStatus.rejected) {
            await this.prisma.flyer.update({
                where: { id: flyerId },
                data: {
                    status: client_1.FlyerStatus.rejected,
                    rejectionReason: comment,
                },
            });
        }
        return updated;
    }
    async updateApprovalWorkflow(flyerId) {
        const workflow = await this.prisma.approvalWorkflow.findUnique({
            where: { flyerId },
        });
        if (!workflow)
            return;
        const approvedCount = await this.prisma.approval.count({
            where: {
                flyerId,
                status: client_1.ApprovalStatus.approved,
            },
        });
        const isComplete = approvedCount >= workflow.requiredApprovers;
        await this.prisma.approvalWorkflow.update({
            where: { flyerId },
            data: {
                currentApprovals: approvedCount,
                isComplete,
            },
        });
        if (isComplete) {
            await this.prisma.flyer.update({
                where: { id: flyerId },
                data: {
                    status: client_1.FlyerStatus.approved,
                },
            });
        }
    }
    async getApprovals(flyerId) {
        return this.prisma.approval.findMany({
            where: { flyerId },
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
        });
    }
    async getApprovalWorkflow(flyerId) {
        return this.prisma.approvalWorkflow.findUnique({
            where: { flyerId },
        });
    }
    async getPendingApprovals(approverId) {
        const approvals = await this.prisma.approval.findMany({
            where: {
                approverId,
                status: client_1.ApprovalStatus.pending,
            },
            include: {
                flyer: {
                    include: {
                        pages: {
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
                            orderBy: {
                                pageNumber: 'asc',
                            },
                        },
                        supplier: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return approvals.map(approval => ({
            ...approval,
            flyer: approval.flyer ? this.transformFlyerForFrontend(approval.flyer) : null,
        }));
    }
    async getMyApprovals(approverId) {
        return this.prisma.approval.findMany({
            where: {
                approverId,
            },
            include: {
                flyer: {
                    select: {
                        id: true,
                        name: true,
                        validFrom: true,
                        validTo: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    transformFlyerForFrontend(flyer) {
        if (!flyer.pages) {
            return flyer;
        }
        const transformedPages = flyer.pages.map((page) => {
            const maxProducts = this.getMaxProductsForLayout(page.layoutType);
            const productsArray = new Array(maxProducts).fill(null);
            if (page.products && Array.isArray(page.products)) {
                page.products.forEach((flyerPageProduct) => {
                    if (flyerPageProduct.position < maxProducts) {
                        productsArray[flyerPageProduct.position] = flyerPageProduct.product;
                    }
                });
            }
            return {
                ...page,
                products: productsArray,
                maxProducts,
            };
        });
        return {
            ...flyer,
            pages: transformedPages,
        };
    }
    getMaxProductsForLayout(layoutType) {
        const layoutMap = {
            products_8: 8,
            products_6: 6,
            products_4: 4,
            promo_plus_4: 4,
            promo_plus_2: 2,
        };
        return layoutMap[layoutType] || 8;
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map