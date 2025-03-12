-- AlterTable
ALTER TABLE `Order` ADD COLUMN `wcOrderId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Order_wcOrderId_idx` ON `Order`(`wcOrderId`);
