-- AlterEnum: Add pre_approver to UserRole
ALTER TYPE "UserRole" ADD VALUE 'pre_approver';

-- CreateEnum: PreApprovalStatus
CREATE TYPE "PreApprovalStatus" AS ENUM ('pending', 'pre_approved', 'rejected');

-- AlterTable: Add pre-approval fields to approvals
ALTER TABLE "approvals" ADD COLUMN "pre_approval_status" "PreApprovalStatus",
ADD COLUMN "pre_approved_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "approvals_flyer_id_pre_approval_status_idx" ON "approvals"("flyer_id", "pre_approval_status");

-- AlterTable: Add pre-approval tracking to approval_workflow
ALTER TABLE "approval_workflow" ADD COLUMN "required_pre_approvers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "current_pre_approvals" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "is_pre_approval_complete" BOOLEAN NOT NULL DEFAULT false;
