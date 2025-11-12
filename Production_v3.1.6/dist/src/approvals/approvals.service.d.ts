import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus, PreApprovalStatus } from '@prisma/client';
export declare class ApprovalsService {
    private prisma;
    constructor(prisma: PrismaService);
    createApprovalWorkflow(flyerId: string, requiredApprovers?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiredPreApprovers: number;
        requiredApprovers: number;
        currentPreApprovals: number;
        currentApprovals: number;
        isPreApprovalComplete: boolean;
        isComplete: boolean;
        flyerId: string;
    }>;
    requestApproval(flyerId: string, approverId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        preApprovalStatus: import(".prisma/client").$Enums.PreApprovalStatus | null;
        comment: string | null;
        decidedAt: Date | null;
        preApprovedAt: Date | null;
    }>;
    processPreApproval(flyerId: string, approverId: string, status: PreApprovalStatus, comment?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        preApprovalStatus: import(".prisma/client").$Enums.PreApprovalStatus | null;
        comment: string | null;
        decidedAt: Date | null;
        preApprovedAt: Date | null;
    }>;
    processApproval(flyerId: string, approverId: string, status: ApprovalStatus, comment?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        preApprovalStatus: import(".prisma/client").$Enums.PreApprovalStatus | null;
        comment: string | null;
        decidedAt: Date | null;
        preApprovedAt: Date | null;
    }>;
    private updatePreApprovalWorkflow;
    private updateApprovalWorkflow;
    getApprovals(flyerId: string): Promise<({
        approver: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        preApprovalStatus: import(".prisma/client").$Enums.PreApprovalStatus | null;
        comment: string | null;
        decidedAt: Date | null;
        preApprovedAt: Date | null;
    })[]>;
    getApprovalWorkflow(flyerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiredPreApprovers: number;
        requiredApprovers: number;
        currentPreApprovals: number;
        currentApprovals: number;
        isPreApprovalComplete: boolean;
        isComplete: boolean;
        flyerId: string;
    }>;
    getPendingPreApprovals(approverId: string): Promise<{
        flyer: any;
        approver: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        preApprovalStatus: import(".prisma/client").$Enums.PreApprovalStatus | null;
        comment: string | null;
        decidedAt: Date | null;
        preApprovedAt: Date | null;
    }[]>;
    getPendingApprovals(approverId: string): Promise<{
        preApprovalStatus: import(".prisma/client").$Enums.PreApprovalStatus;
        preApprovedAt: Date;
        comment: string;
        approver: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        flyer: any;
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        decidedAt: Date | null;
    }[]>;
    getMyApprovals(approverId: string): Promise<({
        flyer: {
            id: string;
            name: string;
            validFrom: Date;
            validTo: Date;
            status: import(".prisma/client").$Enums.FlyerStatus;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        preApprovalStatus: import(".prisma/client").$Enums.PreApprovalStatus | null;
        comment: string | null;
        decidedAt: Date | null;
        preApprovedAt: Date | null;
    })[]>;
    private transformFlyerForFrontend;
}
