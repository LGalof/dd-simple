import { api } from "../../../lib/api";
import type { CharacterDefenseEntry } from "../../../types/characterDefense";

type CharacterDefenseQuery = {
  classIndex?: string;
  level?: number;
  subspeciesIndex?: string;
  subclassIndex?: string;
  speciesIndex?: string;
};

async function fetchCharacterDefenses(
  characterId: string,
  token: string,
  query: CharacterDefenseQuery = {},
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
    ? `/characters/${characterId}/defenses?${params.toString()}`
    : `/characters/${characterId}/defenses`;

  return api.get<CharacterDefenseEntry[]>(path, {
    token,
  });
}

export { fetchCharacterDefenses };
export type { CharacterDefenseQuery };
