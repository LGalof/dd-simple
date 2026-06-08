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

function stringArrayFromJson(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

async function findClasses() {
  const classes = await prisma.refClass.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      levels: {
        orderBy: {
          level: "asc",
        },
      },
      features: {
        orderBy: [
          {
            level: "asc",
          },
          {
            name: "asc",
          },
        ],
      },
    },
  });

  return classes.map((characterClass) => ({
    ...characterClass,
    features: characterClass.features.map((feature) => ({
      id: feature.index,
      index: feature.index,
      level: feature.level,
      title: feature.name,
      name: feature.name,
      summary: feature.description ?? "No description available from reference data.",
      description: feature.description,
      details: stringArrayFromJson(feature.details),
      sourceJson: feature.sourceJson,
    })),
    levels: characterClass.levels,
  }));
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
