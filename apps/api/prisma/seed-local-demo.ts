/// <reference types="node" />

import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

const demoEmail = "demo@ddsimple.local";
const demoPassword = "demo1234";

type AbilityScores = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

type DemoCharacter = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  alignment: string;
  level: number;
  experiencePoints: number;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;
  abilityScores: AbilityScores;
  proficientSkills: string[];
  proficiencies: string[];
  inventory: Array<{
    equipmentIndex: string;
    quantity?: number;
    equipped?: boolean;
    gridX?: number;
    gridY?: number;
    customName?: string;
    notes?: string;
  }>;
};

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("base64url")}`;
}

async function seedReferences() {
  await prisma.refAbilityScore.createMany({
    skipDuplicates: true,
    data: [
      { index: "str", name: "STR", fullName: "Strength", description: "Physical power." },
      { index: "dex", name: "DEX", fullName: "Dexterity", description: "Agility and reflexes." },
      { index: "con", name: "CON", fullName: "Constitution", description: "Health and stamina." },
      { index: "int", name: "INT", fullName: "Intelligence", description: "Reasoning and memory." },
      { index: "wis", name: "WIS", fullName: "Wisdom", description: "Perception and insight." },
      { index: "cha", name: "CHA", fullName: "Charisma", description: "Force of personality." },
    ],
  });

  await prisma.refAlignment.createMany({
    skipDuplicates: true,
    data: [
      {
        index: "lawful-good",
        name: "Lawful Good",
        abbreviation: "LG",
        description: "A character who tries to do the right thing within honorable rules.",
      },
      {
        index: "neutral-good",
        name: "Neutral Good",
        abbreviation: "NG",
        description: "A character who helps others according to their needs.",
      },
      {
        index: "chaotic-neutral",
        name: "Chaotic Neutral",
        abbreviation: "CN",
        description: "A character who follows personal freedom and impulse.",
      },
    ],
  });

  await prisma.refSkill.createMany({
    skipDuplicates: true,
    data: [
      { index: "acrobatics", abilityIndex: "dex", name: "Acrobatics" },
      { index: "animal-handling", abilityIndex: "wis", name: "Animal Handling" },
      { index: "arcana", abilityIndex: "int", name: "Arcana" },
      { index: "athletics", abilityIndex: "str", name: "Athletics" },
      { index: "deception", abilityIndex: "cha", name: "Deception" },
      { index: "history", abilityIndex: "int", name: "History" },
      { index: "insight", abilityIndex: "wis", name: "Insight" },
      { index: "intimidation", abilityIndex: "cha", name: "Intimidation" },
      { index: "investigation", abilityIndex: "int", name: "Investigation" },
      { index: "medicine", abilityIndex: "wis", name: "Medicine" },
      { index: "nature", abilityIndex: "int", name: "Nature" },
      { index: "perception", abilityIndex: "wis", name: "Perception" },
      { index: "performance", abilityIndex: "cha", name: "Performance" },
      { index: "persuasion", abilityIndex: "cha", name: "Persuasion" },
      { index: "religion", abilityIndex: "int", name: "Religion" },
      { index: "sleight-of-hand", abilityIndex: "dex", name: "Sleight of Hand" },
      { index: "stealth", abilityIndex: "dex", name: "Stealth" },
      { index: "survival", abilityIndex: "wis", name: "Survival" },
    ],
  });

  await prisma.refSpecies.createMany({
    skipDuplicates: true,
    data: [
      {
        index: "human",
        name: "Human",
        size: "Medium",
        baseSpeed: 30,
        description: "Versatile and ambitious.",
      },
      {
        index: "elf",
        name: "Elf",
        size: "Medium",
        baseSpeed: 30,
        description: "Graceful, perceptive, and long-lived.",
      },
      {
        index: "dwarf",
        name: "Dwarf",
        size: "Medium",
        baseSpeed: 25,
        description: "Sturdy, practical, and resilient.",
      },
    ],
  });

  await prisma.refClass.createMany({
    skipDuplicates: true,
    data: [
      {
        index: "rogue",
        name: "Rogue",
        hitDie: 8,
        sourceJson: { saving_throws: [{ index: "dex" }, { index: "int" }] },
      },
      {
        index: "fighter",
        name: "Fighter",
        hitDie: 10,
        sourceJson: { saving_throws: [{ index: "str" }, { index: "con" }] },
      },
      {
        index: "wizard",
        name: "Wizard",
        hitDie: 6,
        sourceJson: { saving_throws: [{ index: "int" }, { index: "wis" }] },
      },
    ],
  });

  await prisma.refClassPrimaryAbility.createMany({
    skipDuplicates: true,
    data: [
      {
        classIndex: "rogue",
        abilityScoreIndex: "dex",
      },
      {
        classIndex: "fighter",
        abilityScoreIndex: "str",
      },
      {
        classIndex: "fighter",
        abilityScoreIndex: "dex",
      },
      {
        classIndex: "wizard",
        abilityScoreIndex: "int",
      },
    ],
  });

  await prisma.refBackground.createMany({
    skipDuplicates: true,
    data: [
      {
        index: "criminal",
        name: "Criminal",
        description: "A background built around stealth, contacts, and risky choices.",
      },
      {
        index: "soldier",
        name: "Soldier",
        description: "A trained combatant familiar with discipline and command.",
      },
      {
        index: "sage",
        name: "Sage",
        description: "A scholar with deep curiosity and useful research habits.",
      },
    ],
  });

  const skillProficiencies = [
    "acrobatics",
    "arcana",
    "athletics",
    "history",
    "insight",
    "intimidation",
    "investigation",
    "perception",
    "persuasion",
    "stealth",
    "survival",
  ].map((skill) => ({
    index: `skill-${skill}`,
    name: skill
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    type: "skill",
  }));

  await prisma.refProficiency.createMany({
    skipDuplicates: true,
    data: [
      ...skillProficiencies,
      { index: "saving-throw-str", name: "Strength Saving Throw", type: "saving_throw" },
      { index: "saving-throw-dex", name: "Dexterity Saving Throw", type: "saving_throw" },
      { index: "saving-throw-con", name: "Constitution Saving Throw", type: "saving_throw" },
      { index: "saving-throw-int", name: "Intelligence Saving Throw", type: "saving_throw" },
      { index: "saving-throw-wis", name: "Wisdom Saving Throw", type: "saving_throw" },
      { index: "light-armor", name: "Light Armor", type: "armor" },
      { index: "medium-armor", name: "Medium Armor", type: "armor" },
      { index: "simple-weapons", name: "Simple Weapons", type: "weapon" },
      { index: "martial-weapons", name: "Martial Weapons", type: "weapon" },
      { index: "thieves-tools", name: "Thieves' Tools", type: "tool" },
      { index: "calligraphers-supplies", name: "Calligrapher's Supplies", type: "tool" },
    ],
  });

  await prisma.refClassProficiencyGrant.createMany({
    skipDuplicates: true,
    data: [
      {
        classIndex: "rogue",
        proficiencyIndex: "saving-throw-dex",
        grantType: "SAVING_THROW",
        sourceLabel: "Dexterity Saving Throw",
      },
      {
        classIndex: "rogue",
        proficiencyIndex: "saving-throw-int",
        grantType: "SAVING_THROW",
        sourceLabel: "Intelligence Saving Throw",
      },
      {
        classIndex: "fighter",
        proficiencyIndex: "saving-throw-str",
        grantType: "SAVING_THROW",
        sourceLabel: "Strength Saving Throw",
      },
      {
        classIndex: "fighter",
        proficiencyIndex: "saving-throw-con",
        grantType: "SAVING_THROW",
        sourceLabel: "Constitution Saving Throw",
      },
      {
        classIndex: "wizard",
        proficiencyIndex: "saving-throw-int",
        grantType: "SAVING_THROW",
        sourceLabel: "Intelligence Saving Throw",
      },
      {
        classIndex: "wizard",
        proficiencyIndex: "saving-throw-wis",
        grantType: "SAVING_THROW",
        sourceLabel: "Wisdom Saving Throw",
      },
    ],
  });

  await prisma.refEquipment.createMany({
    skipDuplicates: true,
    data: [
      {
        index: "dagger",
        name: "Dagger",
        equipmentCategory: "weapon",
        itemType: "simple-melee-weapon",
        costQuantity: 2,
        costUnit: "gp",
        weight: 1,
        description: "A light blade that can be thrown.",
      },
      {
        index: "longsword",
        name: "Longsword",
        equipmentCategory: "weapon",
        itemType: "martial-melee-weapon",
        costQuantity: 15,
        costUnit: "gp",
        weight: 3,
        description: "A reliable martial blade.",
      },
      {
        index: "shortbow",
        name: "Shortbow",
        equipmentCategory: "weapon",
        itemType: "simple-ranged-weapon",
        costQuantity: 25,
        costUnit: "gp",
        weight: 2,
        description: "A compact bow for ranged attacks.",
      },
      {
        index: "leather-armor",
        name: "Leather Armor",
        equipmentCategory: "armor",
        itemType: "light-armor",
        costQuantity: 10,
        costUnit: "gp",
        weight: 10,
        description: "Flexible light armor.",
      },
      {
        index: "chain-shirt",
        name: "Chain Shirt",
        equipmentCategory: "armor",
        itemType: "medium-armor",
        costQuantity: 50,
        costUnit: "gp",
        weight: 20,
        description: "Medium armor worn under outer clothing.",
      },
      {
        index: "spellbook",
        name: "Spellbook",
        equipmentCategory: "adventuring-gear",
        itemType: "gear",
        costQuantity: 50,
        costUnit: "gp",
        weight: 3,
        description: "A bound book of spells and notes.",
      },
      {
        index: "healing-potion",
        name: "Potion of Healing",
        equipmentCategory: "potion",
        itemType: "consumable",
        costQuantity: 50,
        costUnit: "gp",
        weight: 0.5,
        description: "Restores hit points when used.",
      },
      {
        index: "thieves-tools",
        name: "Thieves' Tools",
        equipmentCategory: "tools",
        itemType: "tool",
        costQuantity: 25,
        costUnit: "gp",
        weight: 1,
        description: "Tools for locks and traps.",
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
      {
        index: "ruby",
        name: "Ruby",
        equipmentCategory: "treasure",
        itemType: "gem",
        costQuantity: 100,
        costUnit: "gp",
        weight: 0,
        description: "A polished red gemstone.",
      },
    ],
  });
}

async function seedCharacter(userId: string, demo: DemoCharacter) {
  const character = await prisma.character.upsert({
    where: {
      userId_name: {
        userId,
        name: demo.name,
      },
    },
    update: {
      speciesIndex: demo.speciesIndex,
      classIndex: demo.classIndex,
      backgroundIndex: demo.backgroundIndex,
      alignment: demo.alignment,
      level: demo.level,
      experiencePoints: demo.experiencePoints,
      maxHp: demo.maxHp,
      currentHp: demo.currentHp,
      armorClass: demo.armorClass,
      speed: demo.speed,
    },
    create: {
      userId,
      name: demo.name,
      speciesIndex: demo.speciesIndex,
      classIndex: demo.classIndex,
      backgroundIndex: demo.backgroundIndex,
      alignment: demo.alignment,
      level: demo.level,
      experiencePoints: demo.experiencePoints,
      maxHp: demo.maxHp,
      currentHp: demo.currentHp,
      armorClass: demo.armorClass,
      speed: demo.speed,
    },
  });

  await prisma.characterAbilityScore.deleteMany({
    where: {
      characterId: character.id,
    },
  });
  await prisma.characterAbilityScore.createMany({
    data: Object.entries(demo.abilityScores).map(([abilityIndex, score]) => ({
      characterId: character.id,
      abilityIndex,
      score,
    })),
  });

  const skills = await prisma.refSkill.findMany();

  await prisma.characterSkill.deleteMany({
    where: {
      characterId: character.id,
    },
  });
  await prisma.characterSkill.createMany({
    data: skills.map((skill) => ({
      characterId: character.id,
      skillIndex: skill.index,
      isProficient: demo.proficientSkills.includes(skill.index),
      customBonus: 0,
    })),
  });

  await prisma.characterProficiency.deleteMany({
    where: {
      characterId: character.id,
    },
  });
  await prisma.characterProficiency.createMany({
    data: demo.proficiencies.map((proficiencyIndex) => ({
      characterId: character.id,
      proficiencyIndex,
      sourceType: "demo",
    })),
  });

  await prisma.characterInventory.deleteMany({
    where: {
      characterId: character.id,
    },
  });
  await prisma.characterInventory.createMany({
    data: demo.inventory.map((item, index) => ({
      characterId: character.id,
      equipmentIndex: item.equipmentIndex,
      quantity: item.quantity ?? 1,
      equipped: item.equipped ?? false,
      gridX: item.gridX ?? index,
      gridY: item.gridY ?? 0,
      customName: item.customName ?? null,
      notes: item.notes ?? null,
    })),
  });

  return character;
}

async function main() {
  await seedReferences();

  const passwordHash = await hashPassword(demoPassword);
  const user = await prisma.user.upsert({
    where: {
      email: demoEmail,
    },
    update: {
      displayName: "Demo Player",
      passwordHash,
    },
    create: {
      email: demoEmail,
      displayName: "Demo Player",
      passwordHash,
    },
  });

  const characters: DemoCharacter[] = [
    {
      name: "Kael Shadowstep",
      speciesIndex: "human",
      classIndex: "rogue",
      backgroundIndex: "criminal",
      alignment: "Chaotic Neutral",
      level: 3,
      experiencePoints: 900,
      maxHp: 24,
      currentHp: 21,
      armorClass: 15,
      speed: 30,
      abilityScores: { str: 10, dex: 16, con: 14, int: 12, wis: 13, cha: 14 },
      proficientSkills: ["acrobatics", "stealth", "perception", "sleight-of-hand"],
      proficiencies: [
        "skill-acrobatics",
        "skill-stealth",
        "skill-perception",
        "thieves-tools",
        "light-armor",
        "simple-weapons",
        "saving-throw-dex",
        "saving-throw-int",
      ],
      inventory: [
        { equipmentIndex: "dagger", quantity: 2, equipped: true, gridX: 0, gridY: 0 },
        { equipmentIndex: "shortbow", equipped: true, gridX: 1, gridY: 0 },
        { equipmentIndex: "leather-armor", equipped: true, gridX: 0, gridY: 1 },
        { equipmentIndex: "thieves-tools", gridX: 2, gridY: 1 },
        { equipmentIndex: "ruby", quantity: 4, gridX: 4, gridY: 0 },
        { equipmentIndex: "healing-potion", quantity: 2, gridX: 5, gridY: 0 },
      ],
    },
    {
      name: "Brunna Ironvale",
      speciesIndex: "dwarf",
      classIndex: "fighter",
      backgroundIndex: "soldier",
      alignment: "Lawful Good",
      level: 4,
      experiencePoints: 2700,
      maxHp: 38,
      currentHp: 38,
      armorClass: 17,
      speed: 25,
      abilityScores: { str: 16, dex: 12, con: 16, int: 10, wis: 13, cha: 11 },
      proficientSkills: ["athletics", "intimidation", "survival", "perception"],
      proficiencies: [
        "skill-athletics",
        "skill-intimidation",
        "medium-armor",
        "simple-weapons",
        "martial-weapons",
        "saving-throw-str",
        "saving-throw-con",
      ],
      inventory: [
        { equipmentIndex: "longsword", equipped: true, gridX: 0, gridY: 0 },
        { equipmentIndex: "chain-shirt", equipped: true, gridX: 1, gridY: 0 },
        { equipmentIndex: "backpack", gridX: 3, gridY: 0 },
        { equipmentIndex: "healing-potion", quantity: 3, gridX: 4, gridY: 1 },
      ],
    },
    {
      name: "Elowen Starfall",
      speciesIndex: "elf",
      classIndex: "wizard",
      backgroundIndex: "sage",
      alignment: "Neutral Good",
      level: 3,
      experiencePoints: 900,
      maxHp: 18,
      currentHp: 16,
      armorClass: 13,
      speed: 30,
      abilityScores: { str: 8, dex: 14, con: 12, int: 17, wis: 14, cha: 11 },
      proficientSkills: ["arcana", "history", "investigation", "insight"],
      proficiencies: [
        "skill-arcana",
        "skill-history",
        "calligraphers-supplies",
        "saving-throw-int",
        "saving-throw-wis",
      ],
      inventory: [
        { equipmentIndex: "spellbook", equipped: true, gridX: 0, gridY: 0 },
        { equipmentIndex: "dagger", equipped: true, gridX: 1, gridY: 0 },
        { equipmentIndex: "healing-potion", quantity: 1, gridX: 2, gridY: 0 },
        {
          equipmentIndex: "ruby",
          quantity: 1,
          gridX: 3,
          gridY: 0,
          customName: "Arcane Focus Ruby",
          notes: "A gem used as a spellcasting focus in this demo.",
        },
      ],
    },
  ];

  for (const character of characters) {
    await seedCharacter(user.id, character);
  }

  console.log("Local demo data seeded.");
  console.log(`Email: ${demoEmail}`);
  console.log(`Password: ${demoPassword}`);
  console.log(`Characters: ${characters.map((character) => character.name).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
