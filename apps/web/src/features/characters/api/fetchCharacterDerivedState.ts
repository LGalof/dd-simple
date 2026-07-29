import { api } from "../../../lib/api";
import type { CharacterDerivedState } from "../../../types/characterDerived";
import {
  buildCharacterPreviewQueryPath,
  type CharacterPreviewQuery,
} from "./characterPreviewQuery";

async function fetchCharacterDerivedState(
  characterId: string,
  token: string,
  query: CharacterPreviewQuery = {},
) {
  const hasBodyPreviewOverrides =
    Boolean(query.backgroundIndex) ||
    Boolean(query.abilityScores) ||
    Boolean(query.classIndex) ||
    Boolean(query.speciesIndex) ||
    Boolean(query.subspeciesIndex) ||
    Boolean(query.subclassIndex) ||
    typeof query.level === "number" ||
    Boolean(query.featIndexes?.length) ||
    Boolean(query.featureChoices?.length) ||
    Boolean(query.resourceState);

  if (hasBodyPreviewOverrides) {
    return api.post<CharacterDerivedState>(`/characters/${characterId}/derived`, query, {
      token,
    });
  }

  const path = buildCharacterPreviewQueryPath(`/characters/${characterId}/derived`, query);

  return api.get<CharacterDerivedState>(path, {
    token,
  });
}

export { fetchCharacterDerivedState };
export type { CharacterPreviewQuery as CharacterDerivedQuery };
