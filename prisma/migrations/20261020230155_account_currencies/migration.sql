-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('STANDARD', 'SAVING', 'STUDENT', 'BUSINESS');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "type" "AccountType" NOT NULL,
    "currency_code" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "code" CHAR(3) NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("code")
);

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
