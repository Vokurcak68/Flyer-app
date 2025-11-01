"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlyersModule = void 0;
const common_1 = require("@nestjs/common");
const flyers_service_1 = require("./flyers.service");
const flyers_controller_1 = require("./flyers.controller");
const pdf_service_1 = require("./pdf.service");
const prisma_module_1 = require("../prisma/prisma.module");
const verification_module_1 = require("../verification/verification.module");
const approvals_module_1 = require("../approvals/approvals.module");
let FlyersModule = class FlyersModule {
};
exports.FlyersModule = FlyersModule;
exports.FlyersModule = FlyersModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, verification_module_1.VerificationModule, (0, common_1.forwardRef)(() => approvals_module_1.ApprovalsModule)],
        controllers: [flyers_controller_1.FlyersController],
        providers: [flyers_service_1.FlyersService, pdf_service_1.PdfService],
        exports: [flyers_service_1.FlyersService],
    })
], FlyersModule);
//# sourceMappingURL=flyers.module.js.map