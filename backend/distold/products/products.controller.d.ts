import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto, req: any): Promise<{
        id: any;
        eanCode: any;
        name: any;
        description: any;
        price: number;
        originalPrice: number;
        isActive: any;
        brandId: any;
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
            price: number;
            originalPrice: number;
            isActive: any;
            brandId: any;
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
        id: any;
        eanCode: any;
        name: any;
        description: any;
        price: number;
        originalPrice: number;
        isActive: any;
        brandId: any;
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
        price: number;
        originalPrice: number;
        isActive: any;
        brandId: any;
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
        price: number;
        originalPrice: number;
        isActive: any;
        brandId: any;
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
}
