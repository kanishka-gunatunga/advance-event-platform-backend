-- CreateTable
CREATE TABLE "EventInstructor" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "instructor_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventInstructor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventInstructor" ADD CONSTRAINT "EventInstructor_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInstructor" ADD CONSTRAINT "EventInstructor_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
