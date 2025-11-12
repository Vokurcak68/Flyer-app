-- ================================================================================
-- FLYER APP v3.1.6 - DATABASE MIGRATIONS
-- ================================================================================
-- This file contains all database migrations required for v3.1.6
-- Execute BEFORE deploying the new version!
--
-- Migrations included:
-- 1. 20251110101500_rename_is_built_in_to_requires_installation_type
-- 2. 20251110102000_add_installation_type_to_product
-- 3. 20251110120000_add_use_brand_color_to_icons
-- ================================================================================

-- Migration 1: Rename column in categories table
-- Renames is_built_in → requires_installation_type
ALTER TABLE "categories" RENAME COLUMN "is_built_in" TO "requires_installation_type";

-- Migration 2: Create ENUM and add column to products
-- Creates InstallationType ENUM (BUILT_IN, FREESTANDING)
-- Adds installation_type column to products table
CREATE TYPE "InstallationType" AS ENUM ('BUILT_IN', 'FREESTANDING');
ALTER TABLE "products" ADD COLUMN "installation_type" "InstallationType";

-- Migration 3: Add use_brand_color to icons
-- Adds boolean flag for displaying icons with brand color background
ALTER TABLE "icons" ADD COLUMN "use_brand_color" BOOLEAN NOT NULL DEFAULT false;

-- ================================================================================
-- END OF MIGRATIONS
-- ================================================================================
