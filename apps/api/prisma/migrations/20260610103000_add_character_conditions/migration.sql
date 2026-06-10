CREATE TABLE "ref_conditions" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_conditions_pkey" PRIMARY KEY ("index")
);

CREATE TABLE "character_conditions" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "conditionIndex" TEXT NOT NULL,
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_conditions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "character_conditions_characterId_conditionIndex_key"
    ON "character_conditions"("characterId", "conditionIndex");

ALTER TABLE "character_conditions"
    ADD CONSTRAINT "character_conditions_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "character_conditions"
    ADD CONSTRAINT "character_conditions_conditionIndex_fkey"
    FOREIGN KEY ("conditionIndex") REFERENCES "ref_conditions"("index") ON DELETE RESTRICT ON UPDATE CASCADE;
