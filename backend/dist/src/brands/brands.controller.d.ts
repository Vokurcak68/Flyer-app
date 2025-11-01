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
    })[]>;
    getLogo(id: string, res: Response): Promise<void>;
    findOne(id: string): Promise<{
        products: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string | null;
            isActive: boolean;
            supplierId: string;
            brandId: string;
            imageData: Buffer | null;
            imageMimeType: string | null;
            subcategoryId: string | null;
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
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
    }>;
    create(dto: CreateBrandDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
    }>;
    update(id: string, dto: UpdateBrandDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        logoData: Buffer | null;
        logoMimeType: string | null;
    }>;
}
