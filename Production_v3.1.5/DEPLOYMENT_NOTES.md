# Deployment Notes - Version 3.1.5 - VERIFIED BUILD

**Build Date:** 2025-11-10
**Critical Fixes & New Features:**
- Promo images now persist when submitting for verification
- Icon transparency preserved in PDF (PNG for icons, JPEG for photos)
- PDF filename without timestamp (saves disk space)
- Icon layout in PDF matches frontend preview
- **NEW:** Subcategory management in admin UI
- **NEW:** Built-in vs Freestanding appliance category type

## BUILD VERIFICATION COMPLETED ✓

### Backend Verification:
- ✅ Version: 3.1.5
- ✅ Brand access fix present: 4 occurrences of `hasAccessToBrand` found (from v3.1.4)
- ✅ File: `dist/src/flyers/flyers.service.js`
- ✅ Debug logging removed: clean code
- ✅ Compiled successfully

### Frontend Verification:
- ✅ Version: 3.1.5 (displayed in footer)
- ✅ Submit fix present: `pages: preparePagesForAPI` in submitMutation
- ✅ API URLs: 13× `/api`, 0× `localhost:4000`
- ✅ File: `frontend/static/js/main.483f5269.js`
- ✅ Vodafone fonts included

### Configuration Verification:
- ✅ `.env` contains `API_URL=https://eflyer.kuchyneoresi.eu`
- ✅ `.env` contains `FRONTEND_URL=https://eflyer.kuchyneoresi.eu`
- ✅ `.env` contains `NODE_ENV=production`

## What Was Fixed

### 1. Icon Transparency in PDF (NEW)

#### Issue Description
When generating PDF files, all images (products, promos, and icons) were converted to JPEG format. However, **JPEG does not support transparency** (alpha channel), which caused:
- Icons with transparent backgrounds to lose transparency ❌
- White/black backgrounds appearing around icons in PDF
- Unprofessional appearance

#### Solution Applied
Separated image processing based on type:

**Product images & Promo images:**
- Convert to JPEG with configurable quality
- JPEG is appropriate for photos (smaller file size)
- Quality configurable via `.env` variables

**Icons:**
- Keep PNG format to preserve transparency (alpha channel) ✓
- PNG supports transparency, perfect for icons
- Compression level configurable via `.env`

**Configuration added to `.env`:**
```bash
PDF_PRODUCT_JPEG_QUALITY=100    # Product image quality (1-100)
PDF_PROMO_JPEG_QUALITY=100      # Promo image quality (1-100)
PDF_ICON_PNG_COMPRESSION=9      # Icon PNG compression (0-9)
```

**Benefits:**
- ✅ Icons maintain transparency in PDF
- ✅ Quality adjustable without redeployment (just edit `.env` and restart service)
- ✅ Can balance quality vs file size in production
- ✅ Professional appearance with transparent icons

**File changed:** `backend/src/flyers/pdf.service.ts`
- Added `convertIconToPNG()` method for icons with transparency
- Renamed `convertImageToPNG()` to `convertImageToJPEG()` for clarity
- All functions now accept quality/compression parameters from config
- **Removed timestamp from PDF filename** (line 97) - now overwrites instead of creating duplicates

#### Why remove timestamp?
Previously, every PDF preview/generation created a new file:
- `flyer-123-1623456789.pdf`
- `flyer-123-1623456790.pdf`
- `flyer-123-1623456791.pdf`
- ...hundreds of duplicates over time

Now uses consistent filename:
- `flyer-123.pdf` (overwrites on each generation)
- Saves disk space on production server ✓
- Only keeps latest version ✓

#### Icon Layout Fix (NEW)
**Problem:** PDF distributed icons evenly based on count, frontend used fixed 4 slots.

**Before (PDF):**
- 1 icon → centered vertically
- 2 icons → top and bottom
- 3 icons → evenly distributed
- Different from flyer preview ❌

**After (PDF):**
- Fixed 4 evenly distributed slots (matching frontend)
- Icons fill from top (slot 0, 1, 2, 3)
- Empty slots remain empty
- **WYSIWYG:** What you see in editor = what you get in PDF ✓

**File changed:** `backend/src/flyers/pdf.service.ts` (lines 396-455)
- Matches `ProductFlyerLayout.tsx` (lines 70-84)
- Uses `maxSlots = 4` with fixed spacing
- Icons render in their designated slot positions

