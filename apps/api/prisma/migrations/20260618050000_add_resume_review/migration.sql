-- CreateTable
CREATE TABLE "ResumeReview" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "resumeText" TEXT NOT NULL,
    "atsScore" INTEGER NOT NULL,
    "engineeringScore" INTEGER NOT NULL,
    "report" JSONB NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeReview_userId_key" ON "ResumeReview"("userId");

-- AddForeignKey
ALTER TABLE "ResumeReview" ADD CONSTRAINT "ResumeReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
