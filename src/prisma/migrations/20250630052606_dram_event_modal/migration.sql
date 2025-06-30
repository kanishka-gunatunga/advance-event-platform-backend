-- CreateTable
CREATE TABLE "EventArtist" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "artist_id" INTEGER,
    "artist_name_manual" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventArtist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventArtist" ADD CONSTRAINT "EventArtist_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventArtist" ADD CONSTRAINT "EventArtist_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
