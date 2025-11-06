import { IsString, IsOptional, IsDateString, IsArray, IsInt } from 'class-validator';

export class UpdateFlyerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  actionId?: number;

  @IsOptional()
  @IsString()
  actionName?: string;

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
