import { api } from "../../../lib/api";
import type { CharacterDerivedState } from "../../../types/characterDerived";

type CharacterDerivedQuery = {
  classIndex?: string;
  level?: number;
  speciesIndex?: string;
  subclassIndex?: string;
  subspeciesIndex?: string;
};

async function fetchCharacterDerivedState(
  characterId: string,
  token: string,
  query: CharacterDerivedQuery = {},
) {
  const params = new URLSearchParams();

  if (query.classIndex) {
    params.set("classIndex", query.classIndex);
  }

  if (query.speciesIndex) {
    params.set("speciesIndex", query.speciesIndex);
  }

  if (query.subspeciesIndex) {
    params.set("subspeciesIndex", query.subspeciesIndex);
  }

  if (query.subclassIndex) {
    params.set("subclassIndex", query.subclassIndex);
  }

  if (typeof query.level === "number") {
    params.set("level", String(query.level));
  }

  const path = params.size > 0
    ? `/characters/${characterId}/derived?${params.toString()}`
    : `/characters/${characterId}/derived`;

  return api.get<CharacterDerivedState>(path, {
    token,
  });
}

export { fetchCharacterDerivedState };
export type { CharacterDerivedQuery };
