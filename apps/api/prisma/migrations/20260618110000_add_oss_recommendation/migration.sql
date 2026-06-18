-- CreateTable
CREATE TABLE "OssRecommendation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skillsHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OssRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OssRecommendation_userId_key" ON "OssRecommendation"("userId");

-- AddForeignKey
ALTER TABLE "OssRecommendation" ADD CONSTRAINT "OssRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
