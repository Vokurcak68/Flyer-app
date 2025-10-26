import { IsNotEmpty, IsString } from 'class-validator';

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
}
