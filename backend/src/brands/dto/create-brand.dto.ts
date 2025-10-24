import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
}
