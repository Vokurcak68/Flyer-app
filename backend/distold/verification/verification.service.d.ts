import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';
export declare class VerificationService {
    private prisma;
    private configService;
    private readonly logger;
    private erpPool;
    constructor(prisma: PrismaService, configService: ConfigService);
    private getERPConnection;
    private getERPProductByEAN;
    private verifyProduct;
    verifyFlyer(flyerId: string): Promise<{
        status: VerificationStatus;
        details: any;
    }>;
    getVerificationLogs(flyerId: string): Promise<{
        id: string;
        createdAt: Date;
        flyerId: string;
        status: import(".prisma/client").$Enums.VerificationStatus;
        verificationDate: Date;
        details: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    testERPConnection(): Promise<{
        connected: boolean;
        message: string;
        serverInfo?: any;
    }>;
    closeERPConnection(): Promise<void>;
}
