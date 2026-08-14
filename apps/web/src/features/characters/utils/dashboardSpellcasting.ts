import type {
  ClassOption,
  ClassSpellcastingLevelSummary,
  ClassSubclassOption,
} from "../types/characterBuilder";
import type { AbilityScores, Character } from "../../../types/character";

type SpellcastingSummary = {
  abilityLabel: string;
  attackBonus: number;
  castingType: string;
  knownPrepared: Array<{
    label: string;
    value: string;
  }>;
  notes: string[];
  proficiencyBonus: number;
  saveDc: number;
  slotLevels: Array<{
    level: number;
    max: number;
  }>;
  slotsAvailable: boolean;
  slotsUnavailableReason: string;
};

const spellcastingAbilityFallbacks: Record<string, keyof AbilityScores> = {
  bard: "cha",
  cleric: "wis",
  wizard: "int",
};

const spellcastingTypeFallbacks: Record<string, SpellcastingSummary["castingType"]> = {
  bard: "Full caster",
  cleric: "Full caster",
  wizard: "Full caster",
};

const fullCasterSlotProgression: Array<{ cantripsKnown: number; spellSlots: number[] }> = [
  { cantripsKnown: 3, spellSlots: [2] },
  { cantripsKnown: 3, spellSlots: [3] },
  { cantripsKnown: 3, spellSlots: [4, 2] },
  { cantripsKnown: 4, spellSlots: [4, 3] },
  { cantripsKnown: 4, spellSlots: [4, 3, 2] },
  { cantripsKnown: 4, spellSlots: [4, 3, 3] },
  { cantripsKnown: 4, spellSlots: [4, 3, 3, 1] },
  { cantripsKnown: 4, spellSlots: [4, 3, 3, 2] },
  { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
];

const wizardPreparedSpellsByLevel = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15,
  16, 16, 17, 18, 19, 21, 22, 23, 24, 25,
];

const bardPreparedSpellsByLevel = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15,
  16, 16, 17, 18, 19, 21, 22, 23, 24, 25,
];

const arcaneTricksterSlotProgression: number[][] = [
  [],
  [],
  [2],
  [3],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
];

const arcaneTricksterPreparedSpellsByLevel = [
  0,
  0,
  3,
  4,
  4,
  4,
  5,
  6,
  6,
  7,
  8,
  8,
  9,
  10,
  10,
  11,
  11,
  11,
  12,
  13,
];

const abilityScoreIndexAliases: Record<string, keyof AbilityScores> = {
  str: "str",
  strength: "str",
  dex: "dex",
  dexterity: "dex",
  con: "con",
  constitution: "con",
  int: "int",
  intelligence: "int",
  wis: "wis",
  wisdom: "wis",
  cha: "cha",
  charisma: "cha",
};

function getSpellcastingSummary(
  character: Character,
  classOption: ClassOption,
  selectedSubclass: ClassSubclassOption | null,
): SpellcastingSummary | null {
  const abilityIndex = getSpellcastingAbilityIndex(classOption, selectedSubclass);

  if (!abilityIndex) {
    return null;
  }

  const abilityScore = character.abilityScores.find(
    (score) => score.abilityIndex === abilityIndex,
  );
  const abilityValue = abilityScore?.score ?? 10;
  const abilityModifier = Math.floor((abilityValue - 10) / 2);
  const proficiencyBonus = getProficiencyBonus(character.level);
  const levelSummary = getCurrentSpellcastingLevel(
    classOption,
    selectedSubclass,
    character.level,
    abilityModifier,
  );
  const slotRows = (levelSummary?.spellSlots ?? []).map((slot) => ({
    level: slot.level,
    max: slot.slots,
  }));
  const knownPrepared = [
    levelSummary?.cantripsKnown !== undefined
      ? { label: "Cantrips Known", value: String(levelSummary.cantripsKnown) }
      : null,
    levelSummary?.spellsKnown !== undefined
      ? { label: "Spells Known", value: String(levelSummary.spellsKnown) }
      : null,
    levelSummary?.preparedSpells !== undefined
      ? { label: "Prepared Spells", value: String(levelSummary.preparedSpells) }
      : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry));

  return {
    abilityLabel: abilityScore?.ability.fullName ?? abilityIndex.toUpperCase(),
    attackBonus: abilityModifier + proficiencyBonus,
    castingType: getSpellcastingTypeLabel(classOption, selectedSubclass),
    knownPrepared,
    notes: getSpellcastingNotesForDisplay(classOption, selectedSubclass, character.level),
    proficiencyBonus,
    saveDc: 8 + abilityModifier + proficiencyBonus,
    slotLevels: slotRows,
    slotsAvailable: slotRows.length > 0,
    slotsUnavailableReason:
      "Spell slots are not available from the current reference data for this class level yet.",
  };
}

