import { Response } from 'express';
import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto } from './dto';
export declare class BrandsController {
    private brandsService;
    constructor(brandsService: BrandsService);
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
    findMyBrands(req: any): Promise<({
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
    getLogo(id: string, res: Response): Promise<void>;
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
