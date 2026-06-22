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
  const path = buildCharacterPreviewQueryPath(`/characters/${characterId}/derived`, query);

  return api.get<CharacterDerivedState>(path, {
    token,
  });
}

export { fetchCharacterDerivedState };
export type { CharacterPreviewQuery as CharacterDerivedQuery };