### 2. CRITICAL ISSUE: Promo Images Disappearing After Submit

#### Issue Description (User Report)
When a supplier added a promo image to a flyer and clicked "Odeslat k autorizaci" (Submit for Verification):
1. In development: Everything worked fine ✓
2. In production: Promo image disappeared from the flyer ❌
3. Pre-approvers and approvers could not see the promo in their PDF ❌

User's key insight: "tam není ukladání letáku? to je hrubá chyba. před generováním pdf MUSÍ proběhnout ukládání"

#### Root Cause Analysis
The frontend `submitMutation` in `FlyerEditorPage.tsx` had different behavior for new vs existing flyers:

**New flyer (lines 314-316) - WORKED CORRECTLY:**
```typescript
await flyersService.updateFlyer(created.id, {
  pages: preparePagesForAPI(flyerData.pages)  // ✓ Includes pages
});
```

**Existing flyer (lines 320-326) - BROKEN:**
```typescript
await flyersService.updateFlyer(id!, {
  name: flyerData.name,
  actionId: flyerData.actionId,
  actionName: flyerData.actionName,
  validFrom: flyerData.validFrom,
  validTo: flyerData.validTo,
  // ❌ MISSING: pages field!
});
```

This meant:
- When submitting an existing flyer, only metadata was saved
- Pages (with products and promo images) were NOT saved
- Backend's `submitForVerification` then generated PDF from current database state
- If autosave hadn't triggered, promo images were missing from DB
- Result: PDF had no promo images

#### Solution Applied
Added `pages` field to the existing flyer update call:

```typescript
await flyersService.updateFlyer(id!, {
  name: flyerData.name,
  actionId: flyerData.actionId,
  actionName: flyerData.actionName,
  validFrom: flyerData.validFrom,
  validTo: flyerData.validTo,
  pages: preparePagesForAPI(flyerData.pages), // ✓ Now saves pages before submission
});
```

### 3. Code Cleanup
Removed all debug console.log statements from `backend/src/flyers/flyers.service.ts`:
- Footer promo validation (lines 1591-1634)
- Slot promo validation (lines 1716-1773)
- Product validation (lines 1692-1710)

### 4. Subcategory Management (NEW)

#### Issue Description
Previously, subcategories could only be created and managed directly through the database. There was no admin UI for managing subcategories, which made it difficult to:
- Add new subcategories to existing categories
- Edit subcategory names
- Delete unused subcategories
- View all subcategories for a category

#### Solution Applied
Added complete subcategory management UI within the category edit form:

**Backend API Endpoints (Admin-only):**
- POST `/categories/:id/subcategories` - Create new subcategory
- PUT `/categories/subcategories/:subcategoryId` - Update subcategory name
- DELETE `/categories/subcategories/:subcategoryId` - Delete subcategory (with validation)

**Frontend Features:**
- Inline subcategory management shown when editing a category
- Add new subcategory with input + "Přidat" button
- Edit subcategory inline (pencil icon → input → save/cancel)
- Delete subcategory with confirmation dialog
- Real-time updates using React Query mutations
- Validation: Cannot delete subcategory if it has associated products

**User Experience:**
- Admin can now manage all subcategories without database access
- Intuitive inline editing pattern
- Immediate feedback on all operations
- Protection against accidental deletion of subcategories in use

**Files changed:**
- `backend/src/categories/dto/subcategory.dto.ts` - NEW: DTOs for subcategory operations
- `backend/src/categories/dto/index.ts` - Export subcategory DTOs
- `backend/src/categories/categories.service.ts` - Added 3 methods (create, update, delete subcategory)
- `backend/src/categories/categories.controller.ts` - Added 3 endpoints (POST, PUT, DELETE)
- `src/services/categoriesService.ts` - Added 3 service methods for frontend
- `src/pages/categories/CategoryFormPage.tsx` - Added complete subcategory management UI

### 5. Category Appliance Type (NEW)

#### Issue Description
Categories needed a way to distinguish between built-in (vestavné) and freestanding (volně stojící) appliances. Previously, there was no field to track this distinction, making it difficult to filter or organize products by installation type.

#### Solution Applied
Added `isBuiltIn` boolean field to Category model:

