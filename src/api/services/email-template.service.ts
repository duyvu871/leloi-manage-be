import { NotificationPayload } from 'server/common/interfaces/notification.service.interface';

interface EmailTemplateData {
    studentName?: string;
    jobId?: string;
    documentType?: string;
    schoolName?: string;
    error?: string;
    [key: string]: any;
}

export class EmailTemplateService {
    /**
     * Generate email content for document processing completion
     */
    public static documentProcessed(data: EmailTemplateData): { subject: string; text: string; html: string } {
        const subject = `Thông báo xử lý ${data.documentType || 'hồ sơ'} hoàn tất`;
        const text = `
Kính gửi Phụ huynh/Người giám hộ của học sinh ${data.studentName},

Hệ thống xin thông báo ${data.documentType || 'hồ sơ'} của học sinh đã được xử lý thành công.

Chi tiết:
- Học sinh: ${data.studentName}
- Loại hồ sơ: ${data.documentType}
- Mã xử lý: ${data.jobId}

Quý phụ huynh vui lòng đăng nhập vào hệ thống để xem chi tiết kết quả.

Trân trọng,
${data.schoolName || 'Trường THCS Lê Lợi'}
        `.trim();

        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50; margin-bottom: 20px;">Thông báo xử lý ${data.documentType || 'hồ sơ'} hoàn tất</h2>
    
    <p style="color: #34495e; line-height: 1.6;">Kính gửi Phụ huynh/Người giám hộ của học sinh <strong>${data.studentName}</strong>,</p>
    
    <p style="color: #34495e; line-height: 1.6;">
        Hệ thống xin thông báo ${data.documentType || 'hồ sơ'} của học sinh đã được xử lý thành công.
    </p>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Chi tiết:</h3>
        <ul style="color: #34495e; line-height: 1.6;">
            <li>Học sinh: <strong>${data.studentName}</strong></li>
            <li>Loại hồ sơ: <strong>${data.documentType}</strong></li>
            <li>Mã xử lý: <strong>${data.jobId}</strong></li>
        </ul>
    </div>
    
    <p style="color: #34495e; line-height: 1.6;">
        Quý phụ huynh vui lòng đăng nhập vào hệ thống để xem chi tiết kết quả.
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #34495e; margin: 0;">Trân trọng,</p>
        <p style="color: #34495e; font-weight: bold; margin: 5px 0;">
            ${data.schoolName || 'Trường THCS Lê Lợi'}
        </p>
    </div>
</div>
        `.trim();

        return { subject, text, html };
    }

    /**
     * Generate email content for document processing error
     */
    public static documentError(data: EmailTemplateData): { subject: string; text: string; html: string } {
        const subject = `Thông báo lỗi xử lý ${data.documentType || 'hồ sơ'}`;
        const text = `
Kính gửi Phụ huynh/Người giám hộ của học sinh ${data.studentName},

Hệ thống gặp lỗi khi xử lý ${data.documentType || 'hồ sơ'} của học sinh.

Chi tiết:
- Học sinh: ${data.studentName}
- Loại hồ sơ: ${data.documentType}
- Mã xử lý: ${data.jobId}
- Lỗi: ${data.error}

Quý phụ huynh vui lòng kiểm tra lại hồ sơ và thử lại.
Nếu cần hỗ trợ, vui lòng liên hệ với nhà trường.

Trân trọng,
${data.schoolName || 'Trường THCS Lê Lợi'}
        `.trim();

        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #e74c3c; margin-bottom: 20px;">Thông báo lỗi xử lý ${data.documentType || 'hồ sơ'}</h2>
    
    <p style="color: #34495e; line-height: 1.6;">Kính gửi Phụ huynh/Người giám hộ của học sinh <strong>${data.studentName}</strong>,</p>
    
    <p style="color: #34495e; line-height: 1.6;">
        Hệ thống gặp lỗi khi xử lý ${data.documentType || 'hồ sơ'} của học sinh.
    </p>
    
    <div style="background-color: #fff3f3; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffd7d7;">
        <h3 style="color: #c0392b; margin-top: 0;">Chi tiết lỗi:</h3>
        <ul style="color: #34495e; line-height: 1.6;">
            <li>Học sinh: <strong>${data.studentName}</strong></li>
            <li>Loại hồ sơ: <strong>${data.documentType}</strong></li>
            <li>Mã xử lý: <strong>${data.jobId}</strong></li>
            <li>Lỗi: <strong>${data.error}</strong></li>
        </ul>
    </div>
    
    <p style="color: #34495e; line-height: 1.6;">
        Quý phụ huynh vui lòng kiểm tra lại hồ sơ và thử lại.<br>
        Nếu cần hỗ trợ, vui lòng liên hệ với nhà trường.
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #34495e; margin: 0;">Trân trọng,</p>
        <p style="color: #34495e; font-weight: bold; margin: 5px 0;">
            ${data.schoolName || 'Trường THCS Lê Lợi'}
        </p>
    </div>
</div>
        `.trim();

        return { subject, text, html };
    }

    /**
     * Generate custom email content from a notification payload
     */
    public static fromNotificationPayload(payload: NotificationPayload): { subject: string; text: string; html: string } {
        const text = `${payload.title}\n\n${payload.message}`;
        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50; margin-bottom: 20px;">${this.escapeHtml(payload.title)}</h2>
    
    <div style="color: #34495e; line-height: 1.6;">
        ${this.escapeHtml(payload.message).replace(/\n/g, '<br>')}
    </div>
    
    ${payload.metadata ? this.formatMetadata(payload.metadata) : ''}
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 12px;">
        ${payload.type ? `Loại thông báo: ${this.escapeHtml(payload.type)}<br>` : ''}
        ${payload.priority ? `Mức độ ưu tiên: ${this.escapeHtml(payload.priority)}` : ''}
    </div>
</div>
        `.trim();

        return { subject: payload.title, text, html };
    }

    private static formatMetadata(metadata: Record<string, any>): string {
        if (!metadata || Object.keys(metadata).length === 0) return '';

        return `
<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="color: #2c3e50; margin-top: 0;">Thông tin chi tiết:</h3>
    <ul style="color: #34495e; line-height: 1.6;">
        ${Object.entries(metadata)
            .map(([key, value]) => `<li>${this.escapeHtml(key)}: <strong>${this.escapeHtml(String(value))}</strong></li>`)
            .join('')}
    </ul>
</div>
        `.trim();
    }

    private static escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
} 