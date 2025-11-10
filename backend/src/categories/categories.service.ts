import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateSubcategoryDto, UpdateSubcategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
            subcategories: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            products: true,
            subcategories: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findSubcategories(categoryId: string) {
    return this.prisma.subcategory.findMany({
      where: {
        categoryId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(dto: CreateCategoryDto) {
    // Check if category with this name already exists
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Category with name "${dto.name}" already exists`);
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        mssqlCode: dto.mssqlCode,
        requiresInstallationType: dto.requiresInstallationType ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    // Check if category exists
    await this.findOne(id);

    // If name is being updated, check if new name already exists
    if (dto.name) {
      const existing = await this.prisma.category.findUnique({
        where: { name: dto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Category with name "${dto.name}" already exists`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.mssqlCode !== undefined && { mssqlCode: dto.mssqlCode }),
        ...(dto.requiresInstallationType !== undefined && { requiresInstallationType: dto.requiresInstallationType }),
      },
    });
  }

  async remove(id: string) {
    // Check if category exists
    const category = await this.findOne(id);

    // Check if category has products
    if (category._count.products > 0) {
      throw new ConflictException(
        `Cannot delete category "${category.name}" because it has ${category._count.products} associated products`
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  // Subcategory management
  async createSubcategory(categoryId: string, dto: CreateSubcategoryDto) {
    // Verify category exists
    await this.findOne(categoryId);

    return this.prisma.subcategory.create({
      data: {
        name: dto.name,
        categoryId,
      },
    });
  }

  async updateSubcategory(subcategoryId: string, dto: UpdateSubcategoryDto) {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id: subcategoryId },
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${subcategoryId} not found`);
    }

    return this.prisma.subcategory.update({
      where: { id: subcategoryId },
      data: {
        ...(dto.name && { name: dto.name }),
      },
    });
  }

  async removeSubcategory(subcategoryId: string) {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id: subcategoryId },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${subcategoryId} not found`);
    }

    // Check if subcategory has products
    if (subcategory._count.products > 0) {
      throw new ConflictException(
        `Cannot delete subcategory "${subcategory.name}" because it has ${subcategory._count.products} associated products`
      );
    }

    return this.prisma.subcategory.delete({
      where: { id: subcategoryId },
    });
  }
}
