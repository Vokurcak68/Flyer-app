import { Response } from 'express';
import { FlyersService } from './flyers.service';
import { PdfService } from './pdf.service';
import { CreateFlyerDto, UpdateFlyerDto, AddPageDto, AddProductToPageDto, FlyerFilterDto, UpdateProductPositionDto } from './dto';
export declare class FlyersController {
    private readonly flyersService;
    private readonly pdfService;
    constructor(flyersService: FlyersService, pdfService: PdfService);
    create(createFlyerDto: CreateFlyerDto, req: any): Promise<any>;
    findAll(filterDto: FlyerFilterDto, req: any): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getActiveFlyers(req: any): Promise<any[]>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, updateFlyerDto: UpdateFlyerDto, req: any): Promise<any>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    addPage(flyerId: string, addPageDto: AddPageDto, req: any): Promise<{
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
                    position: number;
                    productId: string;
                    iconId: string;
                }[];
            } & {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                supplierId: string;
                brandId: string;
                imageData: Buffer;
                imageMimeType: string;
                eanCode: string;
                description: string | null;
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
    removePage(pageId: string, req: any): Promise<{
        message: string;
    }>;
    addProductToPage(pageId: string, addProductDto: AddProductToPageDto, req: any): Promise<{
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
                position: number;
                productId: string;
                iconId: string;
            }[];
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            supplierId: string;
            brandId: string;
            imageData: Buffer;
            imageMimeType: string;
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
    removeProductFromPage(productId: string, req: any): Promise<{
        message: string;
    }>;
    updateProductPosition(productId: string, updatePositionDto: UpdateProductPositionDto, req: any): Promise<{
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
                position: number;
                productId: string;
                iconId: string;
            }[];
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            supplierId: string;
            brandId: string;
            imageData: Buffer;
            imageMimeType: string;
            eanCode: string;
            description: string | null;
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
        productId: string | null;
        slotPosition: number;
        pageId: string;
        slotType: import(".prisma/client").$Enums.SlotType;
        promoImageId: string | null;
        promoSize: import(".prisma/client").$Enums.PromoSlotSize | null;
        isPromoAnchor: boolean;
        promoAnchorId: string | null;
    }>;
    submitForVerification(flyerId: string, req: any): Promise<{
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
                    icons: ({
                        icon: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            name: string;
                            imageData: Buffer;
                            imageMimeType: string;
                        };
                    } & {
                        id: string;
                        position: number;
                        productId: string;
                        iconId: string;
                    })[];
                } & {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    supplierId: string;
                    brandId: string;
                    imageData: Buffer;
                    imageMimeType: string;
                    eanCode: string;
                    description: string | null;
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
    getPreview(flyerId: string, req: any): Promise<{
        id: any;
        name: any;
        validFrom: any;
        validTo: any;
        status: any;
        completionPercentage: any;
        pages: any;
    }>;
    autoSave(flyerId: string, req: any): Promise<{
        id: string;
        lastEditedAt: Date;
        autoSaveVersion: number;
        message: string;
    }>;
    getPdf(id: string, res: Response, req: any): Promise<void>;
    generatePDF(flyerId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
