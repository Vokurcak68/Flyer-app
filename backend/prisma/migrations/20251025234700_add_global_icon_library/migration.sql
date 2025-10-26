-- Drop old product_icons table (will recreate with new structure)
DROP TABLE IF EXISTS "product_icons" CASCADE;

-- Drop old enum
DROP TYPE IF EXISTS "IconType";

-- CreateTable for global icon library
CREATE TABLE "icons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_data" BYTEA NOT NULL,
    "image_mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "icons_pkey" PRIMARY KEY ("id")
);

-- Recreate product_icons table with new structure
CREATE TABLE "product_icons" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "icon_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "product_icons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_icons_product_id_position_key" ON "product_icons"("product_id", "position");

-- AddForeignKey
ALTER TABLE "product_icons" ADD CONSTRAINT "product_icons_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_icons" ADD CONSTRAINT "product_icons_icon_id_fkey" FOREIGN KEY ("icon_id") REFERENCES "icons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
