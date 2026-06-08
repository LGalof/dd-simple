/// <reference types="node" />

import { Prisma, PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

type AnyRecord = Record<string, any>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "seed-data", "5e", "mixed");

const FILES = {
  abilityScores: "5e-SRD-Ability-Scores.json",
  alignments: "5e-SRD-Alignments.json",
  skills: "5e-SRD-Skills.json",
  species: "5e-SRD-Species.json",
  classes: "5e-SRD-Classes.json",
  levels: "5e-SRD-Levels.json",
  features: "5e-SRD-Features.json",
  backgrounds: "5e-SRD-Backgrounds.json",
  proficiencies: "5e-SRD-Proficiencies.json",
  equipment: "5e-SRD-Equipment.json",
};

function assertSeedDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(
      `Seed data folder ne obstaja: ${DATA_DIR}\n` +
        "Najprej kopiraj 5e JSON datoteke v apps/api/prisma/seed-data/5e/2024",
    );
  }
}

function readJsonArray(fileName: string): AnyRecord[] {
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Manjka JSON datoteka: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`JSON datoteka ni array: ${filePath}`);
  }

  return parsed;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function intOrDefault(value: unknown, fallback: number): number {
  const parsed = numberOrNull(value);
  return parsed === null ? fallback : Math.trunc(parsed);
}

function toDescription(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (Array.isArray(value)) {
      const parts = value
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            return item.name ?? item.index ?? JSON.stringify(item);
          }
          return String(item);
        })
        .filter((item) => item.trim().length > 0);

      if (parts.length > 0) {
        return parts.join("\n");
      }
    }
  }

  return null;
}

function descriptionParts(value: unknown): string[] {
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function sourceJson(value: AnyRecord): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function indexFromRef(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as AnyRecord;
    return stringOrNull(record.index) ?? stringOrNull(record.name);
  }

  return null;
}

function getItemIndex(item: AnyRecord): string | null {
  return stringOrNull(item.index) ?? (stringOrNull(item.name) ? slugify(String(item.name)) : null);
}

function categoryFromFileName(fileName: string): string {
  return fileName
    .replace(/^5e-SRD-/, "")
    .replace(/\.json$/, "")
    .toLowerCase();
}

function firstEquipmentCategory(item: AnyRecord): string | null {
  return (
    indexFromRef(item.equipment_category) ??
    indexFromRef(item.equipmentCategory) ??
    indexFromRef(item.equipment_categories?.[0]) ??
    indexFromRef(item.equipmentCategories?.[0]) ??
    null
  );
}

function equipmentItemType(item: AnyRecord): string | null {
  return (
    indexFromRef(item.gear_category) ??
    indexFromRef(item.gearCategory) ??
    stringOrNull(item.weapon_category) ??
    stringOrNull(item.weaponCategory) ??
    stringOrNull(item.armor_category) ??
    stringOrNull(item.armorCategory) ??
    indexFromRef(item.tool_category) ??
    indexFromRef(item.toolCategory) ??
    indexFromRef(item.equipment_categories?.[1]) ??
    null
  );
}

function skillIndexFromProficiencyIndex(index: string): string | null {
  return index.startsWith("skill-") ? index.replace(/^skill-/, "") : null;
}

function isSkillProficiencyReference(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as AnyRecord;
  const index = stringOrNull(record.index);
  const name = stringOrNull(record.name);

  return Boolean(index?.startsWith("skill-") || name?.startsWith("Skill: "));
}

function choiceOptions(choice: AnyRecord): AnyRecord[] {
  const options = choice.from?.options;

  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => (option && typeof option === "object" ? (option as AnyRecord).item : null))
    .filter((item): item is AnyRecord => Boolean(item && typeof item === "object"));
}

function primaryAbilityReferences(cls: AnyRecord): AnyRecord[] {
  const primaryAbility = cls.primary_ability ?? cls.primaryAbility;

  if (!primaryAbility || typeof primaryAbility !== "object") {
    return [];
  }

  const primaryAbilityRecord = primaryAbility as AnyRecord;
  const abilityScores = primaryAbilityRecord.ability_scores ?? primaryAbilityRecord.abilityScores;

  if (Array.isArray(abilityScores)) {
    return abilityScores.filter((item): item is AnyRecord => Boolean(item && typeof item === "object"));
  }

  const options = primaryAbilityRecord.ability_score_options?.from?.options;

  if (Array.isArray(options)) {
    return options
      .map((option) => (option && typeof option === "object" ? (option as AnyRecord).item : null))
      .filter((item): item is AnyRecord => Boolean(item && typeof item === "object"));
  }

  return [];
}

