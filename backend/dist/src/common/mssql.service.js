"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MssqlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MssqlService = void 0;
const common_1 = require("@nestjs/common");
const sql = require("mssql");
let MssqlService = MssqlService_1 = class MssqlService {
    constructor() {
        this.logger = new common_1.Logger(MssqlService_1.name);
    }
    async onModuleInit() {
        const config = {
            server: process.env.ERP_DB_SERVER,
            database: process.env.ERP_DB_NAME,
            user: process.env.ERP_DB_USER,
            password: process.env.ERP_DB_PASSWORD,
            options: {
                encrypt: process.env.ERP_DB_ENCRYPT === 'true',
                trustServerCertificate: true,
                enableArithAbort: true,
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000,
            },
        };
        try {
            this.pool = await sql.connect(config);
            this.logger.log('MSSQL connection established successfully');
        }
        catch (error) {
            this.logger.error('Failed to connect to MSSQL database', error);
        }
    }
    async validateEAN(ean, price, originalPrice) {
        try {
            if (!this.pool || !this.pool.connected) {
                this.logger.warn('MSSQL connection not established, reconnecting...');
                await this.onModuleInit();
            }
            const result = await this.pool
                .request()
                .input('ean', sql.VarChar(50), ean)
                .query('SELECT TOP 1 BarCode, AkcniCena, CenaMO FROM hvw_vok_Oresi_EletakNew WHERE BarCode = @ean');
            if (result.recordset.length === 0) {
                return { found: false, pricesMatch: false };
            }
            const record = result.recordset[0];
            const erpPrice = parseFloat(record.AkcniCena);
            const erpOriginalPrice = parseFloat(record.CenaMO);
            let pricesMatch = true;
            if (price !== undefined && originalPrice !== undefined) {
                pricesMatch = price === erpPrice && originalPrice === erpOriginalPrice;
            }
            return {
                found: true,
                pricesMatch,
                erpPrice,
                erpOriginalPrice,
            };
        }
        catch (error) {
            this.logger.error(`Error validating EAN ${ean}:`, error);
            return { found: false, pricesMatch: false };
        }
    }
    async validateFlyerProducts(products) {
        const validationErrors = [];
        for (const product of products) {
            const errors = [];
            const validation = await this.validateEAN(product.eanCode, product.price, product.originalPrice);
            if (!validation.found) {
                errors.push('EAN kód nebyl nalezen v ERP systému');
            }
            else {
                if (!validation.pricesMatch) {
                    if (validation.erpPrice !== undefined && product.price !== validation.erpPrice) {
                        errors.push(`Nesouhlasí akční cena (ERP: ${validation.erpPrice} Kč, Leták: ${product.price} Kč)`);
                    }
                    if (validation.erpOriginalPrice !== undefined &&
                        product.originalPrice !== undefined &&
                        product.originalPrice !== validation.erpOriginalPrice) {
                        errors.push(`Nesouhlasí původní cena (ERP: ${validation.erpOriginalPrice} Kč, Leták: ${product.originalPrice} Kč)`);
                    }
                }
            }
            if (errors.length > 0) {
                validationErrors.push({
                    productId: product.id,
                    productName: product.name,
                    eanCode: product.eanCode,
                    errors,
                    erpPrice: validation.erpPrice,
                    erpOriginalPrice: validation.erpOriginalPrice,
                    currentPrice: product.price,
                    currentOriginalPrice: product.originalPrice,
                });
            }
        }
        return validationErrors;
    }
    async onModuleDestroy() {
        if (this.pool) {
            await this.pool.close();
            this.logger.log('MSSQL connection closed');
        }
    }
};
exports.MssqlService = MssqlService;
exports.MssqlService = MssqlService = MssqlService_1 = __decorate([
    (0, common_1.Injectable)()
], MssqlService);
//# sourceMappingURL=mssql.service.js.map