import { api } from "../../../lib/api";
import type { Character, CharacterSavePayload } from "../../../types/character";

async function updateCharacter(characterId: string, payload: CharacterSavePayload) {
  return api.patch<Character, CharacterSavePayload>(`/characters/${characterId}`, payload);
}

export { updateCharacter };
