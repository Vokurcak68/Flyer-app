import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

export enum UploadType {
  PRODUCT = 'products',
  PROMO = 'promo-images',
  ICON = 'icons',
  BRAND = 'brands',
}

@Injectable()
export class UploadService {
  private readonly uploadsDir: string;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(private configService: ConfigService) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories() {
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
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }
  }

  /**
   * Save uploaded file
   */
  async saveFile(
    file: Express.Multer.File,
    uploadType: UploadType,
  ): Promise<string> {
    this.validateFile(file);

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    const dir = path.join(this.uploadsDir, uploadType);
    const filepath = path.join(dir, filename);

    // Save file
    await fs.writeFile(filepath, file.buffer);

    // Return URL
    return `/uploads/${uploadType}/${filename}`;
  }

  /**
   * Delete file
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const relativePath = fileUrl.replace('/uploads/', '');
      const filepath = path.join(this.uploadsDir, relativePath);

      await fs.unlink(filepath);
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  /**
   * Get multer configuration for file upload
   */
  getMulterOptions() {
    return {
      limits: {
        fileSize: this.maxFileSize,
      },
      fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
            ),
            false,
          );
        }
      },
    };
  }
}
