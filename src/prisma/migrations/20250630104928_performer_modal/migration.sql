-- CreateTable
CREATE TABLE "Performer" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Performer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPerformer" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "performer_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPerformer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Performer" ADD CONSTRAINT "Performer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPerformer" ADD CONSTRAINT "EventPerformer_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPerformer" ADD CONSTRAINT "EventPerformer_performer_id_fkey" FOREIGN KEY ("performer_id") REFERENCES "Performer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
