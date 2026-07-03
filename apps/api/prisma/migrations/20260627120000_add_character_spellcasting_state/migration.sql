CREATE TABLE "character_spellcasting_states" (
  "id" UUID NOT NULL,
  "characterId" UUID NOT NULL,
  "preparedSpellIds" JSONB,
  "slotUsageByLevel" JSONB,

  CONSTRAINT "character_spellcasting_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "character_spellcasting_states_characterId_key"
ON "character_spellcasting_states"("characterId");

ALTER TABLE "character_spellcasting_states"
ADD CONSTRAINT "character_spellcasting_states_characterId_fkey"
FOREIGN KEY ("characterId") REFERENCES "characters"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
