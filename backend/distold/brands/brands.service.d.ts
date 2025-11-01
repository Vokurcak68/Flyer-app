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
        createdAt: Date;
        updatedAt: Date;
        name: string;
        logoData: Buffer | null;
        logoMimeType: string | null;
    })[]>;
    findOne(id: string): Promise<{
        products: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            supplierId: string;
            brandId: string;
            imageData: Buffer;
            imageMimeType: string;
            eanCode: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        }[];
        _count: {
            products: number;
            users: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        logoData: Buffer | null;
        logoMimeType: string | null;
    }>;
    findBySupplier(userId: string): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        logoData: Buffer | null;
        logoMimeType: string | null;
    })[]>;
    create(dto: CreateBrandDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        logoData: Buffer | null;
        logoMimeType: string | null;
    }>;
    update(id: string, dto: UpdateBrandDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        logoData: Buffer | null;
        logoMimeType: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        logoData: Buffer | null;
        logoMimeType: string | null;
    }>;
}
