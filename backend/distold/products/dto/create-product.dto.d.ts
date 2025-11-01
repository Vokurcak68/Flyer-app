export declare class CreateProductDto {
    eanCode: string;
    name: string;
    description?: string;
    imageData: string;
    imageMimeType: string;
    price: number;
    originalPrice?: number;
    brandId: string;
    iconIds?: string[];
}
