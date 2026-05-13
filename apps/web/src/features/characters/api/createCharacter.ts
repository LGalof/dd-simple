import { api } from "../../../lib/api";
import type { Character } from "../../../types/character";

type CreateCharacterPayload = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  alignment: string | null;
  skillIndexes: string[];
  abilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
};

async function createCharacter(payload: CreateCharacterPayload) {
  return api.post<Character, CreateCharacterPayload>("/characters", payload);
}

export { createCharacter };
export type { CreateCharacterPayload };
