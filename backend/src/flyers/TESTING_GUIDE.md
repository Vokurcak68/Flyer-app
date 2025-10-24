# Flyers API Testing Guide

## Prerequisites

1. Database must be seeded with:
   - At least one supplier user
   - At least one brand
   - Several products
   - Optional: Promo images

2. Obtain JWT token by logging in as a supplier

## Test Sequence

### 1. Authentication
```bash
# Login as supplier
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supplier@example.com",
    "password": "password123"
  }'

# Save the token
TOKEN="<jwt_token_from_response>"
```

### 2. Create a New Flyer
```bash
curl -X POST http://localhost:3000/flyers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale 2025",
    "validFrom": "2025-06-01",
    "validTo": "2025-06-30"
  }'

# Save the flyer ID
FLYER_ID="<id_from_response>"
```

**Expected Response:**
- Status: 201 Created
- Body: Complete flyer object with empty pages array
- `status`: "draft"
- `isDraft`: true
- `completionPercentage`: 30 (name + dates)

### 3. Add First Page
```bash
curl -X POST http://localhost:3000/flyers/$FLYER_ID/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageNumber": 1,
    "layoutType": "products_8"
  }'

# Save the page ID
PAGE_ID="<id_from_response>"
```

**Expected Response:**
- Status: 201 Created
- Body: Page object with empty products array
- Flyer `completionPercentage` should increase to ~45

### 4. Add Products to Page
```bash
# First, get a product ID (or use one from your seed data)
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer $TOKEN"

PRODUCT_ID="<id_from_response>"

# Add first product
curl -X POST http://localhost:3000/flyers/pages/$PAGE_ID/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "'$PAGE_ID'",
    "productId": "'$PRODUCT_ID'",
    "position": 1
  }'

# Save the flyer page product ID
FPP_ID="<id_from_response>"
```

**Expected Response:**
- Status: 201 Created
- Body: FlyerPageProduct object with populated product data
- Product includes brand and icons

### 5. Add More Products
```bash
# Repeat step 4 with different products and positions (2-8)
# Each addition increases the completion percentage
```

### 6. Auto-save
```bash
curl -X POST http://localhost:3000/flyers/$FLYER_ID/auto-save \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "message": "Flyer auto-saved successfully",
  "id": "uuid",
  "lastEditedAt": "2025-10-21T10:30:00.000Z",
  "autoSaveVersion": 2
}
```

### 7. Update Product Position
```bash
curl -X PATCH http://localhost:3000/flyers/pages/products/$FPP_ID/position \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": 3
  }'
```

**Expected Response:**
- Product moved to position 3
- If position 3 was occupied, products are swapped

### 8. Get Flyer Details
```bash
curl -X GET http://localhost:3000/flyers/$FLYER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
- Complete flyer object
- All pages in order
- All products with full details
- Edit history tracked
- Completion percentage calculated

### 9. Get Preview
```bash
curl -X GET http://localhost:3000/flyers/$FLYER_ID/preview \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
- Formatted preview data
- Optimized for frontend rendering

### 10. List All Flyers
```bash
# List all flyers
curl -X GET http://localhost:3000/flyers \
  -H "Authorization: Bearer $TOKEN"

# Filter by status
curl -X GET "http://localhost:3000/flyers?status=draft" \
  -H "Authorization: Bearer $TOKEN"

# Filter by draft status
curl -X GET "http://localhost:3000/flyers?isDraft=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 11. Update Flyer Metadata
```bash
curl -X PATCH http://localhost:3000/flyers/$FLYER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Summer Sale 2025",
    "validFrom": "2025-06-15"
  }'
```

### 12. Submit for Verification
```bash
curl -X POST http://localhost:3000/flyers/$FLYER_ID/submit-for-verification \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
- Status changes to `pending_verification`
- `isDraft` becomes false
- Version snapshot created
- Cannot be edited anymore

### 13. Remove Product from Page
```bash
curl -X DELETE http://localhost:3000/flyers/pages/products/$FPP_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Note:** Only works on draft flyers

### 14. Remove Page
```bash
curl -X DELETE http://localhost:3000/flyers/pages/$PAGE_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Note:** Only works on draft flyers

