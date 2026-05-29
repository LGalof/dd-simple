import { prisma } from "../lib/prisma.js";

type ActionActivationType = "attack" | "action" | "bonus_action" | "reaction" | "other";

type CharacterActionEntry = {
  activationType: ActionActivationType;
  description: string;
  id: string;
  level: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait";
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

type CharacterActionOverrides = {
  classIndex?: string;
  level?: number;
  subspeciesIndex?: string;
  speciesIndex?: string;
};

async function findCharacterActionsForUser(
  userId: string,
  characterId: string,
  overrides: CharacterActionOverrides = {},
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

  const [featureDocuments, traitDocuments] = await Promise.all([
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
  ]);

  const classFeatureActions = featureDocuments
    .map((document) => toClassFeatureAction(document, effectiveClassIndex, effectiveLevel))
    .filter(isPresent);
  const speciesTraitActions = traitDocuments
    .map((document) =>
      toSpeciesTraitAction(document, effectiveSpeciesIndex, effectiveSubspeciesIndex),
    )
    .filter(isPresent);

  const dedupedEntries = dedupeActions([...classFeatureActions, ...speciesTraitActions]);

  return dedupedEntries.sort(compareActionEntries);
}

function toClassFeatureAction(
  document: RuleDocumentRecord,
  classIndex: string,
  characterLevel: number,
): CharacterActionEntry | null {
  const sourceJson = asFeatureSourceJson(document.sourceJson);

  if (stringValue(sourceJson.class?.index) !== classIndex) {
    return null;
  }

  const level = numberValue(sourceJson.level);

  if (level !== null && level > characterLevel) {
    return null;
  }

  const description = getRuleDescription(sourceJson.desc, sourceJson.description);
  const activationType = inferActivationType(description);

  if (activationType === null) {
    return null;
  }

  return {
    activationType,
    description,
    id: `class-feature:${document.index}`,
    level,
    sourceIndex: document.index,
    sourceType: "class_feature",
    title: stringValue(sourceJson.name) ?? humanizeIndex(document.index),
  };
}

function toSpeciesTraitAction(
  document: RuleDocumentRecord,
  speciesIndex: string,
  subspeciesIndex?: string,
): CharacterActionEntry | null {
  const sourceJson = asTraitSourceJson(document.sourceJson);
  const appliesToSpecies = (sourceJson.species ?? []).some(
    (entry) => stringValue(entry.index) === speciesIndex,
  );

  if (!appliesToSpecies) {
    return null;
  }

  const requiredSubspecies = (sourceJson.subspecies ?? [])
    .map((entry) => stringValue(entry.index))
    .filter(isPresent);

  if (requiredSubspecies.length > 0 && (!subspeciesIndex || !requiredSubspecies.includes(subspeciesIndex))) {
    return null;
  }

  const description = getRuleDescription(sourceJson.description);
  const activationType = inferActivationType(description);

  if (activationType === null) {
    return null;
  }

  return {
    activationType,
    description,
    id: `species-trait:${document.index}`,
    level: numberValue(sourceJson.level),
    sourceIndex: document.index,
    sourceType: "species_trait",
    title: stringValue(sourceJson.name) ?? humanizeIndex(document.index),
  };
}

function inferActivationType(description: string): ActionActivationType | null {
  const normalized = description.toLowerCase();

  if (/\bbonus action\b/.test(normalized)) {
    return "bonus_action";
  }

  if (/\breaction\b/.test(normalized)) {
    return "reaction";
  }

  if (
    /\battack action\b/.test(normalized) ||
    /\bmelee weapon attack\b/.test(normalized) ||
    /\branged weapon attack\b/.test(normalized) ||
    /\bmake an attack roll\b/.test(normalized) ||
    /\breplace one of your attacks\b/.test(normalized)
  ) {
    return "attack";
  }

  if (
    /\bas an action\b/.test(normalized) ||
    /\btake the .* action\b/.test(normalized) ||
    /\bmagic action\b/.test(normalized) ||
    /\butilize action\b/.test(normalized) ||
    /\buse an object action\b/.test(normalized)
  ) {
    return "action";
  }

  return null;
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

function dedupeActions(entries: CharacterActionEntry[]) {
  const seenIds = new Set<string>();

  return entries.filter((entry) => {
    if (seenIds.has(entry.id)) {
      return false;
    }

    seenIds.add(entry.id);
    return true;
  });
}

function compareActionEntries(left: CharacterActionEntry, right: CharacterActionEntry) {
  const leftPriority = activationPriority(left.activationType);
  const rightPriority = activationPriority(right.activationType);

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftLevel = left.level ?? Number.POSITIVE_INFINITY;
  const rightLevel = right.level ?? Number.POSITIVE_INFINITY;

  if (leftLevel !== rightLevel) {
    return leftLevel - rightLevel;
  }

  return left.title.localeCompare(right.title);
}

function activationPriority(activationType: ActionActivationType) {
  switch (activationType) {
    case "attack":
      return 0;
    case "action":
      return 1;
    case "bonus_action":
      return 2;
    case "reaction":
      return 3;
    case "other":
    default:
      return 4;
  }
}

function asFeatureSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as FeatureSourceJson) : {};
}

function asTraitSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as TraitSourceJson) : {};
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

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export { findCharacterActionsForUser };
export type { ActionActivationType, CharacterActionEntry, CharacterActionOverrides };
