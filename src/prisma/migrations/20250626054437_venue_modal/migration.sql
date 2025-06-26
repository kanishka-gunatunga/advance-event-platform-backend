-- CreateTable
CREATE TABLE "VenueDetails" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "venue_name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "contact_number" TEXT,
    "country" TEXT,
    "address" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VenueDetails_user_id_key" ON "VenueDetails"("user_id");

-- AddForeignKey
ALTER TABLE "VenueDetails" ADD CONSTRAINT "VenueDetails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
