# Kế hoạch triển khai hệ thống quản lý tuyển sinh

Dựa trên yêu cầu từ file requirement.md, tài liệu này mô tả chi tiết kế hoạch triển khai hệ thống quản lý tuyển sinh, bao gồm cấu trúc database, API endpoints, DTOs và các chức năng chính.

## 1. Cấu trúc Database

### 1.1. Các Entity chính

#### User
```prisma
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique @db.VarChar(50)
  email        String   @unique @db.VarChar(100)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  // Relations
  userRoles     UserRole[]
  refreshTokens RefreshToken[]
  userProfile   UserProfile?
  parent        Parent?
  manager       Manager?
  
  @@map("users")
}
```

#### UserRole (Phân quyền)
```prisma
model UserRole {
  userId Int @map("user_id")
  roleId Int @map("role_id")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}
```

#### Parent (Phụ huynh)
```prisma
model Parent {
  id        Int      @id @default(autoincrement())
  userId    Int      @unique @map("user_id")
  phone     String   @db.VarChar(15)
  address   String   @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relations
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  students  Student[]
  
  @@map("parents")
}
```

#### Manager (Người quản lý)
```prisma
model Manager {
  id        Int      @id @default(autoincrement())
  userId    Int      @unique @map("user_id")
  position  String   @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relations
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  schedules Schedule[]
  
  @@map("managers")
}
```

#### Student (Học sinh)
```prisma
model Student {
  id            Int      @id @default(autoincrement())
  parentId      Int      @map("parent_id")
  fullName      String   @map("full_name") @db.VarChar(100)
  dateOfBirth   DateTime @map("date_of_birth")
  gender        String   @db.VarChar(10)
  schoolOrigin  String   @map("school_origin") @db.VarChar(255)
  examNumber    String?  @unique @map("exam_number") @db.VarChar(20)
  examRoom      String?  @map("exam_room") @db.VarChar(20)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relations
  parent        Parent     @relation(fields: [parentId], references: [id], onDelete: Cascade)
  application   Application?
  
  @@map("students")
}
```

#### Application (Hồ sơ đăng ký)
```prisma
model Application {
  id                Int       @id @default(autoincrement())
  studentId         Int       @unique @map("student_id")
  status            String    @db.VarChar(50) // PENDING, APPROVED, REJECTED, WAITING_VERIFICATION
  isEligible        Boolean   @default(false) @map("is_eligible")
  rejectionReason   String?   @map("rejection_reason") @db.Text
  verificationDate  DateTime? @map("verification_date")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  // Relations
  student           Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  documents         Document[]
  scheduleSlot      ScheduleSlot?
  
  @@map("applications")
}
```

#### Document (Tài liệu)
```prisma
model Document {
  id            Int       @id @default(autoincrement())
  applicationId Int       @map("application_id")
  type          String    @db.VarChar(50) // TRANSCRIPT, CERTIFICATE, OTHER
  filePath      String    @map("file_path") @db.VarChar(255)
  fileSize      Int       @map("file_size")
  mimeType      String    @map("mime_type") @db.VarChar(100)
  uploadedAt    DateTime  @default(now()) @map("uploaded_at")
  
  // Relations
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  extractedData ExtractedData?
  
  @@map("documents")
}
```

#### ExtractedData (Dữ liệu trích xuất từ học bạ)
```prisma
model ExtractedData {
  id          Int       @id @default(autoincrement())
  documentId  Int       @unique @map("document_id")
  data        Json      // Lưu trữ dữ liệu trích xuất dạng JSON
  isVerified  Boolean   @default(false) @map("is_verified")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  // Relations
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@map("extracted_data")
}
```

#### Schedule (Lịch nộp hồ sơ trực tiếp)
```prisma
model Schedule {
  id          Int       @id @default(autoincrement())
  managerId   Int       @map("manager_id")
  title       String    @db.VarChar(255)
  description String?   @db.Text
  startDate   DateTime  @map("start_date")
  endDate     DateTime  @map("end_date")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  // Relations
  manager     Manager   @relation(fields: [managerId], references: [id])
  slots       ScheduleSlot[]
  
  @@map("schedules")
}
```

