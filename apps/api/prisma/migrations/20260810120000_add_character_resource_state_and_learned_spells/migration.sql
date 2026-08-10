-- AddColumn
ALTER TABLE "character_spellcasting_states"
ADD COLUMN IF NOT EXISTS "learnedSpellIds" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "character_resource_states" (
  "id" UUID NOT NULL,
  "characterId" UUID NOT NULL,
  "usageByResourceKey" JSONB,
  "customMaxByResourceKey" JSONB,
  "activeByResourceKey" JSONB,

  CONSTRAINT "character_resource_states_pkey" PRIMARY KEY ("id")
);

-- Existing deployments may already have this table from runtime SQL. Ensure its
-- columns match the runtime structure without replacing existing rows.
ALTER TABLE "character_resource_states"
ADD COLUMN IF NOT EXISTS "id" UUID;

UPDATE "character_resource_states"
SET "id" = gen_random_uuid()
WHERE "id" IS NULL;

ALTER TABLE "character_resource_states"
ALTER COLUMN "id" SET NOT NULL;

ALTER TABLE "character_resource_states"
ADD COLUMN IF NOT EXISTS "characterId" UUID;

ALTER TABLE "character_resource_states"
ALTER COLUMN "characterId" SET NOT NULL;

ALTER TABLE "character_resource_states"
ADD COLUMN IF NOT EXISTS "usageByResourceKey" JSONB;

ALTER TABLE "character_resource_states"
ADD COLUMN IF NOT EXISTS "customMaxByResourceKey" JSONB;

ALTER TABLE "character_resource_states"
ADD COLUMN IF NOT EXISTS "activeByResourceKey" JSONB;

-- CreatePrimaryKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.character_resource_states'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE "character_resource_states"
    ADD CONSTRAINT "character_resource_states_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "character_resource_states_characterId_key"
ON "character_resource_states"("characterId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.character_resource_states'::regclass
      AND conname = 'character_resource_states_characterId_fkey'
  ) THEN
    ALTER TABLE "character_resource_states"
    ADD CONSTRAINT "character_resource_states_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "characters"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
