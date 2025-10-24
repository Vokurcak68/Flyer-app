import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class AddProductToPageDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(8)
  position: number;
}
