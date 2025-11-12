-- ============================================================================
-- MIGRATION SQL for Flyer Management System v3.1.7
-- ============================================================================
-- Date: 11. listopadu 2025
-- Description: Add soldOut field to Product table
-- Backwards compatible: YES (default value false)
-- ============================================================================

-- Add soldOut column to Product table
-- This field indicates whether a product is sold out (discontinued in ERP)
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "soldOut" BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries on soldOut products (optional but recommended)
CREATE INDEX IF NOT EXISTS "Product_soldOut_idx" ON "Product"("soldOut");

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Product' AND column_name = 'soldOut';

-- Expected output:
-- column_name | data_type | column_default
-- soldOut     | boolean   | false

-- Check how many products exist (should all have soldOut=false initially)
SELECT COUNT(*) as total_products,
       COUNT(*) FILTER (WHERE "soldOut" = false) as not_sold_out,
       COUNT(*) FILTER (WHERE "soldOut" = true) as sold_out
FROM "Product";

-- Expected output after migration:
-- total_products | not_sold_out | sold_out
-- N              | N            | 0

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- WARNING: This will permanently delete the soldOut column and all its data!
-- Only use if you need to rollback to v3.1.6

-- DROP INDEX IF EXISTS "Product_soldOut_idx";
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "soldOut";

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This migration is IDEMPOTENT - safe to run multiple times
-- 2. Uses IF NOT EXISTS to prevent errors on re-runs
-- 3. Default value 'false' ensures backwards compatibility
-- 4. All existing products will have soldOut=false after migration
-- 5. Index creation is optional but improves query performance

-- ============================================================================
-- DEPLOYMENT INSTRUCTIONS
-- ============================================================================

-- Option 1: Using this SQL file directly
-- psql -U flyer_app_user -d flyer_app_production -f MIGRATE.sql

-- Option 2: Using Prisma (recommended)
-- cd /var/www/flyer-app/backend
-- npx prisma db push

-- Option 3: Manual execution
-- psql -U flyer_app_user flyer_app_production
-- Then paste the ALTER TABLE command above

-- ============================================================================