function proficiencyGrantType(proficiency: AnyRecord | null, fallbackIndex: string, fallbackLabel: string | null) {
  const type = stringOrNull(proficiency?.type)?.toLowerCase() ?? "";
  const index = fallbackIndex.toLowerCase();
  const label = (fallbackLabel ?? stringOrNull(proficiency?.name) ?? "").toLowerCase();

  if (index.startsWith("saving-throw-") || label.startsWith("saving throw")) {
    return "SAVING_THROW";
  }

  if (type.includes("armor") || label.includes("armor") || index.includes("armor") || index === "shields") {
    return "ARMOR";
  }

  if (type.includes("weapon") || label.includes("weapon") || index.includes("weapon")) {
    return "WEAPON";
  }

  if (type.includes("tool") || label.includes("tool") || label.includes("instrument") || index.includes("kit")) {
    return "TOOL";
  }

  return "OTHER";
}

async function seedGenericRuleDocuments() {
  console.log("Seeding all 5e JSON documents into RefRuleDocument...");

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  for (const file of files) {
    const category = categoryFromFileName(file);
    const items = readJsonArray(file);

    for (const item of items) {
      const index = getItemIndex(item);

      if (!index) {
        console.warn(`Skipping item without index/name in ${file}`);
        continue;
      }

      await prisma.refRuleDocument.upsert({
        where: {
          category_index: {
            category,
            index,
          },
        },
        update: {
          name: stringOrNull(item.name),
          sourceJson: sourceJson(item),
        },
        create: {
          category,
          index,
          name: stringOrNull(item.name),
          sourceJson: sourceJson(item),
        },
      });
    }

    console.log(`  ${category}: ${items.length} records`);
  }
}

async function seedAbilityScores() {
  console.log("Seeding RefAbilityScore...");

  const abilityScores = readJsonArray(FILES.abilityScores);

  for (const ability of abilityScores) {
    const index = getItemIndex(ability);

    if (!index) {
      console.warn("Skipping ability score without index/name", ability);
      continue;
    }

    const name = stringOrNull(ability.name) ?? index.toUpperCase();
    const fullName =
      stringOrNull(ability.full_name) ??
      stringOrNull(ability.fullName) ??
      stringOrNull(ability.name) ??
      index;

    await prisma.refAbilityScore.upsert({
      where: {
        index,
      },
      update: {
        name,
        fullName,
        description: toDescription(ability.description, ability.desc),
        sourceJson: sourceJson(ability),
      },
      create: {
        index,
        name,
        fullName,
        description: toDescription(ability.description, ability.desc),
        sourceJson: sourceJson(ability),
      },
    });
  }
}

async function seedAlignments() {
  console.log("Seeding RefAlignment...");

  const alignments = readJsonArray(FILES.alignments);

  for (const alignment of alignments) {
    const index = getItemIndex(alignment);

    if (!index) {
      console.warn("Skipping alignment without index/name", alignment);
      continue;
    }

    await prisma.refAlignment.upsert({
      where: {
        index,
      },
      update: {
        name: stringOrNull(alignment.name) ?? index,
        abbreviation: stringOrNull(alignment.abbreviation) ?? stringOrNull(alignment.shortName),
        description: toDescription(alignment.description, alignment.desc),
        sourceJson: sourceJson(alignment),
      },
      create: {
        index,
        name: stringOrNull(alignment.name) ?? index,
        abbreviation: stringOrNull(alignment.abbreviation) ?? stringOrNull(alignment.shortName),
        description: toDescription(alignment.description, alignment.desc),
        sourceJson: sourceJson(alignment),
      },
    });
  }
}

