import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// UpdateProductDto allows updating all fields except eanCode
// Icons are managed via separate endpoints
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['eanCode', 'icons'] as const)
) {}

