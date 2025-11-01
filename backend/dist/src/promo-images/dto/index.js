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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoImageFilterDto = exports.CreatePromoImageDto = void 0;
const class_validator_1 = require("class-validator");
class CreatePromoImageDto {
}
exports.CreatePromoImageDto = CreatePromoImageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromoImageDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromoImageDto.prototype, "imageData", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromoImageDto.prototype, "imageMimeType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['single', 'horizontal', 'square', 'full_page', 'footer']),
    __metadata("design:type", String)
], CreatePromoImageDto.prototype, "defaultSize", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromoImageDto.prototype, "brandId", void 0);
class PromoImageFilterDto {
}
exports.PromoImageFilterDto = PromoImageFilterDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PromoImageFilterDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['full', 'half', 'quarter', 'eighth']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PromoImageFilterDto.prototype, "sizeType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PromoImageFilterDto.prototype, "search", void 0);
//# sourceMappingURL=index.js.map