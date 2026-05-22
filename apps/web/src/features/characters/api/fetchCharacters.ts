import { api } from "../../../lib/api";
import type { Character } from "../../../types/character";

async function fetchCharacters(token: string) {
  return api.get<Character[]>("/characters", {
    token,
  });
}

export { fetchCharacters };
