# Deployment Notes - Version 3.1.6

**Build Date:** 2025-11-10

**New Features:**
- Product Installation Type (Built-in vs Freestanding)
- Brand Color Backgrounds for Icons
- 46 Screenshot Placeholders in User Manual
- Updated Contact Information
- Reduced Footer Spacing
- Gray Backgrounds for White Icons (from v3.1.5)

---

## BUILD VERIFICATION COMPLETED ✓

### Backend Verification:
- ✅ Version: 3.1.6
- ✅ Compiled successfully to `dist/` folder
- ✅ Database migrations: 3 migrations included in `MIGRATE.sql`
- ✅ Configuration: Production `.env` from `backend/.env.production`

### Frontend Verification:
- ✅ Version: 3.1.6 (displayed in footer via `AppFooter.tsx`)
- ✅ API URLs: 13× `/api`, 0× `localhost:4000`
- ✅ Build environment: REACT_APP_API_URL=/api, REACT_APP_ENV=production
- ✅ Vodafone fonts included

### Configuration Verification:
- ✅ `.env` contains `API_URL=https://eflyer.kuchyneoresi.eu`
- ✅ `.env` contains `FRONTEND_URL=https://eflyer.kuchyneoresi.eu`
- ✅ `.env` contains `NODE_ENV=production`
- ✅ `.env` contains `DATABASE_URL` for production database

---

## What's New in v3.1.6

### 1. Product Installation Type (MAJOR FEATURE)

#### Background
Categories needed a way to specify whether products require selection of installation type (built-in vs freestanding). This is particularly important for appliances like refrigerators, ovens, dishwashers, etc., where installation type affects pricing, dimensions, and customer requirements.

#### Solution Implemented

**Database Schema Changes:**

1. **Category Table - Field Rename:**
   - Old field: `is_built_in` (boolean)
   - New field: `requires_installation_type` (boolean)
   - Purpose: Indicates whether products in this category must specify their installation type
   - Migration: `20251110101500_rename_is_built_in_to_requires_installation_type`

2. **Product Table - New Field:**
   - Created ENUM: `InstallationType` with values `BUILT_IN` and `FREESTANDING`
   - New field: `installation_type` (InstallationType enum, nullable)
   - Purpose: Stores the installation type for products that require it
   - Migration: `20251110102000_add_installation_type_to_product`

**Backend Implementation:**

Files changed:
- `backend/prisma/schema.prisma` - Added enum and renamed field
- `backend/src/categories/dto/create-category.dto.ts` - Added `requiresInstallationType`
- `backend/src/categories/dto/update-category.dto.ts` - Added `requiresInstallationType`
- `backend/src/products/dto/create-product.dto.ts` - Added `installationType`
- `backend/src/products/dto/update-product.dto.ts` - Added `installationType`
- `backend/src/products/products.service.ts` - Handle new field in CRUD operations
- `backend/src/categories/categories.service.ts` - Handle renamed field

**Frontend Implementation:**

Files changed:
- `src/services/categoriesService.ts` - Added `requiresInstallationType` to Category interface
- `src/services/productsService.ts` - Added `installationType` to Product interface
- `src/pages/categories/CategoryFormPage.tsx` - Checkbox for "Vyžaduje typ instalace"
- `src/pages/products/ProductFormPage.tsx` - **CONDITIONAL DROPDOWN:**
  - Dropdown only appears when selected category has `requiresInstallationType=true`
  - Shows two options: "Vestavné (Built-in)" and "Volně stojící (Freestanding)"
  - Validates that field is not empty when required
  - Saves value to database

**User Experience Flow:**

1. Admin marks category as requiring installation type:
   - Edit category (e.g., "Lednice")
   - Check "Vyžaduje typ instalace"
   - Save category

2. When adding/editing product in that category:
   - Dropdown "Typ instalace" automatically appears
   - User selects "Vestavné (Built-in)" or "Volně stojící (Freestanding)"
   - Cannot save without selection (validation)

3. Benefits:
   - ✅ Flexible: Only categories that need it require installation type
   - ✅ Validated: Cannot save product without type when required
   - ✅ User-friendly: Conditional UI only shows field when necessary
   - ✅ Data integrity: ENUM ensures only valid values

---

### 2. Brand Color Backgrounds for Icons (MAJOR FEATURE)

#### Background
Icons in the flyer system were always displayed with white backgrounds. However, marketing wanted the ability to display certain icons with colored backgrounds matching the brand color (e.g., red for Vodafone brand).

#### Solution Implemented

**Database Schema Changes:**
- New field in `icons` table: `use_brand_color` (boolean, default: false)
- Purpose: Flag indicating whether icon should be displayed with brand color background
- Migration: `20251110120000_add_use_brand_color_to_icons`

