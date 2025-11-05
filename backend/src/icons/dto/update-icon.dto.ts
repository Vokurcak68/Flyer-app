import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

export class UpdateIconDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  imageData?: string; // Base64 encoded

  @IsOptional()
  @IsString()
  imageMimeType?: string;

  @IsOptional()
  @IsBoolean()
  isEnergyClass?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandIds?: string[];
}
