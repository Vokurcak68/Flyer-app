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
        supplierId: string;
        name: string;
        createdAt: Date;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        isForEndUsers: boolean;
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
        supplierId: string;
        name: string;
        createdAt: Date;
        brandId: string | null;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        isForEndUsers: boolean;
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
        supplierId: string;
        name: string;
        createdAt: Date;
        brandId: string | null;
        imageData: Buffer;
        imageMimeType: string;
        defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        isForEndUsers: boolean;
    }>;
    remove(id: string, userId: string, userRole: string): Promise<{
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
}
