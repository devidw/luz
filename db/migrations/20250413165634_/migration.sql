-- CreateIndex
CREATE INDEX "Msg_created_at_idx" ON "Msg"("created_at");

-- CreateIndex
CREATE INDEX "Msg_role_idx" ON "Msg"("role");

-- CreateIndex
CREATE INDEX "Msg_persona_idx" ON "Msg"("persona");

-- CreateIndex
CREATE INDEX "Msg_flags_idx" ON "Msg"("flags");
