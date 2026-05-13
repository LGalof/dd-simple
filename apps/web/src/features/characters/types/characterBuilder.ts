type BuilderSelectionKind = "species" | "background" | "class";

type AbilityAssignment = {
  id: string;
  abilityIndex: string;
  score: number;
  dice: number[];
};

type CharacterBuilderState = {
  speciesIndex: string;
  backgroundIndex: string;
  classIndex: string;
  level: number;
  abilityAssignments: AbilityAssignment[];
};

type SpeciesOption = {
  index: string;
  name: string;
  description: string;
  speed: number;
  traits: string[];
};

type BackgroundOption = {
  index: string;
  name: string;
  description: string;
  proficiencies: string[];
  feature: string;
};

type FeatureChoiceOption = {
  value: string;
  label: string;
};

type FeatureChoiceField = {
  id: string;
  label: string;
  options: FeatureChoiceOption[];
};

type ClassFeature = {
  id: string;
  level: number;
  title: string;
  summary: string;
  details?: string[];
  choiceFields?: FeatureChoiceField[];
};

type ClassOption = {
  index: string;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: string;
  features: ClassFeature[];
};

export type {
  AbilityAssignment,
  BackgroundOption,
  BuilderSelectionKind,
  CharacterBuilderState,
  ClassFeature,
  ClassOption,
  FeatureChoiceField,
  FeatureChoiceOption,
  SpeciesOption,
};
