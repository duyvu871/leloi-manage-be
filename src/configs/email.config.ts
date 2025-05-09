import appConfig from './app.config';

export default {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER || 'admin@school.edu.vn',
        pass: process.env.EMAIL_PASSWORD
    },
    from: {
        name: 'Trường THCS Lê Lợi',
        address: process.env.EMAIL_FROM || 'admin@school.edu.vn'
    },
    templates: {
        documentProcessed: {
            subject: 'Hồ sơ đã được xử lý',
            template: 'document-processed'
        },
        documentFailed: {
            subject: 'Lỗi xử lý hồ sơ',
            template: 'document-failed'
        },
        certificateVerified: {
            subject: 'Chứng chỉ đã được xác thực',
            template: 'certificate-verified'
        },
        certificateFailed: {
            subject: 'Lỗi xác thực chứng chỉ',
            template: 'certificate-failed'
        }
    }
}; 