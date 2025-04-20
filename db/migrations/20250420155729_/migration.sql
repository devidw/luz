-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT ''
);

-- CreateIndex
CREATE INDEX "Mission_created_at_idx" ON "Mission"("created_at");

-- CreateIndex
CREATE INDEX "Mission_status_idx" ON "Mission"("status");
