/*
  Warnings:

  - You are about to drop the `ProductOrder` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `products` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductOrder" DROP CONSTRAINT "ProductOrder_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductOrder" DROP CONSTRAINT "ProductOrder_product_id_fkey";

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "products" JSONB NOT NULL;

-- DropTable
DROP TABLE "public"."ProductOrder";
