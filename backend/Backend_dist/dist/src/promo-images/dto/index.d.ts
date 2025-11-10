export declare class CreatePromoImageDto {
    name: string;
    imageData: string;
    imageMimeType: string;
    defaultSize: 'single' | 'horizontal' | 'square' | 'full_page' | 'footer' | 'header_2x1' | 'header_2x2';
    brandId: string;
    isForEndUsers?: boolean;
    fillDate?: boolean;
}
export declare class UpdatePromoImageDto {
    name?: string;
    imageData?: string;
    imageMimeType?: string;
    defaultSize?: 'single' | 'horizontal' | 'square' | 'full_page' | 'footer' | 'header_2x1' | 'header_2x2';
    brandId?: string;
    isForEndUsers?: boolean;
    fillDate?: boolean;
}
export declare class PromoImageFilterDto {
    brandId?: string;
    sizeType?: 'full' | 'half' | 'quarter' | 'eighth';
    search?: string;
}
