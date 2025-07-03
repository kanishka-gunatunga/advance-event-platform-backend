-- CreateTable
CREATE TABLE "Seats" (
    "id" SERIAL NOT NULL,
    "venue_id" INTEGER NOT NULL,
    "seat_svg_id" TEXT NOT NULL,
    "seat_no_to_display" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatAllocations" (
    "id" SERIAL NOT NULL,
    "seat_id" INTEGER NOT NULL,
    "showtime_id" INTEGER NOT NULL,
    "ticket_type_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatAllocations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Seats" ADD CONSTRAINT "Seats_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAllocations" ADD CONSTRAINT "SeatAllocations_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "Seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAllocations" ADD CONSTRAINT "SeatAllocations_showtime_id_fkey" FOREIGN KEY ("showtime_id") REFERENCES "EventShowtime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
