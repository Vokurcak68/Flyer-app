-- AlterTable
-- Remove unique constraint from ean_code to allow multiple products with same EAN (when ENFORCE_UNIQUE_EAN=false)
-- or to allow reusing EAN codes after soft delete (isActive=false)

-- Drop the unique constraint on ean_code
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_ean_code_key";

-- The index on ean_code is kept for query performance
-- CREATE INDEX IF NOT EXISTS "products_ean_code_idx" ON "products"("ean_code");
-- This index already exists, so we don't need to recreate it
