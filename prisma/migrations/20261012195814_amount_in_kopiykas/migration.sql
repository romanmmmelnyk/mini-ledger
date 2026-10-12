/*
  Warnings:

  - You are about to alter the column `amount` on the `Entry` table. The data in that column could be lost. The data in that column will be cast from `Decimal(19,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Entry"
ALTER COLUMN "amount" SET DATA TYPE INTEGER
USING ROUND("amount" * 100)::INTEGER;
