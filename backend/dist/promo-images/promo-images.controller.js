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
exports.PromoImagesController = void 0;
const common_1 = require("@nestjs/common");
const promo_images_service_1 = require("./promo-images.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let PromoImagesController = class PromoImagesController {
    constructor(promoImagesService) {
        this.promoImagesService = promoImagesService;
    }
    create(req, dto) {
        return this.promoImagesService.create(req.user.userId, dto);
    }
    findAll(req, filters) {
        return this.promoImagesService.findAll(req.user.userId, req.user.role, filters);
    }
    findBySizeType(sizeType) {
        return this.promoImagesService.findBySizeType(sizeType);
    }
    async getImage(id, res) {
        const promoImage = await this.promoImagesService.findOne(id);
        if (!promoImage.imageData || !promoImage.imageMimeType) {
            throw new common_1.NotFoundException('Promo image not found');
        }
        res.set('Content-Type', promoImage.imageMimeType);
        res.set('Cache-Control', 'public, max-age=31536000');
        res.send(promoImage.imageData);
    }
    findOne(id) {
        return this.promoImagesService.findOne(id);
    }
    remove(id, req) {
        return this.promoImagesService.remove(id, req.user.userId);
    }
};
exports.PromoImagesController = PromoImagesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreatePromoImageDto]),
    __metadata("design:returntype", void 0)
], PromoImagesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.PromoImageFilterDto]),
    __metadata("design:returntype", void 0)
], PromoImagesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('size/:sizeType'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('sizeType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PromoImagesController.prototype, "findBySizeType", null);
__decorate([
    (0, common_1.Get)(':id/image'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromoImagesController.prototype, "getImage", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PromoImagesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('supplier'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PromoImagesController.prototype, "remove", null);
exports.PromoImagesController = PromoImagesController = __decorate([
    (0, common_1.Controller)('promo-images'),
    __metadata("design:paramtypes", [promo_images_service_1.PromoImagesService])
], PromoImagesController);
//# sourceMappingURL=promo-images.controller.js.map