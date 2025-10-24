import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';
import * as sql from 'mssql';

interface ERPProduct {
  EAN: string;
  Price: number;
  Name: string;
  IsActive: boolean;
}

interface VerificationIssue {
  productId: string;
  eanCode: string;
  issue: string;
  expectedPrice?: number;
  actualPrice?: number;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private erpPool: sql.ConnectionPool | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Get or create MSSQL connection pool
   */
  private async getERPConnection(): Promise<sql.ConnectionPool> {
    if (this.erpPool && this.erpPool.connected) {
      return this.erpPool;
    }

    const config: sql.config = {
      server: this.configService.get<string>('ERP_DB_SERVER') || 'localhost',
      database: this.configService.get<string>('ERP_DB_NAME') || 'ERP',
      user: this.configService.get<string>('ERP_DB_USER') || 'sa',
      password: this.configService.get<string>('ERP_DB_PASSWORD') || '',
      options: {
        encrypt: this.configService.get<boolean>('ERP_DB_ENCRYPT') || false,
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
    } catch (error) {
      this.logger.error('Failed to connect to ERP database', error);
      throw error;
    }
  }

  /**
   * Query ERP database for product by EAN
   */
  private async getERPProductByEAN(eanCode: string): Promise<ERPProduct | null> {
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
        return result.recordset[0] as ERPProduct;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error querying ERP for EAN ${eanCode}`, error);
      // If ERP is not available, we'll handle it gracefully
      return null;
    }
  }

  /**
   * Verify single product against ERP
   */
  private async verifyProduct(product: any): Promise<VerificationIssue | null> {
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

    // Convert Decimal to number for comparison
    const productPrice = parseFloat(product.price.toString());
    const erpPrice = parseFloat(erpProduct.Price.toString());

    // Allow 0.01 difference for floating point precision
    if (Math.abs(productPrice - erpPrice) > 0.01) {
      return {
        productId: product.id,
        eanCode: product.eanCode,
        issue: 'Price mismatch with ERP system',
        expectedPrice: erpPrice,
        actualPrice: productPrice,
      };
    }

    return null; // No issues
  }

  /**
   * Verify entire flyer against ERP system
   * Checks:
   * 1. All products exist in ERP (by EAN)
   * 2. All prices match ERP prices
   * 3. All products are active in ERP
   */
  async verifyFlyer(flyerId: string): Promise<{
    status: VerificationStatus;
    details: any;
  }> {
    try {
      // Get flyer with all pages and products
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

      // Collect all unique products from all pages
      const productsMap = new Map();
      for (const page of flyer.pages) {
        for (const slot of page.slots) {
          if (slot.product && !productsMap.has(slot.product.id)) {
            productsMap.set(slot.product.id, slot.product);
          }
        }
      }

      const products = Array.from(productsMap.values());
      const issues: VerificationIssue[] = [];

      this.logger.log(`Verifying ${products.length} products for flyer ${flyerId}`);

      // Verify each product
      for (const product of products) {
        const issue = await this.verifyProduct(product);
        if (issue) {
          issues.push(issue);
        }
      }

      // Determine verification status
      const status = issues.length === 0
        ? VerificationStatus.success
        : VerificationStatus.failed;

      // Create verification log
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

      this.logger.log(
        `Flyer ${flyerId} verification ${status}: ${issues.length} issues found`,
      );

      return {
        status: verificationLog.status,
        details: verificationLog.details,
      };
    } catch (error) {
      this.logger.error(`Flyer verification failed for ${flyerId}`, error);

      // Create failed verification log
      const verificationLog = await this.prisma.verificationLog.create({
        data: {
          flyerId,
          verificationDate: new Date(),
          status: VerificationStatus.failed,
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

  /**
   * Get verification logs for a flyer
   */
  async getVerificationLogs(flyerId: string) {
    return this.prisma.verificationLog.findMany({
      where: { flyerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Test ERP connection
   */
  async testERPConnection(): Promise<{
    connected: boolean;
    message: string;
    serverInfo?: any;
  }> {
    try {
      const pool = await this.getERPConnection();
      const result = await pool.request().query('SELECT @@VERSION AS Version');

      return {
        connected: true,
        message: 'Successfully connected to ERP database',
        serverInfo: result.recordset[0],
      };
    } catch (error) {
      return {
        connected: false,
        message: `Failed to connect to ERP database: ${error.message}`,
      };
    }
  }

  /**
   * Close ERP connection (for cleanup)
   */
  async closeERPConnection() {
    if (this.erpPool) {
      await this.erpPool.close();
      this.erpPool = null;
      this.logger.log('ERP connection closed');
    }
  }
}
