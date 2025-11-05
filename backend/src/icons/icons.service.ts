import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIconDto } from './dto/create-icon.dto';
import { UpdateIconDto } from './dto/update-icon.dto';

@Injectable()
export class IconsService {
  constructor(private prisma: PrismaService) {}

  async create(createIconDto: CreateIconDto) {
    const { imageData, categoryIds, brandIds, ...rest } = createIconDto;
    const imageBuffer = Buffer.from(imageData, 'base64');

    return this.prisma.icon.create({
      data: {
        ...rest,
        imageData: imageBuffer,
        categories: categoryIds ? {
          create: categoryIds.map(categoryId => ({ categoryId })),
        } : undefined,
        brands: brandIds ? {
          create: brandIds.map(brandId => ({ brandId })),
        } : undefined,
      },
      include: {
        categories: {
          include: { category: true },
        },
        brands: {
          include: { brand: true },
        },
      },
    });
  }

  async findAll() {
    const icons = await this.prisma.icon.findMany({
      orderBy: { name: 'asc' },
      include: {
        categories: {
          include: { category: true },
        },
        brands: {
          include: { brand: true },
        },
        _count: {
          select: {
            productIcons: true,
          },
        },
      },
    });

    const baseUrl = process.env.API_URL || 'http://localhost:4000';

    return icons.map(icon => ({
      ...icon,
      imageData: undefined, // Don't send binary data in list
      imageUrl: `${baseUrl}/api/icons/${icon.id}/image`,
    }));
  }

  async findOne(id: string) {
    const icon = await this.prisma.icon.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
        brands: {
          include: { brand: true },
        },
      },
    });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${id} not found`);
    }

    const baseUrl = process.env.API_URL || 'http://localhost:4000';

    return {
      ...icon,
      imageData: undefined,
      imageUrl: `${baseUrl}/api/icons/${id}/image`,
    };
  }

  async getImage(id: string): Promise<{ data: Buffer; mimeType: string }> {
    const icon = await this.prisma.icon.findUnique({
      where: { id },
      select: { imageData: true, imageMimeType: true },
    });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${id} not found`);
    }

    return {
      data: icon.imageData,
      mimeType: icon.imageMimeType,
    };
  }

  async update(id: string, updateIconDto: UpdateIconDto) {
    const icon = await this.prisma.icon.findUnique({ where: { id } });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${id} not found`);
    }

    const { imageData, categoryIds, brandIds, ...rest } = updateIconDto;
    const data: any = { ...rest };

    if (imageData) {
      data.imageData = Buffer.from(imageData, 'base64');
    }

    // Update categories if provided
    if (categoryIds !== undefined) {
      // Delete existing categories and create new ones
      await this.prisma.iconCategory.deleteMany({
        where: { iconId: id },
      });

      if (categoryIds.length > 0) {
        await this.prisma.iconCategory.createMany({
          data: categoryIds.map(categoryId => ({ iconId: id, categoryId })),
        });
      }
    }

    // Update brands if provided
    if (brandIds !== undefined) {
      // Delete existing brands and create new ones
      await this.prisma.iconBrand.deleteMany({
        where: { iconId: id },
      });

      if (brandIds.length > 0) {
        await this.prisma.iconBrand.createMany({
          data: brandIds.map(brandId => ({ iconId: id, brandId })),
        });
      }
    }

    return this.prisma.icon.update({
      where: { id },
      data,
      include: {
        categories: {
          include: { category: true },
        },
        brands: {
          include: { brand: true },
        },
      },
    });
  }

  async remove(id: string) {
    const icon = await this.prisma.icon.findUnique({ where: { id } });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${id} not found`);
    }

    return this.prisma.icon.delete({ where: { id } });
  }
}
