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
    include: {
      traits: {
        orderBy: {
          name: "asc",
        },
      },
      sizeOptions: {
        orderBy: {
          size: "asc",
        },
      },
      subspecies: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });
}

function stringArrayFromJson(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function primaryAbilityLabel(
  primaryAbilities: Array<{
    abilityScore: {
      fullName: string;
      name: string;
    };
  }>,
) {
  const labels = primaryAbilities.map(
    (primaryAbility) => primaryAbility.abilityScore.fullName ?? primaryAbility.abilityScore.name,
  );

  return labels.length > 0 ? labels.join(" / ") : null;
}

type RefClassFeatureRow = {
  index: string;
  level: number;
  name: string;
  description: string | null;
  details: unknown;
  sourceJson: unknown;
};

type RefClassWithDetails = {
  primaryAbilities: Parameters<typeof primaryAbilityLabel>[0];
  features: RefClassFeatureRow[];
  levels: unknown[];
};

async function findClasses() {
  const classes: RefClassWithDetails[] = await prisma.refClass.findMany({
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
      proficiencyGrants: {
        orderBy: [
          {
            grantType: "asc",
          },
          {
            proficiencyIndex: "asc",
          },
        ],
        include: {
          proficiency: true,
        },
      },
      skillChoices: {
        orderBy: {
          chooseCount: "asc",
        },
        include: {
          options: {
            orderBy: {
              proficiencyIndex: "asc",
            },
            include: {
              proficiency: true,
              skill: true,
            },
          },
        },
      },
      primaryAbilities: {
        orderBy: {
          abilityScoreIndex: "asc",
        },
        include: {
          abilityScore: true,
        },
      },
    },
  });

  return classes.map((characterClass: RefClassWithDetails) => ({
    ...characterClass,
    primaryAbility: primaryAbilityLabel(characterClass.primaryAbilities),
    features: characterClass.features.map((feature: RefClassFeatureRow) => ({
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

function findAlignments() {
  return prisma.refAlignment.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

function findConditions() {
  return prisma.refCondition.findMany({
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
    include: {
      proficiencyGrants: {
        orderBy: [
          {
            grantType: "asc",
          },
          {
            proficiencyIndex: "asc",
          },
        ],
        include: {
          proficiency: true,
        },
      },
      abilityOptions: {
        orderBy: {
          abilityScoreIndex: "asc",
        },
        include: {
          abilityScore: true,
        },
      },
      featGrants: {
        orderBy: {
          featIndex: "asc",
        },
      },
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
  findAlignments,
  findBackgrounds,
  findClasses,
  findConditions,
  findEquipment,
  findProficiencies,
  findRuleDocumentByCategoryAndIndex,
  findRuleDocumentsByCategory,
  findSkills,
  findSpecies,
};
