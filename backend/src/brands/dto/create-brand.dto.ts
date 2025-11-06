import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  logoData?: string; // Base64 encoded image data

  @IsString()
  @IsOptional()
  logoMimeType?: string; // e.g., 'image/png', 'image/jpeg'

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color code (e.g., #FF5733)' })
  color?: string; // Hex color code (e.g., #FF5733)
}
