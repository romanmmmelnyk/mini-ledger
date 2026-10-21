/*
  Warnings:

  - You are about to alter the column `rate` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(20,12)`.

*/
-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "rate" SET DEFAULT 1,
ALTER COLUMN "rate" SET DATA TYPE DECIMAL(20,12);