**Backend Implementation:**

Files changed:
- `backend/prisma/schema.prisma` - Added `useBrandColor` field to Icon model
- `backend/src/icons/dto/create-icon.dto.ts` - Added `useBrandColor` field
- `backend/src/icons/dto/update-icon.dto.ts` - Added `useBrandColor` field
- `backend/src/icons/icons.service.ts` - Handle new field in CRUD operations
- `backend/src/flyers/pdf.service.ts` - Render brand color background in PDF generation

**PDF Generation Logic:**

In `pdf.service.ts` around lines 437-455:
```typescript
// For each icon slot
if (icon.useBrandColor && product.brand?.color) {
  // Draw colored circle background
  page.drawCircle({
    x: iconX + iconSize / 2,
    y: iconY + iconSize / 2,
    size: iconSize / 2,
    color: rgb(...parseColor(product.brand.color))
  });
}
// Draw icon image on top
page.drawImage(iconImage, {
  x: iconX,
  y: iconY,
  width: iconSize,
  height: iconSize
});
```

**Frontend Implementation:**

Files changed:
- `src/services/iconsService.ts` - Added `useBrandColor` to Icon interface
- `src/pages/icons/IconFormPage.tsx` - Checkbox "Použít barvu značky jako pozadí"
- `src/components/flyer/ProductFlyerLayout.tsx` - Display brand color background in preview

**Preview Logic:**

In `ProductFlyerLayout.tsx` around lines 70-84:
```typescript
{icons.map((icon, index) => (
  <div style={{
    backgroundColor: icon.useBrandColor && product.brand?.color
      ? product.brand.color
      : 'white',
    borderRadius: '50%'
  }}>
    <img src={icon.imageUrl} alt={icon.name} />
  </div>
))}
```

**User Experience Flow:**

1. Admin creates/edits icon:
   - Upload icon image (preferably white icon on transparent background)
   - Check "Použít barvu značky jako pozadí"
   - Save icon

2. When icon is used in flyer:
   - In preview: Icon displays with circular colored background (brand.color)
   - In PDF: Icon renders with same colored background
   - If product has no brand or brand has no color: Falls back to white background

3. Benefits:
   - ✅ WYSIWYG: Preview matches PDF output exactly
   - ✅ Flexible: Icon can be used with or without brand color
   - ✅ Consistent: Same icon can be reused across different brands with their colors
   - ✅ Professional: Matches marketing requirements for brand visibility

---

### 3. Gray Backgrounds for White Icons (FROM v3.1.5)

#### Background
White or transparent icons were invisible or hard to see on the white flyer background. This feature was implemented in v3.1.5 and is included in v3.1.6.

#### Solution
- Icons without brand color background automatically get a light gray background
- Ensures visibility of all icons regardless of color
- Works in both preview and PDF

**Logic:**
```typescript
backgroundColor = icon.useBrandColor && brand?.color
  ? brand.color           // Use brand color if enabled
  : '#f0f0f0'             // Use gray as fallback for visibility
```

---

### 4. Screenshot Placeholders in User Manual (NEW)

#### Background
The user manual (`UZIVATELSKY_NAVOD.html`) needed screenshots for better user guidance, but actual screenshots weren't ready yet.

#### Solution Implemented

Added 46 screenshot placeholders throughout the manual:

Files changed:
- `UZIVATELSKY_NAVOD.html` - Added 46 placeholder divs
- `SCREENSHOTY_TODO.md` - Created guide for taking screenshots

**Placeholder Format:**
```html
<div style="border: 2px solid #ccc; padding: 20px; margin: 10px 0; background: #f5f5f5; text-align: center;">
  <p style="color: #666; font-size: 14px;">📸 Screenshot: [Description of what should be shown]</p>
</div>
```

**Screenshot Locations:**
- Login page and authentication
- Admin dashboard and navigation
- Product management (add, edit, list)
- Category and subcategory management
- Brand management
- Icon management with brand color options
- User management and permissions
- Flyer creation and editing
- Product placement and icon assignment
- Promo image management
- Submit for verification workflow
- Pre-approver and approver workflows
- PDF preview and download
- Active flyers display for end users

**Next Steps:**
- Follow instructions in `SCREENSHOTY_TODO.md`
- Take 46 screenshots as described
- Replace placeholder HTML with `<img>` tags

---

### 5. Contact Information Update (NEW)

#### Background
Contact information in the user manual needed to be updated.

#### Changes Applied

Files changed:
- `UZIVATELSKY_NAVOD.html` - Updated contact section

