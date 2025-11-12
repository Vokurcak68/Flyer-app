import { InstallationType } from '@prisma/client';
export declare class CreateProductDto {
    eanCode: string;
    name: string;
    description?: string;
    supplierNote?: string;
    imageData?: string;
    imageMimeType?: string;
    price: number;
    originalPrice?: number;
    brandId: string;
    categoryId?: string;
    subcategoryId?: string;
    iconIds?: string[];
    installationType?: InstallationType;
}
