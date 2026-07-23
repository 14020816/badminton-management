-- CreateEnum
CREATE TYPE "MemberGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('AB_PAIRS', 'ROUND_ROBIN');

-- CreateEnum
CREATE TYPE "MatchCategory" AS ENUM ('MENS_SINGLES', 'WOMENS_SINGLES', 'MENS_DOUBLES', 'WOMENS_DOUBLES', 'MIXED_DOUBLES');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'WALKOVER');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "gender" "MemberGender";

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "config" JSONB,
ADD COLUMN     "format" "TournamentFormat",
ADD COLUMN     "scheduleGeneratedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "round" INTEGER,
    "groupLabel" TEXT,
    "category" "MatchCategory" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeMemberId" TEXT,
    "awayMemberId" TEXT,
    "homeMember2Id" TEXT,
    "awayMember2Id" TEXT,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatchSet" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,

    CONSTRAINT "TournamentMatchSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentMatch_tournamentId_order_idx" ON "TournamentMatch"("tournamentId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatchSet_matchId_setNumber_key" ON "TournamentMatchSet"("matchId", "setNumber");

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_homeMemberId_fkey" FOREIGN KEY ("homeMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_awayMemberId_fkey" FOREIGN KEY ("awayMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_homeMember2Id_fkey" FOREIGN KEY ("homeMember2Id") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_awayMember2Id_fkey" FOREIGN KEY ("awayMember2Id") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchSet" ADD CONSTRAINT "TournamentMatchSet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