async function seedSkills() {
  console.log("Seeding RefSkill...");

  const skills = readJsonArray(FILES.skills);

  for (const skill of skills) {
    const index = getItemIndex(skill);

    if (!index) {
      console.warn("Skipping skill without index/name", skill);
      continue;
    }

    const abilityIndex =
      indexFromRef(skill.ability_score) ??
      indexFromRef(skill.abilityScore) ??
      stringOrNull(skill.abilityIndex);

    if (!abilityIndex) {
      console.warn(`Skipping skill without ability score: ${index}`);
      continue;
    }

    const abilityExists = await prisma.refAbilityScore.findUnique({
      where: {
        index: abilityIndex,
      },
      select: {
        index: true,
      },
    });

    if (!abilityExists) {
      console.warn(`Skipping skill ${index}, because ability ${abilityIndex} does not exist.`);
      continue;
    }

    await prisma.refSkill.upsert({
      where: {
        index,
      },
      update: {
        abilityIndex,
        name: stringOrNull(skill.name) ?? index,
        description: toDescription(skill.description, skill.desc),
        sourceJson: sourceJson(skill),
      },
      create: {
        index,
        abilityIndex,
        name: stringOrNull(skill.name) ?? index,
        description: toDescription(skill.description, skill.desc),
        sourceJson: sourceJson(skill),
      },
    });
  }
}

async function seedSpecies() {
  console.log("Seeding RefSpecies...");

  const speciesList = readJsonArray(FILES.species);

  for (const species of speciesList) {
    const index = getItemIndex(species);

    if (!index) {
      console.warn("Skipping species without index/name", species);
      continue;
    }

    await prisma.refSpecies.upsert({
      where: {
        index,
      },
      update: {
        name: stringOrNull(species.name) ?? index,
        size: stringOrNull(species.size),
        baseSpeed: intOrDefault(species.speed ?? species.baseSpeed ?? species.base_speed, 30),
        description: toDescription(species.description, species.desc),
        sourceJson: sourceJson(species),
      },
      create: {
        index,
        name: stringOrNull(species.name) ?? index,
        size: stringOrNull(species.size),
        baseSpeed: intOrDefault(species.speed ?? species.baseSpeed ?? species.base_speed, 30),
        description: toDescription(species.description, species.desc),
        sourceJson: sourceJson(species),
      },
    });
  }
}

async function seedClasses() {
  console.log("Seeding RefClass...");

  const classes = readJsonArray(FILES.classes);

  for (const cls of classes) {
    const index = getItemIndex(cls);

    if (!index) {
      console.warn("Skipping class without index/name", cls);
      continue;
    }

    await prisma.refClass.upsert({
      where: {
        index,
      },
      update: {
        name: stringOrNull(cls.name) ?? index,
        hitDie: intOrDefault(cls.hit_die ?? cls.hitDie, 8),
        sourceJson: sourceJson(cls),
      },
      create: {
        index,
        name: stringOrNull(cls.name) ?? index,
        hitDie: intOrDefault(cls.hit_die ?? cls.hitDie, 8),
        sourceJson: sourceJson(cls),
      },
    });
  }
}

async function seedClassLevels() {
  console.log("Seeding RefClassLevel...");

  const levels = readJsonArray(FILES.levels);

  for (const level of levels) {
    const classIndex = indexFromRef(level.class);
    const levelNumber = numberOrNull(level.level);

    if (!classIndex || levelNumber === null) {
      console.warn("Skipping class level without class/level", level);
      continue;
    }

    if (level.subclass) {
      continue;
    }

    const classExists = await prisma.refClass.findUnique({
      where: {
        index: classIndex,
      },
      select: {
        index: true,
      },
    });

    if (!classExists) {
      console.warn(`Skipping class level ${classIndex}:${levelNumber}, because class does not exist.`);
      continue;
    }

    await prisma.refClassLevel.upsert({
      where: {
        classIndex_level: {
          classIndex,
          level: Math.trunc(levelNumber),
        },
      },
      update: {
        sourceJson: sourceJson(level),
      },
      create: {
        classIndex,
        level: Math.trunc(levelNumber),
        sourceJson: sourceJson(level),
      },
    });
  }
}

