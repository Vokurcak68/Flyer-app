import { IsInt, Min } from 'class-validator';

export class AddPageDto {
  @IsInt()
  @Min(1)
  pageNumber: number;
}
