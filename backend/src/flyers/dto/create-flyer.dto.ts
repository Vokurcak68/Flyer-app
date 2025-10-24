import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateFlyerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}
