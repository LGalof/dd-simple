type ActionActivationType = "attack" | "action" | "bonus_action" | "reaction" | "other";

type CharacterFeatureSourceType = "class_feature" | "species_trait" | "subclass_feature" | "item";

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
  | "damage_reduction"
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
  featureChoices?: CharacterFeatureChoiceRecord[];
  level?: number;
  resourceState?: {
    activeByResourceKey?: Record<string, boolean>;
  };
  speciesIndex?: string;
  subclassIndex?: string;
  subspeciesIndex?: string;
};

type DerivedArmorClassMode =
  | "base"
  | "barbarian_unarmored"
  | "bard_dance_unarmored"
  | "monk_unarmored";

type CharacterDerivedStats = {
  armorClassBonus: number;
  armorClassMode: DerivedArmorClassMode;
  initiativeBonus: number;
  passiveInsightBonus: number;
  passiveInvestigationBonus: number;
  passivePerceptionBonus: number;
  proficiencyBonus: number;
  rangedAttackBonus: number;
  savingThrowBonus: number;
  skillCheckHalfProficiencyBonusMultiplier: number;
  speedBonus: number;
  strengthMinimum: number | null;
  oneHandedMeleeDamageBonus: number;
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
  sourceType: CharacterFeatureSourceType;
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
  sourceType: CharacterFeatureSourceType;
  trackingMode: "none" | "pool" | "uses";
};

type DerivedCharacterState = {
  actions: CharacterActionEntry[];
  activeSources: ResolvedFeatureSource[];
  defenses: CharacterDefenseEntry[];
  resources: CharacterResourceEntry[];
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
  classIndex: string | null;
  choiceKey: string | null;
  choiceLabel: string | null;
  choicePath: string;
  featureIndex: string | null;
  grantsRawJson: unknown | null;
  level: number | null;
  selectedOptionIndex: string | null;
  selectedOptionName: string | null;
  selectedOptionType: string;
  selectedOptionUrl: string | null;
  selectedRawJson?: unknown;
  sourceIndex: string;
  sourceType: string;
  subclassIndex: string | null;
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
  subclass?: {
    index?: unknown;
  };
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
  armorClassBase?: number;
  armorClassMode?: DerivedArmorClassMode;
  initiativeHalfProficiencyBonusMultiplier?: number;
  initiativeBonus?: number;
  initiativeProficiencyBonusMultiplier?: number;
  oneHandedMeleeDamageBonus?: number;
  passiveInsightBonus?: number;
  passiveInvestigationBonus?: number;
  passivePerceptionBonus?: number;
  rangedAttackBonus?: number;
  savingThrowAbilityModifier?: "str" | "dex" | "con" | "int" | "wis" | "cha";
  skillCheckHalfProficiencyBonusMultiplier?: number;
  speedBonus?: number;
};

type PassiveEffectContext = {
  abilityScoresByIndex?: Record<string, number>;
  hasArmorEquipped?: boolean;
  hasHeavyArmorEquipped?: boolean;
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
  CharacterResourceEntry,
  CharacterSpellEntry,
  ClassSourceJson,
  DerivedArmorClassMode,
  DerivedCharacterState,
  FeatSourceJson,
  FeatureSourceJson,
  LevelSourceJson,
  PassiveEffect,
  PassiveEffectContext,
  ResolvedFeatureSource,
  RuleDocumentRecord,
  SubclassSourceJson,
  SubspeciesSourceJson,
  TraitSourceJson,
};
