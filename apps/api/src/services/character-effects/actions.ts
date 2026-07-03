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
  const normalizedSourceIndex = source.sourceIndex.toLowerCase();

  if (normalizedSourceIndex === "barbarian-brutal-strike") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: "1d10 same type",
          hit: "Strength attack roll",
          notes: "Forgo Reckless Attack Advantage; choose Forceful Blow or Hamstring Blow",
          range: null,
          subtitle: "Class Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:attack`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "frenzy") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: "Rage Damage bonus d6s",
          hit: "Strength attack roll",
          notes: "Requires Reckless Attack while Rage is active; first target hit on your turn",
          range: null,
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:attack`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "barbarian-improved-brutal-strike-2") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: "2d10 same type",
          hit: "Strength attack roll",
          notes: "Use two different Brutal Strike effects",
          range: null,
          subtitle: "Class Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:attack`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "power-of-the-wilds") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: null,
          hit: "Melee attack",
          notes: "Ram option: Large or smaller target can gain the Prone condition while Rage is active",
          range: "Melee",
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:attack`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "branches-of-the-tree") {
    return [
      {
        activationType: "reaction",
        combat: {
          damage: null,
          hit: "DC 8 + STR + Prof.",
          notes: "Strength save; teleport target near you and optionally reduce Speed to 0",
          range: "30 ft.",
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:reaction`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "battering-roots") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: null,
          hit: "Heavy or Versatile melee weapon",
          notes: "+10 ft. reach on your turn; add Push or Topple mastery",
          range: "+10 ft. reach",
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:attack`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "travel-along-the-tree") {
    return [
      {
        activationType: "bonus_action",
        combat: null,
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:bonus_action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

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

  const savingThrowSummary = inferSavingThrowSummary(source.description);

  if (savingThrowSummary) {
    return savingThrowSummary;
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

  const saveAbility = saveMatch ? toAbbreviation(saveMatch[2]) : null;
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

function inferSavingThrowSummary(description: string): CharacterActionCombatSummary | null {
  const saveMatch = description.match(
    /make a ([A-Za-z]+) saving throw \(DC 8 plus your ([A-Za-z]+) modifier and Proficiency Bonus\)/i,
  );
  const genericSaveMatch = description.match(/make a ([A-Za-z]+) saving throw/i);
  const damageMatch = description.match(/takes?\s+(\d+d\d+|\d+)\s+([A-Za-z]+)\s+damage/i);
  const range = inferActionRange(description);

  if (!saveMatch && !genericSaveMatch && !damageMatch) {
    return null;
  }

  const saveAbility = saveMatch ? toAbbreviation(saveMatch[2]) : null;
  const defenseAbility = saveMatch?.[1] ?? genericSaveMatch?.[1] ?? null;
  const notes: string[] = [];

  if (defenseAbility) {
    notes.push(`${toTitleCase(defenseAbility)} save`);
  }

  if (
    /half as much damage on a successful save/i.test(description) ||
    /on a successful save[^.]*half as much damage/i.test(description)
  ) {
    notes.push("Save for half damage");
  }

  return {
    damage: damageMatch ? `${damageMatch[1]} ${toTitleCase(damageMatch[2])}` : null,
    hit: saveAbility ? `DC 8 + ${saveAbility} + Prof.` : defenseAbility ? `${toTitleCase(defenseAbility)} save` : null,
    notes: notes.length > 0 ? notes.join(" • ") : null,
    range,
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

function inferActionRange(description: string) {
  const coneMatch = description.match(/(\d+)-foot Cone/i);
  const lineMatch = description.match(/(\d+)-foot Line/i);
  const radiusMatch = description.match(/(\d+)-foot radius/i);
  const rangeMatch = description.match(/within (\d+)\s*feet/i);
  const rangeParts = [
    coneMatch ? `${coneMatch[1]} ft. cone` : null,
    lineMatch ? `${lineMatch[1]} ft. line` : null,
    radiusMatch ? `${radiusMatch[1]} ft. radius` : null,
    !coneMatch && !lineMatch && !radiusMatch && rangeMatch ? `${rangeMatch[1]} ft.` : null,
  ].filter(isPresent);

  return rangeParts.length > 0 ? rangeParts.join(" / ") : null;
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
