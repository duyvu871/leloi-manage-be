# Registration API Documentation

## Get Registration Data

Retrieves detailed registration data for a specific student.

### Endpoint

```
GET /api/v1/registration/:studentId
```

### Authentication

- Required
- Bearer token must be provided in Authorization header

### URL Parameters

| Parameter  | Type   | Description                    |
|------------|--------|--------------------------------|
| studentId  | string | The ID of the student         |

### Response Schema

```typescript
interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RegistrationResponseDto {
    student: {
        id: number;
        userId: number;
        fullName: string;
        dateOfBirth: Date;
        gender: string;
        educationDepartment: string;
        primarySchool: string;
        grade: string;
        placeOfBirth: string;
        ethnicity: string;
        permanentAddress: string;
        temporaryAddress?: string;
        currentAddress: string;
        examNumber?: string;
        examRoom?: string;
        studentCode?: string;
        identificationNumber?: string;
        createdAt: Date;
        updatedAt: Date;
    };
    application: {
        id: number;
        studentId: number;
        createdAt: Date;
        updatedAt: Date;
    } | null;
    parentInfo: {
        id: number;
        userId: number;
        fatherName?: string;
        fatherBirthYear?: number;
        fatherPhone?: string;
        fatherIdCard?: string;
        fatherOccupation?: string;
        fatherWorkplace?: string;
        motherName?: string;
        motherBirthYear?: number;
        motherPhone?: string;
        motherIdCard?: string;
        motherOccupation?: string;
        motherWorkplace?: string;
        guardianName?: string;
        guardianBirthYear?: number;
        guardianPhone?: string;
        guardianIdCard?: string;
        guardianOccupation?: string;
        guardianWorkplace?: string;
        guardianRelationship?: string;
        createdAt: Date;
        updatedAt: Date;
    };
    priorityPoint?: {
        id: number;
        studentId: number;
        type: string;
        points: number;
        createdAt: Date;
        updatedAt: Date;
    };
    competitionResults?: Array<{
        competitionId: string;
        level: string;
        achievement: string;
        points: number;
        year: number;
    }>;
    commitment?: {
        id: number;
        studentId: number;
        relationship: string;
        signatureDate: Date;
        guardianName: string;
        applicantName: string;
        createdAt: Date;
        updatedAt: Date;
    };
    academicRecords?: {
        academicRecords: {
            grades: Array<{
                grade: number;
                math: number;
                vietnamese: number;
                english?: number;
                science?: number;
                history?: number;
            }>;
        };
    };
}
```

### Success Response Example

```json
{
  "success": true,
  "message": "Lấy thông tin đăng ký thành công",
  "data": {
    "student": {
      "id": 1,
      "userId": 1,
      "fullName": "Nguyễn Văn A",
      "dateOfBirth": "2010-01-01T00:00:00.000Z",
      "gender": "male",
      "educationDepartment": "Phòng GD&ĐT Quận 1",
      "primarySchool": "Tiểu học Nguyễn Bỉnh Khiêm",
      "grade": "5",
      "placeOfBirth": "TP.HCM",
      "ethnicity": "Kinh",
      "permanentAddress": "123 Nguyễn Huệ, Q.1, TP.HCM",
      "currentAddress": "123 Nguyễn Huệ, Q.1, TP.HCM",
      "createdAt": "2024-03-15T07:00:00.000Z",
      "updatedAt": "2024-03-15T07:00:00.000Z"
    },
    "parentInfo": {
      "id": 1,
      "userId": 1,
      "fatherName": "Nguyễn Văn B",
      "fatherPhone": "0901234567",
      "motherName": "Trần Thị C",
      "motherPhone": "0907654321",
      "createdAt": "2024-03-15T07:00:00.000Z",
      "updatedAt": "2024-03-15T07:00:00.000Z"
    },
    "academicRecords": {
      "academicRecords": {
        "grades": [
          {
            "grade": 4,
            "math": 9.0,
            "vietnamese": 8.5,
            "english": 8.0
          },
          {
            "grade": 5,
            "math": 9.5,
            "vietnamese": 9.0,
            "english": 8.5
          }
        ]
      }
    }
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "errorCode": "USER_NOT_FOUND",
  "errorDescription": "User not found",
  "errorMessage": "Không tìm thấy người dùng",
  "statusCode": 401
}
```

#### 400 Bad Request
```json
{
  "errorCode": "STUDENT_NOT_FOUND",
  "errorDescription": "Student not found",
  "errorMessage": "Không tìm thấy học sinh",
  "statusCode": 400
}
```

### Notes

1. All timestamps are returned in ISO 8601 format (UTC)
2. Optional fields may be null or undefined
3. Academic records include grades for different subjects across school years
4. Competition results and priority points are optional and may not be present
5. Parent information includes details for father, mother, and/or guardian 