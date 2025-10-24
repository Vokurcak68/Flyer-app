-- Migration: Store images in database as binary data
-- This migration converts all image URL fields to binary data (BYTEA) with MIME type

-- AlterTable: brands - convert logo_url to logo_data + logo_mime_type
ALTER TABLE "brands"
  DROP COLUMN IF EXISTS "logo_url",
  ADD COLUMN IF NOT EXISTS "logo_data" BYTEA,
  ADD COLUMN IF NOT EXISTS "logo_mime_type" TEXT;

-- AlterTable: products - convert image_url to image_data + image_mime_type
ALTER TABLE "products"
  DROP COLUMN IF EXISTS "image_url",
  ADD COLUMN IF NOT EXISTS "image_data" BYTEA NOT NULL DEFAULT E'\\x'::bytea,
  ADD COLUMN IF NOT EXISTS "image_mime_type" TEXT NOT NULL DEFAULT 'image/jpeg';

-- Remove default values after adding columns
ALTER TABLE "products"
  ALTER COLUMN "image_data" DROP DEFAULT,
  ALTER COLUMN "image_mime_type" DROP DEFAULT;

-- AlterTable: product_icons - convert icon_url to icon_data + icon_mime_type
ALTER TABLE "product_icons"
  DROP COLUMN IF EXISTS "icon_url",
  ADD COLUMN IF NOT EXISTS "icon_data" BYTEA NOT NULL DEFAULT E'\\x'::bytea,
  ADD COLUMN IF NOT EXISTS "icon_mime_type" TEXT NOT NULL DEFAULT 'image/png';

-- Remove default values after adding columns
ALTER TABLE "product_icons"
  ALTER COLUMN "icon_data" DROP DEFAULT,
  ALTER COLUMN "icon_mime_type" DROP DEFAULT;

-- AlterTable: promo_images - convert image_url to image_data + image_mime_type
ALTER TABLE "promo_images"
  DROP COLUMN IF EXISTS "image_url",
  ADD COLUMN IF NOT EXISTS "image_data" BYTEA NOT NULL DEFAULT E'\\x'::bytea,
  ADD COLUMN IF NOT EXISTS "image_mime_type" TEXT NOT NULL DEFAULT 'image/jpeg';

-- Remove default values after adding columns
ALTER TABLE "promo_images"
  ALTER COLUMN "image_data" DROP DEFAULT,
  ALTER COLUMN "image_mime_type" DROP DEFAULT;

-- AlterTable: flyers - convert pdf_url to pdf_data + pdf_mime_type
ALTER TABLE "flyers"
  DROP COLUMN IF EXISTS "pdf_url",
  ADD COLUMN IF NOT EXISTS "pdf_data" BYTEA,
  ADD COLUMN IF NOT EXISTS "pdf_mime_type" TEXT;

-- AlterTable: user_flyers - convert pdf_url to pdf_data + pdf_mime_type
ALTER TABLE "user_flyers"
  DROP COLUMN IF EXISTS "pdf_url",
  ADD COLUMN IF NOT EXISTS "pdf_data" BYTEA,
  ADD COLUMN IF NOT EXISTS "pdf_mime_type" TEXT;
