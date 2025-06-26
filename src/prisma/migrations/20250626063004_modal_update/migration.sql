/*
  Warnings:

  - You are about to drop the column `first_name` on the `OrganizationDetails` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `OrganizationDetails` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `VenueDetails` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `VenueDetails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrganizationDetails" DROP COLUMN "first_name",
DROP COLUMN "last_name";

-- AlterTable
ALTER TABLE "VenueDetails" DROP COLUMN "first_name",
DROP COLUMN "last_name";
