import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// UpdateProductDto allows updating all fields except eanCode and brandId
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['eanCode', 'brandId'] as const)
) {}

