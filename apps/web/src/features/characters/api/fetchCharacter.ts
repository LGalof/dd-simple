import { api } from "../../../lib/api";
import type { Character } from "../../../types/character";

async function fetchCharacter(characterId: string, token: string) {
  return api.get<Character>(`/characters/${characterId}`, {
    token,
  });
}

export { fetchCharacter };
