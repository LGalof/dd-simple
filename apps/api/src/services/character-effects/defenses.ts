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

  addSpellDamageResistance(entries, seen, source);
  addSavingThrowAdvantageEntries(entries, seen, source);
  addContextualDamageResistance(entries, seen, source);
  addNatureWardResistance(entries, seen, source);
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
  const isRageActive = activeSources.some(
    (source) => source.sourceIndex.toLowerCase() === "rage-active",
  );

  return dedupeDefenses(
    activeSources
      .filter((source) => shouldShowInDefensePanel(source, isRageActive))
      .flatMap(inferDefenseEffects),
  ).sort(compareDefenseEntries);
}

function shouldShowInDefensePanel(source: ResolvedFeatureSource, isRageActive: boolean) {
  // A Rage-dependent defense is only available while the character has enabled Rage.
  // Other class and subclass defenses are permanent or already include their own
  // condition in the displayed target.
  const isRageDependent =
    source.sourceIndex.toLowerCase() === "rage" ||
    /\bwhile (?:your )?rage is active\b/i.test(source.description);

  return !isRageDependent || isRageActive;
}

function addSpellDamageResistance(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
) {
  if (!hasSpellDamageResistance(source.description)) {
    return;
  }

  pushDefenseEntry(entries, seen, createDefenseEntry(source, "resistance", "Spell Damage"));
}

function addSavingThrowAdvantageEntries(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
) {
  if (/advantage on death saving throws/i.test(source.description)) {
    pushDefenseEntry(
      entries,
      seen,
      createDefenseEntry(source, "saving_throw_advantage", "Death Saving Throws"),
    );
  }

  const pattern = /advantage on saving throws against ([^.]+?)(?=\s*(?:\.|;|, and\s+you\s+(?:have|gain)|$))/gi;

  [...source.description.matchAll(pattern)].forEach((match) => {
    const target = formatSavingThrowAdvantageTarget(match[1] ?? "");

    if (target) {
      pushDefenseEntry(entries, seen, createDefenseEntry(source, "saving_throw_advantage", target));
    }
  });

  const avoidOrEndPattern = /advantage on saving throws(?: you make| made)? to (avoid or end|avoid|end) (?:the )?([^.]+?) condition/gi;

  [...source.description.matchAll(avoidOrEndPattern)].forEach((match) => {
    const action = match[1]?.trim();
    const conditions = extractConditionTargets(match[2] ?? "");

    conditions.forEach((condition) => {
      if (action) {
        pushDefenseEntry(
          entries,
          seen,
          createDefenseEntry(source, "saving_throw_advantage", `To ${formatSavingThrowAction(action)} ${condition}`),
        );
      }
    });
  });
}

function addContextualDamageResistance(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
) {
  const pattern = /(?:resistance|resistant) to damage from ([^.]+?)(?:\.|$)/gi;

  [...source.description.matchAll(pattern)].forEach((match) => {
    const sourceOfDamage = match[1]?.trim();

    if (sourceOfDamage) {
      pushDefenseEntry(
        entries,
        seen,
        createDefenseEntry(source, "resistance", `Damage from ${sourceOfDamage}`),
      );
    }
  });
}

function addNatureWardResistance(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
) {
  if (!/resistance to a damage type associated with your current land choice/i.test(source.description)) {
    return;
  }

  pushDefenseEntry(
    entries,
    seen,
    createDefenseEntry(source, "resistance", "Current Land Choice Damage Type"),
  );
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
    const targets = extractDamageTargets(match[1] ?? "").map((target) =>
      target === "All Damage" && kind === "resistance" && hasSpellDamageResistance(source.description)
        ? "Spell Damage"
        : target,
    );

    targets.forEach((target) => {
      pushDefenseEntry(entries, seen, createDefenseEntry(source, kind, target));
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
      pushDefenseEntry(entries, seen, createDefenseEntry(source, "condition_immunity", target));
    });
  });
}

function createDefenseEntry(
  source: ResolvedFeatureSource,
  kind: CharacterDefenseKind,
  target: string,
): Omit<CharacterDefenseEntry, "id"> {
  return {
    description: source.description,
    kind,
    level: source.level,
    sourceIndex: source.sourceIndex,
    sourceType: source.sourceType,
    target: `${target}${getDefenseConditionSuffix(source.description)}`,
    title: source.title,
  };
}

function hasSpellDamageResistance(description: string) {
  return /(?:resistance|resistant) (?:to|against) (?:all |the )?damage (?:of|from) spells\b/i.test(
    description,
  );
}

function formatSavingThrowAdvantageTarget(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  return `Against ${capitalizeFirst(normalized)}`;
}

function capitalizeFirst(value: string) {
  return value.length > 0 ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value;
}

function formatSavingThrowAction(value: string) {
  return value
    .replace(/\b(avoid|end)\b/gi, (word) => capitalizeFirst(word.toLowerCase()))
    .replace(/\bOr\b/g, "or");
}

function getDefenseConditionSuffix(description: string) {
  const leadingCondition = description.match(/(?:^|[.!?]\s*)while ([^,.]+),/i);

  if (leadingCondition?.[1]) {
    return ` while ${leadingCondition[1].trim()}`;
  }

  const trailingCondition = description.match(/\bwhile ([^,.]+?)(?:,|\.|$)/i);

  return trailingCondition?.[1] ? ` while ${trailingCondition[1].trim()}` : "";
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
