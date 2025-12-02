-- DropForeignKey
ALTER TABLE "UserOrg" DROP CONSTRAINT "UserOrg_user_id_fkey";

-- AddForeignKey
ALTER TABLE "UserOrg" ADD CONSTRAINT "UserOrg_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
