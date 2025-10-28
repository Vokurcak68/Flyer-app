import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createProductDto: CreateProductDto, userId: string): Promise<{
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
    findAll(filterDto: ProductFilterDto, userId?: string, userRole?: string): Promise<{
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
    update(id: string, updateProductDto: UpdateProductDto, userId: string): Promise<{
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
    remove(id: string, userId: string): Promise<{
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
    getProductImageData(id: string): Promise<{
        imageData: Buffer<ArrayBufferLike>;
        imageMimeType: string;
    }>;
    private validateEanCodeUniqueness;
    private validateUserBrandAccess;
    private validateIconIds;
    private formatProductResponse;
}
