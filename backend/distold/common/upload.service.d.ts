import { ConfigService } from '@nestjs/config';
export declare enum UploadType {
    PRODUCT = "products",
    PROMO = "promo-images",
    ICON = "icons",
    BRAND = "brands"
}
export declare class UploadService {
    private configService;
    private readonly uploadsDir;
    private readonly allowedMimeTypes;
    private readonly maxFileSize;
    constructor(configService: ConfigService);
    private ensureUploadDirectories;
    validateFile(file: Express.Multer.File): void;
    saveFile(file: Express.Multer.File, uploadType: UploadType): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
    getMulterOptions(): {
        limits: {
            fileSize: number;
        };
        fileFilter: (req: any, file: Express.Multer.File, callback: any) => void;
    };
}
