-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('member', 'author', 'admin');

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'member';
