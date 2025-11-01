import { Response } from 'express';
import { PromoImagesService } from './promo-images.service';
import { CreatePromoImageDto, PromoImageFilterDto } from './dto';
export declare class PromoImagesController {
    private promoImagesService;
    constructor(promoImagesService: PromoImagesService);
    create(req: any, dto: CreatePromoImageDto): Promise<{
        brand: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            logoData: Buffer | null;
            logoMimeType: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        supplierId: string;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    }>;
    findAll(req: any, filters: PromoImageFilterDto): Promise<{
        brand: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            logoData: Buffer | null;
            logoMimeType: string | null;
        };
        id: string;
        createdAt: Date;
        name: string;
        supplierId: string;
        brandId: string | null;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    }[]>;
    findBySizeType(sizeType: 'full' | 'half' | 'quarter' | 'eighth'): Promise<({
        brand: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            logoData: Buffer | null;
            logoMimeType: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        supplierId: string;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    })[]>;
    getImage(id: string, res: Response): Promise<void>;
    findOne(id: string): Promise<{
        brand: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            logoData: Buffer | null;
            logoMimeType: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        supplierId: string;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        supplierId: string;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    }>;
}
