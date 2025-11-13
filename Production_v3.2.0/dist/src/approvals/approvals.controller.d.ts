import { ApprovalsService } from './approvals.service';
export declare class ApprovalsController {
    private readonly approvalsService;
    constructor(approvalsService: ApprovalsService);
    getPendingApprovals(req: any): Promise<{
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
    getMyApprovals(req: any): Promise<({
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
    approve(approvalId: string, body: {
        comment?: string;
    }, req: any): Promise<{
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
    reject(approvalId: string, body: {
        comment: string;
    }, req: any): Promise<{
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
    preApprove(approvalId: string, body: {
        comment?: string;
    }, req: any): Promise<{
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
    preReject(approvalId: string, body: {
        comment: string;
    }, req: any): Promise<{
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
}
