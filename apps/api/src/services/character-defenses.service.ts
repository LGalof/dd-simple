import { prisma } from "../lib/prisma.js";

type CharacterDefenseKind =
  | "condition_immunity"
  | "immunity"
  | "resistance"
  | "vulnerability";

type CharacterDefenseSourceType = "class_feature" | "species_trait";

type CharacterDefenseEntry = {
  description: string;
  id: string;
  kind: CharacterDefenseKind;
  level: number | null;
  sourceIndex: string;
  sourceType: CharacterDefenseSourceType;
  target: string;
  title: string;
};

type RuleDocumentRecord = {
  index: string;
  sourceJson: unknown;
};

type FeatureSourceJson = {
  class?: {
    index?: unknown;
  };
  desc?: unknown;
  description?: unknown;
  level?: unknown;
  name?: unknown;
};

type TraitSourceJson = {
  description?: unknown;
  level?: unknown;
  name?: unknown;
  species?: Array<{
    index?: unknown;
  }>;
  subspecies?: Array<{
    index?: unknown;
  }>;
};

type SubspeciesSourceJson = {
  traits?: Array<{
    index?: unknown;
  }>;
};

type CharacterDefenseOverrides = {
  classIndex?: string;
  level?: number;
  subspeciesIndex?: string;
  speciesIndex?: string;
};

const damageTypes = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
] as const;

const conditionTypes = [
  "blinded",
  "charmed",
  "deafened",
  "exhaustion",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
] as const;

async function findCharacterDefensesForUser(
  userId: string,
  characterId: string,
  overrides: CharacterDefenseOverrides = {},
) {
  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      userId,
    },
    include: {
      class: true,
      species: true,
    },
  });

  if (!character) {
    return null;
  }

  const effectiveClassIndex = overrides.classIndex ?? character.classIndex;
  const effectiveSpeciesIndex = overrides.speciesIndex ?? character.speciesIndex;
  const effectiveLevel = overrides.level ?? character.level;
  const effectiveSubspeciesIndex = overrides.subspeciesIndex;

  const [
    featureDocuments,
    traitDocuments,
    selectedSubspeciesDocument,
  ]: [RuleDocumentRecord[], RuleDocumentRecord[], RuleDocumentRecord | null] =
    await Promise.all([
      prisma.refRuleDocument.findMany({
        where: {
          category: "features",
        },
        select: {
          index: true,
          sourceJson: true,
        },
      }),
      prisma.refRuleDocument.findMany({
        where: {
          category: "traits",
        },
        select: {
          index: true,
          sourceJson: true,
        },
      }),
      effectiveSubspeciesIndex
        ? prisma.refRuleDocument.findUnique({
            where: {
              category_index: {
                category: "subspecies",
                index: effectiveSubspeciesIndex,
              },
            },
            select: {
              index: true,
              sourceJson: true,
            },
          })
        : Promise.resolve(null),
    ]);
  const selectedSubspeciesTraitIndexes = getSubspeciesTraitIndexes(
    selectedSubspeciesDocument?.sourceJson,
  );

  const classFeatureDefenses = featureDocuments.flatMap((document) =>
    toClassFeatureDefenses(document, effectiveClassIndex, effectiveLevel),
  );
  const speciesTraitDefenses = traitDocuments.flatMap((document) =>
    toSpeciesTraitDefenses(
      document,
      effectiveSpeciesIndex,
      effectiveSubspeciesIndex,
      selectedSubspeciesTraitIndexes,
    ),
  );

  return dedupeDefenses([...classFeatureDefenses, ...speciesTraitDefenses]).sort(
    compareDefenseEntries,
  );
}

function toClassFeatureDefenses(
  document: RuleDocumentRecord,
  classIndex: string,
  characterLevel: number,
) {
  const sourceJson = asFeatureSourceJson(document.sourceJson);

  if (stringValue(sourceJson.class?.index) !== classIndex) {
    return [];
  }

  const level = numberValue(sourceJson.level);

  if (level !== null && level > characterLevel) {
    return [];
  }

  return inferDefensesFromDescription({
    description: getRuleDescription(sourceJson.desc, sourceJson.description),
    level,
    sourceIndex: document.index,
    sourceType: "class_feature",
    title: stringValue(sourceJson.name) ?? humanizeIndex(document.index),
  });
}

function toSpeciesTraitDefenses(
  document: RuleDocumentRecord,
  speciesIndex: string,
  subspeciesIndex?: string,
  selectedSubspeciesTraitIndexes: string[] = [],
) {
  const sourceJson = asTraitSourceJson(document.sourceJson);
  const appliesToSpecies = (sourceJson.species ?? []).some(
    (entry) => stringValue(entry.index) === speciesIndex,
  );

  if (!appliesToSpecies) {
    return [];
  }

  const requiredSubspecies = (sourceJson.subspecies ?? [])
    .map((entry) => stringValue(entry.index))
    .filter(isPresent);

  if (
    requiredSubspecies.length > 0 &&
    (!subspeciesIndex || !requiredSubspecies.includes(subspeciesIndex))
  ) {
    return [];
  }

  if (
    speciesIndex === "dragonborn" &&
    subspeciesIndex &&
    requiredSubspecies.length === 0 &&
    document.index.startsWith("draconic-") &&
    !selectedSubspeciesTraitIndexes.includes(document.index)
  ) {
    return [];
  }

  return inferDefensesFromDescription({
    description: getRuleDescription(sourceJson.description),
    level: numberValue(sourceJson.level),
    sourceIndex: document.index,
    sourceType: "species_trait",
    title: stringValue(sourceJson.name) ?? humanizeIndex(document.index),
  });
}

