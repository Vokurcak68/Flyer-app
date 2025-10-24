import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly uploadsDir: string;

  constructor(private configService: ConfigService) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    try {
      fs.accessSync(this.uploadsDir);
    } catch {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      this.logger.log(`Created uploads directory: ${this.uploadsDir}`);
    }
  }

  /**
   * Generate PDF for a flyer using PDFKit with 2x4 slot-based layout
   */
  async generateFlyerPDF(flyer: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        this.logger.log(`Generating PDF for flyer ${flyer.id}`);
        this.logger.log(`Flyer structure: pages count = ${flyer.pages?.length || 0}`);

        const filename = `flyer-${flyer.id}-${Date.now()}.pdf`;
        const filepath = path.join(this.uploadsDir, filename);

        // Create PDF document with no margins for full-bleed layout
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          autoFirstPage: false,
        });

        // Register Arial font for Czech characters support
        try {
          const arialPath = 'C:\\Windows\\Fonts\\arial.ttf';
          const arialBoldPath = 'C:\\Windows\\Fonts\\arialbd.ttf';

          if (fs.existsSync(arialPath)) {
            doc.registerFont('Arial', arialPath);
          }
          if (fs.existsSync(arialBoldPath)) {
            doc.registerFont('Arial-Bold', arialBoldPath);
          }
        } catch (error) {
          this.logger.warn(`Could not register Arial font: ${error.message}`);
        }

        // Collect PDF data in buffer
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          // Also save to file
          fs.writeFileSync(filepath, pdfBuffer);
          this.logger.log(`PDF generated successfully: ${filename}`);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Generate pages
        const pages = flyer.pages.sort((a: any, b: any) => a.pageNumber - b.pageNumber);

        pages.forEach((page: any) => {
          // Add new page
          doc.addPage();

          // Render 2x4 slot grid (full bleed, no header)
          this.renderSlotGrid(doc, page);
        });

        // Finalize PDF
        doc.end();

      } catch (error) {
        this.logger.error(`Failed to generate PDF for flyer ${flyer.id}`, error);
        reject(new Error(`PDF generation failed: ${error.message}`));
      }
    });
  }

  /**
   * Render 2x4 slot grid (8 slots total)
   * Layout: 2 columns x 4 rows
   * Full bleed layout - no margins, no gaps
   * Page 1: Has 2cm footer for promo image
   */
  private renderSlotGrid(doc: any, page: any) {
    const startX = 0;
    const startY = 0;
    const pageWidth = 595; // A4 width in points (210mm)
    const pageHeight = 842; // A4 height in points (297mm)
    const footerHeight = 57; // 2cm in points (20mm ≈ 57 points)

    const cols = 2;
    const rows = 4;
    const gap = 0; // No gaps between slots

    // Page 1 has footer, other pages don't
    const isFirstPage = page.pageNumber === 1;
    const availableHeight = isFirstPage ? pageHeight - footerHeight : pageHeight;

    const slotWidth = pageWidth / cols;
    const slotHeight = availableHeight / rows;

    this.logger.log(`Rendering 2x4 grid (page ${page.pageNumber}): slotWidth=${slotWidth}, slotHeight=${slotHeight}, hasFooter=${isFirstPage}`);

    // Get slots for this page (8 slots indexed 0-7)
    const slots = page.slots || new Array(8).fill(null);

    // DEBUG: Log slot types
    this.logger.log(`Page ${page.pageNumber} slots debug:`);
    slots.forEach((slot: any, i: number) => {
      if (slot && slot.type !== 'empty') {
        this.logger.log(`  Slot ${i}: type=${slot.type}, hasPromo=${!!slot.promoImage}, promoSize=${slot.promoSize}, promoId=${slot.promoImage?.id}, hasPromoImageData=${!!slot.promoImage?.imageData}`);
      }
    });

    // Track which slots are already rendered (for multi-slot promos)
    const renderedSlots = new Set<number>();

    // Render each slot
    for (let position = 0; position < 8; position++) {
      if (renderedSlots.has(position)) {
        continue; // Skip already rendered slots (part of multi-slot promo)
      }

      const slot = slots[position];
      const row = Math.floor(position / cols);
      const col = position % cols;
      const x = startX + col * (slotWidth + gap);
      const y = startY + row * (slotHeight + gap);

      if (!slot || slot.type === 'empty') {
        // Render empty slot
        this.renderEmptySlot(doc, x, y, slotWidth, slotHeight);
      } else if (slot.type === 'product' && slot.product) {
        // Render product slot
        this.renderProductSlot(doc, x, y, slotWidth, slotHeight, slot.product);
      } else if (slot.type === 'promo' && slot.promoImage) {
        // Render promo slot (may span multiple slots)
        const spannedSlots = this.getPromoSpannedSlots(position, slot.promoSize);
        spannedSlots.forEach(pos => renderedSlots.add(pos));

        const promoWidth = this.getPromoWidth(slot.promoSize, slotWidth);
        const promoHeight = this.getPromoHeight(slot.promoSize, slotHeight);

        this.renderPromoSlot(doc, x, y, promoWidth, promoHeight, slot.promoImage);
      }
    }

    // Render footer promo on page 1 if present
    if (isFirstPage && page.footerPromoImage) {
      const footerY = availableHeight;
      this.renderPromoSlot(doc, 0, footerY, pageWidth, footerHeight, page.footerPromoImage);
      this.logger.log(`Rendered footer promo on page 1: ${page.footerPromoImage.name}`);
    }
  }

  /**
   * Render empty slot (no border, just white space)
   */
  private renderEmptySlot(_doc: any, _x: number, _y: number, _width: number, _height: number) {
    // Just leave empty - no border, no fill
  }

  /**
   * Render product slot (no border)
   */
  private renderProductSlot(doc: any, x: number, y: number, width: number, height: number, product: any) {
    // Add product image
    if (product.imageData) {
      try {
        const imageBuffer = Buffer.isBuffer(product.imageData)
          ? product.imageData
          : Buffer.from(product.imageData);

        doc.image(imageBuffer, x + 5, y + 5, {
          fit: [width - 10, height - 80],
          align: 'center',
        });
      } catch (error) {
        this.logger.error(`Failed to add product image for ${product.name}: ${error.message}`);
      }
    }

    // Add product info
    const infoY = y + height - 70;
    doc.fontSize(10)
       .font('Arial-Bold')
       .fillColor('#000')
       .text(product.name, x + 5, infoY, {
         width: width - 10,
         height: 25,
         ellipsis: true,
       });

    // Add price
    const priceY = infoY + 28;
    if (product.originalPrice && parseFloat(product.originalPrice) > 0) {
      doc.fontSize(8)
         .font('Arial')
         .fillColor('#999')
         .text(`${parseFloat(product.originalPrice).toFixed(2)} Kč`, x + 5, priceY);
    }

    doc.fontSize(13)
       .font('Arial-Bold')
       .fillColor('#e74c3c')
       .text(`${parseFloat(product.price).toFixed(2)} Kč`, x + 5, priceY + 12);

    // Reset color
    doc.fillColor('#000');
  }

  /**
   * Render promo image slot (can span multiple slots)
   * Full bleed - no borders, no padding
   */
  private renderPromoSlot(doc: any, x: number, y: number, width: number, height: number, promoImage: any) {
    // Add promo image (full bleed, no padding)
    if (promoImage.imageData) {
      try {
        const imageBuffer = Buffer.isBuffer(promoImage.imageData)
          ? promoImage.imageData
          : Buffer.from(promoImage.imageData);

        // Use exact width and height to fill entire area without white space
        doc.image(imageBuffer, x, y, {
          width: width,
          height: height,
        });
      } catch (error) {
        this.logger.error(`Failed to add promo image: ${error.message}`);
      }
    }
  }

  /**
   * Get slots spanned by promo image based on size
   */
  private getPromoSpannedSlots(anchorPosition: number, promoSize: string): number[] {
    const slots: number[] = [anchorPosition];

    switch (promoSize) {
      case 'single':
        // 1 slot (1x1)
        return slots;

      case 'horizontal':
        // 2 slots horizontal (2x1)
        // anchorPosition + 1 (next column)
        slots.push(anchorPosition + 1);
        return slots;

      case 'square':
        // 4 slots (2x2)
        // anchorPosition, +1 (next col), +2 (next row same col), +3 (next row next col)
        slots.push(anchorPosition + 1);
        slots.push(anchorPosition + 2);
        slots.push(anchorPosition + 3);
        return slots;

      case 'full_page':
        // All 8 slots
        return [0, 1, 2, 3, 4, 5, 6, 7];

      default:
        return slots;
    }
  }

  /**
   * Get promo width based on size (no gaps in full bleed layout)
   */
  private getPromoWidth(promoSize: string, slotWidth: number): number {
    switch (promoSize) {
      case 'single':
        return slotWidth;
      case 'horizontal':
      case 'square':
      case 'full_page':
        return slotWidth * 2; // 2 columns, no gap
      default:
        return slotWidth;
    }
  }

  /**
   * Get promo height based on size (no gaps in full bleed layout)
   */
  private getPromoHeight(promoSize: string, slotHeight: number): number {
    switch (promoSize) {
      case 'single':
      case 'horizontal':
        return slotHeight;
      case 'square':
        return slotHeight * 2; // 2 rows, no gap
      case 'full_page':
        return slotHeight * 4; // 4 rows, no gap
      default:
        return slotHeight;
    }
  }

  /**
   * Delete PDF file
   */
  async deletePDF(pdfUrl: string): Promise<void> {
    try {
      const filename = path.basename(pdfUrl);
      const filepath = path.join(this.uploadsDir, filename);
      fs.unlinkSync(filepath);
      this.logger.log(`PDF deleted: ${filename}`);
    } catch (error) {
      this.logger.warn(`Failed to delete PDF ${pdfUrl}`, error);
    }
  }
}
