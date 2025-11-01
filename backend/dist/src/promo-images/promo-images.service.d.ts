import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoImageDto, PromoImageFilterDto } from './dto';
export declare class PromoImagesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, userRole: string, dto: CreatePromoImageDto): Promise<{
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
        name: string;
        createdAt: Date;
        supplierId: string;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    }>;
    findAll(userId: string, role: string, filters: PromoImageFilterDto): Promise<{
        brand: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
        };
        id: string;
        name: string;
        createdAt: Date;
        supplierId: string;
        brandId: string | null;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    }[]>;
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
        name: string;
        createdAt: Date;
        supplierId: string;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        supplierId: string;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    }>;
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
        name: string;
        createdAt: Date;
        supplierId: string;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
    })[]>;
}
