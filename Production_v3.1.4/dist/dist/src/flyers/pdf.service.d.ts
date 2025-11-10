import { ConfigService } from '@nestjs/config';
export declare class PdfService {
    private configService;
    private readonly logger;
    private readonly uploadsDir;
    constructor(configService: ConfigService);
    private ensureUploadDirectory;
    private convertImageToPNG;
    generateFlyerPDF(flyer: any, userRole?: string): Promise<Buffer>;
    private renderSlotGrid;
    private renderEmptySlot;
    private renderProductSlot;
    private renderPromoSlot;
    private getPromoSpannedSlots;
    private getPromoWidth;
    private getPromoHeight;
    deletePDF(pdfUrl: string): Promise<void>;
}
