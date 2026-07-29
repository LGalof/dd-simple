import {
  compareDefenseEntries,
  conditionTypes,
  damageTypes,
  dedupeDefenses,
  toTitleCase,
} from "./shared.js";
import type {
  CharacterDefenseEntry,
  CharacterDefenseKind,
  ResolvedFeatureSource,
} from "./types.js";

function inferDefenseEffects(source: ResolvedFeatureSource) {
  const entries: CharacterDefenseEntry[] = [];
  const seen = new Set<string>();

  addDamageDefenseEntries(entries, seen, source, "resistance", /resistance to ([^.]+?) damage/gi);
  addDamageDefenseEntries(entries, seen, source, "resistance", /resistant to ([^.]+?) damage/gi);
  addDamageDefenseEntries(entries, seen, source, "immunity", /immunity to ([^.]+?) damage/gi);
  addDamageDefenseEntries(entries, seen, source, "immunity", /immune to ([^.]+?) damage/gi);
  addDamageDefenseEntries(entries, seen, source, "vulnerability", /vulnerability to ([^.]+?) damage/gi);
  addHeavyArmorMasterReduction(entries, seen, source);
  addWildHeartBearResistance(entries, seen, source);
  addNightSpiritResistance(entries, seen, source);
  addConditionDefenseEntries(
    entries,
    seen,
    source,
    /immunity to (?:the )?([^.]+?) condition/gi,
  );
  addConditionDefenseEntries(
    entries,
    seen,
    source,
    /immune to (?:the )?([^.]+?) condition/gi,
  );
  addConditionDefenseEntries(
    entries,
    seen,
    source,
    /immune to being ([^.]+?)(?: while| when|\.|,)/gi,
  );
  addConditionDefenseEntries(
    entries,
    seen,
    source,
    /can't be ([^.]+?)(?: while| when|\.|,)/gi,
  );

  return entries;
}

function addWildHeartBearResistance(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
) {
  const normalizedDescription = source.description.toLowerCase();

  if (
    source.sourceIndex.toLowerCase() !== "rage-of-the-wilds" ||
    !normalizedDescription.includes("resistance to every damage type except")
  ) {
    return;
  }

  pushDefenseEntry(entries, seen, {
    description: source.description,
    kind: "resistance",
    level: source.level,
    sourceIndex: source.sourceIndex,
    sourceType: source.sourceType,
    target: "All except Force, Necrotic, Psychic, Radiant while raging",
    title: "Rage of the Wilds: Bear",
  });
}

function addNightSpiritResistance(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
) {
  if (source.sourceIndex.toLowerCase() !== "boon-of-the-night-spirit") {
    return;
  }

  pushDefenseEntry(entries, seen, {
    description: source.description,
    kind: "resistance",
    level: source.level,
    sourceIndex: source.sourceIndex,
    sourceType: source.sourceType,
    target: "All except Psychic and Radiant while in Dim Light or Darkness",
    title: "Boon of the Night Spirit: Shadowy Form",
  });
}

function addHeavyArmorMasterReduction(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
) {
  const normalizedDescription = source.description.toLowerCase();

  if (
    !normalizedDescription.includes("heavy armor") ||
    !normalizedDescription.includes("bludgeoning") ||
    !normalizedDescription.includes("piercing") ||
    !normalizedDescription.includes("slashing") ||
    !normalizedDescription.includes("proficiency bonus")
  ) {
    return;
  }

  pushDefenseEntry(entries, seen, {
    description: source.description,
    kind: "damage_reduction",
    level: source.level,
    sourceIndex: source.sourceIndex,
    sourceType: source.sourceType,
    target: "Bludgeoning, Piercing, Slashing by PB while wearing Heavy Armor",
    title: source.title,
  });
}

function deriveDefenseEntries(activeSources: ResolvedFeatureSource[]) {
  return dedupeDefenses(
    activeSources
      .filter(shouldShowInDefensePanel)
      .flatMap(inferDefenseEffects),
  ).sort(compareDefenseEntries);
}

function shouldShowInDefensePanel(source: ResolvedFeatureSource) {
  // Class and subclass features are already represented by feature/action/resource
  // tabs. The Defense panel should stay focused on innate and equipped defenses.
  return source.sourceType !== "class_feature" && source.sourceType !== "subclass_feature";
}

function addDamageDefenseEntries(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
  kind: Extract<CharacterDefenseKind, "immunity" | "resistance" | "vulnerability">,
  pattern: RegExp,
) {
  if (source.sourceIndex.toLowerCase() === "boon-of-the-night-spirit") {
    return;
  }

  const matches = [...source.description.matchAll(pattern)];

  matches.forEach((match) => {
    const targets = extractDamageTargets(match[1] ?? "");

    targets.forEach((target) => {
      pushDefenseEntry(entries, seen, {
        description: source.description,
        kind,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        target,
        title: source.title,
      });
    });
  });
}

function addConditionDefenseEntries(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
  pattern: RegExp,
) {
  const matches = [...source.description.matchAll(pattern)];

  matches.forEach((match) => {
    const targets = extractConditionTargets(match[1] ?? "");

    targets.forEach((target) => {
      pushDefenseEntry(entries, seen, {
        description: source.description,
        kind: "condition_immunity",
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        target,
        title: source.title,
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

export { deriveDefenseEntries };
