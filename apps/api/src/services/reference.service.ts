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
  index: string;
  name: string;
  primaryAbilities: Parameters<typeof primaryAbilityLabel>[0];
  features: RefClassFeatureRow[];
  levels: unknown[];
  sourceJson?: unknown;
};

type RuleDocumentRow = {
  category: string;
  index: string;
  name?: string | null;
  sourceJson?: unknown;
};

function ruleDocumentDescriptions(sourceJson: Record<string, unknown>) {
  const desc = sourceJson.desc;

  if (Array.isArray(desc)) {
    return desc.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof sourceJson.description === "string" && sourceJson.description.trim().length > 0) {
    return [sourceJson.description];
  }

  return [];
}

function buildCuratedClassFeatures(
  classIndex: string,
  levelDocuments: RuleDocumentRow[],
  featureDocuments: RuleDocumentRow[],
) {
  const curatedLevels = levelDocuments
    .map((document) => ({
      document,
      sourceJson: (document.sourceJson ?? {}) as Record<string, unknown>,
    }))
    .filter(({ sourceJson }) => {
      const classRecord = sourceJson.class;

      return Boolean(
        classRecord &&
          typeof classRecord === "object" &&
          (classRecord as Record<string, unknown>).index === classIndex,
      );
    })
    .sort((left, right) => {
      const leftLevel = typeof left.sourceJson.level === "number" ? left.sourceJson.level : 0;
      const rightLevel = typeof right.sourceJson.level === "number" ? right.sourceJson.level : 0;

      return leftLevel - rightLevel || left.document.index.localeCompare(right.document.index);
    });

  if (curatedLevels.length === 0) {
    return null;
  }

  const featureDocumentMap = new Map(featureDocuments.map((document) => [document.index, document]));

  return curatedLevels.flatMap(({ sourceJson }) => {
    const defaultLevel = typeof sourceJson.level === "number" ? sourceJson.level : 1;
    const features = Array.isArray(sourceJson.features)
      ? sourceJson.features.filter(
          (feature): feature is Record<string, unknown> =>
            Boolean(feature && typeof feature === "object"),
        )
      : [];

    return features.map((featureReference) => {
      const featureIndex =
        typeof featureReference.index === "string" ? featureReference.index : "unknown-feature";
      const featureDocument = featureDocumentMap.get(featureIndex);
      const featureSourceJson = (featureDocument?.sourceJson ?? {}) as Record<string, unknown>;
      const descriptions = ruleDocumentDescriptions(featureSourceJson);

      return {
        id: featureIndex,
        index: featureIndex,
        level:
          typeof featureSourceJson.level === "number" ? featureSourceJson.level : defaultLevel,
        title:
          (typeof featureSourceJson.name === "string" && featureSourceJson.name) ||
          featureDocument?.name ||
          (typeof featureReference.name === "string" && featureReference.name) ||
          featureIndex,
        name:
          (typeof featureSourceJson.name === "string" && featureSourceJson.name) ||
          featureDocument?.name ||
          (typeof featureReference.name === "string" && featureReference.name) ||
          featureIndex,
        summary: descriptions[0] ?? "No description available from reference data.",
        description: descriptions[0] ?? null,
        details: descriptions.slice(1),
        sourceJson: featureDocument?.sourceJson ?? featureReference,
      };
    });
  });
}

async function findClasses() {
  const [classes, ruleDocuments] = await Promise.all([
    prisma.refClass.findMany({
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
    }),
    prisma.refRuleDocument.findMany({
      where: {
        category: {
          in: ["levels", "features"],
        },
      },
      orderBy: {
        index: "asc",
      },
    }),
  ]);

  const levelDocuments = ruleDocuments.filter((document) => document.category === "levels");
  const featureDocuments = ruleDocuments.filter((document) => document.category === "features");

  return classes.map((characterClass: RefClassWithDetails) => ({
    ...characterClass,
    primaryAbility: primaryAbilityLabel(characterClass.primaryAbilities),
    features:
      buildCuratedClassFeatures(characterClass.index, levelDocuments, featureDocuments) ??
      characterClass.features.map((feature: RefClassFeatureRow) => ({
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
