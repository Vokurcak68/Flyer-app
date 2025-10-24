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
} from '@nestjs/common';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto, AddIconDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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

  // Public endpoint - no auth required for images
  @Get('icons/:iconId/image')
  async getIconImage(@Param('iconId') iconId: string, @Res() res: Response) {
    const icon = await this.productsService.findIcon(iconId);

    if (!icon.iconData || !icon.iconMimeType) {
      throw new NotFoundException('Icon image not found');
    }

    res.set('Content-Type', icon.iconMimeType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(icon.iconData);
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

  @Post(':id/icons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @HttpCode(HttpStatus.CREATED)
  async addIcon(
    @Param('id') id: string,
    @Body() addIconDto: AddIconDto,
    @Request() req: any,
  ) {
    return this.productsService.addIcon(id, addIconDto, req.user.userId);
  }

  @Delete('icons/:iconId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @HttpCode(HttpStatus.OK)
  async removeIcon(@Param('iconId') iconId: string, @Request() req: any) {
    return this.productsService.removeIcon(iconId, req.user.userId);
  }
}
