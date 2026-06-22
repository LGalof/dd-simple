import {
  findCharacterDerivedStateForUser,
} from "./character-effects.service.js";
import type { CharacterFeatureEffectsOverrides } from "./character-effects.service.js";

async function findCharacterDefensesForUser(
  userId: string,
  characterId: string,
  overrides: CharacterFeatureEffectsOverrides = {},
) {
  const derivedState = await findCharacterDerivedStateForUser(userId, characterId, overrides);

  return derivedState?.defenses ?? null;
}

export { findCharacterDefensesForUser };
export type {
  CharacterDefenseEntry,
  CharacterDefenseKind,
} from "./character-effects.service.js";
export type { CharacterFeatureEffectsOverrides as CharacterDefenseOverrides };
