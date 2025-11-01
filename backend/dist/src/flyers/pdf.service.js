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
    async convertImageToPNG(imageBuffer, maxWidth = 800) {
        try {
            const image = sharp(imageBuffer);
            const metadata = await image.metadata();
            if (metadata.width && metadata.width > maxWidth) {
                image.resize(maxWidth, null, {
                    fit: 'inside',
                    withoutEnlargement: true,
                });
            }
            return await image
                .jpeg({
                quality: 85,
                mozjpeg: true,
            })
                .toBuffer();
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
                    compress: true,
                });
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
                }
                catch (error) {
                    this.logger.warn(`Could not register fonts: ${error.message}`);
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
        const gap = 3;
        const isFirstPage = page.pageNumber === 1;
        const slotWidth = (pageWidth - gap * (cols - 1)) / cols;
        let firstRowHeight;
        let normalRowHeight;
        if (isFirstPage) {
            normalRowHeight = (pageHeight - gap * (rows - 1)) / rows;
            firstRowHeight = pageHeight - footerHeight - (3 * normalRowHeight) - gap * (rows - 1);
        }
        else {
            normalRowHeight = (pageHeight - gap * (rows - 1)) / rows;
            firstRowHeight = normalRowHeight;
        }
        this.logger.log(`Rendering 2x4 grid (page ${page.pageNumber}): slotWidth=${slotWidth}, firstRowHeight=${firstRowHeight}, normalRowHeight=${normalRowHeight}, hasFooter=${isFirstPage}`);
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
            let y;
            let slotHeight;
            if (row === 0) {
                y = startY;
                slotHeight = firstRowHeight;
            }
            else {
                y = startY + firstRowHeight + gap + (row - 1) * (normalRowHeight + gap);
                slotHeight = normalRowHeight;
            }
            if (!slot || slot.type === 'empty') {
                this.renderEmptySlot(doc, x, y, slotWidth, slotHeight);
            }
            else if (slot.type === 'product' && slot.product) {
                await this.renderProductSlot(doc, x, y, slotWidth, slotHeight, slot.product);
            }
            else if (slot.type === 'promo' && slot.promoImage) {
                const spannedSlots = this.getPromoSpannedSlots(position, slot.promoSize);
                spannedSlots.forEach(pos => renderedSlots.add(pos));
                const promoWidth = this.getPromoWidth(slot.promoSize, slotWidth);
                const promoHeight = this.getPromoHeight(slot.promoSize, position, firstRowHeight, normalRowHeight, gap);
                await this.renderPromoSlot(doc, x, y, promoWidth, promoHeight, slot.promoImage);
            }
        }
        if (isFirstPage && page.footerPromoImage) {
            const footerY = pageHeight - footerHeight;
            await this.renderPromoSlot(doc, 0, footerY, pageWidth, footerHeight, page.footerPromoImage);
            this.logger.log(`Rendered footer promo on page 1: ${page.footerPromoImage.name}`);
        }
    }
    renderEmptySlot(_doc, _x, _y, _width, _height) {
    }
    async renderProductSlot(doc, x, y, width, height, product) {
        const padding = 6;
        const headerHeight = 24;
        doc.rect(x, y, width, headerHeight)
            .fill('#000000');
        doc.fontSize(9);
        if (product.brandName) {
            const brandWidth = doc.font('Vodafone-Rg-Bold').widthOfString(product.brandName);
            const spaceWidth = doc.widthOfString(' ');
            const nameWidth = doc.font('Vodafone-Rg').widthOfString(product.name);
            const totalWidth = brandWidth + spaceWidth + nameWidth;
            const startX = x + (width - totalWidth) / 2;
            const textY = y + 6;
            doc.font('Vodafone-Rg-Bold')
                .fillColor('#FFFFFF')
                .text(product.brandName, startX, textY, {
                continued: true,
            });
            doc.text(' ', { continued: true });
            doc.font('Vodafone-Rg')
                .text(product.name);
        }
        else {
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
        const contentY = y + headerHeight;
        const contentHeight = height - headerHeight;
        const leftWidth = width * 0.49;
        const leftX = x + 3;
        const leftY = contentY + 2;
        const pricesReservedHeight = 45;
        const imageHeight = contentHeight - pricesReservedHeight - 8;
        if (product.imageData) {
            try {
                let imageBuffer;
                if (Buffer.isBuffer(product.imageData)) {
                    imageBuffer = product.imageData;
                }
                else if (typeof product.imageData === 'string') {
                    const base64Data = product.imageData.includes('base64,')
                        ? product.imageData.split('base64,')[1]
                        : product.imageData;
                    imageBuffer = Buffer.from(base64Data, 'base64');
                }
                else {
                    imageBuffer = Buffer.from(product.imageData);
                }
                const pngBuffer = await this.convertImageToPNG(imageBuffer, 600);
                const imageWidth = imageHeight;
                doc.image(pngBuffer, leftX, leftY, {
                    fit: [imageWidth, imageHeight],
                    align: 'center',
                    valign: 'center',
                });
            }
            catch (error) {
                this.logger.error(`Failed to add product image for ${product.name}: ${error.message}`);
            }
        }
        if (product.icons && product.icons.length > 0) {
            try {
                const iconSize = 24;
                const iconsX = x;
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
                            const base64Data = icon.imageData.includes('base64,')
                                ? icon.imageData.split('base64,')[1]
                                : icon.imageData;
                            iconBuffer = Buffer.from(base64Data, 'base64');
                        }
                        else {
                            iconBuffer = Buffer.from(icon.imageData);
                        }
                        const pngIconBuffer = await this.convertImageToPNG(iconBuffer, 100);
                        const iconWidth = icon.isEnergyClass ? iconSize * 2 : iconSize;
                        doc.image(pngIconBuffer, iconsX, iconsY, {
                            fit: [iconWidth, iconSize],
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
        const pricesY = leftY + imageHeight + 7;
        const priceBoxWidth = leftWidth;
        const priceBoxHeight = 20;
        const priceBoxWidthPercent = priceBoxWidth * 0.5;
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
                .font('Vodafone-Rg-Bold')
                .fillColor('#FFFFFF')
                .text(formatPrice(parseFloat(product.originalPrice)), pricesX, currentPriceY + (priceBoxHeight - 12) / 2, {
                width: priceBoxWidthPercent,
                align: 'center',
                valign: 'center',
            });
            doc.rect(pricesX + priceBoxWidthPercent + 2, currentPriceY, labelBoxWidthPercent - 2, priceBoxHeight)
                .fill('#E5E7EB');
            doc.fontSize(6.5)
                .font('Vodafone-Rg')
                .fillColor('#374151')
                .text('Doporučená\ncena', pricesX + priceBoxWidthPercent + 2 + 6, currentPriceY + 3, {
                width: labelBoxWidthPercent - 8,
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
            .font('Vodafone-Rg-Bold')
            .fillColor('#FFFFFF')
            .text(formatPrice(parseFloat(product.price)), pricesX, currentPriceY + (priceBoxHeight - 12) / 2, {
            width: priceBoxWidthPercent,
            align: 'center',
            valign: 'center',
        });
        doc.rect(pricesX + priceBoxWidthPercent + 2, currentPriceY, labelBoxWidthPercent - 2, priceBoxHeight)
            .fill('#E5E7EB');
        doc.fontSize(6.5)
            .font('Vodafone-Rg')
            .fillColor('#374151')
            .text(promoText, pricesX + priceBoxWidthPercent + 2 + 6, currentPriceY + 3, {
            width: labelBoxWidthPercent - 8,
            align: 'left',
            lineGap: -1,
        });
        if (product.description) {
            const rightX = leftX + imageHeight + 4;
            const rightWidth = width * 0.51;
            const maxVisualLines = 16;
            const lineHeight = 8.8 * 1.7;
            const maxHeight = maxVisualLines * lineHeight;
            const lines = product.description.trim().split('\n');
            let descY = leftY;
            let visualLinesUsed = 0;
            doc.fontSize(8.8)
                .font('Vodafone-Rg')
                .fillColor('#000000');
            for (const line of lines) {
                const textWidth = (x + width) - (rightX + 10);
                const textHeight = doc.heightOfString(line || ' ', {
                    width: textWidth,
                    lineGap: 1,
                });
                const linesForThisText = Math.floor(textHeight / lineHeight);
                if (visualLinesUsed + linesForThisText > maxVisualLines) {
                    break;
                }
                doc.text('•', rightX, descY, {
                    width: 10,
                    continued: false,
                });
                doc.text(line, rightX + 10, descY, {
                    width: textWidth,
                    lineGap: 1,
                    continued: false,
                });
                descY += textHeight;
                visualLinesUsed += linesForThisText;
            }
        }
        doc.fillColor('#000');
    }
    async renderPromoSlot(doc, x, y, width, height, promoImage) {
        if (promoImage.imageData) {
            try {
                let imageBuffer;
                if (Buffer.isBuffer(promoImage.imageData)) {
                    imageBuffer = promoImage.imageData;
                }
                else if (typeof promoImage.imageData === 'string') {
                    const base64Data = promoImage.imageData.includes('base64,')
                        ? promoImage.imageData.split('base64,')[1]
                        : promoImage.imageData;
                    imageBuffer = Buffer.from(base64Data, 'base64');
                }
                else {
                    imageBuffer = Buffer.from(promoImage.imageData);
                }
                const pngBuffer = await this.convertImageToPNG(imageBuffer, 1200);
                doc.image(pngBuffer, x, y, {
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
        const gap = 3;
        switch (promoSize) {
            case 'single':
                return slotWidth;
            case 'horizontal':
            case 'square':
            case 'full_page':
                return slotWidth * 2 + gap;
            default:
                return slotWidth;
        }
    }
    getPromoHeight(promoSize, anchorPosition, firstRowHeight, normalRowHeight, gap) {
        const startRow = Math.floor(anchorPosition / 2);
        switch (promoSize) {
            case 'single':
            case 'horizontal':
                return startRow === 0 ? firstRowHeight : normalRowHeight;
            case 'square':
                if (startRow === 0) {
                    return firstRowHeight + gap + normalRowHeight;
                }
                else {
                    return normalRowHeight * 2 + gap;
                }
            case 'full_page':
                return firstRowHeight + normalRowHeight * 3 + gap * 3;
            default:
                return startRow === 0 ? firstRowHeight : normalRowHeight;
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