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
  druid: "wis",
  paladin: "cha",
  ranger: "wis",
  sorcerer: "cha",
  warlock: "cha",
  wizard: "int",
};

const spellcastingTypeFallbacks: Record<string, SpellcastingSummary["castingType"]> = {
  bard: "Full caster",
  cleric: "Full caster",
  druid: "Full caster",
  paladin: "Half caster",
  ranger: "Half caster",
  sorcerer: "Full caster",
  warlock: "Pact Magic",
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

const halfCasterSlotProgression: number[][] = [
  [2],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
];

const knownSpellFallbacks: Record<string, number[]> = {
  bard: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
};

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
  const abilityIndex = getSpellcastingAbilityIndex(classOption);

  if (!abilityIndex) {
    return null;
  }

  const abilityScore = character.abilityScores.find(
    (score) => score.abilityIndex === abilityIndex,
  );
  const abilityValue = abilityScore?.score ?? 10;
  const abilityModifier = Math.floor((abilityValue - 10) / 2);
  const proficiencyBonus = getProficiencyBonus(character.level);
  const levelSummary = getCurrentSpellcastingLevel(classOption, character.level);
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
    castingType: getSpellcastingTypeLabel(classOption),
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

function getSpellcastingAbilityIndex(classOption: ClassOption): keyof AbilityScores | null {
  const structuredAbilityIndex = canonicalAbilityScoreIndex(
    classOption.spellcasting?.abilityIndex ?? undefined,
  );

  return structuredAbilityIndex ?? spellcastingAbilityFallbacks[classOption.index] ?? null;
}

function getSpellcastingTypeLabel(classOption: ClassOption) {
  if (classOption.spellcasting?.castingType === "pact-magic") {
    return "Pact Magic";
  }

  if (classOption.spellcasting?.castingType === "half-caster") {
    return "Half caster";
  }

  if (classOption.spellcasting?.castingType === "full-caster") {
    return "Full caster";
  }

  return spellcastingTypeFallbacks[classOption.index] ?? "Spellcaster";
}

function getCurrentSpellcastingLevel(
  classOption: ClassOption,
  characterLevel: number,
): ClassSpellcastingLevelSummary | null {
  const levels = classOption.spellcasting?.levels ?? [];
  const referenceLevel = [...levels].reverse().find((level) => level.level <= characterLevel);

  return referenceLevel ?? getFallbackSpellcastingLevel(classOption.index, characterLevel);
}

function getFallbackSpellcastingLevel(
  classIndex: string,
  characterLevel: number,
): ClassSpellcastingLevelSummary | null {
  const normalizedLevel = Math.max(1, Math.min(20, characterLevel));
  const castingType = spellcastingTypeFallbacks[classIndex];

  if (castingType === "Full caster") {
    const progression = fullCasterSlotProgression[normalizedLevel - 1];

    return {
      cantripsKnown: progression.cantripsKnown,
      level: normalizedLevel,
      preparedSpells: getPreparedSpellFallback(classIndex, normalizedLevel),
      spellSlots: progression.spellSlots.map((slots, index) => ({ level: index + 1, slots })),
      spellsKnown: getKnownSpellFallback(classIndex, normalizedLevel),
    };
  }

  if (castingType === "Half caster") {
    const progression = halfCasterSlotProgression[normalizedLevel - 1] ?? [];

    return {
      level: normalizedLevel,
      preparedSpells: Math.max(1, Math.floor(normalizedLevel / 2) + 1),
      spellSlots: progression.map((slots, index) => ({ level: index + 1, slots })),
    };
  }

  if (castingType === "Pact Magic") {
    return {
      cantripsKnown: normalizedLevel < 4 ? 2 : normalizedLevel < 10 ? 3 : 4,
      level: normalizedLevel,
      spellSlots: [
        {
          level:
            normalizedLevel < 3
              ? 1
              : normalizedLevel < 5
                ? 2
                : normalizedLevel < 7
                  ? 3
                  : normalizedLevel < 9
                    ? 4
                    : 5,
          slots: normalizedLevel < 11 ? 2 : normalizedLevel < 17 ? 3 : 4,
        },
      ],
      spellsKnown: getKnownSpellFallback(classIndex, normalizedLevel),
    };
  }

  return null;
}

function getPreparedSpellFallback(classIndex: string, characterLevel: number) {
  if (["cleric", "druid", "wizard"].includes(classIndex)) {
    return Math.max(1, characterLevel + 3);
  }

  return undefined;
}

function getKnownSpellFallback(classIndex: string, characterLevel: number) {
  return knownSpellFallbacks[classIndex]?.[characterLevel - 1];
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
