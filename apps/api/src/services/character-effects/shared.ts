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
  PassiveEffectContext,
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
  "aura-of-protection": {
    savingThrowAbilityModifier: "cha",
  },
  archery: {
    rangedAttackBonus: 2,
  },
  "barbarian-unarmored-defense": {
    armorClassMode: "barbarian_unarmored",
  },
  "dazzling-footwork": {
    armorClassMode: "bard_dance_unarmored",
  },
  defense: {
    armorClassBonus: 1,
  },
  dueling: {
    oneHandedMeleeDamageBonus: 2,
  },
  "fast-movement": {
    speedBonus: 10,
  },
  "jack-of-all-trades": {
    initiativeHalfProficiencyBonusMultiplier: 0.5,
    skillCheckHalfProficiencyBonusMultiplier: 0.5,
  },
  "unarmored-movement": {
    speedBonus: 10,
  },
  "wood-elf-speed-increase": {
    speedBonus: 5,
  },
  "draconic-resilience": {
    armorClassBase: 13,
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
  left: {
    kind: "always_prepared" | "spell_feature" | "spellcasting";
    level: number | null;
    spellLevel?: number | null;
    title: string;
  },
  right: {
    kind: "always_prepared" | "spell_feature" | "spellcasting";
    level: number | null;
    spellLevel?: number | null;
    title: string;
  },
) {
  const leftPriority = spellKindPriority(left.kind);
  const rightPriority = spellKindPriority(right.kind);

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftSpellLevel = left.spellLevel ?? Number.POSITIVE_INFINITY;
  const rightSpellLevel = right.spellLevel ?? Number.POSITIVE_INFINITY;

  if (leftSpellLevel !== rightSpellLevel) {
    return leftSpellLevel - rightSpellLevel;
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
    case "saving_throw_advantage":
      return 3;
    case "condition_immunity":
    default:
      return 4;
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
    oneHandedMeleeDamageBonus: 0,
    passiveInsightBonus: 0,
    passiveInvestigationBonus: 0,
    passivePerceptionBonus: 0,
    proficiencyBonus: getProficiencyBonus(characterLevel),
    rangedAttackBonus: 0,
    savingThrowBonus: 0,
    skillCheckHalfProficiencyBonusMultiplier: 0,
    speedBonus: 0,
    strengthMinimum: null,
  };
}

function getPassiveEffect(
  source: ResolvedFeatureSource,
  context: PassiveEffectContext = {},
): PassiveEffect | null {
  const normalizedTitle = source.title.toLowerCase();
  const normalizedSourceIndex = source.sourceIndex.toLowerCase();
  const registryEffect =
    passiveEffectRegistry[source.sourceIndex] ??
    passiveEffectRegistry[slugify(normalizedTitle)] ??
    null;
  const inferredEffect = inferPassiveEffectFromDescription(source.description);
  const mergedEffect = mergePassiveEffects(registryEffect, inferredEffect);

  if (!mergedEffect) {
    return null;
  }

  if (isInactiveConditionalSpeedEffect(source)) {
    const { speedBonus, ...remainingEffect } = mergedEffect;

    return Object.keys(remainingEffect).length > 0 ? remainingEffect : null;
  }

  if (
    !context.hasArmorEquipped &&
    (normalizedSourceIndex === "defense" || slugify(normalizedTitle) === "defense")
  ) {
    const { armorClassBonus, ...remainingEffect } = mergedEffect;

    return Object.keys(remainingEffect).length > 0 ? remainingEffect : null;
  }

  if (
    context.hasHeavyArmorEquipped &&
    (normalizedSourceIndex === "fast-movement" || slugify(normalizedTitle) === "fast-movement")
  ) {
    const { speedBonus, ...remainingEffect } = mergedEffect;

    return Object.keys(remainingEffect).length > 0 ? remainingEffect : null;
  }

  return mergedEffect;
}

function isInactiveConditionalSpeedEffect(source: ResolvedFeatureSource) {
  const normalizedDescription = source.description.toLowerCase();
  const normalizedSourceIndex = source.sourceIndex.toLowerCase();
  const isExplicitlyActiveSource =
    normalizedSourceIndex.endsWith("-active") ||
    source.title.toLowerCase().includes("(active)");

  if (isExplicitlyActiveSource) {
    return false;
  }

  return (
    normalizedSourceIndex === "large-form" ||
    normalizedSourceIndex === "charger" ||
    /\bfor that (?:action|duration)\b/.test(normalizedDescription) ||
    /\bwhile [^.]*\bis active\b/.test(normalizedDescription)
  );
}

