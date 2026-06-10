export type AppName = "dd-simple";

export const APP_NAME: AppName = "dd-simple";

export type AbilityScoreKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type AbilityScores = Record<AbilityScoreKey, number>;

export type AbilityDefinition = {
  index: AbilityScoreKey | string;
  name: string;
  fullName?: string;
  description?: string | null;
};

export type AbilityScore = {
  abilityIndex: AbilityScoreKey | string;
  baseScore?: number | null;
  score: number;
  ability: AbilityDefinition;
};

export type CharacterSkill = {
  skillIndex: string;
  isProficient: boolean;
  customBonus: number;
  skill: {
    name: string;
    ability: AbilityDefinition;
  };
};

export type CharacterProficiency = {
  proficiencyIndex: string;
  sourceType: string | null;
  proficiency: {
    index: string;
    name: string;
    type: string;
  };
};

export type CharacterLanguage = {
  id: string;
  languageIndex: string;
  sourceType: string;
  sourceIndex: string | null;
  language: {
    index: string;
    name: string;
    description?: string | null;
  };
};

export type CharacterCondition = {
  id: string;
  conditionIndex: string;
  notes: string | null;
  appliedAt: string;
  condition: {
    index: string;
    name: string;
    description?: string | null;
  };
};

export type HitPointCalculationMode = "fixed" | "rolled" | "override";

export type CharacterHitPointState = {
  id?: string;
  characterId?: string;
  calculationMode: HitPointCalculationMode;
  bonusHp: number;
  overrideMaxHp: number | null;
  rolledHitPoints: number[];
  tempHp: number;
};

export type InventoryItem = {
  id: string;
  quantity: number;
  equipped: boolean;
  equipment: {
    name: string;
  };
};

export type DiceRoll = {
  id: string;
  rollType: string;
  formula: string;
  total: number;
  reason: string | null;
};

export type SpeciesDefinition = {
  index: string;
  name: string;
  size?: string | null;
  baseSpeed: number;
  description?: string | null;
  traits?: string[];
};

export type BackgroundDefinition = {
  index: string;
  name: string;
  description?: string | null;
  proficiencies?: string[];
  feature?: string | null;
};

export type ClassFeatureDefinition = {
  id: string;
  level: number;
  title: string;
  summary: string;
  details?: string[];
  choiceFields?: Array<{
    id: string;
    label: string;
    options: Array<{
      value: string;
      label: string;
    }>;
  }>;
};

export type ClassDefinition = {
  index: string;
  name: string;
  hitDie: number;
  description?: string | null;
  primaryAbility?: string | null;
  features?: ClassFeatureDefinition[];
};

export type CharacterFeatureSelection = {
  id?: string;
  characterId?: string;
  featureId?: string;
  fieldId?: string;
  choiceType?: string;
  sourceType?: string;
  sourceIndex?: string;
  selectedType?: string;
  selectedIndex: string;
};

export type CharacterFeatureChoiceSelection = {
  id?: string;
  characterId?: string;
  sourceType: string;
  sourceIndex: string;
  classIndex?: string | null;
  subclassIndex?: string | null;
  level?: number | null;
  featureIndex?: string | null;
  choicePath: string;
  choiceKey?: string | null;
  choiceLabel?: string | null;
  selectedOptionType: string;
  selectedOptionIndex?: string | null;
  selectedOptionName?: string | null;
  selectedOptionUrl?: string | null;
  selectedRawJson: unknown;
  grantsRawJson?: unknown | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CharacterSheetStats = {
  level: number;
  experiencePoints: number;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;
  proficiencyBonus?: number;
  initiative?: number;
  passivePerception?: number;
};

export type Character = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  speciesIndex?: string;
  classIndex?: string;
  backgroundIndex?: string;
  name: string;
  level: number;
  experiencePoints: number;
  alignment: string | null;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;
  species: Pick<SpeciesDefinition, "name">;
  class: Pick<ClassDefinition, "name">;
  background: Pick<BackgroundDefinition, "name">;
  abilityScores: AbilityScore[];
  skills: CharacterSkill[];
  proficiencies?: CharacterProficiency[];
  languages?: CharacterLanguage[];
  conditions?: CharacterCondition[];
  hitPointState?: CharacterHitPointState | null;
  choices?: CharacterFeatureSelection[];
  featureChoices?: CharacterFeatureChoiceSelection[];
  inventory: InventoryItem[];
  diceRolls: DiceRoll[];
};

export type CharacterSavePayload = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  alignment: string | null;
  level?: number;
  currentHp?: number;
  hitPointState?: CharacterHitPointState;
  skillIndexes: string[];
  choices?: CharacterFeatureSelection[];
  featureChoices?: CharacterFeatureChoiceSelection[];
  abilityScores: AbilityScores;
};