#### ScheduleSlot (Khung giờ nộp hồ sơ)
```prisma
model ScheduleSlot {
  id            Int       @id @default(autoincrement())
  scheduleId    Int       @map("schedule_id")
  applicationId Int?      @unique @map("application_id")
  startTime     DateTime  @map("start_time")
  endTime       DateTime  @map("end_time")
  capacity      Int       @default(1)
  isFilled      Boolean   @default(false) @map("is_filled")
  
  // Relations
  schedule      Schedule   @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  application   Application? @relation(fields: [applicationId], references: [id])
  
  @@map("schedule_slots")
}
```

## 2. API Endpoints và DTOs

### 2.1. Authentication

#### Endpoints
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh-token` - Làm mới token
- `POST /api/auth/logout` - Đăng xuất

#### DTOs
```typescript
// RegisterDto
export type RegisterDto = {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
  role: 'parent' | 'manager';
}

// LoginDto
export type LoginDto = {
  username: string;
  password: string;
}
```

### 2.2. Phụ huynh (Parent)

#### Endpoints
- `POST /api/parent/students` - Thêm thông tin học sinh
- `GET /api/parent/students` - Lấy danh sách học sinh của phụ huynh
- `GET /api/parent/students/:id` - Lấy thông tin chi tiết học sinh
- `POST /api/parent/applications` - Tạo hồ sơ đăng ký
- `GET /api/parent/applications` - Lấy danh sách hồ sơ đăng ký
- `GET /api/parent/applications/:id` - Lấy thông tin chi tiết hồ sơ
- `POST /api/parent/documents/upload` - Tải lên tài liệu (học bạ, chứng chỉ)
- `GET /api/parent/schedules` - Xem lịch nộp hồ sơ trực tiếp
- `POST /api/parent/schedules/book` - Đặt lịch nộp hồ sơ trực tiếp

#### DTOs
```typescript
// StudentDto
export type StudentDto = {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  schoolOrigin: string;
}

// ApplicationDto
export type ApplicationDto = {
  studentId: number;
}

// DocumentUploadDto
export type DocumentUploadDto = {
  applicationId: number;
  type: 'TRANSCRIPT' | 'CERTIFICATE' | 'OTHER';
  // File sẽ được xử lý bởi multer middleware
}

