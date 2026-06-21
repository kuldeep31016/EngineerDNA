-- CreateTable
CREATE TABLE "RecruiterNote" (
    "id" UUID NOT NULL,
    "recruiterId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "body" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecruiterNote_recruiterId_idx" ON "RecruiterNote"("recruiterId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterNote_recruiterId_candidateId_key" ON "RecruiterNote"("recruiterId", "candidateId");

-- AddForeignKey
ALTER TABLE "RecruiterNote" ADD CONSTRAINT "RecruiterNote_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterNote" ADD CONSTRAINT "RecruiterNote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
