-- CreateTable
CREATE TABLE "OrganizationDetails" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "organization_name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "contact_number" TEXT,
    "country" TEXT,
    "address" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationDetails_user_id_key" ON "OrganizationDetails"("user_id");

-- AddForeignKey
ALTER TABLE "OrganizationDetails" ADD CONSTRAINT "OrganizationDetails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
