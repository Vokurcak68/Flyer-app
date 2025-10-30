import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PromoImagesService } from './promo-images.service';
import { CreatePromoImageDto, PromoImageFilterDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('promo-images')
export class PromoImagesController {
  constructor(private promoImagesService: PromoImagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier', 'admin')
  create(@Request() req: any, @Body() dto: CreatePromoImageDto) {
    return this.promoImagesService.create(req.user.userId, req.user.role, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Request() req: any, @Query() filters: PromoImageFilterDto) {
    return this.promoImagesService.findAll(req.user.userId, req.user.role, filters);
  }

  @Get('size/:sizeType')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findBySizeType(@Param('sizeType') sizeType: 'full' | 'half' | 'quarter' | 'eighth') {
    return this.promoImagesService.findBySizeType(sizeType as any);
  }

  @Get(':id/image')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const promoImage = await this.promoImagesService.findOne(id);

    if (!promoImage.imageData || !promoImage.imageMimeType) {
      throw new NotFoundException('Promo image not found');
    }

    res.set('Content-Type', promoImage.imageMimeType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(promoImage.imageData);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.promoImagesService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.promoImagesService.remove(id, req.user.userId);
  }
}
