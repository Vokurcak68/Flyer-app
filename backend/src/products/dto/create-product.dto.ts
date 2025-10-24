import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUrl, IsArray, ValidateNested, ArrayMaxSize, Matches, IsDecimal, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class ProductIconDto {
  @IsString()
  @IsNotEmpty()
  iconType: 'energy_class' | 'feature';

  @IsString()
  @IsNotEmpty()
  iconData: string; // Base64 encoded icon data

  @IsString()
  @IsNotEmpty()
  iconMimeType: string; // e.g., 'image/png'

  @IsNumber()
  @Min(0)
  position: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8,13}$/, { message: 'EAN code must be 8-13 digits' })
  eanCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  imageData: string; // Base64 encoded product image

  @IsString()
  @IsNotEmpty()
  imageMimeType: string; // e.g., 'image/jpeg', 'image/png'

  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsString()
  @IsNotEmpty()
  brandId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIconDto)
  @ArrayMaxSize(4, { message: 'Maximum 4 icons allowed per product' })
  @IsOptional()
  icons?: ProductIconDto[];
}
