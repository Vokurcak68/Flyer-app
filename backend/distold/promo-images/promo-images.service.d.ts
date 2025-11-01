import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoImageDto, PromoImageFilterDto } from './dto';
export declare class PromoImagesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreatePromoImageDto): Promise<{
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
    findAll(userId: string, role: string, filters: PromoImageFilterDto): Promise<{
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
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        supplierId: string;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    }>;
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
}
