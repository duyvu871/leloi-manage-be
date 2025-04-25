### Registration APIs
- **Create Application**: `POST /api/v1/registration/application`
- **Get Application**: `GET /api/v1/registration/application/{applicationId}`
- **Update Application**: `PUT /api/v1/registration/application/{applicationId}`
- **Delete Application**: `DELETE /api/v1/registration/application/{applicationId}`
- **Submit Application**: `POST /api/v1/registration/application/{applicationId}/submit`
- **Get Application Status**: `GET /api/v1/registration/application/{applicationId}/status`

### Document Management APIs
- **Upload Document**: `POST /api/v1/registration/document-upload`
- **Get Document**: `GET /api/v1/registration/document-upload/{documentId}`
- **Delete Document**: `DELETE /api/v1/registration/document-upload/{documentId}`
- **Get Application Documents**: `GET /api/v1/registration/application/{applicationId}/documents`
- **Get Extracted Data**: `GET /api/v1/registration/document-upload/{documentId}/extracted-data`
- **Verify Extracted Data**: `PATCH /api/v1/registration/document-upload/extracted-data/{extractedDataId}`

