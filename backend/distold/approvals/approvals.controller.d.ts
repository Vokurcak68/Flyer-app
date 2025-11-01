import { ApprovalsService } from './approvals.service';
export declare class ApprovalsController {
    private readonly approvalsService;
    constructor(approvalsService: ApprovalsService);
    getPendingApprovals(req: any): Promise<{
        flyer: any;
        id: string;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        comment: string | null;
        decidedAt: Date | null;
    }[]>;
    getMyApprovals(req: any): Promise<({
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
    approve(approvalId: string, body: {
        comment?: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        comment: string | null;
        decidedAt: Date | null;
    }>;
    reject(approvalId: string, body: {
        comment: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        flyerId: string;
        approverId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        comment: string | null;
        decidedAt: Date | null;
    }>;
}
