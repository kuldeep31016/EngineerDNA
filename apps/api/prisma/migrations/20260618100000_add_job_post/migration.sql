-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'INTERNSHIP', 'CONTRACT', 'PART_TIME');

-- CreateEnum
CREATE TYPE "JobWorkMode" AS ENUM ('ONSITE', 'REMOTE', 'HYBRID');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "JobPost" (
    "id" UUID NOT NULL,
    "recruiterId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "location" TEXT,
    "type" "JobType" NOT NULL DEFAULT 'FULL_TIME',
    "workMode" "JobWorkMode" NOT NULL DEFAULT 'ONSITE',
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobPost_recruiterId_idx" ON "JobPost"("recruiterId");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
