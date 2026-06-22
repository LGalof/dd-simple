import type {
  ActionActivationType,
  CharacterActionEntry,
  CharacterDefenseEntry,
  CharacterDefenseKind,
  CharacterDerivedStats,
  CharacterFeatureSourceType,
  ClassSourceJson,
  DerivedArmorClassMode,
  FeatSourceJson,
  FeatureSourceJson,
  LevelSourceJson,
  PassiveEffect,
  ResolvedFeatureSource,
  SubclassSourceJson,
  SubspeciesSourceJson,
  TraitSourceJson,
} from "./types.js";

const CLASS_FEATURE_CHOICE_SOURCE_TYPE = "class-feature";
const SPECIES_CHOICE_SOURCE_TYPE = "species";
const SPECIES_HERITAGE_CHOICE_TYPE = "species-heritage-choice";
const SPECIES_HERITAGE_SELECTED_TYPE = "subspecies";

const passiveEffectRegistry: Record<string, PassiveEffect> = {
  alert: {
    initiativeProficiencyBonusMultiplier: 1,
  },
  "barbarian-unarmored-defense": {
    armorClassMode: "barbarian_unarmored",
  },
  "monk-unarmored-defense": {
    armorClassMode: "monk_unarmored",
  },
  observant: {
    passiveInvestigationBonus: 5,
    passivePerceptionBonus: 5,
  },
  "fast-movement": {
    speedBonus: 10,
  },
  speedy: {
    speedBonus: 10,
  },
  "unarmored-movement": {
    speedBonus: 10,
  },
  "ranger-roving": {
    speedBonus: 10,
  },
  "fighting-style-defense": {
    armorClassBonus: 1,
  },
  defense: {
    armorClassBonus: 1,
  },
  "feral-instinct": {
    initiativeBonus: 2,
  },
};

const passiveEffectRegistryKeys = new Set<string>(
  Object.keys(passiveEffectRegistry),
);

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

function dedupeSpellEntries<
  T extends { kind: string; title: string; sourceIndex: string },
>(entries: T[]) {
  const seenIds = new Set<string>();

  return entries.filter((entry) => {
    const key = `${entry.kind}:${entry.title}:${entry.sourceIndex}`;

    if (seenIds.has(key)) {
      return false;
    }

    seenIds.add(key);
    return true;
  });
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

function compareDefenseEntries(left: CharacterDefenseEntry, right: CharacterDefenseEntry) {
  const kindDifference = defenseKindPriority(left.kind) - defenseKindPriority(right.kind);

  if (kindDifference !== 0) {
    return kindDifference;
  }

  return left.target.localeCompare(right.target);
}

function compareSpellEntries(
  left: { kind: "always_prepared" | "spell_feature" | "spellcasting"; level: number | null; title: string },
  right: { kind: "always_prepared" | "spell_feature" | "spellcasting"; level: number | null; title: string },
) {
  const leftPriority = spellKindPriority(left.kind);
  const rightPriority = spellKindPriority(right.kind);

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

function compareResolvedSources(left: ResolvedFeatureSource, right: ResolvedFeatureSource) {
  const leftLevel = left.level ?? Number.POSITIVE_INFINITY;
  const rightLevel = right.level ?? Number.POSITIVE_INFINITY;

  if (leftLevel !== rightLevel) {
    return leftLevel - rightLevel;
  }

  if (left.sourceType !== right.sourceType) {
    return resolvedSourcePriority(left.sourceType) - resolvedSourcePriority(right.sourceType);
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

function spellKindPriority(kind: "always_prepared" | "spell_feature" | "spellcasting") {
  switch (kind) {
    case "spellcasting":
      return 0;
    case "always_prepared":
      return 1;
    case "spell_feature":
    default:
      return 2;
  }
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

function resolvedSourcePriority(sourceType: CharacterFeatureSourceType) {
  switch (sourceType) {
    case "class_feature":
      return 0;
    case "subclass_feature":
      return 1;
    case "species_trait":
    default:
      return 2;
  }
}

function createBaseDerivedStats(characterLevel: number): CharacterDerivedStats {
  return {
    armorClassBonus: 0,
    armorClassMode: "base",
    initiativeBonus: 0,
    passiveInsightBonus: 0,
    passiveInvestigationBonus: 0,
    passivePerceptionBonus: 0,
    proficiencyBonus: getProficiencyBonus(characterLevel),
    speedBonus: 0,
  };
}

function getPassiveEffect(source: ResolvedFeatureSource) {
  const normalizedTitle = source.title.toLowerCase();

  if (source.sourceIndex in passiveEffectRegistry) {
    return passiveEffectRegistry[source.sourceIndex];
  }

  const titleKey = slugify(normalizedTitle);

  return passiveEffectRegistry[titleKey] ?? null;
}

function chooseArmorClassMode(
  currentMode: DerivedArmorClassMode,
  nextMode: DerivedArmorClassMode,
): DerivedArmorClassMode {
  if (currentMode === "monk_unarmored" || nextMode === "monk_unarmored") {
    return nextMode;
  }

  if (currentMode === "barbarian_unarmored" || nextMode === "barbarian_unarmored") {
    return nextMode;
  }

  return "base";
}

function getProficiencyBonus(level: number) {
  if (level <= 4) {
    return 2;
  }

  if (level <= 8) {
    return 3;
  }

  if (level <= 12) {
    return 4;
  }

  if (level <= 16) {
    return 5;
  }

  return 6;
}

function asClassSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as ClassSourceJson) : {};
}

function asLevelSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as LevelSourceJson) : {};
}

function asFeatureSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as FeatureSourceJson) : {};
}

function asTraitSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as TraitSourceJson) : {};
}

function asFeatSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as FeatSourceJson) : {};
}

function asSubclassSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as SubclassSourceJson) : {};
}

function asSubspeciesSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as SubspeciesSourceJson) : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function humanizeIndex(index: string) {
  return index
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export {
  asClassSourceJson,
  asFeatSourceJson,
  asFeatureSourceJson,
  asLevelSourceJson,
  asSubclassSourceJson,
  asSubspeciesSourceJson,
  asTraitSourceJson,
  chooseArmorClassMode,
  CLASS_FEATURE_CHOICE_SOURCE_TYPE,
  compareActionEntries,
  compareDefenseEntries,
  compareResolvedSources,
  compareSpellEntries,
  conditionTypes,
  createBaseDerivedStats,
  damageTypes,
  dedupeActions,
  dedupeDefenses,
  dedupeSpellEntries,
  getPassiveEffect,
  getProficiencyBonus,
  getRuleDescription,
  humanizeIndex,
  isPresent,
  numberValue,
  passiveEffectRegistryKeys,
  slugify,
  SPECIES_CHOICE_SOURCE_TYPE,
  SPECIES_HERITAGE_CHOICE_TYPE,
  SPECIES_HERITAGE_SELECTED_TYPE,
  stringValue,
  toTitleCase,
};
