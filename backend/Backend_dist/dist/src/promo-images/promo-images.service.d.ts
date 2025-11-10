import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoImageDto, UpdatePromoImageDto, PromoImageFilterDto } from './dto';
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
    findAll(userId: string, role: string, filters: PromoImageFilterDto): Promise<{
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
    update(id: string, dto: UpdatePromoImageDto, userId: string, userRole: string): Promise<{
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
        fillDate: boolean;
    }>;
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
}
