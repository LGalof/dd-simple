type BuilderSelectionKind = "species" | "background" | "class";

type AbilityAssignment = {
  id: string;
  abilityIndex: string;
  score: number;
  dice: number[];
};

type HitPointSettings = {
  bonusHp: number;
  calculationMode: "fixed" | "rolled";
  overrideMaxHp: number | null;
  rolledHitPoints: number[];
};

type CharacterBuilderState = {
  speciesIndex: string;
  backgroundIndex: string;
  classIndex: string;
  level: number;
  currentHp: number;
  tempHp: number;
  abilityAssignments: AbilityAssignment[];
  hitPointSettings: HitPointSettings;
};

type SpeciesOption = {
  index: string;
  name: string;
  description: string;
  speed: number;
  traits: string[];
  creatureType: string;
  size: string;
  languages: string[];
  previewSections: SpeciesPreviewSection[];
};

type BackgroundOption = {
  index: string;
  name: string;
  description: string;
  proficiencies: string[];
  feature: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  previewSections: BackgroundPreviewSection[];
};

type FeatureChoiceOption = {
  value: string;
  label: string;
};

type FeatureChoiceSelections = Record<string, string>;

type FeatureChoiceField = {
  choiceGroupId?: string;
  choiceGroupLabel?: string;
  choiceGroupLimit?: number;
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

type ClassOverviewRow = {
  label: string;
  value: string;
};

type BackgroundPreviewSection = {
  id: string;
  title: string;
  subtitle: string;
  details: string[];
  choiceFields?: FeatureChoiceField[];
};

type SpeciesPreviewSection = {
  id: string;
  title: string;
  subtitle?: string;
  details: string[];
  choiceFields?: FeatureChoiceField[];
};

type ClassOption = {
  index: string;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: string;
  previewOverview: ClassOverviewRow[];
  savingThrows: string[];
  skillChoices: {
    choose: number;
    options: string[];
  };
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
  };
  startingEquipment: string[];
  features: ClassFeature[];
};

export type {
  AbilityAssignment,
  BackgroundOption,
  BackgroundPreviewSection,
  BuilderSelectionKind,
  CharacterBuilderState,
  ClassOverviewRow,
  ClassFeature,
  ClassOption,
  FeatureChoiceField,
  FeatureChoiceOption,
  FeatureChoiceSelections,
  HitPointSettings,
  SpeciesPreviewSection,
  SpeciesOption,
};
