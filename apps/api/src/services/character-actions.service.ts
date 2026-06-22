import {
  findCharacterDerivedStateForUser,
} from "./character-effects.service.js";
import type { CharacterFeatureEffectsOverrides } from "./character-effects.service.js";

async function findCharacterActionsForUser(
  userId: string,
  characterId: string,
  overrides: CharacterFeatureEffectsOverrides = {},
) {
  const derivedState = await findCharacterDerivedStateForUser(userId, characterId, overrides);

  return derivedState?.actions ?? null;
}

export { findCharacterActionsForUser };
export type {
  ActionActivationType,
  CharacterActionEntry,
} from "./character-effects.service.js";
export type { CharacterFeatureEffectsOverrides as CharacterActionOverrides };
