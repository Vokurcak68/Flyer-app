import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus, FlyerStatus } from '@prisma/client';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create approval workflow for a flyer
   */
  async createApprovalWorkflow(flyerId: string, requiredApprovers: number = 2) {
    return this.prisma.approvalWorkflow.create({
      data: {
        flyerId,
        requiredApprovers,
        currentApprovals: 0,
        isComplete: false,
      },
    });
  }

  /**
   * Request approval from an approver
   */
  async requestApproval(flyerId: string, approverId: string) {
    // Check if approval already exists
    const existingApproval = await this.prisma.approval.findUnique({
      where: {
        flyerId_approverId: {
          flyerId,
          approverId,
        },
      },
    });

    if (existingApproval) {
      throw new BadRequestException('Approval request already exists for this approver');
    }

    return this.prisma.approval.create({
      data: {
        flyerId,
        approverId,
        status: ApprovalStatus.pending,
      },
    });
  }

  /**
   * Approve or reject a flyer
   */
  async processApproval(
    flyerId: string,
    approverId: string,
    status: ApprovalStatus,
    comment?: string,
  ) {
    const approval = await this.prisma.approval.findUnique({
      where: {
        flyerId_approverId: {
          flyerId,
          approverId,
        },
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.status !== ApprovalStatus.pending) {
      throw new BadRequestException('This approval has already been processed');
    }

    // Update approval
    const updated = await this.prisma.approval.update({
      where: {
        flyerId_approverId: {
          flyerId,
          approverId,
        },
      },
      data: {
        status,
        comment,
        decidedAt: new Date(),
      },
    });

    // Update workflow
    if (status === ApprovalStatus.approved) {
      await this.updateApprovalWorkflow(flyerId);
    } else if (status === ApprovalStatus.rejected) {
      // If rejected, update flyer status
      await this.prisma.flyer.update({
        where: { id: flyerId },
        data: {
          status: FlyerStatus.rejected,
          rejectionReason: comment,
        },
      });
    }

    return updated;
  }

  /**
   * Update approval workflow progress
   */
  private async updateApprovalWorkflow(flyerId: string) {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { flyerId },
    });

    if (!workflow) return;

    const approvedCount = await this.prisma.approval.count({
      where: {
        flyerId,
        status: ApprovalStatus.approved,
      },
    });

    const isComplete = approvedCount >= workflow.requiredApprovers;

    await this.prisma.approvalWorkflow.update({
      where: { flyerId },
      data: {
        currentApprovals: approvedCount,
        isComplete,
      },
    });

    // If workflow is complete, update flyer status
    if (isComplete) {
      await this.prisma.flyer.update({
        where: { id: flyerId },
        data: {
          status: FlyerStatus.approved,
        },
      });
    }
  }

  /**
   * Get approvals for a flyer
   */
  async getApprovals(flyerId: string) {
    return this.prisma.approval.findMany({
      where: { flyerId },
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
    });
  }

  /**
   * Get approval workflow status
   */
  async getApprovalWorkflow(flyerId: string) {
    return this.prisma.approvalWorkflow.findUnique({
      where: { flyerId },
    });
  }

  /**
   * Get pending approvals for an approver
   */
  async getPendingApprovals(approverId: string) {
    const approvals = await this.prisma.approval.findMany({
      where: {
        approverId,
        status: ApprovalStatus.pending,
      },
      include: {
        flyer: {
          include: {
            pages: {
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
              orderBy: {
                pageNumber: 'asc',
              },
            },
            supplier: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform flyer pages to match frontend format
    return approvals.map(approval => ({
      ...approval,
      flyer: (approval as any).flyer ? this.transformFlyerForFrontend((approval as any).flyer) : null,
    }));
  }

  /**
   * Get all approvals made by an approver
   */
  async getMyApprovals(approverId: string) {
    return this.prisma.approval.findMany({
      where: {
        approverId,
      },
      include: {
        flyer: {
          select: {
            id: true,
            name: true,
            validFrom: true,
            validTo: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Transform flyer data to match frontend expected format
   */
  private transformFlyerForFrontend(flyer: any) {
    if (!flyer.pages) {
      return flyer;
    }

    const transformedPages = flyer.pages.map((page: any) => {
      const maxProducts = this.getMaxProductsForLayout(page.layoutType);
      const productsArray = new Array(maxProducts).fill(null);

      if (page.products && Array.isArray(page.products)) {
        page.products.forEach((flyerPageProduct: any) => {
          if (flyerPageProduct.position < maxProducts) {
            productsArray[flyerPageProduct.position] = flyerPageProduct.product;
          }
        });
      }

      return {
        ...page,
        products: productsArray,
        maxProducts,
      };
    });

    return {
      ...flyer,
      pages: transformedPages,
    };
  }

  /**
   * Get max products for a layout type
   */
  private getMaxProductsForLayout(layoutType: string): number {
    const layoutMap: Record<string, number> = {
      products_8: 8,
      products_6: 6,
      products_4: 4,
      promo_plus_4: 4,
      promo_plus_2: 2,
    };
    return layoutMap[layoutType] || 8;
  }
}
