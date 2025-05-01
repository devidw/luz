/*
  Warnings:

  - You are about to drop the column `persona` on the `Msg` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Msg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "flags" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Msg" ("content", "created_at", "flags", "id", "role") SELECT "content", "created_at", "flags", "id", "role" FROM "Msg";
DROP TABLE "Msg";
ALTER TABLE "new_Msg" RENAME TO "Msg";
CREATE INDEX "Msg_created_at_idx" ON "Msg"("created_at");
CREATE INDEX "Msg_role_idx" ON "Msg"("role");
CREATE INDEX "Msg_flags_idx" ON "Msg"("flags");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
