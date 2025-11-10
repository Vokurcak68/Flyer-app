import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  mssqlCode?: string; // Code for MSSQL integration

  @IsBoolean()
  @IsOptional()
  requiresInstallationType?: boolean; // If true, products in this category must specify installation type (built-in vs freestanding)
}
