import {
  findCharacterDerivedStateForUser,
} from "./character-effects.service.js";

type CharacterActionOverrides = {
  classIndex?: string;
  level?: number;
  speciesIndex?: string;
  subclassIndex?: string;
  subspeciesIndex?: string;
};

async function findCharacterActionsForUser(
  userId: string,
  characterId: string,
  overrides: CharacterActionOverrides = {},
) {
  const derivedState = await findCharacterDerivedStateForUser(userId, characterId, overrides);

  return derivedState?.actions ?? null;
}

export { findCharacterActionsForUser };
export type {
  ActionActivationType,
  CharacterActionEntry,
} from "./character-effects.service.js";
export type { CharacterActionOverrides };
