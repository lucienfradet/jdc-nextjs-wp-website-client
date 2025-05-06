-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `bookingDate` VARCHAR(191) NULL,
    ADD COLUMN `bookingPeople` INTEGER NULL,
    ADD COLUMN `bookingTimeSlot` VARCHAR(191) NULL,
    ADD COLUMN `isBooking` BOOLEAN NOT NULL DEFAULT false;
