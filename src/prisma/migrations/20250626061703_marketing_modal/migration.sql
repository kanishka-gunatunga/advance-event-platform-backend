-- CreateTable
CREATE TABLE "MarketingDetails" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "referral_code" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "contact_number" TEXT,
    "country" TEXT,
    "address" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingDetails_user_id_key" ON "MarketingDetails"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingDetails_referral_code_key" ON "MarketingDetails"("referral_code");

-- AddForeignKey
ALTER TABLE "MarketingDetails" ADD CONSTRAINT "MarketingDetails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
