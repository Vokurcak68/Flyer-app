import { OnModuleInit } from '@nestjs/common';
export declare class MssqlService implements OnModuleInit {
    private readonly logger;
    private pool;
    onModuleInit(): Promise<void>;
    validateEAN(ean: string, price?: number, originalPrice?: number): Promise<{
        found: boolean;
        pricesMatch: boolean;
        erpPrice?: number;
        erpOriginalPrice?: number;
    }>;
    onModuleDestroy(): Promise<void>;
}
