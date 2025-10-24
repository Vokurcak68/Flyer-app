# Flyers API Module

Complete API module for managing flyers in the Flyer Management Application.

## Overview

The Flyers module provides a comprehensive set of endpoints for creating, managing, and publishing promotional flyers. It includes:

- Flyer CRUD operations
- Page management with layout types
- Product placement on pages
- Auto-save functionality
- Status workflow management
- Version control and edit history
- Role-based access control

## Module Structure

```
flyers/
├── dto/
│   ├── create-flyer.dto.ts
│   ├── update-flyer.dto.ts
│   ├── add-page.dto.ts
│   ├── add-product-to-page.dto.ts
│   ├── flyer-filter.dto.ts
│   ├── update-product-position.dto.ts
│   └── index.ts
├── flyers.controller.ts
├── flyers.service.ts
├── flyers.module.ts
└── README.md
```

## DTOs

### CreateFlyerDto
```typescript
{
  name: string;           // Required
  validFrom?: string;     // ISO date string
  validTo?: string;       // ISO date string
}
```

### UpdateFlyerDto
```typescript
{
  name?: string;
  validFrom?: string;     // ISO date string
  validTo?: string;       // ISO date string
}
```

### AddPageDto
```typescript
{
  pageNumber: number;     // Min: 1
  layoutType: LayoutType; // Enum: products_8, products_4, etc.
  promoImageId?: string;  // Optional promo image
}
```

### AddProductToPageDto
```typescript
{
  pageId: string;
  productId: string;
  position: number;       // 1-8
}
```

### FlyerFilterDto
```typescript
{
  status?: FlyerStatusEnum;
  isDraft?: boolean;
  validFrom?: string;
  validTo?: string;
}
```

### UpdateProductPositionDto
```typescript
{
  position: number;       // 1-8
}
```

## API Endpoints

### Flyer Management

#### Create Flyer
```
POST /flyers
Role: supplier
Body: CreateFlyerDto
```

Creates a new flyer in draft status.

#### List Flyers
```
GET /flyers?status=draft&isDraft=true
Role: All (filtered by role)
Query: FlyerFilterDto
```

Returns flyers based on user role:
- **Suppliers**: See only their own flyers
- **Approvers**: See flyers pending approval or approved
- **End Users**: See only active flyers

#### Get Flyer
```
GET /flyers/:id
Role: All (access controlled)
```

Returns complete flyer data with all pages, products, and metadata.

#### Update Flyer
```
PATCH /flyers/:id
Role: supplier
Body: UpdateFlyerDto
```

Updates flyer metadata. Only available for draft flyers.

#### Delete Flyer
```
DELETE /flyers/:id
Role: supplier
```

Deletes a draft flyer. Only draft flyers can be deleted.

### Page Management

#### Add Page
```
POST /flyers/:id/pages
Role: supplier
Body: AddPageDto
```

Adds a new page to the flyer with specified layout type.

**Layout Types:**
- `products_8`: 8 product slots
- `products_4`: 4 product slots
- `products_2`: 2 product slots
- `products_1`: 1 product slot
- `promo_8`: 8 slots with promo image
- `promo_4`: 4 slots with promo image
- `promo_2`: 2 slots with promo image
- `promo_1`: 1 slot with promo image

#### Remove Page
```
DELETE /flyers/pages/:pageId
Role: supplier
```

Removes a page from the flyer.

### Product Management

#### Add Product to Page
```
POST /flyers/pages/:pageId/products
Role: supplier
Body: AddProductToPageDto
```

Adds a product to a specific position on a page. Validates:
- Maximum products per layout type
- Position availability
- Product ownership

#### Remove Product from Page
```
DELETE /flyers/pages/products/:productId
Role: supplier
```

Removes a product from a page.

#### Update Product Position
```
PATCH /flyers/pages/products/:id/position
Role: supplier
Body: UpdateProductPositionDto
```

Moves a product to a different position on the page. Automatically swaps with existing product if position is occupied.

### Workflow & Actions

#### Submit for Verification
```
POST /flyers/:id/submit-for-verification
Role: supplier
```

