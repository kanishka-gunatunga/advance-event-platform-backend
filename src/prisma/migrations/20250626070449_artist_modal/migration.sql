-- CreateTable
CREATE TABLE "ArtistDetails" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "artist_name" TEXT,
    "contact_number" TEXT,
    "country" TEXT,
    "address" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistDetails_user_id_key" ON "ArtistDetails"("user_id");

-- AddForeignKey
ALTER TABLE "ArtistDetails" ADD CONSTRAINT "ArtistDetails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
