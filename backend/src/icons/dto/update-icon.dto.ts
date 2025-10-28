import { IsOptional, IsString, IsBoolean } from 'class-validator';

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
}