**Changes:**
- Email: Changed to `eletak@oresi.cz` (removed diacritics from previous email)
- Phone: Removed phone number entirely

**Location:** Bottom of user manual in "Kontakt" section

---

### 6. Reduced Footer Spacing (NEW)

#### Background
Footer had excessive top margin/padding, wasting vertical space.

#### Solution Applied

Files changed:
- `src/components/layout/AppFooter.tsx`

**Changes:**
```typescript
// Before:
<footer className="mt-12 pt-6">

// After:
<footer className="mt-3 pt-1.5">
```

**Impact:**
- Reduced top margin from 3rem (48px) to 0.75rem (12px)
- Reduced top padding from 1.5rem (24px) to 0.375rem (6px)
- Saves ~60px of vertical space
- More compact layout without losing functionality

---

## Database Migrations

**CRITICAL:** Three migrations must be run before deploying code!

### Migration 1: Rename Column in Categories Table
**File:** `backend/prisma/migrations/20251110101500_rename_is_built_in_to_requires_installation_type/migration.sql`

```sql
ALTER TABLE "categories" RENAME COLUMN "is_built_in" TO "requires_installation_type";
```

**Purpose:** Rename field to better reflect its purpose (indicates whether products in this category must specify installation type)

---

### Migration 2: Create ENUM and Add Column to Products
**File:** `backend/prisma/migrations/20251110102000_add_installation_type_to_product/migration.sql`

```sql
CREATE TYPE "InstallationType" AS ENUM ('BUILT_IN', 'FREESTANDING');
ALTER TABLE "products" ADD COLUMN "installation_type" "InstallationType";
```

**Purpose:**
- Create enum type for installation type values
- Add nullable column to products table
- Products in categories with `requires_installation_type=true` must have this field set

---

### Migration 3: Add Brand Color Flag to Icons
**File:** `backend/prisma/migrations/20251110120000_add_use_brand_color_to_icons/migration.sql`

```sql
ALTER TABLE "icons" ADD COLUMN "use_brand_color" BOOLEAN NOT NULL DEFAULT false;
```

**Purpose:** Add flag to icons indicating whether to display with brand color background

---

### Combined Migration File

All three migrations are available in a single file: `Production_v3.1.6/MIGRATE.sql`

You can run this file directly OR use Prisma's migration system (recommended).

---

## Files Changed

### Frontend Files (React/TypeScript):

1. **`package.json`** - Version bumped to 3.1.6
2. **`src/components/layout/AppFooter.tsx`** - Display version 3.1.6, reduced spacing
3. **`src/services/categoriesService.ts`** - Added `requiresInstallationType` field
4. **`src/services/productsService.ts`** - Added `installationType` field and enum
5. **`src/services/iconsService.ts`** - Added `useBrandColor` field
6. **`src/pages/categories/CategoryFormPage.tsx`** - Checkbox for requiring installation type
7. **`src/pages/products/ProductFormPage.tsx`** - Conditional dropdown for installation type
8. **`src/pages/icons/IconFormPage.tsx`** - Checkbox for using brand color background
9. **`src/components/flyer/ProductFlyerLayout.tsx`** - Render brand color backgrounds for icons
10. **`UZIVATELSKY_NAVOD.html`** - 46 screenshot placeholders + updated contacts

### Backend Files (NestJS/TypeScript):

1. **`backend/package.json`** - Version bumped to 3.1.6
2. **`backend/prisma/schema.prisma`** - Renamed field, added enum, added fields
3. **`backend/prisma/migrations/`** - Three new migrations
4. **`backend/src/categories/dto/create-category.dto.ts`** - Added `requiresInstallationType`
5. **`backend/src/categories/dto/update-category.dto.ts`** - Added `requiresInstallationType`
6. **`backend/src/categories/categories.service.ts`** - Handle renamed field
7. **`backend/src/products/dto/create-product.dto.ts`** - Added `installationType`
8. **`backend/src/products/dto/update-product.dto.ts`** - Added `installationType`
9. **`backend/src/products/products.service.ts`** - Handle new field
10. **`backend/src/icons/dto/create-icon.dto.ts`** - Added `useBrandColor`
11. **`backend/src/icons/dto/update-icon.dto.ts`** - Added `useBrandColor`
12. **`backend/src/icons/icons.service.ts`** - Handle new field
13. **`backend/src/flyers/pdf.service.ts`** - Render brand color backgrounds in PDF

### Documentation Files:

