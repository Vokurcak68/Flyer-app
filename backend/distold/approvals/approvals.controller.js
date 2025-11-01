"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const approvals_service_1 = require("./approvals.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let ApprovalsController = class ApprovalsController {
    constructor(approvalsService) {
        this.approvalsService = approvalsService;
    }
    getPendingApprovals(req) {
        return this.approvalsService.getPendingApprovals(req.user.userId);
    }
    getMyApprovals(req) {
        return this.approvalsService.getMyApprovals(req.user.userId);
    }
    async approve(approvalId, body, req) {
        const parts = approvalId.split('_');
        if (parts.length !== 2) {
            throw new Error('Invalid approval ID format');
        }
        const [flyerId, approverId] = parts;
        if (approverId !== req.user.userId) {
            throw new Error('Unauthorized to approve this flyer');
        }
        return this.approvalsService.processApproval(flyerId, approverId, client_1.ApprovalStatus.approved, body.comment);
    }
    async reject(approvalId, body, req) {
        const parts = approvalId.split('_');
        if (parts.length !== 2) {
            throw new Error('Invalid approval ID format');
        }
        const [flyerId, approverId] = parts;
        if (approverId !== req.user.userId) {
            throw new Error('Unauthorized to reject this flyer');
        }
        return this.approvalsService.processApproval(flyerId, approverId, client_1.ApprovalStatus.rejected, body.comment);
    }
};
exports.ApprovalsController = ApprovalsController;
__decorate([
    (0, common_1.Get)('pending'),
    (0, roles_decorator_1.Roles)('approver'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)('approver'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "getMyApprovals", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, roles_decorator_1.Roles)('approver'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, roles_decorator_1.Roles)('approver'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "reject", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, common_1.Controller)('approvals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map