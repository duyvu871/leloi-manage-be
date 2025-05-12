# Admin API Documentation

## Overview

The Admin API provides endpoints for managing students and applications. It is restricted to users with the 'admin' role.

## Authentication

All admin endpoints require authentication and the 'admin' role. Include the bearer token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Base URL

```
/api/v1/admin
```

## Endpoints

### Dashboard Stats

```
GET /api/v1/admin/stats
```

Returns basic statistics about registrations, students, and applications for the admin dashboard.

#### Response Schema

```typescript
interface AdminDashboardStatsDto {
    totalApplications: number;
    eligibleCount: number;
    ineligibleCount: number;
    pendingCount: number;
    confirmedCount: number;
}
```

### Detailed Statistics

```
GET /api/v1/admin/stats/detailed
```

Returns detailed statistics about student applications and their statuses.

#### Response Schema

```typescript
interface DetailedStatsDto {
    totalApplications: number;    // Tổng số hồ sơ
    eligibleCount: number;        // Đủ điều kiện
    ineligibleCount: number;      // Không đủ điều kiện
    processingCount: number;      // Đang xử lý
    confirmedCount: number;       // Đã xác nhận
}
```

### Student Management

#### List Students

```
GET /api/v1/admin/students
```

Returns a paginated list of students with filtering capabilities.

##### Query Parameters

| Parameter | Type   | Description                |
|-----------|--------|----------------------------|
| search    | string | Search by name or ID       |
| status    | string | Filter by status: eligible, ineligible, pending, confirmed |
| gender    | string | Filter by gender: male, female |
| school    | string | Filter by school name      |
| page      | number | Page number (default: 1)   |
| limit     | number | Items per page (default: 10) |

##### Response Schema

```typescript
interface PaginatedResponseDto<StudentListItemDto> {
    data: StudentListItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface StudentListItemDto {
    id: number;
    studentId: string;
    name: string;
    dob: Date;
    gender: "male" | "female";
    currentSchool: string;
    status: "eligible" | "ineligible" | "pending" | "confirmed";
    statusReason?: string;
    lastUpdated: Date;
}
```

#### Get Student Details

```
GET /api/v1/admin/students/:id
```

Returns detailed information about a specific student.

##### URL Parameters

| Parameter | Type   | Description                |
|-----------|--------|----------------------------|
| id        | string | The ID of the student      |

##### Response Schema

```typescript
interface StudentDetailDto {
    student: StudentDto;
    parent: ParentInfoDto;
    application: ApplicationDto | null;
    transcriptData: {
        subjects: Array<{
            name: string;
            score: number;
            evaluation?: string;
        }>;
        behavior?: string;
        attendanceRate?: string;
        teacherComments?: string;
    };
    status: {
        currentStatus: "eligible" | "ineligible" | "pending" | "confirmed";
        reason?: string;
        lastUpdated: Date;
        examInfo?: {
            sbd?: string;
            room?: string;
            date?: string;
            time?: string;
        };
    };
    certificates: string[];
}
```

#### Update Student Status

```
PATCH /api/v1/admin/students/:id/status
```

Updates the status of a student's application.

##### URL Parameters

| Parameter | Type   | Description                |
|-----------|--------|----------------------------|
| id        | string | The ID of the student      |

##### Request Body

```typescript
{
    "status": "eligible" | "ineligible" | "pending" | "confirmed",
    "reason": string, // Optional reason, required for "ineligible"
    "examInfo": { // Optional, for "eligible" or "confirmed"
        "sbd": string,
        "room": string,
        "date": string,
        "time": string
    }
}
```

#### Get Pending Review Students

```
GET /api/v1/admin/pending
```

Returns a list of students whose applications are pending review.

##### Query Parameters

| Parameter | Type   | Description                |
|-----------|--------|----------------------------|
| search    | string | Search by name or ID       |

##### Response Schema

```typescript
interface PendingReviewStudentDto[] {
    id: number;
    studentId: string;
    name: string;
    reason: string;
    lastUpdated: Date;
}
```

#### Verify Student by ID

```
GET /api/v1/admin/verify
```

Verifies a student by their ID and returns their details.

##### Query Parameters

| Parameter | Type   | Description                |
|-----------|--------|----------------------------|
| studentId | string | The ID of the student      |

##### Response Schema

Same as Student Details response.

#### Update Student Information

```
PATCH /api/v1/admin/students/:id
```

Updates the basic information of a student.

##### URL Parameters

| Parameter | Type   | Description                |
|-----------|--------|----------------------------|
| id        | string | The ID of the student      |

##### Request Body

```typescript
{
    fullName?: string;
    dateOfBirth?: Date;
    gender?: "male" | "female";
    educationDepartment?: string;
    primarySchool?: string;
    grade?: string;
    placeOfBirth?: string;
    ethnicity?: string;
    permanentAddress?: string;
    temporaryAddress?: string;
    currentAddress?: string;
    examNumber?: string;
    examRoom?: string;
    studentCode?: string;
    identificationNumber?: string;
}
```

##### Response Schema

Same as Student Details response.

#### Get Student Documents

```
GET /api/v1/admin/students/:id/documents
```

Returns a list of documents submitted by a specific student.

##### URL Parameters

| Parameter | Type   | Description                |
|-----------|--------|----------------------------|
| id        | string | The ID of the student      |

##### Response Schema

```typescript
interface StudentDocumentDto {
    id: number;
    documentId: number;
    applicationId: number;
    document: {
        id: number;
        name: string;
        description?: string;
        url: string;
        type: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        uploadedAt: Date;
    };
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    isEligible: boolean;
    rejectionReason?: string;
    verificationDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "errorCode": "UNAUTHORIZED",
  "errorDescription": "User not authenticated",
  "errorMessage": "Người dùng chưa đăng nhập",
  "statusCode": 401
}
```

### 403 Forbidden

```json
{
  "success": false,
  "errorCode": "INSUFFICIENT_PERMISSIONS",
  "errorDescription": "User does not have the required role",
  "errorMessage": "Bạn không có quyền để thực hiện chức năng này",
  "statusCode": 403
}
```

### 404 Not Found

```json
{
  "success": false,
  "errorCode": "STUDENT_NOT_FOUND",
  "errorDescription": "Student not found",
  "errorMessage": "Không tìm thấy học sinh",
  "statusCode": 404
}
```

### 400 Bad Request

```json
{
  "success": false,
  "errorCode": "INVALID_STUDENT_ID",
  "errorDescription": "Invalid student ID",
  "errorMessage": "Mã học sinh không hợp lệ",
  "statusCode": 400
}
``` 