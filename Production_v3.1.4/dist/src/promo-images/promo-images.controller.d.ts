import { Response } from 'express';
import { PromoImagesService } from './promo-images.service';
import { CreatePromoImageDto, UpdatePromoImageDto, PromoImageFilterDto } from './dto';
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
            color: string | null;
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
        fillDate: boolean;
    }>;
    findAll(req: any, filters: PromoImageFilterDto): Promise<{
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
            color: string | null;
        };
        id: string;
        supplierId: string;
        name: string;
        createdAt: Date;
        brandId: string | null;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        isForEndUsers: boolean;
        fillDate: boolean;
    }[]>;
    findBySizeType(sizeType: 'full' | 'half' | 'quarter' | 'eighth'): Promise<({
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
            color: string | null;
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
        fillDate: boolean;
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
            color: string | null;
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
        fillDate: boolean;
    }>;
    update(id: string, dto: UpdatePromoImageDto, req: any): Promise<{
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
            color: string | null;
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
        fillDate: boolean;
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
        fillDate: boolean;
    }>;
}
