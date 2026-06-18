-- CreateTable
CREATE TABLE "character_inventory_states" (
    "characterId" UUID NOT NULL,
    "stateCode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_inventory_states_pkey" PRIMARY KEY ("characterId")
);

-- AddForeignKey
ALTER TABLE "character_inventory_states" ADD CONSTRAINT "character_inventory_states_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