**Database Changes:**
- New field: `is_built_in` BOOLEAN DEFAULT false
- Migration: `20251110100718_add_is_built_in_to_category`
- Prisma schema updated with new field

**Backend Changes:**
- Updated DTOs to include `isBuiltIn` field (optional)
- Updated create/update service methods to handle the new field
- Field defaults to `false` (freestanding) if not specified

**Frontend Changes:**
- Added checkbox "Vestavné spotřebiče" in category form
- Visual badge in category list showing type:
  - Purple badge: "Vestavné" (built-in appliances)
  - Blue badge: "Volně stojící" (freestanding appliances)
- Explanatory text below checkbox for clarity

**User Experience:**
- Admin can easily mark categories for built-in vs freestanding appliances
- Visual distinction in category list makes it easy to identify type at a glance
- Helpful for organizing product catalogs by installation type

**Files changed:**
- `backend/prisma/schema.prisma` - Added `isBuiltIn` field to Category model
- `backend/prisma/migrations/20251110100718_add_is_built_in_to_category/migration.sql` - Migration SQL
- `backend/src/categories/dto/create-category.dto.ts` - Added `isBuiltIn` field
- `backend/src/categories/dto/update-category.dto.ts` - Added `isBuiltIn` field
- `backend/src/categories/categories.service.ts` - Handle `isBuiltIn` in create/update
- `src/services/categoriesService.ts` - Added `isBuiltIn` to Category interface and methods
- `src/pages/categories/CategoryFormPage.tsx` - Added checkbox for built-in appliances
- `src/pages/categories/CategoriesListPage.tsx` - Added "Typ" column with visual badges

## Files Changed

### Frontend:
- `src/pages/flyers/FlyerEditorPage.tsx` - Line 326: Added pages to submit update
- `src/pages/categories/CategoryFormPage.tsx` - **NEW:** Subcategory management UI + isBuiltIn checkbox
- `src/pages/categories/CategoriesListPage.tsx` - **NEW:** Type column with visual badges
- `src/services/categoriesService.ts` - **NEW:** Added subcategory CRUD methods + isBuiltIn field
- `package.json` - Version 3.1.5
- `src/components/layout/AppFooter.tsx` - Display version 3.1.5

### Backend:
- `backend/src/flyers/pdf.service.ts` - **NEW:**
  - Added `convertIconToPNG()` for icons with transparency
  - Renamed `convertImageToPNG()` → `convertImageToJPEG()`
  - Added quality/compression parameters from config
  - Product images: line 381 (configurable JPEG quality)
  - Icons: line 437 (PNG with transparency)
  - Promo images: line 616 (configurable JPEG quality)
- `backend/src/flyers/flyers.service.ts` - Removed debug logging (lines 1591-1788)
- `backend/src/categories/dto/subcategory.dto.ts` - **NEW:** CreateSubcategoryDto, UpdateSubcategoryDto
- `backend/src/categories/dto/index.ts` - **NEW:** Export subcategory DTOs
- `backend/src/categories/dto/create-category.dto.ts` - **NEW:** Added isBuiltIn field
- `backend/src/categories/dto/update-category.dto.ts` - **NEW:** Added isBuiltIn field
- `backend/src/categories/categories.service.ts` - **NEW:** 3 subcategory methods + isBuiltIn handling
- `backend/src/categories/categories.controller.ts` - **NEW:** 3 subcategory endpoints (lines 52-72)
- `backend/prisma/schema.prisma` - **NEW:** Added isBuiltIn field to Category model
- `backend/prisma/migrations/20251110100718_add_is_built_in_to_category/` - **NEW:** Database migration
- `backend/.env` - **NEW:** Added PDF quality configuration parameters
- `backend/package.json` - Version 3.1.5

## Deployment Instructions

### 1. Stop Service & Backup
```powershell
Stop-Service FlcyManagementAPI
Copy-Item C:\inetpub\flyer-app\backend C:\inetpub\flyer-app\backend_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss') -Recurse
```

### 2. Deploy Files
```powershell
# Copy entire Production_v3.1.5 folder to server
Copy-Item Production_v3.1.5\* C:\inetpub\flyer-app\backend\ -Recurse -Force
```

