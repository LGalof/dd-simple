import { api } from "../../../lib/api";
import type { Character, CharacterSavePayload } from "../../../types/character";

async function createCharacter(payload: CharacterSavePayload) {
  return api.post<Character, CharacterSavePayload>("/characters", payload);
}

export { createCharacter };
