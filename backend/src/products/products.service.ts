import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto, AddIconDto } from './dto';
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

    // Validate icons if provided
    if (createProductDto.icons && createProductDto.icons.length > 0) {
      this.validateIcons(createProductDto.icons);
    }

    // Create product with icons
    const { icons, imageData, imageMimeType, ...productData } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        supplierId: userId,
        imageData: Buffer.from(imageData, 'base64'),
        imageMimeType,
        icons: icons ? {
          create: icons.map(icon => ({
            iconType: icon.iconType,
            iconData: Buffer.from(icon.iconData, 'base64'),
            iconMimeType: icon.iconMimeType,
            position: icon.position,
          })),
        } : undefined,
      },
      include: {
        icons: {
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
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { eanCode: { contains: search } },
      ];
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
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { brand: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Verify user owns this product (through brand access)
    await this.validateUserBrandAccess(userId, product.brandId);

    // Note: brandId cannot be changed after creation (excluded from UpdateProductDto)

    // Prepare data object
    const data: any = { ...updateProductDto };

    // Convert base64 image data to Buffer if provided
    if (updateProductDto.imageData && updateProductDto.imageMimeType) {
      data.imageData = Buffer.from(updateProductDto.imageData, 'base64');
      data.imageMimeType = updateProductDto.imageMimeType;
    } else {
      // Remove imageData and imageMimeType from update if not provided
      delete data.imageData;
      delete data.imageMimeType;
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        icons: {
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

  async addIcon(productId: string, addIconDto: AddIconDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        icons: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Verify user owns this product
    await this.validateUserBrandAccess(userId, product.brandId);

    // Check if already has 4 icons
    if (product.icons.length >= 4) {
      throw new BadRequestException('Product already has maximum of 4 icons');
    }

    // Check if position is already taken
    const positionTaken = product.icons.some(icon => icon.position === addIconDto.position);
    if (positionTaken) {
      throw new ConflictException(`Icon position ${addIconDto.position} is already taken`);
    }

    const icon = await this.prisma.productIcon.create({
      data: {
        productId,
        iconType: addIconDto.iconType,
        iconData: addIconDto.iconData ? Buffer.from(addIconDto.iconData, 'base64') : Buffer.alloc(0),
        iconMimeType: addIconDto.iconMimeType || 'image/png',
        position: addIconDto.position,
      },
    });

    return icon;
  }

  async findIcon(iconId: string) {
    const icon = await this.prisma.productIcon.findUnique({
      where: { id: iconId },
    });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${iconId} not found`);
    }

    return icon;
  }

  async removeIcon(iconId: string, userId: string) {
    const icon = await this.prisma.productIcon.findUnique({
      where: { id: iconId },
      include: {
        product: true,
      },
    });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${iconId} not found`);
    }

    // Verify user owns the product
    await this.validateUserBrandAccess(userId, icon.product.brandId);

    await this.prisma.productIcon.delete({
      where: { id: iconId },
    });

    return { message: 'Icon removed successfully' };
  }

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

  private validateIcons(icons: any[]) {
    if (icons.length > 4) {
      throw new BadRequestException('Maximum 4 icons allowed per product');
    }

    // Check for duplicate positions
    const positions = icons.map(icon => icon.position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      throw new BadRequestException('Icon positions must be unique');
    }

    // Validate icon types
    const validTypes = ['energy_class', 'feature'];
    for (const icon of icons) {
      if (!validTypes.includes(icon.iconType)) {
        throw new BadRequestException(`Invalid icon type: ${icon.iconType}`);
      }
    }
  }

  private formatProductResponse(product: any) {
    return {
      id: product.id,
      eanCode: product.eanCode,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString()) : null,
      isActive: product.isActive,
      brandId: product.brandId,
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
      icons: product.icons || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