// BookScheduleDto
export type BookScheduleDto = {
  applicationId: number;
  scheduleSlotId: number;
}
```

### 2.3. Người quản lý (Manager)

#### Endpoints
- `POST /api/manager/schedules` - Tạo lịch nộp hồ sơ
- `GET /api/manager/schedules` - Lấy danh sách lịch nộp hồ sơ
- `POST /api/manager/schedules/:id/slots` - Thêm khung giờ cho lịch
- `GET /api/manager/applications` - Lấy danh sách hồ sơ đăng ký
- `GET /api/manager/applications/:id` - Xem chi tiết hồ sơ đăng ký
- `PUT /api/manager/applications/:id/verify` - Xác minh hồ sơ đăng ký
- `PUT /api/manager/applications/:id/approve` - Phê duyệt hồ sơ đăng ký
- `PUT /api/manager/applications/:id/reject` - Từ chối hồ sơ đăng ký
- `PUT /api/manager/applications/:id/assign-exam` - Gán số báo danh và phòng thi

#### DTOs
```typescript
// ScheduleDto
export type ScheduleDto = {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

// ScheduleSlotDto
export type ScheduleSlotDto = {
  startTime: string;
  endTime: string;
  capacity: number;
}

// ApplicationFilterDto
export type ApplicationFilterDto = {
  search?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITING_VERIFICATION';
  fromDate?: string;
  toDate?: string;
}

// VerifyApplicationDto
export type VerifyApplicationDto = {
  isVerified: boolean;
  rejectionReason?: string;
}

// AssignExamDto
export type AssignExamDto = {
  examNumber: string;
  examRoom: string;
}
```

## 3. Services

### 3.1. AuthService
- Đăng ký tài khoản
- Đăng nhập
- Quản lý token

### 3.2. ParentService
- Quản lý thông tin học sinh
- Tạo và quản lý hồ sơ đăng ký
- Tải lên và quản lý tài liệu

### 3.3. DocumentService
- Xử lý tải lên tài liệu
- Trích xuất thông tin từ học bạ PDF
- Lưu trữ và quản lý tài liệu

### 3.4. ApplicationService
- Xử lý hồ sơ đăng ký
- Kiểm tra điều kiện đủ/không đủ
- Quản lý trạng thái hồ sơ

### 3.5. ScheduleService
- Tạo và quản lý lịch nộp hồ sơ
- Quản lý khung giờ
- Đặt lịch cho phụ huynh

### 3.6. ManagerService
- Quản lý danh sách học sinh
- Xác minh và phê duyệt hồ sơ
- Gán số báo danh và phòng thi

### 3.7. NotificationService
- Gửi email thông báo
- Quản lý thông báo trong hệ thống

## 4. Chức năng trích xuất thông tin từ PDF

### 4.1. Công nghệ sử dụng
- OCR (Optical Character Recognition) để nhận dạng văn bản từ file PDF
- Thư viện xử lý PDF: pdf.js hoặc pdf-parse
- Thư viện OCR: Tesseract.js hoặc tích hợp với dịch vụ OCR bên ngoài

### 4.2. Quy trình xử lý
1. Phụ huynh tải lên file PDF học bạ
2. Hệ thống lưu trữ file vào MinIO
3. Hệ thống sử dụng OCR để trích xuất văn bản từ file PDF
4. Phân tích văn bản để trích xuất thông tin cần thiết (điểm số, nhận xét)
5. Lưu trữ thông tin trích xuất vào database
6. Hiển thị thông tin trích xuất cho phụ huynh xác nhận

### 4.3. Xử lý lỗi
- Nếu không thể trích xuất thông tin hoặc thông tin không chính xác, đánh dấu hồ sơ cần xác minh thủ công
- Cho phép người quản lý xem file gốc và cập nhật thông tin thủ công

## 5. Hệ thống gửi email

### 5.1. Các loại email
- Email xác nhận đăng ký tài khoản
- Email thông báo hồ sơ đủ điều kiện
- Email mời nộp hồ sơ trực tiếp
- Email thông báo số báo danh và phòng thi

### 5.2. Công nghệ sử dụng
- Nodemailer để gửi email
- Handlebars để tạo template email
- Queue system (Bull hoặc Agenda) để xử lý việc gửi email bất đồng bộ

## 6. Swagger Documentation

Tất cả các API endpoints sẽ được tài liệu hóa đầy đủ bằng Swagger:

```typescript
// Ví dụ cho API đăng ký
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterDto'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 tokens:
 *                   type: object
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Tên đăng nhập hoặc email đã tồn tại
 */
```

## 7. Kế hoạch triển khai

### 7.1. Giai đoạn 1: Thiết lập cơ sở dữ liệu và xác thực
- Tạo schema database
- Triển khai API xác thực (đăng ký, đăng nhập)
- Phân quyền người dùng (phụ huynh, người quản lý)

### 7.2. Giai đoạn 2: Chức năng dành cho phụ huynh
- API quản lý thông tin học sinh
- API tạo hồ sơ đăng ký
- Chức năng tải lên tài liệu
- Trích xuất thông tin từ học bạ PDF

### 7.3. Giai đoạn 3: Chức năng dành cho người quản lý
- API quản lý danh sách học sinh
- API xác minh và phê duyệt hồ sơ
- Chức năng lên lịch nộp hồ sơ trực tiếp
- Chức năng gán số báo danh và phòng thi

### 7.4. Giai đoạn 4: Hệ thống thông báo và email
- Triển khai hệ thống gửi email
- Tạo các template email
- Tích hợp thông báo vào các quy trình xử lý

### 7.5. Giai đoạn 5: Kiểm thử và tối ưu hóa
- Kiểm thử toàn diện các chức năng
- Tối ưu hóa hiệu suất
- Xử lý các trường hợp đặc biệt và ngoại lệ

## 8. Các công nghệ bổ sung

### 8.1. Logging và Monitoring
- Winston để ghi log
- Prometheus và Grafana để giám sát hệ thống

### 8.2. Bảo mật
- Helmet để bảo vệ Express.js
- Rate limiting để ngăn chặn tấn công brute force
- CSRF protection
- Sanitize input để ngăn chặn XSS

### 8.3. Caching
- Redis để cache dữ liệu thường xuyên truy cập
- Cache response API để tăng hiệu suất

### 8.4. Testing
- Jest cho unit testing
- Supertest cho API testing
- CI/CD pipeline để tự động hóa kiểm thử