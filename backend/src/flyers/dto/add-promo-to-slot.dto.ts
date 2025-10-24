import { IsString, IsNotEmpty, IsInt, Min, Max, IsEnum } from 'class-validator';

export enum PromoSlotSize {
  SINGLE = 'single',       // 1 slot (1x1)
  HORIZONTAL = 'horizontal', // 2 slots horizontal (2x1)
  SQUARE = 'square',        // 4 slots (2x2)
  FULL_PAGE = 'full_page',  // 8 slots (full page)
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
