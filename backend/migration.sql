-- AlterTable
ALTER TABLE "brands" DROP COLUMN "logo_data",
DROP COLUMN "logo_mime_type",
ADD COLUMN     "logo_url" TEXT;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "image_data",
DROP COLUMN "image_mime_type",
ADD COLUMN     "image_url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "product_icons" DROP COLUMN "icon_data",
DROP COLUMN "icon_mime_type",
ADD COLUMN     "icon_url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "promo_images" DROP COLUMN "image_data",
DROP COLUMN "image_mime_type",
ADD COLUMN     "image_url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "flyers" DROP COLUMN "pdf_data",
DROP COLUMN "pdf_mime_type",
ADD COLUMN     "pdf_url" TEXT;

-- AlterTable
ALTER TABLE "user_flyers" DROP COLUMN "pdf_data",
DROP COLUMN "pdf_mime_type",
ADD COLUMN     "pdf_url" TEXT;

