import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto';
export declare class BrandsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
        color: string | null;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            products: number;
            users: number;
        };
        products: {
            id: string;
            supplierId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            categoryId: string | null;
            brandId: string;
            imageData: Buffer | null;
            imageMimeType: string | null;
            subcategoryId: string | null;
            eanCode: string;
            description: string | null;
            supplierNote: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
            installationType: import(".prisma/client").$Enums.InstallationType | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
        color: string | null;
    }>;
    findBySupplier(userId: string): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
        color: string | null;
    })[]>;
    create(dto: CreateBrandDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
        color: string | null;
    }>;
    update(id: string, dto: UpdateBrandDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
        color: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
        color: string | null;
    }>;
}
