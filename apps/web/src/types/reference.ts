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

type ReferenceSpecies = SpeciesDefinition & {
  sourceJson?: unknown;
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
};

type ReferenceClassSkillChoice = {
  id: string;
  classIndex: string;
  chooseCount: number;
  description?: string | null;
  sourceJson?: unknown;
  options?: ReferenceClassSkillChoiceOption[];
};

type ReferenceClass = Omit<ClassDefinition, "features"> & {
  features?: ReferenceClassFeature[];
  levels?: ReferenceClassLevel[];
  proficiencyGrants?: ReferenceClassProficiencyGrant[];
  skillChoices?: ReferenceClassSkillChoice[];
  sourceJson?: unknown;
};

type ReferenceBackground = BackgroundDefinition & {
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
  alignments: ReferenceRuleDocument[];
};

export type {
  CharacterCreatorReferences,
  ReferenceAbilityScore,
  ReferenceBackground,
  ReferenceClass,
  ReferenceClassFeature,
  ReferenceClassLevel,
  ReferenceClassProficiencyGrant,
  ReferenceClassSkillChoice,
  ReferenceClassSkillChoiceOption,
  ReferenceEquipment,
  ReferenceRuleDocument,
  ReferenceSkill,
  ReferenceSpecies,
};
