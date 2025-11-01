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
const sharp = require("sharp");
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
    async convertImageToPNG(imageBuffer) {
        try {
            return await sharp(imageBuffer).png().toBuffer();
        }
        catch (error) {
            this.logger.error(`Failed to convert image: ${error.message}`);
            throw error;
        }
    }
    async generateFlyerPDF(flyer) {
        return new Promise(async (resolve, reject) => {
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
                for (const page of pages) {
                    doc.addPage();
                    await this.renderSlotGrid(doc, page);
                }
                doc.end();
            }
            catch (error) {
                this.logger.error(`Failed to generate PDF for flyer ${flyer.id}`, error);
                reject(new Error(`PDF generation failed: ${error.message}`));
            }
        });
    }
    async renderSlotGrid(doc, page) {
        const startX = 0;
        const startY = 0;
        const pageWidth = 595;
        const pageHeight = 842;
        const footerHeight = 57;
        const cols = 2;
        const rows = 4;
        const gap = 0;
        const isFirstPage = page.pageNumber === 1;
        const slotWidth = pageWidth / cols;
        const standardSlotHeight = pageHeight / rows;
        const contentRows = 3;
        const headerHeight = pageHeight - (contentRows * standardSlotHeight) - footerHeight;
        this.logger.log(`Rendering grid (page ${page.pageNumber}): slotWidth=${slotWidth}, standardSlotHeight=${standardSlotHeight}, hasFooter=${isFirstPage}`);
        const slots = page.slots || new Array(8).fill(null);
        this.logger.log(`Page ${page.pageNumber} slots debug:`);
        slots.forEach((slot, i) => {
            if (slot && slot.type !== 'empty') {
                this.logger.log(`  Slot ${i}: type=${slot.type}, hasPromo=${!!slot.promoImage}, promoSize=${slot.promoSize}, promoId=${slot.promoImage?.id}, hasPromoImageData=${!!slot.promoImage?.imageData}`);
            }
        });
        const renderedSlots = new Set();
        if (isFirstPage) {
            for (let position = 0; position < 8; position++) {
                if (renderedSlots.has(position)) {
                    continue;
                }
                const slot = slots[position];
                let x, y, width, height;
                if (position < 2) {
                    const col = position % cols;
                    x = startX + col * slotWidth;
                    y = startY;
                    width = slotWidth;
                    height = headerHeight;
                }
                else {
                    const contentPosition = position - 2;
                    const row = Math.floor(contentPosition / cols);
                    const col = contentPosition % cols;
                    x = startX + col * slotWidth;
                    y = startY + headerHeight + row * standardSlotHeight;
                    width = slotWidth;
                    height = standardSlotHeight;
                }
                if (!slot || slot.type === 'empty') {
                    this.renderEmptySlot(doc, x, y, width, height);
                }
                else if (slot.type === 'product' && slot.product) {
                    await this.renderProductSlot(doc, x, y, width, height, slot.product);
                }
                else if (slot.type === 'promo' && slot.promoImage) {
                    const spannedSlots = this.getPromoSpannedSlots(position, slot.promoSize);
                    spannedSlots.forEach(pos => renderedSlots.add(pos));
                    const promoWidth = this.getPromoWidth(slot.promoSize, slotWidth);
                    const promoHeight = this.getPromoHeight(slot.promoSize, standardSlotHeight);
                    this.renderPromoSlot(doc, x, y, promoWidth, promoHeight, slot.promoImage);
                }
            }
            if (page.footerPromoImage) {
                const footerY = headerHeight + contentRows * standardSlotHeight;
                this.renderPromoSlot(doc, 0, footerY, pageWidth, footerHeight, page.footerPromoImage);
                this.logger.log(`Rendered footer promo on page 1: ${page.footerPromoImage.name}`);
            }
        }
        else {
            for (let position = 0; position < 8; position++) {
                if (renderedSlots.has(position)) {
                    continue;
                }
                const slot = slots[position];
                const row = Math.floor(position / cols);
                const col = position % cols;
                const x = startX + col * slotWidth;
                const y = startY + row * standardSlotHeight;
                if (!slot || slot.type === 'empty') {
                    this.renderEmptySlot(doc, x, y, slotWidth, standardSlotHeight);
                }
                else if (slot.type === 'product' && slot.product) {
                    await this.renderProductSlot(doc, x, y, slotWidth, standardSlotHeight, slot.product);
                }
                else if (slot.type === 'promo' && slot.promoImage) {
                    const spannedSlots = this.getPromoSpannedSlots(position, slot.promoSize);
                    spannedSlots.forEach(pos => renderedSlots.add(pos));
                    const promoWidth = this.getPromoWidth(slot.promoSize, slotWidth);
                    const promoHeight = this.getPromoHeight(slot.promoSize, standardSlotHeight);
                    this.renderPromoSlot(doc, x, y, promoWidth, promoHeight, slot.promoImage);
                }
            }
        }
    }
    renderEmptySlot(_doc, _x, _y, _width, _height) {
    }
    async renderProductSlot(doc, x, y, width, height, product) {
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
                let imageBuffer;
                const dataType = Buffer.isBuffer(product.imageData) ? 'Buffer' : typeof product.imageData;
                const dataLength = product.imageData.length || (product.imageData.byteLength || 0);
                this.logger.log(`📊 Product ${product.name} imageData: type=${dataType}, length=${dataLength}, mimeType=${product.imageMimeType}`);
                if (Buffer.isBuffer(product.imageData)) {
                    imageBuffer = product.imageData;
                }
                else if (typeof product.imageData === 'string') {
                    let base64Data = product.imageData;
                    if (base64Data.startsWith('data:')) {
                        base64Data = base64Data.split(',')[1];
                    }
                    imageBuffer = Buffer.from(base64Data, 'base64');
                }
                else {
                    imageBuffer = Buffer.from(product.imageData);
                }
                this.logger.log(`📦 Buffer created: size=${imageBuffer.length} bytes, first bytes: ${imageBuffer.slice(0, 10).toString('hex')}`);
                const pngBuffer = await this.convertImageToPNG(imageBuffer);
                this.logger.log(`✨ Converted to PNG: size=${pngBuffer.length} bytes`);
                const imageWidth = leftWidth - 12;
                doc.image(pngBuffer, leftX, leftY, {
                    fit: [imageWidth, imageHeight],
                    align: 'center',
                    valign: 'center',
                });
                this.logger.log(`✅ Added product image for ${product.name}`);
            }
            catch (error) {
                this.logger.error(`❌ Failed to add product image for ${product.name}: ${error.message}`);
            }
        }
        else {
            this.logger.warn(`⚠️ Product ${product.name} has NO imageData`);
        }
        if (product.icons && product.icons.length > 0) {
            try {
                const iconSize = 24;
                const iconsX = leftX;
                const iconsToRender = product.icons.slice(0, 4);
                const iconCount = iconsToRender.length;
                const topMargin = 8;
                const bottomMargin = 8;
                const usableHeight = imageHeight - topMargin - bottomMargin;
                const totalIconSpace = iconCount * iconSize;
                const availableSpace = usableHeight - totalIconSpace;
                const iconGap = iconCount > 1 ? availableSpace / (iconCount - 1) : 0;
                let iconsY = leftY + topMargin;
                for (const productIcon of iconsToRender) {
                    const icon = productIcon.icon || productIcon;
                    if (icon.imageData) {
                        let iconBuffer;
                        if (Buffer.isBuffer(icon.imageData)) {
                            iconBuffer = icon.imageData;
                        }
                        else if (typeof icon.imageData === 'string') {
                            iconBuffer = Buffer.from(icon.imageData, 'base64');
                        }
                        else {
                            iconBuffer = Buffer.from(icon.imageData);
                        }
                        doc.image(iconBuffer, iconsX, iconsY, {
                            fit: [iconSize, iconSize],
                            align: 'left',
                            valign: 'top',
                        });
                        iconsY += iconSize + iconGap;
                    }
                }
            }
            catch (error) {
                this.logger.error(`Failed to add product icons for ${product.name}: ${error.message}`);
            }
        }
        const pricesY = leftY + imageHeight + 4;
        const priceBoxWidth = leftWidth;
        const priceBoxHeight = 20;
        const priceBoxWidthPercent = priceBoxWidth * 0.6;
        const labelBoxWidthPercent = priceBoxWidth * 0.4;
        const pricesX = x;
        const formatPrice = (price) => {
            const rounded = Math.round(price);
            return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Kč';
        };
        let currentPriceY = pricesY;
        if (product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)) {
            doc.rect(pricesX, currentPriceY, priceBoxWidthPercent, priceBoxHeight)
                .fill('#000000');
            doc.fontSize(12)
                .font('Arial-Bold')
                .fillColor('#FFFFFF')
                .text(formatPrice(parseFloat(product.originalPrice)), pricesX, currentPriceY + (priceBoxHeight - 12) / 2, {
                width: priceBoxWidthPercent,
                align: 'center',
                valign: 'center',
            });
            doc.rect(pricesX + priceBoxWidthPercent + 2, currentPriceY, labelBoxWidthPercent - 2, priceBoxHeight)
                .fill('#E5E7EB');
            doc.fontSize(6.5)
                .font('Arial')
                .fillColor('#374151')
                .text('Doporučená\ncena', pricesX + priceBoxWidthPercent + 2 + 2, currentPriceY + 3, {
                width: labelBoxWidthPercent - 6,
                align: 'left',
                lineGap: -1,
            });
            currentPriceY += priceBoxHeight + 1;
        }
        const promoText = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)
            ? 'Akční cena\nOresi'
            : 'Akční cena';
        doc.rect(pricesX, currentPriceY, priceBoxWidthPercent, priceBoxHeight)
            .fill('#DC2626');
        doc.fontSize(12)
            .font('Arial-Bold')
            .fillColor('#FFFFFF')
            .text(formatPrice(parseFloat(product.price)), pricesX, currentPriceY + (priceBoxHeight - 12) / 2, {
            width: priceBoxWidthPercent,
            align: 'center',
            valign: 'center',
        });
        doc.rect(pricesX + priceBoxWidthPercent + 2, currentPriceY, labelBoxWidthPercent - 2, priceBoxHeight)
            .fill('#E5E7EB');
        doc.fontSize(6.5)
            .font('Arial')
            .fillColor('#374151')
            .text(promoText, pricesX + priceBoxWidthPercent + 2 + 2, currentPriceY + 3, {
            width: labelBoxWidthPercent - 6,
            align: 'left',
            lineGap: -1,
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
                let imageBuffer;
                if (Buffer.isBuffer(promoImage.imageData)) {
                    imageBuffer = promoImage.imageData;
                }
                else if (typeof promoImage.imageData === 'string') {
                    imageBuffer = Buffer.from(promoImage.imageData, 'base64');
                }
                else {
                    imageBuffer = Buffer.from(promoImage.imageData);
                }
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