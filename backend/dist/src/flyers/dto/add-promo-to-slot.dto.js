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
exports.AddPromoToSlotDto = exports.PromoSlotSize = void 0;
const class_validator_1 = require("class-validator");
var PromoSlotSize;
(function (PromoSlotSize) {
    PromoSlotSize["SINGLE"] = "single";
    PromoSlotSize["HORIZONTAL"] = "horizontal";
    PromoSlotSize["SQUARE"] = "square";
    PromoSlotSize["FULL_PAGE"] = "full_page";
})(PromoSlotSize || (exports.PromoSlotSize = PromoSlotSize = {}));
class AddPromoToSlotDto {
}
exports.AddPromoToSlotDto = AddPromoToSlotDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddPromoToSlotDto.prototype, "promoImageId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(7),
    __metadata("design:type", Number)
], AddPromoToSlotDto.prototype, "anchorSlotPosition", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PromoSlotSize),
    __metadata("design:type", String)
], AddPromoToSlotDto.prototype, "promoSize", void 0);
//# sourceMappingURL=add-promo-to-slot.dto.js.map