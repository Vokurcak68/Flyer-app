export declare enum FlyerStatusEnum {
    DRAFT = "draft",
    PENDING_VERIFICATION = "pending_verification",
    PENDING_APPROVAL = "pending_approval",
    APPROVED = "approved",
    REJECTED = "rejected",
    ACTIVE = "active",
    EXPIRED = "expired"
}
export declare class FlyerFilterDto {
    status?: FlyerStatusEnum;
    isDraft?: boolean;
    validFrom?: string;
    validTo?: string;
}