function inferDefensesFromDescription(baseEntry: {
  description: string;
  level: number | null;
  sourceIndex: string;
  sourceType: CharacterDefenseSourceType;
  title: string;
}) {
  const entries: CharacterDefenseEntry[] = [];
  const seen = new Set<string>();

  addDamageDefenseEntries(entries, seen, baseEntry, "resistance", /resistance to ([^.]+?) damage/gi);
  addDamageDefenseEntries(entries, seen, baseEntry, "immunity", /immunity to ([^.]+?) damage/gi);
  addDamageDefenseEntries(entries, seen, baseEntry, "vulnerability", /vulnerability to ([^.]+?) damage/gi);
  addConditionDefenseEntries(
    entries,
    seen,
    baseEntry,
    /immunity to (?:the )?([^.]+?) condition/gi,
  );

  return entries;
}

function addDamageDefenseEntries(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  baseEntry: {
    description: string;
    level: number | null;
    sourceIndex: string;
    sourceType: CharacterDefenseSourceType;
    title: string;
  },
  kind: Extract<CharacterDefenseKind, "immunity" | "resistance" | "vulnerability">,
  pattern: RegExp,
) {
  const matches = [...baseEntry.description.matchAll(pattern)];

  matches.forEach((match) => {
    const targets = extractDamageTargets(match[1] ?? "");

    targets.forEach((target) => {
      pushDefenseEntry(entries, seen, {
        ...baseEntry,
        kind,
        target,
      });
    });
  });
}

function addConditionDefenseEntries(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  baseEntry: {
    description: string;
    level: number | null;
    sourceIndex: string;
    sourceType: CharacterDefenseSourceType;
    title: string;
  },
  pattern: RegExp,
) {
  const matches = [...baseEntry.description.matchAll(pattern)];

  matches.forEach((match) => {
    const targets = extractConditionTargets(match[1] ?? "");

    targets.forEach((target) => {
      pushDefenseEntry(entries, seen, {
        ...baseEntry,
        kind: "condition_immunity" as const,
        target,
      });
    });
  });
}

function pushDefenseEntry(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  entry: Omit<CharacterDefenseEntry, "id">,
) {
  const key = `${entry.sourceType}:${entry.sourceIndex}:${entry.kind}:${entry.target}`;

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  entries.push({
    ...entry,
    id: key,
  });
}

function extractDamageTargets(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("all")) {
    return ["All Damage"];
  }

  return damageTypes
    .filter((damageType) => new RegExp(`\\b${damageType}\\b`, "i").test(value))
    .map(toTitleCase);
}

function extractConditionTargets(value: string) {
  return conditionTypes
    .filter((conditionType) => new RegExp(`\\b${conditionType}\\b`, "i").test(value))
    .map(toTitleCase);
}

function dedupeDefenses(entries: CharacterDefenseEntry[]) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = `${entry.kind}:${entry.target}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function compareDefenseEntries(left: CharacterDefenseEntry, right: CharacterDefenseEntry) {
  const kindDifference = defenseKindPriority(left.kind) - defenseKindPriority(right.kind);

  if (kindDifference !== 0) {
    return kindDifference;
  }

  return left.target.localeCompare(right.target);
}

function defenseKindPriority(kind: CharacterDefenseKind) {
  switch (kind) {
    case "resistance":
      return 0;
    case "immunity":
      return 1;
    case "vulnerability":
      return 2;
    case "condition_immunity":
    default:
      return 3;
  }
}

function getRuleDescription(...values: unknown[]) {
  const parts: string[] = [];

  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      parts.push(value.trim());
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim().length > 0) {
          parts.push(item.trim());
        }
      }
    }
  }

  return parts.join(" ");
}

function asFeatureSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as FeatureSourceJson) : {};
}

function asTraitSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as TraitSourceJson) : {};
}

function getSubspeciesTraitIndexes(sourceJson: unknown) {
  const parsedSourceJson =
    typeof sourceJson === "object" && sourceJson !== null
      ? (sourceJson as SubspeciesSourceJson)
      : {};

  return (parsedSourceJson.traits ?? [])
    .map((trait) => stringValue(trait.index))
    .filter(isPresent);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function humanizeIndex(index: string) {
  return index
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export { findCharacterDefensesForUser };
export type {
  CharacterDefenseEntry,
  CharacterDefenseKind,
  CharacterDefenseOverrides,
};
