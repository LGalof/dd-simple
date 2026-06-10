import type {
  AbilityDefinition,
  BackgroundDefinition,
  ClassFeatureDefinition,
  ClassDefinition,
  SpeciesDefinition,
} from "@dd-simple/shared";

type ReferenceAbilityScore = AbilityDefinition & {
  index: string;
  fullName: string;
};

type ReferenceSkill = {
  index: string;
  abilityIndex: string;
  name: string;
  description?: string | null;
  ability: ReferenceAbilityScore;
};

type ReferenceAlignment = {
  index: string;
  name: string;
  abbreviation?: string | null;
  description?: string | null;
  sourceJson?: unknown;
};

type ReferenceCondition = {
  index: string;
  name: string;
  description?: string | null;
  sourceJson?: unknown;
};

type ReferenceSpeciesTrait = {
  id: string;
  speciesIndex: string;
  traitIndex: string;
  name: string;
  description?: string | null;
  sourceJson?: unknown;
};

type ReferenceSpeciesSizeOption = {
  id: string;
  speciesIndex: string;
  size: string;
  sourceJson?: unknown;
};

type ReferenceSubspecies = {
  index: string;
  name: string;
  speciesIndex: string;
  description?: string | null;
  sourceJson?: unknown;
};

type ReferenceSpecies = Omit<SpeciesDefinition, "traits"> & {
  sizeOptions?: ReferenceSpeciesSizeOption[];
  sourceJson?: unknown;
  subspecies?: ReferenceSubspecies[];
  traits?: ReferenceSpeciesTrait[];
};

type ReferenceClassFeature = ClassFeatureDefinition & {
  index?: string;
  name?: string;
  description?: string | null;
  sourceJson?: unknown;
};

type ReferenceClassLevel = {
  id: string;
  classIndex: string;
  level: number;
  sourceJson?: unknown;
};

type ReferenceClassProficiencyGrant = {
  id: string;
  classIndex: string;
  proficiencyIndex: string;
  grantType: string;
  sourceLabel?: string | null;
  sourceJson?: unknown;
  proficiency?: {
    index: string;
    name: string;
    type: string;
  };
};

type ReferenceClassSkillChoiceOption = {
  id: string;
  choiceId: string;
  proficiencyIndex: string;
  skillIndex?: string | null;
  proficiency?: {
    index: string;
    name: string;
    type: string;
  };
  skill?: ReferenceSkill | null;
};

type ReferenceClassSkillChoice = {
  id: string;
  classIndex: string;
  chooseCount: number;
  description?: string | null;
  sourceJson?: unknown;
  options?: ReferenceClassSkillChoiceOption[];
};

type ReferenceClassPrimaryAbility = {
  id: string;
  classIndex: string;
  abilityScoreIndex: string;
  sourceJson?: unknown;
  abilityScore?: ReferenceAbilityScore;
};

type ReferenceClass = Omit<ClassDefinition, "features"> & {
  features?: ReferenceClassFeature[];
  levels?: ReferenceClassLevel[];
  proficiencyGrants?: ReferenceClassProficiencyGrant[];
  skillChoices?: ReferenceClassSkillChoice[];
  primaryAbilities?: ReferenceClassPrimaryAbility[];
  sourceJson?: unknown;
};

type ReferenceBackgroundProficiencyGrant = {
  id: string;
  backgroundIndex: string;
  proficiencyIndex: string;
  grantType: string;
  sourceLabel?: string | null;
  sourceJson?: unknown;
  proficiency?: {
    index: string;
    name: string;
    type: string;
  };
};

type ReferenceBackgroundAbilityOption = {
  id: string;
  backgroundIndex: string;
  abilityScoreIndex: string;
  bonusValue?: number | null;
  sourceJson?: unknown;
  abilityScore?: ReferenceAbilityScore;
};

type ReferenceBackgroundFeatGrant = {
  id: string;
  backgroundIndex: string;
  featIndex: string;
  sourceLabel?: string | null;
  sourceJson?: unknown;
};

type ReferenceBackground = BackgroundDefinition & {
  abilityOptions?: ReferenceBackgroundAbilityOption[];
  featGrants?: ReferenceBackgroundFeatGrant[];
  proficiencyGrants?: ReferenceBackgroundProficiencyGrant[];
  sourceJson?: unknown;
};

type ReferenceEquipment = {
  index: string;
  name: string;
  equipmentCategory?: string | null;
  itemType?: string | null;
  costQuantity?: number | null;
  costUnit?: string | null;
  weight?: number | null;
  description?: string | null;
  sourceJson?: unknown;
};

type ReferenceRuleDocument = {
  category: string;
  index: string;
  name?: string | null;
  sourceJson?: unknown;
};

type CharacterCreatorReferences = {
  species: ReferenceSpecies[];
  classes: ReferenceClass[];
  backgrounds: ReferenceBackground[];
  alignments: ReferenceAlignment[];
};

export type {
  CharacterCreatorReferences,
  ReferenceAbilityScore,
  ReferenceAlignment,
  ReferenceBackground,
  ReferenceBackgroundAbilityOption,
  ReferenceBackgroundFeatGrant,
  ReferenceBackgroundProficiencyGrant,
  ReferenceClass,
  ReferenceClassFeature,
  ReferenceClassLevel,
  ReferenceClassPrimaryAbility,
  ReferenceClassProficiencyGrant,
  ReferenceClassSkillChoice,
  ReferenceClassSkillChoiceOption,
  ReferenceCondition,
  ReferenceEquipment,
  ReferenceRuleDocument,
  ReferenceSkill,
  ReferenceSpecies,
  ReferenceSpeciesSizeOption,
  ReferenceSpeciesTrait,
  ReferenceSubspecies,
};
