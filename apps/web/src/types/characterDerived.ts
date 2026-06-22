import type { CharacterActionEntry } from "./characterAction";
import type { CharacterDefenseEntry } from "./characterDefense";

type DerivedArmorClassMode = "base" | "barbarian_unarmored" | "monk_unarmored";

type CharacterDerivedStats = {
  armorClassBonus: number;
  armorClassMode: DerivedArmorClassMode;
  initiativeBonus: number;
  passiveInsightBonus: number;
  passiveInvestigationBonus: number;
  passivePerceptionBonus: number;
  proficiencyBonus: number;
  speedBonus: number;
};

type CharacterSpellEntry = {
  description: string;
  id: string;
  kind: "always_prepared" | "spell_feature" | "spellcasting";
  level: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait" | "subclass_feature";
  title: string;
};

type CharacterDerivedSource = {
  description: string;
  level: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait" | "subclass_feature";
  title: string;
};

type CharacterDerivedState = {
  actions: CharacterActionEntry[];
  activeSources: CharacterDerivedSource[];
  defenses: CharacterDefenseEntry[];
  selectedSubclassIndex: string | null;
  selectedSubspeciesIndex: string | null;
  spells: CharacterSpellEntry[];
  stats: CharacterDerivedStats;
};

export type {
  CharacterDerivedSource,
  CharacterDerivedState,
  CharacterDerivedStats,
  CharacterSpellEntry,
  DerivedArmorClassMode,
};
