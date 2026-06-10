CREATE TABLE "ref_languages" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_languages_pkey" PRIMARY KEY ("index")
);

CREATE TABLE "character_languages" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "languageIndex" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceIndex" TEXT,

    CONSTRAINT "character_languages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "character_languages_characterId_languageIndex_sourceType_sourceIndex_key"
    ON "character_languages"("characterId", "languageIndex", "sourceType", "sourceIndex");

ALTER TABLE "character_languages"
    ADD CONSTRAINT "character_languages_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "character_languages"
    ADD CONSTRAINT "character_languages_languageIndex_fkey"
    FOREIGN KEY ("languageIndex") REFERENCES "ref_languages"("index") ON DELETE RESTRICT ON UPDATE CASCADE;
