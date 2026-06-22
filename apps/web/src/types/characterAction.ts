type ActionActivationType = "attack" | "action" | "bonus_action" | "reaction" | "other";

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
  sourceType: "class_feature" | "species_trait" | "subclass_feature";
  title: string;
};

export type { ActionActivationType, CharacterActionCombatSummary, CharacterActionEntry };
