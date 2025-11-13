import { CreateProductDto } from './create-product.dto';
declare const UpdateProductDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateProductDto, "eanCode">>>;
export declare class UpdateProductDto extends UpdateProductDto_base {
}
export {};
