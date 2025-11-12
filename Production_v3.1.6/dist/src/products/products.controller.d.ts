import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { MssqlService } from '../common/mssql.service';
export declare class ProductsController {
    private readonly productsService;
    private readonly mssqlService;
    constructor(productsService: ProductsService, mssqlService: MssqlService);
    create(createProductDto: CreateProductDto, req: any): Promise<{
        id: any;
        eanCode: any;
        name: any;
        description: any;
        supplierNote: any;
        price: number;
        originalPrice: number;
        isActive: any;
        brandId: any;
        brandName: any;
        brandColor: any;
        categoryId: any;
        categoryName: any;
        subcategoryId: any;
        subcategoryName: any;
        installationType: any;
        brand: {
            id: any;
            name: any;
        };
        supplier: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
        };
        icons: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(filterDto: ProductFilterDto, req: any): Promise<{
        data: {
            id: any;
            eanCode: any;
            name: any;
            description: any;
            supplierNote: any;
            price: number;
            originalPrice: number;
            isActive: any;
            brandId: any;
            brandName: any;
            brandColor: any;
            categoryId: any;
            categoryName: any;
            subcategoryId: any;
            subcategoryName: any;
            installationType: any;
            brand: {
                id: any;
                name: any;
            };
            supplier: {
                id: any;
                email: any;
                firstName: any;
                lastName: any;
            };
            icons: any;
            createdAt: any;
            updatedAt: any;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getImage(id: string, res: Response): Promise<void>;
    findOne(id: string): Promise<{
        isInActiveFlyer: boolean;
        id: any;
        eanCode: any;
        name: any;
        description: any;
        supplierNote: any;
        price: number;
        originalPrice: number;
        isActive: any;
        brandId: any;
        brandName: any;
        brandColor: any;
        categoryId: any;
        categoryName: any;
        subcategoryId: any;
        subcategoryName: any;
        installationType: any;
        brand: {
            id: any;
            name: any;
        };
        supplier: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
        };
        icons: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, updateProductDto: UpdateProductDto, req: any): Promise<{
        id: any;
        eanCode: any;
        name: any;
        description: any;
        supplierNote: any;
        price: number;
        originalPrice: number;
        isActive: any;
        brandId: any;
        brandName: any;
        brandColor: any;
        categoryId: any;
        categoryName: any;
        subcategoryId: any;
        subcategoryName: any;
        installationType: any;
        brand: {
            id: any;
            name: any;
        };
        supplier: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
        };
        icons: any;
        createdAt: any;
        updatedAt: any;
    }>;
    remove(id: string, req: any): Promise<{
        id: any;
        eanCode: any;
        name: any;
        description: any;
        supplierNote: any;
        price: number;
        originalPrice: number;
        isActive: any;
        brandId: any;
        brandName: any;
        brandColor: any;
        categoryId: any;
        categoryName: any;
        subcategoryId: any;
        subcategoryName: any;
        installationType: any;
        brand: {
            id: any;
            name: any;
        };
        supplier: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
        };
        icons: any;
        createdAt: any;
        updatedAt: any;
    }>;
    exportToCsv(req: any, res: Response): Promise<void>;
    importFromCsv(file: Express.Multer.File, req: any): Promise<{
        imported: number;
        updated: number;
        skipped: number;
        errors: string[];
    }>;
    checkDuplicateEan(ean: string, req: any): Promise<{
        exists: boolean;
        count: number;
        latestProduct: {
            id: any;
            eanCode: any;
            name: any;
            description: any;
            supplierNote: any;
            price: number;
            originalPrice: number;
            isActive: any;
            brandId: any;
            brandName: any;
            brandColor: any;
            categoryId: any;
            categoryName: any;
            subcategoryId: any;
            subcategoryName: any;
            installationType: any;
            brand: {
                id: any;
                name: any;
            };
            supplier: {
                id: any;
                email: any;
                firstName: any;
                lastName: any;
            };
            icons: any;
            createdAt: any;
            updatedAt: any;
        };
        allProducts: {
            id: any;
            eanCode: any;
            name: any;
            description: any;
            supplierNote: any;
            price: number;
            originalPrice: number;
            isActive: any;
            brandId: any;
            brandName: any;
            brandColor: any;
            categoryId: any;
            categoryName: any;
            subcategoryId: any;
            subcategoryName: any;
            installationType: any;
            brand: {
                id: any;
                name: any;
            };
            supplier: {
                id: any;
                email: any;
                firstName: any;
                lastName: any;
            };
            icons: any;
            createdAt: any;
            updatedAt: any;
        }[];
    }>;
    validateEAN(ean: string, price?: string, originalPrice?: string): Promise<{
        ean: string;
        found: boolean;
        pricesMatch: boolean;
        erpPrice: number;
        erpOriginalPrice: number;
        erpProductName: string;
        erpBrand: string;
        erpCategoryCode: string;
    }>;
}
