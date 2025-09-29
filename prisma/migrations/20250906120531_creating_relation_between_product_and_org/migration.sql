-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
