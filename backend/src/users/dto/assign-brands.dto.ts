import { IsArray, IsString } from 'class-validator';

export class AssignBrandsDto {
  @IsArray()
  @IsString({ each: true })
  brandIds: string[];
}
