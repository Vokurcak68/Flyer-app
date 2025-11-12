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
  Res,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { FlyersService } from './flyers.service';
import { PdfService } from './pdf.service';
import {
  CreateFlyerDto,
  UpdateFlyerDto,
  AddPageDto,
  AddProductToPageDto,
  FlyerFilterDto,
  UpdateProductPositionDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MssqlService } from '../common/mssql.service';

@Controller('flyers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FlyersController {
  constructor(
    private readonly flyersService: FlyersService,
    private readonly pdfService: PdfService,
    private readonly mssqlService: MssqlService,
  ) {}

  // ========================================
  // FLYER MANAGEMENT
  // ========================================

  @Get('actions')
  @Roles('supplier', 'end_user', 'approver', 'pre_approver')
  async getActions(@Request() req) {
    return this.flyersService.getFilteredActions(req.user.userId, req.user.role);
  }

  @Post()
  @Roles('supplier', 'end_user')
  create(@Body() createFlyerDto: CreateFlyerDto, @Request() req) {
    console.log('🔍 Create flyer - req.user:', req.user);
    console.log('🔍 Create flyer - userId:', req.user.userId);
    return this.flyersService.create(createFlyerDto, req.user.userId);
  }

  @Get()
  findAll(@Query() filterDto: FlyerFilterDto, @Request() req) {
    return this.flyersService.findAll(filterDto, req.user.userId, req.user.role);
  }

  @Get('active')
  @Roles('end_user', 'approver', 'pre_approver')
  async getActiveFlyers(@Request() req) {
    // Get active flyers with full data (pages, slots, products)
    const activeFlyers = await this.flyersService.getActiveFlyers(
      req.user.userId,
      req.user.role,
    );
    return activeFlyers;
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.flyersService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @Roles('supplier', 'end_user')
  update(
    @Param('id') id: string,
    @Body() updateFlyerDto: UpdateFlyerDto,
    @Request() req,
  ) {
    return this.flyersService.update(id, updateFlyerDto, req.user.userId, req.user.role);
  }

  @Delete(':id')
  @Roles('supplier', 'end_user')
  remove(@Param('id') id: string, @Request() req) {
    return this.flyersService.remove(id, req.user.userId, req.user.role);
  }

  // ========================================
  // PAGE MANAGEMENT
  // ========================================

  @Post(':id/pages')
  @Roles('supplier')
  addPage(
    @Param('id') flyerId: string,
    @Body() addPageDto: AddPageDto,
    @Request() req,
  ) {
    return this.flyersService.addPage(flyerId, addPageDto, req.user.userId);
  }

  @Delete('pages/:pageId')
  @Roles('supplier')
  removePage(@Param('pageId') pageId: string, @Request() req) {
    return this.flyersService.removePage(pageId, req.user.userId);
  }

  // ========================================
  // PRODUCT MANAGEMENT
  // ========================================

  @Post('pages/:pageId/products')
  @Roles('supplier')
  addProductToPage(
    @Param('pageId') pageId: string,
    @Body() addProductDto: AddProductToPageDto,
    @Request() req,
  ) {
    return this.flyersService.addProductToPage(pageId, addProductDto, req.user.userId);
  }

  @Delete('pages/products/:productId')
  @Roles('supplier')
  removeProductFromPage(@Param('productId') productId: string, @Request() req) {
    return this.flyersService.removeProductFromPage(productId, req.user.userId);
  }

  @Patch('pages/products/:id/position')
  @Roles('supplier')
  updateProductPosition(
    @Param('id') productId: string,
    @Body() updatePositionDto: UpdateProductPositionDto,
    @Request() req,
  ) {
    return this.flyersService.updateProductPosition(
      productId,
      updatePositionDto,
      req.user.userId,
    );
  }

  // ========================================
  // WORKFLOW & ACTIONS
  // ========================================

  @Post(':id/validate')
  @Roles('supplier', 'end_user')
  async validateFlyer(@Param('id') flyerId: string, @Request() req) {
    // Get flyer with all products
    const flyer = await this.flyersService.findOne(
      flyerId,
      req.user.userId,
      req.user.role,
    );

    // Extract all unique products from flyer
    const productsMap = new Map();
    for (const page of flyer.pages) {
      for (const slot of page.slots) {
        if (slot.product && !productsMap.has(slot.product.id)) {
          productsMap.set(slot.product.id, {
            id: slot.product.id,
            name: slot.product.name,
            eanCode: slot.product.eanCode,
            price: parseFloat(slot.product.price.toString()),
            originalPrice: slot.product.originalPrice
              ? parseFloat(slot.product.originalPrice.toString())
              : undefined,
          });
        }
      }
    }

    const products = Array.from(productsMap.values());

    // Validate all products with actionId filter
    const validationErrors = await this.mssqlService.validateFlyerProducts(
      products,
      flyer.actionId,
    );

    return {
      valid: validationErrors.length === 0,
      errors: validationErrors,
      productsChecked: products.length,
      errorsFound: validationErrors.length,
    };
  }

  @Post(':id/submit-for-verification')
  @Roles('supplier')
  submitForVerification(@Param('id') flyerId: string, @Request() req) {
    return this.flyersService.submitForVerification(flyerId, req.user.userId);
  }

  @Get(':id/preview')
  getPreview(@Param('id') flyerId: string, @Request() req) {
    return this.flyersService.getPreview(flyerId, req.user.userId, req.user.role);
  }

  @Post(':id/auto-save')
  @Roles('supplier')
  autoSave(@Param('id') flyerId: string, @Request() req) {
    return this.flyersService.autoSave(flyerId, req.user.userId);
  }

  @Post(':id/expire')
  @Roles('supplier', 'admin')
  expireFlyer(@Param('id') flyerId: string, @Request() req) {
    return this.flyersService.expireFlyer(flyerId, req.user.userId, req.user.role);
  }

  // ========================================
  // PDF GENERATION & DOWNLOAD
  // ========================================

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response, @Request() req) {
    // Use findOneForPdf which has less restrictive permissions for active flyers
    const flyer = await this.flyersService.findOneForPdf(id, req.user.userId, req.user.role);

    if (!flyer.pdfData || !flyer.pdfMimeType) {
      throw new NotFoundException('Flyer PDF not found');
    }

    // Return the stored PDF with brand colors - shown to everyone
    res.set('Content-Type', flyer.pdfMimeType);
    res.set('Content-Disposition', `attachment; filename="${flyer.name}.pdf"`);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(flyer.pdfData);
  }

  @Post(':id/generate-pdf')
  @Roles('supplier', 'pre_approver', 'approver', 'admin')
  async generatePDF(@Param('id') flyerId: string, @Request() req) {
    // Get full flyer data with images for PDF generation
    const flyer = await this.flyersService.findOneForPdf(
      flyerId,
      req.user.userId,
      req.user.role,
    );

    // Generate PDF (returns base64 string)
    const pdfData = await this.pdfService.generateFlyerPDF(flyer, req.user.role);

    // Use special method that doesn't check permissions (approvers can update PDF)
    await this.flyersService.updatePdfData(flyerId, pdfData, 'application/pdf');

    return {
      success: true,
      message: 'PDF generated successfully',
    };
  }
}
