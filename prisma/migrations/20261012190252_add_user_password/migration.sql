-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '1234';

-- Existing rows keep 1234. New rows must set a password explicitly.
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;
