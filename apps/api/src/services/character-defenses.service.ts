import {
  findCharacterDerivedStateForUser,
} from "./character-effects.service.js";

type CharacterDefenseOverrides = {
  classIndex?: string;
  level?: number;
  speciesIndex?: string;
  subclassIndex?: string;
  subspeciesIndex?: string;
};

async function findCharacterDefensesForUser(
  userId: string,
  characterId: string,
  overrides: CharacterDefenseOverrides = {},
) {
  const derivedState = await findCharacterDerivedStateForUser(userId, characterId, overrides);

  return derivedState?.defenses ?? null;
}

export { findCharacterDefensesForUser };
export type {
  CharacterDefenseEntry,
  CharacterDefenseKind,
} from "./character-effects.service.js";
export type { CharacterDefenseOverrides };
