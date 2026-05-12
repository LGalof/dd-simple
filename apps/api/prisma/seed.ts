/// <reference types="node" />

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "demo@ddsimple.local",
    },
    update: {},
    create: {
      email: "demo@ddsimple.local",
      displayName: "Demo Player",
    },
  });

  await prisma.refAbilityScore.createMany({
    data: [
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
    ],
    skipDuplicates: true,
  });

  await prisma.refSkill.createMany({
    data: [
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
    ],
    skipDuplicates: true,
  });

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

  await prisma.refProficiency.createMany({
    data: [
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
    ],
    skipDuplicates: true,
  });

  await prisma.refEquipment.createMany({
    data: [
      {
        index: "dagger",
        name: "Dagger",
        equipmentCategory: "Weapon",
        itemType: "Simple Melee Weapon",
        costQuantity: 2,
        costUnit: "gp",
        weight: 1,
        description: "A small blade useful for melee or throwing.",
      },
      {
        index: "shortbow",
        name: "Shortbow",
        equipmentCategory: "Weapon",
        itemType: "Simple Ranged Weapon",
        costQuantity: 25,
        costUnit: "gp",
        weight: 2,
        description: "A ranged weapon using arrows.",
      },
      {
        index: "leather-armor",
        name: "Leather Armor",
        equipmentCategory: "Armor",
        itemType: "Light Armor",
        costQuantity: 10,
        costUnit: "gp",
        weight: 10,
        description: "Light armor made from leather.",
      },
      {
        index: "thieves-tools",
        name: "Thieves' Tools",
        equipmentCategory: "Tools",
        itemType: "Tool",
        costQuantity: 25,
        costUnit: "gp",
        weight: 1,
        description: "Tools used to pick locks and disarm traps.",
      },
      {
        index: "backpack",
        name: "Backpack",
        equipmentCategory: "Adventuring Gear",
        itemType: "Gear",
        costQuantity: 2,
        costUnit: "gp",
        weight: 5,
        description: "A container for adventuring equipment.",
      },
    ],
    skipDuplicates: true,
  });

  const character = await prisma.character.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name: "Kael Shadowstep",
      },
    },
    update: {},
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

  await prisma.characterAbilityScore.createMany({
    data: [
      {
        characterId: character.id,
        abilityIndex: "str",
        score: 10,
      },
      {
        characterId: character.id,
        abilityIndex: "dex",
        score: 16,
      },
      {
        characterId: character.id,
        abilityIndex: "con",
        score: 14,
      },
      {
        characterId: character.id,
        abilityIndex: "int",
        score: 12,
      },
      {
        characterId: character.id,
        abilityIndex: "wis",
        score: 13,
      },
      {
        characterId: character.id,
        abilityIndex: "cha",
        score: 14,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.characterSkill.createMany({
    data: [
      {
        characterId: character.id,
        skillIndex: "acrobatics",
        isProficient: true,
        customBonus: 0,
      },
      {
        characterId: character.id,
        skillIndex: "stealth",
        isProficient: true,
        customBonus: 0,
      },
      {
        characterId: character.id,
        skillIndex: "perception",
        isProficient: true,
        customBonus: 0,
      },
      {
        characterId: character.id,
        skillIndex: "intimidation",
        isProficient: true,
        customBonus: 0,
      },
      {
        characterId: character.id,
        skillIndex: "investigation",
        isProficient: false,
        customBonus: 0,
      },
      {
        characterId: character.id,
        skillIndex: "athletics",
        isProficient: false,
        customBonus: 0,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.characterProficiency.createMany({
    data: [
      {
        characterId: character.id,
        proficiencyIndex: "skill-acrobatics",
        sourceType: "class",
      },
      {
        characterId: character.id,
        proficiencyIndex: "skill-stealth",
        sourceType: "background",
      },
      {
        characterId: character.id,
        proficiencyIndex: "skill-perception",
        sourceType: "class",
      },
      {
        characterId: character.id,
        proficiencyIndex: "skill-intimidation",
        sourceType: "background",
      },
      {
        characterId: character.id,
        proficiencyIndex: "thieves-tools",
        sourceType: "class",
      },
      {
        characterId: character.id,
        proficiencyIndex: "light-armor",
        sourceType: "class",
      },
      {
        characterId: character.id,
        proficiencyIndex: "simple-weapons",
        sourceType: "class",
      },
    ],
    skipDuplicates: true,
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
    skipDuplicates: true,
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
        rollValues: [14],
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
        rollValues: [12],
        modifier: 3,
        total: 15,
        reason: "Initiative roll",
        visibility: "public",
      },
    ],
  });

  console.log("Seed completed.");
  console.log(`Demo user: ${user.email}`);
  console.log(`Demo character: ${character.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });