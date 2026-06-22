type ActionActivationType = "attack" | "action" | "bonus_action" | "reaction" | "other";

type CharacterFeatureSourceType = "class_feature" | "species_trait" | "subclass_feature";

type CharacterActionCombatSummary = {
  damage?: string | null;
  hit?: string | null;
  notes?: string | null;
  range?: string | null;
  subtitle?: string | null;
};

type CharacterActionEntry = {
  activationType: ActionActivationType;
  combat?: CharacterActionCombatSummary | null;
  description: string;
  id: string;
  level: number | null;
  sourceIndex: string;
  sourceType: CharacterFeatureSourceType;
  title: string;
};

type CharacterDefenseKind =
  | "condition_immunity"
  | "immunity"
  | "resistance"
  | "vulnerability";

type CharacterDefenseEntry = {
  description: string;
  id: string;
  kind: CharacterDefenseKind;
  level: number | null;
  sourceIndex: string;
  sourceType: CharacterFeatureSourceType;
  target: string;
  title: string;
};

type CharacterFeatureEffectsOverrides = {
  backgroundIndex?: string;
  classIndex?: string;
  featIndexes?: string[];
  level?: number;
  speciesIndex?: string;
  subclassIndex?: string;
  subspeciesIndex?: string;
};

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
  sourceType: CharacterFeatureSourceType;
  title: string;
};

type DerivedCharacterState = {
  actions: CharacterActionEntry[];
  activeSources: ResolvedFeatureSource[];
  defenses: CharacterDefenseEntry[];
  selectedSubclassIndex: string | null;
  selectedSubspeciesIndex: string | null;
  spells: CharacterSpellEntry[];
  stats: CharacterDerivedStats;
};

type CharacterChoiceRecord = {
  choiceType: string;
  selectedIndex: string;
  selectedType: string;
  sourceIndex: string;
  sourceType: string;
};

type CharacterFeatureChoiceRecord = {
  choiceKey: string | null;
  choiceLabel: string | null;
  choicePath: string;
  selectedOptionIndex: string | null;
  selectedOptionName: string | null;
  selectedOptionType: string;
  selectedOptionUrl: string | null;
};

type RuleDocumentRecord = {
  index: string;
  name: string | null;
  sourceJson: unknown;
};

type ClassSourceJson = {
  spellcasting?: {
    info?: Array<{
      desc?: unknown[];
      name?: unknown;
    }>;
    spellcasting_ability?: {
      name?: unknown;
    };
  };
  subclasses?: Array<{
    index?: unknown;
  }>;
};

type LevelSourceJson = {
  class?: {
    index?: unknown;
  };
  features?: Array<{
    index?: unknown;
  }>;
  level?: unknown;
};

type FeatureSourceJson = {
  class?: {
    index?: unknown;
  };
  desc?: unknown;
  description?: unknown;
  feature_specific?: {
    type?: unknown;
  };
  level?: unknown;
  name?: unknown;
};

type TraitSourceJson = {
  desc?: unknown;
  description?: unknown;
  level?: unknown;
  name?: unknown;
};

type FeatSourceJson = {
  desc?: unknown;
  description?: unknown;
  name?: unknown;
};

type SubclassSourceJson = {
  class?: {
    index?: unknown;
  };
  features?: Array<{
    description?: unknown;
    level?: unknown;
    name?: unknown;
  }>;
  name?: unknown;
};

type SubspeciesSourceJson = {
  species?: {
    index?: unknown;
  };
  traits?: Array<{
    index?: unknown;
  }>;
};

type ResolvedFeatureSource = {
  description: string;
  level: number | null;
  sourceIndex: string;
  sourceType: CharacterFeatureSourceType;
  title: string;
};

type PassiveEffect = {
  armorClassBonus?: number;
  armorClassMode?: DerivedArmorClassMode;
  initiativeBonus?: number;
  initiativeProficiencyBonusMultiplier?: number;
  passiveInsightBonus?: number;
  passiveInvestigationBonus?: number;
  passivePerceptionBonus?: number;
  speedBonus?: number;
};

export type {
  ActionActivationType,
  CharacterActionCombatSummary,
  CharacterActionEntry,
  CharacterChoiceRecord,
  CharacterDefenseEntry,
  CharacterDefenseKind,
  CharacterDerivedStats,
  CharacterFeatureChoiceRecord,
  CharacterFeatureEffectsOverrides,
  CharacterFeatureSourceType,
  CharacterSpellEntry,
  ClassSourceJson,
  DerivedArmorClassMode,
  DerivedCharacterState,
  FeatSourceJson,
  FeatureSourceJson,
  LevelSourceJson,
  PassiveEffect,
  ResolvedFeatureSource,
  RuleDocumentRecord,
  SubclassSourceJson,
  SubspeciesSourceJson,
  TraitSourceJson,
};
