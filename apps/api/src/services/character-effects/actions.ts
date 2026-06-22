import {
  dedupeActions,
  compareActionEntries,
  toTitleCase,
} from "./shared.js";
import type {
  ActionActivationType,
  CharacterActionCombatSummary,
  CharacterActionEntry,
  ResolvedFeatureSource,
} from "./types.js";

function inferActionEffects(source: ResolvedFeatureSource): CharacterActionEntry[] {
  const activationType = inferActivationType(source.description);

  if (activationType === null) {
    return [];
  }

  return [
    {
      activationType,
      combat: inferCombatSummary(source, activationType),
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:action:${activationType}`,
      level: source.level,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: source.title,
    },
  ];
}

function deriveActionEntries(activeSources: ResolvedFeatureSource[]) {
  return dedupeActions(activeSources.flatMap(inferActionEffects)).sort(compareActionEntries);
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

function inferCombatSummary(
  source: ResolvedFeatureSource,
  activationType: ActionActivationType,
): CharacterActionCombatSummary | null {
  if (activationType !== "attack" && activationType !== "action") {
    return null;
  }

  const breathWeaponSummary = inferBreathWeaponSummary(source.description);

  if (breathWeaponSummary) {
    return {
      ...breathWeaponSummary,
      subtitle: "Species Trait",
    };
  }

  const attackRollSummary = inferAttackRollSummary(source.description);

  if (attackRollSummary) {
    return attackRollSummary;
  }

  return null;
}

function inferBreathWeaponSummary(description: string): CharacterActionCombatSummary | null {
  const normalized = description.toLowerCase();

  if (!normalized.includes("breath weapon")) {
    return null;
  }

  const damageMatch = normalized.match(/takes\s+(\d+d\d+)\s+([a-z]+)\s+damage/);
  const saveMatch = description.match(/make a ([A-Za-z]+) saving throw \(DC 8 plus your ([A-Za-z]+) modifier and Proficiency Bonus\)/i);
  const coneMatch = description.match(/(\d+)-foot Cone/i);
  const lineMatch = description.match(/(\d+)-foot Line/i);

  const rangeParts = [
    coneMatch ? `${coneMatch[1]} ft. cone` : null,
    lineMatch ? `${lineMatch[1]} ft. line` : null,
  ].filter(isPresent);

  const saveAbility = saveMatch ? toAbbreviation(saveMatch[1]) : null;
  const scalingMatch = description.match(/This damage increases by ([^.]+)/i);
  const damage =
    damageMatch
      ? `${damageMatch[1]} ${toTitleCase(damageMatch[2])}${scalingMatch ? ` (${normalizeInlineSentence(scalingMatch[1])})` : ""}`
      : scalingMatch
        ? normalizeInlineSentence(scalingMatch[1])
        : null;

  return {
    damage,
    hit: saveAbility ? `DC 8 + ${saveAbility} + Prof.` : "DC 8 + ability + Prof.",
    notes: "Save for half damage",
    range: rangeParts.length > 0 ? rangeParts.join(" / ") : null,
  };
}

function inferAttackRollSummary(description: string): CharacterActionCombatSummary | null {
  const normalized = description.toLowerCase();

  if (!normalized.includes("attack roll")) {
    return null;
  }

  const damageMatch = normalized.match(/deal[s]?\s+(\d+d\d+|\d+)\s+([a-z]+)\s+damage/);
  const meleeMatch = /\bmelee\b/i.test(description);
  const rangedMatch = /\branged\b/i.test(description);

  return {
    damage: damageMatch ? `${damageMatch[1]} ${toTitleCase(damageMatch[2])}` : null,
    hit: "Attack roll",
    notes: null,
    range: meleeMatch ? "5 ft." : rangedMatch ? "Ranged" : null,
  };
}

function toAbbreviation(value: string) {
  switch (value.trim().toLowerCase()) {
    case "strength":
      return "STR";
    case "dexterity":
      return "DEX";
    case "constitution":
      return "CON";
    case "intelligence":
      return "INT";
    case "wisdom":
      return "WIS";
    case "charisma":
      return "CHA";
    default:
      return value.trim().toUpperCase().slice(0, 3);
  }
}

function normalizeInlineSentence(value: string) {
  return value.replace(/\s+/g, " ").trim().replace(/\.$/, "");
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export { deriveActionEntries };
