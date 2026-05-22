import { prisma } from "../lib/prisma.js";

function findAbilityScores() {
  return prisma.refAbilityScore.findMany({
    orderBy: {
      index: "asc",
    },
  });
}

function findSkills() {
  return prisma.refSkill.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      ability: true,
    },
  });
}

function findSpecies() {
  return prisma.refSpecies.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

function findClasses() {
  return prisma.refClass.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

function findBackgrounds() {
  return prisma.refBackground.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

function findProficiencies() {
  return prisma.refProficiency.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

function findEquipment() {
  return prisma.refEquipment.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

function findRuleDocumentsByCategory(category: string) {
  return prisma.refRuleDocument.findMany({
    where: {
      category,
    },
    orderBy: {
      index: "asc",
    },
  });
}

function findRuleDocumentByCategoryAndIndex(category: string, index: string) {
  return prisma.refRuleDocument.findUnique({
    where: {
      category_index: {
        category,
        index,
      },
    },
  });
}

export {
  findAbilityScores,
  findBackgrounds,
  findClasses,
  findEquipment,
  findProficiencies,
  findRuleDocumentByCategoryAndIndex,
  findRuleDocumentsByCategory,
  findSkills,
  findSpecies,
};