1. **`SCREENSHOTY_TODO.md`** - NEW: Guide for creating 46 screenshots
2. **`Production_v3.1.6/README.txt`** - Quick start guide with v3.1.6 changes
3. **`Production_v3.1.6/DEPLOY_CHECKLIST.txt`** - Deployment checklist for v3.1.6
4. **`Production_v3.1.6/DEPLOYMENT_NOTES.md`** - This file
5. **`Production_v3.1.6/MIGRATE.sql`** - Combined SQL migrations

---

## Deployment Instructions

### Pre-Deployment Checklist

- [ ] Review all changes in this document
- [ ] Verify backup strategy is in place
- [ ] Confirm database user has ALTER permissions
- [ ] Schedule deployment during low-traffic period
- [ ] Notify users of planned maintenance (if applicable)

---

### Step 1: Create Backup

```powershell
# Stop the service
Stop-Service FlcyManagementAPI

# Create timestamped backup
$backupDir = "C:\inetpub\flyer-app\backup_3.1.5_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item "C:\inetpub\flyer-app\backend" $backupDir -Recurse

# Verify backup created
Get-ChildItem $backupDir
```

**Verify:**
- Backup folder exists
- Backup contains all files (dist/, frontend/, prisma/, etc.)
- Note backup folder path for potential rollback

---

### Step 2: Deploy Files

```powershell
# Copy all files from Production_v3.1.6 to production location
Copy-Item "Production_v3.1.6\*" "C:\inetpub\flyer-app\backend\" -Recurse -Force
```

**Verify:**
- All files copied successfully
- No permission errors
- dist/ folder contains compiled backend
- frontend/ folder contains built React app

---

### Step 3: Verify Configuration

**Check `.env` file:**

```powershell
# View .env contents
Get-Content "C:\inetpub\flyer-app\backend\.env"
```

**Must contain:**
```bash
# Database
DATABASE_URL="postgresql://flyer_app_user:Flyer_app_2025@localhost:5432/flyer_app_production"

# Server
PORT=4000
NODE_ENV=production

# URLs
FRONTEND_URL=https://eflyer.kuchyneoresi.eu
API_URL=https://eflyer.kuchyneoresi.eu

# Authentication
JWT_SECRET=[your-secret]
JWT_EXPIRATION=7d

# Email (SMTP)
SMTP_HOST=[your-smtp-host]
SMTP_PORT=[your-smtp-port]
SMTP_USER=[your-smtp-user]
SMTP_PASS=[your-smtp-pass]
SMTP_FROM=[your-smtp-from]

# PDF Quality (from v3.1.5)
PDF_PRODUCT_JPEG_QUALITY=100
PDF_PROMO_JPEG_QUALITY=100
PDF_ICON_PNG_COMPRESSION=9

# ERP Database (from v3.1.5)
ERP_DB_SERVER=[your-erp-server]
ERP_DB_PORT=[your-erp-port]
ERP_DB_DATABASE=[your-erp-db]
ERP_DB_USER=[your-erp-user]
ERP_DB_PASSWORD=[your-erp-password]
```

**CRITICAL:** Verify `DATABASE_URL`, `API_URL`, and `FRONTEND_URL` are correct for production!

---

### Step 4: Run Database Migrations (CRITICAL!)

**IMPORTANT:** Migrations MUST be run BEFORE starting the service!

```powershell
# Navigate to backend folder
cd C:\inetpub\flyer-app\backend

# Deploy migrations using Prisma
npx prisma migrate deploy
```

**Expected Output:**
```
Applying migration `20251110101500_rename_is_built_in_to_requires_installation_type`
Applying migration `20251110102000_add_installation_type_to_product`
Applying migration `20251110120000_add_use_brand_color_to_icons`

The following migration(s) have been applied:

migrations/
  └─ 20251110101500_rename_is_built_in_to_requires_installation_type/
      └─ migration.sql
  └─ 20251110102000_add_installation_type_to_product/
      └─ migration.sql
  └─ 20251110120000_add_use_brand_color_to_icons/
      └─ migration.sql

All migrations have been successfully applied.
```

**If Errors Occur:**
1. Check database connection in `.env`
2. Verify database user has ALTER permissions
3. Check if migrations were already applied (safe to re-run)
4. **DO NOT** proceed with deployment if migrations fail!

**Verify Migrations:**

```powershell
# Connect to database and verify schema changes
# You can use pgAdmin, psql, or Azure Data Studio
```

**SQL Verification Queries:**

```sql
-- Verify category field rename
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'categories'
AND column_name = 'requires_installation_type';
-- Should return: requires_installation_type | boolean

-- Verify enum creation
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'InstallationType';
-- Should return: BUILT_IN, FREESTANDING

-- Verify product column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'installation_type';
-- Should return: installation_type | USER-DEFINED

-- Verify icons column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'icons'
AND column_name = 'use_brand_color';
-- Should return: use_brand_color | boolean
```

