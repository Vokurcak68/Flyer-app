import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { products: true, users: true },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async findBySupplier(userId: string) {
    const userBrands = await this.prisma.userBrand.findMany({
      where: { userId },
      include: {
        brand: {
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
      },
    });

    return userBrands.map((ub) => ub.brand);
  }

  async create(dto: CreateBrandDto) {
    console.log('🔵 Creating brand:', {
      name: dto.name,
      hasLogoData: !!dto.logoData,
      logoMimeType: dto.logoMimeType,
      logoDataLength: dto.logoData?.length,
      color: dto.color
    });

    const data: any = {
      name: dto.name,
    };

    // If logo data is provided (base64), convert to Buffer
    if (dto.logoData && dto.logoMimeType) {
      data.logoData = Buffer.from(dto.logoData, 'base64');
      data.logoMimeType = dto.logoMimeType;
      console.log('✅ Logo data converted to Buffer, size:', data.logoData.length, 'bytes');
    }

    // Add color if provided
    if (dto.color) {
      data.color = dto.color;
    }

    const result = await this.prisma.brand.create({
      data,
    });

    console.log('✅ Brand created with ID:', result.id);
    return result;
  }

  async update(id: string, dto: UpdateBrandDto) {
    console.log('🔵 Updating brand:', id, {
      name: dto.name,
      hasLogoData: !!dto.logoData,
      logoMimeType: dto.logoMimeType,
      logoDataLength: dto.logoData?.length,
      color: dto.color
    });

    const brand = await this.findOne(id);

    const data: any = {};

    if (dto.name) {
      data.name = dto.name;
    }

    // If logo data is provided (base64), convert to Buffer
    if (dto.logoData && dto.logoMimeType) {
      data.logoData = Buffer.from(dto.logoData, 'base64');
      data.logoMimeType = dto.logoMimeType;
      console.log('✅ Logo data converted to Buffer, size:', data.logoData.length, 'bytes');
    }

    // Add color if provided
    if (dto.color !== undefined) {
      data.color = dto.color;
    }

    const result = await this.prisma.brand.update({
      where: { id },
      data,
    });

    console.log('✅ Brand updated with ID:', result.id);
    return result;
  }

  async remove(id: string) {
    const brand = await this.findOne(id);

    return this.prisma.brand.delete({
      where: { id },
    });
  }
}
