import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class AddProductToSlotDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(0)
  @Max(7)
  slotPosition: number; // 0-7 for 2x4 grid
}
