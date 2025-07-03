-- CreateTable
CREATE TABLE "EventVenue" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "venue_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventVenue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventVenue" ADD CONSTRAINT "EventVenue_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVenue" ADD CONSTRAINT "EventVenue_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
