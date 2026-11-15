/*
  Warnings:

  - You are about to drop the column `dueMinor` on the `StoreSettlement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "serviceFeeMinor" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "serviceFeeMinor" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StoreSettlement" DROP COLUMN "dueMinor";
