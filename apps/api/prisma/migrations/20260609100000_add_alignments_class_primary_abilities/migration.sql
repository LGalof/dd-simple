-- CreateTable
CREATE TABLE "ref_class_primary_abilities" (
    "id" UUID NOT NULL,
    "classIndex" TEXT NOT NULL,
    "abilityScoreIndex" TEXT NOT NULL,
    "sourceJson" JSONB,

    CONSTRAINT "ref_class_primary_abilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_alignments" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_alignments_pkey" PRIMARY KEY ("index")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_class_primary_abilities_classIndex_abilityScoreIndex_key" ON "ref_class_primary_abilities"("classIndex", "abilityScoreIndex");

-- AddForeignKey
ALTER TABLE "ref_class_primary_abilities" ADD CONSTRAINT "ref_class_primary_abilities_classIndex_fkey" FOREIGN KEY ("classIndex") REFERENCES "ref_classes"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_class_primary_abilities" ADD CONSTRAINT "ref_class_primary_abilities_abilityScoreIndex_fkey" FOREIGN KEY ("abilityScoreIndex") REFERENCES "ref_ability_scores"("index") ON DELETE CASCADE ON UPDATE CASCADE;
