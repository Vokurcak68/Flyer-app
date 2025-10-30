import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreatePromoImageDto {
  @IsString()
  name: string;

  @IsString()
  imageData: string; // Base64 encoded promo image

  @IsString()
  imageMimeType: string; // e.g., 'image/jpeg', 'image/png'

  @IsEnum(['single', 'horizontal', 'square', 'full_page', 'footer'])
  defaultSize: 'single' | 'horizontal' | 'square' | 'full_page' | 'footer';

  @IsUUID()
  brandId: string;
}

export class PromoImageFilterDto {
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @IsEnum(['full', 'half', 'quarter', 'eighth'])
  @IsOptional()
  sizeType?: 'full' | 'half' | 'quarter' | 'eighth';

  @IsString()
  @IsOptional()
  search?: string;
}
