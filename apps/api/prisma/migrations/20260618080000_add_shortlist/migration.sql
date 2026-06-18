-- CreateTable
CREATE TABLE "Shortlist" (
    "id" UUID NOT NULL,
    "recruiterId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shortlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shortlist_recruiterId_idx" ON "Shortlist"("recruiterId");

-- CreateIndex
CREATE UNIQUE INDEX "Shortlist_recruiterId_candidateId_key" ON "Shortlist"("recruiterId", "candidateId");

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
