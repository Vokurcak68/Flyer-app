import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateSubcategoryDto, UpdateSubcategoryDto } from './dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            products: number;
            subcategories: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mssqlCode: string | null;
        requiresInstallationType: boolean;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            products: number;
            subcategories: number;
        };
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mssqlCode: string | null;
        requiresInstallationType: boolean;
    }>;
    findSubcategories(categoryId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
    }[]>;
    create(dto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mssqlCode: string | null;
        requiresInstallationType: boolean;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mssqlCode: string | null;
        requiresInstallationType: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mssqlCode: string | null;
        requiresInstallationType: boolean;
    }>;
    createSubcategory(categoryId: string, dto: CreateSubcategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
    }>;
    updateSubcategory(subcategoryId: string, dto: UpdateSubcategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
    }>;
    removeSubcategory(subcategoryId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
    }>;
}
