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
import { ApprovalStatus, PreApprovalStatus } from '@prisma/client';

@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @Roles('approver', 'pre_approver')
  getPendingApprovals(@Request() req) {
    // If pre_approver, return pre-approvals. If approver, return final approvals
    if (req.user.role === 'pre_approver') {
      return this.approvalsService.getPendingPreApprovals(req.user.userId);
    }
    return this.approvalsService.getPendingApprovals(req.user.userId);
  }

  @Get('my')
  @Roles('approver', 'pre_approver')
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

  @Post(':id/pre-approve')
  @Roles('pre_approver')
  async preApprove(
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

    // Verify the pre-approver is the logged-in user
    if (approverId !== req.user.userId) {
      throw new Error('Unauthorized to pre-approve this flyer');
    }

    return this.approvalsService.processPreApproval(
      flyerId,
      approverId,
      PreApprovalStatus.pre_approved,
      body.comment,
    );
  }

  @Post(':id/pre-reject')
  @Roles('pre_approver')
  async preReject(
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

    // Verify the pre-approver is the logged-in user
    if (approverId !== req.user.userId) {
      throw new Error('Unauthorized to pre-reject this flyer');
    }

    return this.approvalsService.processPreApproval(
      flyerId,
      approverId,
      PreApprovalStatus.rejected,
      body.comment,
    );
  }
}
