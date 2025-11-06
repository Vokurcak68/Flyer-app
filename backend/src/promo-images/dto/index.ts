import { IsString, IsEnum, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreatePromoImageDto {
  @IsString()
  name: string;

  @IsString()
  imageData: string; // Base64 encoded promo image

  @IsString()
  imageMimeType: string; // e.g., 'image/jpeg', 'image/png'

  @IsEnum(['single', 'horizontal', 'square', 'full_page', 'footer', 'header_2x1', 'header_2x2'])
  defaultSize: 'single' | 'horizontal' | 'square' | 'full_page' | 'footer' | 'header_2x1' | 'header_2x2';

  @IsString()
  brandId: string;

  @IsBoolean()
  @IsOptional()
  isForEndUsers?: boolean;

  @IsBoolean()
  @IsOptional()
  fillDate?: boolean;
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
