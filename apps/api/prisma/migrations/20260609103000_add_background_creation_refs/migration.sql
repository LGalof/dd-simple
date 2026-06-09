-- CreateTable
CREATE TABLE "ref_background_proficiency_grants" (
    "id" UUID NOT NULL,
    "backgroundIndex" TEXT NOT NULL,
    "proficiencyIndex" TEXT NOT NULL,
    "grantType" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_background_proficiency_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_background_ability_options" (
    "id" UUID NOT NULL,
    "backgroundIndex" TEXT NOT NULL,
    "abilityScoreIndex" TEXT NOT NULL,
    "bonusValue" INTEGER,
    "sourceJson" JSONB,

    CONSTRAINT "ref_background_ability_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_background_feat_grants" (
    "id" UUID NOT NULL,
    "backgroundIndex" TEXT NOT NULL,
    "featIndex" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_background_feat_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_background_proficiency_grants_backgroundIndex_proficiencyIndex_grantType_key" ON "ref_background_proficiency_grants"("backgroundIndex", "proficiencyIndex", "grantType");

-- CreateIndex
CREATE UNIQUE INDEX "ref_background_ability_options_backgroundIndex_abilityScoreIndex_key" ON "ref_background_ability_options"("backgroundIndex", "abilityScoreIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ref_background_feat_grants_backgroundIndex_featIndex_key" ON "ref_background_feat_grants"("backgroundIndex", "featIndex");

-- AddForeignKey
ALTER TABLE "ref_background_proficiency_grants" ADD CONSTRAINT "ref_background_proficiency_grants_backgroundIndex_fkey" FOREIGN KEY ("backgroundIndex") REFERENCES "ref_backgrounds"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_background_proficiency_grants" ADD CONSTRAINT "ref_background_proficiency_grants_proficiencyIndex_fkey" FOREIGN KEY ("proficiencyIndex") REFERENCES "ref_proficiencies"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_background_ability_options" ADD CONSTRAINT "ref_background_ability_options_backgroundIndex_fkey" FOREIGN KEY ("backgroundIndex") REFERENCES "ref_backgrounds"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_background_ability_options" ADD CONSTRAINT "ref_background_ability_options_abilityScoreIndex_fkey" FOREIGN KEY ("abilityScoreIndex") REFERENCES "ref_ability_scores"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_background_feat_grants" ADD CONSTRAINT "ref_background_feat_grants_backgroundIndex_fkey" FOREIGN KEY ("backgroundIndex") REFERENCES "ref_backgrounds"("index") ON DELETE CASCADE ON UPDATE CASCADE;