function getSpellcastingNotesForDisplay(
  classOption: ClassOption,
  selectedSubclass: ClassSubclassOption | null,
  characterLevel: number,
) {
  const baseNotes =
    classOption.index === "wizard"
      ? ["Prepare Wizard spells from your spellbook for which you have spell slots."]
      : classOption.spellcasting?.notes ?? [];

  return uniqueStrings([
    ...baseNotes,
    ...getSubclassSpellcastingNotes(selectedSubclass, characterLevel),
  ]);
}

function getSubclassSpellcastingNotes(
  selectedSubclass: ClassSubclassOption | null,
  characterLevel: number,
) {
  return (selectedSubclass?.features ?? [])
    .filter((feature) => feature.level <= characterLevel)
    .filter((feature) => `${feature.name} ${feature.description}`.toLowerCase().includes("spell"))
    .map((feature) => `${selectedSubclass?.name}: ${feature.name} - ${feature.description}`);
}

function getSpellcastingAbilityIndex(
  classOption: ClassOption,
  selectedSubclass: ClassSubclassOption | null,
): keyof AbilityScores | null {
  if (isArcaneTrickster(classOption, selectedSubclass)) {
    return "int";
  }

  const structuredAbilityIndex = canonicalAbilityScoreIndex(
    classOption.spellcasting?.abilityIndex ?? undefined,
  );

  return structuredAbilityIndex ?? spellcastingAbilityFallbacks[classOption.index] ?? null;
}

function getSpellcastingTypeLabel(
  classOption: ClassOption,
  selectedSubclass: ClassSubclassOption | null,
) {
  if (isArcaneTrickster(classOption, selectedSubclass)) {
    return "Third caster";
  }

  if (classOption.spellcasting?.castingType === "full-caster") {
    return "Full caster";
  }

  return spellcastingTypeFallbacks[classOption.index] ?? "Spellcaster";
}

function getCurrentSpellcastingLevel(
  classOption: ClassOption,
  selectedSubclass: ClassSubclassOption | null,
  characterLevel: number,
  spellcastingAbilityModifier: number,
): ClassSpellcastingLevelSummary | null {
  if (isArcaneTrickster(classOption, selectedSubclass)) {
    return getArcaneTricksterSpellcastingLevel(characterLevel);
  }

  const levels = classOption.spellcasting?.levels ?? [];
  const referenceLevel = [...levels].reverse().find((level) => level.level <= characterLevel);

  return (
    referenceLevel ??
    getFallbackSpellcastingLevel(
      classOption.index,
      characterLevel,
      spellcastingAbilityModifier,
    )
  );
}

function getArcaneTricksterSpellcastingLevel(
  characterLevel: number,
): ClassSpellcastingLevelSummary | null {
  const normalizedLevel = Math.max(1, Math.min(20, characterLevel));
  const spellSlots = arcaneTricksterSlotProgression[normalizedLevel - 1] ?? [];

  if (spellSlots.length === 0) {
    return null;
  }

  return {
    cantripsKnown: normalizedLevel >= 10 ? 4 : 3,
    level: normalizedLevel,
    preparedSpells: arcaneTricksterPreparedSpellsByLevel[normalizedLevel - 1] ?? 3,
    spellSlots: spellSlots.map((slots, index) => ({ level: index + 1, slots })),
  };
}

function isArcaneTrickster(
  classOption: ClassOption,
  selectedSubclass: ClassSubclassOption | null,
) {
  return classOption.index === "rogue" && selectedSubclass?.index === "arcane-trickster";
}

function getFallbackSpellcastingLevel(
  classIndex: string,
  characterLevel: number,
  spellcastingAbilityModifier: number,
): ClassSpellcastingLevelSummary | null {
  const normalizedLevel = Math.max(1, Math.min(20, characterLevel));
  const castingType = spellcastingTypeFallbacks[classIndex];

  if (castingType === "Full caster") {
    const progression = fullCasterSlotProgression[normalizedLevel - 1];

    return {
      cantripsKnown: progression.cantripsKnown,
      level: normalizedLevel,
      preparedSpells: getPreparedSpellFallback(
        classIndex,
        normalizedLevel,
        spellcastingAbilityModifier,
      ),
      spellSlots: progression.spellSlots.map((slots, index) => ({ level: index + 1, slots })),
    };
  }

  return null;
}

function getPreparedSpellFallback(
  classIndex: string,
  characterLevel: number,
  spellcastingAbilityModifier: number,
) {
  if (classIndex === "wizard") {
    return wizardPreparedSpellsByLevel[characterLevel - 1] ?? 4;
  }

  if (classIndex === "bard") {
    return bardPreparedSpellsByLevel[characterLevel - 1] ?? 4;
  }

  if (classIndex === "cleric") {
    return Math.max(1, characterLevel + spellcastingAbilityModifier);
  }

  return undefined;
}
function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();
    const normalizedValue = trimmedValue.toLowerCase();

    if (!trimmedValue || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    result.push(trimmedValue);
  }

  return result;
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

function canonicalAbilityScoreIndex(value: string | undefined) {
  if (!value) {
    return null;
  }

  return abilityScoreIndexAliases[value.trim().toLowerCase()] ?? null;
}

export { getSpellcastingSummary };
export type { SpellcastingSummary };
