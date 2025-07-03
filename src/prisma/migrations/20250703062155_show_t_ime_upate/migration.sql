/*
  Warnings:

  - You are about to drop the column `showtime` on the `EventShowtime` table. All the data in the column will be lost.
  - Added the required column `showtime_date` to the `EventShowtime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `showtime_time` to the `EventShowtime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venue_id` to the `EventShowtime` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventShowtime" DROP COLUMN "showtime",
ADD COLUMN     "showtime_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "showtime_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "venue_id" INTEGER NOT NULL;
