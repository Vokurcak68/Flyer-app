import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MssqlService } from '../common/mssql.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly mssqlService: MssqlService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    return this.productsService.create(createProductDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() filterDto: ProductFilterDto, @Request() req: any) {
    return this.productsService.findAll(
      filterDto,
      req.user.userId,
      req.user.role
    );
  }

  // Public endpoint - no auth required for images
  @Get(':id/image')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const imageData = await this.productsService.getProductImageData(id);

    if (!imageData.imageData || !imageData.imageMimeType) {
      throw new NotFoundException('Product image not found');
    }

    res.set('Content-Type', imageData.imageMimeType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(imageData.imageData);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ) {
    return this.productsService.update(id, updateProductDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.productsService.remove(id, req.user.userId);
  }

  // Icon management removed - icons are now managed via /icons endpoint
  // and assigned to products via iconIds array in create/update

  @Get('export/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async exportToCsv(@Request() req: any, @Res() res: Response) {
    const { zipBuffer, filename } = await this.productsService.exportProductsToZip(req.user.userId);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': zipBuffer.length,
    });

    res.send(zipBuffer);
  }

  @Post('import/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @UseInterceptors(FileInterceptor('file'))
  async importFromCsv(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.productsService.importProductsFromZip(file.buffer, req.user.userId);
  }

  @Get('check-duplicate-ean/:ean')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async checkDuplicateEan(@Param('ean') ean: string, @Request() req: any) {
    return this.productsService.findProductsByEan(ean, req.user.userId);
  }

  @Get(':ean/validate-ean')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async validateEAN(
    @Param('ean') ean: string,
    @Query('price') price?: string,
    @Query('originalPrice') originalPrice?: string,
  ) {
    const priceNum = price ? parseFloat(price) : undefined;
    const originalPriceNum = originalPrice ? parseFloat(originalPrice) : undefined;

    const result = await this.mssqlService.validateEAN(ean, priceNum, originalPriceNum);
    return {
      ean,
      found: result.found,
      pricesMatch: result.pricesMatch,
      erpPrice: result.erpPrice,
      erpOriginalPrice: result.erpOriginalPrice,
      erpProductName: result.erpProductName,
      erpBrand: result.erpBrand,
      erpCategoryCode: result.erpCategoryCode,
    };
  }
}
