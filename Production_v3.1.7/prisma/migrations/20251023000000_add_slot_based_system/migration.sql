-- AlterTable promo_images - remove size_type column FIRST (before dropping enum)
ALTER TABLE "promo_images" DROP COLUMN IF EXISTS "size_type";

-- AlterTable flyer_pages - remove layout_type and promo_image_id columns FIRST
ALTER TABLE "flyer_pages" DROP COLUMN IF EXISTS "layout_type";
ALTER TABLE "flyer_pages" DROP COLUMN IF EXISTS "promo_image_id";

-- DropTable flyer_page_products (replaced by slots) - drop BEFORE creating new enums
DROP TABLE IF EXISTS "flyer_page_products";

-- DropEnum PromoSize (no longer needed) - drop AFTER removing dependent columns
DROP TYPE IF EXISTS "PromoSize";

-- DropEnum LayoutType (no longer needed) - drop AFTER removing dependent columns
DROP TYPE IF EXISTS "LayoutType";

-- CreateEnum for SlotType
CREATE TYPE "SlotType" AS ENUM ('product', 'promo', 'empty');

-- CreateEnum for PromoSlotSize
CREATE TYPE "PromoSlotSize" AS ENUM ('single', 'horizontal', 'square', 'full_page');

-- CreateTable for FlyerPageSlot
CREATE TABLE "flyer_page_slots" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "slot_position" INTEGER NOT NULL,
    "slot_type" "SlotType" NOT NULL,
    "product_id" TEXT,
    "promo_image_id" TEXT,
    "promo_size" "PromoSlotSize",
    "is_promo_anchor" BOOLEAN NOT NULL DEFAULT false,
    "promo_anchor_id" TEXT,

    CONSTRAINT "flyer_page_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flyer_page_slots_page_id_slot_position_key" ON "flyer_page_slots"("page_id", "slot_position");

-- AddForeignKey
ALTER TABLE "flyer_page_slots" ADD CONSTRAINT "flyer_page_slots_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "flyer_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_page_slots" ADD CONSTRAINT "flyer_page_slots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_page_slots" ADD CONSTRAINT "flyer_page_slots_promo_image_id_fkey" FOREIGN KEY ("promo_image_id") REFERENCES "promo_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_page_slots" ADD CONSTRAINT "flyer_page_slots_promo_anchor_id_fkey" FOREIGN KEY ("promo_anchor_id") REFERENCES "flyer_page_slots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
