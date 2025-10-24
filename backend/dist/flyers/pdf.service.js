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
        if (product.imageData) {
            try {
                const imageBuffer = Buffer.isBuffer(product.imageData)
                    ? product.imageData
                    : Buffer.from(product.imageData);
                doc.image(imageBuffer, x + 5, y + 5, {
                    fit: [width - 10, height - 80],
                    align: 'center',
                });
            }
            catch (error) {
                this.logger.error(`Failed to add product image for ${product.name}: ${error.message}`);
            }
        }
        const infoY = y + height - 70;
        doc.fontSize(10)
            .font('Arial-Bold')
            .fillColor('#000')
            .text(product.name, x + 5, infoY, {
            width: width - 10,
            height: 25,
            ellipsis: true,
        });
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