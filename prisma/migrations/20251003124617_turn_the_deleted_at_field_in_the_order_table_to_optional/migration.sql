-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "deleted_at" DROP NOT NULL,
ALTER COLUMN "deleted_at" DROP DEFAULT;
