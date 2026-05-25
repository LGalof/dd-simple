import type {
  AbilityDefinition,
  BackgroundDefinition,
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

type ReferenceClass = ClassDefinition & {
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
  ReferenceEquipment,
  ReferenceRuleDocument,
  ReferenceSkill,
  ReferenceSpecies,
};
