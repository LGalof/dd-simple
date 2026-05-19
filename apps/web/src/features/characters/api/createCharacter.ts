import { api } from "../../../lib/api";
import type { Character, CharacterSavePayload } from "../../../types/character";

async function createCharacter(payload: CharacterSavePayload, token: string) {
  return api.post<Character>("/characters", payload, {
    token,
  });
}

export { createCharacter };
