import { Response } from 'express';
import { IconsService } from './icons.service';
import { CreateIconDto } from './dto/create-icon.dto';
import { UpdateIconDto } from './dto/update-icon.dto';
export declare class IconsController {
    private readonly iconsService;
    constructor(iconsService: IconsService);
    create(createIconDto: CreateIconDto): Promise<{
        brands: ({
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
            createdAt: Date;
            brandId: string;
            iconId: string;
        })[];
        categories: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                mssqlCode: string | null;
                isBuiltIn: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            categoryId: string;
            iconId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageData: Buffer;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
    findAll(): Promise<{
        imageData: any;
        imageUrl: string;
        _count: {
            productIcons: number;
        };
        brands: ({
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
            createdAt: Date;
            brandId: string;
            iconId: string;
        })[];
        categories: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                mssqlCode: string | null;
                isBuiltIn: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            categoryId: string;
            iconId: string;
        })[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageMimeType: string;
        isEnergyClass: boolean;
    }[]>;
    findOne(id: string): Promise<{
        imageData: any;
        imageUrl: string;
        brands: ({
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
            createdAt: Date;
            brandId: string;
            iconId: string;
        })[];
        categories: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                mssqlCode: string | null;
                isBuiltIn: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            categoryId: string;
            iconId: string;
        })[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
    getImage(id: string, res: Response): Promise<void>;
    update(id: string, updateIconDto: UpdateIconDto): Promise<{
        brands: ({
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
            createdAt: Date;
            brandId: string;
            iconId: string;
        })[];
        categories: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                mssqlCode: string | null;
                isBuiltIn: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            categoryId: string;
            iconId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageData: Buffer;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageData: Buffer;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
}
