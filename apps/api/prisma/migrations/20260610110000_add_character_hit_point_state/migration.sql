CREATE TABLE "character_hit_point_states" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "calculationMode" TEXT NOT NULL DEFAULT 'fixed',
    "bonusHp" INTEGER NOT NULL DEFAULT 0,
    "overrideMaxHp" INTEGER,
    "rolledHitPoints" JSONB,
    "tempHp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "character_hit_point_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "character_hit_point_states_characterId_key"
    ON "character_hit_point_states"("characterId");

ALTER TABLE "character_hit_point_states"
    ADD CONSTRAINT "character_hit_point_states_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
