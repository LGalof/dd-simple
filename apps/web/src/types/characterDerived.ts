import type { CharacterActionEntry } from "./characterAction";
import type { CharacterDefenseEntry } from "./characterDefense";

type DerivedArmorClassMode =
  | "base"
  | "barbarian_unarmored"
  | "bard_dance_unarmored";

type CharacterDerivedStats = {
  armorClassBonus: number;
  armorClassMode: DerivedArmorClassMode;
  initiativeBonus: number;
  oneHandedMeleeDamageBonus: number;
  passiveInsightBonus: number;
  passiveInvestigationBonus: number;
  passivePerceptionBonus: number;
  proficiencyBonus: number;
  rangedAttackBonus: number;
  savingThrowBonus: number;
  skillCheckHalfProficiencyBonusMultiplier: number;
  speedBonus: number;
  strengthMinimum: number | null;
};

type CharacterSpellEntry = {
  description: string;
  id: string;
  isCantrip: boolean;
  kind: "always_prepared" | "spell_feature" | "spellcasting";
  level: number | null;
  preparationMode: "always_prepared" | "feature" | "known" | "prepared" | "spellcasting";
  spellLevel: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait" | "subclass_feature" | "item";
  title: string;
};

type CharacterResourceEntry = {
  automationNote: string;
  category: "action" | "bonus action" | "reaction" | "passive" | "resource";
  id: string;
  level: number | null;
  maxUses?: string;
  maxUsesValue?: number | null;
  name: string;
  recharge?: string;
  resourceKey: string;
  sourceFeature: string;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait" | "subclass_feature" | "item";
  trackingMode: "none" | "pool" | "uses";
};

type CharacterDerivedSource = {
  description: string;
  level: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait" | "subclass_feature" | "item";
  title: string;
};

type CharacterDerivedState = {
  actions: CharacterActionEntry[];
  activeSources: CharacterDerivedSource[];
  defenses: CharacterDefenseEntry[];
  resources: CharacterResourceEntry[];
  selectedSubclassIndex: string | null;
  selectedSubspeciesIndex: string | null;
  spells: CharacterSpellEntry[];
  stats: CharacterDerivedStats;
};

export type {
  CharacterDerivedSource,
  CharacterDerivedState,
  CharacterDerivedStats,
  CharacterResourceEntry,
  CharacterSpellEntry,
  DerivedArmorClassMode,
};
