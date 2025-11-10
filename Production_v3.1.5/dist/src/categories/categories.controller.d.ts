import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateSubcategoryDto, UpdateSubcategoryDto } from './dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
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
        isBuiltIn: boolean;
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
        isBuiltIn: boolean;
    }>;
    findSubcategories(id: string): Promise<{
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
        isBuiltIn: boolean;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mssqlCode: string | null;
        isBuiltIn: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mssqlCode: string | null;
        isBuiltIn: boolean;
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
