import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    // Check if EAN code already exists
    await this.validateEanCodeUniqueness(createProductDto.eanCode);

    // Verify brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id: createProductDto.brandId },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${createProductDto.brandId} not found`);
    }

    // Verify user has access to this brand
    await this.validateUserBrandAccess(userId, createProductDto.brandId);

    // Validate icon IDs if provided
    if (createProductDto.iconIds && createProductDto.iconIds.length > 0) {
      await this.validateIconIds(createProductDto.iconIds);
    }

    // Create product with icons
    const { iconIds, imageData, imageMimeType, ...productData } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        supplierId: userId,
        imageData: Buffer.from(imageData, 'base64'),
        imageMimeType,
        icons: iconIds && iconIds.length > 0 ? {
          create: iconIds.map((iconId, index) => ({
            iconId,
            position: index,
          })),
        } : undefined,
      },
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.formatProductResponse(product);
  }

  async findAll(filterDto: ProductFilterDto, userId?: string, userRole?: string) {
    const {
      brandId,
      supplierId,
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (brandId) {
      where.brandId = brandId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      // Split search into words and create AND logic
      // Each word must be found in at least one field
      const searchWords = search.trim().split(/\s+/).filter(word => word.length > 0);

      console.log('🔍 Search query:', search);
      console.log('📝 Search words:', searchWords);

      if (searchWords.length > 0) {
        where.AND = searchWords.map(word => ({
          OR: [
            { name: { contains: word, mode: 'insensitive' } },
            { eanCode: { contains: word } },
            { brand: { name: { contains: word, mode: 'insensitive' } } },
            { category: { name: { contains: word, mode: 'insensitive' } } },
            { subcategory: { name: { contains: word, mode: 'insensitive' } } },
          ],
        }));

        console.log('🎯 Prisma where clause:', JSON.stringify(where, null, 2));
      }
    }

    // If user is a supplier, only show their products
    if (userRole === 'supplier' && userId) {
      where.supplierId = userId;
    }

    // Get total count
    const total = await this.prisma.product.count({ where });

    // Get products
    const products = await this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        category: true,
        subcategory: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      data: products.map(product => this.formatProductResponse(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.formatProductResponse(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    console.log('🔍 Update product DTO:', JSON.stringify(updateProductDto, null, 2));

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { brand: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Verify user owns this product (through brand access)
    await this.validateUserBrandAccess(userId, product.brandId);

    // Validate icon IDs if provided
    if (updateProductDto.iconIds && updateProductDto.iconIds.length > 0) {
      await this.validateIconIds(updateProductDto.iconIds);
    }

    // Note: brandId cannot be changed after creation (excluded from UpdateProductDto)

    // Prepare data object
    const { iconIds, imageData, imageMimeType, ...productData } = updateProductDto;
    const data: any = { ...productData };

    console.log('💾 Product data to update in DB:', JSON.stringify(data, null, 2));

    // Convert base64 image data to Buffer if provided
    if (imageData && imageMimeType) {
      data.imageData = Buffer.from(imageData, 'base64');
      data.imageMimeType = imageMimeType;
    }

    // Handle icon updates if provided
    if (iconIds !== undefined) {
      // Delete existing icons and create new ones
      data.icons = {
        deleteMany: {}, // Delete all existing icons
        create: iconIds.map((iconId, index) => ({
          iconId,
          position: index,
        })),
      };
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.formatProductResponse(updatedProduct);
  }

  async remove(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Verify user owns this product
    await this.validateUserBrandAccess(userId, product.brandId);

    // Soft delete
    const deletedProduct = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      include: {
        icons: {
          include: {
            icon: true,
          },
          orderBy: { position: 'asc' },
        },
        brand: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.formatProductResponse(deletedProduct);
  }

  // Icon management methods removed - icons are now managed through global icon library
  // Icons are assigned during product create/update via iconIds array

  async getProductImageData(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        imageData: true,
        imageMimeType: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  // Helper methods

  private async validateEanCodeUniqueness(eanCode: string) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { eanCode },
    });

    if (existingProduct) {
      throw new ConflictException(`Product with EAN code ${eanCode} already exists`);
    }
  }

  private async validateUserBrandAccess(userId: string, brandId: string) {
    const userBrand = await this.prisma.userBrand.findFirst({
      where: {
        userId,
        brandId,
      },
    });

    if (!userBrand) {
      throw new ForbiddenException('You do not have access to this brand');
    }
  }

  private async validateIconIds(iconIds: string[]) {
    if (iconIds.length > 4) {
      throw new BadRequestException('Maximum 4 icons allowed per product');
    }

    // Check that all icon IDs exist in global icon library
    const icons = await this.prisma.icon.findMany({
      where: {
        id: {
          in: iconIds,
        },
      },
    });

    if (icons.length !== iconIds.length) {
      throw new BadRequestException('One or more icon IDs are invalid');
    }
  }

  private formatProductResponse(product: any) {
    const baseUrl = process.env.API_URL || 'http://localhost:4000';

    return {
      id: product.id,
      eanCode: product.eanCode,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString()) : null,
      isActive: product.isActive,
      brandId: product.brandId,
      brandName: product.brand?.name,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      subcategoryId: product.subcategoryId,
      subcategoryName: product.subcategory?.name,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
      } : null,
      supplier: product.supplier ? {
        id: product.supplier.id,
        email: product.supplier.email,
        firstName: product.supplier.firstName,
        lastName: product.supplier.lastName,
      } : null,
      icons: product.icons ? product.icons.map(pi => ({
        id: pi.icon.id,
        name: pi.icon.name,
        imageUrl: `${baseUrl}/api/icons/${pi.icon.id}/image`,
        isEnergyClass: pi.icon.isEnergyClass,
        position: pi.position,
      })) : [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
