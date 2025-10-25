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
   * Render product slot with new layout:
   * - Black header with product name (8% height)
   * - Left side (45% width): Image + prices
   * - Right side (55% width): Description
   */
  private renderProductSlot(doc: any, x: number, y: number, width: number, height: number, product: any) {
    const padding = 6; // Fixed 6px padding (matches px-2 in React)

    // Black header - matches React: py-1.5 (6px) + text-xs (~12px) + py-1.5 (6px) = ~24px
    const headerHeight = 24;
    doc.rect(x, y, width, headerHeight)
       .fill('#000000');

    // Product name in header - text-xs = 12px font size, centered
    doc.fontSize(9) // Smaller font for better fit in header
       .font('Arial-Bold')
       .fillColor('#FFFFFF')
       .text(product.name, x + padding, y + 6, { // 6px top padding (py-1.5)
         width: width - (padding * 2),
         height: headerHeight - 12, // 6px top + 6px bottom padding
         align: 'center', // Center align text
         ellipsis: true,
         lineBreak: true,
       });

    // Content area below header
    const contentY = y + headerHeight;
    const contentHeight = height - headerHeight;

    // Left side (45% width): Image + prices - matches React layout
    const leftWidth = width * 0.45;
    const leftX = x + 6; // p-2 = 8px, but using 6px for tighter fit
    const leftY = contentY + 6;

    // Image area - flex-1 takes remaining space after prices
    // Prices take roughly: icon (12px if present) + 2 price boxes (20px each) + gaps = ~56px
    const pricesReservedHeight = 56;
    const imageHeight = contentHeight - pricesReservedHeight - 12; // 12px total padding

    if (product.imageData) {
      try {
        const imageBuffer = Buffer.isBuffer(product.imageData)
          ? product.imageData
          : Buffer.from(product.imageData);

        const imageWidth = leftWidth - 12;
        doc.image(imageBuffer, leftX, leftY, {
          fit: [imageWidth, imageHeight],
          align: 'center',
          valign: 'center',
        });
      } catch (error) {
        this.logger.error(`Failed to add product image for ${product.name}: ${error.message}`);
      }
    }

    // Prices area (below image)
    const pricesY = leftY + imageHeight + 4; // mb-1 = 4px gap
    const priceBoxWidth = leftWidth - 12;
    const priceBoxHeight = 20; // Fixed height matching React (py-0.5 + text)

    // Original price (if exists)
    let currentPriceY = pricesY;
    if (product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)) {
      // Gray box for original price - matches bg-gray-200
      doc.rect(leftX, currentPriceY, priceBoxWidth, priceBoxHeight)
         .fill('#E5E7EB');

      doc.fontSize(8) // text-[0.5rem] = 8px
         .font('Arial')
         .fillColor('#6B7280')
         .text('Doporučená cena', leftX, currentPriceY + 2, {
           width: priceBoxWidth,
           align: 'center',
         });

      doc.fontSize(9.6) // text-[0.6rem] = ~9.6px
         .font('Arial-Bold')
         .fillColor('#374151')
         .text(`${parseFloat(product.originalPrice).toFixed(2)} Kč`, leftX, currentPriceY + 10, {
           width: priceBoxWidth,
           align: 'center',
         });

      currentPriceY += priceBoxHeight + 2; // space-y-0.5 = 2px gap
    }

    // Red box for current price - matches bg-red-600
    doc.rect(leftX, currentPriceY, priceBoxWidth, priceBoxHeight)
       .fill('#DC2626');

    const promoText = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)
      ? 'Akční cena Oresi'
      : 'Akční cena';

    doc.fontSize(8) // text-[0.5rem] = 8px
       .font('Arial')
       .fillColor('#FFFFFF')
       .text(promoText, leftX, currentPriceY + 2, {
         width: priceBoxWidth,
         align: 'center',
       });

    doc.fontSize(12) // text-[0.75rem] = 12px
       .font('Arial-Bold')
       .fillColor('#FFFFFF')
       .text(`${parseFloat(product.price).toFixed(2)} Kč`, leftX, currentPriceY + 10, {
         width: priceBoxWidth,
         align: 'center',
       });

    // Right side (55% width): Description
    if (product.description) {
      const rightX = x + leftWidth;
      const rightWidth = width * 0.55;

      doc.fontSize(8.8) // text-[0.55rem] = ~8.8px
         .font('Arial')
         .fillColor('#000000')
         .text(product.description, rightX + 6, leftY, {
           width: rightWidth - 12,
           height: contentHeight - 12,
           lineGap: 1, // leading-tight
         });
    }

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
