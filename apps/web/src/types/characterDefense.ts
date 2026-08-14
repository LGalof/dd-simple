type CharacterDefenseKind =
  | "condition_immunity"
  | "damage_reduction"
  | "immunity"
  | "resistance"
  | "saving_throw_advantage"
  | "vulnerability";

type CharacterDefenseEntry = {
  description: string;
  id: string;
  kind: CharacterDefenseKind;
  level: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait" | "subclass_feature" | "item";
  target: string;
  title: string;
};

export type { CharacterDefenseEntry, CharacterDefenseKind };
