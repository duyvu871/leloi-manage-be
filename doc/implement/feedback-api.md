# Feedback API Documentation

## Overview
The Feedback API provides endpoints for managing user feedback in the school admission system. It allows users to submit feedback, administrators to view feedback lists with filters, and update feedback status.

## Response Schema

### Success Response
```typescript
interface SuccessResponse<T> {
  status: number;
  message: string;
  data: T;
}
```

### Error Response
```typescript
interface ErrorResponse {
  errorCode: string;
  errorDescription: string;
  errorMessage: string;
  statusCode: number;
}
```

### Pagination Response
```typescript
interface Pagination<T> {
  data: T[];
  page: number;
  total: number;
  totalPage: number;
}
```

### Pagination Query Parameters
```typescript
interface PaginationFilterParams {
  page: number;
  pageSize: number;
  search?: string;      // search by fts
  searchFields?: string; // name:abc, name:def
  orderBy?: string;     // created_at:desc, created_at:asc
  filterBy?: string;    // status:1, status:0
}
```

## API Endpoints

### 1. Submit Feedback
Submit a new feedback entry.

**Endpoint:** `POST /api/v1/feedback`

**Request Body:**
```typescript
{
  type: 'error' | 'suggestion' | 'other';
  content: string;
  needSupport: boolean;
  needCallback: boolean;
  isUrgent: boolean;
}
```

**Response:**
```typescript
{
  status: number;
  message: string;
  data: {
    id: number;
    type: 'error' | 'suggestion' | 'other';
    content: string;
    needSupport: boolean;
    needCallback: boolean;
    isUrgent: boolean;
    status: 'pending' | 'resolved';
    createdAt: string;
    updatedAt: string;
  }
}
```

**Example:**
```json
// Request
POST /api/v1/feedback
{
  "type": "suggestion",
  "content": "Cần thêm hướng dẫn chi tiết về quy trình nộp hồ sơ",
  "needSupport": true,
  "needCallback": true,
  "isUrgent": false
}

// Response
{
  "status": 200,
  "message": "Feedback submitted successfully",
  "data": {
    "id": 1,
    "type": "suggestion",
    "content": "Cần thêm hướng dẫn chi tiết về quy trình nộp hồ sơ",
    "needSupport": true,
    "needCallback": true,
    "isUrgent": false,
    "status": "pending",
    "createdAt": "2024-03-15T10:30:00Z",
    "updatedAt": "2024-03-15T10:30:00Z"
  }
}
```

### 2. Get Feedback List
Retrieve a list of feedback with optional filters and pagination.

**Endpoint:** `GET /api/v1/feedback`

**Query Parameters:**
```typescript
{
  // Pagination parameters
  page: number;
  pageSize: number;
  search?: string;
  searchFields?: string;
  orderBy?: string;
  filterBy?: string;

  // Feedback specific filters
  type?: 'error' | 'suggestion' | 'other';
  status?: 'pending' | 'resolved';
  isUrgent?: boolean;
  needCallback?: boolean;
}
```

**Response:**
```typescript
{
  status: number;
  message: string;
  data: {
    data: Array<{
      id: number;
      type: 'error' | 'suggestion' | 'other';
      content: string;
      needSupport: boolean;
      needCallback: boolean;
      isUrgent: boolean;
      status: 'pending' | 'resolved';
      createdAt: string;
      updatedAt: string;
    }>;
    page: number;
    total: number;
    totalPage: number;
  }
}
```

**Example:**
```json
// Request
GET /api/v1/feedback?type=error&status=pending&page=1&pageSize=10

// Response
{
  "status": 200,
  "message": "Feedback list retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "type": "error",
        "content": "Không thể tải lên file hồ sơ",
        "needSupport": true,
        "needCallback": true,
        "isUrgent": true,
        "status": "pending",
        "createdAt": "2024-03-15T09:00:00Z",
        "updatedAt": "2024-03-15T09:00:00Z"
      }
    ],
    "page": 1,
    "total": 1,
    "totalPage": 1
  }
}
```

### 3. Update Feedback Status
Update the status of a specific feedback entry.

**Endpoint:** `PATCH /api/v1/feedback/:id/status`

**Request Body:**
```typescript
{
  status: 'pending' | 'resolved'
}
```

**Response:**
```typescript
{
  status: number;
  message: string;
  data: {
    id: number;
    type: 'error' | 'suggestion' | 'other';
    content: string;
    needSupport: boolean;
    needCallback: boolean;
    isUrgent: boolean;
    status: 'pending' | 'resolved';
    createdAt: string;
    updatedAt: string;
  }
}
```

**Example:**
```json
// Request
PATCH /api/v1/feedback/1/status
{
  "status": "resolved"
}

// Response
{
  "status": 200,
  "message": "Feedback status updated successfully",
  "data": {
    "id": 1,
    "type": "error",
    "content": "Không thể tải lên file hồ sơ",
    "needSupport": true,
    "needCallback": true,
    "isUrgent": true,
    "status": "resolved",
    "createdAt": "2024-03-15T09:00:00Z",
    "updatedAt": "2024-03-15T10:15:00Z"
  }
}
```

## Types

### Feedback Type
```typescript
interface Feedback {
  id?: number;
  type: 'error' | 'suggestion' | 'other';
  content: string;
  needSupport: boolean;
  needCallback: boolean;
  isUrgent: boolean;
  status: 'pending' | 'resolved';
  createdAt?: string;
  updatedAt?: string;
}
```

### Create Feedback DTO
```typescript
interface CreateFeedbackDto {
  type: 'error' | 'suggestion' | 'other';
  content: string;
  needSupport: boolean;
  needCallback: boolean;
  isUrgent: boolean;
}
```

## Error Handling

The API uses standard HTTP status codes for error responses:

- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Feedback entry not found
- `500 Internal Server Error`: Server-side error

Error responses follow this format:
```json
{
  "errorCode": "ERROR_CODE",
  "errorDescription": "Error description",
  "errorMessage": "Detailed error message",
  "statusCode": 400
}
```

## Notes

1. All timestamps are returned in ISO 8601 format (UTC)
2. Authentication is required for all endpoints
3. The `needCallback` flag indicates if the user wants to be contacted about their feedback
4. The `needSupport` flag indicates if the user needs additional assistance
5. The `isUrgent` flag helps prioritize critical feedback items
6. Pagination is available for list endpoints with customizable page size and filters 