import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// UpdateProductDto allows updating all fields except eanCode
// Note: brandId can be changed to reassign product to different supplier
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['eanCode'] as const)
) {}

