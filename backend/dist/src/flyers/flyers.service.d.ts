import { PrismaService } from '../prisma/prisma.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { PdfService } from './pdf.service';
import { CreateFlyerDto, UpdateFlyerDto, AddPageDto, AddProductToPageDto, FlyerFilterDto, UpdateProductPositionDto } from './dto';
import { UserRole } from '@prisma/client';
export declare class FlyersService {
    private prisma;
    private approvalsService;
    private pdfService;
    constructor(prisma: PrismaService, approvalsService: ApprovalsService, pdfService: PdfService);
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
    getActiveFlyers(userId: string, userRole: UserRole): Promise<any[]>;
    findOneForPdf(id: string, userId: string, userRole: UserRole): Promise<any>;
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
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    logoData: Buffer | null;
                    logoMimeType: string | null;
                };
                icons: {
                    id: string;
                    position: number;
                    productId: string;
                    iconId: string;
                }[];
            } & {
                id: string;
                supplierId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                categoryId: string | null;
                brandId: string;
                imageData: Buffer | null;
                imageMimeType: string | null;
                subcategoryId: string | null;
                eanCode: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
            };
            promoImage: {
                id: string;
                supplierId: string;
                name: string;
                createdAt: Date;
                brandId: string | null;
                imageData: Buffer;
                imageMimeType: string;
                defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
                isForEndUsers: boolean;
            };
        } & {
            id: string;
            productId: string | null;
            slotPosition: number;
            pageId: string;
            slotType: import(".prisma/client").$Enums.SlotType;
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
                name: string;
                createdAt: Date;
                updatedAt: Date;
                logoData: Buffer | null;
                logoMimeType: string | null;
            };
            icons: {
                id: string;
                position: number;
                productId: string;
                iconId: string;
            }[];
        } & {
            id: string;
            supplierId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            categoryId: string | null;
            brandId: string;
            imageData: Buffer | null;
            imageMimeType: string | null;
            subcategoryId: string | null;
            eanCode: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        };
    } & {
        id: string;
        productId: string | null;
        slotPosition: number;
        pageId: string;
        slotType: import(".prisma/client").$Enums.SlotType;
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
                name: string;
                createdAt: Date;
                updatedAt: Date;
                logoData: Buffer | null;
                logoMimeType: string | null;
            };
            icons: {
                id: string;
                position: number;
                productId: string;
                iconId: string;
            }[];
        } & {
            id: string;
            supplierId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            categoryId: string | null;
            brandId: string;
            imageData: Buffer | null;
            imageMimeType: string | null;
            subcategoryId: string | null;
            eanCode: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        };
        promoImage: {
            id: string;
            supplierId: string;
            name: string;
            createdAt: Date;
            brandId: string | null;
            imageData: Buffer;
            imageMimeType: string;
            defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
            isForEndUsers: boolean;
        };
    } & {
        id: string;
        productId: string | null;
        slotPosition: number;
        pageId: string;
        slotType: import(".prisma/client").$Enums.SlotType;
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
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        logoData: Buffer | null;
                        logoMimeType: string | null;
                    };
                    icons: ({
                        icon: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            imageData: Buffer;
                            imageMimeType: string;
                            isEnergyClass: boolean;
                        };
                    } & {
                        id: string;
                        position: number;
                        productId: string;
                        iconId: string;
                    })[];
                } & {
                    id: string;
                    supplierId: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    categoryId: string | null;
                    brandId: string;
                    imageData: Buffer | null;
                    imageMimeType: string | null;
                    subcategoryId: string | null;
                    eanCode: string;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    originalPrice: import("@prisma/client/runtime/library").Decimal | null;
                };
                promoImage: {
                    id: string;
                    supplierId: string;
                    name: string;
                    createdAt: Date;
                    brandId: string | null;
                    imageData: Buffer;
                    imageMimeType: string;
                    defaultSize: import(".prisma/client").$Enums.PromoSlotSize;
                    isForEndUsers: boolean;
                };
            } & {
                id: string;
                productId: string | null;
                slotPosition: number;
                pageId: string;
                slotType: import(".prisma/client").$Enums.SlotType;
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
        supplierId: string;
        name: string;
        validFrom: Date | null;
        validTo: Date | null;
        status: import(".prisma/client").$Enums.FlyerStatus;
        isDraft: boolean;
        rejectionReason: string | null;
        pdfData: Buffer | null;
        pdfMimeType: string | null;
        lastEditedAt: Date;
        autoSaveVersion: number;
        completionPercentage: number;
        createdAt: Date;
        updatedAt: Date;
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
    expireFlyer(flyerId: string, userId: string, userRole: UserRole): Promise<any>;
    private updateExpiredFlyers;
    private updateCompletionPercentage;
    private syncPages;
    private transformFlyerForFrontend;
    private checkAccessPermission;
    private createEditHistory;
    private createVersionSnapshot;
}
