import { api } from "../../../lib/api";
import type { Character } from "../../../types/character";

async function fetchCharacter(characterId: string) {
  return api.get<Character>(`/characters/${characterId}`);
}

export { fetchCharacter };
