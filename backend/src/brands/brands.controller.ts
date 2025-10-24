import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { BrandsService } from './brands.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateBrandDto, UpdateBrandDto } from './dto';

@Controller('brands')
export class BrandsController {
  constructor(private brandsService: BrandsService) {}
  //

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.brandsService.findAll();
  }

  @Get('my-brands')
  @UseGuards(JwtAuthGuard)
  findMyBrands(@Request() req: any) {
    return this.brandsService.findBySupplier(req.user.userId);
  }

  // Public endpoint - no auth required for images
  @Get(':id/logo')
  async getLogo(@Param('id') id: string, @Res() res: Response) {
    const brand = await this.brandsService.findOne(id);

    if (!brand.logoData || !brand.logoMimeType) {
      throw new NotFoundException('Brand logo not found');
    }

    res.set('Content-Type', brand.logoMimeType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(brand.logoData);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supplier')
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supplier')
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supplier')
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
