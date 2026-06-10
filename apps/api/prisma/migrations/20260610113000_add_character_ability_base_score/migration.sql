ALTER TABLE "character_ability_scores"
    ADD COLUMN "baseScore" INTEGER;

UPDATE "character_ability_scores"
    SET "baseScore" = "score"
    WHERE "baseScore" IS NULL;
