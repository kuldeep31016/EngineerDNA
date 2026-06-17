-- CreateEnum
CREATE TYPE "TechCategory" AS ENUM ('LANGUAGE', 'FRAMEWORK', 'DATABASE', 'CLOUD', 'TESTING', 'DEPLOYMENT', 'LIBRARY', 'TOOL', 'AUTH');

-- CreateEnum
CREATE TYPE "EvidenceStrength" AS ENUM ('MENTIONED', 'USED');

-- CreateEnum
CREATE TYPE "EvidenceSource" AS ENUM ('GITHUB_REPO', 'INTERVIEW', 'LEARNING', 'OPEN_SOURCE', 'RESUME');

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "repoCreatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TechEvidence" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "technology" TEXT NOT NULL,
    "category" "TechCategory" NOT NULL,
    "strength" "EvidenceStrength" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" "EvidenceSource" NOT NULL DEFAULT 'GITHUB_REPO',
    "proofs" JSONB NOT NULL DEFAULT '[]',
    "firstSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TechEvidence_userId_technology_idx" ON "TechEvidence"("userId", "technology");

-- CreateIndex
CREATE INDEX "TechEvidence_userId_category_idx" ON "TechEvidence"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "TechEvidence_repositoryId_technology_key" ON "TechEvidence"("repositoryId", "technology");

-- AddForeignKey
ALTER TABLE "TechEvidence" ADD CONSTRAINT "TechEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechEvidence" ADD CONSTRAINT "TechEvidence_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