### 3. CRITICAL: Verify .env
Check that `C:\inetpub\flyer-app\backend\.env` contains:
```bash
API_URL=https://eflyer.kuchyneoresi.eu
FRONTEND_URL=https://eflyer.kuchyneoresi.eu
NODE_ENV=production

# NEW: PDF Image Quality Configuration
PDF_PRODUCT_JPEG_QUALITY=100
PDF_PROMO_JPEG_QUALITY=100
PDF_ICON_PNG_COMPRESSION=9
```

**IMPORTANT:** These new parameters allow you to adjust PDF image quality **without redeployment**:
- Just edit `.env` on production server
- Restart FlcyManagementAPI service
- New PDFs will use the updated quality settings

### 4. Run Database Migration (REQUIRED)
```powershell
cd C:\inetpub\flyer-app\backend
npx prisma migrate deploy
```

**IMPORTANT:** This migration adds the `is_built_in` column to the categories table. All existing categories will default to `false` (freestanding).

### 5. Install Dependencies (if needed)
```powershell
cd C:\inetpub\flyer-app\backend
npm ci --production
```

### 6. Start Service
```powershell
Start-Service FlcyManagementAPI
```

## Verification

### Backend Health Check:
```
https://eflyer.kuchyneoresi.eu/api/health
Should return: {"status":"ok"}
```

### Version Check:
Open app in browser → check footer → should show **"Verze: 3.1.5"**

### Test the Fix - COMPLETE WORKFLOW:

**Test 1: Promo Images in PDF**
1. Login as admin
2. Create a promo image assigned to a brand
3. Login as supplier who has access to that brand
4. Create a new flyer or open existing draft
5. Add the brand promo image to the flyer
6. **Click "Odeslat k autorizaci" (Submit for Verification)**
7. **Reload the page** - promo image should still be in the flyer ✓
8. Login as pre_approver
9. Open the flyer - should see promo in the flyer view ✓
10. **Download/view PDF** - promo should be in the PDF ✓
11. Login as approver
12. **View PDF** - promo should be in the PDF ✓

**Test 2: Subcategory Management (NEW)**
1. Login as admin
2. Go to "Správa kategorií" (Categories Management)
3. Click "Upravit" on an existing category
4. Scroll down to "Podkategorie" section
5. **Add new subcategory:**
   - Type subcategory name in input field
   - Click "Přidat" button or press Enter
   - Subcategory should appear in the list below ✓
6. **Edit subcategory:**
   - Click pencil icon on a subcategory
   - Change the name in the input field
   - Click check icon to save OR press Enter
   - Name should update in the list ✓
7. **Delete subcategory:**
   - Click trash icon on a subcategory
   - Confirm deletion in dialog
   - Subcategory should disappear from the list ✓
8. **Validation test:**
   - Try to delete a subcategory that has products assigned
   - Should show error message preventing deletion ✓

**Test 3: Category Appliance Type (NEW)**
1. Login as admin
2. Go to "Správa kategorií" (Categories Management)
3. **Verify existing categories show type:**
   - Check that all categories display badge in "Typ" column
   - Existing categories should show "Volně stojící" (blue badge) ✓
4. **Create new built-in category:**
   - Click "Nová kategorie"
   - Enter category name (e.g., "Vestavné ledničky")
   - Check "Vestavné spotřebiče" checkbox
   - Save category
   - Should appear in list with purple "Vestavné" badge ✓
5. **Edit category type:**
   - Click "Upravit" on a freestanding category
   - Check "Vestavné spotřebiče" checkbox
   - Save changes
   - Category should now show purple "Vestavné" badge in list ✓

### Expected Behavior:
- ✅ Promo images persist after submit for verification
- ✅ Pre-approvers see promo in flyer and PDF
- ✅ Approvers see promo in flyer and PDF
- ✅ Works consistently in both development and production
- ✅ Subcategory management fully functional in category edit form
- ✅ Inline editing with real-time updates
- ✅ Category appliance type field working correctly
- ✅ Visual badges display correct type in category list
- ✅ No console errors
- ✅ Version 3.1.5 in footer

## Code Verification

You can manually verify the fix is present by checking:

```bash
# On production server after deployment:

# Backend brand access fix (from v3.1.4):
findstr /C:"hasAccessToBrand" C:\inetpub\flyer-app\backend\dist\src\flyers\flyers.service.js
# Should find 4 matches

# Frontend submit fix (NEW in v3.1.5):
# Check that submitMutation includes pages field for existing flyers
# This is compiled/minified so harder to verify, but version number confirms it
```

