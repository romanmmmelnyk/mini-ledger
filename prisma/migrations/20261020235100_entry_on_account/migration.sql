DELETE FROM "Entry";
DELETE FROM "Transaction";

ALTER TABLE "Entry" DROP CONSTRAINT "Entry_sender_id_fkey";
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_receiver_id_fkey";

ALTER TABLE "Entry" DROP COLUMN "type",
DROP COLUMN "sender_id",
DROP COLUMN "receiver_id";

ALTER TYPE "EntryType" RENAME TO "TransactionType";

ALTER TABLE "Transaction" ADD COLUMN "type" "TransactionType" NOT NULL;

ALTER TABLE "Entry" ADD COLUMN "account_id" INTEGER NOT NULL;

CREATE INDEX "Entry_account_id_idx" ON "Entry"("account_id");

ALTER TABLE "Entry" ADD CONSTRAINT "Entry_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Account" ALTER COLUMN "user_id" DROP NOT NULL;
