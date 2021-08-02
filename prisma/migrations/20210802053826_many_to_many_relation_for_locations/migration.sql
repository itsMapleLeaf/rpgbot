/*
  Warnings:

  - You are about to drop the column `locationId` on the `Location` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_LocationToLocation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL
);
INSERT INTO "new_Location" ("description", "id", "name") SELECT "description", "id", "name" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_LocationToLocation_AB_unique" ON "_LocationToLocation"("A", "B");

-- CreateIndex
CREATE INDEX "_LocationToLocation_B_index" ON "_LocationToLocation"("B");
