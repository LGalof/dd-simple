type ReferenceAbilityScore = {
  index: string;
  name: string;
  fullName: string;
  description?: string | null;
};

type ReferenceSkill = {
  index: string;
  abilityIndex: string;
  name: string;
  description?: string | null;
  ability: ReferenceAbilityScore;
};

type ReferenceSpecies = {
  index: string;
  name: string;
  size?: string | null;
  baseSpeed: number;
  description?: string | null;
};

type ReferenceClass = {
  index: string;
  name: string;
  hitDie: number;
};

type ReferenceBackground = {
  index: string;
  name: string;
  description?: string | null;
};

type ReferenceRuleDocument = {
  category: string;
  index: string;
  name?: string | null;
  sourceJson?: unknown;
};

type CharacterCreatorReferences = {
  abilityScores: ReferenceAbilityScore[];
  skills: ReferenceSkill[];
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
  ReferenceRuleDocument,
  ReferenceSkill,
  ReferenceSpecies,
};
