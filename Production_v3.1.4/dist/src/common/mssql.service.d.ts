import { OnModuleInit } from '@nestjs/common';
export declare class MssqlService implements OnModuleInit {
    private readonly logger;
    private pool;
    onModuleInit(): Promise<void>;
    validateEAN(ean: string, price?: number, originalPrice?: number, actionId?: number): Promise<{
        found: boolean;
        pricesMatch: boolean;
        erpPrice?: number;
        erpOriginalPrice?: number;
        erpProductName?: string;
        erpBrand?: string;
        erpCategoryCode?: string;
    }>;
    validateFlyerProducts(products: Array<{
        id: string;
        name: string;
        eanCode: string;
        price: number;
        originalPrice?: number;
    }>, actionId?: number): Promise<Array<{
        productId: string;
        productName: string;
        eanCode: string;
        errors: string[];
        erpPrice?: number;
        erpOriginalPrice?: number;
        currentPrice?: number;
        currentOriginalPrice?: number;
    }>>;
    getActions(): Promise<Array<{
        id: number;
        name: string;
        validFrom?: string;
        validTo?: string;
    }>>;
    onModuleDestroy(): Promise<void>;
}
