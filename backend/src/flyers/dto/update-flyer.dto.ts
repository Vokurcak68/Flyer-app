import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class UpdateFlyerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  pdfData?: Buffer; // PDF binary data

  @IsOptional()
  @IsString()
  pdfMimeType?: string; // Should be 'application/pdf'

  @IsOptional()
  @IsArray()
  pages?: any[]; // Array of pages with products
}