### 15. Delete Flyer
```bash
curl -X DELETE http://localhost:3000/flyers/$FLYER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Note:** Only works on draft flyers

---

## Error Cases to Test

### 1. Adding Product to Full Page
```bash
# Try adding 9th product to products_8 layout
# Expected: 400 Bad Request
# Message: "Page layout products_8 can only hold 8 products"
```

### 2. Editing Non-Draft Flyer
```bash
# After submitting for verification, try to update
# Expected: 400 Bad Request
# Message: "Only draft flyers can be updated"
```

### 3. Adding Product to Occupied Position
```bash
# Try adding product to position 1 when it's already occupied
# Expected: 400 Bad Request
# Message: "Position 1 is already occupied"
```

### 4. Accessing Another Supplier's Flyer
```bash
# Login as different supplier
# Try to access first supplier's flyer
# Expected: 403 Forbidden
# Message: "You do not have access to this flyer"
```

### 5. Deleting Non-Draft Flyer
```bash
# Try to delete approved or active flyer
# Expected: 400 Bad Request
# Message: "Only draft flyers can be deleted"
```

### 6. Submitting Incomplete Flyer
```bash
# Create flyer without dates
# Try to submit
# Expected: 400 Bad Request
# Message: "Flyer must have valid dates set"
```

### 7. Adding Duplicate Page Number
```bash
# Add page with pageNumber: 1
# Try to add another page with pageNumber: 1
# Expected: 400 Bad Request
# Message: "Page 1 already exists"
```

---

## Testing with Different Roles

### As Approver
```bash
# Login as approver
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "approver@example.com",
    "password": "password123"
  }'

# List flyers (should only see pending_approval and approved)
curl -X GET http://localhost:3000/flyers \
  -H "Authorization: Bearer $APPROVER_TOKEN"

# Try to create flyer (should fail)
curl -X POST http://localhost:3000/flyers \
  -H "Authorization: Bearer $APPROVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
# Expected: 403 Forbidden
```

### As End User
```bash
# Login as end user
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# List flyers (should only see active flyers)
curl -X GET http://localhost:3000/flyers \
  -H "Authorization: Bearer $USER_TOKEN"

# Try to access draft flyer (should fail)
curl -X GET http://localhost:3000/flyers/$DRAFT_FLYER_ID \
  -H "Authorization: Bearer $USER_TOKEN"
# Expected: 403 Forbidden
```

---

## Validation Tests

### Invalid Date Format
```bash
curl -X POST http://localhost:3000/flyers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "validFrom": "invalid-date"
  }'
# Expected: 400 Bad Request with validation error
```

### Invalid Layout Type
```bash
curl -X POST http://localhost:3000/flyers/$FLYER_ID/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageNumber": 1,
    "layoutType": "invalid_layout"
  }'
# Expected: 400 Bad Request with validation error
```

### Invalid Position
```bash
curl -X POST http://localhost:3000/flyers/pages/$PAGE_ID/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "'$PAGE_ID'",
    "productId": "'$PRODUCT_ID'",
    "position": 0
  }'
# Expected: 400 Bad Request (position must be >= 1)

curl -X POST http://localhost:3000/flyers/pages/$PAGE_ID/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "'$PAGE_ID'",
    "productId": "'$PRODUCT_ID'",
    "position": 9
  }'
# Expected: 400 Bad Request (position must be <= 8)
```

---

## Performance Tests

### Completion Percentage Calculation
```bash
# Test with different combinations:
# - Empty flyer: 0%
# - Name only: 10%
# - Name + validFrom: 20%
# - Name + validFrom + validTo: 30%
# - Above + 1 page: ~45%
# - Above + 2 pages: ~60%
# - Above + 4 products: ~80%
# - Above + 8 products: 100%
```

### Auto-save Version Increment
```bash
# Call auto-save multiple times
# Verify autoSaveVersion increments: 1, 2, 3, 4...
for i in {1..5}; do
  curl -X POST http://localhost:3000/flyers/$FLYER_ID/auto-save \
    -H "Authorization: Bearer $TOKEN"
done
```

---

## Integration with Other Modules

### With Products Module
```bash
# Get products for adding to flyer
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer $TOKEN"
```

### With Verification Module
```bash
# After submitting, check verification logs
curl -X GET http://localhost:3000/flyers/$FLYER_ID \
  -H "Authorization: Bearer $TOKEN"
# Check verificationLogs array in response
```

### With Approvals Module
```bash
# After verification, check approvals
curl -X GET http://localhost:3000/flyers/$FLYER_ID \
  -H "Authorization: Bearer $TOKEN"
# Check approvals and approvalWorkflow in response
```

---

## Debugging Tips

1. **Check logs**: Service logs all major operations
2. **Verify database**: Use Prisma Studio to inspect data
3. **Check edit history**: Review `flyer_edit_history` table
4. **Version snapshots**: Check `flyer_versions` for snapshots
5. **Completion %**: Verify calculation in service

## Common Issues

1. **403 Forbidden**: Check user role and flyer ownership
2. **400 Bad Request**: Check flyer status (must be draft for most operations)
3. **404 Not Found**: Verify IDs are correct
4. **Validation errors**: Check DTO requirements and types
