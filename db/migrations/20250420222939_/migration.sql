/*
  Warnings:

  - You are about to drop the column `name` on the `Mission` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "objective" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Mission" ("created_at", "id", "objective", "state", "status", "updated_at") SELECT "created_at", "id", "objective", "state", "status", "updated_at" FROM "Mission";
DROP TABLE "Mission";
ALTER TABLE "new_Mission" RENAME TO "Mission";
CREATE INDEX "Mission_created_at_idx" ON "Mission"("created_at");
CREATE INDEX "Mission_status_idx" ON "Mission"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
