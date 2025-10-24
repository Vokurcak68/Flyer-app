import { IsInt, Min, Max } from 'class-validator';

export class UpdateProductPositionDto {
  @IsInt()
  @Min(1)
  @Max(8)
  position: number;
}
