/*
  Warnings:

  - The values [action] on the enum `TaskActivityLogField` will be removed. If these variants are still used in the database, this will fail.
  - The `field` column on the `TaskActivityLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `action` on the `TaskActivityLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskActivityLogField_new" AS ENUM ('title', 'status');
ALTER TABLE "TaskActivityLog" ALTER COLUMN "field" TYPE "TaskActivityLogField_new" USING ("field"::text::"TaskActivityLogField_new");
ALTER TYPE "TaskActivityLogField" RENAME TO "TaskActivityLogField_old";
ALTER TYPE "TaskActivityLogField_new" RENAME TO "TaskActivityLogField";
DROP TYPE "public"."TaskActivityLogField_old";
COMMIT;

-- AlterTable
ALTER TABLE "TaskActivityLog" DROP COLUMN "action",
ADD COLUMN     "action" "TaskActivityLogAction" NOT NULL,
DROP COLUMN "field",
ADD COLUMN     "field" "TaskActivityLogField";
