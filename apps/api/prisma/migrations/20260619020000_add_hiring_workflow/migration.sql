-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'SELECTED');

-- CreateTable Company
CREATE TABLE "Company" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recruiterId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_recruiterId_key" ON "Company"("recruiterId");

ALTER TABLE "Company" ADD CONSTRAINT "Company_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable JobPost
ALTER TABLE "JobPost"
    ADD COLUMN "companyId"        UUID,
    ADD COLUMN "responsibilities" TEXT,
    ADD COLUMN "requirements"     TEXT,
    ADD COLUMN "benefits"         TEXT,
    ADD COLUMN "salaryMin"        INTEGER,
    ADD COLUMN "salaryMax"        INTEGER,
    ADD COLUMN "experience"       TEXT,
    ADD COLUMN "deadline"         TIMESTAMP(3);

CREATE INDEX "JobPost_companyId_idx" ON "JobPost"("companyId");
CREATE INDEX "JobPost_status_idx"    ON "JobPost"("status");

ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable JobApplication
CREATE TABLE "JobApplication" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "jobId"       UUID NOT NULL,
    "studentId"   UUID NOT NULL,
    "coverLetter" TEXT,
    "status"      "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobApplication_jobId_studentId_key" ON "JobApplication"("jobId", "studentId");
CREATE INDEX "JobApplication_studentId_idx" ON "JobApplication"("studentId");
CREATE INDEX "JobApplication_jobId_idx"     ON "JobApplication"("jobId");

ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId"    UUID NOT NULL,
    "title"     TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "read"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
