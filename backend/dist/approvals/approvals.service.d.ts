import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus } from '@prisma/client';
export declare class ApprovalsService {
    private prisma;
    constructor(prisma: PrismaService);
    createApprovalWorkflow(flyerId: string, requiredApprovers?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiredApprovers: number;
        currentApprovals: number;
        isComplete: boolean;
        flyerId: string;
    }>;
    requestApproval(flyerId: string, approverId: string): Promise<{
        id: string;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        comment: string | null;
        decidedAt: Date | null;
    }>;
    processApproval(flyerId: string, approverId: string, status: ApprovalStatus, comment?: string): Promise<{
        id: string;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        comment: string | null;
        decidedAt: Date | null;
    }>;
    private updateApprovalWorkflow;
    getApprovals(flyerId: string): Promise<({
        approver: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        comment: string | null;
        decidedAt: Date | null;
    })[]>;
    getApprovalWorkflow(flyerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiredApprovers: number;
        currentApprovals: number;
        isComplete: boolean;
        flyerId: string;
    }>;
    getPendingApprovals(approverId: string): Promise<{
        flyer: any;
        id: string;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        comment: string | null;
        decidedAt: Date | null;
    }[]>;
    getMyApprovals(approverId: string): Promise<({
        flyer: {
            id: string;
            name: string;
            status: import(".prisma/client").$Enums.FlyerStatus;
            validFrom: Date;
            validTo: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        comment: string | null;
        decidedAt: Date | null;
    })[]>;
    private transformFlyerForFrontend;
    private getMaxProductsForLayout;
}
