"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoImagesModule = void 0;
const common_1 = require("@nestjs/common");
const promo_images_service_1 = require("./promo-images.service");
const promo_images_controller_1 = require("./promo-images.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let PromoImagesModule = class PromoImagesModule {
};
exports.PromoImagesModule = PromoImagesModule;
exports.PromoImagesModule = PromoImagesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [promo_images_controller_1.PromoImagesController],
        providers: [promo_images_service_1.PromoImagesService],
        exports: [promo_images_service_1.PromoImagesService],
    })
], PromoImagesModule);
//# sourceMappingURL=promo-images.module.js.map