# Product to Flyer Slot Workflow Analysis

## Quick Summary

Products are added to flyer slots via **drag-and-drop interface** in the FlyerEditorPage component.

- **UI**: Drag products from sidebar into 8-slot grid (2x4 per page)
- **Storage**: Frontend state (React) then synced to backend
- **Validation**: Energy class icons checked, no duplicate Product IDs
- **Gap**: NO validation for duplicate EAN codes in same flyer

---

## 1. Flyer Editor UI Location

**File**: `src/pages/flyers/FlyerEditorPage.tsx` (1277 lines)

**Key State**:
```
flyerData = { pages: [{ slots: Array(8) }] }
allProducts = Product[]
usedProductIds = Set<ProductId>  // Prevents duplicate IDs
```

---

## 2. Drag-Drop Components

| Component | File | Purpose |
|-----------|------|---------|
| DraggableProduct | src/components/flyer/DraggableProduct.tsx | Makes product draggable |
| DroppableSlot | src/components/flyer/DroppableSlot.tsx | Drop target for products |

**Validations in DraggableProduct**:
- Energy class icon required
- Already used in flyer (shows disabled state)

---

## 3. Slot Data Structure

```typescript
interface FlyerSlot {
  type: 'product' | 'promo' | 'empty';
  product?: Product;
  promoImage?: PromoImage;
  promoSize?: string;
}

interface FlyerPage {
  pageNumber: number;
  slots: FlyerSlot[];  // 8 slots per page
}

interface Flyer {
  pages: FlyerPage[];
}
```

---

## 4. Backend Endpoints

### Main endpoint for adding products:
```
PATCH /flyers/:id
Body: { pages: [...] }
```

### Processing flow:
1. FlyersService.update() called
2. Calls syncPages() to rebuild all slots
3. Validates product access and energy class icons
4. Saves to FlyerPageSlot table

### Database structure:
```
FlyerPageSlot {
  pageId
  slotPosition (0-7)
  productId    <- Points to Product
  slotType
}
```

---

## 5. Current Validations

### Frontend:
- Product has energy class icon
- Product not already in flyer (by ID)
- Price range filter (end users)
- Brand/Category filters

### Backend (syncPages):
- Product ownership check
- Energy class icon validation
- Promo placement rules

### Backend (submitForVerification):
- Action selected
- Dates set
- ERP compatibility check

---

## 6. MISSING: Duplicate EAN Validation

**Problem**: No check prevents same EAN code appearing twice in flyer

**Example**: 
```
Slot 1: Product "Oven A" (EAN: 123)
Slot 2: Product "Oven B" (EAN: 123)  <- Same EAN!
```

**Where to add**:

1. **Frontend** (FlyerEditorPage.tsx, handleDragEnd):
```typescript
const checkDuplicateEan = (product: Product) => {
  const existingEans = new Set(
    flyerData.pages.flatMap(p =>
      p.slots
        .filter(s => s?.type === 'product')
        .map(s => s.product!.eanCode)
    )
  );
  return !existingEans.has(product.eanCode);
};
```

2. **Backend** (FlyersService.submitForVerification):
```typescript
// After collecting products:
const eanSet = new Set();
for (const prod of products) {
  if (eanSet.has(prod.eanCode)) {
    throw BadRequestException('Duplicate EAN: ' + prod.eanCode);
  }
  eanSet.add(prod.eanCode);
}
```

---

## 7. API Flow

```
User drags product
  ↓
handleDragEnd() validates energy class + checks Product ID
  ↓
Updates flyerData state (frontend)
  ↓
User clicks Save
  ↓
PATCH /flyers/:id with pages
  ↓
Backend syncPages() syncs slots
  ↓
User clicks Submit
  ↓
POST /flyers/:id/submit-for-verification
  ↓
Backend validates action/dates/ERP
  ↓
If valid: PDF generated, approvals created, status=pending_approval
```

---

## 8. Key Files

| File | Purpose |
|------|---------|
| FlyerEditorPage.tsx | Main UI component |
| DraggableProduct.tsx | Product card (draggable) |
| DroppableSlot.tsx | Slot container |
| flyers.service.ts (backend) | syncPages, submitForVerification |
| schema.prisma | FlyerPageSlot model |

---

## 9. Validation Locations

| Validation | Location | Type |
|-----------|----------|------|
| Energy class icon | FlyerEditorPage.tsx + syncPages | Frontend + Backend |
| Duplicate Product ID | FlyerEditorPage.tsx | Frontend |
| Product ownership | syncPages | Backend |
| Promo placement | syncPages | Backend |
| ERP compatibility | submitForVerification | Backend |
| **Duplicate EAN** | **MISSING** | **Need Both** |

---

## 10. To Add Duplicate EAN Validation

### Step 1: Frontend
In FlyerEditorPage.tsx, add before dropping product:

```typescript
if (!checkProductNotDuplicateEan(product, flyerData)) {
  alert(`EAN ${product.eanCode} już jest w letáku`);
  return;
}
```

### Step 2: Backend  
In flyers.service.ts submitForVerification, add before ERP check:

```typescript
const eansInFlyer = new Set();
const dupeEans = [];

for (const product of products) {
  if (eansInFlyer.has(product.eanCode)) {
    dupeEans.push(product.eanCode);
  }
  eansInFlyer.add(product.eanCode);
}

if (dupeEans.length > 0) {
  throw new BadRequestException({
    message: 'Duplicate EAN codes in flyer',
    errors: [{ type: 'duplicate_ean', eancodes: dupeEans }]
  });
}
```

---

## Notes

- Existing DuplicateEanDialog exists for product creation (can be adapted)
- Product table has eanCode field indexed for fast lookups
- Flyer can have multiple pages (8 slots each)
- Only product-type slots count for EAN validation
- Promo/empty slots ignored for EAN check
