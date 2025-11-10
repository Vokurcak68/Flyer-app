import { UploadService } from './upload.service';
export declare class UploadController {
    private uploadService;
    constructor(uploadService: UploadService);
    uploadProductImage(file: Express.Multer.File): Promise<{
        success: boolean;
        url: string;
        message: string;
    }>;
    uploadPromoImage(file: Express.Multer.File): Promise<{
        success: boolean;
        url: string;
        message: string;
    }>;
    uploadIconImage(file: Express.Multer.File): Promise<{
        success: boolean;
        url: string;
        message: string;
    }>;
    uploadBrandLogo(file: Express.Multer.File): Promise<{
        success: boolean;
        url: string;
        message: string;
    }>;
}
