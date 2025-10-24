import { PrismaService } from '../prisma/prisma.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { CreateFlyerDto, UpdateFlyerDto, AddPageDto, AddProductToPageDto, FlyerFilterDto, UpdateProductPositionDto } from './dto';
import { UserRole } from '@prisma/client';
export declare class FlyersService {
    private prisma;
    private approvalsService;
    constructor(prisma: PrismaService, approvalsService: ApprovalsService);
    create(createFlyerDto: CreateFlyerDto, userId: string): Promise<any>;
    findAll(filterDto: FlyerFilterDto, userId: string, userRole: UserRole): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, userId: string, userRole: UserRole): Promise<any>;
    update(id: string, updateFlyerDto: UpdateFlyerDto, userId: string, userRole: UserRole): Promise<any>;
    remove(id: string, userId: string, userRole: UserRole): Promise<{
        message: string;
    }>;
    addPage(flyerId: string, addPageDto: AddPageDto, userId: string): Promise<{
        slots: ({
            product: {
                brand: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    logoData: Buffer | null;
                    logoMimeType: string | null;
                };
                icons: {
                    id: string;
                    productId: string;
                    position: number;
                    iconType: import(".prisma/client").$Enums.IconType;
                    iconData: Buffer;
                    iconMimeType: string;
                }[];
            } & {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                supplierId: string;
                brandId: string;
                eanCode: string;
                description: string | null;
                imageData: Buffer;
                imageMimeType: string;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
            };
            promoImage: {
                id: string;
                createdAt: Date;
                name: string;
                supplierId: string;
                brandId: string | null;
                imageData: Buffer;
                imageMimeType: string;
                defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
            };
        } & {
            id: string;
            slotPosition: number;
            pageId: string;
            slotType: import(".prisma/client").$Enums.SlotType;
            productId: string | null;
            promoImageId: string | null;
            promoSize: import(".prisma/client").$Enums.PromoSlotSize | null;
            isPromoAnchor: boolean;
            promoAnchorId: string | null;
        })[];
    } & {
        id: string;
        flyerId: string;
        pageNumber: number;
        footerPromoImageId: string | null;
    }>;
    removePage(pageId: string, userId: string): Promise<{
        message: string;
    }>;
    addProductToPage(pageId: string, addProductDto: AddProductToPageDto, userId: string): Promise<{
        product: {
            brand: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                logoData: Buffer | null;
                logoMimeType: string | null;
            };
            icons: {
                id: string;
                productId: string;
                position: number;
                iconType: import(".prisma/client").$Enums.IconType;
                iconData: Buffer;
                iconMimeType: string;
            }[];
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            supplierId: string;
            brandId: string;
            eanCode: string;
            description: string | null;
            imageData: Buffer;
            imageMimeType: string;
            price: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        };
    } & {
        id: string;
        slotPosition: number;
        pageId: string;
        slotType: import(".prisma/client").$Enums.SlotType;
        productId: string | null;
        promoImageId: string | null;
        promoSize: import(".prisma/client").$Enums.PromoSlotSize | null;
        isPromoAnchor: boolean;
        promoAnchorId: string | null;
    }>;
    removeProductFromPage(slotId: string, userId: string): Promise<{
        message: string;
    }>;
    updateProductPosition(slotId: string, updatePositionDto: UpdateProductPositionDto, userId: string): Promise<{
        product: {
            brand: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                logoData: Buffer | null;
                logoMimeType: string | null;
            };
            icons: {
                id: string;
                productId: string;
                position: number;
                iconType: import(".prisma/client").$Enums.IconType;
                iconData: Buffer;
                iconMimeType: string;
            }[];
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            supplierId: string;
            brandId: string;
            eanCode: string;
            description: string | null;
            imageData: Buffer;
            imageMimeType: string;
            price: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        };
        promoImage: {
            id: string;
            createdAt: Date;
            name: string;
            supplierId: string;
            brandId: string | null;
            imageData: Buffer;
            imageMimeType: string;
            defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
        };
    } & {
        id: string;
        slotPosition: number;
        pageId: string;
        slotType: import(".prisma/client").$Enums.SlotType;
        productId: string | null;
        promoImageId: string | null;
        promoSize: import(".prisma/client").$Enums.PromoSlotSize | null;
        isPromoAnchor: boolean;
        promoAnchorId: string | null;
    }>;
    submitForVerification(flyerId: string, userId: string): Promise<{
        pages: ({
            slots: ({
                product: {
                    brand: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        logoData: Buffer | null;
                        logoMimeType: string | null;
                    };
                    icons: {
                        id: string;
                        productId: string;
                        position: number;
                        iconType: import(".prisma/client").$Enums.IconType;
                        iconData: Buffer;
                        iconMimeType: string;
                    }[];
                } & {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    supplierId: string;
                    brandId: string;
                    eanCode: string;
                    description: string | null;
                    imageData: Buffer;
                    imageMimeType: string;
                    price: import("@prisma/client/runtime/library").Decimal;
                    originalPrice: import("@prisma/client/runtime/library").Decimal | null;
                };
                promoImage: {
                    id: string;
                    createdAt: Date;
                    name: string;
                    supplierId: string;
                    brandId: string | null;
                    imageData: Buffer;
                    imageMimeType: string;
                    defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
                };
            } & {
                id: string;
                slotPosition: number;
                pageId: string;
                slotType: import(".prisma/client").$Enums.SlotType;
                productId: string | null;
                promoImageId: string | null;
                promoSize: import(".prisma/client").$Enums.PromoSlotSize | null;
                isPromoAnchor: boolean;
                promoAnchorId: string | null;
            })[];
        } & {
            id: string;
            flyerId: string;
            pageNumber: number;
            footerPromoImageId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.FlyerStatus;
        supplierId: string;
        validFrom: Date | null;
        validTo: Date | null;
        isDraft: boolean;
        rejectionReason: string | null;
        pdfData: Buffer | null;
        pdfMimeType: string | null;
        lastEditedAt: Date;
        autoSaveVersion: number;
        completionPercentage: number;
        publishedAt: Date | null;
    }>;
    getPreview(flyerId: string, userId: string, userRole: UserRole): Promise<{
        id: any;
        name: any;
        validFrom: any;
        validTo: any;
        status: any;
        completionPercentage: any;
        pages: any;
    }>;
    autoSave(flyerId: string, userId: string): Promise<{
        id: string;
        lastEditedAt: Date;
        autoSaveVersion: number;
        message: string;
    }>;
    private updateCompletionPercentage;
    private syncPages;
    private transformFlyerForFrontend;
    private checkAccessPermission;
    private createEditHistory;
    private createVersionSnapshot;
}