async function seedClassFeatures() {
  console.log("Seeding RefClassFeature...");

  const features = readJsonArray(FILES.features);

  for (const feature of features) {
    const index = getItemIndex(feature);
    const classIndex = indexFromRef(feature.class);
    const level = numberOrNull(feature.level);

    if (!index || !classIndex || level === null) {
      console.warn("Skipping class feature without index/class/level", feature);
      continue;
    }

    const classExists = await prisma.refClass.findUnique({
      where: {
        index: classIndex,
      },
      select: {
        index: true,
      },
    });

    if (!classExists) {
      console.warn(`Skipping class feature ${index}, because class ${classIndex} does not exist.`);
      continue;
    }

    const descriptions = descriptionParts(feature.desc ?? feature.description);
    const details = descriptions.slice(1);

    await prisma.refClassFeature.upsert({
      where: {
        index,
      },
      update: {
        name: stringOrNull(feature.name) ?? index,
        classIndex,
        level: Math.trunc(level),
        description: descriptions[0] ?? null,
        details: jsonValue(details),
        sourceJson: sourceJson(feature),
      },
      create: {
        index,
        name: stringOrNull(feature.name) ?? index,
        classIndex,
        level: Math.trunc(level),
        description: descriptions[0] ?? null,
        details: jsonValue(details),
        sourceJson: sourceJson(feature),
      },
    });
  }
}

async function seedClassPrimaryAbilities() {
  console.log("Seeding RefClassPrimaryAbility...");

  const classes = readJsonArray(FILES.classes);
  const abilityScores = await prisma.refAbilityScore.findMany({
    select: {
      index: true,
    },
  });
  const abilityScoreIndexes = new Set(abilityScores.map((abilityScore) => abilityScore.index));

  await prisma.refClassPrimaryAbility.deleteMany();

  for (const cls of classes) {
    const classIndex = getItemIndex(cls);

    if (!classIndex) {
      console.warn("Skipping class primary ability without class index", cls);
      continue;
    }

    const classExists = await prisma.refClass.findUnique({
      where: {
        index: classIndex,
      },
      select: {
        index: true,
      },
    });

    if (!classExists) {
      console.warn(`Skipping class primary ability for ${classIndex}, because class does not exist.`);
      continue;
    }

    for (const abilityReference of primaryAbilityReferences(cls)) {
      const abilityScoreIndex = indexFromRef(abilityReference);

      if (!abilityScoreIndex || !abilityScoreIndexes.has(abilityScoreIndex)) {
        console.warn(`Skipping class primary ability ${classIndex}:${abilityScoreIndex ?? "unknown"}, because ability score does not exist.`);
        continue;
      }

      await prisma.refClassPrimaryAbility.create({
        data: {
          classIndex,
          abilityScoreIndex,
          sourceJson: sourceJson(abilityReference),
        },
      });
    }
  }
}

async function seedBackgrounds() {
  console.log("Seeding RefBackground...");

  const backgrounds = readJsonArray(FILES.backgrounds);

  for (const background of backgrounds) {
    const index = getItemIndex(background);

    if (!index) {
      console.warn("Skipping background without index/name", background);
      continue;
    }

    await prisma.refBackground.upsert({
      where: {
        index,
      },
      update: {
        name: stringOrNull(background.name) ?? index,
        description: toDescription(background.description, background.desc),
        sourceJson: sourceJson(background),
      },
      create: {
        index,
        name: stringOrNull(background.name) ?? index,
        description: toDescription(background.description, background.desc),
        sourceJson: sourceJson(background),
      },
    });
  }
}

async function seedProficiencies() {
  console.log("Seeding RefProficiency...");

  const proficiencies = readJsonArray(FILES.proficiencies);

  for (const proficiency of proficiencies) {
    const index = getItemIndex(proficiency);

    if (!index) {
      console.warn("Skipping proficiency without index/name", proficiency);
      continue;
    }

    const type =
      stringOrNull(proficiency.type) ??
      stringOrNull(proficiency.proficiency_type) ??
      stringOrNull(proficiency.proficiencyType) ??
      indexFromRef(proficiency.category) ??
      indexFromRef(proficiency.reference) ??
      "unknown";

    await prisma.refProficiency.upsert({
      where: {
        index,
      },
      update: {
        name: stringOrNull(proficiency.name) ?? index,
        type,
        sourceJson: sourceJson(proficiency),
      },
      create: {
        index,
        name: stringOrNull(proficiency.name) ?? index,
        type,
        sourceJson: sourceJson(proficiency),
      },
    });
  }
}

