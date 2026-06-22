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
  addDamageDefenseEntries(entries, seen, source, "immunity", /immunity to ([^.]+?) damage/gi);
  addDamageDefenseEntries(entries, seen, source, "vulnerability", /vulnerability to ([^.]+?) damage/gi);
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

function deriveDefenseEntries(activeSources: ResolvedFeatureSource[]) {
  return dedupeDefenses(activeSources.flatMap(inferDefenseEffects)).sort(compareDefenseEntries);
}

function addDamageDefenseEntries(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
  kind: Extract<CharacterDefenseKind, "immunity" | "resistance" | "vulnerability">,
  pattern: RegExp,
) {
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
