-- CreateTable
CREATE TABLE "GithubAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "scope" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" UUID NOT NULL,
    "githubAccountId" UUID NOT NULL,
    "githubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "htmlUrl" TEXT NOT NULL,
    "defaultBranch" TEXT,
    "pushedAt" TIMESTAMP(3),
    "selectedForAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubAccount_userId_key" ON "GithubAccount"("userId");

-- CreateIndex
CREATE INDEX "Repository_githubAccountId_idx" ON "Repository"("githubAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_githubAccountId_githubId_key" ON "Repository"("githubAccountId", "githubId");

-- AddForeignKey
ALTER TABLE "GithubAccount" ADD CONSTRAINT "GithubAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_githubAccountId_fkey" FOREIGN KEY ("githubAccountId") REFERENCES "GithubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

