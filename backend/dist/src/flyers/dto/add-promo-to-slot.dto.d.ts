export declare enum PromoSlotSize {
    SINGLE = "single",
    HORIZONTAL = "horizontal",
    SQUARE = "square",
    FULL_PAGE = "full_page"
}
export declare class AddPromoToSlotDto {
    promoImageId: string;
    anchorSlotPosition: number;
    promoSize: PromoSlotSize;
}
