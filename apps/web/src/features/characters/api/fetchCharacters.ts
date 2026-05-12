import { api } from "../../../lib/api";
import type { Character } from "../../../types/character";

async function fetchCharacters() {
  return api.get<Character[]>("/characters");
}

export { fetchCharacters };
