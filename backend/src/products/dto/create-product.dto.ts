import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ArrayMaxSize, Matches, Min, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

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

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(4, { message: 'Maximum 4 icons allowed per product' })
  @IsOptional()
  iconIds?: string[]; // Array of icon IDs from global icon library
}
