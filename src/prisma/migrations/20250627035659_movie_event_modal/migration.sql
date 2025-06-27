/*
  Warnings:

  - You are about to drop the column `artist_details` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `banner_image` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `end_date_time` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `gallery_media` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `organized_by` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `policy` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `start_date_time` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `ticket_details` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the `Artist` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `event_type` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "artist_details",
DROP COLUMN "banner_image",
DROP COLUMN "end_date_time",
DROP COLUMN "gallery_media",
DROP COLUMN "location",
DROP COLUMN "organized_by",
DROP COLUMN "policy",
DROP COLUMN "seats",
DROP COLUMN "start_date_time",
DROP COLUMN "ticket_details",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "event_type" TEXT NOT NULL,
ADD COLUMN     "trailer_links" JSONB,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- DropTable
DROP TABLE "Artist";

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