---

### Step 5: Install Dependencies (if needed)

```powershell
cd C:\inetpub\flyer-app\backend
npm ci --production
```

**When to run this:**
- If `node_modules` folder is missing
- If you encounter module resolution errors
- If dependencies were updated (check package.json)

**Note:** Production build already includes compiled backend, so this may not be necessary if `dist/` folder is complete.

---

### Step 6: Start Service

```powershell
# Start the Windows service
Start-Service FlcyManagementAPI

# Wait 30 seconds for service to initialize
Start-Sleep -Seconds 30

# Check service status
Get-Service FlcyManagementAPI
```

**Expected:**
- Status: Running
- StartType: Automatic

**If service fails to start:**
1. Check Windows Event Viewer for errors
2. Check backend logs (if logging to file)
3. Verify .env configuration
4. Verify migrations completed successfully
5. Consider rollback if issue cannot be resolved

---

## Post-Deployment Verification

### 1. Backend Health Check

```powershell
# Test backend health endpoint
Invoke-WebRequest -Uri "https://eflyer.kuchyneoresi.eu/api/health" -UseBasicParsing
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

**If health check fails:**
- Service may not be fully started (wait longer)
- Check .env API_URL configuration
- Check Windows Firewall / reverse proxy configuration
- Check service logs

---

### 2. Version Verification (CRITICAL)

1. Open browser: `https://eflyer.kuchyneoresi.eu`
2. Login with any user account
3. Scroll to bottom of page
4. **Check footer:** Should display **"Verze: 3.1.6"**

**If version shows 3.1.5 or older:**
- Deployment did not work correctly
- Frontend files may not have been copied
- Browser cache may need clearing (Ctrl+Shift+Delete)
- Service may need restart

---

### 3. Console Check

1. Open browser DevTools (F12)
2. Go to Console tab
3. Reload page (Ctrl+F5)

**Verify:**
- ❌ NO console errors
- ❌ NO "Mixed Content" warnings
- ❌ NO 404 errors for resources
- ✅ API requests return 200 OK

---

### 4. Feature Testing

#### Test 1: Installation Type for Products

**Objective:** Verify conditional installation type dropdown works

**Steps:**
1. Login as **admin**
2. Navigate to **Správa kategorií** (Categories)
3. Click **Upravit** (Edit) on an existing category (e.g., "Lednice")
4. Check the **"Vyžaduje typ instalace"** checkbox
5. Click **Uložit** (Save)
6. Navigate to **Správa produktů** → **Přidat produkt**
7. Select the category you just edited
8. **VERIFY:** Dropdown "Typ instalace" appears ✓
9. Select **"Vestavné (Built-in)"**
10. Fill in other required fields (name, brand, etc.)
11. Click **Uložit** (Save)
12. **VERIFY:** Product saved successfully ✓
13. Click **Upravit** (Edit) on the product you just created
14. **VERIFY:** Installation type is still "Vestavné (Built-in)" ✓
15. Change category to one WITHOUT requires_installation_type
16. **VERIFY:** Dropdown disappears ✓
17. Try to save product in a category that requires type but without selecting type
18. **VERIFY:** Validation error appears ✓

**Expected Result:**
- Dropdown appears/disappears based on category setting
- Value persists after save
- Validation prevents saving without type when required
- No console errors

---

#### Test 2: Brand Color Backgrounds for Icons

**Objective:** Verify icons can display with brand color backgrounds

**Steps:**
1. Login as **admin**
2. Navigate to **Správa ikon** (Icons)
3. Click **Přidat ikonu** (Add Icon) or **Upravit** (Edit) on existing icon
4. Check the **"Použít barvu značky jako pozadí"** checkbox
5. Upload icon image (preferably white icon on transparent background)
6. Click **Uložit** (Save)
7. Navigate to **Letáky** → **Nový leták** (New Flyer)
8. Add a product that has a brand with a defined color (e.g., Vodafone = red)
9. Assign the icon (with use_brand_color=true) to the product
10. **VERIFY:** In preview, icon has colored circular background matching brand color ✓
11. Click **Stáhnout PDF** (Download PDF)
12. Open the generated PDF
13. **VERIFY:** In PDF, icon has same colored circular background ✓
14. Go back to icon management
15. Edit the icon and UNCHECK "Použít barvu značky jako pozadí"
16. Save and refresh flyer preview
17. **VERIFY:** Icon now has gray/white background instead ✓

**Expected Result:**
- Icon displays with brand color when checkbox is checked
- Preview and PDF match exactly (WYSIWYG)
- Fallback to gray background when checkbox is unchecked
- No console errors

