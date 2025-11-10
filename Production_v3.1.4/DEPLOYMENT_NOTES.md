# Deployment Notes - Version 3.1.4 - VERIFIED BUILD

**Build Date:** 2025-11-09
**Critical Fix:** Promo images with brand assignment now save correctly in flyers

## BUILD VERIFICATION COMPLETED ✓

### Backend Verification:
- ✅ Version: 3.1.4
- ✅ Fix present: 4 occurrences of `hasAccessToBrand` found
- ✅ File: `dist/src/flyers/flyers.service.js`
- ✅ Compiled successfully

### Frontend Verification:
- ✅ Version: 3.1.4 (displayed in footer)
- ✅ API URLs: 13× `/api`, 0× `localhost:4000`
- ✅ File: `frontend/static/js/main.f0ca6047.js`
- ✅ Vodafone fonts included

### Configuration Verification:
- ✅ `.env` contains `API_URL=https://eflyer.kuchyneoresi.eu`
- ✅ `.env` contains `FRONTEND_URL=https://eflyer.kuchyneoresi.eu`
- ✅ `.env` contains `NODE_ENV=production`

## What Was Fixed

### 1. Promo Images with Brand Assignment

#### Issue Description
When an admin created a promo image and assigned it to a brand:
1. Supplier with that brand could see the promo image in the list ✓
2. Supplier could drag and drop it into a flyer ✓
3. **But when saving, the promo image disappeared from the flyer** ❌

#### Root Cause
Backend validation in `flyers.service.ts` only checked if `promoImage.supplierId === userId`:
- Admin creates promo with brandId → `supplierId = admin`
- Supplier tries to use it → `supplierId (admin) !== userId (supplier)` → validation fails
- Promo image silently skipped during save

#### Solution Applied
Updated validation logic in TWO places:
1. **Footer promo validation** (lines 1591-1614)
2. **Slot promo validation** (lines 1704-1732)

**Now checks BOTH:**
1. Does the promo belong to the supplier directly? OR
2. Is the promo assigned to a brand the supplier has access to?

```typescript
if (dbPromoImage.supplierId === userId) {
  canUsePromoImage = true;
}
else if (dbPromoImage.brandId) {
  const hasAccessToBrand = await this.prisma.userBrand.findFirst({
    where: { userId, brandId: dbPromoImage.brandId },
  });
  canUsePromoImage = !!hasAccessToBrand;
}
```

### 2. PDF Image Quality Improvement

#### Issue Description
Images in generated PDFs appeared blurry or pixelated due to high compression.

#### Solution Applied
Increased JPEG quality from 85 to **100 (maximum)** in `pdf.service.ts`:
- Products: Maximum image quality at 600px max width
- Promo images: Maximum image quality at 1200px max width
- Icons: Maximum image quality at 100px max width

Since images are already being converted from PNG to JPEG, using quality 100 ensures no additional quality loss.

**Trade-off:** PDF files will be larger (approximately 20-30% increase compared to quality 85), but images will be crystal clear and professional-looking.

## Files Changed

### Backend:
- `backend/src/flyers/flyers.service.ts` - Fixed promo image validation
- `backend/src/flyers/pdf.service.ts` - Increased JPEG quality from 85 to 100 (maximum) for best image clarity in PDFs
- `backend/package.json` - Version 3.1.4

### Frontend:
- `package.json` - Version 3.1.4
- `src/components/layout/AppFooter.tsx` - Display version 3.1.4

## Deployment Instructions

### 1. Stop Service & Backup
```powershell
Stop-Service FlcyManagementAPI
Copy-Item C:\inetpub\flyer-app\backend C:\inetpub\flyer-app\backend_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss') -Recurse
```

### 2. Deploy Files
```powershell
# Copy entire Production_v3.1.4 folder to server
Copy-Item Production_v3.1.4\* C:\inetpub\flyer-app\backend\ -Recurse -Force
```

### 3. CRITICAL: Verify .env
Check that `C:\inetpub\flyer-app\backend\.env` contains:
```bash
API_URL=https://eflyer.kuchyneoresi.eu
FRONTEND_URL=https://eflyer.kuchyneoresi.eu
NODE_ENV=production
```

### 4. Install Dependencies (if needed)
```powershell
cd C:\inetpub\flyer-app\backend
npm ci --production
```

### 5. Start Service
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
Open app in browser → check footer → should show **"Verze: 3.1.4"**

### Test the Fix:
1. Login as supplier who has access to a brand
2. Admin creates a promo image assigned to that brand
3. Supplier should see the promo image in the list
4. Drag and drop the promo image into a flyer
5. **Save the flyer**
6. **Reload the flyer** - promo image should still be there ✓

### Expected Behavior:
- ✅ Promo images with brands persist after save
- ✅ Suppliers can use promo images assigned to their brands
- ✅ Suppliers can still use their own promo images
- ✅ No console errors
- ✅ Version 3.1.4 in footer

## Code Verification

You can manually verify the fix is present by checking:

```bash
# On production server after deployment:
findstr /C:"hasAccessToBrand" C:\inetpub\flyer-app\backend\dist\src\flyers\flyers.service.js
# Should find 4 matches (2 locations × 2 lines each)
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

**Version:** 3.1.4
**Root Cause:** Backend validation only checked promo ownership, not brand access
**Solution:** Added brand access validation for suppliers
**Impact:** Suppliers can now use brand-assigned promo images in flyers
**Risk:** Low - only adds permission, doesn't remove any existing functionality
**Verification:** Code fix confirmed present in build (4 occurrences of hasAccessToBrand)
