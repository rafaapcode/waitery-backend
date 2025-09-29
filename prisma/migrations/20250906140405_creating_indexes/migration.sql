-- CreateIndex
CREATE INDEX "Category_org_id_idx" ON "public"."Category"("org_id");

-- CreateIndex
CREATE INDEX "Ingredient_name_idx" ON "public"."Ingredient"("name");

-- CreateIndex
CREATE INDEX "Order_user_id_org_id_idx" ON "public"."Order"("user_id", "org_id");

-- CreateIndex
CREATE INDEX "Organization_owner_id_cep_name_idx" ON "public"."Organization"("owner_id", "cep", "name");

-- CreateIndex
CREATE INDEX "Product_org_id_name_idx" ON "public"."Product"("org_id", "name");
