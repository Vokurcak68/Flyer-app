-- CreateEnum
CREATE TYPE "InstallationType" AS ENUM ('BUILT_IN', 'FREESTANDING');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "installation_type" "InstallationType";
