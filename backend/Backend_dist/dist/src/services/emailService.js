"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer = require("nodemailer");
class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }
    initializeTransporter() {
        try {
            if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
                console.warn('⚠️  SMTP not configured. Email notifications will be disabled.');
                return;
            }
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });
            console.log('✅ Email service initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize email service:', error);
            this.transporter = null;
        }
    }
    async sendEmail(options) {
        if (!this.transporter) {
            console.warn('⚠️  Email service not available. Skipping email:', options.subject);
            return false;
        }
        try {
            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME || 'Flyer App'}" <${process.env.EMAIL_FROM}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || options.html.replace(/<[^>]*>/g, ''),
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', info.messageId, 'to:', options.to);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send email:', error);
            return false;
        }
    }
    async sendFlyerSubmittedEmail(recipientEmail, recipientName, flyerName, submitterName, flyerUrl, isPreApproval) {
        const approvalType = isPreApproval ? 'předschválení' : 'schválení';
        const subject = `Nový leták čeká na ${approvalType}: ${flyerName}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nový leták čeká na ${approvalType}</h2>

        <p>Dobrý den ${recipientName},</p>

        <p>Byl vám odeslán nový leták k ${approvalType}:</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Název letáku:</strong> ${flyerName}</p>
          <p style="margin: 5px 0;"><strong>Odesláno od:</strong> ${submitterName}</p>
        </div>

        <p>Pro kontrolu a ${approvalType} letáku klikněte na tlačítko níže:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${flyerUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Zkontrolovat leták
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:<br>
          <a href="${flyerUrl}" style="color: #2563eb;">${flyerUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px;">
          Tento email byl odeslán automaticky systémem Flyer App. Neodpovídejte na něj.
        </p>
      </div>
    `;
        return this.sendEmail({
            to: recipientEmail,
            subject,
            html,
        });
    }
    async sendFlyerApprovedEmail(recipientEmail, recipientName, flyerName, approverName, comment, flyerUrl, isPreApproval) {
        const approvalType = isPreApproval ? 'předschválen' : 'schválen';
        const subject = `Leták byl ${approvalType}: ${flyerName}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Leták byl ${approvalType}</h2>

        <p>Dobrý den ${recipientName},</p>

        <p>Váš leták byl ${approvalType}:</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Název letáku:</strong> ${flyerName}</p>
          <p style="margin: 5px 0;"><strong>${isPreApproval ? 'Předschválil' : 'Schválil'}:</strong> ${approverName}</p>
          ${comment ? `<p style="margin: 5px 0;"><strong>Komentář:</strong> ${comment}</p>` : ''}
        </div>

        ${!isPreApproval ? `
          <p style="color: #10b981; font-weight: bold;">
            ✓ Váš leták byl úspěšně schválen a je nyní aktivní!
          </p>
        ` : `
          <p>
            Váš leták byl předschválen a nyní čeká na finální schválení.
          </p>
        `}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${flyerUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Zobrazit leták
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:<br>
          <a href="${flyerUrl}" style="color: #2563eb;">${flyerUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px;">
          Tento email byl odeslán automaticky systémem Flyer App. Neodpovídejte na něj.
        </p>
      </div>
    `;
        return this.sendEmail({
            to: recipientEmail,
            subject,
            html,
        });
    }
    async sendFlyerRejectedEmail(recipientEmail, recipientName, flyerName, approverName, rejectionReason, flyerUrl, isPreApproval) {
        const approvalType = isPreApproval ? 'Předschválení' : 'Schválení';
        const subject = `Leták byl zamítnut: ${flyerName}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Leták byl zamítnut</h2>

        <p>Dobrý den ${recipientName},</p>

        <p>Váš leták byl zamítnut při ${approvalType.toLowerCase()}:</p>

        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 5px 0;"><strong>Název letáku:</strong> ${flyerName}</p>
          <p style="margin: 5px 0;"><strong>Zamítnul:</strong> ${approverName}</p>
          <p style="margin: 15px 0 5px 0;"><strong>Důvod zamítnutí:</strong></p>
          <p style="margin: 5px 0; color: #991b1b;">${rejectionReason}</p>
        </div>

        <p>
          Prosím proveďte požadované úpravy a odešlete leták znovu ke schválení.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${flyerUrl}"
             style="background-color: #ef4444; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Upravit leták
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:<br>
          <a href="${flyerUrl}" style="color: #2563eb;">${flyerUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px;">
          Tento email byl odeslán automaticky systémem Flyer App. Neodpovídejte na něj.
        </p>
      </div>
    `;
        return this.sendEmail({
            to: recipientEmail,
            subject,
            html,
        });
    }
}
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map