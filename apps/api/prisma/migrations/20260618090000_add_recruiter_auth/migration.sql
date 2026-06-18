-- AlterEnum
ALTER TYPE "AuthProvider" ADD VALUE 'CREDENTIALS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;

-- CreateTable
CREATE TABLE "RecruiterProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterProfile_userId_key" ON "RecruiterProfile"("userId");

-- AddForeignKey
ALTER TABLE "RecruiterProfile" ADD CONSTRAINT "RecruiterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
