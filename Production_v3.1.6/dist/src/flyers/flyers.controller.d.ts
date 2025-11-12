import { Response } from 'express';
import { FlyersService } from './flyers.service';
import { PdfService } from './pdf.service';
import { CreateFlyerDto, UpdateFlyerDto, AddPageDto, AddProductToPageDto, FlyerFilterDto, UpdateProductPositionDto } from './dto';
import { MssqlService } from '../common/mssql.service';
export declare class FlyersController {
    private readonly flyersService;
    private readonly pdfService;
    private readonly mssqlService;
    constructor(flyersService: FlyersService, pdfService: PdfService, mssqlService: MssqlService);
    getActions(req: any): Promise<{
        id: number;
        name: string;
        validFrom?: string;
        validTo?: string;
    }[]>;
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
                icons: {
                    id: string;
                    position: number;
                    productId: string;
                    iconId: string;
                }[];
                brand: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    logoData: Buffer | null;
                    logoMimeType: string | null;
                    color: string | null;
                };
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
                supplierNote: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
                installationType: import(".prisma/client").$Enums.InstallationType | null;
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
                fillDate: boolean;
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
            icons: {
                id: string;
                position: number;
                productId: string;
                iconId: string;
            }[];
            brand: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                logoData: Buffer | null;
                logoMimeType: string | null;
                color: string | null;
            };
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
            supplierNote: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
            installationType: import(".prisma/client").$Enums.InstallationType | null;
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
            icons: {
                id: string;
                position: number;
                productId: string;
                iconId: string;
            }[];
            brand: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                logoData: Buffer | null;
                logoMimeType: string | null;
                color: string | null;
            };
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
            supplierNote: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            originalPrice: import("@prisma/client/runtime/library").Decimal | null;
            installationType: import(".prisma/client").$Enums.InstallationType | null;
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
            fillDate: boolean;
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
    validateFlyer(flyerId: string, req: any): Promise<{
        valid: boolean;
        errors: {
            productId: string;
            productName: string;
            eanCode: string;
            errors: string[];
            erpPrice?: number;
            erpOriginalPrice?: number;
            currentPrice?: number;
            currentOriginalPrice?: number;
        }[];
        productsChecked: number;
        errorsFound: number;
    }>;
    submitForVerification(flyerId: string, req: any): Promise<{
        pages: ({
            slots: ({
                product: {
                    icons: ({
                        icon: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            imageData: Buffer;
                            imageMimeType: string;
                            isEnergyClass: boolean;
                            useBrandColor: boolean;
                        };
                    } & {
                        id: string;
                        position: number;
                        productId: string;
                        iconId: string;
                    })[];
                    brand: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        logoData: Buffer | null;
                        logoMimeType: string | null;
                        color: string | null;
                    };
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
                    supplierNote: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    originalPrice: import("@prisma/client/runtime/library").Decimal | null;
                    installationType: import(".prisma/client").$Enums.InstallationType | null;
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
                    fillDate: boolean;
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
        actionId: number | null;
        actionName: string | null;
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
    expireFlyer(flyerId: string, req: any): Promise<any>;
    getPdf(id: string, res: Response, req: any): Promise<void>;
    generatePDF(flyerId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
