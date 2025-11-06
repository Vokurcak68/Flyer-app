import { IsString, IsNotEmpty, IsInt, Min, Max, IsEnum } from 'class-validator';

export enum PromoSlotSize {
  SINGLE = 'single',         // 1 slot (1x1)
  HORIZONTAL = 'horizontal', // 2 slots horizontal (2x1)
  SQUARE = 'square',         // 4 slots (2x2)
  FULL_PAGE = 'full_page',   // 8 slots (full page)
  HEADER_2X1 = 'header_2x1', // Header 2 slots horizontal (2x1)
  HEADER_2X2 = 'header_2x2', // Header 4 slots (2x2)
}

export class AddPromoToSlotDto {
  @IsString()
  @IsNotEmpty()
  promoImageId: string;

  @IsInt()
  @Min(0)
  @Max(7)
  anchorSlotPosition: number; // Starting position (top-left slot of the promo)

  @IsEnum(PromoSlotSize)
  promoSize: PromoSlotSize;
}
