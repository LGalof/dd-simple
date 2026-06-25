export type AppName = "dd-simple";

export {
  allAbilityScoreKeys,
  buildFeatAbilityBonuses,
  getFeatAbilityChoiceFieldIds,
  getFeatAbilityRule,
} from "./featAbilityRules.js";
export type { FeatAbilityRule } from "./featAbilityRules.js";

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

export type HitPointAdjustmentMode = "heal" | "damage";

export type HitPointAdjustmentInput = {
  amount: number;
  currentHp: number;
  maxHp: number;
  mode: HitPointAdjustmentMode;
  tempHp: number;
};

export type HitPointAdjustmentResult = {
  currentHp: number;
  tempHp: number;
};

export function applyHitPointAdjustment({
  amount,
  currentHp,
  maxHp,
  mode,
  tempHp,
}: HitPointAdjustmentInput): HitPointAdjustmentResult {
  const normalizedAmount = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  const normalizedMaxHp = Math.max(0, Math.floor(Number.isFinite(maxHp) ? maxHp : 0));
  const normalizedCurrentHp = Math.max(
    0,
    Math.min(normalizedMaxHp, Math.floor(Number.isFinite(currentHp) ? currentHp : 0)),
  );
  const normalizedTempHp = Math.max(0, Math.floor(Number.isFinite(tempHp) ? tempHp : 0));

  if (mode === "heal") {
    return {
      currentHp: Math.min(normalizedMaxHp, normalizedCurrentHp + normalizedAmount),
      tempHp: normalizedTempHp,
    };
  }

  const absorbedByTempHp = Math.min(normalizedTempHp, normalizedAmount);
  const remainingDamage = normalizedAmount - absorbedByTempHp;

  return {
    currentHp: Math.max(0, normalizedCurrentHp - remainingDamage),
    tempHp: normalizedTempHp - absorbedByTempHp,
  };
}

export type InventoryItem = {
  id: string;
  characterId?: string;
  customName?: string | null;
  quantity: number;
  equipped: boolean;
  equipmentIndex?: string;
  gridX?: number | null;
  gridY?: number | null;
  notes?: string | null;
  equipment: {
    costQuantity?: number | null;
    costUnit?: string | null;
    description?: string | null;
    equipmentCategory?: string | null;
    index?: string;
    itemType?: string | null;
    name: string;
    weight?: number | null;
  };
};

export type DiceRoll = {
  id: string;
  characterId?: string;
  rolledByUserId?: string;
  rollType: string;
  targetType?: string | null;
  targetIndex?: string | null;
  formula: string;
  rollMode?: string;
  rollValues?: unknown;
  modifier?: number;
  total: number;
  reason: string | null;
  visibility?: string;
  rolledAt?: string;
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
  choiceType?: string;
  characterId?: string;
  featureId?: string;
  fieldId?: string;
  id?: string;
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
  subclassIndex?: string | null;
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
  choices?: CharacterFeatureSelection[];
  proficiencies?: CharacterProficiency[];
  languages?: CharacterLanguage[];
  conditions?: CharacterCondition[];
  hitPointState?: CharacterHitPointState | null;
  featureChoices?: CharacterFeatureChoiceSelection[];
  inventory: InventoryItem[];
  diceRolls: DiceRoll[];
};

export type CharacterSavePayload = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  subclassIndex?: string | null;
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
