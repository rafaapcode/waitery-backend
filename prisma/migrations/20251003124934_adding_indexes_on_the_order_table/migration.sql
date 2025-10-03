/*
  Warnings:

  - You are about to drop the column `updated_at` on the `Order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Order_user_id_org_id_idx";

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "updated_at";

-- CreateIndex
CREATE INDEX "Order_user_id_org_id_created_at_status_idx" ON "public"."Order"("user_id", "org_id", "created_at", "status");
