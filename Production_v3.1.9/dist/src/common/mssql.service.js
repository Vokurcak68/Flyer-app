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
    async validateEAN(ean, price, originalPrice, actionId) {
        try {
            if (!this.pool || !this.pool.connected) {
                this.logger.warn('MSSQL connection not established, reconnecting...');
                await this.onModuleInit();
            }
            let query = 'SELECT TOP 1 Barcode, AkcniCena, CenaMO, KodDodavatele, Znacka, Kategorie, typ FROM hvw_vok_Oresi_EletakNew_NC WHERE Barcode = @ean';
            if (actionId !== undefined) {
                query += ' AND IDDoklad = @actionId';
            }
            const request = this.pool
                .request()
                .input('ean', sql.VarChar(50), ean);
            if (actionId !== undefined) {
                request.input('actionId', sql.Int, actionId);
            }
            const result = await request.query(query);
            if (result.recordset.length === 0) {
                return { found: false, pricesMatch: false };
            }
            const record = result.recordset[0];
            const erpPrice = parseFloat(record.AkcniCena);
            const erpOriginalPrice = parseFloat(record.CenaMO);
            let erpInstallationType;
            if (record.typ) {
                const typValue = record.typ.toString().trim().toUpperCase();
                if (typValue === 'BI') {
                    erpInstallationType = 'BUILT_IN';
                }
                else if (typValue === 'FS') {
                    erpInstallationType = 'FREESTANDING';
                }
            }
            let pricesMatch = true;
            if (price !== undefined && originalPrice !== undefined) {
                pricesMatch = price === erpPrice && originalPrice === erpOriginalPrice;
            }
            return {
                found: true,
                pricesMatch,
                erpPrice,
                erpOriginalPrice,
                erpProductName: record.KodDodavatele,
                erpBrand: record.Znacka,
                erpCategoryCode: record.Kategorie,
                erpInstallationType,
            };
        }
        catch (error) {
            this.logger.error(`Error validating EAN ${ean}:`, error);
            return { found: false, pricesMatch: false };
        }
    }
    async validateFlyerProducts(products, actionId) {
        const validationErrors = [];
        for (const product of products) {
            const errors = [];
            const validation = await this.validateEAN(product.eanCode, product.price, product.originalPrice, actionId);
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
    async getActions() {
        try {
            if (!this.pool || !this.pool.connected) {
                this.logger.warn('MSSQL connection not established, reconnecting...');
                await this.onModuleInit();
            }
            const result = await this.pool
                .request()
                .query('SELECT ID, PopisDodavky, PlatnostOd, PlatnostDo FROM hvw_vok_Oresi_EletakNew_Akce ORDER BY PopisDodavky');
            return result.recordset.map(record => ({
                id: record.ID,
                name: record.PopisDodavky,
                validFrom: record.PlatnostOd ? new Date(record.PlatnostOd).toISOString().split('T')[0] : undefined,
                validTo: record.PlatnostDo ? new Date(record.PlatnostDo).toISOString().split('T')[0] : undefined,
            }));
        }
        catch (error) {
            this.logger.error('Error fetching actions from ERP:', error);
            return [];
        }
    }
    async checkProductsExistence(eanCodes) {
        try {
            if (!this.pool || !this.pool.connected) {
                this.logger.warn('MSSQL connection not established, reconnecting...');
                await this.onModuleInit();
            }
            if (eanCodes.length === 0) {
                return new Map();
            }
            const eanList = eanCodes.map(ean => `'${ean}'`).join(',');
            const query = `SELECT DISTINCT Barcode, Ukončeno FROM hvw_vok_Oresi_EletakNew_NC WHERE Barcode IN (${eanList})`;
            const result = await this.pool.request().query(query);
            const existenceMap = new Map();
            for (const ean of eanCodes) {
                existenceMap.set(ean, { exists: false, discontinued: true });
            }
            for (const record of result.recordset) {
                existenceMap.set(record.Barcode, {
                    exists: true,
                    discontinued: record.Ukončeno === true || record.Ukončeno === 1,
                });
            }
            return existenceMap;
        }
        catch (error) {
            this.logger.error('Error checking products existence in ERP:', error);
            const errorMap = new Map();
            for (const ean of eanCodes) {
                errorMap.set(ean, { exists: false, discontinued: true });
            }
            return errorMap;
        }
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