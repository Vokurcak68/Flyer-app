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
  ): Promise<{
    found: boolean;
    pricesMatch: boolean;
    erpPrice?: number;
    erpOriginalPrice?: number;
  }> {
    try {
      if (!this.pool || !this.pool.connected) {
        this.logger.warn('MSSQL connection not established, reconnecting...');
        await this.onModuleInit();
      }

      const result = await this.pool
        .request()
        .input('ean', sql.VarChar(50), ean)
        .query(
          'SELECT TOP 1 BarCode, AkcniCena, CenaMO FROM hvw_vok_Oresi_EletakNew WHERE BarCode = @ean',
        );

      if (result.recordset.length === 0) {
        return { found: false, pricesMatch: false };
      }

      const record = result.recordset[0];
      const erpPrice = parseFloat(record.AkcniCena);
      const erpOriginalPrice = parseFloat(record.CenaMO);

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
      };
    } catch (error) {
      this.logger.error(`Error validating EAN ${ean}:`, error);
      return { found: false, pricesMatch: false };
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.close();
      this.logger.log('MSSQL connection closed');
    }
  }
}
