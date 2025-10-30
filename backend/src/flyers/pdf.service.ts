import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

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
   * Convert and optimize image for PDF (compress and resize if needed)
   */
  private async convertImageToPNG(imageBuffer: Buffer, maxWidth: number = 800): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // Resize if image is too large (maintain aspect ratio)
      if (metadata.width && metadata.width > maxWidth) {
        image.resize(maxWidth, null, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert to JPEG with quality 85 for much smaller file size
      // JPEG is better for photos/product images and creates smaller PDFs
      return await image
        .jpeg({
          quality: 85,
          mozjpeg: true, // Use MozJPEG for better compression
        })
        .toBuffer();
    } catch (error) {
      this.logger.error(`Failed to convert image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate PDF for a flyer using PDFKit with 2x4 slot-based layout
   */
  async generateFlyerPDF(flyer: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        this.logger.log(`Generating PDF for flyer ${flyer.id}`);
        this.logger.log(`Flyer structure: pages count = ${flyer.pages?.length || 0}`);

        const filename = `flyer-${flyer.id}-${Date.now()}.pdf`;
        const filepath = path.join(this.uploadsDir, filename);

        // Create PDF document with no margins for full-bleed layout and compression
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          autoFirstPage: false,
          compress: true, // Enable PDF compression
        });

        // Register fonts for Czech characters support
        try {
          const arialPath = 'C:\\Windows\\Fonts\\arial.ttf';
          const arialBoldPath = 'C:\\Windows\\Fonts\\arialbd.ttf';
          const arialNarrowPath = 'C:\\Windows\\Fonts\\arialn.ttf';
          const vodafoneRgPath = 'C:\\Windows\\Fonts\\VodafoneRg.ttf';
          const vodafoneRgBdPath = 'C:\\Windows\\Fonts\\VodafoneRgBd.ttf';
          const vodafoneLtPath = 'C:\\Windows\\Fonts\\VodafoneLt.ttf';

          if (fs.existsSync(arialPath)) {
            doc.registerFont('Arial', arialPath);
          }
          if (fs.existsSync(arialBoldPath)) {
            doc.registerFont('Arial-Bold', arialBoldPath);
          }
          if (fs.existsSync(arialNarrowPath)) {
            doc.registerFont('Arial-Narrow', arialNarrowPath);
          }
          if (fs.existsSync(vodafoneRgPath)) {
            doc.registerFont('Vodafone-Rg', vodafoneRgPath);
          }
          if (fs.existsSync(vodafoneRgBdPath)) {
            doc.registerFont('Vodafone-Rg-Bold', vodafoneRgBdPath);
          }
          if (fs.existsSync(vodafoneLtPath)) {
            doc.registerFont('Vodafone-Lt', vodafoneLtPath);
          }
        } catch (error) {
          this.logger.warn(`Could not register fonts: ${error.message}`);
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

        for (const page of pages) {
          // Add new page
          doc.addPage();

          // Render 2x4 slot grid (full bleed, no header)
          await this.renderSlotGrid(doc, page);
        }

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
   * Layout with small gaps between slots (3 points ≈ 1mm)
   * Page 1: Has 2cm footer for promo image - only first row (2 slots) is smaller
   */
  private async renderSlotGrid(doc: any, page: any) {
    const startX = 0;
    const startY = 0;
    const pageWidth = 595; // A4 width in points (210mm)
    const pageHeight = 842; // A4 height in points (297mm)
    const footerHeight = 57; // 2cm in points (20mm ≈ 57 points)

    const cols = 2;
    const rows = 4;
    const gap = 3; // Small gap between slots (3 points ≈ 1mm)

    // Page 1 has footer, other pages don't
    const isFirstPage = page.pageNumber === 1;

    // Calculate slot dimensions accounting for gaps
    // Total width = slotWidth * cols + gap * (cols - 1)
    const slotWidth = (pageWidth - gap * (cols - 1)) / cols;

    // On page 1: first row is smaller (footer takes space), other 3 rows are normal
    // On other pages: all 4 rows are equal
    let firstRowHeight: number;
    let normalRowHeight: number;

    if (isFirstPage) {
      // Normal row height (same as page 2)
      normalRowHeight = (pageHeight - gap * (rows - 1)) / rows;
      // Available space for first row = total - footer - 3 normal rows - gaps
      firstRowHeight = pageHeight - footerHeight - (3 * normalRowHeight) - gap * (rows - 1);
    } else {
      // All rows equal height
      normalRowHeight = (pageHeight - gap * (rows - 1)) / rows;
      firstRowHeight = normalRowHeight;
    }

    this.logger.log(`Rendering 2x4 grid (page ${page.pageNumber}): slotWidth=${slotWidth}, firstRowHeight=${firstRowHeight}, normalRowHeight=${normalRowHeight}, hasFooter=${isFirstPage}`);

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

      // Calculate position and height based on row
      const x = startX + col * (slotWidth + gap);
      let y: number;
      let slotHeight: number;

      if (row === 0) {
        // First row
        y = startY;
        slotHeight = firstRowHeight;
      } else {
        // Other rows (1, 2, 3)
        y = startY + firstRowHeight + gap + (row - 1) * (normalRowHeight + gap);
        slotHeight = normalRowHeight;
      }

      if (!slot || slot.type === 'empty') {
        // Render empty slot
        this.renderEmptySlot(doc, x, y, slotWidth, slotHeight);
      } else if (slot.type === 'product' && slot.product) {
        // Render product slot
        await this.renderProductSlot(doc, x, y, slotWidth, slotHeight, slot.product);
      } else if (slot.type === 'promo' && slot.promoImage) {
        // Render promo slot (may span multiple slots)
        const spannedSlots = this.getPromoSpannedSlots(position, slot.promoSize);
        spannedSlots.forEach(pos => renderedSlots.add(pos));

        const promoWidth = this.getPromoWidth(slot.promoSize, slotWidth);
        const promoHeight = this.getPromoHeight(
          slot.promoSize,
          position,
          firstRowHeight,
          normalRowHeight,
          gap
        );

        await this.renderPromoSlot(doc, x, y, promoWidth, promoHeight, slot.promoImage);
      }
    }

    // Render footer promo on page 1 if present
    if (isFirstPage && page.footerPromoImage) {
      const footerY = pageHeight - footerHeight;
      await this.renderPromoSlot(doc, 0, footerY, pageWidth, footerHeight, page.footerPromoImage);
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
  private async renderProductSlot(doc: any, x: number, y: number, width: number, height: number, product: any) {
    const padding = 6; // Fixed 6px padding (matches px-2 in React)

    // Black header - matches React: py-1.5 (6px) + text-xs (~12px) + py-1.5 (6px) = ~24px
    const headerHeight = 24;
    doc.rect(x, y, width, headerHeight)
       .fill('#000000');

    // Brand and product name in header - text-[0.7rem] = ~9px font size, centered
    // Brand is bold, name is regular, with space between them
    doc.fontSize(9); // 0.7rem ≈ 9px

    if (product.brandName) {
      // Calculate widths for centering both brand and name together
      const brandWidth = doc.font('Vodafone-Rg-Bold').widthOfString(product.brandName);
      const spaceWidth = doc.widthOfString(' ');
      const nameWidth = doc.font('Vodafone-Rg').widthOfString(product.name);
      const totalWidth = brandWidth + spaceWidth + nameWidth;

      // Center the combined text
      const startX = x + (width - totalWidth) / 2;
      const textY = y + 6; // 6px top padding (py-1.5)

      // Draw brand (bold)
      doc.font('Vodafone-Rg-Bold')
         .fillColor('#FFFFFF')
         .text(product.brandName, startX, textY, {
           continued: true,
         });

      // Draw space
      doc.text(' ', { continued: true });

      // Draw name (regular)
      doc.font('Vodafone-Rg')
         .text(product.name);
    } else {
      // No brand, just center the name
      doc.font('Vodafone-Rg')
         .fillColor('#FFFFFF')
         .text(product.name, x + padding, y + 6, {
           width: width - (padding * 2),
           height: headerHeight - 12,
           align: 'center',
           ellipsis: true,
           lineBreak: true,
         });
    }

    // Content area below header
    const contentY = y + headerHeight;
    const contentHeight = height - headerHeight;

    // Left side (49% width): Image + prices - matches React layout
    const leftWidth = width * 0.49;
    const leftX = x + 3; // p-1 = 4px, using 3px for PDF
    const leftY = contentY + 2; // Reduced top padding to 2px

    // Image area - flex-1 takes remaining space after prices
    // Prices take roughly: icon (12px if present) + 2 price boxes (20px each) + gaps = ~56px
    const pricesReservedHeight = 45; // Reduced from 56 to make image larger
    const imageHeight = contentHeight - pricesReservedHeight - 8; // 8px total padding (5px top + 3px bottom)

    if (product.imageData) {
      try {
        // Parse imageData - handle Buffer, base64 string, or data URL
        let imageBuffer: Buffer;
        if (Buffer.isBuffer(product.imageData)) {
          imageBuffer = product.imageData;
        } else if (typeof product.imageData === 'string') {
          // Handle data URL format (data:image/...;base64,...)
          const base64Data = product.imageData.includes('base64,')
            ? product.imageData.split('base64,')[1]
            : product.imageData;
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          imageBuffer = Buffer.from(product.imageData);
        }

        // Convert and compress image (max 600px width for product images)
        const pngBuffer = await this.convertImageToPNG(imageBuffer, 600);

        // Make image square (same width as height)
        const imageWidth = imageHeight;
        doc.image(pngBuffer, leftX, leftY, {
          fit: [imageWidth, imageHeight],
          align: 'center',
          valign: 'center',
        });
      } catch (error) {
        this.logger.error(`Failed to add product image for ${product.name}: ${error.message}`);
      }
    }

    // Icons overlaid on left side of image - vertically aligned and evenly distributed
    if (product.icons && product.icons.length > 0) {
      try {
        const iconSize = 24; // w-6 h-6 = 24px
        const iconsX = x; // Left edge of slot (matching frontend left-0)

        // Render up to 4 icons vertically
        const iconsToRender = product.icons.slice(0, 4);
        const iconCount = iconsToRender.length;

        // Leave 8px margin at top and bottom (matching frontend: top: '8px', height: 'calc(100% - 16px)')
        const topMargin = 8;
        const bottomMargin = 8;
        const usableHeight = imageHeight - topMargin - bottomMargin;

        // Calculate spacing to distribute icons evenly in the usable space
        const totalIconSpace = iconCount * iconSize;
        const availableSpace = usableHeight - totalIconSpace;
        const iconGap = iconCount > 1 ? availableSpace / (iconCount - 1) : 0;

        let iconsY = leftY + topMargin; // Start with top margin

        for (const productIcon of iconsToRender) {
          const icon = productIcon.icon || productIcon;

          if (icon.imageData) {
            // Parse iconData - handle Buffer, base64 string, or data URL
            let iconBuffer: Buffer;
            if (Buffer.isBuffer(icon.imageData)) {
              iconBuffer = icon.imageData;
            } else if (typeof icon.imageData === 'string') {
              // Handle data URL format (data:image/...;base64,...)
              const base64Data = icon.imageData.includes('base64,')
                ? icon.imageData.split('base64,')[1]
                : icon.imageData;
              iconBuffer = Buffer.from(base64Data, 'base64');
            } else {
              iconBuffer = Buffer.from(icon.imageData);
            }

            // Convert and compress icon (max 100px width for small icons)
            const pngIconBuffer = await this.convertImageToPNG(iconBuffer, 100);

            // Energy class icons are 2x wider (48px width, 24px height)
            // Regular icons are square (24px × 24px)
            const iconWidth = icon.isEnergyClass ? iconSize * 2 : iconSize;

            // Draw icon with fit to maintain aspect ratio
            doc.image(pngIconBuffer, iconsX, iconsY, {
              fit: [iconWidth, iconSize],
              align: 'left',
              valign: 'top',
            });

            // Move Y position down by icon size + gap for next icon
            iconsY += iconSize + iconGap;
          }
        }
      } catch (error) {
        this.logger.error(`Failed to add product icons for ${product.name}: ${error.message}`);
      }
    }

    // Prices area (below image)
    const pricesY = leftY + imageHeight + 7; // Increased gap by 3px (was 4px, now 7px)
    const priceBoxWidth = leftWidth; // Full width - no horizontal padding
    const priceBoxHeight = 20; // Increased height (was 16)
    const priceBoxWidthPercent = priceBoxWidth * 0.5; // 50% for price (ends at middle)
    const labelBoxWidthPercent = priceBoxWidth * 0.4; // 40% for label
    const pricesX = x; // Start from left edge of product

    // Helper function to format price with space-separated thousands (Czech format)
    const formatPrice = (price: number): string => {
      const rounded = Math.round(price);
      return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Kč';
    };

    // Original price (if exists) - Black box + Gray label
    let currentPriceY = pricesY;
    if (product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)) {
      // Black box with white price (50% width - ends at middle) - NO rounded corners
      doc.rect(pricesX, currentPriceY, priceBoxWidthPercent, priceBoxHeight)
         .fill('#000000');

      doc.fontSize(12) // text-[0.75rem] = 12px
         .font('Vodafone-Rg-Bold')
         .fillColor('#FFFFFF')
         .text(formatPrice(parseFloat(product.originalPrice)), pricesX, currentPriceY + (priceBoxHeight - 12) / 2, {
           width: priceBoxWidthPercent,
           align: 'center',
           valign: 'center',
         });

      // Gray box with label (40% width)
      doc.rect(pricesX + priceBoxWidthPercent + 2, currentPriceY, labelBoxWidthPercent - 2, priceBoxHeight)
         .fill('#E5E7EB');

      doc.fontSize(6.5) // Smaller font to prevent wrapping
         .font('Vodafone-Rg')
         .fillColor('#374151')
         .text('Doporučená\ncena', pricesX + priceBoxWidthPercent + 2 + 6, currentPriceY + 3, {
           width: labelBoxWidthPercent - 8,
           align: 'left',
           lineGap: -1,
         });

      currentPriceY += priceBoxHeight + 1; // space-y-px = 1px gap
    }

    // Red box with white price + Gray label
    const promoText = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)
      ? 'Akční cena\nOresi'
      : 'Akční cena';

    // Red box with white price (50% width - ends at middle) - NO rounded corners
    doc.rect(pricesX, currentPriceY, priceBoxWidthPercent, priceBoxHeight)
       .fill('#DC2626');

    doc.fontSize(12) // text-[0.75rem] = 12px
       .font('Vodafone-Rg-Bold')
       .fillColor('#FFFFFF')
       .text(formatPrice(parseFloat(product.price)), pricesX, currentPriceY + (priceBoxHeight - 12) / 2, {
         width: priceBoxWidthPercent,
         align: 'center',
         valign: 'center',
       });

    // Gray box with label (40% width)
    doc.rect(pricesX + priceBoxWidthPercent + 2, currentPriceY, labelBoxWidthPercent - 2, priceBoxHeight)
       .fill('#E5E7EB');

    doc.fontSize(6.5) // Smaller font to prevent wrapping
       .font('Vodafone-Rg')
       .fillColor('#374151')
       .text(promoText, pricesX + priceBoxWidthPercent + 2 + 6, currentPriceY + 3, {
         width: labelBoxWidthPercent - 8,
         align: 'left',
         lineGap: -1,
       });

    // Right side: Description with bullet points
    // Max 16 VISUAL lines (text can wrap, each wrap counts as a line)
    if (product.description) {
      // Start right after the square image + 4px padding
      const rightX = leftX + imageHeight + 4;
      const rightWidth = width * 0.51;
      const maxVisualLines = 16; // Exactly 16 visual lines
      const lineHeight = 8.8 * 1.7; // ~8.8px font * 1.7 line height ≈ 14.96px
      const maxHeight = maxVisualLines * lineHeight;

      const lines = product.description.trim().split('\n');

      let descY = leftY; // No additional paddingTop, use leftY directly
      let visualLinesUsed = 0;

      doc.fontSize(8.8) // text-[0.55rem] = ~8.8px
         .font('Vodafone-Rg')
         .fillColor('#000000');

      for (const line of lines) {
        // Calculate how many visual lines this text will take
        // Text starts at rightX + 10, so available width is from there to end of slot
        const textWidth = (x + width) - (rightX + 10);
        const textHeight = doc.heightOfString(line || ' ', {
          width: textWidth,
          lineGap: 1,
        });
        const linesForThisText = Math.floor(textHeight / lineHeight); // Use floor to be more lenient

        // Allow up to 16 lines - stop only if we would clearly exceed
        if (visualLinesUsed + linesForThisText > maxVisualLines) {
          break; // Stop, won't fit
        }

        // Draw bullet point
        doc.text('•', rightX, descY, {
          width: 10,
          continued: false,
        });

        // Draw line text
        doc.text(line, rightX + 10, descY, {
          width: textWidth,
          lineGap: 1,
          continued: false,
        });

        descY += textHeight;
        visualLinesUsed += linesForThisText;
      }
    }

    // Reset color
    doc.fillColor('#000');
  }

  /**
   * Render promo image slot (can span multiple slots)
   * Full bleed - no borders, no padding
   */
  private async renderPromoSlot(doc: any, x: number, y: number, width: number, height: number, promoImage: any) {
    // Add promo image (full bleed, no padding)
    if (promoImage.imageData) {
      try {
        // Parse imageData - handle Buffer, base64 string, or data URL
        let imageBuffer: Buffer;
        if (Buffer.isBuffer(promoImage.imageData)) {
          imageBuffer = promoImage.imageData;
        } else if (typeof promoImage.imageData === 'string') {
          // Handle data URL format (data:image/...;base64,...)
          const base64Data = promoImage.imageData.includes('base64,')
            ? promoImage.imageData.split('base64,')[1]
            : promoImage.imageData;
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          imageBuffer = Buffer.from(promoImage.imageData);
        }

        // Convert and compress promo image (max 1200px width for larger promo images)
        const pngBuffer = await this.convertImageToPNG(imageBuffer, 1200);

        // Use exact width and height to fill entire area without white space
        doc.image(pngBuffer, x, y, {
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
   * Get promo width based on size (accounting for gaps between slots)
   */
  private getPromoWidth(promoSize: string, slotWidth: number): number {
    const gap = 3; // Must match gap in renderSlotGrid
    switch (promoSize) {
      case 'single':
        return slotWidth;
      case 'horizontal':
      case 'square':
      case 'full_page':
        return slotWidth * 2 + gap; // 2 columns + 1 gap between them
      default:
        return slotWidth;
    }
  }

  /**
   * Get promo height based on size (accounting for gaps between slots and variable row heights)
   */
  private getPromoHeight(
    promoSize: string,
    anchorPosition: number,
    firstRowHeight: number,
    normalRowHeight: number,
    gap: number
  ): number {
    const startRow = Math.floor(anchorPosition / 2);

    switch (promoSize) {
      case 'single':
      case 'horizontal':
        // Only spans 1 row - use appropriate height
        return startRow === 0 ? firstRowHeight : normalRowHeight;

      case 'square':
        // Spans 2 rows
        if (startRow === 0) {
          // Starts at row 0: firstRowHeight + gap + normalRowHeight
          return firstRowHeight + gap + normalRowHeight;
        } else {
          // Starts at row 1 or later: 2 normal rows
          return normalRowHeight * 2 + gap;
        }

      case 'full_page':
        // Spans all 4 rows: first row + 3 normal rows + gaps
        return firstRowHeight + normalRowHeight * 3 + gap * 3;

      default:
        return startRow === 0 ? firstRowHeight : normalRowHeight;
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
