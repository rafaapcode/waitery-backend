-- CreateTable
CREATE TABLE "public"."UserOrg" (
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "UserOrg_pkey" PRIMARY KEY ("org_id","user_id")
);

-- AddForeignKey
ALTER TABLE "public"."UserOrg" ADD CONSTRAINT "UserOrg_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserOrg" ADD CONSTRAINT "UserOrg_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
