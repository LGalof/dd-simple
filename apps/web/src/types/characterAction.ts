type ActionActivationType = "attack" | "action" | "bonus_action" | "reaction" | "other";

type CharacterActionEntry = {
  activationType: ActionActivationType;
  description: string;
  id: string;
  level: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait";
  title: string;
};

export type { ActionActivationType, CharacterActionEntry };
