import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus, PreApprovalStatus, FlyerStatus } from '@prisma/client';

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
   * Pre-approve or reject a flyer (for pre_approver role)
   */
  async processPreApproval(
    flyerId: string,
    approverId: string,
    status: PreApprovalStatus,
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

    if (approval.preApprovalStatus && approval.preApprovalStatus !== PreApprovalStatus.pending) {
      throw new BadRequestException('This pre-approval has already been processed');
    }

    // Update pre-approval status
    if (status === PreApprovalStatus.pre_approved) {
      const updated = await this.prisma.approval.update({
        where: {
          flyerId_approverId: {
            flyerId,
            approverId,
          },
        },
        data: {
          preApprovalStatus: status,
          comment,
          preApprovedAt: new Date(),
        },
      });

      await this.updatePreApprovalWorkflow(flyerId);
      return updated;
    } else if (status === PreApprovalStatus.rejected) {
      // If pre-approver rejects, flyer goes back to draft
      const updated = await this.prisma.approval.update({
        where: {
          flyerId_approverId: {
            flyerId,
            approverId,
          },
        },
        data: {
          preApprovalStatus: status,
          comment,
          preApprovedAt: new Date(),
        },
      });

      await this.prisma.flyer.update({
        where: { id: flyerId },
        data: {
          status: FlyerStatus.draft,
          isDraft: true,
          rejectionReason: comment || 'Rejected by pre-approver without comment',
        },
      });

      return updated;
    }

    // Fallback
    return this.prisma.approval.update({
      where: {
        flyerId_approverId: {
          flyerId,
          approverId,
        },
      },
      data: {
        preApprovalStatus: status,
        comment,
        preApprovedAt: new Date(),
      },
    });
  }

  /**
   * Approve or reject a flyer (for approver role)
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

    // Update workflow
    if (status === ApprovalStatus.approved) {
      // Update approval record
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

      await this.updateApprovalWorkflow(flyerId);
      return updated;
    } else if (status === ApprovalStatus.rejected) {
      // Update approval record first
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

      // If rejected, update flyer status and isDraft back to true so supplier can edit it
      await this.prisma.flyer.update({
        where: { id: flyerId },
        data: {
          status: FlyerStatus.draft,
          isDraft: true,
          rejectionReason: comment || 'Rejected without comment',
        },
      });

      return updated;
    }

    // Fallback (shouldn't reach here)
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

    return updated;
  }

  /**
   * Update pre-approval workflow progress
   */
  private async updatePreApprovalWorkflow(flyerId: string) {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { flyerId },
    });

    if (!workflow) return;

    const preApprovedCount = await this.prisma.approval.count({
      where: {
        flyerId,
        preApprovalStatus: PreApprovalStatus.pre_approved,
      },
    });

    const isPreApprovalComplete = preApprovedCount >= workflow.requiredPreApprovers;

    await this.prisma.approvalWorkflow.update({
      where: { flyerId },
      data: {
        currentPreApprovals: preApprovedCount,
        isPreApprovalComplete,
      },
    });

    console.log(`✅ Pre-approvals for flyer ${flyerId}: ${preApprovedCount}/${workflow.requiredPreApprovers}`);
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

    // If workflow is complete, update flyer status to active so end users can see it
    if (isComplete) {
      await this.prisma.flyer.update({
        where: { id: flyerId },
        data: {
          status: FlyerStatus.active,
          publishedAt: new Date(),
        },
      });
      console.log(`✅ Flyer ${flyerId} approved and activated for end users`);
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
   * Get pending pre-approvals for a pre-approver
   */
  async getPendingPreApprovals(approverId: string) {
    const approvals = await this.prisma.approval.findMany({
      where: {
        approverId,
        preApprovalStatus: PreApprovalStatus.pending,
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
}
