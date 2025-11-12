-- CreateTable
CREATE TABLE "icon_categories" (
    "id" TEXT NOT NULL,
    "icon_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "icon_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icon_brands" (
    "id" TEXT NOT NULL,
    "icon_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "icon_brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "icon_categories_icon_id_category_id_key" ON "icon_categories"("icon_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "icon_brands_icon_id_brand_id_key" ON "icon_brands"("icon_id", "brand_id");

-- AddForeignKey
ALTER TABLE "icon_categories" ADD CONSTRAINT "icon_categories_icon_id_fkey" FOREIGN KEY ("icon_id") REFERENCES "icons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icon_categories" ADD CONSTRAINT "icon_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icon_brands" ADD CONSTRAINT "icon_brands_icon_id_fkey" FOREIGN KEY ("icon_id") REFERENCES "icons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icon_brands" ADD CONSTRAINT "icon_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