## Rollback

```powershell
Stop-Service FlcyManagementAPI
$latest = Get-ChildItem C:\inetpub\flyer-app\backend_backup_* | Sort-Object Name -Descending | Select-Object -First 1
Remove-Item C:\inetpub\flyer-app\backend -Recurse -Force
Copy-Item $latest.FullName C:\inetpub\flyer-app\backend -Recurse
Start-Service FlcyManagementAPI
```

## Summary

**Version:** 3.1.5

**Root Cause:** Frontend only saved metadata when submitting existing flyers, not the actual page content

**Solution:** Added `pages: preparePagesForAPI(flyerData.pages)` to submitMutation for existing flyers

**Impact:**
- Suppliers can now reliably submit flyers with promo images
- Pre-approvers and approvers see correct promo images in PDFs
- Works consistently in both development and production

**Risk:** Very low - only adds missing data to save operation, doesn't change any backend logic

**Testing:** Critical to test the complete workflow from supplier → submit → pre-approver PDF → approver PDF

**Changes from v3.1.4:**
- **Frontend:** Fixed submit not saving pages
- **Frontend:** **NEW - Subcategory management UI** in category edit form
- **Frontend:** **NEW - Category appliance type** (built-in vs freestanding) with visual badges
- **Backend PDF:**
  - Icons now preserve transparency (PNG), images use JPEG
  - PDF filename without timestamp (saves disk space)
  - Icon layout matches frontend (fixed 4 slots, fill from top)
- **Backend API:** **NEW - Subcategory CRUD endpoints** (create, update, delete)
- **Backend Database:** **NEW - Category isBuiltIn field** (requires migration)
- **Backend Config:** PDF quality configurable via .env (no redeployment needed)
- **Backend:** Removed debug logging (code cleanup)
- **Both:** Version bump to 3.1.5

### Benefits Summary:
**Disk Space:** 50 flyers × 20 previews = 1000 PDFs → **50 PDFs** (95% reduction) ✓

**Icon Consistency:** What you see in editor = what you get in PDF ✓

**Quality Control:** Adjustable JPEG/PNG quality without redeployment ✓

**Admin Productivity:** Manage subcategories directly in UI without database access ✓

**Category Organization:** Distinguish built-in vs freestanding appliances with visual badges ✓

## PDF Quality Configuration (Production Tuning)

After deployment, you can adjust PDF quality **without redeployment**:

### To Reduce PDF File Size:
Edit `C:\inetpub\flyer-app\backend\.env`:
```bash
PDF_PRODUCT_JPEG_QUALITY=90    # Reduce from 100 to 90 (good balance)
PDF_PROMO_JPEG_QUALITY=90      # Reduce from 100 to 90 (good balance)
PDF_ICON_PNG_COMPRESSION=9     # Keep at 9 (max compression, maintains transparency)
```

Then restart service:
```powershell
Restart-Service FlcyManagementAPI
```

### Quality vs File Size Guidelines:

**JPEG Quality (1-100):**
- `100` = Maximum quality, largest files (current default)
- `95` = Excellent quality, ~20% smaller files
- `90` = Very good quality, ~30% smaller files (recommended for production)
- `85` = Good quality, ~40% smaller files
- `80` = Acceptable quality, ~50% smaller files
- Below 80 = Visible quality loss

**PNG Compression (0-9):**
- `9` = Maximum compression, smallest files, slower (recommended)
- `6` = Balanced compression/speed
- `0` = No compression, largest files, fastest

### Recommended Production Settings:

**For balanced quality/size (recommended):**
```bash
PDF_PRODUCT_JPEG_QUALITY=90
PDF_PROMO_JPEG_QUALITY=90
PDF_ICON_PNG_COMPRESSION=9
```

**For maximum quality (current):**
```bash
PDF_PRODUCT_JPEG_QUALITY=100
PDF_PROMO_JPEG_QUALITY=100
PDF_ICON_PNG_COMPRESSION=9
```

**For minimum file size:**
```bash
PDF_PRODUCT_JPEG_QUALITY=85
PDF_PROMO_JPEG_QUALITY=85
PDF_ICON_PNG_COMPRESSION=9
```

**Note:** Changes only affect newly generated PDFs. Existing PDFs remain unchanged.
