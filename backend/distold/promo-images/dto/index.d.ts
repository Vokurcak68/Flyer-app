export declare class CreatePromoImageDto {
    name: string;
    imageData: string;
    imageMimeType: string;
    defaultSize: 'single' | 'horizontal' | 'square' | 'full_page' | 'footer';
    brandId?: string;
}
export declare class PromoImageFilterDto {
    brandId?: string;
    sizeType?: 'full' | 'half' | 'quarter' | 'eighth';
    search?: string;
}
