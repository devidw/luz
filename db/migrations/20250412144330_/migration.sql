-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Msg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "persona" TEXT NOT NULL DEFAULT 'general'
);
INSERT INTO "new_Msg" ("content", "created_at", "id", "role") SELECT "content", "created_at", "id", "role" FROM "Msg";
DROP TABLE "Msg";
ALTER TABLE "new_Msg" RENAME TO "Msg";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
