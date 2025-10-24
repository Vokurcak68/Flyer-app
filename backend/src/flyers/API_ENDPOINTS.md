# Flyers API Endpoints Reference

Base URL: `/flyers`

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Endpoints Summary

### 1. Create Flyer
**POST** `/flyers`
- **Role**: `supplier`
- **Body**:
  ```json
  {
    "name": "Summer Sale 2025",
    "validFrom": "2025-06-01",
    "validTo": "2025-06-30"
  }
  ```
- **Response**: Complete flyer object with empty pages array

---

### 2. List Flyers
**GET** `/flyers`
- **Role**: All (filtered by role)
- **Query Parameters**:
  - `status`: `draft` | `pending_verification` | `pending_approval` | `approved` | `rejected` | `active` | `expired`
  - `isDraft`: `true` | `false`
  - `validFrom`: ISO date string
  - `validTo`: ISO date string
- **Example**: `/flyers?status=draft&isDraft=true`
- **Response**: Array of flyer objects with page counts

---

### 3. Get Flyer Details
**GET** `/flyers/:id`
- **Role**: All (access controlled)
- **Response**: Complete flyer with all pages, products, approvals, and verification logs

---

### 4. Update Flyer
**PATCH** `/flyers/:id`
- **Role**: `supplier`
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "validFrom": "2025-07-01",
    "validTo": "2025-07-31"
  }
  ```
- **Constraints**: Only draft flyers can be updated

---

### 5. Delete Flyer
**DELETE** `/flyers/:id`
- **Role**: `supplier`
- **Response**:
  ```json
  {
    "message": "Flyer deleted successfully"
  }
  ```
- **Constraints**: Only draft flyers can be deleted

---

### 6. Add Page to Flyer
**POST** `/flyers/:id/pages`
- **Role**: `supplier`
- **Body**:
  ```json
  {
    "pageNumber": 1,
    "layoutType": "products_8",
    "promoImageId": "optional-uuid"
  }
  ```
- **Layout Types**:
  - `products_8` (8 products)
  - `products_4` (4 products)
  - `products_2` (2 products)
  - `products_1` (1 product)
  - `promo_8` (8 products + promo)
  - `promo_4` (4 products + promo)
  - `promo_2` (2 products + promo)
  - `promo_1` (1 product + promo)

---

### 7. Remove Page
**DELETE** `/flyers/pages/:pageId`
- **Role**: `supplier`
- **Response**:
  ```json
  {
    "message": "Page removed successfully"
  }
  ```

---

### 8. Add Product to Page
**POST** `/flyers/pages/:pageId/products`
- **Role**: `supplier`
- **Body**:
  ```json
  {
    "pageId": "uuid",
    "productId": "uuid",
    "position": 1
  }
  ```
- **Position**: Integer 1-8 (max depends on layout type)
- **Validation**:
  - Position must be available
  - Max products based on layout type
  - Product must belong to supplier

---

### 9. Remove Product from Page
**DELETE** `/flyers/pages/products/:productId`
- **Role**: `supplier`
- **Note**: `:productId` is the FlyerPageProduct ID, not the Product ID
- **Response**:
  ```json
  {
    "message": "Product removed from page successfully"
  }
  ```

---

### 10. Update Product Position
**PATCH** `/flyers/pages/products/:id/position`
- **Role**: `supplier`
- **Body**:
  ```json
  {
    "position": 3
  }
  ```
- **Behavior**: If position is occupied, products are swapped

---

### 11. Submit for Verification
**POST** `/flyers/:id/submit-for-verification`
- **Role**: `supplier`
- **Validation**:
  - Must have validFrom and validTo dates
  - Must have at least one page
- **Effect**:
  - Creates version snapshot
  - Changes status to `pending_verification`
  - Sets `isDraft` to `false`

---

### 12. Get Flyer Preview
**GET** `/flyers/:id/preview`
- **Role**: All
- **Response**: Formatted preview data optimized for frontend rendering
  ```json
  {
    "id": "uuid",
    "name": "Summer Sale",
    "validFrom": "2025-06-01",
    "validTo": "2025-06-30",
    "status": "draft",
    "completionPercentage": 75,
    "pages": [
      {
        "pageNumber": 1,
        "layoutType": "products_8",
        "promoImage": { ... },
        "products": [
          {
            "position": 1,
            "product": { ... }
          }
        ]
      }
    ]
  }
  ```

---

### 13. Auto-save Flyer
**POST** `/flyers/:id/auto-save`
- **Role**: `supplier`
- **Effect**:
  - Increments `autoSaveVersion`
  - Updates `lastEditedAt` timestamp
- **Response**:
  ```json
  {
    "message": "Flyer auto-saved successfully",
    "id": "uuid",
    "lastEditedAt": "2025-10-21T10:30:00.000Z",
    "autoSaveVersion": 5
  }
  ```

---

## Common Response Objects

### Flyer Object (Complete)
```json
{
  "id": "uuid",
  "supplierId": "uuid",
  "name": "Summer Sale 2025",
  "validFrom": "2025-06-01",
  "validTo": "2025-06-30",
  "status": "draft",
  "isDraft": true,
  "rejectionReason": null,
  "pdfUrl": null,
  "lastEditedAt": "2025-10-21T10:30:00.000Z",
  "autoSaveVersion": 3,
  "completionPercentage": 75,
  "createdAt": "2025-10-20T08:00:00.000Z",
  "updatedAt": "2025-10-21T10:30:00.000Z",
  "publishedAt": null,
  "supplier": {
    "id": "uuid",
    "email": "supplier@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "pages": [
    {
      "id": "uuid",
      "pageNumber": 1,
      "layoutType": "products_8",
      "promoImageId": null,
      "promoImage": null,
      "products": [
        {
          "id": "uuid",
          "position": 1,
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "eanCode": "1234567890123",
            "imageUrl": "https://...",
            "price": "29.99",
            "originalPrice": "39.99",
            "brand": {
              "id": "uuid",
              "name": "Brand Name",
              "logoUrl": "https://..."
            },
            "icons": []
          }
        }
      ]
    }
  ],
  "verificationLogs": [],
  "approvals": [],
  "approvalWorkflow": null
}
```

### Error Responses

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Flyer not found",
  "error": "Not Found"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You do not have permission to modify this flyer",
  "error": "Forbidden"
}
```

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Only draft flyers can be updated",
  "error": "Bad Request"
}
```

#### 400 Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "pageNumber must be a positive number"
  ],
  "error": "Bad Request"
}
```

---

## Role-Based Access

### Supplier
- Full CRUD on own flyers
- Can only see own flyers
- Can submit for verification

### Approver
- Read access to pending and approved flyers
- Cannot modify flyers (use Approvals module for approval actions)

### End User
- Read access to active flyers only
- Cannot modify any data

---

## Status Workflow

```
draft → pending_verification → pending_approval → approved → active → expired
                    ↓
                rejected → back to draft
```

---

## Notes

1. All dates should be in ISO 8601 format
2. Position numbers start from 1, not 0
3. Auto-save should be called periodically (e.g., every 30 seconds)
4. Completion percentage is calculated automatically
5. Edit history is tracked automatically for all changes
6. Version snapshots are created on submission
