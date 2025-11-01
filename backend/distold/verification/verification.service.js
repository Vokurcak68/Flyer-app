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
var VerificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const sql = require("mssql");
let VerificationService = VerificationService_1 = class VerificationService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(VerificationService_1.name);
        this.erpPool = null;
    }
    async getERPConnection() {
        if (this.erpPool && this.erpPool.connected) {
            return this.erpPool;
        }
        const config = {
            server: this.configService.get('ERP_DB_SERVER') || 'localhost',
            database: this.configService.get('ERP_DB_NAME') || 'ERP',
            user: this.configService.get('ERP_DB_USER') || 'sa',
            password: this.configService.get('ERP_DB_PASSWORD') || '',
            options: {
                encrypt: this.configService.get('ERP_DB_ENCRYPT') || false,
                trustServerCertificate: true,
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000,
            },
        };
        try {
            this.erpPool = await new sql.ConnectionPool(config).connect();
            this.logger.log('Connected to ERP MSSQL database');
            return this.erpPool;
        }
        catch (error) {
            this.logger.error('Failed to connect to ERP database', error);
            throw error;
        }
    }
    async getERPProductByEAN(eanCode) {
        try {
            const pool = await this.getERPConnection();
            const result = await pool
                .request()
                .input('eanCode', sql.VarChar, eanCode)
                .query(`
          SELECT
            EAN,
            Price,
            Name,
            IsActive
          FROM Products
          WHERE EAN = @eanCode
        `);
            if (result.recordset.length > 0) {
                return result.recordset[0];
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Error querying ERP for EAN ${eanCode}`, error);
            return null;
        }
    }
    async verifyProduct(product) {
        const erpProduct = await this.getERPProductByEAN(product.eanCode);
        if (!erpProduct) {
            return {
                productId: product.id,
                eanCode: product.eanCode,
                issue: 'EAN code not found in ERP system',
            };
        }
        if (!erpProduct.IsActive) {
            return {
                productId: product.id,
                eanCode: product.eanCode,
                issue: 'Product is inactive in ERP system',
            };
        }
        const productPrice = parseFloat(product.price.toString());
        const erpPrice = parseFloat(erpProduct.Price.toString());
        if (Math.abs(productPrice - erpPrice) > 0.01) {
            return {
                productId: product.id,
                eanCode: product.eanCode,
                issue: 'Price mismatch with ERP system',
                expectedPrice: erpPrice,
                actualPrice: productPrice,
            };
        }
        return null;
    }
    async verifyFlyer(flyerId) {
        try {
            const flyer = await this.prisma.flyer.findUnique({
                where: { id: flyerId },
                include: {
                    pages: {
                        include: {
                            slots: {
                                include: {
                                    product: {
                                        include: {
                                            brand: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!flyer) {
                throw new Error('Flyer not found');
            }
            const productsMap = new Map();
            for (const page of flyer.pages) {
                for (const slot of page.slots) {
                    if (slot.product && !productsMap.has(slot.product.id)) {
                        productsMap.set(slot.product.id, slot.product);
                    }
                }
            }
            const products = Array.from(productsMap.values());
            const issues = [];
            this.logger.log(`Verifying ${products.length} products for flyer ${flyerId}`);
            for (const product of products) {
                const issue = await this.verifyProduct(product);
                if (issue) {
                    issues.push(issue);
                }
            }
            const status = issues.length === 0
                ? client_1.VerificationStatus.success
                : client_1.VerificationStatus.failed;
            const verificationLog = await this.prisma.verificationLog.create({
                data: {
                    flyerId,
                    verificationDate: new Date(),
                    status,
                    details: JSON.parse(JSON.stringify({
                        productsVerified: products.length,
                        issuesFound: issues.length,
                        issues: issues,
                        erpConnected: this.erpPool?.connected || false,
                        timestamp: new Date().toISOString(),
                    })),
                },
            });
            this.logger.log(`Flyer ${flyerId} verification ${status}: ${issues.length} issues found`);
            return {
                status: verificationLog.status,
                details: verificationLog.details,
            };
        }
        catch (error) {
            this.logger.error(`Flyer verification failed for ${flyerId}`, error);
            const verificationLog = await this.prisma.verificationLog.create({
                data: {
                    flyerId,
                    verificationDate: new Date(),
                    status: client_1.VerificationStatus.failed,
                    details: {
                        error: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString(),
                    },
                },
            });
            return {
                status: verificationLog.status,
                details: verificationLog.details,
            };
        }
    }
    async getVerificationLogs(flyerId) {
        return this.prisma.verificationLog.findMany({
            where: { flyerId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async testERPConnection() {
        try {
            const pool = await this.getERPConnection();
            const result = await pool.request().query('SELECT @@VERSION AS Version');
            return {
                connected: true,
                message: 'Successfully connected to ERP database',
                serverInfo: result.recordset[0],
            };
        }
        catch (error) {
            return {
                connected: false,
                message: `Failed to connect to ERP database: ${error.message}`,
            };
        }
    }
    async closeERPConnection() {
        if (this.erpPool) {
            await this.erpPool.close();
            this.erpPool = null;
            this.logger.log('ERP connection closed');
        }
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = VerificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map