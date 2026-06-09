-- CreateTable
CREATE TABLE "ref_class_proficiency_grants" (
    "id" UUID NOT NULL,
    "classIndex" TEXT NOT NULL,
    "proficiencyIndex" TEXT NOT NULL,
    "grantType" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_class_proficiency_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_class_skill_choices" (
    "id" UUID NOT NULL,
    "classIndex" TEXT NOT NULL,
    "chooseCount" INTEGER NOT NULL,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_class_skill_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_class_skill_choice_options" (
    "id" UUID NOT NULL,
    "choiceId" UUID NOT NULL,
    "proficiencyIndex" TEXT NOT NULL,
    "skillIndex" TEXT,

    CONSTRAINT "ref_class_skill_choice_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_class_proficiency_grants_classIndex_proficiencyIndex_grantType_key" ON "ref_class_proficiency_grants"("classIndex", "proficiencyIndex", "grantType");

-- CreateIndex
CREATE UNIQUE INDEX "ref_class_skill_choice_options_choiceId_proficiencyIndex_key" ON "ref_class_skill_choice_options"("choiceId", "proficiencyIndex");

-- AddForeignKey
ALTER TABLE "ref_class_proficiency_grants" ADD CONSTRAINT "ref_class_proficiency_grants_classIndex_fkey" FOREIGN KEY ("classIndex") REFERENCES "ref_classes"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_class_proficiency_grants" ADD CONSTRAINT "ref_class_proficiency_grants_proficiencyIndex_fkey" FOREIGN KEY ("proficiencyIndex") REFERENCES "ref_proficiencies"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_class_skill_choices" ADD CONSTRAINT "ref_class_skill_choices_classIndex_fkey" FOREIGN KEY ("classIndex") REFERENCES "ref_classes"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_class_skill_choice_options" ADD CONSTRAINT "ref_class_skill_choice_options_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "ref_class_skill_choices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_class_skill_choice_options" ADD CONSTRAINT "ref_class_skill_choice_options_proficiencyIndex_fkey" FOREIGN KEY ("proficiencyIndex") REFERENCES "ref_proficiencies"("index") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_class_skill_choice_options" ADD CONSTRAINT "ref_class_skill_choice_options_skillIndex_fkey" FOREIGN KEY ("skillIndex") REFERENCES "ref_skills"("index") ON DELETE SET NULL ON UPDATE CASCADE;