Submits a draft flyer for ERP verification. Validates:
- Flyer has valid dates
- At least one page exists
- Creates version snapshot

Changes status: `draft` → `pending_verification`

#### Get Preview
```
GET /flyers/:id/preview
Role: All
```

Returns formatted preview data for rendering the flyer.

#### Auto-save
```
POST /flyers/:id/auto-save
Role: supplier
```

Increments auto-save version and updates lastEditedAt timestamp.

## Service Methods

### Core Business Logic

#### `create(createFlyerDto, userId)`
Creates a new flyer with edit history tracking.

#### `findAll(filterDto, userId, userRole)`
Returns flyers with role-based filtering.

#### `findOne(id, userId, userRole)`
Returns complete flyer data with access control.

#### `update(id, updateFlyerDto, userId, userRole)`
Updates flyer metadata and recalculates completion percentage.

#### `remove(id, userId, userRole)`
Deletes draft flyers only.

### Auto-save Functionality

The module implements auto-save to prevent data loss:
- Increments `autoSaveVersion` on each auto-save
- Updates `lastEditedAt` timestamp
- Allows recovery from previous auto-save states

### Completion Percentage Calculation

Automatically calculates completion percentage based on:
- **Name and dates (30%)**: 10 points each
- **Pages (30%)**: Up to 30 points (minimum 2 pages recommended)
- **Products (40%)**: Up to 40 points (minimum 8 products recommended)

Formula:
```
totalScore = nameScore + dateScore + pageScore + productScore
completionPercentage = round(totalScore)
```

### Page Layout Validation

Validates product capacity based on layout type:
```typescript
{
  products_8: 8,
  products_4: 4,
  products_2: 2,
  products_1: 1,
  promo_8: 8,
  promo_4: 4,
  promo_2: 2,
  promo_1: 1,
}
```

### Edit History Tracking

Every change is tracked in the `flyer_edit_history` table:
- Add product
- Remove product
- Add page
- Remove page
- Update info
- Reorder products

### Version Snapshots

Creates complete snapshots when:
- Submitting for verification
- Major status changes
- Manual version creation (future feature)

## Status Workflow

```
draft
  ↓ (submit for verification)
pending_verification
  ↓ (ERP verification success)
pending_approval
  ↓ (approvers approve)
approved
  ↓ (publish)
active
  ↓ (valid_to date passes)
expired
```

Rejected flyers return to `draft` status for corrections.

## Access Control

### Suppliers
- Create, update, delete own flyers
- Add/remove pages and products
- Submit for verification
- View only their own flyers

### Approvers
- View pending and approved flyers
- Approve/reject flyers (via Approvals module)

### End Users
- View only active flyers
- Cannot modify any data

## Integration Points

### PrismaService
Direct database access through Prisma ORM.

### VerificationService
Called when submitting flyers for ERP verification.

### ApprovalsService
Manages approval workflow after verification.

## Error Handling

The service throws appropriate HTTP exceptions:
- `NotFoundException`: Resource not found
- `BadRequestException`: Invalid operation (e.g., editing non-draft flyer)
- `ForbiddenException`: Insufficient permissions

## Example Usage

### Creating a Complete Flyer

```typescript
// 1. Create flyer
POST /flyers
{
  "name": "Summer Sale 2025",
  "validFrom": "2025-06-01",
  "validTo": "2025-06-30"
}

// 2. Add first page
POST /flyers/{flyerId}/pages
{
  "pageNumber": 1,
  "layoutType": "products_8"
}

// 3. Add products to page
POST /flyers/pages/{pageId}/products
{
  "pageId": "{pageId}",
  "productId": "{productId}",
  "position": 1
}

// 4. Submit for verification
POST /flyers/{flyerId}/submit-for-verification
```

## Future Enhancements

- Bulk product import
- Template management
- Collaborative editing
- Advanced analytics
- PDF generation integration
- Duplicate flyer functionality
- Export/import flyer data

## Related Modules

- **VerificationModule**: ERP verification
- **ApprovalsModule**: Multi-level approval workflow
- **PrismaModule**: Database access
- **AuthModule**: Authentication and authorization
