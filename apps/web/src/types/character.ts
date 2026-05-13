type Ability = {
  index: string;
  name: string;
  fullName?: string;
};

type CharacterAbilityScoresInput = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

type CharacterSavePayload = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  alignment: string | null;
  skillIndexes: string[];
  abilityScores: CharacterAbilityScoresInput;
};

type AbilityScore = {
  abilityIndex: string;
  score: number;
  ability: Ability;
};

type CharacterSkill = {
  skillIndex: string;
  isProficient: boolean;
  customBonus: number;
  skill: {
    name: string;
    ability: Ability;
  };
};

type CharacterProficiency = {
  proficiencyIndex: string;
  sourceType: string | null;
  proficiency: {
    index: string;
    name: string;
    type: string;
  };
};

type InventoryItem = {
  id: string;
  quantity: number;
  equipped: boolean;
  equipment: {
    name: string;
  };
};

type DiceRoll = {
  id: string;
  rollType: string;
  formula: string;
  total: number;
  reason: string | null;
};

type Character = {
  id: string;
  createdAt: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  name: string;
  level: number;
  experiencePoints: number;
  alignment: string | null;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;
  species: {
    name: string;
  };
  class: {
    name: string;
  };
  background: {
    name: string;
  };
  abilityScores: AbilityScore[];
  skills: CharacterSkill[];
  proficiencies: CharacterProficiency[];
  inventory: InventoryItem[];
  diceRolls: DiceRoll[];
};

export type {
  AbilityScore,
  Character,
  CharacterAbilityScoresInput,
  CharacterProficiency,
  CharacterSavePayload,
  CharacterSkill,
  DiceRoll,
  InventoryItem,
};
