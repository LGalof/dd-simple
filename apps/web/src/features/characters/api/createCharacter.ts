import { api } from "../../../lib/api";
import type { Character } from "../../../types/character";

type CreateCharacterPayload = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  skillIndexes: string[];
};

async function createCharacter(payload: CreateCharacterPayload) {
  return api.post<Character, CreateCharacterPayload>("/characters", payload);
}

export { createCharacter };
export type { CreateCharacterPayload };
