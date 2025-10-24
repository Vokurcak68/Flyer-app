import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService, UploadType } from './upload.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.saveFile(file, UploadType.PRODUCT);
    return {
      success: true,
      url,
      message: 'Product image uploaded successfully',
    };
  }

  @Post('promo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPromoImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.saveFile(file, UploadType.PROMO);
    return {
      success: true,
      url,
      message: 'Promo image uploaded successfully',
    };
  }

  @Post('icon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadIconImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.saveFile(file, UploadType.ICON);
    return {
      success: true,
      url,
      message: 'Icon uploaded successfully',
    };
  }

  @Post('brand')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBrandLogo(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.saveFile(file, UploadType.BRAND);
    return {
      success: true,
      url,
      message: 'Brand logo uploaded successfully',
    };
  }
}
