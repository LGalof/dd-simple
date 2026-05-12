-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "speciesIndex" TEXT NOT NULL,
    "classIndex" TEXT NOT NULL,
    "backgroundIndex" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experiencePoints" INTEGER NOT NULL DEFAULT 0,
    "alignment" TEXT,
    "maxHp" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "armorClass" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_ability_scores" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_ability_scores_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "ref_skills" (
    "index" TEXT NOT NULL,
    "abilityIndex" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_skills_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "ref_species" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT,
    "baseSpeed" INTEGER NOT NULL,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_species_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "ref_classes" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hitDie" INTEGER NOT NULL,
    "sourceJson" JSONB,

    CONSTRAINT "ref_classes_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "ref_backgrounds" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_backgrounds_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "ref_proficiencies" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceJson" JSONB,

    CONSTRAINT "ref_proficiencies_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "ref_equipment" (
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipmentCategory" TEXT,
    "itemType" TEXT,
    "costQuantity" INTEGER,
    "costUnit" TEXT,
    "weight" DECIMAL(65,30),
    "description" TEXT,
    "sourceJson" JSONB,

    CONSTRAINT "ref_equipment_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "character_ability_scores" (
    "characterId" UUID NOT NULL,
    "abilityIndex" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "character_ability_scores_pkey" PRIMARY KEY ("characterId","abilityIndex")
);

-- CreateTable
CREATE TABLE "character_skills" (
    "characterId" UUID NOT NULL,
    "skillIndex" TEXT NOT NULL,
    "isProficient" BOOLEAN NOT NULL DEFAULT false,
    "customBonus" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "character_skills_pkey" PRIMARY KEY ("characterId","skillIndex")
);

-- CreateTable
CREATE TABLE "character_proficiencies" (
    "characterId" UUID NOT NULL,
    "proficiencyIndex" TEXT NOT NULL,
    "sourceType" TEXT,

    CONSTRAINT "character_proficiencies_pkey" PRIMARY KEY ("characterId","proficiencyIndex")
);

-- CreateTable
CREATE TABLE "character_inventory" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "equipmentIndex" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "gridX" INTEGER,
    "gridY" INTEGER,
    "customName" TEXT,
    "notes" TEXT,

    CONSTRAINT "character_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_choices" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "choiceType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceIndex" TEXT NOT NULL,
    "selectedType" TEXT NOT NULL,
    "selectedIndex" TEXT NOT NULL,

    CONSTRAINT "character_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dice_rolls" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "rolledByUserId" UUID NOT NULL,
    "rollType" TEXT NOT NULL,
    "targetType" TEXT,
    "targetIndex" TEXT,
    "formula" TEXT NOT NULL,
    "rollMode" TEXT NOT NULL DEFAULT 'normal',
    "rollValues" JSONB NOT NULL,
    "modifier" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "reason" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "rolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dice_rolls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "characters_userId_name_key" ON "characters"("userId", "name");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_speciesIndex_fkey" FOREIGN KEY ("speciesIndex") REFERENCES "ref_species"("index") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_classIndex_fkey" FOREIGN KEY ("classIndex") REFERENCES "ref_classes"("index") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_backgroundIndex_fkey" FOREIGN KEY ("backgroundIndex") REFERENCES "ref_backgrounds"("index") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_skills" ADD CONSTRAINT "ref_skills_abilityIndex_fkey" FOREIGN KEY ("abilityIndex") REFERENCES "ref_ability_scores"("index") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_ability_scores" ADD CONSTRAINT "character_ability_scores_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_ability_scores" ADD CONSTRAINT "character_ability_scores_abilityIndex_fkey" FOREIGN KEY ("abilityIndex") REFERENCES "ref_ability_scores"("index") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_skillIndex_fkey" FOREIGN KEY ("skillIndex") REFERENCES "ref_skills"("index") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_proficiencies" ADD CONSTRAINT "character_proficiencies_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_proficiencies" ADD CONSTRAINT "character_proficiencies_proficiencyIndex_fkey" FOREIGN KEY ("proficiencyIndex") REFERENCES "ref_proficiencies"("index") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_inventory" ADD CONSTRAINT "character_inventory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_inventory" ADD CONSTRAINT "character_inventory_equipmentIndex_fkey" FOREIGN KEY ("equipmentIndex") REFERENCES "ref_equipment"("index") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_choices" ADD CONSTRAINT "character_choices_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dice_rolls" ADD CONSTRAINT "dice_rolls_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dice_rolls" ADD CONSTRAINT "dice_rolls_rolledByUserId_fkey" FOREIGN KEY ("rolledByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
