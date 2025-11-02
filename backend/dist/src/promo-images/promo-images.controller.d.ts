import { Response } from 'express';
import { PromoImagesService } from './promo-images.service';
import { CreatePromoImageDto, PromoImageFilterDto } from './dto';
export declare class PromoImagesController {
    private promoImagesService;
    constructor(promoImagesService: PromoImagesService);
    create(req: any, dto: CreatePromoImageDto): Promise<{
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
        };
    } & {
        id: string;
        supplierId: string;
        name: string;
        createdAt: Date;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        isForEndUsers: boolean;
    }>;
    findAll(req: any, filters: PromoImageFilterDto): Promise<{
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
        };
        id: string;
        supplierId: string;
        name: string;
        createdAt: Date;
        brandId: string | null;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        isForEndUsers: boolean;
    }[]>;
    findBySizeType(sizeType: 'full' | 'half' | 'quarter' | 'eighth'): Promise<({
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
        };
    } & {
        id: string;
        supplierId: string;
        name: string;
        createdAt: Date;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        isForEndUsers: boolean;
    })[]>;
    getImage(id: string, res: Response): Promise<void>;
    findOne(id: string): Promise<{
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
        };
    } & {
        id: string;
        supplierId: string;
        name: string;
        createdAt: Date;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        isForEndUsers: boolean;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        supplierId: string;
        name: string;
        createdAt: Date;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        isForEndUsers: boolean;
    }>;
}
