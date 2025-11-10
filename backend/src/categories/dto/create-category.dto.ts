import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  mssqlCode?: string; // Code for MSSQL integration

  @IsBoolean()
  @IsOptional()
  requiresInstallationType?: boolean; // If true, products in this category must specify installation type (built-in vs freestanding)
}
