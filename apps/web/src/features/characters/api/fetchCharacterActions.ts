import { api } from "../../../lib/api";
import type { CharacterActionEntry } from "../../../types/characterAction";

type CharacterActionQuery = {
  classIndex?: string;
  level?: number;
  subspeciesIndex?: string;
  speciesIndex?: string;
};

async function fetchCharacterActions(
  characterId: string,
  token: string,
  query: CharacterActionQuery = {},
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

  if (typeof query.level === "number") {
    params.set("level", String(query.level));
  }

  const path = params.size > 0
    ? `/characters/${characterId}/actions?${params.toString()}`
    : `/characters/${characterId}/actions`;

  return api.get<CharacterActionEntry[]>(path, {
    token,
  });
}

export { fetchCharacterActions };
export type { CharacterActionQuery };
