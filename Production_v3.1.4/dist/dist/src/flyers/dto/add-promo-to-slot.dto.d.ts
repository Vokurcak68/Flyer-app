export declare enum PromoSlotSize {
    SINGLE = "single",
    HORIZONTAL = "horizontal",
    SQUARE = "square",
    FULL_PAGE = "full_page",
    HEADER_2X1 = "header_2x1",
    HEADER_2X2 = "header_2x2"
}
export declare class AddPromoToSlotDto {
    promoImageId: string;
    anchorSlotPosition: number;
    promoSize: PromoSlotSize;
}
