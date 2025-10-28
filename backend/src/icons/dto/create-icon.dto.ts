import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

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
}
