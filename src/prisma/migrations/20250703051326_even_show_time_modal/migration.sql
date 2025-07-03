-- CreateTable
CREATE TABLE "EventShowtime" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "showtime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventShowtime_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventShowtime" ADD CONSTRAINT "EventShowtime_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
