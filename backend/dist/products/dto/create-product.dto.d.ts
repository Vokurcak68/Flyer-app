declare class ProductIconDto {
    iconType: 'energy_class' | 'feature';
    iconData: string;
    iconMimeType: string;
    position: number;
}
export declare class CreateProductDto {
    eanCode: string;
    name: string;
    description?: string;
    imageData: string;
    imageMimeType: string;
    price: number;
    originalPrice?: number;
    brandId: string;
    icons?: ProductIconDto[];
}
export {};