async function seedClassProficiencyData() {
  console.log("Seeding class proficiency grants and skill choices...");

  const classes = readJsonArray(FILES.classes);
  const proficiencies = await prisma.refProficiency.findMany();
  const proficiencyByIndex = new Map(proficiencies.map((proficiency) => [proficiency.index, proficiency]));
  const skills = await prisma.refSkill.findMany({
    select: {
      index: true,
    },
  });
  const skillIndexes = new Set(skills.map((skill) => skill.index));

  await prisma.refClassSkillChoice.deleteMany();

  for (const cls of classes) {
    const classIndex = getItemIndex(cls);

    if (!classIndex) {
      console.warn("Skipping class proficiency data without class index", cls);
      continue;
    }

    const classExists = await prisma.refClass.findUnique({
      where: {
        index: classIndex,
      },
      select: {
        index: true,
      },
    });

    if (!classExists) {
      console.warn(`Skipping class proficiency data for ${classIndex}, because class does not exist.`);
      continue;
    }

    const grantReferences = new Map<string, AnyRecord>();

    if (Array.isArray(cls.proficiencies)) {
      for (const proficiency of cls.proficiencies) {
        const proficiencyIndex = indexFromRef(proficiency);

        if (proficiencyIndex) {
          grantReferences.set(proficiencyIndex, proficiency);
        }
      }
    }

    if (Array.isArray(cls.saving_throws)) {
      for (const savingThrow of cls.saving_throws) {
        const abilityIndex = indexFromRef(savingThrow);

        if (abilityIndex) {
          const proficiencyIndex = `saving-throw-${abilityIndex}`;
          grantReferences.set(proficiencyIndex, {
            index: proficiencyIndex,
            name: `Saving Throw: ${stringOrNull((savingThrow as AnyRecord).name) ?? abilityIndex.toUpperCase()}`,
          });
        }
      }
    }

    for (const [proficiencyIndex, grantReference] of grantReferences) {
      const proficiency = proficiencyByIndex.get(proficiencyIndex) ?? null;

      if (!proficiency) {
        console.warn(`Skipping class grant ${classIndex}:${proficiencyIndex}, because proficiency does not exist.`);
        continue;
      }

      const sourceLabel = stringOrNull(grantReference.name) ?? proficiency.name;
      const grantType = proficiencyGrantType(proficiency, proficiencyIndex, sourceLabel);

      await prisma.refClassProficiencyGrant.upsert({
        where: {
          classIndex_proficiencyIndex_grantType: {
            classIndex,
            proficiencyIndex,
            grantType,
          },
        },
        update: {
          sourceLabel,
          sourceJson: sourceJson(grantReference),
        },
        create: {
          classIndex,
          proficiencyIndex,
          grantType,
          sourceLabel,
          sourceJson: sourceJson(grantReference),
        },
      });
    }

    if (!Array.isArray(cls.proficiency_choices)) {
      continue;
    }

    for (const choice of cls.proficiency_choices) {
      if (!choice || typeof choice !== "object") {
        continue;
      }

      const choiceRecord = choice as AnyRecord;
      const options = choiceOptions(choiceRecord);
      const skillOptions = options.filter(isSkillProficiencyReference);

      if (skillOptions.length === 0 || skillOptions.length !== options.length) {
        continue;
      }

      const createdChoice = await prisma.refClassSkillChoice.create({
        data: {
          classIndex,
          chooseCount: intOrDefault(choiceRecord.choose, 0),
          description: stringOrNull(choiceRecord.desc),
          sourceJson: sourceJson(choiceRecord),
        },
      });

      for (const option of skillOptions) {
        const proficiencyIndex = indexFromRef(option);

        if (!proficiencyIndex || !proficiencyByIndex.has(proficiencyIndex)) {
          console.warn(`Skipping class skill choice option ${classIndex}:${proficiencyIndex ?? "unknown"}, because proficiency does not exist.`);
          continue;
        }

        const skillIndex = skillIndexFromProficiencyIndex(proficiencyIndex);

        await prisma.refClassSkillChoiceOption.create({
          data: {
            choiceId: createdChoice.id,
            proficiencyIndex,
            skillIndex: skillIndex && skillIndexes.has(skillIndex) ? skillIndex : null,
          },
        });
      }
    }
  }
}

