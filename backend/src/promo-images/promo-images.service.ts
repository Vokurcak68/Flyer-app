import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoImageDto, PromoImageFilterDto } from './dto';

@Injectable()
export class PromoImagesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePromoImageDto) {
    // Verify brand access if brandId is provided
    if (dto.brandId) {
      const hasAccess = await this.prisma.userBrand.findFirst({
        where: {
          userId,
          brandId: dto.brandId,
        },
      });

      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this brand');
      }
    }

    return this.prisma.promoImage.create({
      data: {
        supplierId: userId,
        name: dto.name,
        imageData: Buffer.from(dto.imageData, 'base64'),
        imageMimeType: dto.imageMimeType,
        defaultSize: dto.defaultSize,
        brandId: dto.brandId,
      },
      include: {
        brand: true,
      },
    });
  }

  async findAll(userId: string, role: string, filters: PromoImageFilterDto) {
    const where: any = {};

    // Role-based filtering
    if (role === 'supplier') {
      where.supplierId = userId;
    }

    // Apply filters
    if (filters.brandId) {
      where.brandId = filters.brandId;
    }

    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const promoImages = await this.prisma.promoImage.findMany({
      where,
      include: {
        brand: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove imageData from response (too large, use /image endpoint instead)
    return promoImages.map(({ imageData, imageMimeType, ...promo }) => promo);
  }

  async findOne(id: string) {
    const promoImage = await this.prisma.promoImage.findUnique({
      where: { id },
      include: {
        brand: true,
      },
    });

    if (!promoImage) {
      throw new NotFoundException(`Promo image with ID ${id} not found`);
    }

    return promoImage;
  }

  async remove(id: string, userId: string) {
    const promoImage = await this.findOne(id);

    if (promoImage.supplierId !== userId) {
      throw new ForbiddenException('You can only delete your own promo images');
    }

    return this.prisma.promoImage.delete({
      where: { id },
    });
  }

  async findBySizeType(sizeType: 'full' | 'half' | 'quarter' | 'eighth') {
    return this.prisma.promoImage.findMany({
      where: {},
      include: {
        brand: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
