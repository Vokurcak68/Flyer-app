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
const emailService_1 = require("../services/emailService");
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
        const approver = await this.prisma.user.findUnique({
            where: { id: approverId },
            select: { role: true },
        });
        if (!approver) {
            throw new common_1.NotFoundException('Approver not found');
        }
        const data = {
            flyerId,
            approverId,
            status: client_1.ApprovalStatus.pending,
        };
        if (approver.role === 'pre_approver') {
            data.preApprovalStatus = client_1.PreApprovalStatus.pending;
        }
        return this.prisma.approval.create({
            data,
        });
    }
    async processPreApproval(flyerId, approverId, status, comment) {
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
        if (approval.preApprovalStatus && approval.preApprovalStatus !== client_1.PreApprovalStatus.pending) {
            throw new common_1.BadRequestException('This pre-approval has already been processed');
        }
        const flyer = await this.prisma.flyer.findUnique({
            where: { id: flyerId },
            include: {
                supplier: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        const approver = await this.prisma.user.findUnique({
            where: { id: approverId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
            },
        });
        if (status === client_1.PreApprovalStatus.pre_approved) {
            const updated = await this.prisma.approval.update({
                where: {
                    flyerId_approverId: {
                        flyerId,
                        approverId,
                    },
                },
                data: {
                    preApprovalStatus: status,
                    comment,
                    preApprovedAt: new Date(),
                },
            });
            await this.updatePreApprovalWorkflow(flyerId);
            if (flyer && flyer.supplier && approver) {
                const flyerUrl = `${process.env.FRONTEND_URL}/flyers/${flyerId}`;
                await emailService_1.emailService.sendFlyerApprovedEmail(flyer.supplier.email, `${flyer.supplier.firstName} ${flyer.supplier.lastName}`, flyer.name, `${approver.firstName} ${approver.lastName}`, comment || '', flyerUrl, true);
                console.log(`📧 Sent pre-approval email to ${flyer.supplier.email}`);
            }
            return updated;
        }
        else if (status === client_1.PreApprovalStatus.rejected) {
            const updated = await this.prisma.approval.update({
                where: {
                    flyerId_approverId: {
                        flyerId,
                        approverId,
                    },
                },
                data: {
                    preApprovalStatus: status,
                    comment,
                    preApprovedAt: new Date(),
                },
            });
            await this.prisma.flyer.update({
                where: { id: flyerId },
                data: {
                    status: client_1.FlyerStatus.draft,
                    isDraft: true,
                    rejectionReason: comment || 'Rejected by pre-approver without comment',
                },
            });
            if (flyer && flyer.supplier && approver) {
                const flyerUrl = `${process.env.FRONTEND_URL}/flyers/${flyerId}`;
                await emailService_1.emailService.sendFlyerRejectedEmail(flyer.supplier.email, `${flyer.supplier.firstName} ${flyer.supplier.lastName}`, flyer.name, `${approver.firstName} ${approver.lastName}`, comment || 'Rejected by pre-approver without comment', flyerUrl, true);
                console.log(`📧 Sent pre-rejection email to ${flyer.supplier.email}`);
            }
            return updated;
        }
        return this.prisma.approval.update({
            where: {
                flyerId_approverId: {
                    flyerId,
                    approverId,
                },
            },
            data: {
                preApprovalStatus: status,
                comment,
                preApprovedAt: new Date(),
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
        const flyer = await this.prisma.flyer.findUnique({
            where: { id: flyerId },
            include: {
                supplier: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        const approver = await this.prisma.user.findUnique({
            where: { id: approverId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
            },
        });
        if (status === client_1.ApprovalStatus.approved) {
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
            await this.updateApprovalWorkflow(flyerId);
            if (flyer && flyer.supplier && approver) {
                const flyerUrl = `${process.env.FRONTEND_URL}/flyers/${flyerId}`;
                await emailService_1.emailService.sendFlyerApprovedEmail(flyer.supplier.email, `${flyer.supplier.firstName} ${flyer.supplier.lastName}`, flyer.name, `${approver.firstName} ${approver.lastName}`, comment || '', flyerUrl, false);
                console.log(`📧 Sent final approval email to ${flyer.supplier.email}`);
            }
            return updated;
        }
        else if (status === client_1.ApprovalStatus.rejected) {
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
            await this.prisma.flyer.update({
                where: { id: flyerId },
                data: {
                    status: client_1.FlyerStatus.draft,
                    isDraft: true,
                    rejectionReason: comment || 'Rejected without comment',
                },
            });
            if (flyer && flyer.supplier && approver) {
                const flyerUrl = `${process.env.FRONTEND_URL}/flyers/${flyerId}`;
                await emailService_1.emailService.sendFlyerRejectedEmail(flyer.supplier.email, `${flyer.supplier.firstName} ${flyer.supplier.lastName}`, flyer.name, `${approver.firstName} ${approver.lastName}`, comment || 'Rejected without comment', flyerUrl, false);
                console.log(`📧 Sent final rejection email to ${flyer.supplier.email}`);
            }
            return updated;
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
        return updated;
    }
    async updatePreApprovalWorkflow(flyerId) {
        const workflow = await this.prisma.approvalWorkflow.findUnique({
            where: { flyerId },
        });
        if (!workflow)
            return;
        const preApprovedCount = await this.prisma.approval.count({
            where: {
                flyerId,
                preApprovalStatus: client_1.PreApprovalStatus.pre_approved,
            },
        });
        const isPreApprovalComplete = preApprovedCount >= workflow.requiredPreApprovers;
        await this.prisma.approvalWorkflow.update({
            where: { flyerId },
            data: {
                currentPreApprovals: preApprovedCount,
                isPreApprovalComplete,
            },
        });
        console.log(`✅ Pre-approvals for flyer ${flyerId}: ${preApprovedCount}/${workflow.requiredPreApprovers}`);
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
                    status: client_1.FlyerStatus.active,
                    publishedAt: new Date(),
                },
            });
            console.log(`✅ Flyer ${flyerId} approved and activated for end users`);
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
    async getPendingPreApprovals(approverId) {
        const approvals = await this.prisma.approval.findMany({
            where: {
                approverId,
                preApprovalStatus: client_1.PreApprovalStatus.pending,
                flyer: {
                    status: client_1.FlyerStatus.pending_approval,
                },
            },
            include: {
                approver: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                flyer: {
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
    async getPendingApprovals(approverId) {
        const approvals = await this.prisma.approval.findMany({
            where: {
                approverId,
                status: client_1.ApprovalStatus.pending,
                flyer: {
                    status: client_1.FlyerStatus.pending_approval,
                },
            },
            include: {
                approver: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                flyer: {
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
        const approvalsWithPreApprovalInfo = await Promise.all(approvals.map(async (approval) => {
            const preApprovalRecord = await this.prisma.approval.findFirst({
                where: {
                    flyerId: approval.flyerId,
                    preApprovalStatus: client_1.PreApprovalStatus.pre_approved,
                },
                include: {
                    approver: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
            });
            return {
                ...approval,
                preApprovalStatus: preApprovalRecord?.preApprovalStatus || approval.preApprovalStatus,
                preApprovedAt: preApprovalRecord?.preApprovedAt || approval.preApprovedAt,
                comment: preApprovalRecord?.comment || approval.comment,
                approver: preApprovalRecord?.approver || approval.approver,
                flyer: approval.flyer ? this.transformFlyerForFrontend(approval.flyer) : null,
            };
        }));
        return approvalsWithPreApprovalInfo;
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
        const baseUrl = process.env.API_URL || 'http://localhost:4000';
        const transformedPages = flyer.pages.map((page) => {
            const slotsArray = new Array(8).fill(null).map(() => ({ type: 'empty' }));
            if (page.slots && Array.isArray(page.slots)) {
                page.slots.forEach((slot) => {
                    if (slot.slotPosition >= 0 && slot.slotPosition < 8) {
                        let formattedProduct = slot.product;
                        if (slot.product) {
                            formattedProduct = {
                                ...slot.product,
                                brandName: slot.product.brand?.name,
                                brandColor: slot.product.brand?.color,
                                icons: slot.product.icons ? slot.product.icons.map((productIcon) => ({
                                    id: productIcon.icon.id,
                                    name: productIcon.icon.name,
                                    imageUrl: `${baseUrl}/api/icons/${productIcon.icon.id}/image`,
                                    isEnergyClass: productIcon.icon.isEnergyClass,
                                    position: productIcon.position,
                                    icon: productIcon.icon,
                                })) : [],
                            };
                        }
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
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map