function chooseArmorClassMode(
  currentMode: DerivedArmorClassMode,
  nextMode: DerivedArmorClassMode,
): DerivedArmorClassMode {
  if (currentMode === "bard_dance_unarmored" || nextMode === "bard_dance_unarmored") {
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

function inferPassiveEffectFromDescription(description: string): PassiveEffect | null {
  const effect: PassiveEffect = {};
  const normalizedDescription = description.toLowerCase();

  if (
    /\badd your proficiency bonus to (?:the )?initiative\b/i.test(description) ||
    /\badd your proficiency bonus to the roll\b/i.test(description) && /\binitiative\b/i.test(description)
  ) {
    effect.initiativeProficiencyBonusMultiplier = 1;
  }

  if (
    normalizedDescription.includes(
      "armor class equals 10 plus your dexterity modifier and constitution modifier",
    )
  ) {
    effect.armorClassMode = "barbarian_unarmored";
  }

  if (
    normalizedDescription.includes(
      "armor class equals 10 plus your dexterity and charisma modifiers",
    ) ||
    normalizedDescription.includes(
      "armor class equals 10 plus your dexterity modifier and charisma modifier",
    )
  ) {
    effect.armorClassMode = "bard_dance_unarmored";
  }

  if (
    normalizedDescription.includes("armor class equals 13 plus your dexterity modifier") ||
    normalizedDescription.includes("base ac of 13 + your dexterity modifier")
  ) {
    effect.armorClassBase = 13;
  }

  const armorClassBonusMatch = normalizedDescription.match(/\+(\d+)\s+bonus to armor class/);

  if (armorClassBonusMatch) {
    effect.armorClassBonus = Number.parseInt(armorClassBonusMatch[1] ?? "0", 10);
  }

  const rangedAttackBonusMatch = normalizedDescription.match(
    /\+(\d+)\s+bonus to attack rolls you make with ranged weapons?/,
  );

  if (rangedAttackBonusMatch) {
    effect.rangedAttackBonus = Number.parseInt(rangedAttackBonusMatch[1] ?? "0", 10);
  }

  const oneHandedMeleeDamageMatch = normalizedDescription.match(
    /\+(\d+)\s+bonus to damage rolls with that weapon/,
  );

  if (
    oneHandedMeleeDamageMatch &&
    normalizedDescription.includes("one hand") &&
    normalizedDescription.includes("no other weapons")
  ) {
    effect.oneHandedMeleeDamageBonus = Number.parseInt(
      oneHandedMeleeDamageMatch[1] ?? "0",
      10,
    );
  }

  const initiativeBonusMatch = normalizedDescription.match(/\+(\d+)\s+bonus to initiative/);

  if (initiativeBonusMatch) {
    effect.initiativeBonus = Number.parseInt(initiativeBonusMatch[1] ?? "0", 10);
  }

  if (
    normalizedDescription.includes("can add half your proficiency bonus to initiative") ||
    (normalizedDescription.includes("half your proficiency bonus") &&
      normalizedDescription.includes("initiative"))
  ) {
    effect.initiativeHalfProficiencyBonusMultiplier = 0.5;
  }

  if (
    normalizedDescription.includes("half your proficiency bonus") &&
    normalizedDescription.includes("ability checks") &&
    normalizedDescription.includes("skill proficiency you lack")
  ) {
    effect.skillCheckHalfProficiencyBonusMultiplier = 0.5;
  }

  const movementMatch = normalizedDescription.match(
    /speed increases(?: by)?\s+(\d+)\s+feet/,
  );

  if (movementMatch) {
    effect.speedBonus = Number.parseInt(movementMatch[1] ?? "0", 10);
  }

  const passivePerceptionMatch = normalizedDescription.match(
    /passive perception (?:score )?(?:increases by|bonus of)\s+(\d+)/,
  );

  if (passivePerceptionMatch) {
    effect.passivePerceptionBonus = Number.parseInt(
      passivePerceptionMatch[1] ?? "0",
      10,
    );
  }

  const passiveInvestigationMatch = normalizedDescription.match(
    /passive investigation (?:score )?(?:increases by|bonus of)\s+(\d+)/,
  );

  if (passiveInvestigationMatch) {
    effect.passiveInvestigationBonus = Number.parseInt(
      passiveInvestigationMatch[1] ?? "0",
      10,
    );
  }

  const passiveInsightMatch = normalizedDescription.match(
    /passive insight (?:score )?(?:increases by|bonus of)\s+(\d+)/,
  );

  if (passiveInsightMatch) {
    effect.passiveInsightBonus = Number.parseInt(passiveInsightMatch[1] ?? "0", 10);
  }

  if (
    normalizedDescription.includes("bonus to saving throws equal to your charisma modifier") ||
    normalizedDescription.includes("saving throws equal to your charisma modifier")
  ) {
    effect.savingThrowAbilityModifier = "cha";
  }

  return hasPassiveEffectValues(effect) ? effect : null;
}

function mergePassiveEffects(
  registryEffect: PassiveEffect | null,
  inferredEffect: PassiveEffect | null,
) {
  if (!registryEffect && !inferredEffect) {
    return null;
  }

  const mergedEffect: PassiveEffect = {
    ...(registryEffect ?? {}),
    ...Object.fromEntries(
      Object.entries(inferredEffect ?? {}).filter(
        ([key]) => !(registryEffect && key in registryEffect),
      ),
    ),
  };

  return mergedEffect;
}

function hasPassiveEffectValues(effect: PassiveEffect) {
  return Object.values(effect).some((value) => value !== undefined && value !== null);
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
