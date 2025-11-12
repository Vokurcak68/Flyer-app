import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as sql from 'mssql';

@Injectable()
export class MssqlService implements OnModuleInit {
  private readonly logger = new Logger(MssqlService.name);
  private pool: sql.ConnectionPool;

  async onModuleInit() {
    const config: sql.config = {
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
    } catch (error) {
      this.logger.error('Failed to connect to MSSQL database', error);
    }
  }

  async validateEAN(
    ean: string,
    price?: number,
    originalPrice?: number,
    actionId?: number,
  ): Promise<{
    found: boolean;
    pricesMatch: boolean;
    erpPrice?: number;
    erpOriginalPrice?: number;
    erpProductName?: string;
    erpBrand?: string;
    erpCategoryCode?: string;
    erpInstallationType?: 'BUILT_IN' | 'FREESTANDING';
  }> {
    try {
      if (!this.pool || !this.pool.connected) {
        this.logger.warn('MSSQL connection not established, reconnecting...');
        await this.onModuleInit();
      }

      let query = 'SELECT TOP 1 Barcode, AkcniCena, CenaMO, KodDodavatele, Znacka, Kategorie, typ FROM hvw_vok_Oresi_EletakNew_NC WHERE Barcode = @ean';

      // Add ActionID filter if provided
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

      // Map installation type from ERP
      let erpInstallationType: 'BUILT_IN' | 'FREESTANDING' | undefined;

      if (record.typ) {
        const typValue = record.typ.toString().trim().toUpperCase();

        if (typValue === 'BI') {
          erpInstallationType = 'BUILT_IN';
        } else if (typValue === 'FS') {
          erpInstallationType = 'FREESTANDING';
        }
      }

      // Check if prices match (if provided)
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
    } catch (error) {
      this.logger.error(`Error validating EAN ${ean}:`, error);
      return { found: false, pricesMatch: false };
    }
  }

  /**
   * Validate multiple products from flyer
   * Returns array of validation errors for products that failed validation
   */
  async validateFlyerProducts(
    products: Array<{
      id: string;
      name: string;
      eanCode: string;
      price: number;
      originalPrice?: number;
    }>,
    actionId?: number,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      eanCode: string;
      errors: string[];
      erpPrice?: number;
      erpOriginalPrice?: number;
      currentPrice?: number;
      currentOriginalPrice?: number;
    }>
  > {
    const validationErrors = [];

    for (const product of products) {
      const errors: string[] = [];

      const validation = await this.validateEAN(
        product.eanCode,
        product.price,
        product.originalPrice,
        actionId,
      );

      if (!validation.found) {
        errors.push('EAN kód nebyl nalezen v ERP systému');
      } else {
        if (!validation.pricesMatch) {
          // Check which prices don't match
          if (validation.erpPrice !== undefined && product.price !== validation.erpPrice) {
            errors.push(
              `Nesouhlasí akční cena (ERP: ${validation.erpPrice} Kč, Leták: ${product.price} Kč)`,
            );
          }
          if (
            validation.erpOriginalPrice !== undefined &&
            product.originalPrice !== undefined &&
            product.originalPrice !== validation.erpOriginalPrice
          ) {
            errors.push(
              `Nesouhlasí původní cena (ERP: ${validation.erpOriginalPrice} Kč, Leták: ${product.originalPrice} Kč)`,
            );
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

  /**
   * Get all available actions from ERP
   */
  async getActions(): Promise<Array<{ id: number; name: string; validFrom?: string; validTo?: string }>> {
    try {
      if (!this.pool || !this.pool.connected) {
        this.logger.warn('MSSQL connection not established, reconnecting...');
        await this.onModuleInit();
      }

      const result = await this.pool
        .request()
        .query(
          'SELECT ID, PopisDodavky, PlatnostOd, PlatnostDo FROM hvw_vok_Oresi_EletakNew_Akce ORDER BY PopisDodavky',
        );

      return result.recordset.map(record => ({
        id: record.ID,
        name: record.PopisDodavky,
        validFrom: record.PlatnostOd ? new Date(record.PlatnostOd).toISOString().split('T')[0] : undefined,
        validTo: record.PlatnostDo ? new Date(record.PlatnostDo).toISOString().split('T')[0] : undefined,
      }));
    } catch (error) {
      this.logger.error('Error fetching actions from ERP:', error);
      return [];
    }
  }

  /**
   * Check if products exist in ERP by their EAN codes
   * Returns map of EAN -> { exists: boolean, discontinued: boolean }
   */
  async checkProductsExistence(eanCodes: string[]): Promise<Map<string, { exists: boolean; discontinued: boolean }>> {
    try {
      if (!this.pool || !this.pool.connected) {
        this.logger.warn('MSSQL connection not established, reconnecting...');
        await this.onModuleInit();
      }

      if (eanCodes.length === 0) {
        return new Map();
      }

      // Build IN clause for SQL query
      const eanList = eanCodes.map(ean => `'${ean}'`).join(',');
      const query = `SELECT DISTINCT Barcode, Ukončeno FROM hvw_vok_Oresi_EletakNew_NC WHERE Barcode IN (${eanList})`;

      const result = await this.pool.request().query(query);

      // Create map of EAN -> { exists, discontinued }
      const existenceMap = new Map<string, { exists: boolean; discontinued: boolean }>();

      // First, set all EANs as not found
      for (const ean of eanCodes) {
        existenceMap.set(ean, { exists: false, discontinued: true });
      }

      // Update with found EANs and their discontinued status
      for (const record of result.recordset) {
        existenceMap.set(record.Barcode, {
          exists: true,
          discontinued: record.Ukončeno === true || record.Ukončeno === 1,
        });
      }

      return existenceMap;
    } catch (error) {
      this.logger.error('Error checking products existence in ERP:', error);
      // Return all as not found/discontinued on error
      const errorMap = new Map<string, { exists: boolean; discontinued: boolean }>();
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
}
