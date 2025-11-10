import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubcategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateSubcategoryDto {
  @IsString()
  @IsOptional()
  name?: string;
}
