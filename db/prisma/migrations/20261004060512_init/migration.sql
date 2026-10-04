-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "phase" TEXT NOT NULL DEFAULT 'lobby',
    "quarter" INTEGER NOT NULL DEFAULT 0,
    "totalQuarters" INTEGER NOT NULL,
    "quarterSeconds" INTEGER NOT NULL DEFAULT 0,
    "deadlineAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "llmCalls" INTEGER NOT NULL DEFAULT 0,
    "seed" TEXT NOT NULL,
    "hostPlayerId" TEXT,
    "state" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "seat" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "pending" JSONB NOT NULL DEFAULT '[]',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "memo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lines" JSONB NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarterReport" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "QuarterReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketReport" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "MarketReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_code_key" ON "Game"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Player_gameId_name_key" ON "Player"("gameId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Player_gameId_seat_key" ON "Player"("gameId", "seat");

-- CreateIndex
CREATE INDEX "LedgerEntry_gameId_playerId_quarter_idx" ON "LedgerEntry"("gameId", "playerId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterReport_gameId_quarter_playerId_key" ON "QuarterReport"("gameId", "quarter", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketReport_gameId_quarter_key" ON "MarketReport"("gameId", "quarter");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarterReport" ADD CONSTRAINT "QuarterReport_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketReport" ADD CONSTRAINT "MarketReport_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