---

#### Test 3: Gray Backgrounds for White Icons

**Objective:** Verify white/transparent icons get gray backgrounds for visibility

**Steps:**
1. Login as **admin**
2. Navigate to **Správa ikon** (Icons)
3. Upload an icon that is mostly white or transparent
4. Do NOT check "Použít barvu značky"
5. Save icon
6. Add this icon to a product in a flyer
7. **VERIFY:** Icon has light gray circular background (visible on white flyer) ✓
8. Generate PDF
9. **VERIFY:** Icon has same gray background in PDF ✓

**Expected Result:**
- White icons are visible against white flyer background
- Automatic gray background provides contrast
- Works in both preview and PDF

---

#### Test 4: Screenshot Placeholders in User Manual

**Objective:** Verify user manual contains screenshot placeholders

**Steps:**
1. Navigate to `C:\inetpub\flyer-app\backend\frontend\` (or wherever frontend is served from)
2. Open `UZIVATELSKY_NAVOD.html` in web browser
3. Scroll through entire document
4. **VERIFY:** Document contains 46 gray boxes with 📸 emoji ✓
5. **VERIFY:** Each placeholder has description of what screenshot should show ✓
6. **VERIFY:** Placeholders are distributed throughout all sections ✓

**Expected Result:**
- 46 distinct screenshot placeholders
- Clear descriptions for each placeholder
- Professional gray styling with borders

---

#### Test 5: Contact Information

**Objective:** Verify updated contact information

**Steps:**
1. Open `UZIVATELSKY_NAVOD.html` in browser
2. Scroll to bottom (section "Kontakt")
3. **VERIFY:** Email is `eletak@oresi.cz` (no diacritics) ✓
4. **VERIFY:** No phone number displayed ✓

**Expected Result:**
- Email displays correctly without special characters
- Phone number completely removed

---

#### Test 6: Footer Spacing

**Objective:** Verify reduced footer margin/padding

**Steps:**
1. Open application: `https://eflyer.kuchyneoresi.eu`
2. Login with any account
3. Observe space above footer
4. **VERIFY:** Footer has minimal top margin (should be closer to content) ✓

**Expected Result:**
- Less vertical space above footer compared to v3.1.5
- Footer still readable and properly styled
- Entire page feels more compact

---

#### Test 7: Regression Test - Core Functionality

**Objective:** Ensure new features didn't break existing functionality

**Steps:**
1. Login as **supplier** (dodavatel)
2. Create new flyer
3. Add products to pages
4. Add promo images
5. Save flyer
6. Click **"Odeslat k autorizaci"** (Submit for Verification)
7. Reload page
8. **VERIFY:** All products and promo images still present ✓
9. Login as **pre_approver** (předschvalovatel)
10. Open submitted flyer
11. **VERIFY:** Flyer displays correctly ✓
12. Download PDF
13. **VERIFY:** PDF contains all products and promo images ✓
14. Login as **approver** (schvalovatel)
15. Open flyer (if pre-approved)
16. **VERIFY:** PDF displays correctly ✓

**Expected Result:**
- All existing workflows still function
- No regression in product/promo handling
- No console errors

---

### 5. Database Verification (Technical)

**Optional but recommended:** Verify database schema changes

```sql
-- Connect to production database using pgAdmin, psql, or Azure Data Studio

-- 1. Verify category field rename
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
AND column_name IN ('requires_installation_type', 'is_built_in');

-- Expected result:
-- requires_installation_type | boolean | YES
-- (is_built_in should NOT be in results)

-- 2. Verify InstallationType enum
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'InstallationType'
ORDER BY enumlabel;

-- Expected result:
-- BUILT_IN
-- FREESTANDING

-- 3. Verify product installation_type column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'installation_type';

-- Expected result:
-- installation_type | USER-DEFINED | YES

-- 4. Verify icon use_brand_color column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'icons'
AND column_name = 'use_brand_color';

-- Expected result:
-- use_brand_color | boolean | NO | false

-- 5. Check for any existing data
SELECT COUNT(*) as total_categories,
       SUM(CASE WHEN requires_installation_type = true THEN 1 ELSE 0 END) as requires_type
FROM categories;

SELECT COUNT(*) as total_products,
       SUM(CASE WHEN installation_type IS NOT NULL THEN 1 ELSE 0 END) as with_type
FROM products;

SELECT COUNT(*) as total_icons,
       SUM(CASE WHEN use_brand_color = true THEN 1 ELSE 0 END) as with_brand_color
FROM icons;
```

---

## Success Criteria

