-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