async function seedEquipment() {
  console.log("Seeding RefEquipment...");

  const equipment = readJsonArray(FILES.equipment);

  for (const item of equipment) {
    const index = getItemIndex(item);

    if (!index) {
      console.warn("Skipping equipment without index/name", item);
      continue;
    }

    await prisma.refEquipment.upsert({
      where: {
        index,
      },
      update: {
        name: stringOrNull(item.name) ?? index,
        equipmentCategory: firstEquipmentCategory(item),
        itemType: equipmentItemType(item),
        costQuantity: numberOrNull(item.cost?.quantity),
        costUnit: stringOrNull(item.cost?.unit),
        weight: numberOrNull(item.weight),
        description: toDescription(item.description, item.desc),
        sourceJson: sourceJson(item),
      },
      create: {
        index,
        name: stringOrNull(item.name) ?? index,
        equipmentCategory: firstEquipmentCategory(item),
        itemType: equipmentItemType(item),
        costQuantity: numberOrNull(item.cost?.quantity),
        costUnit: stringOrNull(item.cost?.unit),
        weight: numberOrNull(item.weight),
        description: toDescription(item.description, item.desc),
        sourceJson: sourceJson(item),
      },
    });
  }
}

async function ensureMinimumDemoReferences() {
  console.log("Ensuring minimum demo references...");

  const abilityScores = [
    {
      index: "str",
      name: "STR",
      fullName: "Strength",
      description: "Physical power.",
    },
    {
      index: "dex",
      name: "DEX",
      fullName: "Dexterity",
      description: "Agility, reflexes, and balance.",
    },
    {
      index: "con",
      name: "CON",
      fullName: "Constitution",
      description: "Health and stamina.",
    },
    {
      index: "int",
      name: "INT",
      fullName: "Intelligence",
      description: "Reasoning and memory.",
    },
    {
      index: "wis",
      name: "WIS",
      fullName: "Wisdom",
      description: "Perception and insight.",
    },
    {
      index: "cha",
      name: "CHA",
      fullName: "Charisma",
      description: "Force of personality.",
    },
  ];

  for (const ability of abilityScores) {
    await prisma.refAbilityScore.upsert({
      where: {
        index: ability.index,
      },
      update: {},
      create: ability,
    });
  }

  const skills = [
    {
      index: "acrobatics",
      abilityIndex: "dex",
      name: "Acrobatics",
    },
    {
      index: "stealth",
      abilityIndex: "dex",
      name: "Stealth",
    },
    {
      index: "perception",
      abilityIndex: "wis",
      name: "Perception",
    },
    {
      index: "intimidation",
      abilityIndex: "cha",
      name: "Intimidation",
    },
    {
      index: "investigation",
      abilityIndex: "int",
      name: "Investigation",
    },
    {
      index: "athletics",
      abilityIndex: "str",
      name: "Athletics",
    },
  ];

  for (const skill of skills) {
    await prisma.refSkill.upsert({
      where: {
        index: skill.index,
      },
      update: {},
      create: skill,
    });
  }

  await prisma.refSpecies.upsert({
    where: {
      index: "human",
    },
    update: {},
    create: {
      index: "human",
      name: "Human",
      size: "Medium",
      baseSpeed: 30,
      description: "Versatile and ambitious people.",
    },
  });

  await prisma.refClass.upsert({
    where: {
      index: "rogue",
    },
    update: {},
    create: {
      index: "rogue",
      name: "Rogue",
      hitDie: 8,
    },
  });

  await prisma.refBackground.upsert({
    where: {
      index: "criminal",
    },
    update: {},
    create: {
      index: "criminal",
      name: "Criminal",
      description: "A character with experience in crime, stealth, and deception.",
    },
  });

  const proficiencies = [
    {
      index: "skill-acrobatics",
      name: "Acrobatics",
      type: "skill",
    },
    {
      index: "skill-stealth",
      name: "Stealth",
      type: "skill",
    },
    {
      index: "skill-perception",
      name: "Perception",
      type: "skill",
    },
    {
      index: "skill-intimidation",
      name: "Intimidation",
      type: "skill",
    },
    {
      index: "thieves-tools",
      name: "Thieves' Tools",
      type: "tool",
    },
    {
      index: "light-armor",
      name: "Light Armor",
      type: "armor",
    },
    {
      index: "simple-weapons",
      name: "Simple Weapons",
      type: "weapon",
    },
  ];

  for (const proficiency of proficiencies) {
    await prisma.refProficiency.upsert({
      where: {
        index: proficiency.index,
      },
      update: {},
      create: proficiency,
    });
  }

  const equipment = [
    {
      index: "dagger",
      name: "Dagger",
      equipmentCategory: "weapon",
      itemType: "simple-melee-weapon",
      costQuantity: 2,
      costUnit: "gp",
      weight: 1,
      description: "A small blade useful for melee or throwing.",
    },
    {
      index: "shortbow",
      name: "Shortbow",
      equipmentCategory: "weapon",
      itemType: "simple-ranged-weapon",
      costQuantity: 25,
      costUnit: "gp",
      weight: 2,
      description: "A ranged weapon using arrows.",
    },
    {
      index: "leather-armor",
      name: "Leather Armor",
      equipmentCategory: "armor",
      itemType: "light-armor",
      costQuantity: 10,
      costUnit: "gp",
      weight: 10,
      description: "Light armor made from leather.",
    },
    {
      index: "thieves-tools",
      name: "Thieves' Tools",
      equipmentCategory: "tools",
      itemType: "tool",
      costQuantity: 25,
      costUnit: "gp",
      weight: 1,
      description: "Tools used to pick locks and disarm traps.",
    },
    {
      index: "backpack",
      name: "Backpack",
      equipmentCategory: "adventuring-gear",
      itemType: "gear",
      costQuantity: 2,
      costUnit: "gp",
      weight: 5,
      description: "A container for adventuring equipment.",
    },
  ];

  for (const item of equipment) {
    await prisma.refEquipment.upsert({
      where: {
        index: item.index,
      },
      update: {},
      create: item,
    });
  }
}

