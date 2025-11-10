import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCategoryDto, UpdateCategoryDto, CreateSubcategoryDto, UpdateSubcategoryDto } from './dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get(':id/subcategories')
  @UseGuards(JwtAuthGuard)
  findSubcategories(@Param('id') id: string) {
    return this.categoriesService.findSubcategories(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // Subcategory endpoints
  @Post(':id/subcategories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createSubcategory(@Param('id') categoryId: string, @Body() dto: CreateSubcategoryDto) {
    return this.categoriesService.createSubcategory(categoryId, dto);
  }

  @Put('subcategories/:subcategoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateSubcategory(@Param('subcategoryId') subcategoryId: string, @Body() dto: UpdateSubcategoryDto) {
    return this.categoriesService.updateSubcategory(subcategoryId, dto);
  }

  @Delete('subcategories/:subcategoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  removeSubcategory(@Param('subcategoryId') subcategoryId: string) {
    return this.categoriesService.removeSubcategory(subcategoryId);
  }
}
