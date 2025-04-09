/*
  Warnings:

  - The primary key for the `Msg` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Msg` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Msg" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL
);
INSERT INTO "new_Msg" ("content", "created_at", "id", "role") SELECT "content", "created_at", "id", "role" FROM "Msg";
DROP TABLE "Msg";
ALTER TABLE "new_Msg" RENAME TO "Msg";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
