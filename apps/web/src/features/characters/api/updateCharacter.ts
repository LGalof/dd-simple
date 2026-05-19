import { api } from "../../../lib/api";
import type { Character, CharacterSavePayload } from "../../../types/character";

async function updateCharacter(
  characterId: string,
  payload: CharacterSavePayload,
  token: string,
) {
  return api.patch<Character>(`/characters/${characterId}`, payload, {
    token,
  });
}

export { updateCharacter };
