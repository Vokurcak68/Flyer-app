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

@Injectable()
export class FlyersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ApprovalsService))
    private approvalsService: ApprovalsService,
  ) {}

  // ========================================
  // CREATE & UPDATE FLYER METADATA
  // ========================================

  async create(createFlyerDto: CreateFlyerDto, userId: string) {
    const flyer = await this.prisma.flyer.create({
      data: {
        name: createFlyerDto.name,
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
    const where: any = {};

    // Role-based filtering
    if (userRole === UserRole.supplier) {
      // Suppliers see only their own flyers
      where.supplierId = userId;
    } else if (userRole === UserRole.approver) {
      // Approvers see flyers pending approval
      where.status = {
        in: [FlyerStatus.pending_approval, FlyerStatus.approved],
      };
    } else if (userRole === UserRole.end_user) {
      // End users see only active flyers
      where.status = FlyerStatus.active;
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
          select: {
            id: true,
            pageNumber: true,
          },
          orderBy: {
            pageNumber: 'asc',
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

  async findOne(id: string, userId: string, userRole: UserRole) {
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
                    description: true, // ADDED: Product description for right panel
                    eanCode: true, // ADDED: EAN code
                    price: true,
                    originalPrice: true,
                    imageData: true,
                    imageMimeType: true,
                    brandId: true,
                    supplierId: true,
                    createdAt: true,
                    updatedAt: true,
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
                promoImage: {
                  select: {
                    id: true,
                    name: true,
                    imageData: true,
                    imageMimeType: true,
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
                imageData: true,
                imageMimeType: true,
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
    this.checkAccessPermission(flyer, userId, userRole);

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

    // Only suppliers can update their own flyers
    if (userRole !== UserRole.supplier || flyer.supplierId !== userId) {
      throw new ForbiddenException('You do not have permission to update this flyer');
    }

    // Only draft flyers can be updated
    if (flyer.status !== FlyerStatus.draft) {
      throw new BadRequestException('Only draft flyers can be updated');
    }

    // Prepare data object
    const data: any = {
      name: updateFlyerDto.name,
      validFrom: updateFlyerDto.validFrom
        ? new Date(updateFlyerDto.validFrom)
        : undefined,
      validTo: updateFlyerDto.validTo
        ? new Date(updateFlyerDto.validTo)
        : undefined,
      lastEditedAt: new Date(),
    };

    // Store PDF data if provided
    if (updateFlyerDto.pdfData && updateFlyerDto.pdfMimeType) {
      data.pdfData = updateFlyerDto.pdfData;
      data.pdfMimeType = updateFlyerDto.pdfMimeType;
    }

    // Handle pages if provided
    if (updateFlyerDto.pages) {
      await this.syncPages(id, updateFlyerDto.pages, userId);
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

    // Only suppliers can delete their own flyers
    if (userRole !== UserRole.supplier || flyer.supplierId !== userId) {
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
            slots: true,
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

    // Validate flyer is complete enough to submit
    if (!flyer.validFrom || !flyer.validTo) {
      throw new BadRequestException('Flyer must have valid dates set');
    }

    if (flyer.pages.length === 0) {
      throw new BadRequestException('Flyer must have at least one page');
    }

    // Create a version snapshot before submission
    await this.createVersionSnapshot(flyerId, userId, 'Submitted for verification');

    // Update flyer status
    const updated = await this.prisma.flyer.update({
      where: { id: flyerId },
      data: {
        status: FlyerStatus.pending_verification,
        isDraft: false,
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

    // Get all approvers and create approval requests
    const approvers = await this.prisma.user.findMany({
      where: { role: UserRole.approver },
    });

    // Create approval workflow
    await this.approvalsService.createApprovalWorkflow(flyerId, 1); // Require 1 approval

    // Create approval requests for all approvers
    for (const approver of approvers) {
      await this.approvalsService.requestApproval(flyerId, approver.id);
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

  // ========================================
  // HELPER METHODS
  // ========================================

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

  private async syncPages(flyerId: string, pages: any[], userId: string) {
    console.log(`[syncPages] Called with ${pages.length} pages`);
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
        const dbPromoImage = await this.prisma.promoImage.findUnique({
          where: { id: page.footerPromoImageId },
        });
        if (dbPromoImage && dbPromoImage.supplierId === userId) {
          validFooterPromoImageId = page.footerPromoImageId;
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
            // Verify product belongs to the supplier
            const dbProduct = await this.prisma.product.findUnique({
              where: { id: slotData.productId },
            });

            if (dbProduct && dbProduct.supplierId === userId) {
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
            // Verify promo image belongs to the supplier
            const dbPromoImage = await this.prisma.promoImage.findUnique({
              where: { id: slotData.promoImageId },
            });

            if (dbPromoImage && dbPromoImage.supplierId === userId) {
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
      // Create an array of 8 empty slots
      const slotsArray = new Array(8).fill(null).map(() => ({ type: 'empty' }));

      // Fill in slots at their positions (if slots exist)
      if (page.slots && Array.isArray(page.slots)) {
        page.slots.forEach((slot: any) => {
          if (slot.slotPosition >= 0 && slot.slotPosition < 8) {
            // Format product with icon URLs if present
            let formattedProduct = slot.product;
            if (slot.product && slot.product.icons) {
              formattedProduct = {
                ...slot.product,
                icons: slot.product.icons.map((productIcon: any) => ({
                  id: productIcon.icon.id,
                  name: productIcon.icon.name,
                  imageUrl: `${baseUrl}/api/icons/${productIcon.icon.id}/image`,
                  position: productIcon.position,
                  icon: productIcon.icon, // Keep full icon object for PDF generation
                })),
              };
            }

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

  private checkAccessPermission(
    flyer: any,
    userId: string,
    userRole: UserRole,
  ) {
    if (userRole === UserRole.supplier) {
      // Suppliers can only access their own flyers
      if (flyer.supplierId !== userId) {
        throw new ForbiddenException('You do not have access to this flyer');
      }
    } else if (userRole === UserRole.end_user) {
      // End users can only access active flyers
      if (flyer.status !== FlyerStatus.active) {
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
