type CharacterDefenseKind =
  | "condition_immunity"
  | "immunity"
  | "resistance"
  | "vulnerability";

type CharacterDefenseEntry = {
  description: string;
  id: string;
  kind: CharacterDefenseKind;
  level: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait";
  target: string;
  title: string;
};

export type { CharacterDefenseEntry, CharacterDefenseKind };
