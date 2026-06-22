DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relname = 'character_languages_characterId_languageIndex_sourceType_source'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relname = 'character_languages_characterId_languageIndex_sourceType_so_key'
    ) THEN
        ALTER INDEX "character_languages_characterId_languageIndex_sourceType_source"
            RENAME TO "character_languages_characterId_languageIndex_sourceType_so_key";
    END IF;
END $$;

-- RenameIndex
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relname = 'ref_background_ability_options_backgroundIndex_abilityScoreInde'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relname = 'ref_background_ability_options_backgroundIndex_abilityScore_key'
    ) THEN
        ALTER INDEX "ref_background_ability_options_backgroundIndex_abilityScoreInde"
            RENAME TO "ref_background_ability_options_backgroundIndex_abilityScore_key";
    END IF;
END $$;

-- RenameIndex
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relname = 'ref_background_proficiency_grants_backgroundIndex_proficiencyIn'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relname = 'ref_background_proficiency_grants_backgroundIndex_proficien_key'
    ) THEN
        ALTER INDEX "ref_background_proficiency_grants_backgroundIndex_proficiencyIn"
            RENAME TO "ref_background_proficiency_grants_backgroundIndex_proficien_key";
    END IF;
END $$;

-- RenameIndex
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relname = 'ref_class_proficiency_grants_classIndex_proficiencyIndex_grantT'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relname = 'ref_class_proficiency_grants_classIndex_proficiencyIndex_gr_key'
    ) THEN
        ALTER INDEX "ref_class_proficiency_grants_classIndex_proficiencyIndex_grantT"
            RENAME TO "ref_class_proficiency_grants_classIndex_proficiencyIndex_gr_key";
    END IF;
END $$;
