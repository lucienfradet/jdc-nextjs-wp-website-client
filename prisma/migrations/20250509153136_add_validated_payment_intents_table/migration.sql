-- CreateTable
CREATE TABLE `ValidatedPaymentIntent` (
    `id` VARCHAR(191) NOT NULL,
    `paymentIntentId` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `validatedData` TEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ValidatedPaymentIntent_paymentIntentId_key`(`paymentIntentId`),
    INDEX `ValidatedPaymentIntent_paymentIntentId_idx`(`paymentIntentId`),
    INDEX `ValidatedPaymentIntent_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
