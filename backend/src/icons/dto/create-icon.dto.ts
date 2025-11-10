import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateIconDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  imageData: string; // Base64 encoded

  @IsNotEmpty()
  @IsString()
  imageMimeType: string;

  @IsOptional()
  @IsBoolean()
  isEnergyClass?: boolean;

  @IsOptional()
  @IsBoolean()
  useBrandColor?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandIds?: string[];
}
