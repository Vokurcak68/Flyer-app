import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class AddIconDto {
  @IsString()
  @IsNotEmpty()
  iconType: 'energy_class' | 'feature';

  @IsString()
  @IsOptional()
  iconData?: string; // Base64 encoded icon data

  @IsString()
  @IsOptional()
  iconMimeType?: string; // e.g., 'image/png', 'image/jpeg'

  @IsNumber()
  @Min(0)
  position: number;
}
