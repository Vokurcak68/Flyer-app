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
    validateFlyerProducts(products: Array<{
        id: string;
        name: string;
        eanCode: string;
        price: number;
        originalPrice?: number;
    }>): Promise<Array<{
        productId: string;
        productName: string;
        eanCode: string;
        errors: string[];
        erpPrice?: number;
        erpOriginalPrice?: number;
        currentPrice?: number;
        currentOriginalPrice?: number;
    }>>;
    onModuleDestroy(): Promise<void>;
}
