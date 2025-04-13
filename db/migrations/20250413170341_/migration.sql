-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Msg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "persona" TEXT NOT NULL DEFAULT 'general',
    "flags" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Msg" ("content", "created_at", "flags", "id", "persona", "role") SELECT "content", "created_at", coalesce("flags", '') AS "flags", "id", "persona", "role" FROM "Msg";
DROP TABLE "Msg";
ALTER TABLE "new_Msg" RENAME TO "Msg";
CREATE INDEX "Msg_created_at_idx" ON "Msg"("created_at");
CREATE INDEX "Msg_role_idx" ON "Msg"("role");
CREATE INDEX "Msg_persona_idx" ON "Msg"("persona");
CREATE INDEX "Msg_flags_idx" ON "Msg"("flags");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
