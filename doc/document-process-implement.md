API cho Xử lí học bạ scan
Request:
curl -X 'POST' \
  'http://127.0.0.1:2345/upload-pdf/' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@Lê Ngọc Hải.pdf;type=application/pdf'
​
Response example: unk : no information
{
  "Lớp 1": {
    "Tên": "Bùi Chí Hiếu",
    "Điểm": [
      {
        "Môn": "Tiếng Việt",
        "Mức": "T",
        "Điểm": 10
      },
      {
        "Môn": "Toán",
        "Mức": "T",
        "Điểm": 9
      },
      {
        "Môn": "Tự nhiên và xã hội",
        "Mức": "T",
        "Điểm": "unk"
      },
      {
        "Môn": "Đạo đức",
        "Mức": "T",
        "Điểm": "unk"
      },
      {
        "Môn": "Âm nhạc",
        "Mức": "H",
        "Điểm": "unk"
      },
      {
        "Môn": "Mỹ thuật",
        "Mức": "T",
        "Điểm": "unk"
      },
      {
        "Môn": "Thủ công",
        "Mức": "H",
        "Điểm": "unk"
      },
      {
        "Môn": "Thể dục",
        "Mức": "H",
        "Điểm": "unk"
      }
    ],
    "Phẩm chất": {
      "Chăm học, chăm làm": "Tốt",
      "Tự tin, trách nhiệm": "Tốt",
      "Trung thực, kỉ luật": "Tốt",
      "Đoàn kết, yêu thương": "Tốt"
    },
    "Năng lực": {
      "Tự phục vụ, tự quản": "Tốt",
      "Hợp tác": "Tốt",
      "Tự học và giải quyết vấn đề": "Tốt"
    }
  },
	....
}
​
API xử lí chứng chỉ:
curl -X 'POST' \
  'http://localhost:2345/certificate?name=NAME' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@unnamed (1).jpg;type=image/jpeg'
​
Response example:
{
  "name": "Name of post request", 
  "extracted_name": "extracted name from image",
  "level": "Tỉnh",
  "correct": false
}

# Document Upload API Endpoints

This document describes the API endpoints for document upload and processing in the Le Loi application system.

## Upload and Process Document

Uploads a document file and extracts data from it.

### Request

```
POST /api/v1/registration/document-upload
```

**Headers:**
- `Content-Type: multipart/form-data`

**Form Data Parameters:**
- `file`: The document file to upload (Required)
- `type`: The type of document being uploaded (Required)
- `applicationId`: The ID of the application this document belongs to (Required)

### Response

```json
{
  "success": true,
  "data": {
    "document": {
      "id": 123,
      "type": "identity",
      "filename": "example.pdf",
      "url": "https://example.com/path/to/file.pdf",
      "uploadedAt": "2025-04-25T10:30:00Z"
    },
    "extractedData": {
      "id": 456,
      "fields": {
        // Document-specific extracted data
      },
      "isVerified": false
    }
  }
}
```

## Get Application Documents

Retrieves all documents associated with a specific application.

### Request

```
GET /api/v1/registration/application/{applicationId}/documents
```

**URL Parameters:**
- `applicationId`: The ID of the application to get documents for (Required)

### Response

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 123,
        "type": "identity",
        "filename": "example.pdf",
        "url": "https://example.com/path/to/file.pdf",
        "uploadedAt": "2025-04-25T10:30:00Z"
      },
      // Other documents
    ]
  }
}
```

## Get Extracted Data

Retrieves the extracted data for a specific document.

### Request

```
GET /api/v1/registration/document-upload/{documentId}/extracted-data
```

**URL Parameters:**
- `documentId`: The ID of the document to get extracted data for (Required)

### Response

```json
{
  "success": true,
  "data": {
    "extractedData": {
      "id": 456,
      "fields": {
        // Document-specific extracted data
      },
      "isVerified": false
    }
  }
}
```

## Verify Extracted Data

Updates the verification status for extracted data.

### Request

```
PATCH /api/v1/registration/document-upload/extracted-data/{extractedDataId}
```

**URL Parameters:**
- `extractedDataId`: The ID of the extracted data to update (Required)

**Request Body:**
```json
{
  "isVerified": true
}
```

### Response

```json
{
  "success": true,
  "data": {
    "extractedData": {
      "id": 456,
      "fields": {
        // Document-specific extracted data
      },
      "isVerified": true
    }
  }
}
```