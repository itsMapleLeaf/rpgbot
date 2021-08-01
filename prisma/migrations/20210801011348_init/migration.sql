-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordUserId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Player.discordUserId_unique" ON "Player"("discordUserId");
