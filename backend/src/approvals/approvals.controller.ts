import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApprovalStatus } from '@prisma/client';

@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @Roles('approver')
  getPendingApprovals(@Request() req) {
    return this.approvalsService.getPendingApprovals(req.user.userId);
  }

  @Get('my')
  @Roles('approver')
  getMyApprovals(@Request() req) {
    return this.approvalsService.getMyApprovals(req.user.userId);
  }

  @Post(':id/approve')
  @Roles('approver')
  async approve(
    @Param('id') approvalId: string,
    @Body() body: { comment?: string },
    @Request() req,
  ) {
    // Parse approval ID (format: flyerId_approverId)
    const parts = approvalId.split('_');
    if (parts.length !== 2) {
      throw new Error('Invalid approval ID format');
    }
    const [flyerId, approverId] = parts;

    // Verify the approver is the logged-in user
    if (approverId !== req.user.userId) {
      throw new Error('Unauthorized to approve this flyer');
    }

    return this.approvalsService.processApproval(
      flyerId,
      approverId,
      ApprovalStatus.approved,
      body.comment,
    );
  }

  @Post(':id/reject')
  @Roles('approver')
  async reject(
    @Param('id') approvalId: string,
    @Body() body: { comment: string },
    @Request() req,
  ) {
    // Parse approval ID (format: flyerId_approverId)
    const parts = approvalId.split('_');
    if (parts.length !== 2) {
      throw new Error('Invalid approval ID format');
    }
    const [flyerId, approverId] = parts;

    // Verify the approver is the logged-in user
    if (approverId !== req.user.userId) {
      throw new Error('Unauthorized to reject this flyer');
    }

    return this.approvalsService.processApproval(
      flyerId,
      approverId,
      ApprovalStatus.rejected,
      body.comment,
    );
  }
}
