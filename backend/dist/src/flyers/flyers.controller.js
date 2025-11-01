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
exports.FlyersController = void 0;
const common_1 = require("@nestjs/common");
const flyers_service_1 = require("./flyers.service");
const pdf_service_1 = require("./pdf.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let FlyersController = class FlyersController {
    constructor(flyersService, pdfService) {
        this.flyersService = flyersService;
        this.pdfService = pdfService;
    }
    create(createFlyerDto, req) {
        console.log('🔍 Create flyer - req.user:', req.user);
        console.log('🔍 Create flyer - userId:', req.user.userId);
        return this.flyersService.create(createFlyerDto, req.user.userId);
    }
    findAll(filterDto, req) {
        return this.flyersService.findAll(filterDto, req.user.userId, req.user.role);
    }
    async getActiveFlyers(req) {
        const activeFlyers = await this.flyersService.getActiveFlyers(req.user.userId, req.user.role);
        return activeFlyers;
    }
    findOne(id, req) {
        return this.flyersService.findOne(id, req.user.userId, req.user.role);
    }
    update(id, updateFlyerDto, req) {
        return this.flyersService.update(id, updateFlyerDto, req.user.userId, req.user.role);
    }
    remove(id, req) {
        return this.flyersService.remove(id, req.user.userId, req.user.role);
    }
    addPage(flyerId, addPageDto, req) {
        return this.flyersService.addPage(flyerId, addPageDto, req.user.userId);
    }
    removePage(pageId, req) {
        return this.flyersService.removePage(pageId, req.user.userId);
    }
    addProductToPage(pageId, addProductDto, req) {
        return this.flyersService.addProductToPage(pageId, addProductDto, req.user.userId);
    }
    removeProductFromPage(productId, req) {
        return this.flyersService.removeProductFromPage(productId, req.user.userId);
    }
    updateProductPosition(productId, updatePositionDto, req) {
        return this.flyersService.updateProductPosition(productId, updatePositionDto, req.user.userId);
    }
    submitForVerification(flyerId, req) {
        return this.flyersService.submitForVerification(flyerId, req.user.userId);
    }
    getPreview(flyerId, req) {
        return this.flyersService.getPreview(flyerId, req.user.userId, req.user.role);
    }
    autoSave(flyerId, req) {
        return this.flyersService.autoSave(flyerId, req.user.userId);
    }
    async getPdf(id, res, req) {
        const flyer = await this.flyersService.findOne(id, req.user.userId, req.user.role);
        if (!flyer.pdfData || !flyer.pdfMimeType) {
            throw new common_1.NotFoundException('Flyer PDF not found');
        }
        res.set('Content-Type', flyer.pdfMimeType);
        res.set('Content-Disposition', `attachment; filename="${flyer.name}.pdf"`);
        res.set('Cache-Control', 'public, max-age=31536000');
        res.send(flyer.pdfData);
    }
    async generatePDF(flyerId, req) {
        const flyer = await this.flyersService.findOneForPdf(flyerId, req.user.userId, req.user.role);
        const pdfData = await this.pdfService.generateFlyerPDF(flyer);
        await this.flyersService.update(flyerId, { pdfData, pdfMimeType: 'application/pdf' }, req.user.userId, req.user.role);
        return {
            success: true,
            message: 'PDF generated successfully',
        };
    }
};
exports.FlyersController = FlyersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateFlyerDto, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.FlyerFilterDto, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, roles_decorator_1.Roles)('end_user'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FlyersController.prototype, "getActiveFlyers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateFlyerDto, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/pages'),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddPageDto, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "addPage", null);
__decorate([
    (0, common_1.Delete)('pages/:pageId'),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('pageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "removePage", null);
__decorate([
    (0, common_1.Post)('pages/:pageId/products'),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('pageId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddProductToPageDto, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "addProductToPage", null);
__decorate([
    (0, common_1.Delete)('pages/products/:productId'),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "removeProductFromPage", null);
__decorate([
    (0, common_1.Patch)('pages/products/:id/position'),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateProductPositionDto, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "updateProductPosition", null);
__decorate([
    (0, common_1.Post)(':id/submit-for-verification'),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "submitForVerification", null);
__decorate([
    (0, common_1.Get)(':id/preview'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "getPreview", null);
__decorate([
    (0, common_1.Post)(':id/auto-save'),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FlyersController.prototype, "autoSave", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FlyersController.prototype, "getPdf", null);
__decorate([
    (0, common_1.Post)(':id/generate-pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FlyersController.prototype, "generatePDF", null);
exports.FlyersController = FlyersController = __decorate([
    (0, common_1.Controller)('flyers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [flyers_service_1.FlyersService,
        pdf_service_1.PdfService])
], FlyersController);
//# sourceMappingURL=flyers.controller.js.map