**Deployment is successful if ALL of the following are true:**

- ✅ Backend health endpoint returns `{"status":"ok"}`
- ✅ Footer displays **"Verze: 3.1.6"**
- ✅ No console errors in browser
- ✅ Installation type dropdown appears when category requires it
- ✅ Installation type value persists after save
- ✅ Brand color icons display correctly in preview and PDF
- ✅ White icons have gray backgrounds
- ✅ User manual contains 46 screenshot placeholders
- ✅ Contact email is `eletak@oresi.cz`
- ✅ Footer spacing is reduced
- ✅ Existing flyer workflows still work (no regression)
- ✅ Database migrations completed successfully
- ✅ All 3 database schema changes verified

---

## Rollback Procedure

**If deployment fails and cannot be fixed quickly:**

### Step 1: Stop Service
```powershell
Stop-Service FlcyManagementAPI
```

### Step 2: Restore Backup
```powershell
# Find latest backup
$backup = Get-ChildItem "C:\inetpub\flyer-app\backup_3.1.5_*" |
          Sort-Object Name -Descending |
          Select-Object -First 1

# Remove current deployment
Remove-Item "C:\inetpub\flyer-app\backend\*" -Recurse -Force

# Restore backup
Copy-Item "$($backup.FullName)\*" "C:\inetpub\flyer-app\backend\" -Recurse -Force
```

### Step 3: Database Rollback (IF NEEDED)

**WARNING:** Database rollback is complex and may result in data loss!

**Only perform if absolutely necessary and you understand the consequences!**

```sql
-- Rollback migration 3 (icons)
ALTER TABLE "icons" DROP COLUMN "use_brand_color";

-- Rollback migration 2 (products and enum)
ALTER TABLE "products" DROP COLUMN "installation_type";
DROP TYPE "InstallationType";

-- Rollback migration 1 (categories)
ALTER TABLE "categories" RENAME COLUMN "requires_installation_type" TO "is_built_in";
```

**Note:** If any data was added to these new fields, it will be lost!

### Step 4: Restart Service
```powershell
Start-Service FlcyManagementAPI
Start-Sleep -Seconds 30
Get-Service FlcyManagementAPI
```

### Step 5: Verify Rollback
1. Check backend health: `https://eflyer.kuchyneoresi.eu/api/health`
2. Check footer shows previous version (3.1.5)
3. Test core functionality works

### Step 6: Investigate Issue
- Review deployment logs
- Check what failed during deployment
- Fix issue before attempting re-deployment
- Consider testing in staging environment first

---

## Troubleshooting

### Issue: Version doesn't update

**Symptoms:**
- Footer still shows "Verze: 3.1.5" or older
- Frontend doesn't reflect new changes

**Possible Causes:**
- Frontend files not copied correctly
- Browser cache not cleared
- Service not restarted properly

**Solutions:**
1. Stop service: `Stop-Service FlcyManagementAPI`
2. Verify files: `Get-ChildItem "C:\inetpub\flyer-app\backend\frontend"`
3. Check package.json: `Get-Content "C:\inetpub\flyer-app\backend\frontend\package.json" | Select-String "version"`
4. Re-copy frontend: `Copy-Item "Production_v3.1.6\frontend\*" "C:\inetpub\flyer-app\backend\frontend\" -Recurse -Force`
5. Start service: `Start-Service FlcyManagementAPI`
6. Hard refresh browser: Ctrl+F5

---

### Issue: Database migrations fail

**Symptoms:**
- `npx prisma migrate deploy` returns errors
- Migrations stuck or timeout

**Possible Causes:**
- Database connection issue
- Insufficient permissions
- Migrations already applied
- Column/enum already exists

**Solutions:**
1. Check database connectivity:
   ```powershell
   # Test connection (adjust connection string)
   psql "postgresql://flyer_app_user:password@localhost:5432/flyer_app_production"
   ```

2. Verify user permissions:
   ```sql
   SELECT * FROM information_schema.role_table_grants
   WHERE grantee = 'flyer_app_user';
   ```

3. Check if migrations already applied:
   ```sql
   SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10;
   ```

4. If columns exist, migrations may have partially completed:
   ```sql
   -- Check if requires_installation_type exists
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'categories'
   AND column_name = 'requires_installation_type';

   -- If it exists, migration 1 succeeded

   -- Check if InstallationType enum exists
   SELECT typname FROM pg_type WHERE typname = 'InstallationType';

   -- If it exists, migration 2 succeeded

   -- Check if use_brand_color exists
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'icons'
   AND column_name = 'use_brand_color';

   -- If it exists, migration 3 succeeded
   ```

