CREATE TABLE "character_feature_choice_selections" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceIndex" TEXT NOT NULL,
    "classIndex" TEXT,
    "subclassIndex" TEXT,
    "level" INTEGER,
    "featureIndex" TEXT,
    "choicePath" TEXT NOT NULL,
    "choiceKey" TEXT,
    "choiceLabel" TEXT,
    "selectedOptionType" TEXT NOT NULL,
    "selectedOptionIndex" TEXT,
    "selectedOptionName" TEXT,
    "selectedOptionUrl" TEXT,
    "selectedRawJson" JSONB NOT NULL,
    "grantsRawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_feature_choice_selections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "character_feature_choice_selections_characterId_sourceType_sourceIndex_choicePath_key"
    ON "character_feature_choice_selections"("characterId", "sourceType", "sourceIndex", "choicePath");

ALTER TABLE "character_feature_choice_selections"
    ADD CONSTRAINT "character_feature_choice_selections_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
