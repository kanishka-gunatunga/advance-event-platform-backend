-- AddForeignKey
ALTER TABLE "EventShowtime" ADD CONSTRAINT "EventShowtime_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
