-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('supplier', 'approver', 'end_user');

-- CreateEnum
CREATE TYPE "IconType" AS ENUM ('energy_class', 'feature');

-- CreateEnum
CREATE TYPE "PromoSize" AS ENUM ('full', 'half', 'quarter', 'eighth');

-- CreateEnum
CREATE TYPE "FlyerStatus" AS ENUM ('draft', 'pending_verification', 'pending_approval', 'approved', 'rejected', 'active', 'expired');

-- CreateEnum
CREATE TYPE "LayoutType" AS ENUM ('products_8', 'products_4', 'products_2', 'products_1', 'promo_8', 'promo_4', 'promo_2', 'promo_1');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('success', 'failed');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "FlyerActionType" AS ENUM ('add_product', 'remove_product', 'add_page', 'remove_page', 'update_info', 'reorder');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_brands" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "ean_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "original_price" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_icons" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "icon_type" "IconType" NOT NULL,
    "icon_url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "product_icons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_images" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "brand_id" TEXT,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "size_type" "PromoSize" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flyers" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "valid_from" DATE,
    "valid_to" DATE,
    "status" "FlyerStatus" NOT NULL,
    "is_draft" BOOLEAN NOT NULL DEFAULT true,
    "rejection_reason" TEXT,
    "pdf_url" TEXT,
    "last_edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auto_save_version" INTEGER NOT NULL DEFAULT 1,
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "flyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flyer_pages" (
    "id" TEXT NOT NULL,
    "flyer_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "layout_type" "LayoutType" NOT NULL,
    "promo_image_id" TEXT,

    CONSTRAINT "flyer_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flyer_page_products" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "flyer_page_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_logs" (
    "id" TEXT NOT NULL,
    "flyer_id" TEXT NOT NULL,
    "verification_date" TIMESTAMP(3) NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "flyer_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "comment" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflow" (
    "id" TEXT NOT NULL,
    "flyer_id" TEXT NOT NULL,
    "required_approvers" INTEGER NOT NULL DEFAULT 2,
    "current_approvals" INTEGER NOT NULL DEFAULT 0,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flyer_versions" (
    "id" TEXT NOT NULL,
    "flyer_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot_data" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "change_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flyer_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flyer_edit_history" (
    "id" TEXT NOT NULL,
    "flyer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" "FlyerActionType" NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flyer_edit_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_flyers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_draft" BOOLEAN NOT NULL DEFAULT true,
    "last_edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_flyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_flyer_pages" (
    "id" TEXT NOT NULL,
    "user_flyer_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,

    CONSTRAINT "user_flyer_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_flyer_page_products" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "user_flyer_page_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_ean_code_key" ON "products"("ean_code");

-- CreateIndex
CREATE INDEX "products_ean_code_idx" ON "products"("ean_code");

-- CreateIndex
CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_icons_product_id_position_key" ON "product_icons"("product_id", "position");

-- CreateIndex
CREATE INDEX "flyers_status_idx" ON "flyers"("status");

-- CreateIndex
CREATE INDEX "flyers_valid_from_valid_to_idx" ON "flyers"("valid_from", "valid_to");

-- CreateIndex
CREATE INDEX "flyers_supplier_id_idx" ON "flyers"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "flyer_pages_flyer_id_page_number_key" ON "flyer_pages"("flyer_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "flyer_page_products_page_id_position_key" ON "flyer_page_products"("page_id", "position");

-- CreateIndex
CREATE INDEX "approvals_flyer_id_status_idx" ON "approvals"("flyer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_flyer_id_approver_id_key" ON "approvals"("flyer_id", "approver_id");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflow_flyer_id_key" ON "approval_workflow"("flyer_id");

-- CreateIndex
CREATE INDEX "flyer_versions_flyer_id_created_at_idx" ON "flyer_versions"("flyer_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "flyer_versions_flyer_id_version_number_key" ON "flyer_versions"("flyer_id", "version_number");

-- CreateIndex
CREATE INDEX "flyer_edit_history_flyer_id_created_at_idx" ON "flyer_edit_history"("flyer_id", "created_at");

-- CreateIndex
CREATE INDEX "user_flyers_user_id_idx" ON "user_flyers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_flyer_pages_user_flyer_id_page_number_key" ON "user_flyer_pages"("user_flyer_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_flyer_page_products_page_id_position_key" ON "user_flyer_page_products"("page_id", "position");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_action_idx" ON "audit_logs"("user_id", "action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_icons" ADD CONSTRAINT "product_icons_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_images" ADD CONSTRAINT "promo_images_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyers" ADD CONSTRAINT "flyers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_pages" ADD CONSTRAINT "flyer_pages_flyer_id_fkey" FOREIGN KEY ("flyer_id") REFERENCES "flyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_pages" ADD CONSTRAINT "flyer_pages_promo_image_id_fkey" FOREIGN KEY ("promo_image_id") REFERENCES "promo_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_page_products" ADD CONSTRAINT "flyer_page_products_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "flyer_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_page_products" ADD CONSTRAINT "flyer_page_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_flyer_id_fkey" FOREIGN KEY ("flyer_id") REFERENCES "flyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_flyer_id_fkey" FOREIGN KEY ("flyer_id") REFERENCES "flyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow" ADD CONSTRAINT "approval_workflow_flyer_id_fkey" FOREIGN KEY ("flyer_id") REFERENCES "flyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_versions" ADD CONSTRAINT "flyer_versions_flyer_id_fkey" FOREIGN KEY ("flyer_id") REFERENCES "flyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_edit_history" ADD CONSTRAINT "flyer_edit_history_flyer_id_fkey" FOREIGN KEY ("flyer_id") REFERENCES "flyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flyers" ADD CONSTRAINT "user_flyers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flyer_pages" ADD CONSTRAINT "user_flyer_pages_user_flyer_id_fkey" FOREIGN KEY ("user_flyer_id") REFERENCES "user_flyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flyer_page_products" ADD CONSTRAINT "user_flyer_page_products_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "user_flyer_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flyer_page_products" ADD CONSTRAINT "user_flyer_page_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
