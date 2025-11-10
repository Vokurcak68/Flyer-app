import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { PdfService } from './pdf.service';
import {
  CreateFlyerDto,
  UpdateFlyerDto,
  AddPageDto,
  AddProductToPageDto,
  AddProductToSlotDto,
  AddPromoToSlotDto,
  PromoSlotSize,
  FlyerFilterDto,
  UpdateProductPositionDto,
} from './dto';
import { FlyerStatus, UserRole, FlyerActionType, SlotType } from '@prisma/client';
import { MssqlService } from '../common/mssql.service';
import { emailService } from '../services/emailService';

@Injectable()
export class FlyersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ApprovalsService))
    private approvalsService: ApprovalsService,
    private pdfService: PdfService,
    private mssqlService: MssqlService,
  ) {}

  // ========================================
  // CREATE & UPDATE FLYER METADATA
  // ========================================

  async create(createFlyerDto: CreateFlyerDto, userId: string) {
    const flyer = await this.prisma.flyer.create({
      data: {
        name: createFlyerDto.name,
        actionId: createFlyerDto.actionId,
        actionName: createFlyerDto.actionName,
        validFrom: createFlyerDto.validFrom
          ? new Date(createFlyerDto.validFrom)
          : null,
        validTo: createFlyerDto.validTo ? new Date(createFlyerDto.validTo) : null,
        supplierId: userId,
        status: FlyerStatus.draft,
        isDraft: true,
      },
      include: {
        pages: {
          include: {
            slots: {
              include: {
                product: {
                  include: {
                    brand: true,
                    icons: {
                      include: {
                        icon: true,
                      },
                      orderBy: {
                        position: 'asc',
                      },
                    },
                  },
                },
                promoImage: true,
              },
              orderBy: {
                slotPosition: 'asc',
              },
            },
          },
          orderBy: {
            pageNumber: 'asc',
          },
        },
      },
    });

    // Track creation in edit history
    await this.createEditHistory(flyer.id, userId, FlyerActionType.update_info, {
      action: 'created',
      name: createFlyerDto.name,
    });

    return this.transformFlyerForFrontend(flyer);
  }

  async findAll(filterDto: FlyerFilterDto, userId: string, userRole: UserRole) {
    // First, update all expired flyers
    await this.updateExpiredFlyers();

    const where: any = {};

    // Role-based filtering
    if (userRole === UserRole.supplier) {
      // Suppliers see flyers from suppliers who share at least one brand
      // Get user's assigned brands
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          brands: {
            include: {
              brand: {
                include: {
                  users: true, // Get all users assigned to these brands
                },
              },
            },
          },
        },
      });

      if (user && user.brands.length > 0) {
        // Get all user IDs that share at least one brand with this supplier
        const sharedBrandUserIds = new Set<string>();
        user.brands.forEach(userBrand => {
          userBrand.brand.users.forEach(brandUser => {
            sharedBrandUserIds.add(brandUser.userId);
          });
        });

        // Filter flyers by suppliers who share brands
        where.supplierId = {
          in: Array.from(sharedBrandUserIds),
        };
      } else {
        // If supplier has no brands assigned, they see only their own flyers
        where.supplierId = userId;
      }
    } else if (userRole === UserRole.approver) {
      // Approvers see flyers pending approval
      where.status = {
        in: [FlyerStatus.pending_approval, FlyerStatus.approved],
      };
    } else if (userRole === UserRole.end_user) {
      // End users see only their own flyers (flyers they created)
      where.supplierId = userId;
    }

    // Apply additional filters
    if (filterDto.status) {
      where.status = filterDto.status;
    }

    if (filterDto.isDraft !== undefined) {
      where.isDraft = filterDto.isDraft;
    }

    if (filterDto.validFrom) {
      where.validFrom = {
        gte: new Date(filterDto.validFrom),
      };
    }

    if (filterDto.validTo) {
      where.validTo = {
        lte: new Date(filterDto.validTo),
      };
    }

    // Get total count
    const total = await this.prisma.flyer.count({ where });

    // Get flyers
    const flyers = await this.prisma.flyer.findMany({
      where,
      select: {
        id: true,
        name: true,
        actionId: true,
        actionName: true,
        validFrom: true,
        validTo: true,
        status: true,
        supplierId: true,
        completionPercentage: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        rejectionReason: true,
        lastEditedAt: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pages: {
          select: {
            id: true,
            pageNumber: true,
          },
          orderBy: {
            pageNumber: 'asc',
          },
        },
        approvals: {
          select: {
            id: true,
            status: true,
            comment: true,
            decidedAt: true,
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            pages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform flyers for frontend
    const transformedFlyers = flyers.map(flyer => this.transformFlyerForFrontend(flyer));

    // Return paginated response
    return {
      data: transformedFlyers,
      meta: {
        total,
        page: 1,
        limit: total,
        totalPages: 1,
      },
    };
  }

  async getFilteredActions(userId: string, userRole: UserRole) {
    // Get all actions from MSSQL
    const allActions = await this.mssqlService.getActions();

    // For suppliers, filter actions by their assigned brands
    if (userRole === UserRole.supplier) {
      // Get user's brands
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          brands: {
            include: {
              brand: true,
            },
          },
        },
      });

      if (!user || user.brands.length === 0) {
        // If supplier has no brands, return empty array
        return [];
      }

      // Get brand names
      const brandNames = user.brands.map(ub => ub.brand.name.toLowerCase());

      // Filter actions - action name must contain at least one of the brand names
      const filteredActions = allActions.filter(action => {
        const actionNameLower = action.name.toLowerCase();
        return brandNames.some(brandName => actionNameLower.includes(brandName));
      });

      return filteredActions;
    }

    // For other roles, return all actions
    return allActions;
  }

  async getActiveFlyers(userId: string, userRole: UserRole) {
    // First, update all expired flyers
    await this.updateExpiredFlyers();

    // Get all active flyers with optimized data for end users
    const flyers = await this.prisma.flyer.findMany({
      where: {
        status: FlyerStatus.active,
      },
      include: {
        pages: {
          include: {
            slots: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    eanCode: true,
                    price: true,
                    originalPrice: true,
                    brandId: true,
                    brand: true,
                    categoryId: true,
                    subcategoryId: true,
                    installationType: true,
                    icons: {
                      select: {
                        icon: {
                          select: {
                            id: true,
                            name: true,
                            isEnergyClass: true,
                          },
                        },
                        position: true,
                      },
                      orderBy: {
                        position: 'asc',
                      },
                    },
                  },
                },
                promoImage: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                slotPosition: 'asc',
              },
            },
            footerPromoImage: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            pageNumber: 'asc',
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Transform flyers for frontend
    return flyers.map(flyer => this.transformFlyerForFrontend(flyer));
  }

  // Separate method for PDF generation that includes image binary data
  async findOneForPdf(id: string, userId: string, userRole: UserRole) {
    const flyer = await this.prisma.flyer.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pages: {
          include: {
            slots: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    eanCode: true,
                    price: true,
                    originalPrice: true,
                    imageData: true, // INCLUDED for PDF generation
                    imageMimeType: true, // INCLUDED for PDF generation
                    brandId: true,
                    categoryId: true,
                    subcategoryId: true,
                    installationType: true,
                    supplierId: true,
                    createdAt: true,
                    updatedAt: true,
                    brand: true,
                    icons: {
                      select: {
                        icon: {
                          select: {
                            id: true,
                            name: true,
                            isEnergyClass: true,
                            imageData: true, // INCLUDED for PDF generation
                            imageMimeType: true, // INCLUDED for PDF generation
                          },
                        },
                        position: true,
                      },
                      orderBy: {
                        position: 'asc',
                      },
                    },
                  },
                },
                promoImage: {
                  select: {
                    id: true,
                    name: true,
                    imageData: true, // INCLUDED for PDF generation
                    imageMimeType: true, // INCLUDED for PDF generation
                    supplierId: true,
                    createdAt: true,
                  },
                },
              },
              orderBy: {
                slotPosition: 'asc',
              },
            },
            footerPromoImage: {
              select: {
                id: true,
                name: true,
                imageData: true, // INCLUDED for PDF generation
                imageMimeType: true, // INCLUDED for PDF generation
                fillDate: true, // INCLUDED for PDF generation
                supplierId: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            pageNumber: 'asc',
          },
        },
      },
    });

    if (!flyer) {
      throw new NotFoundException(`Flyer with ID ${id} not found`);
    }

    // Verify permissions
    if (userRole === UserRole.supplier && flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have access to this flyer');
    }

    if (userRole === UserRole.end_user) {
      // End users can access their own flyers (any status) or active flyers from others
      const isOwnFlyer = flyer.supplierId === userId;
      const isActiveFlyer = flyer.status === FlyerStatus.approved || flyer.status === FlyerStatus.active;

      console.log('🔍 End user PDF access check:', {
        flyerId: flyer.id,
        flyerStatus: flyer.status,
        userId,
        supplierId: flyer.supplierId,
        isOwnFlyer,
        isActiveFlyer,
      });

      if (!isOwnFlyer && !isActiveFlyer) {
        throw new ForbiddenException('You do not have access to this flyer');
      }
    }

    return this.transformFlyerForFrontend(flyer);
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    // First, update all expired flyers
    await this.updateExpiredFlyers();

    const flyer = await this.prisma.flyer.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pages: {
          include: {
            slots: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    eanCode: true,
                    price: true,
                    originalPrice: true,
                    // imageData: excluded for performance - frontend uses URL
                    // imageMimeType: excluded for performance
                    brandId: true,
                    supplierId: true,
                    createdAt: true,
                    updatedAt: true,
                    brand: true,
                    icons: {
                      select: {
                        icon: {
                          select: {
                            id: true,
                            name: true,
                            isEnergyClass: true,
                            // imageData: excluded for performance - frontend uses URL
                            // imageMimeType: excluded for performance
                          },
                        },
                        position: true,
                      },
                      orderBy: {
                        position: 'asc',
                      },
                    },
                  },
                },
                promoImage: {
                  select: {
                    id: true,
                    name: true,
                    // imageData: excluded for performance - frontend uses URL
                    // imageMimeType: excluded for performance
                    supplierId: true,
                    createdAt: true,
                  },
                },
              },
              orderBy: {
                slotPosition: 'asc',
              },
            },
            footerPromoImage: {
              select: {
                id: true,
                name: true,
                // imageData: excluded for performance - frontend uses URL
                // imageMimeType: excluded for performance
                fillDate: true,
                supplierId: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            pageNumber: 'asc',
          },
        },
        verificationLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        approvalWorkflow: true,
      },
    });

    if (!flyer) {
      throw new NotFoundException('Flyer not found');
    }

    // Check access permissions
    await this.checkAccessPermission(flyer, userId, userRole);

    // Transform pages to frontend format
    return this.transformFlyerForFrontend(flyer);
  }

  async update(
    id: string,
    updateFlyerDto: UpdateFlyerDto,
    userId: string,
    userRole: UserRole,
  ) {
    const flyer = await this.prisma.flyer.findUnique({ where: { id } });

    if (!flyer) {
      throw new NotFoundException('Flyer not found');
    }

    // Only suppliers and end_users can update their own flyers
    if ((userRole !== UserRole.supplier && userRole !== UserRole.end_user) || flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to update this flyer');
    }

    // Only draft flyers can be updated
    if (flyer.status !== FlyerStatus.draft) {
      throw new BadRequestException('Only draft flyers can be updated');
    }

    // Handle pages if provided (must be done before calculating validTo)
    if (updateFlyerDto.pages) {
      await this.syncPages(id, updateFlyerDto.pages, userId, userRole);
    }

    // For end users, automatically calculate validTo from source flyers
    let calculatedValidTo = updateFlyerDto.validTo;
    if (userRole === UserRole.end_user) {
      // Fetch all product IDs from the current flyer
      const flyerWithProducts = await this.prisma.flyer.findUnique({
        where: { id },
        include: {
          pages: {
            include: {
              slots: {
                select: {
                  productId: true,
                },
              },
            },
          },
        },
      });

      // Collect all unique product IDs
      const productIds: string[] = [];
      flyerWithProducts?.pages.forEach(page => {
        page.slots.forEach(slot => {
          if (slot.productId && !productIds.includes(slot.productId)) {
            productIds.push(slot.productId);
          }
        });
      });

      // Find all ACTIVE flyers that contain these products and have validTo set
      if (productIds.length > 0) {
        const sourceFlyersWithDates = await this.prisma.flyer.findMany({
          where: {
            id: { not: id }, // Exclude current flyer
            status: FlyerStatus.active, // Only active flyers
            validTo: { not: null },
            pages: {
              some: {
                slots: {
                  some: {
                    productId: { in: productIds },
                  },
                },
              },
            },
          },
          select: {
            validTo: true,
          },
        });

        // Find the minimum (earliest) validTo date from source flyers
        if (sourceFlyersWithDates.length > 0) {
          const validToDates = sourceFlyersWithDates
            .map(f => f.validTo)
            .filter(date => date !== null) as Date[];

          if (validToDates.length > 0) {
            const minDate = new Date(Math.min(...validToDates.map(d => d.getTime())));
            calculatedValidTo = minDate.toISOString().split('T')[0];
          }
        }
      }
    }

    // Prepare data object
    const data: any = {
      name: updateFlyerDto.name,
      actionId: updateFlyerDto.actionId,
      actionName: updateFlyerDto.actionName,
      validFrom: updateFlyerDto.validFrom
        ? new Date(updateFlyerDto.validFrom)
        : undefined,
      validTo: calculatedValidTo
        ? new Date(calculatedValidTo)
        : undefined,
      lastEditedAt: new Date(),
    };

    // Store PDF data if provided
    if (updateFlyerDto.pdfData && updateFlyerDto.pdfMimeType) {
      data.pdfData = updateFlyerDto.pdfData;
      data.pdfMimeType = updateFlyerDto.pdfMimeType;
    }

    const updated = await this.prisma.flyer.update({
      where: { id },
      data,
      include: {
        pages: {
          include: {
            slots: {
              include: {
                product: {
                  include: {
                    brand: true,
                    icons: {
                      include: {
                        icon: true,
                      },
                      orderBy: {
                        position: 'asc',
                      },
                    },
                  },
                },
                promoImage: true,
              },
              orderBy: {
                slotPosition: 'asc',
              },
            },
          },
          orderBy: {
            pageNumber: 'asc',
          },
        },
      },
    });

    // Track update in edit history
    await this.createEditHistory(id, userId, FlyerActionType.update_info, {
      changes: updateFlyerDto,
    });

    // Recalculate completion percentage
    await this.updateCompletionPercentage(id);

    return this.transformFlyerForFrontend(updated);
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const flyer = await this.prisma.flyer.findUnique({ where: { id } });

    if (!flyer) {
      throw new NotFoundException('Flyer not found');
    }

    // Only suppliers and end_users can delete their own flyers
    if ((userRole !== UserRole.supplier && userRole !== UserRole.end_user) || flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this flyer');
    }

    // Only draft flyers can be deleted
    if (flyer.status !== FlyerStatus.draft) {
      throw new BadRequestException('Only draft flyers can be deleted');
    }

    await this.prisma.flyer.delete({ where: { id } });

    return { message: 'Flyer deleted successfully' };
  }

  // ========================================
  // PAGE MANAGEMENT
  // ========================================

  async addPage(flyerId: string, addPageDto: AddPageDto, userId: string) {
    const flyer = await this.prisma.flyer.findUnique({ where: { id: flyerId } });

    if (!flyer) {
      throw new NotFoundException('Flyer not found');
    }

    if (flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this flyer');
    }

    if (flyer.status !== FlyerStatus.draft) {
      throw new BadRequestException('Only draft flyers can be modified');
    }

    // Check if page number already exists
    const existingPage = await this.prisma.flyerPage.findUnique({
      where: {
        flyerId_pageNumber: {
          flyerId,
          pageNumber: addPageDto.pageNumber,
        },
      },
    });

    if (existingPage) {
      throw new BadRequestException(
        `Page ${addPageDto.pageNumber} already exists`,
      );
    }

    // Create page with 8 empty slots
    const page = await this.prisma.flyerPage.create({
      data: {
        flyerId,
        pageNumber: addPageDto.pageNumber,
      },
    });

    // Create 8 empty slots (positions 0-7)
    for (let position = 0; position < 8; position++) {
      await this.prisma.flyerPageSlot.create({
        data: {
          pageId: page.id,
          slotPosition: position,
          slotType: SlotType.empty,
        },
      });
    }

    // Fetch the complete page with slots
    const pageWithSlots = await this.prisma.flyerPage.findUnique({
      where: { id: page.id },
      include: {
        slots: {
          include: {
            product: {
              include: {
                brand: true,
                icons: true,
              },
            },
            promoImage: true,
          },
          orderBy: {
            slotPosition: 'asc',
          },
        },
      },
    });

    // Update flyer's lastEditedAt
    await this.prisma.flyer.update({
      where: { id: flyerId },
      data: { lastEditedAt: new Date() },
    });

    // Track page addition
    await this.createEditHistory(flyerId, userId, FlyerActionType.add_page, {
      pageNumber: addPageDto.pageNumber,
    });

    // Recalculate completion percentage
    await this.updateCompletionPercentage(flyerId);

    return pageWithSlots;
  }

  async removePage(pageId: string, userId: string) {
    const page = await this.prisma.flyerPage.findUnique({
      where: { id: pageId },
      include: { flyer: true },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (page.flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this flyer');
    }

    if (page.flyer.status !== FlyerStatus.draft) {
      throw new BadRequestException('Only draft flyers can be modified');
    }

    await this.prisma.flyerPage.delete({ where: { id: pageId } });

    // Update flyer's lastEditedAt
    await this.prisma.flyer.update({
      where: { id: page.flyerId },
      data: { lastEditedAt: new Date() },
    });

    // Track page removal
    await this.createEditHistory(
      page.flyerId,
      userId,
      FlyerActionType.remove_page,
      {
        pageNumber: page.pageNumber,
      },
    );

    // Recalculate completion percentage
    await this.updateCompletionPercentage(page.flyerId);

    return { message: 'Page removed successfully' };
  }

  // ========================================
  // PRODUCT MANAGEMENT
  // ========================================

  async addProductToPage(
    pageId: string,
    addProductDto: AddProductToPageDto,
    userId: string,
  ) {
    const page = await this.prisma.flyerPage.findUnique({
      where: { id: pageId },
      include: {
        flyer: true,
        slots: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (page.flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this flyer');
    }

    if (page.flyer.status !== FlyerStatus.draft) {
      throw new BadRequestException('Only draft flyers can be modified');
    }

    // Validate position is within bounds (0-7)
    if (addProductDto.position < 0 || addProductDto.position >= 8) {
      throw new BadRequestException('Position must be between 0 and 7');
    }

    // Check if slot exists and is available
    const slot = await this.prisma.flyerPageSlot.findUnique({
      where: {
        pageId_slotPosition: {
          pageId,
          slotPosition: addProductDto.position,
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.slotType !== SlotType.empty) {
      throw new BadRequestException(
        `Slot at position ${addProductDto.position} is not available`,
      );
    }

    // Verify product exists and belongs to the supplier
    const product = await this.prisma.product.findUnique({
      where: { id: addProductDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.supplierId !== userId) {
      throw new ForbiddenException('You can only add your own products');
    }

    // Check if product is already used in this flyer
    const existingProductInFlyer = await this.prisma.flyerPageSlot.findFirst({
      where: {
        page: {
          flyerId: page.flyerId,
        },
        productId: addProductDto.productId,
        slotType: SlotType.product,
      },
    });

    if (existingProductInFlyer) {
      throw new BadRequestException(
        'This product is already used in this flyer',
      );
    }

    // Update slot with product
    const updatedSlot = await this.prisma.flyerPageSlot.update({
      where: { id: slot.id },
      data: {
        slotType: SlotType.product,
        productId: addProductDto.productId,
      },
      include: {
        product: {
          include: {
            brand: true,
            icons: true,
          },
        },
      },
    });

    // Update flyer's lastEditedAt
    await this.prisma.flyer.update({
      where: { id: page.flyerId },
      data: { lastEditedAt: new Date() },
    });

    // Track product addition
    await this.createEditHistory(
      page.flyerId,
      userId,
      FlyerActionType.add_product,
      {
        pageId,
        productId: addProductDto.productId,
        position: addProductDto.position,
      },
    );

    // Recalculate completion percentage
    await this.updateCompletionPercentage(page.flyerId);

    return updatedSlot;
  }

  async removeProductFromPage(slotId: string, userId: string) {
    const slot = await this.prisma.flyerPageSlot.findUnique({
      where: { id: slotId },
      include: {
        page: {
          include: {
            flyer: true,
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.page.flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this flyer');
    }

    if (slot.page.flyer.status !== FlyerStatus.draft) {
      throw new BadRequestException('Only draft flyers can be modified');
    }

    // Clear the slot (set to empty)
    await this.prisma.flyerPageSlot.update({
      where: { id: slotId },
      data: {
        slotType: SlotType.empty,
        productId: null,
        promoImageId: null,
      },
    });

    // Update flyer's lastEditedAt
    await this.prisma.flyer.update({
      where: { id: slot.page.flyerId },
      data: { lastEditedAt: new Date() },
    });

    // Track product removal
    await this.createEditHistory(
      slot.page.flyerId,
      userId,
      FlyerActionType.remove_product,
      {
        pageId: slot.pageId,
        slotPosition: slot.slotPosition,
      },
    );

    // Recalculate completion percentage
    await this.updateCompletionPercentage(slot.page.flyerId);

    return { message: 'Product removed from slot successfully' };
  }

  async updateProductPosition(
    slotId: string,
    updatePositionDto: UpdateProductPositionDto,
    userId: string,
  ) {
    const slot = await this.prisma.flyerPageSlot.findUnique({
      where: { id: slotId },
      include: {
        page: {
          include: {
            flyer: true,
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.page.flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this flyer');
    }

    if (slot.page.flyer.status !== FlyerStatus.draft) {
      throw new BadRequestException('Only draft flyers can be modified');
    }

    // Validate new position
    if (updatePositionDto.position < 0 || updatePositionDto.position >= 8) {
      throw new BadRequestException('Position must be between 0 and 7');
    }

    // Get target slot
    const targetSlot = await this.prisma.flyerPageSlot.findUnique({
      where: {
        pageId_slotPosition: {
          pageId: slot.pageId,
          slotPosition: updatePositionDto.position,
        },
      },
    });

    if (!targetSlot) {
      throw new NotFoundException('Target slot not found');
    }

    // Swap slot contents
    const tempSlotType = slot.slotType;
    const tempProductId = slot.productId;
    const tempPromoImageId = slot.promoImageId;

    await this.prisma.flyerPageSlot.update({
      where: { id: slot.id },
      data: {
        slotType: targetSlot.slotType,
        productId: targetSlot.productId,
        promoImageId: targetSlot.promoImageId,
      },
    });

    const updated = await this.prisma.flyerPageSlot.update({
      where: { id: targetSlot.id },
      data: {
        slotType: tempSlotType,
        productId: tempProductId,
        promoImageId: tempPromoImageId,
      },
      include: {
        product: {
          include: {
            brand: true,
            icons: true,
          },
        },
        promoImage: true,
      },
    });

    // Update flyer's lastEditedAt
    await this.prisma.flyer.update({
      where: { id: slot.page.flyerId },
      data: { lastEditedAt: new Date() },
    });

    // Track reorder
    await this.createEditHistory(
      slot.page.flyerId,
      userId,
      FlyerActionType.reorder,
      {
        oldPosition: slot.slotPosition,
        newPosition: updatePositionDto.position,
      },
    );

    return updated;
  }

  // ========================================
  // WORKFLOW MANAGEMENT
  // ========================================

  async submitForVerification(flyerId: string, userId: string) {
    const flyer = await this.prisma.flyer.findUnique({
      where: { id: flyerId },
      include: {
        pages: {
          include: {
            slots: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!flyer) {
      throw new NotFoundException('Flyer not found');
    }

    if (flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to submit this flyer');
    }

    if (flyer.status !== FlyerStatus.draft) {
      throw new BadRequestException('Only draft flyers can be submitted');
    }

    // Validate that Action is selected
    if (!flyer.actionId || !flyer.actionName) {
      throw new BadRequestException('Není vybrána žádná akce');
    }

    // Validate flyer is complete enough to submit
    if (!flyer.validFrom || !flyer.validTo) {
      throw new BadRequestException('Flyer must have valid dates set');
    }

    if (flyer.pages.length === 0) {
      throw new BadRequestException('Flyer must have at least one page');
    }

    // Validate all products against ERP with actionId filter
    const productsMap = new Map();
    for (const page of flyer.pages) {
      for (const slot of page.slots) {
        if (slot.product && !productsMap.has(slot.product.id)) {
          productsMap.set(slot.product.id, {
            id: slot.product.id,
            name: slot.product.name,
            eanCode: slot.product.eanCode,
            price: parseFloat(slot.product.price.toString()),
            originalPrice: slot.product.originalPrice
              ? parseFloat(slot.product.originalPrice.toString())
              : undefined,
          });
        }
      }
    }

    const products = Array.from(productsMap.values());
    const validationErrors = await this.mssqlService.validateFlyerProducts(
      products,
      flyer.actionId,
    );

    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Flyer validation failed',
        errors: validationErrors,
      });
    }

    // Create a version snapshot before submission
    await this.createVersionSnapshot(flyerId, userId, 'Submitted for verification');

    // Get full flyer data with images for PDF generation
    const flyerForPdf = await this.findOneForPdf(flyerId, userId, UserRole.supplier);

    // Generate and save PDF permanently
    const pdfData = await this.pdfService.generateFlyerPDF(flyerForPdf, UserRole.supplier);

    // Update flyer status and save PDF
    const updated = await this.prisma.flyer.update({
      where: { id: flyerId },
      data: {
        status: FlyerStatus.pending_approval,
        isDraft: false,
        pdfData: pdfData,
        pdfMimeType: 'application/pdf',
        rejectionReason: null, // Clear rejection reason when resubmitting
      },
      include: {
        pages: {
          include: {
            slots: {
              include: {
                product: {
                  include: {
                    brand: true,
                    icons: {
                      include: {
                        icon: true,
                      },
                      orderBy: {
                        position: 'asc',
                      },
                    },
                  },
                },
                promoImage: true,
              },
              orderBy: {
                slotPosition: 'asc',
              },
            },
          },
        },
      },
    });

    // Clean up any existing approval workflow and requests (in case of resubmission after rejection)
    console.log(`🔄 Cleaning up existing approvals for flyer ${flyerId}`);

    try {
      await this.prisma.approvalWorkflow.delete({
        where: { flyerId },
      });
      console.log(`✅ Deleted approval workflow for flyer ${flyerId}`);
    } catch (error) {
      console.log(`ℹ️ No existing workflow to delete for flyer ${flyerId}`);
    }

    // Delete all approvals to allow fresh resubmission
    const deletedCount = await this.prisma.approval.deleteMany({
      where: { flyerId },
    });
    console.log(`✅ Deleted ${deletedCount.count} approval records for flyer ${flyerId}`);

    // Get all approvers and pre-approvers and create approval requests
    const approvers = await this.prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.approver, UserRole.pre_approver]
        }
      },
    });
    console.log(`👥 Found ${approvers.length} approvers and pre-approvers`);

    // Create approval workflow
    const workflow = await this.approvalsService.createApprovalWorkflow(flyerId, 1);
    console.log(`✅ Created approval workflow: ${workflow.id}`);

    // Get the supplier information for email
    const supplier = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    // Create approval requests for all approvers and send notification emails
    for (const approver of approvers) {
      try {
        const approval = await this.approvalsService.requestApproval(flyerId, approver.id);
        console.log(`✅ Created approval request for ${approver.email}: ${approval.id}`);

        // Send email notification to approver
        if (supplier) {
          const approvalUrl = `${process.env.FRONTEND_URL}/approvals/${approval.id}`;
          const isPreApproval = approver.role === UserRole.pre_approver;

          await emailService.sendFlyerSubmittedEmail(
            approver.email,
            `${approver.firstName} ${approver.lastName}`,
            updated.name,
            `${supplier.firstName} ${supplier.lastName}`,
            approvalUrl,
            isPreApproval
          );
          console.log(`📧 Sent notification email to ${approver.email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create approval for ${approver.email}:`, error.message);
      }
    }

    return updated;
  }

  async getPreview(flyerId: string, userId: string, userRole: UserRole) {
    const flyer = await this.findOne(flyerId, userId, userRole);

    // Return formatted preview data
    return {
      id: flyer.id,
      name: flyer.name,
      validFrom: flyer.validFrom,
      validTo: flyer.validTo,
      status: flyer.status,
      completionPercentage: flyer.completionPercentage,
      pages: flyer.pages,
    };
  }

  async autoSave(flyerId: string, userId: string) {
    const flyer = await this.prisma.flyer.findUnique({ where: { id: flyerId } });

    if (!flyer) {
      throw new NotFoundException('Flyer not found');
    }

    if (flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this flyer');
    }

    const updated = await this.prisma.flyer.update({
      where: { id: flyerId },
      data: {
        lastEditedAt: new Date(),
        autoSaveVersion: {
          increment: 1,
        },
      },
      select: {
        id: true,
        lastEditedAt: true,
        autoSaveVersion: true,
      },
    });

    return {
      message: 'Flyer auto-saved successfully',
      ...updated,
    };
  }

  async expireFlyer(flyerId: string, userId: string, userRole: UserRole) {
    const flyer = await this.prisma.flyer.findUnique({ where: { id: flyerId } });

    if (!flyer) {
      throw new NotFoundException('Flyer not found');
    }

    // Only suppliers can expire their own flyers, or admins can expire any flyer
    if (userRole !== UserRole.admin && flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to expire this flyer');
    }

    // Only active flyers can be expired
    if (flyer.status !== FlyerStatus.active) {
      throw new BadRequestException('Only active flyers can be expired');
    }

    // Set validTo to yesterday to expire the flyer
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const updated = await this.prisma.flyer.update({
      where: { id: flyerId },
      data: {
        validTo: yesterday,
        status: FlyerStatus.expired,
      },
      include: {
        pages: {
          include: {
            slots: {
              include: {
                product: {
                  include: {
                    brand: true,
                    icons: {
                      include: {
                        icon: true,
                      },
                      orderBy: {
                        position: 'asc',
                      },
                    },
                  },
                },
                promoImage: true,
              },
              orderBy: {
                slotPosition: 'asc',
              },
            },
          },
          orderBy: {
            pageNumber: 'asc',
          },
        },
      },
    });

    console.log(`✅ Flyer ${flyerId} expired by ${userRole} (${userId})`);

    return this.transformFlyerForFrontend(updated);
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private async updateExpiredFlyers() {
    // Find all active flyers where validTo date has passed
    // We need to check if validTo is before the start of today (in UTC)
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    const expiredFlyers = await this.prisma.flyer.findMany({
      where: {
        status: FlyerStatus.active,
        validTo: {
          lt: todayStart, // validTo is before start of today (UTC)
        },
      },
    });

    if (expiredFlyers.length > 0) {
      console.log(`🔄 Found ${expiredFlyers.length} flyers with expired validTo date, updating status to expired...`);

      // Update all expired flyers to expired status
      await this.prisma.flyer.updateMany({
        where: {
          id: {
            in: expiredFlyers.map(f => f.id),
          },
        },
        data: {
          status: FlyerStatus.expired,
        },
      });

      console.log(`✅ Updated ${expiredFlyers.length} flyers to expired status`);
    }
  }

  private async updateCompletionPercentage(flyerId: string) {
    const flyer = await this.prisma.flyer.findUnique({
      where: { id: flyerId },
      include: {
        pages: {
          include: {
            slots: true,
          },
        },
      },
    });

    if (!flyer) return;

    let totalScore = 0;
    const maxScore = 100;

    // Name and dates: 30 points
    if (flyer.name) totalScore += 10;
    if (flyer.validFrom) totalScore += 10;
    if (flyer.validTo) totalScore += 10;

    // Pages: 30 points (at least 2 pages)
    const pageScore = Math.min((flyer.pages.length / 2) * 30, 30);
    totalScore += pageScore;

    // Products: 40 points (at least 8 products total)
    const totalProducts = flyer.pages.reduce(
      (sum: number, page: any) =>
        sum + page.slots.filter((slot: any) => slot.slotType === SlotType.product).length,
      0,
    );
    const productScore = Math.min((totalProducts / 8) * 40, 40);
    totalScore += productScore;

    const completionPercentage = Math.round(totalScore);

    await this.prisma.flyer.update({
      where: { id: flyerId },
      data: { completionPercentage },
    });
  }

  private async syncPages(flyerId: string, pages: any[], userId: string, userRole: UserRole) {
    console.log(`[syncPages] Called with ${pages.length} pages for user role: ${userRole}`);
    console.log(`[syncPages] First page:`, JSON.stringify(pages[0], null, 2));

    // Delete all existing pages and their slots (cascade will handle slots)
    await this.prisma.flyerPage.deleteMany({
      where: { flyerId },
    });

    // Create new pages with slots
    for (const page of pages) {
      // Validate footer promo image if provided
      let validFooterPromoImageId = null;
      if (page.footerPromoImageId) {
        if (userRole === UserRole.supplier) {
          // Supplier: footer promo image must either belong to them OR be assigned to a brand they have access to
          const dbPromoImage = await this.prisma.promoImage.findUnique({
            where: { id: page.footerPromoImageId },
          });

          if (dbPromoImage) {
            // Check if promo belongs to supplier directly
            if (dbPromoImage.supplierId === userId) {
              validFooterPromoImageId = page.footerPromoImageId;
            }
            // Check if promo is assigned to a brand the supplier has access to
            else if (dbPromoImage.brandId) {
              const hasAccessToBrand = await this.prisma.userBrand.findFirst({
                where: {
                  userId,
                  brandId: dbPromoImage.brandId,
                },
              });
              if (hasAccessToBrand) {
                validFooterPromoImageId = page.footerPromoImageId;
              }
            }
          }
        } else if (userRole === UserRole.end_user) {
          // End user: footer promo image must exist (frontend already filters to show only promo images from active flyers)
          const dbPromoImage = await this.prisma.promoImage.findUnique({
            where: { id: page.footerPromoImageId },
          });
          if (dbPromoImage) {
            validFooterPromoImageId = page.footerPromoImageId;
          }
        }
      }

      const createdPage = await this.prisma.flyerPage.create({
        data: {
          flyerId,
          pageNumber: page.pageNumber,
          footerPromoImageId: validFooterPromoImageId,
        },
      });

      // Create 8 empty slots
      for (let position = 0; position < 8; position++) {
        await this.prisma.flyerPageSlot.create({
          data: {
            pageId: createdPage.id,
            slotPosition: position,
            slotType: SlotType.empty,
          },
        });
      }

      // Update slots if provided
      if (page.slots && Array.isArray(page.slots)) {
        for (let position = 0; position < Math.min(page.slots.length, 8); position++) {
          const slotData = page.slots[position];
          if (!slotData || slotData.type === 'empty') continue;

          if (slotData.type === 'product' && slotData.productId) {
            // Verify product access based on user role
            let canUseProduct = false;
            let productHasEnergyClass = false;

            if (userRole === UserRole.supplier) {
              // Supplier: product must belong to them
              const dbProduct = await this.prisma.product.findUnique({
                where: { id: slotData.productId },
                include: {
                  icons: {
                    include: {
                      icon: true,
                    },
                  },
                },
              });
              canUseProduct = dbProduct && dbProduct.supplierId === userId;
              // Check if product has energy class icon
              if (dbProduct) {
                productHasEnergyClass = dbProduct.icons.some(pi => pi.icon.isEnergyClass === true);
              }
            } else if (userRole === UserRole.end_user) {
              // End user: product must exist (frontend already filters to show only products from active flyers)
              const dbProduct = await this.prisma.product.findUnique({
                where: { id: slotData.productId },
                include: {
                  icons: {
                    include: {
                      icon: true,
                    },
                  },
                },
              });
              canUseProduct = !!dbProduct;
              // Check if product has energy class icon
              if (dbProduct) {
                productHasEnergyClass = dbProduct.icons.some(pi => pi.icon.isEnergyClass === true);
              }
            }

            // Validate that product has energy class icon
            if (canUseProduct && !productHasEnergyClass) {
              throw new BadRequestException(
                `Produkt nemůže být vložen do letáku. Produkt musí mít přiřazenou ikonu s energetickým štítkem.`
              );
            }

            if (canUseProduct && productHasEnergyClass) {
              await this.prisma.flyerPageSlot.updateMany({
                where: {
                  pageId: createdPage.id,
                  slotPosition: position,
                },
                data: {
                  slotType: SlotType.product,
                  productId: slotData.productId,
                },
              });
            }
          } else if (slotData.type === 'promo' && slotData.promoImageId) {
            // Verify promo image access based on user role
            let canUsePromoImage = false;

            if (userRole === UserRole.supplier) {
              // Supplier: promo image must either belong to them OR be assigned to a brand they have access to
              const dbPromoImage = await this.prisma.promoImage.findUnique({
                where: { id: slotData.promoImageId },
              });

              if (dbPromoImage) {
                // Check if promo belongs to supplier directly
                if (dbPromoImage.supplierId === userId) {
                  canUsePromoImage = true;
                }
                // Check if promo is assigned to a brand the supplier has access to
                else if (dbPromoImage.brandId) {
                  const hasAccessToBrand = await this.prisma.userBrand.findFirst({
                    where: {
                      userId,
                      brandId: dbPromoImage.brandId,
                    },
                  });
                  canUsePromoImage = !!hasAccessToBrand;
                }
              }
            } else if (userRole === UserRole.end_user) {
              // End user: promo image must exist (frontend already filters to show only promo images from active flyers)
              const dbPromoImage = await this.prisma.promoImage.findUnique({
                where: { id: slotData.promoImageId },
              });
              canUsePromoImage = !!dbPromoImage;
            }

            if (canUsePromoImage) {
              // Validate header promo placement - only on first page and top row
              if (slotData.promoSize === 'header_2x1' || slotData.promoSize === 'header_2x2') {
                if (page.pageNumber !== 1) {
                  continue; // Skip this slot - header promo only on first page
                }
                if (position !== 0 && position !== 1) {
                  continue; // Skip this slot - header promo only in top row
                }
              }

              await this.prisma.flyerPageSlot.updateMany({
                where: {
                  pageId: createdPage.id,
                  slotPosition: position,
                },
                data: {
                  slotType: SlotType.promo,
                  promoImageId: slotData.promoImageId,
                  promoSize: slotData.promoSize || null,
                },
              });
            }
          }
        }
      }
    }
  }

  private transformFlyerForFrontend(flyer: any) {
    // Handle case where flyer.pages might not exist or be empty
    if (!flyer.pages) {
      return flyer;
    }

    const baseUrl = process.env.API_URL || 'http://localhost:4000';

    // Transform pages to match frontend expected format
    const transformedPages = flyer.pages.map((page: any) => {
      // Only create slot array if slots data exists (for detail view)
      // For list view, page.slots will be undefined, so skip this expensive operation
      if (!page.slots || !Array.isArray(page.slots) || page.slots.length === 0) {
        return page; // Return page as-is for list view (no slots transformation needed)
      }

      // Create an array of 8 empty slots (only for detail view with slots data)
      const slotsArray = new Array(8).fill(null).map(() => ({ type: 'empty' }));

      // Fill in slots at their positions
      if (page.slots && Array.isArray(page.slots)) {
        page.slots.forEach((slot: any) => {
          if (slot.slotPosition >= 0 && slot.slotPosition < 8) {
            // Format product with icon URLs and convert Decimal types
            const formattedProduct = slot.product ? {
              ...slot.product,
              price: slot.product.price ? parseFloat(slot.product.price.toString()) : 0,
              originalPrice: slot.product.originalPrice ? parseFloat(slot.product.originalPrice.toString()) : null,
              brandName: slot.product.brand?.name,
              brandColor: slot.product.brand?.color,
              icons: slot.product.icons ? slot.product.icons.map((productIcon: any) => ({
                id: productIcon.icon.id,
                name: productIcon.icon.name,
                imageUrl: `${baseUrl}/api/icons/${productIcon.icon.id}/image`,
                isEnergyClass: productIcon.icon.isEnergyClass,
                position: productIcon.position,
                icon: productIcon.icon, // Keep full icon object for PDF generation
              })) : [],
            } : null;

            slotsArray[slot.slotPosition] = {
              type: slot.slotType,
              product: formattedProduct,
              promoImage: slot.promoImage || null,
              promoSize: slot.promoSize || null,
            } as any;
          }
        });
      }

      return {
        ...page,
        slots: slotsArray,
      };
    });

    return {
      ...flyer,
      pages: transformedPages,
    };
  }

  private async checkAccessPermission(
    flyer: any,
    userId: string,
    userRole: UserRole,
  ) {
    if (userRole === UserRole.supplier) {
      // Suppliers can access flyers from suppliers who share at least one brand
      if (flyer.supplierId !== userId) {
        // Check if this supplier shares any brands with the flyer creator
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            brands: {
              include: {
                brand: {
                  include: {
                    users: true,
                  },
                },
              },
            },
          },
        });

        if (user && user.brands.length > 0) {
          // Get all user IDs that share at least one brand with this supplier
          const sharedBrandUserIds = new Set<string>();
          user.brands.forEach(userBrand => {
            userBrand.brand.users.forEach(brandUser => {
              sharedBrandUserIds.add(brandUser.userId);
            });
          });

          // Check if flyer creator shares a brand
          if (!sharedBrandUserIds.has(flyer.supplierId)) {
            throw new ForbiddenException('You do not have access to this flyer');
          }
        } else {
          // Supplier has no brands assigned, can only access own flyers
          throw new ForbiddenException('You do not have access to this flyer');
        }
      }
    } else if (userRole === UserRole.end_user) {
      // End users can only access their own flyers
      if (flyer.supplierId !== userId) {
        throw new ForbiddenException('This flyer is not available');
      }
    }
    // Approvers can access all flyers (no restriction)
  }

  private async createEditHistory(
    flyerId: string,
    userId: string,
    actionType: FlyerActionType,
    details: any,
  ) {
    await this.prisma.flyerEditHistory.create({
      data: {
        flyerId,
        userId,
        actionType,
        details,
      },
    });
  }

  private async createVersionSnapshot(
    flyerId: string,
    userId: string,
    description: string,
  ) {
    const flyer = await this.prisma.flyer.findUnique({
      where: { id: flyerId },
      include: {
        pages: {
          include: {
            slots: {
              include: {
                product: true,
                promoImage: true,
              },
            },
          },
        },
      },
    });

    if (!flyer) return;

    // Get the next version number
    const lastVersion = await this.prisma.flyerVersion.findFirst({
      where: { flyerId },
      orderBy: { versionNumber: 'desc' },
    });

    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    await this.prisma.flyerVersion.create({
      data: {
        flyerId,
        versionNumber,
        snapshotData: flyer,
        createdBy: userId,
        changeDescription: description,
      },
    });
  }
}
