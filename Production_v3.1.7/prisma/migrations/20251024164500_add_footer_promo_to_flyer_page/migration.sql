-- AlterTable
ALTER TABLE "flyer_pages" ADD COLUMN "footer_promo_image_id" TEXT;

-- AddForeignKey
ALTER TABLE "flyer_pages" ADD CONSTRAINT "flyer_pages_footer_promo_image_id_fkey" FOREIGN KEY ("footer_promo_image_id") REFERENCES "promo_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
