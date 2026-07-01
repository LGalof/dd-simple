import { api } from "../../../lib/api";
import type { Character, CharacterSavePayload } from "../../../types/character";

async function updateCharacter(
  characterId: string,
  payload: CharacterSavePayload,
  token: string,
  options: { keepalive?: boolean } = {},
) {
  return api.patch<Character>(`/characters/${characterId}`, payload, {
    keepalive: options.keepalive,
    token,
  });
}

export { updateCharacter };
