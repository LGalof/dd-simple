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

  if (normalizedSourceIndex === "charger") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: "+1d8 or push",
          hit: "Melee hit after moving 10 ft.",
          notes: "Choose +1d8 damage or push the target up to 10 ft.; once per turn.",
          range: "Melee",
          subtitle: "General Feat",
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

  if (normalizedSourceIndex === "rogue-cunning-strike") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: "Forgo 1d6 Sneak Attack",
          hit: "Sneak Attack hit",
          notes: "Choose Poison, Trip, or Withdraw • save DC 8 + DEX + Prof.",
          range: "Attack target",
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

  if (normalizedSourceIndex === "rogue-improved-cunning-strike") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: "Forgo up to 2 Sneak Attack dice",
          hit: "Sneak Attack hit",
          notes: "Use up to two different Cunning Strike effects • save DC 8 + DEX + Prof.",
          range: "Attack target",
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

  if (normalizedSourceIndex === "rogue-devious-strikes") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: "Forgo 2d6–6d6 Sneak Attack",
          hit: "Sneak Attack hit",
          notes: "Daze, Knock Out, or Obscure • save DC 8 + DEX + Prof.",
          range: "Attack target",
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

  if (normalizedSourceIndex === "boon-of-combat-prowess") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: null,
          hit: "Miss becomes hit",
          notes: "Peerless Aim; once used, unavailable until the start of your next turn",
          range: null,
          subtitle: "Epic Boon",
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

  if (normalizedSourceIndex === "boon-of-fate") {
    return [
      {
        activationType: "other",
        combat: {
          damage: null,
          hit: "2d4 bonus or penalty",
          notes: "Apply to a D20 Test within 60 feet; refreshes on Initiative, Short Rest, or Long Rest",
          range: "60 ft.",
          subtitle: "Epic Boon",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:other`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "boon-of-irresistible-offense") {
    return [
      {
        activationType: "attack",
        combat: {
          damage: "Increased ability score",
          hit: "Natural 20",
          notes: "Bludgeoning, Piercing, and Slashing damage you deal ignores Resistance",
          range: null,
          subtitle: "Epic Boon",
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

  if (normalizedSourceIndex === "boon-of-the-night-spirit") {
    return [
      {
        activationType: "bonus_action",
        combat: {
          damage: null,
          hit: null,
          notes: "While within Dim Light or Darkness, become Invisible until you take an action, Bonus Action, or Reaction",
          range: null,
          subtitle: "Epic Boon",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:bonus_action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

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

  if (normalizedSourceIndex === "radiance-of-the-dawn") {
    return [
      {
        activationType: "action",
        combat: {
          damage: "2d10 + Cleric level Radiant",
          hit: "Constitution save",
          notes: "Channel Divinity; dispels magical Darkness in the 30-foot Emanation; save for half damage",
          range: "30 ft. emanation",
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "corona-of-light") {
    return [
      {
        activationType: "action",
        combat: {
          damage: null,
          hit: null,
          notes: "Bright Light 60 ft., Dim Light +30 ft.; enemies have Disadvantage on saves against Radiance of the Dawn and Fire or Radiant spells",
          range: "60 ft. bright / 90 ft. total",
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "blessing-of-the-trickster") {
    return [
      {
        activationType: "action",
        combat: {
          damage: null,
          hit: null,
          notes: "Grant Advantage on Dexterity (Stealth) checks until Long Rest or until you use this feature again",
          range: "30 ft.",
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "invoke-duplicity") {
    return [
      {
        activationType: "bonus_action",
        combat: {
          damage: null,
          hit: null,
          notes: "Expend Channel Divinity; create or move the illusion. Cast from its space and gain Advantage when distracting a nearby target.",
          range: "30 ft. create / 120 ft. move",
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:bonus_action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "tricksters-transposition") {
    return [
      {
        activationType: "bonus_action",
        combat: {
          damage: null,
          hit: null,
          notes: "When you create or move Invoke Duplicity, swap places with the illusion",
          range: null,
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:bonus_action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "guided-strike") {
    return [
      {
        activationType: "reaction",
        combat: {
          damage: null,
          hit: "+10 to missed attack roll",
          notes: "Expend Channel Divinity. Reaction required when benefiting another creature's attack roll.",
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

  if (normalizedSourceIndex === "war-priest") {
    return [
      {
        activationType: "bonus_action",
        combat: {
          damage: null,
          hit: "Weapon or Unarmed Strike",
          notes: "Make one attack as a Bonus Action; uses tracked separately",
          range: null,
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:bonus_action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "war-gods-blessing") {
    return [
      {
        activationType: "action",
        combat: {
          damage: null,
          hit: null,
          notes: "Expend Channel Divinity to cast Shield of Faith or Spiritual Weapon without a spell slot or Concentration",
          range: null,
          subtitle: "Subclass Feature",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: source.title,
      },
    ];
  }

  if (normalizedSourceIndex === "arcane-ward") {
    return [
      {
        activationType: "bonus_action",
        combat: null,
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:bonus_action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: "Arcane Ward: Restore Ward",
      },
    ];
  }

  if (normalizedSourceIndex === "projected-ward") {
    return [
      {
        activationType: "reaction",
        combat: {
          damage: null,
          hit: null,
          notes: "Arcane Ward absorbs damage for a creature you can see",
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

  if (normalizedSourceIndex === "improved-abjuration") {
    return [
      {
        activationType: "bonus_action",
        combat: null,
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:bonus_action`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: "Spell Breaker: Dispel Magic",
      },
    ];
  }

  if (normalizedSourceIndex === "channel-divinity") {
    return [
      {
        activationType: "action",
        combat: {
          damage: "1d8 + WIS (scales at Cleric 7, 13, 18)",
          hit: "Spell save DC",
          notes: "Constitution save; Necrotic or Radiant damage, save for half. Can heal instead.",
          range: "30 ft.",
          subtitle: "Channel Divinity",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:divine-spark`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: "Divine Spark",
      },
      {
        activationType: "action",
        combat: {
          damage: null,
          hit: "Spell save DC",
          notes: "Wisdom save; failed Undead are Frightened and Incapacitated for 1 minute",
          range: "30 ft.",
          subtitle: "Channel Divinity",
        },
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:action:turn-undead`,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: "Turn Undead",
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

  if (/\breaction\b/.test(normalized)) {
    return "reaction";
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