async function seedDemoCharacter() {
  console.log("Seeding demo user and character...");

  const user = await prisma.user.upsert({
    where: {
      email: "demo@ddsimple.local",
    },
    update: {},
    create: {
      email: "demo@ddsimple.local",
      displayName: "Demo Player",
      passwordHash: null,
    },
  });

  const character = await prisma.character.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name: "Kael Shadowstep",
      },
    },
    update: {
      speciesIndex: "human",
      classIndex: "rogue",
      backgroundIndex: "criminal",
      level: 3,
      experiencePoints: 900,
      alignment: "Chaotic Neutral",
      maxHp: 24,
      currentHp: 24,
      armorClass: 15,
      speed: 30,
    },
    create: {
      userId: user.id,
      name: "Kael Shadowstep",
      speciesIndex: "human",
      classIndex: "rogue",
      backgroundIndex: "criminal",
      level: 3,
      experiencePoints: 900,
      alignment: "Chaotic Neutral",
      maxHp: 24,
      currentHp: 24,
      armorClass: 15,
      speed: 30,
    },
  });

  const abilityScores = [
    {
      abilityIndex: "str",
      score: 10,
    },
    {
      abilityIndex: "dex",
      score: 16,
    },
    {
      abilityIndex: "con",
      score: 14,
    },
    {
      abilityIndex: "int",
      score: 12,
    },
    {
      abilityIndex: "wis",
      score: 13,
    },
    {
      abilityIndex: "cha",
      score: 14,
    },
  ];

  for (const abilityScore of abilityScores) {
    await prisma.characterAbilityScore.upsert({
      where: {
        characterId_abilityIndex: {
          characterId: character.id,
          abilityIndex: abilityScore.abilityIndex,
        },
      },
      update: {
        score: abilityScore.score,
      },
      create: {
        characterId: character.id,
        abilityIndex: abilityScore.abilityIndex,
        score: abilityScore.score,
      },
    });
  }

  const demoProficientSkills = new Set([
    "acrobatics",
    "stealth",
    "perception",
    "intimidation",
  ]);

  const allSkills = await prisma.refSkill.findMany({
    select: {
      index: true,
    },
    orderBy: {
      index: "asc",
    },
  });

  for (const skill of allSkills) {
    await prisma.characterSkill.upsert({
      where: {
        characterId_skillIndex: {
          characterId: character.id,
          skillIndex: skill.index,
        },
      },
      update: {
        isProficient: demoProficientSkills.has(skill.index),
        customBonus: 0,
      },
      create: {
        characterId: character.id,
        skillIndex: skill.index,
        isProficient: demoProficientSkills.has(skill.index),
        customBonus: 0,
      },
    });
  }

  const demoProficiencies = [
    {
      proficiencyIndex: "skill-acrobatics",
      sourceType: "class",
    },
    {
      proficiencyIndex: "skill-stealth",
      sourceType: "background",
    },
    {
      proficiencyIndex: "skill-perception",
      sourceType: "class",
    },
    {
      proficiencyIndex: "skill-intimidation",
      sourceType: "background",
    },
    {
      proficiencyIndex: "thieves-tools",
      sourceType: "class",
    },
    {
      proficiencyIndex: "light-armor",
      sourceType: "class",
    },
    {
      proficiencyIndex: "simple-weapons",
      sourceType: "class",
    },
  ];

  for (const proficiency of demoProficiencies) {
    await prisma.characterProficiency.upsert({
      where: {
        characterId_proficiencyIndex: {
          characterId: character.id,
          proficiencyIndex: proficiency.proficiencyIndex,
        },
      },
      update: {
        sourceType: proficiency.sourceType,
      },
      create: {
        characterId: character.id,
        proficiencyIndex: proficiency.proficiencyIndex,
        sourceType: proficiency.sourceType,
      },
    });
  }

  await prisma.characterInventory.deleteMany({
    where: {
      characterId: character.id,
    },
  });

  await prisma.characterInventory.createMany({
    data: [
      {
        characterId: character.id,
        equipmentIndex: "dagger",
        quantity: 2,
        equipped: true,
        gridX: 0,
        gridY: 0,
      },
      {
        characterId: character.id,
        equipmentIndex: "shortbow",
        quantity: 1,
        equipped: true,
        gridX: 1,
        gridY: 0,
      },
      {
        characterId: character.id,
        equipmentIndex: "leather-armor",
        quantity: 1,
        equipped: true,
        gridX: 0,
        gridY: 1,
      },
      {
        characterId: character.id,
        equipmentIndex: "thieves-tools",
        quantity: 1,
        equipped: false,
        gridX: 1,
        gridY: 1,
      },
      {
        characterId: character.id,
        equipmentIndex: "backpack",
        quantity: 1,
        equipped: false,
        gridX: 2,
        gridY: 1,
      },
    ],
  });

  await prisma.diceRoll.deleteMany({
    where: {
      characterId: character.id,
      reason: {
        in: ["Stealth check", "Initiative roll"],
      },
    },
  });

  await prisma.diceRoll.createMany({
    data: [
      {
        characterId: character.id,
        rolledByUserId: user.id,
        rollType: "skill_check",
        targetType: "skill",
        targetIndex: "stealth",
        formula: "1d20+5",
        rollMode: "normal",
        rollValues: jsonValue([14]),
        modifier: 5,
        total: 19,
        reason: "Stealth check",
        visibility: "public",
      },
      {
        characterId: character.id,
        rolledByUserId: user.id,
        rollType: "initiative",
        targetType: "ability",
        targetIndex: "dex",
        formula: "1d20+3",
        rollMode: "normal",
        rollValues: jsonValue([12]),
        modifier: 3,
        total: 15,
        reason: "Initiative roll",
        visibility: "public",
      },
    ],
  });

  console.log("Demo seed completed.");
  console.log(`Demo user: ${user.email}`);
  console.log(`Demo character: ${character.name}`);
}

async function main() {
  assertSeedDataDirExists();

  await seedGenericRuleDocuments();

  await seedAbilityScores();
  await seedAlignments();
  await seedSkills();
  await seedSpecies();
  await seedClasses();
  await seedClassPrimaryAbilities();
  await seedClassLevels();
  await seedClassFeatures();
  await seedBackgrounds();
  await seedProficiencies();
  await seedClassProficiencyData();
  await seedEquipment();

  await ensureMinimumDemoReferences();
  await seedDemoCharacter();

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
