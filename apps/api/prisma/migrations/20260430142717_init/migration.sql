-- CreateEnum
CREATE TYPE "FeatureSectionType" AS ENUM ('INFO', 'CHOICE', 'TEXT_INPUT', 'MULTI_CHOICE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "avatarUrl" TEXT,
    "speciesId" UUID,
    "backgroundId" UUID,
    "classId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterAbilityScores" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "dexterity" INTEGER NOT NULL DEFAULT 10,
    "constitution" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "wisdom" INTEGER NOT NULL DEFAULT 10,
    "charisma" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "CharacterAbilityScores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSheetStats" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "maxHp" INTEGER NOT NULL DEFAULT 10,
    "currentHp" INTEGER NOT NULL DEFAULT 10,
    "temporaryHp" INTEGER NOT NULL DEFAULT 0,
    "armorClass" INTEGER NOT NULL DEFAULT 10,
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "speed" INTEGER NOT NULL DEFAULT 30,
    "proficiencyBonus" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "CharacterSheetStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassDefinition" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ClassDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesDefinition" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "speed" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "SpeciesDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundDefinition" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "BackgroundDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassFeatureDefinition" (
    "id" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "levelRequirement" INTEGER NOT NULL DEFAULT 1,
    "sectionType" "FeatureSectionType" NOT NULL DEFAULT 'INFO',
    "requiresInput" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClassFeatureDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterFeatureSelection" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "selectedValue" TEXT,
    "customValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterFeatureSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterAbilityScores_characterId_key" ON "CharacterAbilityScores"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSheetStats_characterId_key" ON "CharacterSheetStats"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassDefinition_name_key" ON "ClassDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesDefinition_name_key" ON "SpeciesDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundDefinition_name_key" ON "BackgroundDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterFeatureSelection_characterId_featureId_key" ON "CharacterFeatureSelection"("characterId", "featureId");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "SpeciesDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_backgroundId_fkey" FOREIGN KEY ("backgroundId") REFERENCES "BackgroundDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterAbilityScores" ADD CONSTRAINT "CharacterAbilityScores_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSheetStats" ADD CONSTRAINT "CharacterSheetStats_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassFeatureDefinition" ADD CONSTRAINT "ClassFeatureDefinition_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeatureSelection" ADD CONSTRAINT "CharacterFeatureSelection_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeatureSelection" ADD CONSTRAINT "CharacterFeatureSelection_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "ClassFeatureDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
