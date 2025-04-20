-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Mission" ("created_at", "id", "name", "objective", "state", "status") SELECT "created_at", "id", "name", "objective", "state", "status" FROM "Mission";
DROP TABLE "Mission";
ALTER TABLE "new_Mission" RENAME TO "Mission";
CREATE INDEX "Mission_created_at_idx" ON "Mission"("created_at");
CREATE INDEX "Mission_status_idx" ON "Mission"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
