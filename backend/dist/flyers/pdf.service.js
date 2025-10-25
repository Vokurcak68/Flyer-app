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
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
let PdfService = PdfService_1 = class PdfService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PdfService_1.name);
        this.uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
        this.ensureUploadDirectory();
    }
    ensureUploadDirectory() {
        try {
            fs.accessSync(this.uploadsDir);
        }
        catch {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
            this.logger.log(`Created uploads directory: ${this.uploadsDir}`);
        }
    }
    async generateFlyerPDF(flyer) {
        return new Promise((resolve, reject) => {
            try {
                this.logger.log(`Generating PDF for flyer ${flyer.id}`);
                this.logger.log(`Flyer structure: pages count = ${flyer.pages?.length || 0}`);
                const filename = `flyer-${flyer.id}-${Date.now()}.pdf`;
                const filepath = path.join(this.uploadsDir, filename);
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 0, bottom: 0, left: 0, right: 0 },
                    autoFirstPage: false,
                });
                try {
                    const arialPath = 'C:\\Windows\\Fonts\\arial.ttf';
                    const arialBoldPath = 'C:\\Windows\\Fonts\\arialbd.ttf';
                    if (fs.existsSync(arialPath)) {
                        doc.registerFont('Arial', arialPath);
                    }
                    if (fs.existsSync(arialBoldPath)) {
                        doc.registerFont('Arial-Bold', arialBoldPath);
                    }
                }
                catch (error) {
                    this.logger.warn(`Could not register Arial font: ${error.message}`);
                }
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    fs.writeFileSync(filepath, pdfBuffer);
                    this.logger.log(`PDF generated successfully: ${filename}`);
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);
                const pages = flyer.pages.sort((a, b) => a.pageNumber - b.pageNumber);
                pages.forEach((page) => {
                    doc.addPage();
                    this.renderSlotGrid(doc, page);
                });
                doc.end();
            }
            catch (error) {
                this.logger.error(`Failed to generate PDF for flyer ${flyer.id}`, error);
                reject(new Error(`PDF generation failed: ${error.message}`));
            }
        });
    }
    renderSlotGrid(doc, page) {
        const startX = 0;
        const startY = 0;
        const pageWidth = 595;
        const pageHeight = 842;
        const footerHeight = 57;
        const cols = 2;
        const rows = 4;
        const gap = 0;
        const isFirstPage = page.pageNumber === 1;
        const availableHeight = isFirstPage ? pageHeight - footerHeight : pageHeight;
        const slotWidth = pageWidth / cols;
        const slotHeight = availableHeight / rows;
        this.logger.log(`Rendering 2x4 grid (page ${page.pageNumber}): slotWidth=${slotWidth}, slotHeight=${slotHeight}, hasFooter=${isFirstPage}`);
        const slots = page.slots || new Array(8).fill(null);
        this.logger.log(`Page ${page.pageNumber} slots debug:`);
        slots.forEach((slot, i) => {
            if (slot && slot.type !== 'empty') {
                this.logger.log(`  Slot ${i}: type=${slot.type}, hasPromo=${!!slot.promoImage}, promoSize=${slot.promoSize}, promoId=${slot.promoImage?.id}, hasPromoImageData=${!!slot.promoImage?.imageData}`);
            }
        });
        const renderedSlots = new Set();
        for (let position = 0; position < 8; position++) {
            if (renderedSlots.has(position)) {
                continue;
            }
            const slot = slots[position];
            const row = Math.floor(position / cols);
            const col = position % cols;
            const x = startX + col * (slotWidth + gap);
            const y = startY + row * (slotHeight + gap);
            if (!slot || slot.type === 'empty') {
                this.renderEmptySlot(doc, x, y, slotWidth, slotHeight);
            }
            else if (slot.type === 'product' && slot.product) {
                this.renderProductSlot(doc, x, y, slotWidth, slotHeight, slot.product);
            }
            else if (slot.type === 'promo' && slot.promoImage) {
                const spannedSlots = this.getPromoSpannedSlots(position, slot.promoSize);
                spannedSlots.forEach(pos => renderedSlots.add(pos));
                const promoWidth = this.getPromoWidth(slot.promoSize, slotWidth);
                const promoHeight = this.getPromoHeight(slot.promoSize, slotHeight);
                this.renderPromoSlot(doc, x, y, promoWidth, promoHeight, slot.promoImage);
            }
        }
        if (isFirstPage && page.footerPromoImage) {
            const footerY = availableHeight;
            this.renderPromoSlot(doc, 0, footerY, pageWidth, footerHeight, page.footerPromoImage);
            this.logger.log(`Rendered footer promo on page 1: ${page.footerPromoImage.name}`);
        }
    }
    renderEmptySlot(_doc, _x, _y, _width, _height) {
    }
    renderProductSlot(doc, x, y, width, height, product) {
        const padding = 6;
        const headerHeight = 24;
        doc.rect(x, y, width, headerHeight)
            .fill('#000000');
        doc.fontSize(9)
            .font('Arial-Bold')
            .fillColor('#FFFFFF')
            .text(product.name, x + padding, y + 6, {
            width: width - (padding * 2),
            height: headerHeight - 12,
            align: 'center',
            ellipsis: true,
            lineBreak: true,
        });
        const contentY = y + headerHeight;
        const contentHeight = height - headerHeight;
        const leftWidth = width * 0.45;
        const leftX = x + 6;
        const leftY = contentY + 6;
        const pricesReservedHeight = 56;
        const imageHeight = contentHeight - pricesReservedHeight - 12;
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
            }
            catch (error) {
                this.logger.error(`Failed to add product image for ${product.name}: ${error.message}`);
            }
        }
        const pricesY = leftY + imageHeight + 4;
        const priceBoxWidth = leftWidth - 12;
        const priceBoxHeight = 20;
        let currentPriceY = pricesY;
        if (product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)) {
            doc.rect(leftX, currentPriceY, priceBoxWidth, priceBoxHeight)
                .fill('#E5E7EB');
            doc.fontSize(8)
                .font('Arial')
                .fillColor('#6B7280')
                .text('Doporučená cena', leftX, currentPriceY + 2, {
                width: priceBoxWidth,
                align: 'center',
            });
            doc.fontSize(9.6)
                .font('Arial-Bold')
                .fillColor('#374151')
                .text(`${parseFloat(product.originalPrice).toFixed(2)} Kč`, leftX, currentPriceY + 10, {
                width: priceBoxWidth,
                align: 'center',
            });
            currentPriceY += priceBoxHeight + 2;
        }
        doc.rect(leftX, currentPriceY, priceBoxWidth, priceBoxHeight)
            .fill('#DC2626');
        const promoText = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)
            ? 'Akční cena Oresi'
            : 'Akční cena';
        doc.fontSize(8)
            .font('Arial')
            .fillColor('#FFFFFF')
            .text(promoText, leftX, currentPriceY + 2, {
            width: priceBoxWidth,
            align: 'center',
        });
        doc.fontSize(12)
            .font('Arial-Bold')
            .fillColor('#FFFFFF')
            .text(`${parseFloat(product.price).toFixed(2)} Kč`, leftX, currentPriceY + 10, {
            width: priceBoxWidth,
            align: 'center',
        });
        if (product.description) {
            const rightX = x + leftWidth;
            const rightWidth = width * 0.55;
            doc.fontSize(8.8)
                .font('Arial')
                .fillColor('#000000')
                .text(product.description, rightX + 6, leftY, {
                width: rightWidth - 12,
                height: contentHeight - 12,
                lineGap: 1,
            });
        }
        doc.fillColor('#000');
    }
    renderPromoSlot(doc, x, y, width, height, promoImage) {
        if (promoImage.imageData) {
            try {
                const imageBuffer = Buffer.isBuffer(promoImage.imageData)
                    ? promoImage.imageData
                    : Buffer.from(promoImage.imageData);
                doc.image(imageBuffer, x, y, {
                    width: width,
                    height: height,
                });
            }
            catch (error) {
                this.logger.error(`Failed to add promo image: ${error.message}`);
            }
        }
    }
    getPromoSpannedSlots(anchorPosition, promoSize) {
        const slots = [anchorPosition];
        switch (promoSize) {
            case 'single':
                return slots;
            case 'horizontal':
                slots.push(anchorPosition + 1);
                return slots;
            case 'square':
                slots.push(anchorPosition + 1);
                slots.push(anchorPosition + 2);
                slots.push(anchorPosition + 3);
                return slots;
            case 'full_page':
                return [0, 1, 2, 3, 4, 5, 6, 7];
            default:
                return slots;
        }
    }
    getPromoWidth(promoSize, slotWidth) {
        switch (promoSize) {
            case 'single':
                return slotWidth;
            case 'horizontal':
            case 'square':
            case 'full_page':
                return slotWidth * 2;
            default:
                return slotWidth;
        }
    }
    getPromoHeight(promoSize, slotHeight) {
        switch (promoSize) {
            case 'single':
            case 'horizontal':
                return slotHeight;
            case 'square':
                return slotHeight * 2;
            case 'full_page':
                return slotHeight * 4;
            default:
                return slotHeight;
        }
    }
    async deletePDF(pdfUrl) {
        try {
            const filename = path.basename(pdfUrl);
            const filepath = path.join(this.uploadsDir, filename);
            fs.unlinkSync(filepath);
            this.logger.log(`PDF deleted: ${filename}`);
        }
        catch (error) {
            this.logger.warn(`Failed to delete PDF ${pdfUrl}`, error);
        }
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PdfService);
//# sourceMappingURL=pdf.service.js.map