-- AlterEnum: richer ATS pipeline states
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'SCREENING';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'INTERVIEW_SCHEDULED';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'OFFER_SENT';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'OFFER_ACCEPTED';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'HIRED';

-- CreateEnum
CREATE TYPE "InterviewScheduleStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'DECLINED');
CREATE TYPE "OfferStatus" AS ENUM ('SENT', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterviewSchedule" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "meetingLink" TEXT,
    "notes" TEXT,
    "status" "InterviewScheduleStatus" NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterviewSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Offer" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "salary" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3),
    "employmentType" TEXT NOT NULL,
    "message" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "ApplicationEvent_applicationId_idx" ON "ApplicationEvent"("applicationId");
CREATE UNIQUE INDEX "InterviewSchedule_applicationId_key" ON "InterviewSchedule"("applicationId");
CREATE UNIQUE INDEX "Offer_applicationId_key" ON "Offer"("applicationId");

-- FKs
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewSchedule" ADD CONSTRAINT "InterviewSchedule_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
