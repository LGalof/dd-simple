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

type CharacterCreatorReferences = {
  abilityScores: ReferenceAbilityScore[];
  skills: ReferenceSkill[];
  species: ReferenceSpecies[];
  classes: ReferenceClass[];
  backgrounds: ReferenceBackground[];
};

export type {
  CharacterCreatorReferences,
  ReferenceAbilityScore,
  ReferenceBackground,
  ReferenceClass,
  ReferenceSkill,
  ReferenceSpecies,
};