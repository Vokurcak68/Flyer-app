"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const flyers_module_1 = require("./flyers/flyers.module");
const verification_module_1 = require("./verification/verification.module");
const approvals_module_1 = require("./approvals/approvals.module");
const products_module_1 = require("./products/products.module");
const brands_module_1 = require("./brands/brands.module");
const promo_images_module_1 = require("./promo-images/promo-images.module");
const users_module_1 = require("./users/users.module");
const upload_service_1 = require("./common/upload.service");
const upload_controller_1 = require("./common/upload.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            brands_module_1.BrandsModule,
            promo_images_module_1.PromoImagesModule,
            flyers_module_1.FlyersModule,
            verification_module_1.VerificationModule,
            approvals_module_1.ApprovalsModule,
        ],
        controllers: [upload_controller_1.UploadController],
        providers: [upload_service_1.UploadService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map