5. If migrations already applied, mark them as complete in Prisma:
   ```powershell
   # Manually mark migration as applied
   npx prisma migrate resolve --applied 20251110101500_rename_is_built_in_to_requires_installation_type
   npx prisma migrate resolve --applied 20251110102000_add_installation_type_to_product
   npx prisma migrate resolve --applied 20251110120000_add_use_brand_color_to_icons
   ```

---

### Issue: Installation type dropdown doesn't appear

**Symptoms:**
- Dropdown doesn't show even when category has requiresInstallationType=true
- No validation when trying to save without type

**Possible Causes:**
- Migration 1 or 2 not applied
- Category field not set correctly
- Frontend cached

**Solutions:**
1. Verify migration applied:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'categories'
   AND column_name = 'requires_installation_type';
   ```

2. Check category setting:
   ```sql
   SELECT id, name, requires_installation_type FROM categories;
   ```

3. Clear browser cache: Ctrl+Shift+Delete
4. Check browser console for errors (F12)

---

### Issue: Brand color icons don't work

**Symptoms:**
- Checkbox appears but doesn't affect icon display
- Icons still show white background
- PDF doesn't show colored backgrounds

**Possible Causes:**
- Migration 3 not applied
- Icon field not set correctly
- Product has no brand or brand has no color
- PDF generation issue

**Solutions:**
1. Verify migration applied:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'icons'
   AND column_name = 'use_brand_color';
   ```

2. Check icon setting:
   ```sql
   SELECT id, name, use_brand_color FROM icons;
   ```

3. Verify product has brand with color:
   ```sql
   SELECT p.id, p.name, b.name as brand_name, b.color
   FROM products p
   LEFT JOIN brands b ON p.brand_id = b.id
   WHERE p.id = [your_product_id];
   ```

4. Check browser console for errors (F12)
5. Regenerate PDF (download again)

---

### Issue: Service won't start after deployment

**Symptoms:**
- `Start-Service FlcyManagementAPI` fails
- Service status is "Stopped" or "Failed"

**Possible Causes:**
- .env configuration error
- Missing dependencies
- Port already in use
- Database connection failure

**Solutions:**
1. Check Windows Event Viewer:
   - Windows Logs → Application
   - Look for errors from Node.js or FlcyManagementAPI

2. Verify .env file:
   ```powershell
   Get-Content "C:\inetpub\flyer-app\backend\.env"
   ```

3. Test database connection:
   ```powershell
   psql "postgresql://flyer_app_user:password@localhost:5432/flyer_app_production"
   ```

4. Check if port is in use:
   ```powershell
   netstat -ano | findstr :4000
   ```

5. Try running manually to see errors:
   ```powershell
   cd C:\inetpub\flyer-app\backend
   node dist/main.js
   ```

6. If dependency issue:
   ```powershell
   cd C:\inetpub\flyer-app\backend
   npm ci --production
   ```

---

## Summary

**Version:** 3.1.6

**Build Date:** 2025-11-10

**Major Features:**
1. **Product Installation Type** - Conditional dropdown for built-in vs freestanding products
2. **Brand Color Icon Backgrounds** - Icons can display with brand-colored circular backgrounds
3. **Screenshot Placeholders** - 46 placeholders added to user manual for future screenshots
4. **Updated Contacts** - Email changed to eletak@oresi.cz, phone removed
5. **Reduced Footer Spacing** - More compact layout
6. **Gray Icon Backgrounds** - Ensures visibility of white/transparent icons (from v3.1.5)

**Database Changes:**
- Renamed `categories.is_built_in` → `categories.requires_installation_type`
- Created enum `InstallationType` (BUILT_IN, FREESTANDING)
- Added `products.installation_type` (nullable enum)
- Added `icons.use_brand_color` (boolean, default false)

**Risk Level:** Low-Medium
- Low: Most changes are additive (new fields, new features)
- Medium: Database migrations required (field rename could be risky if not handled properly)

**Testing Priority:** HIGH
- Test all new features thoroughly
- Test regression (existing workflows must still work)
- Verify database migrations completed successfully

**Rollback Complexity:** Medium
- File rollback: Easy (restore backup folder)
- Database rollback: Medium (3 SQL commands, potential data loss)

---

## Support

**If issues occur during deployment:**
1. DO NOT panic
2. Document the error (screenshot, logs, error messages)
3. Check Troubleshooting section above
4. Consider rollback if issue is critical
5. Contact developer with detailed error information

**For questions or clarification:**
- Review this document thoroughly
- Check DEPLOY_CHECKLIST.txt for step-by-step instructions
- Check README.txt for quick reference

---

**End of Deployment Notes - Version 3.1.6**
