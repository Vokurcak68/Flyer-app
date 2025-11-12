import { VerificationService } from './verification.service';
export declare class VerificationController {
    private verificationService;
    constructor(verificationService: VerificationService);
    testERPConnection(): Promise<{
        connected: boolean;
        message: string;
        serverInfo?: any;
    }>;
}
