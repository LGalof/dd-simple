ALTER TABLE "dice_rolls" ADD COLUMN "roomId" UUID;

CREATE INDEX "dice_rolls_roomId_visibility_rolledAt_idx" ON "dice_rolls"("roomId", "visibility", "rolledAt");

ALTER TABLE "dice_rolls" ADD CONSTRAINT "dice_rolls_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
