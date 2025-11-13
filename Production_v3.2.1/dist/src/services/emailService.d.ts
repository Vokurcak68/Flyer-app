interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
declare class EmailService {
    private transporter;
    constructor();
    private initializeTransporter;
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendFlyerSubmittedEmail(recipientEmail: string, recipientName: string, flyerName: string, submitterName: string, flyerUrl: string, isPreApproval: boolean): Promise<boolean>;
    sendFlyerApprovedEmail(recipientEmail: string, recipientName: string, flyerName: string, approverName: string, comment: string, flyerUrl: string, isPreApproval: boolean): Promise<boolean>;
    sendFlyerRejectedEmail(recipientEmail: string, recipientName: string, flyerName: string, approverName: string, rejectionReason: string, flyerUrl: string, isPreApproval: boolean): Promise<boolean>;
}
export declare const emailService: EmailService;
export {};
