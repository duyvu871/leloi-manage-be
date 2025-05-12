# Timeline API Implementation Guide

This document outlines the requirements for implementing the Timeline API endpoints in the backend.

## API Endpoints

The following endpoints should be implemented:

| Method | Endpoint                              | Description                                |
|--------|---------------------------------------|--------------------------------------------|
| GET    | `/api/v1/timeline`                    | List all timeline items with filtering     |
| GET    | `/api/v1/timeline/item/:id`           | Get a specific timeline item by ID         |
| POST   | `/api/v1/timeline/item`               | Create a new timeline item                 |
| PATCH  | `/api/v1/timeline/item/:id`           | Update an existing timeline item           |
| DELETE | `/api/v1/timeline/item/:id`           | Delete a timeline item                     |
| PATCH  | `/api/v1/timeline/item/:id/visibility`| Toggle visibility of a timeline item       |
| POST   | `/api/v1/timeline/import`             | Import multiple timeline items             |
| GET    | `/api/v1/timeline/export`             | Export timeline items                      |
| POST   | `/api/v1/timeline/reorder`            | Reorder timeline items                     |
| PATCH  | `/api/v1/timeline/batch`              | Batch update multiple timeline items       |

## Database Model

```typescript
// Timeline Item Model
interface TimelineItem {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  description: string;
  status: 'active' | 'upcoming' | 'completed';
  color: string;
  alert: {
    title: string;
    content: string;
    type: 'info' | 'warning';
  };
  links: Array<{
    text: string;
    url: string;
  }>;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## DTOs (Data Transfer Objects)

### Request DTOs

#### TimelineQueryDto

```typescript
export class TimelineQueryDto {
  status?: 'active' | 'upcoming' | 'completed';
  hidden?: boolean;
  limit?: number;
  offset?: number;
}
```

#### CreateTimelineItemDto

```typescript
export class CreateTimelineItemDto {
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'active' | 'upcoming' | 'completed';
  color: string;
  alert: {
    title: string;
    content: string;
    type: 'info' | 'warning';
  };
  links: Array<{
    text: string;
    url: string;
  }>;
  hidden?: boolean;
}
```

#### UpdateTimelineItemDto

```typescript
export class UpdateTimelineItemDto {
  title?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: 'active' | 'upcoming' | 'completed';
  color?: string;
  alert?: {
    title?: string;
    content?: string;
    type?: 'info' | 'warning';
  };
  links?: Array<{
    text: string;
    url: string;
  }>;
  hidden?: boolean;
}
```

#### ToggleVisibilityDto

```typescript
export class ToggleVisibilityDto {
  hidden: boolean;
}
```

#### ReorderTimelineItemsDto

```typescript
export class ReorderTimelineItemsDto {
  itemIds: number[];
}
```

#### BatchUpdateTimelineItemsDto

```typescript
export class BatchUpdateTimelineItemsDto {
  updates: Array<{
    id: number;
    data: UpdateTimelineItemDto;
  }>;
}
```

#### ImportTimelineItemsDto

```typescript
export class ImportTimelineItemsDto {
  items: CreateTimelineItemDto[];
}
```

### Response DTOs

#### TimelineItemResponseDto

```typescript
export class TimelineItemResponseDto {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'active' | 'upcoming' | 'completed';
  color: string;
  alert: {
    title: string;
    content: string;
    type: 'info' | 'warning';
  };
  links: Array<{
    text: string;
    url: string;
  }>;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### TimelineListResponseDto

```typescript
export class TimelineListResponseDto {
  items: TimelineItemResponseDto[];
  total: number;
}
```

#### BulkOperationResponseDto

```typescript
export class BulkOperationResponseDto {
  success: boolean;
  count: number;
  items: TimelineItemResponseDto[];
}
```

## API Response Format

All API responses should follow this standard format (use Success and all class in response folder):

```typescript
{
  success: boolean;
  data: any;
  message?: string;
  errors?: any[];
}
```

## Error Handling

Implement proper error handling for:
- Invalid input validation
- Not found items
- Server errors

HTTP status codes should be used appropriately:
- 200: Success
- 201: Created
- 400: Bad request (validation errors)
- 404: Not found
- 500: Server error

## Authorization

All endpoints should be protected and only accessible by authenticated users with proper permissions:
- Regular users: Read-only access (GET endpoints only)
- Admin users: Full access to all endpoints

## Implementation Guidelines

1. Use a middleware for input validation
2. Implement proper error handling
3. Add logging for all operations
4. Use transactions for batch operations
5. Implement pagination for list operations
6. Add proper documentation using Swagger/OpenAPI
