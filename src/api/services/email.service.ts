import nodemailer from 'nodemailer';
import logger from 'util/logger';
import emailConfig from 'server/configs/email.config';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export default class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: emailConfig.service,
            auth: emailConfig.auth
        });
    }

    /**
     * Send an email
     * @param options - Email options
     * @returns Promise<boolean> - Whether the email was sent successfully
     */
    public async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            const mailOptions = {
                from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent: ${info.messageId}`);
            return true;
        } catch (error) {
            logger.error('Error sending email:', error);
            return false;
        }
    }

    /**
     * Send document processed notification
     * @param to - Recipient email
     * @param studentName - Student's name
     * @returns Promise<boolean>
     */
    public async sendDocumentProcessedNotification(to: string, studentName: string): Promise<boolean> {
        const { subject, template } = emailConfig.templates.documentProcessed;
        return this.sendEmail({
            to,
            subject,
            text: `Hồ sơ của học sinh ${studentName} đã được xử lý thành công.`
        });
    }

    /**
     * Send document processing error notification
     * @param to - Recipient email
     * @param jobId - Job ID
     * @param error - Error message
     * @returns Promise<boolean>
     */
    public async sendDocumentErrorNotification(to: string, jobId: string, error: string): Promise<boolean> {
        const { subject, template } = emailConfig.templates.documentFailed;
        return this.sendEmail({
            to,
            subject,
            text: `Hồ sơ ${jobId} xử lý thất bại: ${error}`
        });
    }

    /**
     * Send certificate verification notification
     * @param to - Recipient email
     * @param studentName - Student's name
     * @returns Promise<boolean>
     */
    public async sendCertificateVerifiedNotification(to: string, studentName: string): Promise<boolean> {
        const { subject, template } = emailConfig.templates.certificateVerified;
        return this.sendEmail({
            to,
            subject,
            text: `Chứng chỉ của học sinh ${studentName} đã được xác thực thành công.`
        });
    }

    /**
     * Send certificate verification error notification
     * @param to - Recipient email
     * @param jobId - Job ID
     * @param error - Error message
     * @returns Promise<boolean>
     */
    public async sendCertificateErrorNotification(to: string, jobId: string, error: string): Promise<boolean> {
        const { subject, template } = emailConfig.templates.certificateFailed;
        return this.sendEmail({
            to,
            subject,
            text: `Chứng chỉ ${jobId} xác thực thất bại: ${error}`
        });
    }
} 