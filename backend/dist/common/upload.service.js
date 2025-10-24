"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = exports.UploadType = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs/promises");
const path = require("path");
const uuid_1 = require("uuid");
var UploadType;
(function (UploadType) {
    UploadType["PRODUCT"] = "products";
    UploadType["PROMO"] = "promo-images";
    UploadType["ICON"] = "icons";
    UploadType["BRAND"] = "brands";
})(UploadType || (exports.UploadType = UploadType = {}));
let UploadService = class UploadService {
    constructor(configService) {
        this.configService = configService;
        this.allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
        ];
        this.maxFileSize = 5 * 1024 * 1024;
        this.uploadsDir = path.join(process.cwd(), 'uploads');
        this.ensureUploadDirectories();
    }
    async ensureUploadDirectories() {
        const dirs = [
            this.uploadsDir,
            path.join(this.uploadsDir, UploadType.PRODUCT),
            path.join(this.uploadsDir, UploadType.PROMO),
            path.join(this.uploadsDir, UploadType.ICON),
            path.join(this.uploadsDir, UploadType.BRAND),
            path.join(this.uploadsDir, 'pdfs'),
        ];
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            }
            catch {
                await fs.mkdir(dir, { recursive: true });
            }
        }
    }
    validateFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
        }
        if (file.size > this.maxFileSize) {
            throw new common_1.BadRequestException(`File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
        }
    }
    async saveFile(file, uploadType) {
        this.validateFile(file);
        const ext = path.extname(file.originalname);
        const filename = `${(0, uuid_1.v4)()}${ext}`;
        const dir = path.join(this.uploadsDir, uploadType);
        const filepath = path.join(dir, filename);
        await fs.writeFile(filepath, file.buffer);
        return `/uploads/${uploadType}/${filename}`;
    }
    async deleteFile(fileUrl) {
        try {
            const relativePath = fileUrl.replace('/uploads/', '');
            const filepath = path.join(this.uploadsDir, relativePath);
            await fs.unlink(filepath);
        }
        catch (error) {
        }
    }
    getMulterOptions() {
        return {
            limits: {
                fileSize: this.maxFileSize,
            },
            fileFilter: (req, file, callback) => {
                if (this.allowedMimeTypes.includes(file.mimetype)) {
                    callback(null, true);
                }
                else {
                    callback(new common_1.BadRequestException(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`), false);
                }
            },
        };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map